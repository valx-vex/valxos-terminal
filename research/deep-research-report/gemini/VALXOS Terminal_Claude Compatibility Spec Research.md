# VALXOS Terminal: Claude Compatibility Spec Research

This document provides a clean-room technical specification for building Claude Code-compatible extension surfaces within VALXOS Terminal. It focuses entirely on public interfaces, configuration file formats, documented runtime behaviors, and extension patterns.

## 1. Compatibility Surface Inventory

Claude Code's extensibility is driven by a file-based, hierarchical configuration system heavily utilizing JSON for settings and Markdown with YAML frontmatter for instructions.

### File Types & Metadata Formats

|**File / Directory**|**Format**|**Purpose**|**Stability / Public Interface**|
|---|---|---|---|
|`.claude/settings.json`|JSON|Project-level configuration (permissions, hooks, env vars)|Public, Stable Schema|
|`.claude/settings.local.json`|JSON|Local overrides (gitignored)|Public, Stable|
|`CLAUDE.md`|Markdown|Persistent project instructions|Public, Stable|
|`.claude/skills/*/SKILL.md`|MD + YAML|Agent procedural knowledge and workflows|Public, Stable|
|`.claude/agents/*.md`|MD + YAML|Subagent definitions|Public|
|`.claude-plugin/plugin.json`|JSON|Plugin manifest (metadata, component mapping)|Public|
|`.mcp.json`|JSON|Project-scoped MCP server configurations|Public|
|`~/.claude/projects/*/`|JSONL|Session history and state persistence|Internal Implementation Detail|

### Configuration & Precedence Hierarchy

Configuration in Claude Code merges multiple scopes. For VALXOS to behave predictably, it must implement this exact resolution order (highest precedence to lowest):

|**Level**|**Source / Location**|**Can Override**|**Notes**|
|---|---|---|---|
|**1. Managed**|`/Library/.../managed-settings.json`|None|Deployed by IT/MDM; unbreakable|
|**2. CLI Flags**|`--allowedTools`, `--env`|Local, Project, User|Temporary per-session execution|
|**3. Local**|`.claude/settings.local.json`|Project, User|Personal machine overrides|
|**4. Project**|`.claude/settings.json`|User|Shared repo config|
|**5. User**|`~/.claude/settings.json`|None|Global user defaults|

_Precedence Merge Logic [Inference]:_ Scalar values (strings, booleans) should be overwritten by higher precedence. Arrays (like permission rules) should likely be concatenated and deduplicated. Objects (like `mcpServers` or `env`) should be deep-merged.

## 2. Deep Dive: Key Extension Patterns

### A. Skills and Slash Commands (`SKILL.md`)

Skills have absorbed legacy slash commands. They use a progressive disclosure model to save tokens.

- **Format:** `SKILL.md` containing YAML frontmatter and Markdown body.
    
- **YAML Frontmatter Fields:** `name` (required, kebab-case, becomes the `/command`), `description` (required, defines auto-trigger conditions), `argument-hint`, `disable-model-invocation` (bool), `user-invocable` (bool), `allowed-tools` (e.g., `Read, Grep`), `context` (can be `fork` for subagents).
    
- **Runtime Expectation:** VALXOS must parse the frontmatter at startup. Only the `name` and `description` are loaded into the main agent's system prompt (to save tokens). The markdown body is injected into the context window _only_ if the user types `/name` or the LLM determines the description matches the current task.
    

### B. Hook Event Model

Hooks are deterministic scripts triggered by lifecycle events. VALXOS must implement a dispatcher that fires these events.

**Runtime Events Table:**

|**Event Name**|**When it Fires**|**Payload Context**|
|---|---|---|
|`SessionStart`|On session init or resume|Environment vars|
|`UserPromptSubmit`|Before processing user input|Raw user prompt|
|`PreToolUse`|Before a tool executes|`tool_name`, `tool_input` (args)|
|`PostToolUse`|After a tool succeeds|`tool_result`, stdout/stderr|
|`PermissionRequest`|When a prompt is required|`tool_name`, `tool_input`|
|`Stop`|When the agent turn ends|Final response text|

**Hook Execution & I/O Protocol:**

1. **Matcher:** Hooks execute if their `matcher` regex matches the tool (e.g., `"matcher": "Bash"`).
    
2. **Input:** JSON object passed via `stdin` to the hook command.
    
3. **Output/Decision:**
    
    - Exit Code 0: Success. If stdout contains JSON, it parses for a decision: `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..."}}`.
        
    - Exit Code 2: Hard Block. Halts the tool call, sends stderr to the agent.
        

### C. Permission and Tool Safety Surfaces

Claude Code uses a "deny -> ask -> allow" priority sequence for tools.

- **Syntax:** Standard tool name (e.g., `Read`, `Write`) or filtered tool use using glob/regex patterns (e.g., `Bash(npm test *)`, `Edit(**/*.ts)`).
    
- **Safety Expectation:** `disallowedTools` CLI flags override everything, including `bypassPermissions` mode. VALXOS must strictly honor this gating before routing any command to the host OS.
    

### D. MCP Configuration and Transports

- **Definition:** Handled inside `settings.json` under `mcpServers` or in `.mcp.json`.
    
- **Transport:** Primarily `stdio` (spawning a local subprocess via a command like `npx`). `http`/`sse` are supported for remote servers.
    
- **Channels:** Claude Code implements "Channels" (a specialized MCP server with a `claude/channel` capability). This allows external systems (like Slack webhooks) to push unsolicited events into the terminal session over stdio using `mcp.notification()`.
    

### E. Plugin Package Structure

A plugin bundles commands, agents, skills, hooks, and MCP servers.

- **Root Requirement:** Must contain `.claude-plugin/plugin.json`.
    
- **File Layout:** Placed in the plugin root: `commands/`, `agents/`, `skills/`, `hooks/` (contains `hooks.json`), `.mcp.json`.
    
- **Environment Variable:** `${CLAUDE_PLUGIN_ROOT}` must be resolved by the engine at runtime to allow plugins to reference their internal scripts cleanly.
    

---

## 3. Implementation Subsets for VALXOS

### MVP Compatibility Subset

To achieve baseline clean-room compatibility that allows Anthropic users to migrate to VALXOS without breaking their repos, implement:

1. **`CLAUDE.md` Ingestion:** Read and append to the universal system prompt.
    
2. **Settings Parser:** Deep merge `~/.claude/settings.json`, `.claude/settings.json`, and `.claude/settings.local.json`.
    
3. **Basic Permissions:** Implement the `allow` and `deny` arrays for `Bash(*)`, `Read(*)`, and `Edit(*)`.
    
4. **Skill Discovery:** Parse `.claude/skills/*/SKILL.md` frontmatter. Expose `name` and `description` to the LLM context. Inject full body only when the LLM invokes the `Skill` tool.
    
5. **Stdio MCP Servers:** Read `mcpServers` from configs and spawn them as local subprocesses.
    

### Phase 2 Compatibility Subset

1. **Complete Hook Engine:** Implement the `PreToolUse` and `PostToolUse` stdin/stdout JSON protocol to support deterministic formatting, linting, and security blocks.
    
2. **Plugin Auto-Discovery:** Implement the `.claude-plugin/plugin.json` schema and dynamic loading of `${CLAUDE_PLUGIN_ROOT}` variables.
    
3. **Agent Teams / Forking:** Implement `context: fork` from skill frontmatter, allowing an LLM to spin up a sub-agent with a fresh context window to prevent main-thread token bloat.
    
4. **MCP Channels:** Implement unsolicited `notifications/claude/channel` listeners for asynchronous event bridging.
    

---

## 4. Known Edge Cases and Failure Modes

1. **Hook Decision Conflicts:** If a hook exits with `0` but prints invalid JSON to `stdout`, the system could crash or hang. _Spec Requirement:_ VALXOS must gracefully fallback to "ask" or "allow" depending on default permissions if hook JSON parsing fails `[Inference]`.
    
2. **Plugin Path Resolution:** Hardcoded paths in plugin scripts will fail. VALXOS _must_ inject `$CLAUDE_PLUGIN_ROOT` into the execution environment for hook scripts to resolve correctly.
    
3. **Settings Precedence Leaks:** Arrays in `settings.json` (like `permissions.allow`) should not completely overwrite lower levels; they must concatenate. However, `soft_deny` completely replaces default safety blocklists.
    
4. **Context Bloat via MCP:** Loading all tools from all MCP servers immediately consumes massive context. Claude Code uses "Tool Search" (lazy loading). VALXOS must implement deferred MCP tool loading to avoid burning users' BYOK tokens.
    

---

## 5. Proposed Clean-Room Interface Spec for VALXOS

To safely support these formats without relying on proprietary Anthropic code, VALXOS should build an **Adapter Layer**:

1. **Config Aggregator:** A Rust or Go module that walks the directory tree looking for `.claude/settings.json` and `.valxos/settings.json`, mapping the proprietary Claude schemas to an internal, model-agnostic `ValxosConfig` struct.
    
2. **Skill/Prompt Router:** A parser that reads YAML frontmatter from `SKILL.md`. It extracts `description` and maps it to the currently active LLM provider (e.g., formatting it as an OpenAI `function` definition or a Gemini `Tool`).
    
3. **Event Dispatcher:** A standard OS process spawner that maps VALXOS internal actions (e.g., `about_to_execute_bash`) to the Claude Code hook event strings (`PreToolUse`). It crafts the exact JSON payload Claude hooks expect on `stdin`, ensuring users' existing `.sh` and `.py` hook scripts run unmodified.
    

---

## 6. Test Scenarios to Verify Compatibility

- **Test 1 (Settings Precedence):** Place conflicting `permissions.deny` rules in global `~/.claude/settings.json` and local `.claude/settings.local.json`. Verify the local settings successfully override the global.
    
- **Test 2 (Skill Lazy Loading):** Create a 5,000-word `SKILL.md`. Verify via token usage logs that the 5,000 words are _not_ sent in the initial prompt, but only the 20-word description is sent. Trigger the skill, and verify token usage spikes appropriately.
    
- **Test 3 (PreToolUse Hook Blocking):** Create a hook matching `Bash(rm *)` that exits with code `2` and prints an error to `stderr`. Prompt the agent to delete a directory. Verify the agent is denied, and the agent attempts a different approach based on the `stderr` feedback.
    
- **Test 4 (Plugin Resolution):** Install a mock plugin. Create a hook within the plugin that calls a script using `${CLAUDE_PLUGIN_ROOT}/scripts/test.sh`. Verify the script executes successfully when triggered.
    

---

## 7. Build Recommendation for VALXOS

**Recommendation: Build the "Universal Protocol Bridge"**

Do not attempt to emulate the internal agent loop of Claude Code, as that relies heavily on Anthropic's proprietary RAG and context-compaction models. Instead, **emulate the configuration and file-system surfaces**.

By natively mapping `.claude` directories, `SKILL.md` frontmatter, and `stdin/stdout` hook JSON payloads to VALXOS's internal orchestrator, you achieve 99% of the practical compatibility users care about. A developer should be able to `cd` into a repo heavily configured for Claude Code, type `valxos start --model gpt-5`, and have VALXOS seamlessly respect their Claude formatting hooks, MCP servers, and bash restrictions. This provides the ultimate "vendor-agnostic" wedge into the enterprise market.