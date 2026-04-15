# Claude Compatibility Spec Research for VALXOS Terminal

## Scope, constraints, and source base

Validated: This document inventories the publicly documented extension and configuration surfaces of Claude Code, focusing on what can be clean-room reimplemented for Claude Code–style compatibility inside VALXOS Terminal: slash-command behavior, skills, plugins, hooks, subagents, MCP configuration, settings precedence, session persistence, and permission/safety surfaces. citeturn1view1turn8view1turn9view0turn3view0turn11view0turn17view0

Validated: Claude Code’s internal system prompt is explicitly not published; Claude Code exposes supported customization primarily through files (CLAUDE.md, skills, settings.json), CLI flags, plugins, and runtime hooks. Any compatibility effort should therefore treat (a) documented file formats and runtime semantics as the “stable” surface and (b) internal prompts/algorithms as non-targets for compatibility. citeturn17view4turn1view5turn3view6

Inference: Because VALXOS Terminal is multi-model and provider-agnostic, “Claude compatibility” should mean **interface compatibility** (schemas, discovery, precedence, event names, and observable behaviors) rather than copying internal implementations or model-specific heuristics.

## Compatibility surface inventory

Validated: Claude Code exposes extension-like functionality primarily through:
- Skills (prompt packages that create user-invokable `/skill-name` commands and optionally model-invoked tools). citeturn3view1turn14view3turn1view4  
- Plugins (a directory package containing skills/commands, agents, hooks, MCP server config, optional LSP config, optional default settings). citeturn1view1turn8view3turn8view1  
- Subagents (Markdown-defined agent profiles with YAML frontmatter; usable directly and from CLI flags; certain fields are restricted for plugin-provided agents). citeturn13view0turn13view1  
- Hooks (event-driven automation that runs shell commands, HTTP callbacks, prompt hooks, or agent hooks at named lifecycle events; with defined JSON I/O and decision controls). citeturn9view0turn16view0turn9view4  
- MCP server configuration (project/user/local/managed scopes; JSON format with environment variable expansion; transports including stdio and HTTP/SSE; plugins may bundle servers). citeturn11view0turn11view1turn12search0  
- Settings, permissions, and sandboxing surfaces that constrain tools and automate approvals. citeturn17view0turn3view5turn7search0turn7search1  

Validated: Slash commands are the user-facing control plane. Built-in commands exist (visibility varies by platform/plan), and custom commands are implemented as skills (including legacy `.claude/commands/` compatibility). citeturn1view4turn3view1turn14view1

### File types and package artifacts

| Artifact | Default path(s) | Format | Primary role in compatibility | Notes for clean-room support |
|---|---|---|---|---|
| Settings | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` | JSON | Global + project + local configuration; enables permissions, hooks, env, plugin enablement, marketplaces | Precedence and merge behavior are part of the public surface. citeturn17view0turn17view2turn17view3 |
| CLAUDE instructions | `CLAUDE.md` or `.claude/CLAUDE.md`, plus `~/.claude/CLAUDE.md`, plus `CLAUDE.local.md` | Markdown | Persistent instructions/memory loaded into context | Locations/variants are public; exact “what gets injected when” is partially documented via context/window docs. citeturn3view6turn17view0turn3view4 |
| Skills | `~/.claude/skills/<name>/SKILL.md`, `.claude/skills/<name>/SKILL.md`, plugin `skills/<name>/SKILL.md` | Markdown + YAML frontmatter | Creates `/skill-name` (and model-available “Skill tool” behavior); supports substitutions, activation controls, tool constraints | Supports nested discovery in monorepos; plugin skills are namespaced. citeturn14view1turn14view3turn1view1 |
| Legacy commands | `.claude/commands/<name>.md`, plugin `commands/<name>.md` | Markdown | Back-compat for “custom commands” now merged into skills | If a skill and command share a name, the skill takes precedence. citeturn3view1turn14view1turn8view3 |
| Subagents | `~/.claude/agents/<name>.md`, `.claude/agents/<name>.md`, plugin `agents/<name>.md` | Markdown + YAML frontmatter | Agent profiles: prompt + tool/model/permission settings; used via `/agents`, CLI flags, and agent tool | Plugin-provided agents ignore `hooks`, `mcpServers`, and `permissionMode`. citeturn13view0turn13view1 |
| Plugin manifest | `<plugin>/.claude-plugin/plugin.json` | JSON | Optional manifest: metadata, component paths, userConfig, channels, inline hooks/MCP, etc. | If omitted, components are auto-discovered and name derived from directory name. citeturn8view1turn1view1 |
| Plugin hooks | `<plugin>/hooks/hooks.json` (default) or manifest path override | JSON | Bundled hook configs enabled with the plugin | Hook format matches settings hooks; lifecycle depends on plugin enablement. citeturn8view3turn16view0 |
| MCP config (project) | `.mcp.json` in project root | JSON | Team-shared MCP servers | Env var expansion and precedence rules are part of public behavior. citeturn11view0turn11view4 |
| MCP config (user/local) | `~/.claude.json` | JSON | User and “local-scope” MCP servers live here | Claude Code distinguishes MCP “local scope” from general “local settings.” citeturn11view0turn11view0 |
| MCP config (managed) | system `managed-mcp.json` | JSON | Enterprise-controlled MCP servers | Exclusive mode + allow/deny policy mode are documented. citeturn11view0turn17view1 |
| Plugin MCP config | `<plugin>/.mcp.json` or inline in manifest | JSON / object | Plugin-bundled MCP servers that start when plugin enabled | Uses `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` for paths/state. citeturn11view1turn8view2 |
| LSP config | `<plugin>/.lsp.json` or manifest field | JSON | Optional code intelligence servers | Public schema fields are documented (transport, args, env, timeouts). citeturn8view0turn8view1 |
| Plugin default settings | `<plugin>/settings.json` | JSON | Applies defaults when plugin enabled | Currently only `agent` is supported; unknown keys ignored. citeturn1view1turn1view1 |
| Plugin executables | `<plugin>/bin/*` | Files | Added to Bash tool PATH while plugin enabled | Affects how skills/hooks invoke tooling. citeturn8view3turn8view4 |

## Slash commands, skills, plugins, and subagents

Validated: Claude Code’s built-in commands are discoverable by typing `/` in the UI. Availability varies by plan/platform, indicating that relying on the full built-in command set for strict compatibility is fragile; compatibility should focus on extension mechanisms (skills/plugins/agents/hooks) rather than mirroring every built-in command. citeturn1view4turn1view5

Validated: “Custom commands” in Claude Code have been merged into the skills system; both `.claude/commands/<name>.md` and `.claude/skills/<name>/SKILL.md` can produce `/name` and “work the same way,” with legacy command files continuing to work. citeturn3view1turn14view1

### Skills as the primary “slash command” extension mechanism

Validated: Skills are Markdown instructions (with optional YAML frontmatter) that can be invoked directly with `/skill-name`, and may also be automatically invoked by Claude when relevant unless `disable-model-invocation: true` is set. citeturn3view1turn14view3turn14view1

Validated: Skill frontmatter includes behavior controls that are directly relevant to compatibility:
- `description` (recommended; used to decide when to apply; truncated in listings when long),
- `disable-model-invocation`,
- `user-invocable`,
- `allowed-tools`,
- `model`, `effort`,
- `context: fork` and `agent` (run skill in a subagent context),
- `hooks` (hooks scoped to the skill lifetime),
- `paths` (activate only for matching file patterns),
- `shell` (bash vs powershell for `!` blocks). citeturn14view3turn14view2

Validated: Skills support argument substitution and related behaviors: `$ARGUMENTS`, indexed `$ARGUMENTS[N]`, shorthand `$N`, plus `${CLAUDE_SESSION_ID}` and `${CLAUDE_SKILL_DIR}`. If a skill is invoked with arguments but `$ARGUMENTS` is not present, arguments are appended as `ARGUMENTS: <value>`. citeturn14view2turn14view4

Validated: Skill storage and precedence are explicitly scoped:
- Enterprise (managed), personal (`~/.claude/skills/`), project (`.claude/skills/`), and plugin skills (`<plugin>/skills/`). When the same skill name exists across levels, precedence is enterprise > personal > project; plugin skills are namespaced as `plugin-name:skill-name`, preventing conflicts. citeturn14view1turn1view1

### Plugins as the portable extension package

Validated: A plugin is a directory that can bundle skills/commands, agents, hooks, MCP server definitions, LSP definitions, and more. Default structure conventions are documented, including `.claude-plugin/plugin.json` as the manifest, and root-level component directories. citeturn1view1turn8view3turn8view1

Validated: The plugin manifest is optional; if omitted, Claude Code auto-discovers components in default locations and derives the plugin name from the directory name. When present, `name` is the only required field. Manifest component paths must be relative to plugin root and start with `./`. citeturn8view1turn8view2

Validated: Plugin skills are namespaced under the plugin name to avoid conflicts (e.g., `/my-first-plugin:hello`). citeturn1view1turn8view1

Validated: Plugins can ship a root `settings.json`, currently supporting `agent` to make a plugin-defined agent the main thread by default. Settings from plugin `settings.json` take priority over `settings` declared in the plugin manifest, and unknown keys are silently ignored. citeturn1view1turn1view1

Validated: Plugins can deliver user-prompted configuration values via `plugin.json.userConfig`. These options are substituted as `${user_config.KEY}` in MCP/LSP configs and hook commands and, for **non-sensitive values only**, in skill/agent content. Values are also exported to subprocesses as `CLAUDE_PLUGIN_OPTION_<KEY>` environment variables. citeturn8view1

Validated: Plugins expose dedicated path variables with two key behaviors:
- `${CLAUDE_PLUGIN_ROOT}`: absolute install directory; changes across updates.
- `${CLAUDE_PLUGIN_DATA}`: persistent state directory surviving updates; created on first reference; deleted on uninstall unless preserved (`--keep-data`). citeturn8view2turn8view4

### Subagents (agents) as packaged execution profiles

Validated: Subagents are Markdown files with YAML frontmatter plus a Markdown body that becomes the subagent’s system prompt. Only `name` and `description` are required; additional fields include `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers` (inline or references), `hooks`, `memory`, and others (including advanced fields used by CLI JSON injection). citeturn13view0turn13view3

Validated: Subagent resolution and precedence are public:
- Scope order: managed > `--agents` CLI flag > `.claude/agents/` (project) > `~/.claude/agents/` (user) > plugin `agents/` (lowest). citeturn3view0turn13view0
- Model resolution order includes an environment variable override: `CLAUDE_CODE_SUBAGENT_MODEL` first, then per-invocation `model`, then frontmatter `model`, then main conversation model. citeturn13view1turn15view0

Validated: For security, plugin subagents do **not** support `hooks`, `mcpServers`, or `permissionMode` fields—those fields are ignored for plugin-loaded agents. citeturn13view0

Inference: For VALXOS, treat “subagent files” as a portable, declarative “agent profile” format. Compatibility can prioritize parsing and applying the *observable* effects (prompt text, tool allow/deny, model selection intent), while mapping “model” to VALXOS’s provider-agnostic model registry.

## Hooks, event model, and runtime expectations

Validated: Hooks are user-defined automations triggered at named lifecycle events. Claude Code passes a JSON event payload to hook handlers: via stdin for command hooks, via HTTP POST body for HTTP hooks. Handlers can return control signals using exit codes and/or structured JSON on stdout (exit 0). citeturn9view0turn9view4turn16view0

Validated: Hook configuration is nested: event → matcher group → one or more handlers. Hooks can be declared in settings files, plugin `hooks/hooks.json`, and directly inside skills and agents via YAML frontmatter; component-scoped hooks run only while that component is active. citeturn9view0turn16view0turn14view3turn13view4

Validated: Hooks at the same event run in parallel, and identical handlers are deduplicated. When multiple hooks return differing decisions, Claude Code selects the most restrictive outcome (e.g., deny beats allow). citeturn16view0

Validated: Exit codes and structured JSON output are both supported, but must not be mixed: Claude Code processes JSON only when the hook exits 0; if it exits 2, JSON is ignored and stderr becomes feedback (with behavior depending on event). citeturn9view4turn16view0

Validated: The `if` field (distinct from `matcher`) uses permission-rule syntax to match tool name and arguments together, reducing hook process spawns; this field is version-gated (documented as requiring Claude Code v2.1.85+). citeturn16view0turn7search18

### Hook events and decision surfaces

Validated: Hook events and “when they fire” are enumerated publicly, including events inside the agentic loop (tool use, permission prompts, subagent lifecycle, compaction) and async/watch events (file changed, cwd changed, config change). citeturn10view0turn16view0

| Event | When it fires | Blockable? | Primary control surface | Compatibility notes |
|---|---|---:|---|---|
| `SessionStart` | Session begins or resumes | Yes (event-specific) | exit code / JSON | Also used for environment persistence patterns. citeturn10view0turn16view0 |
| `InstructionsLoaded` | CLAUDE.md or `.claude/rules/*.md` loaded | Yes | JSON `decision` patterns | Fires at start and on lazy load. citeturn10view0 |
| `UserPromptSubmit` | Before Claude processes a submitted prompt | Yes | exit code / JSON | Hook can block prompt processing. citeturn10view0turn16view0 |
| `PreToolUse` | Before a tool call executes | Yes | `hookSpecificOutput.permissionDecision` = allow/deny/ask/defer + `updatedInput` + `additionalContext` | Decision precedence: deny > defer > ask > allow. `defer` honored only in non-interactive mode. citeturn9view1turn16view0 |
| `PermissionRequest` | When a permission dialog is about to be shown | Yes | `hookSpecificOutput.decision.behavior` plus optional `updatedPermissions` | Does not fire in non-interactive mode; use `PreToolUse` there. citeturn9view2turn16view0 |
| `PermissionDenied` | When auto-mode classifier denies a tool call | N/A (observational + retry) | return `{retry: true}` (documented) | Only fires in auto mode; distinct from deny rules or hook blocks. citeturn10view0turn9view0turn16view0 |
| `PostToolUse` | After a tool succeeds | No (can’t undo action) | JSON output / side-effects | Best for formatting/logging; cannot reverse the tool call. citeturn10view0turn16view0 |
| `PostToolUseFailure` | After a tool fails | No | JSON output / side-effects | Used for logging/alerts/remediation guidance. citeturn10view0 |
| `SubagentStart` / `SubagentStop` | When subagent begins/finishes | Partially | JSON output / exit codes | `Stop` hooks in frontmatter are converted to `SubagentStop` for subagents. citeturn10view0turn13view4 |
| `Stop` / `StopFailure` | When Claude finishes responding / ends via API error | `Stop`: yes; `StopFailure`: no | `Stop` uses decision controls; `StopFailure` ignores output | Stop hooks can loop if not guarded (`stop_hook_active` guidance). citeturn10view0turn16view0 |
| `ConfigChange` | Config file changes during session | Yes | can block applying changes | Blocking prevents new config from applying to running session. citeturn10view0turn4search22turn5search4 |
| `CwdChanged` / `FileChanged` | Working dir changes / watched files change | No (reactive) | output fields per event | Used for env reload patterns (direnv-like). citeturn10view0turn16view0 |
| `PreCompact` / `PostCompact` | Before/after context compaction | Partial | output injection | Used to re-inject context after compaction. citeturn10view0 |
| `Elicitation` / `ElicitationResult` | MCP server requests user input / before response returns to server | Partial | event-specific schemas | Important for MCP-driven UX and interactive tool flows. citeturn10view0 |
| `SessionEnd` | Session terminates | Limited by timeout budget | handler budget env var | SessionEnd hook total time is bounded by `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`. citeturn10view0turn15view0 |

Inference: VALXOS can treat Claude Code’s hook system as a **public event bus contract**: match event names, input payload shape, and the decision-output protocol (exit codes + JSON) to achieve practical compatibility, even if VALXOS’s internal agent loop differs.

## Settings, precedence, permissions, and MCP transport expectations

Validated: Claude Code uses configuration scopes with a clear precedence order for overlapping settings: Managed (highest, cannot be overridden) → CLI args → Local (`.claude/settings.local.json`) → Project (`.claude/settings.json`) → User (`~/.claude/settings.json`). citeturn17view0turn17view3

Validated: Some settings arrays merge across scopes by concatenation and deduplication (rather than replacement), enabling additive configuration across layers. citeturn17view3

### Config precedence table across extension surfaces

| Domain | Where it’s defined | Precedence / resolution rule | Compatibility implications |
|---|---|---|---|
| Settings values | settings files + managed + CLI | Managed → CLI → local → project → user; arrays merge | VALXOS should replicate precedence + merge rules for settings keys it supports. citeturn17view0turn17view3 |
| Skills | managed / `~/.claude/skills` / `.claude/skills` / plugin skills | Same-name precedence: enterprise > personal > project; plugin skills are namespaced | VALXOS should implement both name resolution and namespacing. citeturn14view1turn1view1 |
| Subagents | managed / `--agents` / project `.claude/agents` / user `~/.claude/agents` / plugin agents | Higher-priority location wins on name conflict | VALXOS should match scope ordering; note plugin-agent field restrictions. citeturn3view0turn13view0 |
| Plugins enablement | `enabledPlugins` in settings | Declared per scope (user/project/local/managed) | Implement `plugin@marketplace` keys and scope-specific toggles. citeturn17view4turn8view0 |
| MCP servers | managed-mcp.json / local / project /.mcp.json / user | Name conflicts: local > project > user; managed can be exclusive | VALXOS should parse `.mcp.json` at minimum; optionally import user-local `~/.claude.json`. citeturn11view0turn11view4 |
| Hooks | settings hooks + plugin hooks + skill/agent frontmatter hooks | All can coexist; `disableAllHooks` disables non-managed hooks unless set in managed; managed-only hooks possible | VALXOS should support multiple hook sources and a global disable gate respecting managed precedence if implemented. citeturn9view0turn16view0turn9view0 |

### Permissions and tool safety surfaces

Validated: Claude Code supports tool permissions managed through `/permissions`, with rule buckets `allow`, `ask`, and `deny`. Evaluation order is deny → ask → allow, with the first matching rule winning. citeturn3view5turn7search3

Validated: Permission modes include `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, and `bypassPermissions`. Even in bypass mode, writes to protected directories (including `.git`, `.claude`, `.vscode`, `.idea`, `.husky`) still prompt, with exceptions for `.claude/commands`, `.claude/agents`, and `.claude/skills`. citeturn3view5turn13view1

Validated: Deny rules for Read/Edit apply to Claude’s built-in file tools, not to arbitrary Bash subprocesses; sandboxing is the documented mechanism for OS-level enforcement that blocks all processes from accessing a path. citeturn7search2turn7search0

Validated: Auto mode uses a classifier with explicit documented behavior: allow/deny rules resolve first; safe reads and working-directory edits auto-approve except protected paths; remaining actions go to the classifier; repeated classifier blocks trigger a fallback to prompting (thresholds documented as non-configurable). citeturn7search1

Validated: Sandboxing is supported on macOS (built-in Seatbelt) and Linux/WSL2 (requires packages like bubblewrap and socat). citeturn7search0

### MCP configuration and transport expectations

Validated: Claude Code integrates tools through MCP, an open standard using JSON-RPC 2.0. The MCP specification defines stdio and “streamable HTTP” transports, and recommends clients support stdio whenever possible. citeturn12search0turn12search5turn12search1

Validated: Claude Code’s `.mcp.json` format stores named MCP server entries under `mcpServers`, with scopes:
- Project scope stored in `.mcp.json`,
- User and MCP-local scopes stored in `~/.claude.json`,
- Managed scope stored in system `managed-mcp.json`. citeturn11view0turn17view0

Validated: `.mcp.json` supports environment variable expansion in `command`, `args`, `env`, `url`, and `headers`, with `${VAR}` and `${VAR:-default}` syntax; missing required variables (no default) cause config parsing failure. citeturn11view0turn11view4

Validated: Plugins can define MCP servers in plugin `.mcp.json` or inline in plugin manifests; when plugins are enabled, their MCP servers start automatically and are visible in `/mcp`, and plugin servers should reference `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` for bundled files and persistent state. citeturn11view1turn11view0turn8view2

## Session persistence, resume, and observable lifecycle behavior

Validated: Claude Code sessions are tied to the current directory; resuming continues the same session ID and appends messages. Forking creates a new session ID while preserving conversation history up to that point. citeturn3view4turn1view5

Validated: When resuming, full conversation history is restored but session-scoped permissions are not restored; users must re-approve those permissions. citeturn3view4

Validated: Resuming the same session concurrently in multiple terminals writes to the same session file and interleaves messages; it does not corrupt but becomes jumbled, and fork is recommended for parallel work. citeturn3view4

Validated: Checkpointing automatically captures code state before each edit; every user prompt creates a new checkpoint; checkpoints persist across sessions and are cleaned up with sessions after 30 days (configurable). citeturn3view3

Validated: CLI resume surfaces include `claude -c` (continue most recent) and `claude -r "<session>"` (resume by ID or name), plus a built-in slash command `/resume` (alias `/continue`). citeturn1view5turn2search7turn1view4

Inference: For VALXOS compatibility, **the critical contract is not exact transcript storage format**, but that (a) sessions can be resumed by ID/name, (b) session identity participates in substitutions (`${CLAUDE_SESSION_ID}`), and (c) permission state is intentionally not fully persisted across resumes.

## MVP compatibility subset, phase two subset, edge cases, and clean-room spec

### MVP compatibility subset

Validated: The following subset aligns with Claude Code’s most-used public extension surfaces and should deliver “Claude Code–style extensibility” inside VALXOS with minimal overreach:

Validated MVP targets:
- Skills as slash commands: parse `SKILL.md` frontmatter; implement `$ARGUMENTS` substitution rules; implement `disable-model-invocation` and `user-invocable`; implement `allowed-tools`; implement supporting-file referencing; implement `${CLAUDE_SESSION_ID}` and `${CLAUDE_SKILL_DIR}`. citeturn14view3turn14view2turn3view1  
- Plugins: load standard directory layout; parse optional manifest; implement namespacing (`plugin-name:skill-name`); implement `userConfig` prompting and `${user_config.KEY}` substitution (with sensitive restrictions); implement `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` environment variables; support plugin `bin/` PATH injection; support plugin-local `.mcp.json`. citeturn8view1turn8view2turn8view3turn11view1  
- Hooks core: implement config structure, key events (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`, `SessionEnd`), and decision protocol (exit code 2 vs exit 0 JSON). Include matcher semantics and `if` semantics (tool events only). citeturn9view4turn10view0turn16view0turn9view1turn9view2  
- Subagents (agents): parse frontmatter subset (name/description/tools/disallowedTools/model/skills); implement scope order for project/user/plugin agents; enforce plugin-agent field restrictions (ignore hooks/mcpServers/permissionMode). citeturn13view0turn3view0  
- Settings precedence and permission rules: implement scope order and deny→ask→allow evaluation; implement protected directory behavior for bypass-like modes; implement “deny affects built-in tools only” warning equivalent and recommend sandboxing for OS-level enforcement. citeturn17view0turn3view5turn7search2turn7search0  
- MCP minimal: parse `.mcp.json` and plugin MCP configs; support env var interpolation and scope precedence; support stdio + HTTP/SSE; expose an equivalent `/mcp` listing surface (may be UI-specific). citeturn11view0turn11view4turn12search0  

Inference: MVP should make “Claude Code–style plugins” installable in VALXOS by treating the plugin directory as the portable unit, while implementing a **VALXOS-side plugin registry** rather than reproducing Claude’s plugin marketplace stack.

### Phase two compatibility subset

Validated phase-two targets (defer until MVP proves stable):
- Full hook matrix, including `ConfigChange`, `CwdChanged`, `FileChanged`, `PreCompact`/`PostCompact`, `Elicitation`/`ElicitationResult`, `TeammateIdle`, and worktree events. citeturn10view0turn16view0  
- Prompt hooks (`type: "prompt"`) and agent hooks (`type: "agent"`) with the documented response schema (`ok`/`reason`) and timeouts/turn budgets. citeturn16view0turn9view4  
- Managed-settings restrictions on hooks and marketplaces (e.g., `allowManagedHooksOnly`, `strictKnownMarketplaces`) and HTTP hook allowlists. citeturn17view2turn17view5turn7search11  
- Plugin channels (message injection declarations) if VALXOS intends to support channel-style integrations. citeturn8view1turn11view0  
- LSP configuration loading (`.lsp.json`) and language-server lifecycle. citeturn8view0turn8view3  
- Headless/SDK behaviors (e.g., tool deferral flows and slash command discovery in SDK init messages) if VALXOS wants SDK parity. citeturn9view1turn1view6turn7search20  

### Known edge cases and failure modes

Validated high-signal edge cases from public docs and changelogs:

Validated: Plugin caching and external file resolution:
- Marketplace-installed plugins are copied into a local cache (`~/.claude/plugins/cache`), so references to files outside plugin root via `../` fail after installation; symlinks within plugin directory are honored and copied. citeturn8view3turn3view7  
- `${CLAUDE_PLUGIN_ROOT}` changes across plugin updates; persistent state must go in `${CLAUDE_PLUGIN_DATA}`; uninstall deletes the data directory unless preserved. citeturn8view2turn8view4  

Validated: Hooks output pitfalls:
- Hook JSON parsing can fail if shell profile prints text in non-interactive shells; recommended mitigation is guarding `echo` statements to interactive shells only. citeturn16view0turn9view4  
- Hook output injected into context is capped (documented in reference), with oversized output handled similarly to large tool results. citeturn9view4  
- `disableAllHooks` disables hooks globally, but cannot disable an individual hook without removing it; managed hooks cannot be disabled by lower scopes. citeturn9view0turn16view0  

Validated: Hook concurrency and nondeterminism:
- Hooks run in parallel; if multiple `PreToolUse` hooks return `updatedInput`, the “last to finish wins,” producing nondeterministic behavior. citeturn16view0turn9view1  

Validated: Non-interactive vs interactive differences:
- `PermissionRequest` hooks do not fire in non-interactive (`-p`) mode; `PreToolUse` must be used for automated permission decisions in headless runs. citeturn16view0turn9view2  
- `PreToolUse.permissionDecision: "defer"` is honored only in non-interactive mode; interactive sessions ignore it with a warning. citeturn9view1turn16view0  

Validated: Permissions boundaries:
- Hook “allow” does not bypass deny rules; deny rules take precedence across scopes; hooks can tighten but not loosen beyond permission rules. citeturn16view0turn3view5  
- Read/Edit deny rules do not constrain Bash; sandboxing is required to enforce at OS/process level. citeturn7search2turn7search0  

Validated: Session pitfalls:
- Resumed sessions restore history but not session-scoped permissions. citeturn3view4  
- Multiple terminals resuming the same session interleave output and become jumbled; fork recommended for parallel work. citeturn3view4  

Validated: Known regressions/fixes to treat as tests:
- Changelog entries document fixes involving hooks and tool calls (e.g., PreToolUse behavior with `updatedInput` in ask flows; file-edit races with PostToolUse “format on save” hooks). These indicate real-world edge conditions worth encoding as regression tests in VALXOS compatibility. citeturn4search7turn5search6turn4search19  

### Proposed clean-room interface spec for VALXOS

Inference: A clean-room spec can be framed as “Claude-compat extension ingestion + runtime contract,” implemented as a VALXOS subsystem:

Inference: **Extension package model**
- Accept a “plugin directory” with the documented layout and optional manifest. Treat the directory as immutable packaged content, with a derived “installation root” and a stable “data root.” Mirror `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` semantics for path substitution and persistence, without copying Claude’s marketplace implementation. Grounding: documented plugin vars + caching + persistence behavior. citeturn8view2turn8view3turn3view7  

Inference: **Skill runtime contract**
- Parse frontmatter; store skill metadata; implement substitution rules; implement activation gates (`paths`, `disable-model-invocation`, `user-invocable`); implement tool allowlists; optionally implement `!` preprocessor as a deterministic preprocessing stage (execute commands and inject output before sending to model). Grounding: skill frontmatter and dynamic context injection semantics. citeturn14view3turn14view4turn14view2  

Inference: **Agent runtime contract**
- Parse agent frontmatter; enforce scope precedence; enforce plugin-agent restrictions by dropping unsupported fields (hooks/mcpServers/permissionMode). Map “model” to VALXOS’s model selector (may be a named alias), but preserve the directive for compatibility. Grounding: subagent fields and restrictions. citeturn13view0turn13view1  

Inference: **Hook event bus contract**
- Implement event names and common input fields; route events to handlers with matcher and `if` filtering; run handlers concurrently; apply decision precedence; implement exit codes and JSON output parsing rules; provide deterministic “most restrictive wins” resolution. Grounding: hooks reference + guide. citeturn9view0turn9view4turn16view0turn9view1  

Inference: **MCP integration contract**
- Parse `.mcp.json` (and inline/plugin configs) with env var expansion; implement scope precedence; connect servers through at least stdio + HTTP streaming; expose server/tool lists in a VALXOS command (Claude-style `/mcp` compatibility could be a TUI surface). Grounding: Claude Code MCP docs + MCP spec transports. citeturn11view0turn11view4turn12search0  

Inference: **Settings and permissions contract**
- Implement precedence and merge standards for the keys VALXOS supports; implement deny→ask→allow rule evaluation; implement a sandbox option or equivalent isolation boundary. Grounding: settings precedence + permission rules + sandbox docs. citeturn17view3turn3view5turn7search0  

### Test scenarios to verify compatibility

Validated: The following scenarios map directly to documented behaviors and are suitable for automated compatibility tests in VALXOS:

Validated: Plugin parsing and namespacing
- Install a plugin directory with a manifest containing custom component paths; verify paths must be `./`-relative and components are discovered from those paths. citeturn8view2turn8view1  
- Verify plugin skill invocation name is `/<plugin-name>:<skill-name>` and appears in a “help/command list” equivalent. citeturn1view1turn8view1  

Validated: `userConfig` behavior
- Enable a plugin with `userConfig` keys marked sensitive and non-sensitive; verify `${user_config.KEY}` substitution occurs in MCP/hook contexts, and **only non-sensitive values** substitute into skill/agent content; verify env var export naming (`CLAUDE_PLUGIN_OPTION_<KEY>`). citeturn8view1  

Validated: Plugin path variables and persistence
- Verify `${CLAUDE_PLUGIN_ROOT}` resolves to install root and `${CLAUDE_PLUGIN_DATA}` to persistent directory; simulate plugin update (new root) and confirm data persists; validate uninstall deletes data unless “keep data” configured. citeturn8view2turn8view4  

Validated: Hook decision semantics
- `PreToolUse` hook returns deny/ask/allow/defer; verify precedence deny > defer > ask > allow and that allow does not override deny rules. citeturn9view1turn16view0turn3view5  
- Verify `PermissionRequest` does not fire in headless mode; ensure `PreToolUse` is used for headless automation. citeturn16view0turn9view2  
- Verify JSON-only stdout requirement; simulate shell-profile noise and confirm parsing failure and mitigation guidance applicability. citeturn16view0turn9view4  

Validated: Skill substitution and invocation
- Invoke a skill with arguments and without `$ARGUMENTS` in content; verify “ARGUMENTS: …” append behavior. citeturn14view4  
- Validate `${CLAUDE_SESSION_ID}` and `${CLAUDE_SKILL_DIR}` substitutions. citeturn14view2turn14view4  

Validated: Configuration precedence
- Construct conflicting settings across user/project/local/managed (or simulated managed) and confirm precedence order and array merge behavior. citeturn17view3turn17view0  
- Create duplicate-named skills across personal and project levels and confirm precedence enterprise > personal > project; verify plugin skills do not conflict due to namespacing. citeturn14view1turn1view1  
- Create duplicate-named subagents across scopes and confirm scope resolution order; confirm plugin agent ignores restricted frontmatter fields. citeturn3view0turn13view0  

Validated: MCP config parsing
- Parse `.mcp.json` with `${VAR}` and `${VAR:-default}` in all supported locations; ensure missing required vars cause parse failure (no default). citeturn11view4turn11view0  

## Build Recommendation For VALXOS

Validated: The most durable Claude Code compatibility targets are the **documented, file-driven extension surfaces**: skills (`SKILL.md`), plugins (directory layout + `plugin.json` schema + path variables + `userConfig`), subagents (Markdown + YAML frontmatter with scope precedence and plugin-specific restrictions), hooks (event names + JSON I/O + decisions + matchers), and MCP configuration (`.mcp.json` + env expansion + scoped precedence). citeturn14view3turn8view1turn13view0turn9view0turn11view0turn17view0

Inference: Implement compatibility in VALXOS as a **layered adapter**:
- A “Claude-compatible loader” that ingests the plugin/skill/agent/hook file formats and computes an effective configuration graph (respecting precedence and namespacing).
- A runtime “event bus” that emits Claude hook events with compatible payloads and honors Claude-style decision semantics.
- A provider-agnostic execution engine that maps Claude-oriented directives (model aliases, tool names, permission modes) onto VALXOS’s multi-model tool sandbox, while keeping the observational behavior aligned.

Inference: Ship MVP around **skills + plugins + core hooks + basic agents + `.mcp.json`**, and postpone marketplace mechanics, channels, advanced hooks, and LSP until the compatibility suite is stable. Encode the edge cases above as regression tests early—particularly hook concurrency/updatedInput nondeterminism, headless vs interactive differences, plugin path/persistence semantics, and settings merge behavior—because these are the areas where “it works in Claude Code but not in VALXOS” will be most visible to power users.