# VALXOS Canonical Synthesis

## Canonical Product Shape

VALXOS Terminal lives in `/Users/valx/cathedral-prime/03-code/active/valxos-terminal`.

Its near-term identity is:

- a TypeScript/Bun-first AI terminal
- a provider-agnostic runtime for Claude, OpenAI/Codex, Gemini, and Ollama
- a migration-grade compatibility target for documented Claude Code repo surfaces
- a future desktop control center, but not a Warp clone in the first tranche

## Canonical Package Roles

- `packages/opencode`: runtime core, session loop, config, permissions, hooks, MCP integration, compat ingestion
- `packages/plugin`: generic plugin SDK and execution surface
- `packages/legion`: provider bridge and multi-model routing substrate
- `packages/desktop`: desktop shell and presentation layer
- `packages/extensions`: extension-facing code only, not the home for runtime compatibility logic

## Confirmed Direction

- TypeScript-first is the correct implementation lane.
- Rust remains optional for a later TUI or performance subsystem, not the phase-1 center of gravity.
- Claude compatibility must stay clean-room and file-surface based.
- The GPT starter pack is a selective donor, not a replacement tree.
- Gemini research remains useful as architecture pressure, not as a rewrite order.

## MVP Compatibility Boundary

The current MVP boundary is limited to public, observable Claude-style surfaces:

- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/settings.local.json`
- `.claude/skills/*/SKILL.md`
- `.claude/agents/*.md`
- `.mcp.json`
- `.claude-plugin/plugin.json`
- Claude-style hook manifests and event semantics

## Landed Wedge

The first implementation wedge now lives inside `packages/opencode`:

- internal Claude compatibility discovery under `src/compat/claude`
- Claude fallback config ingestion for `.claude/settings*` and `.mcp.json`
- `.claude/agents` discovery
- `.claude-plugin/plugin.json` discovery
- internal Claude hook dispatch for session, tool, and permission lifecycle events

Native `opencode` config remains authoritative over Claude-derived fallback state.
