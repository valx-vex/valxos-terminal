# VALXOS IMPLEMENTATION BACKLOG
Audience: Codex executor  
Mode: task graph + acceptance criteria  

Legend:
- Priority: P0 critical, P1 near-term, P2 later
- Evidence: DIRECT = in uploaded research, SYNTH = synthesized here
- DOD = definition of done

---

## P0-001 Config Loader + Precedence Engine
Priority: P0  
Evidence: DIRECT  
Depends on: none

Build:
- parse `~/.claude/settings.json`
- parse `.claude/settings.json`
- parse `.claude/settings.local.json`
- parse `.mcp.json`
- support future `.valxos/settings.json`
- implement precedence: managed > cli > local > project > user
- implement merge semantics with test coverage

DOD:
- fixture suite covers conflicting scalar/object/array cases
- effective config is inspectable via debug command
- incompatible/invalid JSON fails gracefully

Acceptance tests:
- local overrides project
- project overrides user
- CLI flags override all mutable scopes
- malformed lower-scope config does not corrupt higher scopes

---

## P0-002 CLAUDE.md + Skill Ingestion
Priority: P0  
Evidence: DIRECT  
Depends on: P0-001

Build:
- read `CLAUDE.md`
- parse `.claude/skills/*/SKILL.md`
- parse YAML frontmatter fields
- expose only `name` + `description` in initial context
- lazy inject body on explicit or high-confidence invocation

DOD:
- token accounting/logging proves lazy loading
- invalid frontmatter yields visible diagnostic, not crash
- skill registry available to UI and orchestrator

Acceptance tests:
- 5000-word skill not loaded initially
- invoking skill loads full body
- missing `name` or `description` rejected with clear reason

---

## P0-003 Permission Engine
Priority: P0  
Evidence: DIRECT  
Depends on: P0-001

Build:
- support `deny -> ask -> allow`
- support wildcard/pattern forms for tools
- implement deny lists for sensitive paths
- expose permission result and source scope

DOD:
- permission evaluation deterministic and testable
- denied actions never reach execution layer
- ask mode prompts user in TUI

Acceptance tests:
- `Bash(rm *)` denied before execution
- sensitive paths always blocked unless explicit reviewed policy path exists
- `Read(*)` allowed while `Edit(secret/**)` denied

---

## P0-004 Hook Dispatcher
Priority: P0.5 (can start after permission engine, but full release hard blocker)  
Evidence: DIRECT  
Depends on: P0-003

Build:
- event bus for `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`
- stdin JSON payload contract
- exit code handling
- safe parse of optional stdout JSON
- fail-safe behavior on invalid hook output

DOD:
- hooks can block via exit 2
- stderr visible to agent/user
- invalid JSON does not crash session

Acceptance tests:
- PreToolUse hard block on destructive bash
- PostToolUse formatting hook modifies result metadata as expected
- invalid hook stdout falls back safely

---

## P0-005 MCP Host (stdio first)
Priority: P0  
Evidence: DIRECT  
Depends on: P0-001

Build:
- read MCP server config from settings
- spawn stdio servers
- enumerate tools/resources/prompts
- lazy tool discovery/search
- per-server trust/enable state

DOD:
- can connect to at least one known-good stdio MCP fixture
- lazy load prevents full context blowup
- server failures isolated, not fatal to session

Acceptance tests:
- valid stdio server boots and tool list available
- hung server times out cleanly
- disabled server never starts

---

## P0-006 Provider Adapter Layer + UMF
Priority: P0  
Evidence: DIRECT + SYNTH  
Depends on: none

Build:
- internal canonical request/response schema
- adapters for Anthropic, OpenAI/Codex, Gemini, Ollama
- tool schema normalization
- structured response/error normalization
- adapter-level capability flags

DOD:
- same internal request can route to each provider via adapter
- provider-specific features discoverable through capability flags
- no UI/provider coupling

Acceptance tests:
- identical test prompt reaches all providers through same internal type
- tool call normalization works across providers
- provider errors converted to unified error model

---

## P0-007 Basic TUI Shell
Priority: P0  
Evidence: DIRECT + SYNTH  
Depends on: P0-006, P0-003

Build:
- session pane
- block output rendering
- keyboard-first input
- model switch control
- permission prompt UI
- diff review view

DOD:
- interactive shell stable on target dev platform
- no obvious redraw corruption under normal usage
- user can approve/reject/edit generated changes

Acceptance tests:
- open repo, switch model, run task, review diff
- permission prompt fires on risky tool call
- session survives long output without rendering failure

---

## P0-008 Session Store + Handover Artifacts
Priority: P0  
Evidence: DIRECT  
Depends on: P0-006

Build:
- `.valxos/state.json`
- `Handover_File.md`
- `Handover_Prompt.md`
- resume previous session
- provider switch continuity path

DOD:
- model switch preserves task state
- restart can resume unfinished session
- handover artifacts are inspectable and deterministic

Acceptance tests:
- start task on provider A, switch to provider B, continue coherently
- crash/restart resumes session metadata
- handover file includes recent tool outputs and current goal

---

## P0-009 Fallback Cascade + Budget Guardrails
Priority: P0  
Evidence: DIRECT  
Depends on: P0-006

Build:
- provider retry with backoff
- secondary provider reroute
- local fallback path
- budget caps + soft warnings + hard stop
- repeated-tool-loop breaker

DOD:
- provider outage does not instantly kill workflow
- runaway spend prevented
- repeated non-productive loops halted

Acceptance tests:
- mock 429 triggers alternate provider
- budget cap stops further cloud calls
- same tool repeated without state change trips breaker

---

## P1-010 Routing Heuristics
Priority: P1  
Evidence: DIRECT  
Depends on: P0-006, P0-009

Build:
- complexity classifier
- route types: refactor / terminal ops / giant context / background / private
- manual override always available
- route rationale visible in logs

DOD:
- routes mostly align with expected benchmark-informed classes
- manual override never blocked by auto-route
- classifier cheap enough for local use

Acceptance tests:
- architecture prompt => Claude-class
- shell-heavy prompt => OpenAI/Codex-class
- giant log/repo context => Gemini-class
- cheap summary => local/fast model

---

## P1-011 Plugin Discovery + Compatibility Shim
Priority: P1  
Evidence: DIRECT  
Depends on: P0-001, P0-004, P0-005

Build:
- `.claude-plugin/plugin.json` discovery
- `${CLAUDE_PLUGIN_ROOT}` injection
- plugin-local dirs for skills/hooks/MCP/commands
- quarantine invalid plugins

DOD:
- mock plugin installs and resolves runtime-local paths
- invalid plugin cannot poison host process
- plugin enable/disable visible

Acceptance tests:
- plugin script path via `CLAUDE_PLUGIN_ROOT` works
- missing manifest rejected
- bad plugin only quarantined, not fatal

---

## P1-012 Local Model Schema Repair
Priority: P1  
Evidence: DIRECT  
Depends on: P0-006

Build:
- parse-validation wrapper for Ollama/open-weights
- automatic correction prompt loop for malformed JSON
- hard retry limit
- telemetry/log flag for repair events

DOD:
- malformed local tool-call outputs repaired or cleanly failed
- repair loop does not become infinite
- user sees concise explanation when repair exhausted

Acceptance tests:
- malformed JSON repaired on retry
- repeated malformed outputs stop after cap
- valid outputs bypass repair path entirely

---

## P1-013 Semantic Cache
Priority: P1  
Evidence: DIRECT  
Depends on: P0-006, P0-008

Build:
- local embedding/cache layer
- semantic hit reuse for repeated tasks
- configurable TTL/eviction
- privacy-safe local storage

DOD:
- repeated semantically-similar prompts can hit cache
- cache bypass possible per request
- cache state inspectable

Acceptance tests:
- near-duplicate prompt returns cached answer
- changed repo state invalidates stale cache where required

---

## P1-014 Release Skeleton
Priority: P1  
Evidence: DIRECT  
Depends on: stable P0 stack

Build:
- nightly/beta/stable channels
- signing/notarization placeholders
- release manifest
- crash reporting/telemetry config gates
- first-run onboarding flow

DOD:
- repeatable release pipeline exists
- channel promotion works
- onboarding completes simple first task

Acceptance tests:
- nightly to beta promotion path
- onboarding walkthrough executes starter command successfully

---

## P2-015 Subagent / Forking Model
Priority: P2  
Evidence: DIRECT  
Depends on: P0-008, P1-010

Build:
- `context: fork` support
- worker subagent registry
- bounded parallel task orchestration
- rejoin/summary merge

DOD:
- subagent can process isolated context
- main session not polluted by full worker transcript
- worker summaries merged cleanly

---

## P2-016 MCP Channels / Async Notifications
Priority: P2  
Evidence: DIRECT  
Depends on: mature MCP host

Build:
- async channel notification bridge
- UI surfacing for unsolicited events
- server trust boundary hardening

---

## P2-017 Enterprise Policy Layer
Priority: P2  
Evidence: DIRECT + SYNTH  
Depends on: P0-003, P1-014

Build:
- non-overridable managed config
- policy distribution format
- enterprise secrets/provider policy controls

---

## Global DOD
Before public beta:
- no sandbox escape known
- no privacy-hostile defaults
- no TUI unusability on target hardware
- no fatal crash from malformed skill/hook/plugin/MCP config
- import path from Claude-configured repo demonstrates actual value in under 10 minutes

---

## ADRs to write immediately
1. Why Rust-first
2. UMF schema boundaries
3. `.claude` compatibility philosophy
4. permission model and sensitive path defaults
5. provider escape hatch policy
6. session continuity artifact format
7. plugin/quarantine model
8. telemetry/privacy defaults
