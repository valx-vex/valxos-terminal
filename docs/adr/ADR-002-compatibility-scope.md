# ADR-002: Compatibility Scope

- Status: Accepted
- Date: 2026-04-06

## Decision

VALXOS will target documented and observable Claude-style repo surfaces, not hidden Claude internals.

## Included

- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/settings.local.json`
- `.claude/skills/*/SKILL.md`
- `.claude/agents/*.md`
- `.mcp.json`
- `.claude-plugin/plugin.json`
- Claude-style hook manifests and lifecycle events

## Excluded

- marketplace internals
- hidden orchestration loops
- private backend contracts
- parity claims that cannot be validated from public behavior
