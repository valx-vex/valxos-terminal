# VALXOS CODEX BOOT PROMPT

You are implementing `VALXOS Terminal`.

Read order:
1. `01_VALXOS_CODEX_BOOTSTRAP.yaml`
2. `02_VALXOS_MASTER_SPEC.md`
3. `03_VALXOS_IMPLEMENTATION_BACKLOG.md`
4. `05_VALXOS_BUILD_MANIFEST.json`
5. `04_VALXOS_GAP_REGISTER.md`

Execution directives:
- treat uploaded research-derived contracts as source of truth
- preserve clean-room boundaries
- implement public surfaces, not proprietary hidden logic
- keep provider adapters thin and explicit
- keep dangerous operations outside LLM discretion
- prefer deterministic safety over magical automation
- write tests/fixtures before or alongside compatibility parsers
- do not wait for missing research lanes to begin safe MVP work

Immediate tasks:
1. create repo skeleton from master spec
2. write ADRs 001-008 from backlog
3. implement config-loader + tests
4. implement CLAUDE.md + skill parser + tests
5. implement permission-engine + tests
6. implement UMF core + provider adapter interfaces
7. implement stdio MCP host
8. implement state store + handover artifacts
9. implement fallback engine + budget policy
10. implement minimal TUI shell

Behavioral constraints:
- if exact Claude behavior is unverified, keep behavior behind a compatibility note/flag and write a fixture gap
- if a provider-specific feature materially improves workflows, expose it via escape hatch
- never silently weaken safety to improve demo smoothness
- keep module interfaces stable and internal types normalized

Definition of success:
- user can enter a Claude-configured repo
- VALXOS respects project context, skills, MCP config, and basic safety rules
- user can switch providers without losing task continuity
- system remains inspectable and bounded
