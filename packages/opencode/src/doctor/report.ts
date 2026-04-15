import path from "path"
import { Config } from "@/config/config"
import { ConfigPaths } from "@/config/paths"
import type { ClaudeCompatDiagnostic, ClaudeCompatState } from "@/compat/claude"
import { Flag } from "@/flag/flag"
import { Global } from "@/global"
import { Instance } from "@/project/instance"
import { Instruction } from "@/session/instruction"
import { Skill } from "@/skill"
import { Glob } from "@/util/glob"
import { Filesystem } from "@/util/filesystem"
import { Brand } from "@/brand"

export namespace DoctorReport {
  type Scope = "user" | "project" | "local"
  type SkillScope = "user" | "project"

  export type Report = {
    brand: {
      cliName: string
      productName: string
    }
    workspace: {
      directory: string
      worktree: string
    }
    status: {
      level: "ready" | "partial" | "empty"
      summary: string
    }
    native: {
      configDirectories: string[]
      configFiles: string[]
      effectiveAgentCount: number
      effectiveMcpCount: number
    }
    instructions: {
      active: string[]
      claude: {
        user?: string
        project?: string
      }
    }
    claude: {
      settings: Array<{
        scope: Scope
        path: string
      }>
      skills: {
        user: string[]
        project: string[]
      }
      agents: Array<{
        scope: "user" | "project"
        path: string
      }>
      mcp: Array<{
        name: string
        path: string
        root?: string
      }>
      plugins: ClaudeCompatState["manifests"]
      hooks: ClaudeCompatState["provenance"]["hooks"]
      diagnostics: ClaudeCompatDiagnostic[]
    }
    precedence: string[]
    testCommands: string[]
  }

  async function existing(paths: string[]) {
    const result = await Promise.all(paths.map(async (file) => ((await Filesystem.exists(file)) ? file : undefined)))
    return result.filter((item): item is string => Boolean(item))
  }

  async function scanClaudeSkills(root: string) {
    return (
      await Glob.scan("skills/**/SKILL.md", {
        cwd: path.join(root, ".claude"),
        absolute: true,
        dot: true,
        symlink: true,
      }).catch(() => [])
    ).toSorted()
  }

  function classifyClaudeInstructions(paths: string[], worktree: string) {
    const result: Report["instructions"]["claude"] = {}

    for (const item of paths) {
      if (path.basename(item) !== "CLAUDE.md") continue
      if (item === path.join(Global.Path.home, ".claude", "CLAUDE.md")) {
        result.user = item
        continue
      }
      if (Filesystem.contains(worktree, item)) {
        result.project = item
      }
    }

    return result
  }

  async function nativeConfigFiles(directory: string, worktree: string, configDirs: string[]) {
    const result = new Set<string>()

    for (const item of await existing([
      path.join(Global.Path.config, "config.json"),
      path.join(Global.Path.config, "opencode.json"),
      path.join(Global.Path.config, "opencode.jsonc"),
    ])) {
      result.add(item)
    }

    if (!Flag.OPENCODE_DISABLE_PROJECT_CONFIG) {
      for (const item of await ConfigPaths.projectFiles("opencode", directory, worktree)) {
        result.add(item)
      }
    }

    for (const dir of configDirs) {
      for (const item of await existing([path.join(dir, "opencode.json"), path.join(dir, "opencode.jsonc")])) {
        result.add(item)
      }
    }

    return Array.from(result).toSorted()
  }

  function summarizeStatus(input: {
    claude: Report["claude"]
    instructions: Report["instructions"]["claude"]
  }): Report["status"] {
    const projectSignals =
      Boolean(input.instructions.project) ||
      input.claude.settings.some((item) => item.scope !== "user") ||
      input.claude.skills.project.length > 0 ||
      input.claude.agents.some((item) => item.scope === "project") ||
      input.claude.plugins.some((item) => !item.path.startsWith(path.join(Global.Path.home, ".claude"))) ||
      input.claude.mcp.some((item) => !item.path.startsWith(path.join(Global.Path.home, ".claude")))

    const userSignals =
      Boolean(input.instructions.user) ||
      input.claude.settings.some((item) => item.scope === "user") ||
      input.claude.skills.user.length > 0 ||
      input.claude.agents.some((item) => item.scope === "user") ||
      input.claude.plugins.length > 0 ||
      input.claude.mcp.length > 0

    if (projectSignals) {
      return {
        level: "ready",
        summary: "Project Claude-compatible assets were detected and are now wired into the live VALXOS runtime.",
      }
    }

    if (userSignals || input.claude.diagnostics.length > 0) {
      return {
        level: "partial",
        summary: "Some Claude-compatible surfaces were detected, but this workspace is only partially configured.",
      }
    }

    return {
      level: "empty",
      summary: "No Claude-compatible project surfaces were detected in this workspace yet.",
    }
  }

  function groupHooks(hooks: Report["claude"]["hooks"]) {
    const counts = new Map<string, number>()
    for (const hook of hooks) {
      counts.set(hook.event, (counts.get(hook.event) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([event, count]) => `${event} x${count}`)
  }

  function preview(list: string[], limit = 4) {
    if (list.length <= limit) return list
    return [...list.slice(0, limit), `... +${list.length - limit} more`]
  }

  export async function build(): Promise<Report> {
    const directory = Instance.directory
    const worktree = Instance.worktree
    const projectRoot = worktree === "/" ? directory : worktree
    const config = await Config.get()
    const configDirs = await Config.directories()
    const instructionPaths = Array.from(await Instruction.systemPaths()).toSorted()
    const claudeState = config.claude

    const claudeSkills = {
      user: await scanClaudeSkills(Global.Path.home),
      project: await scanClaudeSkills(projectRoot),
    }

    const claude = {
      settings: claudeState?.provenance.settings ?? [],
      skills: claudeSkills,
      agents: claudeState?.provenance.agents ?? [],
      mcp: (claudeState?.provenance.mcp ?? []).map((item) => ({
        name: item.name,
        path: item.path,
        root: item.root,
      })),
      plugins: claudeState?.manifests ?? [],
      hooks: claudeState?.provenance.hooks ?? [],
      diagnostics: claudeState?.provenance.diagnostics ?? [],
    } satisfies Report["claude"]

    const report: Report = {
      brand: {
        cliName: Brand.cliName(),
        productName: Brand.productName(),
      },
      workspace: {
        directory,
        worktree: projectRoot,
      },
      status: summarizeStatus({
        claude,
        instructions: classifyClaudeInstructions(instructionPaths, projectRoot),
      }),
      native: {
        configDirectories: configDirs.toSorted(),
        configFiles: await nativeConfigFiles(directory, projectRoot, configDirs),
        effectiveAgentCount: Object.keys(config.agent ?? {}).length,
        effectiveMcpCount: Object.keys(config.mcp ?? {}).length,
      },
      instructions: {
        active: instructionPaths,
        claude: classifyClaudeInstructions(instructionPaths, projectRoot),
      },
      claude,
      precedence: [
        "Native opencode and .opencode config remains authoritative over Claude-derived fallback config.",
        "Inside the Claude lane, settings.local overrides project settings, which override user settings.",
        "Existing CLAUDE.md and .claude/skills ingestion stays additive rather than replacing native VALXOS behavior.",
      ],
      testCommands: [
        "bun run valxos:doctor",
        "bun run valxos:tui",
        `bun run valxos -- ${JSON.stringify(projectRoot)}`,
      ],
    }

    return report
  }

  export function format(report: Report) {
    const hookSummary = groupHooks(report.claude.hooks)
    const settings =
      report.claude.settings.length > 0
        ? report.claude.settings.map((item) => `${item.scope}:${item.path}`)
        : ["none"]
    const diagnostics =
      report.claude.diagnostics.length > 0
        ? report.claude.diagnostics.map((item) => `${item.path}: ${item.message}`)
        : ["none"]

    return [
      `${report.brand.productName} Doctor`,
      `Status: ${report.status.level.toUpperCase()}`,
      `Summary: ${report.status.summary}`,
      "",
      "Workspace",
      `- directory: ${report.workspace.directory}`,
      `- worktree: ${report.workspace.worktree}`,
      "",
      "Claude Compatibility",
      `- active project CLAUDE.md: ${report.instructions.claude.project ?? "none"}`,
      `- active user CLAUDE.md: ${report.instructions.claude.user ?? "none"}`,
      ...preview(settings).map((item) => `- settings: ${item}`),
      `- skills: project ${report.claude.skills.project.length}, user ${report.claude.skills.user.length}`,
      `- agents: ${report.claude.agents.length}`,
      `- mcp servers discovered: ${report.claude.mcp.length}`,
      `- plugin manifests: ${report.claude.plugins.length}`,
      `- hooks: ${hookSummary.length ? hookSummary.join(", ") : "none"}`,
      "",
      "Native Runtime",
      `- config directories: ${report.native.configDirectories.length}`,
      ...preview(report.native.configFiles).map((item) => `- config file: ${item}`),
      `- effective agents: ${report.native.effectiveAgentCount}`,
      `- effective MCP servers: ${report.native.effectiveMcpCount}`,
      "",
      "Precedence",
      ...report.precedence.map((item) => `- ${item}`),
      "",
      "Diagnostics",
      ...preview(diagnostics, 6).map((item) => `- ${item}`),
      "",
      "Ready To Test",
      ...report.testCommands.map((item) => `- ${item}`),
    ].join("\n")
  }
}
