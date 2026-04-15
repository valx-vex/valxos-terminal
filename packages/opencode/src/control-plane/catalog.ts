import { EOL } from "os"
import z from "zod"
import { Agent } from "@/agent/agent"
import { Brand } from "@/brand"
import { Config } from "@/config/config"
import { Workspace } from "@/control-plane/workspace"
import type { ClaudeHookEventName, ClaudePluginManifest } from "@/compat/claude/config"
import { Permission } from "@/permission"
import { Instance } from "@/project/instance"
import { Project } from "@/project/project"
import { Session } from "@/session"
import { PermissionTable, SessionTable } from "@/session/session.sql"
import { Database, and, count, desc, eq, isNotNull } from "@/storage/db"
import { Skill } from "@/skill"

const Rule = z
  .object({
    permission: z.string(),
    pattern: z.string(),
    action: Permission.Action,
  })
  .meta({ ref: "ValxosCatalogRule" })

const AgentProfile = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    mode: z.enum(["subagent", "primary", "all"]),
    native: z.boolean(),
    hidden: z.boolean(),
    color: z.string().optional(),
    model: z.string().optional(),
    steps: z.number().int().positive().optional(),
    permission: z.object({
      total: z.number(),
      allow: z.number(),
      ask: z.number(),
      deny: z.number(),
    }),
  })
  .meta({ ref: "ValxosCatalogAgentProfile" })

const ScriptSummary = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    agent: z.string().optional(),
    model: z.string().optional(),
    subtask: z.boolean(),
  })
  .meta({ ref: "ValxosCatalogScript" })

const CommandSummary = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    source: z.enum(["command", "mcp", "skill"]),
    agent: z.string().optional(),
    model: z.string().optional(),
    subtask: z.boolean(),
    hints: z.array(z.string()),
  })
  .meta({ ref: "ValxosCatalogCommand" })

const SkillSummary = z
  .object({
    name: z.string(),
    description: z.string(),
    location: z.string(),
  })
  .meta({ ref: "ValxosCatalogSkill" })

const McpSummary = z
  .object({
    name: z.string(),
    type: z.string().nullable(),
    enabled: z.boolean(),
  })
  .meta({ ref: "ValxosCatalogMcp" })

const ClaudeSettingSummary = z
  .object({
    scope: z.enum(["user", "project", "local"]),
    path: z.string(),
  })
  .meta({ ref: "ValxosCatalogClaudeSetting" })

const ClaudeAgentSummary = z
  .object({
    scope: z.enum(["user", "project"]),
    path: z.string(),
  })
  .meta({ ref: "ValxosCatalogClaudeAgent" })

const ClaudeHookSummary = z
  .object({
    event: z.custom<ClaudeHookEventName>(),
    path: z.string(),
    root: z.string().optional(),
    matcher: z.string().optional(),
  })
  .meta({ ref: "ValxosCatalogClaudeHook" })

const ClaudePluginSummary = z
  .object({
    root: z.string(),
    path: z.string(),
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
  })
  .meta({ ref: "ValxosCatalogClaudePlugin" })

const DiagnosticSummary = z
  .object({
    path: z.string(),
    message: z.string(),
  })
  .meta({ ref: "ValxosCatalogDiagnostic" })

const PluginSummary = z
  .object({
    specifier: z.string(),
    scope: z.enum(["global", "local"]),
    source: z.string(),
  })
  .meta({ ref: "ValxosCatalogPlugin" })

const ShareSummary = z
  .object({
    sessionID: z.string(),
    title: z.string(),
    url: z.string(),
    updated: z.number(),
  })
  .meta({ ref: "ValxosCatalogShare" })

const Catalog = z
  .object({
    brand: z.object({
      cliName: z.string(),
      productName: z.string(),
    }),
    workspace: z.object({
      directory: z.string(),
      worktree: z.string(),
      project: Project.Info,
    }),
    rules: z.object({
      configured: z.array(Rule),
      persistedApprovals: z.array(Rule),
    }),
    agents: z.object({
      defaultAgent: z.string(),
      items: z.array(AgentProfile),
    }),
    scripts: z.object({
      configured: z.array(ScriptSummary),
    }),
    commands: z.object({
      available: z.array(CommandSummary),
      totals: z.object({
        command: z.number(),
        mcp: z.number(),
        skill: z.number(),
      }),
      warnings: z.array(z.string()),
    }),
    skills: z.object({
      directories: z.array(z.string()),
      items: z.array(SkillSummary),
    }),
    mcp: z.object({
      effective: z.array(McpSummary),
      claudeCompat: z.array(
        z.object({
          name: z.string(),
          path: z.string(),
          root: z.string().optional(),
        }),
      ),
    }),
    plugins: z.object({
      configured: z.array(PluginSummary),
      claudeCompat: z.array(ClaudePluginSummary),
    }),
    claude: z.object({
      settings: z.array(ClaudeSettingSummary),
      agents: z.array(ClaudeAgentSummary),
      hooks: z.array(ClaudeHookSummary),
      diagnostics: z.array(DiagnosticSummary),
    }),
    shares: z.object({
      mode: z.enum(["manual", "auto", "disabled"]).nullable(),
      sharedSessions: z.number(),
      recent: z.array(ShareSummary),
    }),
    workspaces: z.object({
      count: z.number(),
      items: z.array(Workspace.Info),
    }),
  })
  .meta({ ref: "ValxosCatalog" })

export namespace ValxosCatalog {
  export const Report = Catalog
  export type Report = z.infer<typeof Catalog>

  function preview(list: string[], limit = 4) {
    if (list.length <= limit) return list
    return [...list.slice(0, limit), `... +${list.length - limit} more`]
  }

  function summarizePermissionRules(rules: Permission.Ruleset) {
    return rules.reduce(
      (acc, rule) => {
        acc.total += 1
        acc[rule.action] += 1
        return acc
      },
      {
        total: 0,
        allow: 0,
        ask: 0,
        deny: 0,
      },
    )
  }

  function summarizeScripts(config: Awaited<ReturnType<typeof Config.get>>) {
    return Object.entries(config.command ?? {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, command]) => ({
        name,
        description: command.description,
        agent: command.agent,
        model: command.model,
        subtask: command.subtask === true,
      }))
  }

  function summarizeCommands(config: Awaited<ReturnType<typeof Config.get>>, skills: Awaited<ReturnType<typeof Skill.all>>) {
    const totals = {
      command: 0,
      mcp: 0,
      skill: 0,
    }

    const builtins: Report["commands"]["available"] = [
      {
        name: "init",
        description: "guided AGENTS.md setup",
        source: "command",
        subtask: false,
        hints: [],
      },
      {
        name: "review",
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        source: "command",
        subtask: true,
        hints: [],
      },
    ]

    const configured = summarizeScripts(config).map((script) => ({
      ...script,
      source: "command" as const,
      hints: [],
    }))

    const skillCommands = summarizeSkills(skills).map((skill) => ({
      name: skill.name,
      description: skill.description,
      source: "skill" as const,
      subtask: false,
      hints: [],
    }))

    const available = [...builtins, ...configured, ...skillCommands]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((command) => {
        totals[command.source] += 1
        return command
      })

    return {
      available,
      totals,
      warnings:
        Object.keys(config.mcp ?? {}).length > 0
          ? [
              "Live MCP prompt commands are not expanded in the catalog yet; this inventory shows built-in, configured, and skill-derived commands only.",
            ]
          : [],
    }
  }

  function summarizeAgents(list: Awaited<ReturnType<typeof Agent.list>>) {
    return [...list].map((agent) => ({
      name: agent.name,
      description: agent.description,
      mode: agent.mode,
      native: agent.native === true,
      hidden: agent.hidden === true,
      color: agent.color,
      model: agent.model ? `${agent.model.providerID}/${agent.model.modelID}` : undefined,
      steps: agent.steps,
      permission: summarizePermissionRules(agent.permission),
    }))
  }

  function summarizeSkills(list: Awaited<ReturnType<typeof Skill.all>>) {
    return [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((skill) => ({
        name: skill.name,
        description: skill.description,
        location: skill.location,
      }))
  }

  function summarizeEffectiveMcp(config: Awaited<ReturnType<typeof Config.get>>) {
    return Object.entries(config.mcp ?? {})
      .flatMap(([name, entry]) => {
        if (typeof entry !== "object" || entry === null) return []
        const type = "type" in entry && typeof entry.type === "string" ? entry.type : null
        const enabled = "enabled" in entry ? entry.enabled !== false : true
        return [{ name, type, enabled }]
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  function summarizeConfiguredPlugins(config: Awaited<ReturnType<typeof Config.get>>) {
    return [...(config.plugin_origins ?? [])]
      .sort((a, b) => {
        const left = `${a.scope}:${a.source}:${Config.pluginSpecifier(a.spec)}`
        const right = `${b.scope}:${b.source}:${Config.pluginSpecifier(b.spec)}`
        return left.localeCompare(right)
      })
      .map((plugin) => ({
        specifier: Config.pluginSpecifier(plugin.spec),
        scope: plugin.scope,
        source: plugin.source,
      }))
  }

  function summarizeShares() {
    const sharedSessions =
      Database.use((db) =>
        db
          .select({ value: count() })
          .from(SessionTable)
          .where(and(eq(SessionTable.project_id, Instance.project.id), isNotNull(SessionTable.share_url)))
          .get(),
      )?.value ?? 0

    const recent = Database.use((db) =>
      db
        .select()
        .from(SessionTable)
        .where(and(eq(SessionTable.project_id, Instance.project.id), isNotNull(SessionTable.share_url)))
        .orderBy(desc(SessionTable.time_updated))
        .limit(5)
        .all(),
    ).map((row) => ({
      sessionID: row.id,
      title: row.title,
      url: row.share_url!,
      updated: row.time_updated,
    }))

    return {
      sharedSessions: Number(sharedSessions),
      recent,
    }
  }

  export async function build(): Promise<Report> {
    const [config, agents, defaultAgent, skills, skillDirs] = await Promise.all([
      Config.get(),
      Agent.list(),
      Agent.defaultAgent(),
      Skill.all(),
      Skill.dirs(),
    ])

    const workspaces = Workspace.list(Instance.project)
    const persistedApprovals =
      Database.use((db) => db.select().from(PermissionTable).where(eq(PermissionTable.project_id, Instance.project.id)).get())
        ?.data ?? []

    const claude = config.claude

    return {
      brand: {
        cliName: Brand.cliName(),
        productName: Brand.productName(),
      },
      workspace: {
        directory: Instance.directory,
        worktree: Instance.worktree,
        project: Instance.project,
      },
      rules: {
        configured: Permission.fromConfig(config.permission ?? {}),
        persistedApprovals,
      },
      agents: {
        defaultAgent,
        items: summarizeAgents(agents),
      },
      scripts: {
        configured: summarizeScripts(config),
      },
      commands: summarizeCommands(config, skills),
      skills: {
        directories: [...skillDirs].sort((a, b) => a.localeCompare(b)),
        items: summarizeSkills(skills),
      },
      mcp: {
        effective: summarizeEffectiveMcp(config),
        claudeCompat: [...(claude?.provenance.mcp ?? [])].sort((a, b) => {
          const left = `${a.name}:${a.path}:${a.root ?? ""}`
          const right = `${b.name}:${b.path}:${b.root ?? ""}`
          return left.localeCompare(right)
        }),
      },
      plugins: {
        configured: summarizeConfiguredPlugins(config),
        claudeCompat: [...(claude?.manifests ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
      },
      claude: {
        settings: [...(claude?.provenance.settings ?? [])].sort((a, b) => a.path.localeCompare(b.path)),
        agents: [...(claude?.provenance.agents ?? [])].sort((a, b) => a.path.localeCompare(b.path)),
        hooks: [...(claude?.provenance.hooks ?? [])].sort((a, b) => {
          const left = `${a.event}:${a.path}:${a.matcher ?? ""}`
          const right = `${b.event}:${b.path}:${b.matcher ?? ""}`
          return left.localeCompare(right)
        }),
        diagnostics: [...(claude?.provenance.diagnostics ?? [])].sort((a, b) => a.path.localeCompare(b.path)),
      },
      shares: {
        mode: config.share ?? null,
        ...summarizeShares(),
      },
      workspaces: {
        count: workspaces.length,
        items: workspaces,
      },
    }
  }

  export function format(report: Report) {
    const lines = [
      `${report.brand.productName} Catalog`,
      "State: Structured inventory for the current VALXOS runtime so the future control surface can target real primitives.",
      "",
      "Workspace",
      `- directory: ${report.workspace.directory}`,
      `- worktree: ${report.workspace.worktree}`,
      `- project id: ${report.workspace.project.id}`,
      "",
      "Rules",
      `- configured rules: ${report.rules.configured.length}`,
      `- persisted approvals: ${report.rules.persistedApprovals.length}`,
      ...preview(
        report.rules.configured.map((rule) => `${rule.permission}:${rule.pattern} -> ${rule.action}`),
      ).map((line) => `- ${line}`),
      "",
      "Agents",
      `- default agent: ${report.agents.defaultAgent}`,
      `- total: ${report.agents.items.length}`,
      ...preview(
        report.agents.items.map(
          (agent) =>
            `${agent.name} (${agent.mode}, ${agent.native ? "native" : "configured"}, rules ${agent.permission.total})`,
        ),
      ).map((line) => `- ${line}`),
      "",
      "Scripts",
      `- configured: ${report.scripts.configured.length}`,
      ...preview(
        report.scripts.configured.map((script) => `${script.name}${script.agent ? ` -> ${script.agent}` : ""}`),
      ).map((line) => `- ${line}`),
      "",
      "Commands",
      `- available: ${report.commands.available.length}`,
      `- sources: command ${report.commands.totals.command}, mcp ${report.commands.totals.mcp}, skill ${report.commands.totals.skill}`,
      ...report.commands.warnings.map((warning) => `- warning: ${warning}`),
      ...preview(
        report.commands.available.map((command) => `${command.name} (${command.source})`),
      ).map((line) => `- ${line}`),
      "",
      "Skills",
      `- total: ${report.skills.items.length}`,
      `- directories: ${report.skills.directories.length}`,
      ...preview(report.skills.items.map((skill) => `${skill.name} @ ${skill.location}`)).map((line) => `- ${line}`),
      "",
      "MCP",
      `- effective: ${report.mcp.effective.length}`,
      `- Claude compat imports: ${report.mcp.claudeCompat.length}`,
      ...preview(
        report.mcp.effective.map((mcp) => `${mcp.name} (${mcp.type ?? "unknown"}, ${mcp.enabled ? "enabled" : "disabled"})`),
      ).map((line) => `- ${line}`),
      "",
      "Plugins",
      `- configured: ${report.plugins.configured.length}`,
      `- Claude compat manifests: ${report.plugins.claudeCompat.length}`,
      ...preview(report.plugins.configured.map((plugin) => `${plugin.specifier} (${plugin.scope})`)).map((line) => `- ${line}`),
      "",
      "Claude Assets",
      `- settings: ${report.claude.settings.length}`,
      `- agents: ${report.claude.agents.length}`,
      `- hooks: ${report.claude.hooks.length}`,
      `- diagnostics: ${report.claude.diagnostics.length}`,
      ...preview(
        report.claude.hooks.map((hook) => `${hook.event} @ ${hook.path}`),
      ).map((line) => `- ${line}`),
      "",
      "Shares",
      `- mode: ${report.shares.mode ?? "unset"}`,
      `- shared sessions: ${report.shares.sharedSessions}`,
      ...preview(report.shares.recent.map((share) => `${share.title} -> ${share.url}`)).map((line) => `- ${line}`),
      "",
      "Workspaces",
      `- total: ${report.workspaces.count}`,
      ...preview(
        report.workspaces.items.map((workspace) => `${workspace.id} (${workspace.type})`),
      ).map((line) => `- ${line}`),
    ]

    return lines.join(EOL)
  }
}
