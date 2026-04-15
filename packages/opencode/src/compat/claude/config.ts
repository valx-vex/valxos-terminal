import fs from "fs/promises"
import path from "path"
import z from "zod"
import { ConfigPaths } from "@/config/paths"
import { Glob } from "@/util/glob"

const SUPPORTED_EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PermissionRequest",
  "Stop",
  "SessionEnd",
] as const

const HookCommand = z
  .object({
    type: z.literal("command").optional(),
    command: z.string(),
    timeout: z.number().int().positive().optional(),
  })
  .passthrough()

const HookMatcher = z
  .object({
    matcher: z.string().optional(),
    hooks: z.array(HookCommand),
  })
  .passthrough()

const HookContainer = z.record(z.string(), z.array(HookMatcher))

const PluginManifest = z
  .object({
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough()

const McpEntry = z
  .object({
    command: z.union([z.string(), z.array(z.string())]).optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string(), z.string()).optional(),
    environment: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    url: z.string().optional(),
    enabled: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
  })
  .passthrough()

const McpEntries = z.record(z.string(), McpEntry)

const ClaudeSettings = z
  .object({
    hooks: HookContainer.optional(),
    mcpServers: McpEntries.optional(),
    mcp_servers: McpEntries.optional(),
  })
  .passthrough()

export type ClaudeHookEventName = (typeof SUPPORTED_EVENTS)[number]

export type ClaudeHookDefinition = {
  event: ClaudeHookEventName
  matcher?: string
  command: string
  timeout?: number
  source: string
  root?: string
}

export type ClaudePluginManifest = {
  root: string
  path: string
  name: string
  version?: string
  description?: string
}

export type ClaudeCompatDiagnostic = {
  path: string
  message: string
}

export type ClaudeCompatConfig = {
  mcp?: Record<string, unknown>
}

export type ClaudeCompatProvenance = {
  settings: Array<{
    scope: "user" | "project" | "local"
    path: string
  }>
  mcp: Array<{
    name: string
    path: string
    root?: string
  }>
  plugins: ClaudePluginManifest[]
  agents: Array<{
    scope: "user" | "project"
    path: string
  }>
  hooks: Array<{
    event: ClaudeHookEventName
    path: string
    root?: string
    matcher?: string
  }>
  diagnostics: ClaudeCompatDiagnostic[]
}

export type ClaudeCompatState = {
  hooks: ClaudeHookDefinition[]
  manifests: ClaudePluginManifest[]
  provenance: ClaudeCompatProvenance
}

export type ClaudeCompatDiscovery = {
  config: ClaudeCompatConfig
  agentFiles: string[]
  state?: ClaudeCompatState
}

function emptyProvenance(): ClaudeCompatProvenance {
  return {
    settings: [],
    mcp: [],
    plugins: [],
    agents: [],
    hooks: [],
    diagnostics: [],
  }
}

function isSupportedEvent(value: string): value is ClaudeHookEventName {
  return (SUPPORTED_EVENTS as readonly string[]).includes(value)
}

async function parseJsoncFile(file: string) {
  const text = await ConfigPaths.readFile(file)
  if (!text) return
  return ConfigPaths.parseText(text, file)
}

function pushDiagnostic(provenance: ClaudeCompatProvenance, file: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  provenance.diagnostics.push({ path: file, message })
}

function mergeMcp(
  target: Record<string, unknown>,
  raw: Record<string, z.infer<typeof McpEntry>>,
  source: string,
  provenance: ClaudeCompatProvenance,
  root?: string,
) {
  for (const [name, entry] of Object.entries(raw)) {
    const normalized = normalizeMcpEntry(entry)
    if (!normalized) {
      provenance.diagnostics.push({
        path: source,
        message: `Ignoring unsupported MCP entry "${name}"`,
      })
      continue
    }
    target[name] = normalized
    provenance.mcp.push({ name, path: source, root })
  }
}

function normalizeMcpEntry(entry: z.infer<typeof McpEntry>) {
  if (entry.url) {
    return {
      type: "remote",
      url: entry.url,
      ...(entry.enabled !== undefined && { enabled: entry.enabled }),
      ...(entry.headers && { headers: entry.headers }),
      ...(entry.timeout !== undefined && { timeout: entry.timeout }),
    }
  }

  const env = entry.environment ?? entry.env
  const rawCommand = entry.command
  const command =
    typeof rawCommand === "string"
      ? [rawCommand, ...(entry.args ?? [])]
      : Array.isArray(rawCommand)
        ? rawCommand
        : undefined

  if (!command?.length) return

  return {
    type: "local",
    command,
    ...(entry.enabled !== undefined && { enabled: entry.enabled }),
    ...(env && { environment: env }),
    ...(entry.timeout !== undefined && { timeout: entry.timeout }),
  }
}

function normalizeHooks(
  source: string,
  hooks: Record<string, z.infer<typeof HookMatcher>[]>,
  provenance: ClaudeCompatProvenance,
  root?: string,
) {
  const result: ClaudeHookDefinition[] = []

  for (const [event, matchers] of Object.entries(hooks)) {
    if (!isSupportedEvent(event)) {
      provenance.diagnostics.push({
        path: source,
        message: `Ignoring unsupported Claude hook event "${event}"`,
      })
      continue
    }

    for (const match of matchers) {
      for (const hook of match.hooks) {
        if ((hook.type ?? "command") !== "command") {
          provenance.diagnostics.push({
            path: source,
            message: `Ignoring unsupported hook type "${String(hook.type)}" for ${event}`,
          })
          continue
        }

        provenance.hooks.push({
          event,
          path: source,
          root,
          matcher: match.matcher,
        })
        result.push({
          event,
          matcher: match.matcher,
          command: hook.command,
          timeout: hook.timeout,
          source,
          root,
        })
      }
    }
  }

  return result
}

async function settingsPathCandidates(root: string, base: string) {
  return [path.join(root, `${base}.json`), path.join(root, `${base}.jsonc`)]
}

async function firstExisting(paths: string[]) {
  for (const file of paths) {
    try {
      await fs.access(file)
      return file
    } catch {}
  }
}

async function discoverPluginManifestRoots(root: string) {
  const manifests: Array<{ root: string; path: string }> = []
  const rootManifest = path.join(root, ".claude-plugin", "plugin.json")

  try {
    await fs.access(rootManifest)
    manifests.push({ root, path: rootManifest })
  } catch {}

  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(root, entry.name, ".claude-plugin", "plugin.json")
    try {
      await fs.access(manifestPath)
      manifests.push({ root: path.join(root, entry.name), path: manifestPath })
    } catch {}
  }

  return manifests
}

export async function discoverClaudeCompat(input: {
  directory: string
  worktree: string
  homeDir: string
}): Promise<ClaudeCompatDiscovery> {
  const root = input.worktree && input.worktree !== "/" ? input.worktree : input.directory
  const provenance = emptyProvenance()
  const mcp: Record<string, unknown> = {}
  const hooks: ClaudeHookDefinition[] = []
  const manifests: ClaudePluginManifest[] = []
  const agentFiles: string[] = []

  const settingsSources = [
    {
      scope: "user" as const,
      root: path.join(input.homeDir, ".claude"),
      base: "settings",
    },
    {
      scope: "project" as const,
      root: path.join(root, ".claude"),
      base: "settings",
    },
    {
      scope: "local" as const,
      root: path.join(root, ".claude"),
      base: "settings.local",
    },
  ]

  for (const settings of settingsSources) {
    const file = await firstExisting(await settingsPathCandidates(settings.root, settings.base))
    if (!file) continue

    provenance.settings.push({ scope: settings.scope, path: file })

    try {
      const parsed = ClaudeSettings.parse(await parseJsoncFile(file))
      const rawMcp = parsed.mcpServers ?? parsed.mcp_servers
      if (rawMcp) mergeMcp(mcp, rawMcp, file, provenance)
      if (parsed.hooks) hooks.push(...normalizeHooks(file, parsed.hooks, provenance))
    } catch (error) {
      pushDiagnostic(provenance, file, error)
    }
  }

  const rootMcp = path.join(root, ".mcp.json")
  try {
    const parsed = McpEntries.parse(await parseJsoncFile(rootMcp))
    mergeMcp(mcp, parsed, rootMcp, provenance, root)
  } catch (error) {
    if (!(error instanceof ConfigPaths.JsonError) && !(error instanceof ConfigPaths.InvalidError)) {
      // Ignore missing file errors silently.
      if (await ConfigPaths.readFile(rootMcp)) pushDiagnostic(provenance, rootMcp, error)
    } else if (await ConfigPaths.readFile(rootMcp)) {
      pushDiagnostic(provenance, rootMcp, error)
    }
  }

  const pluginRoots = await discoverPluginManifestRoots(root)
  for (const entry of pluginRoots) {
    try {
      const manifest = PluginManifest.parse(await parseJsoncFile(entry.path))
      const item: ClaudePluginManifest = {
        root: entry.root,
        path: entry.path,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
      }
      manifests.push(item)
      provenance.plugins.push(item)
    } catch (error) {
      pushDiagnostic(provenance, entry.path, error)
      continue
    }

    const hooksPath = path.join(entry.root, "hooks", "hooks.json")
    try {
      const raw = await parseJsoncFile(hooksPath)
      if (raw) {
        const parsed = z.object({ hooks: HookContainer }).passthrough().parse(raw)
        hooks.push(...normalizeHooks(hooksPath, parsed.hooks, provenance, entry.root))
      }
    } catch (error) {
      if (await ConfigPaths.readFile(hooksPath)) pushDiagnostic(provenance, hooksPath, error)
    }

    const pluginMcpPath = path.join(entry.root, ".mcp.json")
    try {
      const parsed = McpEntries.parse(await parseJsoncFile(pluginMcpPath))
      mergeMcp(mcp, parsed, pluginMcpPath, provenance, entry.root)
    } catch (error) {
      if (await ConfigPaths.readFile(pluginMcpPath)) pushDiagnostic(provenance, pluginMcpPath, error)
    }
  }

  const agentSources = [
    {
      scope: "user" as const,
      root: path.join(input.homeDir, ".claude"),
    },
    {
      scope: "project" as const,
      root: path.join(root, ".claude"),
    },
  ]

  for (const source of agentSources) {
    const files = await Glob.scan("agents/**/*.md", {
      cwd: source.root,
      absolute: true,
      dot: true,
      symlink: true,
    }).catch(() => [])

    for (const file of files.sort()) {
      provenance.agents.push({ scope: source.scope, path: file })
      agentFiles.push(file)
    }
  }

  const hasConfig = Object.keys(mcp).length > 0
  const hasState =
    hooks.length > 0 ||
    manifests.length > 0 ||
    provenance.settings.length > 0 ||
    provenance.mcp.length > 0 ||
    provenance.agents.length > 0 ||
    provenance.diagnostics.length > 0

  return {
    config: hasConfig ? { mcp } : {},
    agentFiles,
    state: hasState
      ? {
          hooks,
          manifests,
          provenance,
        }
      : undefined,
  }
}
