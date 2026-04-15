# VALXOS Implementation Sequence

## Phase 1: Consolidate

- Adopt `packages/opencode` as the runtime home for compatibility work.
- Keep `packages/plugin`, `packages/legion`, and `packages/desktop` in their current roles.
- Freeze any Rust-first rewrite impulse for this tranche.

## Phase 2: Compatibility Foundation

- formalize `CLAUDE.md` and `.claude/skills` as supported surfaces
- ingest `.claude/settings*` as fallback config only
- ingest root and plugin `.mcp.json`
- discover `.claude/agents/*.md`
- discover `.claude-plugin/plugin.json`
- dispatch Claude-style hooks internally

Status: implemented for the first wedge in `packages/opencode/src/compat/claude`.

## Phase 3: Observability

- expose Claude-derived provenance on the in-memory config object
- keep malformed Claude inputs diagnostic-only
- expand targeted tests around compatibility merges and hook execution

Status: partially implemented through config provenance and compat tests.

## Phase 4: MVP Runtime Completion

- complete deterministic permission coverage across all Claude hook paths
- finish MCP bridging into the existing runtime service
- harden agent and instruction ingestion with more fixtures
- add user-facing config inspection for source provenance

## Phase 5: Multi-Model Product Layer

- stabilize provider routing via `packages/legion`
- surface desktop workflows in `packages/desktop`
- add product-level command surfaces once the runtime lane is stable
