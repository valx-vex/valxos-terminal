# VALXOS User Test Drive

This repo now has a first local VALXOS lane you can run as a user without digging through internal debug commands.

## Quick Start

From the repo root:

```bash
cd /Users/valx/cathedral-prime/03-code/active/valxos-terminal
bun install
bun run valxos:doctor
bun run valxos:status
bun run valxos:catalog
bun run valxos:tui
```

## Expected Result

When `bun run valxos:tui` is healthy, you should see:

- an immediate `Launching VALXOS Terminal...` boot hint in the shell
- a short VALXOS boot splash instead of a blank black screen
- the TUI prompt
- the VALXOS home card with compatibility status for the current workspace

On macOS Terminal, VALXOS now uses a safer compatibility startup path. You should still land on
the same prompt and home card even if the terminal does not support the more aggressive Warp-style
renderer features.

When `bun run valxos:doctor` is healthy in this repo today, you should expect `Status: PARTIAL`.
That is currently honest because this repo has user-level Claude assets on this machine, but no
project-level `CLAUDE.md` or project `.claude` bundle in the repo root.

When `bun run valxos:status` is healthy in this repo today, you should expect the product phase to
read `Runtime Completion (partial)`. That means the compatibility bridge, doctor flow, overview,
and deeper backend catalog are real, while the final VALXOS-native shell and richer control-plane
actions still need to be built.

When `bun run valxos:catalog` is healthy, you should see a deeper inventory for:

- rules and persisted approvals
- agents and default-agent selection
- configured scripts and available commands
- skills, MCP, plugins, Claude assets, shares, and workspaces

## What `valxos:doctor` checks

- active `CLAUDE.md` instruction files
- `.claude/settings.json` and `.claude/settings.local.json`
- `.claude/skills/*/SKILL.md`
- `.claude/agents/*.md`
- `.mcp.json`
- `.claude-plugin/plugin.json`
- Claude-style hook manifests
- effective native-versus-Claude precedence

## Test In Another Repo

Point VALXOS at any Claude-configured project:

```bash
bun run valxos -- /absolute/path/to/project
```

Run the doctor against that repo first if you want a compatibility readout:

```bash
bun run valxos -- doctor /absolute/path/to/project
```

You can inspect the newer backend control surfaces too:

```bash
bun run valxos -- status /absolute/path/to/project
bun run valxos -- catalog /absolute/path/to/project
```

## Current Scope

This is now beyond the first compatibility wedge, but still not the final product. The runtime
compatibility bridge is live, the doctor flow is live, the overview and catalog backend surfaces
are live, and the TUI launch path is branded for VALXOS. Large parts of the underlying UI still
retain upstream `opencode` structure and will need a later VALXOS-native redesign.
