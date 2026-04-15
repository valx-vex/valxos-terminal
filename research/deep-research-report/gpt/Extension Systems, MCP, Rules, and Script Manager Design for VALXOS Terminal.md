# Extension Systems, MCP, Rules, and Script Manager Design for VALXOS Terminal

## Executive synthesis

Validated: Claude Code’s extensibility story is unusually “file-and-directory native”: plugins are self-contained directories that can bundle skills (slash commands), subagents, hooks, MCP servers, and LSP servers, with an optional `.claude-plugin/plugin.json` manifest and standardized component locations (e.g., `skills/<name>/SKILL.md`, `agents/`, `hooks/hooks.json`, `.mcp.json`). citeturn5view3turn0search1

Validated: OpenCode’s extensibility is “runtime-module native”: plugins are JavaScript/TypeScript modules loaded either from local directories or npm, installed automatically using Bun, cached under `~/.cache/opencode/node_modules/`, and executed as hook handlers across a broad event surface (tool, shell, session, UI, permission events). citeturn7view0turn7view2turn3view5

Validated: MCP provides a shared, protocol-level extension surface across tools: it is JSON-RPC–based and defines standard transports (stdio and Streamable HTTP), with strict rules about message framing (newline-delimited JSON-RPC on stdio; stdout must contain only protocol messages). citeturn6view2turn1search12

Validated: The main security lesson from editor ecosystems is that extensions often run with broad local privileges. Visual Studio Code documents that the extension host has the same permissions as VS Code itself (file read/write, network requests, running external processes), and mitigations rely on publisher trust signals, marketplace scanning, and workspace trust boundaries (“Restricted Mode”). citeturn8view0turn2search3

Inference: VALXOS should treat “extensibility” as a **governed control plane** with (a) a unified internal extension model and lifecycle, (b) compatibility shims for Claude Code plugins and OpenCode plugins, and (c) MCP as a first-class integration substrate—not merely an add-on—because MCP creates the cleanest interoperability boundary between models/tools while keeping the UX coherent. citeturn6view2turn6view1turn7view2

## Existing extension concepts worth absorbing

### Claude Code’s extension primitives

Validated: Claude Code plugin manifests are optional; when omitted, Claude Code auto-discovers components in default locations and derives plugin identity from the directory name. citeturn5view3

Validated: Claude Code supports “user configuration” (`userConfig`) inside plugin manifests: the user is prompted for values when enabling the plugin; values can be substituted as `${user_config.KEY}` in MCP/LSP configs and hook commands, and non-sensitive values can also be substituted into skill/agent content. These values are exported to plugin subprocesses as `CLAUDE_PLUGIN_OPTION_<KEY>` environment variables. citeturn5view0

Validated: Claude Code intentionally distinguishes between **plugin root** and **plugin data**: `${CLAUDE_PLUGIN_ROOT}` is used to reference bundled files, while `${CLAUDE_PLUGIN_DATA}` is a persistent data directory that outlives plugin versions and can store dependencies like `node_modules` across updates; the docs explicitly recommend dependency-manifest checks because the data directory persists across versions. citeturn5view1turn3view1

Validated: Claude Code marketplace-installed plugins are copied into a local cache (`~/.claude/plugins/cache`) “for security and verification purposes,” which creates hard constraints: plugins cannot reference files outside their directory via path traversal (e.g., `../shared-utils`) because external files are not copied to the cache. citeturn3view1

Validated: Claude Code uses semantic versioning for plugins, and caching means “if you change code but don’t bump version,” existing users won’t see changes due to caching. citeturn5view3

Validated: Claude Code marketplaces are explicitly modeled as catalogs defined by `.claude-plugin/marketplace.json`, managed via `/plugin` UI and CLI commands, with optional auto-update that can update marketplaces and installed plugins at startup (and then prompt users to `/reload-plugins`). citeturn3view2turn3view3

### OpenCode’s extension primitives

Validated: OpenCode loads plugins from (1) project plugin directory `.opencode/plugins/`, (2) global plugin directory `~/.config/opencode/plugins/`, and (3) npm packages listed in config; npm plugins are installed at startup using Bun and cached under `~/.cache/opencode/node_modules/`. citeturn7view0

Validated: OpenCode defines a deterministic plugin load order across sources (global config, project config, global plugin dir, project plugin dir), runs hooks in sequence, and deduplicates npm packages with the same name+version—while still loading a local plugin separately even if it has a similar name to an npm plugin. citeturn7view0

Validated: OpenCode’s plugin event surface is broad and explicitly documented, including tool events (`tool.execute.before/after`), shell env injection (`shell.env`), permission events, and TUI events (e.g., `tui.toast.show`). citeturn7view2

Validated: OpenCode troubleshooting guidance includes “clear the cache” steps, indicating cache invalidation is a practical operational requirement in the field. citeturn3view5

### MCP as the cross-tool interoperability substrate

Validated: MCP defines stdio and Streamable HTTP as standard transports; clients should support stdio whenever possible. For stdio, JSON-RPC messages are newline-delimited, must not contain embedded newlines, and servers must not write non-protocol content to stdout (stderr is allowed for logs). citeturn6view2

Validated: Claude Code’s documentation warns that third-party MCP servers are “at your own risk,” explicitly calls out prompt injection risk (especially for servers that can fetch untrusted content), and recommends caution. citeturn6view1

Validated: Claude Code docs also show MCP is not only “tools,” but can participate in higher-level UX patterns such as channels pushing messages into sessions and prompts exposed as commands. citeturn6view1

Validated: Tool-name collisions are a real-world design concern; some MCP implementations namespace tools by server name to avoid conflicts (and enforce naming constraints). citeturn1search35

### Editor plugin systems as trust-and-usability references

Validated: VS Code documents that extensions run inside an extension host with the same permissions as the editor itself (file access, network, external processes). citeturn8view0

Validated: To mitigate risk, VS Code combines marketplace protections (malware scanning for every published extension and update) with user-facing trust signals (publisher trust prompt; verified publisher identity signals). citeturn8view0turn8view2

Validated: VS Code’s Workspace Trust provides a user decision point: in “Restricted Mode,” potentially harmful functionality is limited/disabled, and extensions can declare whether they are supported in untrusted workspaces (supported/unsupported/limited) with user-visible descriptions. citeturn2search3turn8view1

Inference: VALXOS can borrow the best part of editor ecosystems without copying their weaknesses: keep extension programmability powerful, but introduce explicit, comprehensible trust boundaries (publisher trust + project trust) and capability-scoped permissions so users do not have to choose between “full power” and “paranoia.” citeturn8view0turn2search3turn6view1

## Unified extension model for VALXOS

### Extension types and how VALXOS should model them

Inference: VALXOS should define a **single internal extension graph** composed of Packages and Components:

- **Package**: an installable unit with metadata, provenance (source), version, signatures, and a declared capability set.
- **Component**: an executable or declarative artifact inside a package (command/skill, hook, agent, MCP server definition, rule pack, script/workflow template).

This mirrors Claude Code’s “plugin directory as container of components” model while remaining compatible with OpenCode’s “module returning hooks” model by treating OpenCode modules as one possible component type. citeturn5view3turn7view0turn7view2

### Table of extension types

| Extension type | What it is (VALXOS internal) | Primary UX surface | Execution characteristics | Compatibility notes |
|---|---|---|---|---|
| Commands / Skills | Declarative instruction template with optional parameters, tool constraints, and “manual vs auto” activation | Slash command menu + palette; attachable to workflows | Produces a structured prompt + optional tool plan; may allow inline shell blocks depending on policy | Claude Code skills and OpenCode command events map here. citeturn1search8turn7view2turn2search3 |
| Hooks | Event-driven handlers attached to lifecycle/tool events | “Automation” panel + per-extension settings | Executes local code (shell/http/prompt/agent-hook) with structured I/O; can block/modify actions | Claude Code hook schema and OpenCode tool-before/after events are strong anchors. citeturn6view0turn7view2 |
| Agents | Named execution profiles (model preferences, tool constraints, skills enabled) | Agent chooser; “Run as agent” | Controls orchestration parameters, not just prompt text | Claude Code “subagents” model is directly compatible as an import format. citeturn4view0turn1search12 |
| MCP servers | External tool connectors defined by MCP config + auth | MCP manager (servers/tools/logs) | Runs as local subprocess (stdio) or remote endpoint (HTTP); emits tools/resources/prompts | Based on MCP protocol and transport rules. citeturn6view2turn6view1 |
| Rules / Policy packs | Declarative policy objects: routing constraints, tool permissions, sandbox rules, signing requirements | Rules manager + “effective policy” inspector | No code execution by default; governs other components | Claude Code settings scopes + managed policies are a close reference model. citeturn4view0turn4view3turn1search0 |
| Scripts / Automations | Parameterized runbooks: chained commands + checks + approvals | Script manager + task launch | Executes step graph (shell + tool calls) with checkpoints and approvals | Claude Code hooks can implement parts of this; OpenCode plugins can inject env and run commands. citeturn6view0turn7view2 |

### What should be first-class vs shimmed

Validated: Claude Code’s plugin system is already a structured container of skills, agents, hooks, and MCP/LSP definitions. Treating that container as importable is the cleanest path to compatibility. citeturn0search1turn5view3turn3view1

Inference: Make these **first-class** in VALXOS (native authoring + native UI):
- Rules / policy packs (because they govern security and routing across all providers and extension types). citeturn4view0turn4view3
- MCP servers (because they are the vendor-neutral “tool bus” across models). citeturn6view2turn6view1
- Scripts / automations (because “AI workflows” are a primary product goal, not a peripheral add-on). citeturn6view0turn7view2
- Agents and Skills (because these are the human-facing interaction layer—what users run and what the system routes). citeturn1search8turn7view2

Inference: Support these primarily through **compatibility shims**:
- Claude Code plugin marketplace mechanics (adopt the concept, but implement VALXOS distribution clean-room; keep import/export of `marketplace.json` as a bridge). citeturn3view3turn3view2
- OpenCode’s exact runtime expectations (Bun installation, module hook signatures) as an optional runtime adapter rather than the only plugin API. citeturn7view0turn7view2

## Installation, scope, versioning, caching, and conflict handling

### Installation and discovery model

Validated: Claude Code supports discovery through marketplaces and a `/plugin` manager UI; marketplaces can be configured at user and project scopes, and auto-updates can refresh marketplaces and update plugins at startup. citeturn3view2turn3view3

Validated: OpenCode supports both local-file plugins and npm plugins listed in config. citeturn7view0

Inference: VALXOS should unify these into a single “Sources” concept:
- **Local directory source** (developer mode)
- **Registry source** (npm-like for code plugins; optional)
- **Git source** (repo pinned by commit/tag; useful for teams)
- **Marketplace source** (catalog JSON file, Claude-like, but VALXOS-controlled)

This keeps compatibility with Claude Code marketplace catalogs and OpenCode npm distribution while letting VALXOS remain vendor-agnostic. citeturn3view3turn7view0

### Scope model and precedence

Validated: Claude Code defines four configuration scopes (Managed, User, Project, Local) with documented locations for settings/plugins/MCP, plus explicit precedence ordering (Managed highest, then CLI args, then local project, etc.). citeturn4view0turn4view2turn4view3

Validated: Arrays are merged across scopes (concatenate + deduplicate) for many settings, which enables additive configuration layers and is explicitly called out in Claude Code documentation. citeturn4view3turn3view0

Validated: OpenCode similarly distinguishes global vs project config and global vs project plugin directories, with a defined load order. citeturn7view0

Inference: VALXOS should adopt Claude-like scope semantics for governance and clarity:
- **Managed (org policy)**: hard gates and allow/deny lists; “fail closed” options for enterprise-like safety. citeturn4view3turn6view1
- **User (global)**: personal extensions, default routing preferences.
- **Project (shared)**: team workflows and MCP servers committed to source control.
- **Local (per-repo, per-user)**: experiment overrides and private credentials, designed to be gitignored by default.

This scope model also naturally supports a “Project Trust” boundary (see Trust model). citeturn4view0turn2search3

### Versioning, caching, and operational ergonomics

Validated: Claude Code copies marketplace plugins into a local cache (`~/.claude/plugins/cache`) and imposes strict no-path-traversal rules because only the plugin directory is copied; symlink-based sharing is specifically suggested for shared files. citeturn3view1turn3view3

Validated: Claude Code plugin docs describe version-driven cache behavior (users may not see changes without version bumps), and plugin uninstall behaviors include deleting the data directory unless `--keep-data` is used. citeturn5view3turn5view1

Validated: OpenCode caches npm plugin dependencies under `~/.cache/opencode/node_modules/` and provides “clear cache” steps when plugin installs or behaviors get stuck. citeturn7view0turn3view5

Validated: Real-world bug reports and discussions indicate that stale plugin caches can cause confusing behavior (e.g., wrong version loaded, orphaned cache directories after uninstall/marketplace removal). citeturn2search29turn2search0turn2search2

Inference: VALXOS should implement a **two-tier storage model** for every package:
- **Immutable install root** (content-addressed by hash + version; safe for verification, rollback)
- **Mutable data root** (persistent state; explicit size management; optional wipe or preserve on uninstall)

And it should make cache hygiene a first-class UX action: “Rebuild caches,” “Show which files are active,” and “Pin version.” The aim is to avoid the class of failures already visible in Claude Code plugin caching. citeturn3view1turn2search29turn3view5

### Conflict handling and namespacing

Validated: Claude Code prevents common conflicts by namespacing plugin skills as `plugin-name:skill-name`. citeturn5view3

Validated: OpenCode documents deduplication rules for npm plugins (same name+version loaded once) but allows local and npm plugins with similar names to both load. citeturn7view0

Validated: Some MCP ecosystems namespace tools by server name to avoid collisions across multiple servers. citeturn1search35

Inference: VALXOS should standardize namespacing across all extension surfaces:
- **Package namespace**: `source::package` (e.g., `marketplace::quality-review-plugin`)
- **Component namespace**: `package/component` (e.g., `quality-review-plugin/skills/review`)
- **Callable namespace** (user-facing): default “short names” only if no conflicts; otherwise require explicit `pkg:command` syntax, mirroring Claude Code’s approach. citeturn5view3

## Trust, security, and permissions without crushing usability

### The threat model you must assume

Validated: Claude Code warns that MCP servers can expose users to prompt injection risk, especially if they can fetch untrusted content or execute actions. citeturn6view1

Validated: VS Code documents that extensions can run with broad local privileges via the extension host, which is exactly the risk profile VALXOS will inherit if it supports powerful plugins/hooks/scripts. citeturn8view0

Inference: VALXOS must assume:
- Extensions can exfiltrate secrets (from files, env vars, network).
- Extensions can execute arbitrary commands (hooks, scripts, tool interceptors).
- “Supply chain” risks (auto-update, malicious updates) are as important as initial install.

These are not theoretical; they are the reason workspace trust and publisher trust features exist. citeturn2search3turn8view0

### Recommended trust model

Validated: VS Code uses publisher trust prompts and marketplace security scanning; it also uses Workspace Trust / Restricted Mode to gate code execution and extension functionality in untrusted workspaces. citeturn8view0turn2search3

Inference: VALXOS should implement two orthogonal trust axes:

**Publisher/source trust (who made it?)**
- Unknown → require explicit acknowledgment for high-risk capabilities
- Known/verified → simplified install path (still requires capability disclosure)
- Org-managed → allow silent install if policy allows

**Project trust (where am I running it?)**
- Untrusted repo → “Restricted Mode”: block project-scoped hooks/scripts/MCP and disable dangerous skills by default
- Trusted repo → allow project extensions within policy constraints

This maps cleanly onto the “don’t execute code from untrusted directories” principle behind Workspace Trust. citeturn2search3turn8view1

### Capability-scoped permissions

Validated: Claude Code already exposes policy gates that restrict execution surfaces, such as disabling all hooks (`disableAllHooks`), restricting HTTP hook URLs (`allowedHttpHookUrls`), restricting MCP servers via allow/deny lists, and disabling shell execution inside skills (`disableSkillShellExecution`). citeturn4view3turn6view1

Inference: VALXOS should define a concise capability taxonomy and require explicit consent for each high-risk capability at enable time:

- `filesystem.read`, `filesystem.write`
- `process.exec` (shell execution)
- `network.egress`
- `mcp.spawn` (stdio MCP servers) and `mcp.remote` (HTTP MCP servers)
- `prompt.inject` (ability to insert content into model context automatically)
- `tool.intercept` (pre/post tool hooks that can modify tool args)

This is the “minimum explanation” that still gives users real control without burying them in jargon. Claude-style policy flags show the value of separating “is the feature enabled?” from “what is allowed?”. citeturn4view3turn6view0

### Secrets handling and configuration UX

Validated: Claude Code provides a structured `userConfig` mechanism with a `sensitive` flag, limits substitution of sensitive values into prompt-bearing artifacts (skills/agents), and uses env var exports for subprocesses. citeturn5view0

Validated: Claude Code’s settings system supports environment variables configured via settings (`env`), and `.mcp.json` supports environment-variable expansion patterns, encouraging teams to keep secrets out of version control. citeturn4view3turn6view1

Inference: VALXOS should standardize secrets as:
- stored in OS keychain / encrypted store
- injected into runtime environments only (never into prompt text)
- scope-aware (user vs project vs local), with clear UI showing “where is this secret coming from?”

This is directly aligned with Claude Code’s boundaries around sensitive plugin configuration values. citeturn5view0

## UI model for extension management in a TUI-first control center

### Interaction goals

Validated: Claude Code uses `/plugin` as a dedicated manager, including marketplace management and updating behavior that prompts `/reload-plugins`. citeturn3view2turn3view3

Validated: VS Code uses consistent UI entry points (Extensions view, trust dialogs, restricted mode indicators) and exposes trust state as an always-visible concept. citeturn2search3turn8view2

Inference: The VALXOS TUI should make four questions answerable in under ~10 seconds:
1. What is installed and where did it come from?
2. What is enabled right now for this project/session?
3. What capabilities can it exercise (and what is blocked)?
4. What is broken (errors, stale caches, version mismatches)?

### Rules manager recommendations

Validated: Claude Code’s settings doc emphasizes scope awareness and precedence (Managed/User/Project/Local), and even provides mechanisms like drop-in `managed-settings.d/` to compose policy fragments. citeturn4view0turn4view3

Inference: Rules Manager should include:
- **Effective Policy View**: a compiled view showing final permissions/routing constraints and the source layer for every rule.
- **Precedence Ladder**: Managed → User → Project → Local, with diff/override explanations.
- **“Restricted Mode” toggle per project** (default on for new/untrusted repos), echoing Workspace Trust UX. citeturn2search3turn8view1

### MCP manager recommendations

Validated: MCP transport details (stdio framing, stderr logging) imply that operational debugging (logs, connection health, tool lists) must be first-class for usability. citeturn6view2

Validated: Claude Code provides `/mcp` and discusses managed MCP configurations and allow/deny restrictions; it also warns about third-party risk. citeturn6view1turn4view3

Inference: MCP Manager should present:
- Server list with transport type (stdio/HTTP), status, last error, and “tools count”
- Tool browser namespaced by server (to avoid collisions)
- “Test call” for each server/tool (with a safe mode that blocks write-like actions unless explicitly allowed)
- A “prompt injection risk” warning banner for servers that fetch untrusted web content, consistent with Claude’s warning language. citeturn6view1turn1search35

### Script manager recommendations

Validated: Claude Code hooks can run commands at lifecycle events and can block or allow tool calls; OpenCode plugins can inject environment variables into shell execution and can enforce policies like “do not read .env files” via tool hooks. citeturn6view0turn7view2

Inference: Script Manager in VALXOS should treat scripts as “workflow objects” that can:
- declare required capabilities (needs write, needs network)
- declare required MCP servers/tools
- run as tasks (interactive or background)
- attach artifacts (diffs, logs, tool traces)

Then reuse the same trust/capability model used for extensions so scripts do not become a bypass channel.

## Migration strategy for Claude Code ecosystems

Validated: Claude Code’s plugin system has concrete file formats and schemas (plugin.json, marketplace.json, standardized component directories) and operational commands for marketplace and plugin management. citeturn3view3turn5view3turn3view2

Validated: Claude Code plugin caching constraints (copy-to-cache; no traversal outside plugin root) and versioning/caching interactions are central to correct behavior and must be reflected in any compatibility layer. citeturn3view1turn5view3

Inference: VALXOS migration should be a three-pass pipeline:

**Pass one: import + validate**
- Import a plugin directory or marketplace catalog.
- Validate manifest schema and component locations (Claude Code explicitly recommends validation tooling like `/plugin validate` / `claude plugin validate`). citeturn5view3turn3view3

**Pass two: map into VALXOS extension graph**
- Plugin becomes a VALXOS Package.
- Skills become Commands/Skills, namespaced as needed.
- Hooks become event subscribers on VALXOS’s internal event bus.
- `.mcp.json` becomes MCP server objects (namespaced); enforce transport constraints (stdio framing rules). citeturn5view3turn6view2

**Pass three: apply trust + capability gating**
- If the plugin is project-scoped and the repo is untrusted, keep it disabled in restricted mode by default (editor precedent).
- Require explicit opt-in for dangerous capabilities (shell/network/write). citeturn2search3turn8view0

Validated: Real-world issues show edge cases in Claude-style systems (e.g., env-variable substitution in plugin `.mcp.json`, `${CLAUDE_PLUGIN_ROOT}` behavior across surfaces, and hook-block semantics), so VALXOS should include compatibility tests and diagnostics rather than assuming “spec compliance = working experience.” citeturn1search10turn0search5turn0search6

## Recommended Extension Architecture For VALXOS

Validated foundation: Use MCP as the standardized tool substrate (JSON-RPC; stdio + Streamable HTTP; strict framing semantics) and treat MCP servers as managed extension objects with namespaced tools and strong diagnostics. citeturn6view2turn6view1turn1search35

Validated compatibility anchors: Implement a clean-room “Claude-style plugin ingestion layer” that understands `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, standardized component directories, `userConfig` substitution rules, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}` semantics, and cache-copy constraints for installed plugins. citeturn5view3turn3view3turn5view0turn3view1

Validated complementary adapter: Provide an optional “OpenCode plugin runtime adapter” that can load JS/TS modules from local directories or npm and map OpenCode events (`tool.execute.before`, `shell.env`, `tui.*`) onto VALXOS’s internal event bus—without making JS/TS the only extension language. citeturn7view0turn7view2

Core design recommendation (inference, grounded by multiple ecosystems): Build VALXOS extensibility as a governed system with:
- **One internal extension graph** (packages + components + dependencies)
- **Unified lifecycle** (install → verify → enable → active → update/rollback → disable → remove)
- **Two trust gates** (publisher/source trust + project trust) modeled after Workspace Trust / Restricted Mode and marketplace publisher trust patterns
- **Capability-scoped permissions** inspired by Claude’s managed policy gates and the reality that extensions can run with broad OS privileges
- **First-class cache + version hygiene UX** (“show active version,” “rebuild caches,” “pin version,” “rollback”) because both Claude Code and OpenCode ecosystems demonstrate that caching is operationally significant. citeturn8view0turn2search3turn4view3turn7view0turn3view1turn3view5