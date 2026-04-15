# Codex Next Steps

You are continuing from a starter scaffold.

## Non-negotiable constraints
- preserve clean-room interface compatibility only
- do not copy proprietary internals
- prioritize MVP wedge: `.claude` config surfaces + UMF-ish routing + stdio MCP + basic permissions + skill lazy loading

## Build order
1. real provider adapters
2. real config precedence tests
3. hook discovery + execution manager
4. MCP client framing and diagnostics
5. TUI shell with blocks, logs, diff review, and permission prompts
6. transcript persistence + handover artifacts

## Acceptable early shortcuts
- manual routing UI
- stubbed tool schema discovery for MCP
- read-only mode first for unfamiliar repos

## Avoid
- giant abstractions
- trying to clone Claude internal compaction logic
- premature plugin marketplace
- cloud dependency in the control plane
