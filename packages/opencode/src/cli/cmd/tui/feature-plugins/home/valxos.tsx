import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo, createResource, Match, Show, Switch } from "solid-js"
import path from "path"
import { Brand } from "@/brand"
import { discoverClaudeCompat } from "@/compat/claude"
import { Global } from "@/global"
import { Filesystem } from "@/util/filesystem"
import { Glob } from "@/util/glob"

const id = "internal:home-valxos"

type CompatSnapshot = {
  directory: string
  worktree: string
  branch?: string
  status: "ready" | "partial" | "empty"
  summary: string
  projectClaude: boolean
  userClaude: boolean
  projectSkills: number
  userSkills: number
  projectAgents: number
  userAgents: number
  projectMcp: number
  userMcp: number
  projectPlugins: number
  userPlugins: number
  diagnostics: number
}

async function skillCount(root: string) {
  return (
    await Glob.scan("skills/**/SKILL.md", {
      cwd: path.join(root, ".claude"),
      absolute: true,
      dot: true,
      symlink: true,
    }).catch(() => [])
  ).length
}

async function exists(file: string) {
  return Filesystem.exists(file)
}

async function load(api: TuiPluginApi): Promise<CompatSnapshot> {
  const directory = api.state.path.directory || process.cwd()
  const worktree = api.state.path.worktree && api.state.path.worktree !== "/" ? api.state.path.worktree : directory
  const state = await discoverClaudeCompat({
    directory,
    worktree,
    homeDir: Global.Path.home,
  }).then((result) => result.state)

  const projectClaude = await exists(path.join(worktree, "CLAUDE.md"))
  const userClaude = await exists(path.join(Global.Path.home, ".claude", "CLAUDE.md"))
  const projectSkills = await skillCount(worktree)
  const userSkills = await skillCount(Global.Path.home)
  const projectAgents = (state?.provenance.agents ?? []).filter((item) => item.scope === "project").length
  const userAgents = (state?.provenance.agents ?? []).filter((item) => item.scope === "user").length
  const homeClaudeRoot = path.join(Global.Path.home, ".claude")
  const projectMcp = (state?.provenance.mcp ?? []).filter((item) => !item.path.startsWith(homeClaudeRoot)).length
  const userMcp = (state?.provenance.mcp ?? []).filter((item) => item.path.startsWith(homeClaudeRoot)).length
  const projectPlugins = (state?.manifests ?? []).filter((item) => !item.path.startsWith(homeClaudeRoot)).length
  const userPlugins = (state?.manifests ?? []).filter((item) => item.path.startsWith(homeClaudeRoot)).length
  const diagnostics = state?.provenance.diagnostics.length ?? 0

  const projectSignals =
    projectClaude || projectSkills > 0 || projectAgents > 0 || projectMcp > 0 || projectPlugins > 0
  const userSignals = userClaude || userSkills > 0 || userAgents > 0 || userMcp > 0 || userPlugins > 0

  const status = projectSignals ? "ready" : userSignals || diagnostics > 0 ? "partial" : "empty"
  const summary =
    status === "ready"
      ? "Project compatibility assets detected. This workspace is ready for a migration-grade VALXOS test."
      : status === "partial"
        ? "User-level Claude assets are present, but this workspace still needs project-level VALXOS inputs."
        : "No Claude-compatible assets detected here yet. Add project instructions or settings to exercise the bridge."

  return {
    directory,
    worktree,
    branch: api.state.vcs?.branch,
    status,
    summary,
    projectClaude,
    userClaude,
    projectSkills,
    userSkills,
    projectAgents,
    userAgents,
    projectMcp,
    userMcp,
    projectPlugins,
    userPlugins,
    diagnostics,
  }
}

function statusColor(api: TuiPluginApi, status: CompatSnapshot["status"]) {
  const theme = api.theme.current
  if (status === "ready") return theme.success
  if (status === "partial") return theme.warning
  return theme.textMuted
}

function compactPath(input: string) {
  return input.replace(Global.Path.home, "~")
}

function Card(props: { api: TuiPluginApi; snapshot: CompatSnapshot; detailed?: boolean }) {
  const theme = () => props.api.theme.current

  return (
    <box
      width="100%"
      maxWidth={props.detailed ? 80 : 75}
      backgroundColor={theme().backgroundElement}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="column"
      gap={1}
    >
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme().text}>
          <b>{Brand.productName()}</b>
        </text>
        <text fg={statusColor(props.api, props.snapshot.status)}>
          <b>{props.snapshot.status.toUpperCase()}</b>
        </text>
      </box>

      <text fg={theme().textMuted} wrapMode="word">
        {props.snapshot.summary}
      </text>

      <box flexDirection="row" gap={2} flexWrap="wrap">
        <text fg={theme().text}>
          project <span style={{ fg: props.snapshot.projectClaude ? theme().success : theme().textMuted }}>CLAUDE</span>
        </text>
        <text fg={theme().text}>
          skills <b>{props.snapshot.projectSkills}</b>/<span style={{ fg: theme().textMuted }}>{props.snapshot.userSkills}</span>
        </text>
        <text fg={theme().text}>
          agents <b>{props.snapshot.projectAgents}</b>/<span style={{ fg: theme().textMuted }}>{props.snapshot.userAgents}</span>
        </text>
        <text fg={theme().text}>
          mcp <b>{props.snapshot.projectMcp}</b>/<span style={{ fg: theme().textMuted }}>{props.snapshot.userMcp}</span>
        </text>
        <text fg={theme().text}>
          plugins <b>{props.snapshot.projectPlugins}</b>/<span style={{ fg: theme().textMuted }}>{props.snapshot.userPlugins}</span>
        </text>
      </box>

      <text fg={theme().textMuted} wrapMode="word">
        workspace {compactPath(props.snapshot.worktree)}
        {props.snapshot.branch ? `:${props.snapshot.branch}` : ""}
      </text>

      <Show when={props.snapshot.diagnostics > 0}>
        <text fg={theme().warning}>
          diagnostics <b>{props.snapshot.diagnostics}</b>
        </text>
      </Show>

      <Show when={props.detailed}>
        <box flexDirection="column">
          <text fg={theme().textMuted}>Quick actions</text>
          <text fg={theme().text}>/status for live MCP and runtime status</text>
          <text fg={theme().text}>
            <span style={{ fg: theme().textMuted }}>shell </span>
            bun run valxos:doctor
          </text>
          <text fg={theme().text}>
            <span style={{ fg: theme().textMuted }}>shell </span>
            bun run valxos:tui
          </text>
        </box>
      </Show>
    </box>
  )
}

function Dialog(props: { api: TuiPluginApi; snapshot: CompatSnapshot }) {
  const theme = () => props.api.theme.current

  return (
    <box paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme().text}>
          <b>{Brand.productName()} Compatibility</b>
        </text>
        <text fg={theme().textMuted} onMouseUp={() => props.api.ui.dialog.clear()}>
          esc
        </text>
      </box>
      <Card api={props.api} snapshot={props.snapshot} detailed />
    </box>
  )
}

function View(props: { api: TuiPluginApi }) {
  const [snapshot] = createResource(
    () => [props.api.state.path.directory || process.cwd(), props.api.state.path.worktree || ""].join("|"),
    () => load(props.api),
  )
  const value = createMemo(() => snapshot())
  const first = createMemo(() => props.api.state.session.count() === 0)

  return (
    <Show when={Brand.isValxos() && first()}>
      <box width="100%" maxWidth={75} paddingTop={2} flexShrink={0}>
        <Switch>
          <Match when={snapshot.loading}>
            <box backgroundColor={props.api.theme.current.backgroundElement} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
              <text fg={props.api.theme.current.textMuted}>Loading VALXOS compatibility snapshot...</text>
            </box>
          </Match>
          <Match when={value()}>
            {(data) => (
              <box onMouseUp={() => props.api.ui.dialog.replace(() => <Dialog api={props.api} snapshot={data()} />)}>
                <Card api={props.api} snapshot={data()} />
              </box>
            )}
          </Match>
        </Switch>
      </box>
    </Show>
  )
}

function show(api: TuiPluginApi) {
  load(api)
    .then((snapshot) => {
      api.ui.dialog.replace(() => <Dialog api={api} snapshot={snapshot} />)
      api.ui.dialog.setSize("large")
    })
    .catch((error) => {
      api.ui.toast({
        variant: "error",
        title: "VALXOS compatibility failed",
        message: error instanceof Error ? error.message : String(error),
      })
    })
}

const tui: TuiPlugin = async (api) => {
  if (!Brand.isValxos()) return

  api.command.register(() => [
    {
      title: "VALXOS Compatibility",
      value: "valxos.compatibility",
      slash: {
        name: "doctor",
      },
      category: "System",
      onSelect() {
        show(api)
      },
    },
  ])

  api.slots.register({
    order: 50,
    slots: {
      home_bottom() {
        return <View api={api} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
