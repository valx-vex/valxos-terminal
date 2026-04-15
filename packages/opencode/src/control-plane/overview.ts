import { EOL } from "os"
import z from "zod"
import { Brand } from "@/brand"
import { Config } from "@/config/config"
import { DoctorReport } from "@/doctor/report"
import { Workspace } from "@/control-plane/workspace"
import { Instance } from "@/project/instance"
import { Project } from "@/project/project"
import { Vcs } from "@/project/vcs"
import { Provider } from "@/provider/provider"
import { Session } from "@/session"
import { SessionTable } from "@/session/session.sql"
import { Database, and, count, eq, isNotNull, isNull } from "@/storage/db"

const PhaseStatus = z.enum(["done", "partial", "pending"])

const Phase = z
  .object({
    id: z.string(),
    label: z.string(),
    status: PhaseStatus,
    summary: z.string(),
  })
  .meta({ ref: "ValxosOverviewPhase" })

const ProviderSummary = z
  .object({
    id: z.string(),
    name: z.string(),
    source: z.enum(["env", "config", "custom", "api"]),
    modelCount: z.number(),
  })
  .meta({ ref: "ValxosOverviewProvider" })

const McpSummary = z
  .object({
    name: z.string(),
    type: z.string().nullable(),
    enabled: z.boolean(),
  })
  .meta({ ref: "ValxosOverviewMcp" })

const SessionSummary = z
  .object({
    id: z.string(),
    title: z.string(),
    directory: z.string(),
    workspaceID: z.string().optional(),
    updated: z.number(),
    archived: z.boolean(),
  })
  .meta({ ref: "ValxosOverviewSession" })

const Overview = z
  .object({
    brand: z.object({
      cliName: z.string(),
      productName: z.string(),
    }),
    workspace: z.object({
      directory: z.string(),
      worktree: z.string(),
      project: Project.Info,
      branch: z.string().nullable(),
    }),
    product: z.object({
      summary: z.string(),
      currentPhase: Phase,
      phases: z.array(Phase),
    }),
    ui: z.object({
      status: z.enum(["borrowed_shell", "valxos_native"]),
      summary: z.string(),
    }),
    compatibility: z.object({
      level: z.enum(["ready", "partial", "empty"]),
      summary: z.string(),
      instructions: z.object({
        project: z.string().optional(),
        user: z.string().optional(),
      }),
      counts: z.object({
        claudeSettings: z.number(),
        projectSkills: z.number(),
        userSkills: z.number(),
        claudeAgents: z.number(),
        claudePlugins: z.number(),
        claudeHooks: z.number(),
        diagnostics: z.number(),
      }),
    }),
    providers: z.object({
      connected: z.array(ProviderSummary),
      defaultModel: z
        .object({
          providerID: z.string(),
          modelID: z.string(),
        })
        .optional(),
    }),
    mcp: z.object({
      configured: z.array(McpSummary),
      effectiveCount: z.number(),
    }),
    sessions: z.object({
      total: z.number(),
      roots: z.number(),
      archived: z.number(),
      recent: z.array(SessionSummary),
    }),
    workspaces: z.object({
      count: z.number(),
      items: z.array(Workspace.Info),
    }),
    recommendations: z.array(z.string()),
  })
  .meta({ ref: "ValxosOverview" })

export namespace ValxosOverview {
  export const Report = Overview
  export type Report = z.infer<typeof Overview>

  const phases = [
    {
      id: "consolidate",
      label: "Consolidate",
      status: "done",
      summary: "Canonical repo direction, ADRs, and transplant plans are in place.",
    },
    {
      id: "compatibility_foundation",
      label: "Compatibility Foundation",
      status: "done",
      summary: "Claude-style public file surfaces are wired into the live runtime as clean-room compatibility.",
    },
    {
      id: "observability",
      label: "Observability",
      status: "done",
      summary: "Doctor output, overview reporting, and the deeper control-plane catalog now expose the runtime state cleanly.",
    },
    {
      id: "runtime_completion",
      label: "Runtime Completion",
      status: "partial",
      summary: "The runtime surfaces are mapped, but rules, scripts, MCP actions, and deeper permission hardening still need completion.",
    },
    {
      id: "product_layer",
      label: "Product Layer",
      status: "pending",
      summary: "The future VALXOS-native UX and control-center shell are not built yet.",
    },
  ] satisfies Array<z.infer<typeof Phase>>

  function preview(list: string[], limit = 4) {
    if (list.length <= limit) return list
    return [...list.slice(0, limit), `... +${list.length - limit} more`]
  }

  function currentPhase() {
    return phases.find((phase) => phase.status !== "done") ?? phases[phases.length - 1]
  }

  function summarizeMcp(config: Awaited<ReturnType<typeof Config.get>>) {
    const configured = Object.entries(config.mcp ?? {})
      .flatMap(([name, entry]) => {
        if (typeof entry !== "object" || entry === null || !("type" in entry)) return []
        const mcp = entry as { type?: unknown; enabled?: boolean }
        return [
          {
            name,
            type: typeof mcp.type === "string" ? mcp.type : null,
            enabled: mcp.enabled !== false,
          },
        ]
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      configured,
      effectiveCount: configured.filter((item) => item.enabled).length,
    }
  }

  function summarizeSessions() {
    const total =
      Database.use((db) =>
        db
          .select({ value: count() })
          .from(SessionTable)
          .where(eq(SessionTable.project_id, Instance.project.id))
          .get(),
      )?.value ?? 0

    const roots =
      Database.use((db) =>
        db
          .select({ value: count() })
          .from(SessionTable)
          .where(and(eq(SessionTable.project_id, Instance.project.id), isNull(SessionTable.parent_id)))
          .get(),
      )?.value ?? 0

    const archived =
      Database.use((db) =>
        db
          .select({ value: count() })
          .from(SessionTable)
          .where(and(eq(SessionTable.project_id, Instance.project.id), isNotNull(SessionTable.time_archived)))
          .get(),
      )?.value ?? 0

    const recent = Array.from(Session.list({ roots: true, limit: 5 })).map((session) => ({
      id: session.id,
      title: session.title,
      directory: session.directory,
      workspaceID: session.workspaceID,
      updated: session.time.updated,
      archived: Boolean(session.time.archived),
    }))

    return {
      total: Number(total),
      roots: Number(roots),
      archived: Number(archived),
      recent,
    }
  }

  function buildRecommendations(report: Omit<Report, "recommendations">) {
    const recommendations = [
      "Design the next VALXOS shell around workspace, model routing, rules, scripts, MCP, agents, sessions, and artifacts instead of a chat-first home screen.",
      "Turn the new catalog surfaces into executable control-plane actions for rules, scripts, providers, MCP, and artifacts.",
      "Complete the runtime tranche by hardening permission coverage, MCP bridge behavior, and deeper compatibility fixtures.",
      "Keep opencode as the engine layer, but treat the current TUI as a temporary shell rather than the final product form.",
    ]

    if (report.compatibility.counts.diagnostics > 0) {
      recommendations.unshift("Clean up malformed Claude-compatible agent files so migration health is easier to read.")
    }

    if (report.providers.connected.length === 0) {
      recommendations.unshift("Connect at least one provider so the multi-model thesis is exercised inside the live runtime.")
    }

    return recommendations
  }

  export async function build(): Promise<Report> {
    const [doctor, config, providers, workspaces, branch] = await Promise.all([
      DoctorReport.build(),
      Config.get(),
      Provider.list(),
      Promise.resolve(Workspace.list(Instance.project)),
      Vcs.branch().catch(() => null),
    ])

    const defaultModel = await Provider.defaultModel().catch(() => undefined)

    const reportWithoutRecommendations = {
      brand: {
        cliName: Brand.cliName(),
        productName: Brand.productName(),
      },
      workspace: {
        directory: Instance.directory,
        worktree: Instance.worktree,
        project: Instance.project,
        branch: branch ?? null,
      },
      product: {
        summary:
          "The runtime foundation is real and strategically correct, but the outer product shell is still borrowed from opencode and should be replaced by a VALXOS-native control surface.",
        currentPhase: currentPhase(),
        phases,
      },
      ui: {
        status: "borrowed_shell" as const,
        summary:
          "The current interface is good enough to exercise the runtime, but it is still opencode-shaped and does not yet express the VALXOS control-center thesis.",
      },
      compatibility: {
        level: doctor.status.level,
        summary: doctor.status.summary,
        instructions: doctor.instructions.claude,
        counts: {
          claudeSettings: doctor.claude.settings.length,
          projectSkills: doctor.claude.skills.project.length,
          userSkills: doctor.claude.skills.user.length,
          claudeAgents: doctor.claude.agents.length,
          claudePlugins: doctor.claude.plugins.length,
          claudeHooks: doctor.claude.hooks.length,
          diagnostics: doctor.claude.diagnostics.length,
        },
      },
      providers: {
        connected: Object.values(providers)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((provider) => ({
            id: provider.id,
            name: provider.name,
            source: provider.source,
            modelCount: Object.keys(provider.models).length,
          })),
        defaultModel,
      },
      mcp: summarizeMcp(config),
      sessions: summarizeSessions(),
      workspaces: {
        count: workspaces.length,
        items: workspaces,
      },
    } satisfies Omit<Report, "recommendations">

    return {
      ...reportWithoutRecommendations,
      recommendations: buildRecommendations(reportWithoutRecommendations),
    }
  }

  export function format(report: Report) {
    const lines = [
      `${report.brand.productName} Overview`,
      `State: ${report.product.summary}`,
      "",
      "Workspace",
      `- directory: ${report.workspace.directory}`,
      `- worktree: ${report.workspace.worktree}`,
      `- project id: ${report.workspace.project.id}`,
      `- vcs branch: ${report.workspace.branch ?? "none"}`,
      "",
      "Product Position",
      `- current phase: ${report.product.currentPhase.label} (${report.product.currentPhase.status})`,
      `- ui shell: ${report.ui.status === "borrowed_shell" ? "borrowed shell" : "VALXOS native"}`,
      ...report.product.phases.map((phase) => `- ${phase.label}: ${phase.status}`),
      "",
      "Compatibility",
      `- level: ${report.compatibility.level.toUpperCase()}`,
      `- summary: ${report.compatibility.summary}`,
      `- Claude settings: ${report.compatibility.counts.claudeSettings}`,
      `- Claude skills: project ${report.compatibility.counts.projectSkills}, user ${report.compatibility.counts.userSkills}`,
      `- Claude agents: ${report.compatibility.counts.claudeAgents}`,
      `- Claude plugins: ${report.compatibility.counts.claudePlugins}`,
      `- Claude hooks: ${report.compatibility.counts.claudeHooks}`,
      `- diagnostics: ${report.compatibility.counts.diagnostics}`,
      "",
      "Providers",
      `- connected: ${report.providers.connected.length}`,
      `- default model: ${report.providers.defaultModel ? `${report.providers.defaultModel.providerID}/${report.providers.defaultModel.modelID}` : "none"}`,
      ...preview(
        report.providers.connected.map(
          (provider) => `${provider.id} (${provider.source}, ${provider.modelCount} models)`,
        ),
      ).map((line) => `- ${line}`),
      "",
      "MCP",
      `- configured: ${report.mcp.configured.length}`,
      `- enabled: ${report.mcp.effectiveCount}`,
      ...preview(
        report.mcp.configured.map((item) => `${item.name} (${item.type ?? "unknown"}, ${item.enabled ? "enabled" : "disabled"})`),
      ).map((line) => `- ${line}`),
      "",
      "Sessions",
      `- total: ${report.sessions.total}`,
      `- roots: ${report.sessions.roots}`,
      `- archived: ${report.sessions.archived}`,
      ...preview(report.sessions.recent.map((session) => `${session.title} @ ${session.directory}`)).map((line) => `- ${line}`),
      "",
      "Next Build Focus",
      ...report.recommendations.map((item) => `- ${item}`),
    ]

    return lines.join(EOL)
  }
}
