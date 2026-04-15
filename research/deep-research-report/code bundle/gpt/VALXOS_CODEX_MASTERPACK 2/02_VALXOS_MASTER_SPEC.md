# VALXOS MASTER SPEC
Version: 1.0  
Audience: GPT-5.4 / Codex terminal instance  
Mode: implementation contract + synthesis  
Style target: terse, modular, operational  

---

## 0. Canonical Intent

Build `VALXOS Terminal` as a provider-agnostic, terminal-first, agentic development environment.

Primary goals:
- feel like one coherent system, not four model wrappers glued together
- support Claude-style repo surfaces without copying proprietary internals
- make MCP, hooks, skills, rules, scripts, and routing first-class
- prioritize BYOK, local-first execution, deterministic safety, and clean-room governance
- land MVP with genuine user migration value, then widen toward Warp-class control center

Do **not**:
- replicate proprietary inner loops
- overfit to one vendor’s hidden behavior
- sacrifice native model strengths for abstraction purity
- postpone safety until after UX polish
- block on missing research lanes if adjacent evidence supports a safe MVP path

---

## 1. Product Thesis

Winning wedge:
- take users who like Claude Code repo ergonomics but reject vendor lock-in, opaque spend, and single-provider dependence
- give them `.claude` surface compatibility + multi-model routing + MCP-native openness + TUI control

Target users:
1. terminal-first power users
2. budget-conscious startup teams
3. security-restricted / air-gapped enterprise developers

Differentiators:
- clean-room compatibility bridge for `.claude` ecosystems
- provider switching and workload routing
- deterministic hooks and permissions outside LLM compliance
- local/private inference path via Ollama
- future-ready control center model for rules, MCP, sessions, scripts, and artifacts

---

## 2. Canonical MVP

MVP is **not** “full Warp clone.”
MVP is “usable migration-grade ADE with real multi-model value.”

### MVP pillars
1. modern TUI shell
2. UMF control plane
3. Claude-compatible repo surface ingest
4. stdio MCP host
5. deterministic permissions
6. session continuity
7. fallback cascade
8. budget guardrails

### MVP exit criteria
- can enter a Claude-configured repo and run meaningfully without rewriting project setup
- can switch between at least Claude/OpenAI/Gemini/Ollama in one tool
- can enforce deny/ask/allow before risky execution
- can run stdio MCP servers
- can lazy-load skills to avoid token burn
- can resume interrupted work via persisted state
- can fall back between providers on failure
- can present diff review and approval flow in terminal

---

## 3. System Architecture

```text
TUI Shell
  -> UMF Core
      -> Routing Engine
      -> Context Stitcher
      -> Budget Manager
      -> Semantic Cache
      -> Fallback Engine
  -> Execution Kernel
      -> Tool Runner
      -> Hook Dispatcher
      -> Permission Engine
      -> Session Store
      -> Extension Host
  -> Provider Adapters
      -> Anthropic
      -> OpenAI/Codex
      -> Gemini
      -> Ollama
  -> MCP Host / Client
```

### 3.1 Module boundaries

#### `tui-shell`
Owns:
- chat/session pane
- block output
- diff review
- model switch UI
- session/artifact browser
- keyboard-first control

Must not own:
- provider-specific request logic
- permission evaluation
- session persistence rules

#### `umf-core`
Owns:
- internal request/response schema
- prompt normalization
- tool schema normalization
- handover artifact generation
- provider translation orchestration

Must not own:
- UI rendering
- sandboxing
- long-term extension metadata storage

#### `routing-engine`
Owns:
- manual override support
- task-type heuristics
- cost/latency/complexity routing
- fallback ranking
- provider selection logs

#### `execution-kernel`
Owns:
- orchestration loop
- deterministic tool execution boundaries
- hook event firing
- permission checks
- loop breaker / retry logic

#### `extension-host`
Owns:
- discovery
- validation
- scope resolution
- activation
- lifecycle state transitions

#### `session-store`
Owns:
- `.valxos/state.json`
- `Handover_File.md`
- `Handover_Prompt.md`
- resumability
- subagent/task phase persistence

---

## 4. Internal Data Contracts

### 4.1 Core normalized config
Define a single internal type:

```ts
ValxosConfig {
  scopes: ManagedConfig | CliConfig | LocalConfig | ProjectConfig | UserConfig
  permissions: PermissionPolicy
  hooks: HookRegistration[]
  mcpServers: McpServerConfig[]
  skills: SkillRef[]
  rules: RulePackRef[]
  scripts: ScriptRef[]
  providers: ProviderPolicy[]
  ui: UiPrefs
  budgets: BudgetPolicy
}
```

### 4.2 Merge semantics
Unless verified otherwise by direct compatibility evidence:
- scalars: overwrite by higher precedence
- objects: deep merge
- arrays: concatenate + dedupe
- replace-only fields: require explicit per-field override rules
- ambiguous fields: mark as `UNVERIFIED_BEHAVIOR` in code comments and tests

### 4.3 State artifact set
Persist:
- active session id
- current provider/model
- last successful tool action
- active file locks or guarded paths
- subagent registry
- unresolved tasks
- current budget state
- current route/fallback stack

---

## 5. Claude-Compatible Surface Contract

### 5.1 Read in MVP
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/settings.local.json`
- `.claude/skills/*/SKILL.md`
- `.mcp.json`

### 5.2 Later / shims
- `.claude/agents/*.md`
- `.claude-plugin/plugin.json`
- `.claude/hooks/hooks.json` style package layout if needed
- channel notification semantics
- session import from Claude history only if migration truly needs it

### 5.3 Settings precedence
Highest -> lowest:
1. managed
2. CLI flags
3. local
4. project
5. user

### 5.4 Skill contract
Expected fields:
- `name`
- `description`
- `argument-hint`
- `disable-model-invocation`
- `user-invocable`
- `allowed-tools`
- `context`

Loading model:
- initial prompt gets only `name + description`
- full skill body injected only on explicit invocation or high-confidence relevance match

### 5.5 Hook contract
Events:
- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PostToolUse`
- `PermissionRequest`
- `Stop`

Execution:
- JSON via stdin
- exit 0 = success, optional JSON decision payload
- exit 2 = hard block, stderr surfaced
- invalid hook JSON must fail safe, not crash session

### 5.6 Permission contract
Evaluation order:
`deny -> ask -> allow`

Pattern examples:
- `Bash(*)`
- `Read(*)`
- `Edit(**/*.ts)`
- `Bash(npm test *)`

### 5.7 Plugin contract
Expect:
- `.claude-plugin/plugin.json`
- plugin-local dirs for commands/agents/skills/hooks/MCP
- runtime env var: `CLAUDE_PLUGIN_ROOT`

### 5.8 Strategic rule
**Implement public file/system surfaces, not proprietary agent behavior.**
User-value comes from repo compatibility, not from cloning hidden orchestration internals.

---

## 6. Unified Extension Topology

Canonical domains:
1. commands
2. hooks
3. agents
4. skills
5. MCP servers
6. rules / policy packs
7. scripts / automations
8. plugins (distribution layer)

### 6.1 First-class vs shim
First-class:
- MCP
- commands
- rules
- scripts
- hooks
- skills

Shim-only:
- vendor-specific manifest names
- vendor event strings
- vendor directory conventions
- vendor alias behavior

### 6.2 Lifecycle
```text
discovery
-> validation
-> scope resolution
-> activation
-> execution
-> deactivation
-> error/quarantine
```

### 6.3 Scopes
- enterprise managed
- global user
- project
- local override

Collision rule:
- more local wins
- enterprise can be locked/non-overridable
- resolution must be inspectable from UI/CLI

---

## 7. Provider Orchestration

### 7.1 General principle
Expose one coherent terminal.
Do not erase provider strengths.

### 7.2 Routing heuristics
- complex multi-file refactor -> Claude-class
- shell/devops/computer-use -> GPT/Codex-class
- huge context / algorithms / UI ideation -> Gemini-class
- repetitive cheap jobs -> fast cloud model or local model
- sensitive/air-gapped -> Ollama/open-weight local

### 7.3 Escape hatches
Anthropic:
- extended thinking controls
- longer timeout handling

OpenAI:
- native computer-use path
- native shell/system interaction payloads where useful

Gemini:
- optional no-compaction mode for huge context

Ollama:
- schema repair loop
- robust malformed JSON recovery
- local-first failure fallback

### 7.4 Fallback cascade
Failure classes:
- provider timeout
- 429/rate limit
- 5xx
- transport failure
- malformed local model output

Default pattern:
1. retry with backoff if transient
2. reroute to compatible secondary provider
3. fall back to local provider where possible
4. if repeated tool loop detected, trip circuit breaker and surface trace

### 7.5 Budget model
Must support:
- per-session cap
- per-project cap
- optional per-agent cap
- soft warning threshold
- hard kill switch

---

## 8. Context Stitching / Transcript Continuity

When model changes:
1. pause active turn
2. summarize operational state into `Handover_File.md`
3. generate bootstrap continuation in `Handover_Prompt.md`
4. persist state manifest
5. rehydrate into target provider via UMF
6. continue without user restating project rules

Critical persisted items:
- goals
- latest file edits
- tool outputs
- open hypotheses
- unresolved blockers
- environment context
- active safety constraints
- provider switch rationale

Do not rely on raw transcript replay alone.
Use structured handover artifacts.

---

## 9. Safety Model

### 9.1 Deterministic > probabilistic for dangerous actions
All risky execution goes through:
1. permission engine
2. PreToolUse hooks
3. sandbox boundary
4. execution
5. PostToolUse hooks
6. audit log

### 9.2 Protected zones
Never allow unreviewed writes to:
- `.ssh/**`
- `.aws/**`
- shell rc/profile files
- platform secret stores
- signing keys
- credential directories

### 9.3 Sandboxing
MVP:
- path allow/deny enforcement
- command approval modes
- environment filtering
- explicit subprocess boundary

Later:
- OS-level isolation
- stronger filesystem jails
- network egress policies for remote MCP/agents

### 9.4 MCP security
- stdio first
- remote transports later
- encrypt/authenticate non-local transports
- inspect declared tools before activation
- allow per-server trust settings
- support quarantine/disable state for suspicious servers

---

## 10. TUI Contract

Even without the missing dedicated TUI research upload, adjacent evidence implies these MVP requirements:

Must feel:
- fast
- keyboard-native
- inspectable
- serious, not toy-like

Must include:
- block output
- diff review
- model switch control
- session list
- extension/MCP visibility
- permissions prompts
- artifact browser

Must avoid:
- terminal spam
- hidden state
- chat-only interaction model
- visual clutter that breaks shell mental model
- latency > terminal-native expectations

Recommended default stack:
- Rust
- ratatui/crossterm-class ecosystem
- strict redraw/perf profiling from early stage

---

## 11. Repo Governance / Clean-Room

### 11.1 Source boundaries
Allowed:
- official docs
- public standards/specs
- black-box behavior observation
- public config/file formats
- permissive licensed source with provenance

Forbidden:
- leaked repos
- internal screenshots
- confidential prompts/specs
- pasted competitor implementation code

### 11.2 Contribution controls
Require:
- DCO
- SPDX / REUSE compliance
- LICENSE
- NOTICE
- SECURITY
- CONTRIBUTING
- CODE_OF_CONDUCT

Recommended:
- Apache-2.0 for core
- permissive docs license
- plugin license declaration required
- provenance/signing targets for releases

### 11.3 Team split
Where high-risk compatibility work exists:
- spec/analysis team can observe target behavior
- implementation team codes from spec
- keep provenance logs

---

## 12. Release / Hardening

### 12.1 Release channels
- nightly
- beta
- stable

### 12.2 Hardening order
1. security core
2. rendering/performance
3. MCP robustness
4. privacy + observability
5. release automation
6. onboarding

### 12.3 Ship blockers
- sandbox escape to sensitive paths
- insecure remote MCP transport
- obvious TUI lag/flicker
- privacy-hostile telemetry defaults
- broken first-run activation path
- unsigned/unnotarized public builds where required

### 12.4 Telemetry
Default posture:
- minimal
- transparent
- opt-in where possible
- never collect code or sensitive command history silently

---

## 13. Recommended Repo Layout

```text
valxos/
  apps/
    valxos-cli/
    valxos-tui/
  crates/
    config-loader/
    umf-core/
    routing-engine/
    provider-anthropic/
    provider-openai/
    provider-gemini/
    provider-ollama/
    execution-kernel/
    permission-engine/
    hook-runner/
    session-store/
    extension-host/
    mcp-host/
    semantic-cache/
    diff-engine/
    sandbox/
    telemetry/
  compat/
    claude/
      fixtures/
      parsers/
      adapters/
  schemas/
    valxos-config.schema.json
    valxos-extension.schema.json
    valxos-hook-payload.schema.json
  tests/
    integration/
    e2e/
    fixtures/
      claude/
      mcp/
      routing/
  docs/
    adr/
    compatibility/
    security/
    release/
```

If existing reuse pushes toward Go for daemon pieces:
- keep external contracts identical
- do not let mixed-language convenience create architectural ambiguity

---

## 14. Implementation Doctrine

1. build compatibility fixtures before aggressive abstraction
2. keep internal canonical types provider-agnostic
3. keep provider adapters thin and explicit
4. keep dangerous operations outside LLM discretion
5. lazy-load expensive context
6. prefer inspectable state over hidden “magic”
7. mark inference in code/docs until verified
8. optimize local-first execution paths
9. keep import compatibility high, vendor lock-in low
10. user trust outranks flashy autonomy

---

## 15. Immediate Build Sequence

Phase P0:
- config loader
- CLAUDE.md ingest
- settings precedence merge
- skill parser
- permission engine
- stdio MCP host
- provider adapters
- manual model switch
- basic TUI shell
- state store
- fallback cascade

Phase P1:
- hook engine
- plugin discovery
- diff workflow polish
- routing heuristics
- schema repair for local models
- session browser
- semantic cache
- budget controls

Phase P2:
- subagent forking
- MCP channels
- enterprise managed policy layer
- stronger sandboxing
- desktop/browser companion
- marketplace/import tooling expansion

---

## 16. Missing Inputs / Must Verify

Not uploaded directly:
- dedicated Warp-class TUI research output
- dedicated archaeology/reuse research output
- explicit cross-model diff between Gemini and GPT research stacks

Therefore:
- TUI decisions beyond MVP minimum are provisional
- reuse/import policy for older VALXOS codebases should remain a separate audit stream
- if later docs contradict this pack, prefer explicit uploaded evidence and update ADRs
