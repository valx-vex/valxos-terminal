```
# VALXOS Local Dev Blueprint
**Context for CLI Agents (Codex/Gemini/Claude):** You are tasked with generating the core Rust (`ratatui` + `tokio`) implementation for the VALXOS Terminal based on the architecture described below. Do not generate stubs; generate production-ready, modular Rust code.

## 1. The TUI State Machine (The Elm Pattern)
VALXOS uses a strict Component/Elm Architecture to ensure sub-16ms rendering latency. 
**Task:** Create `crates/valxos-tui/src/app.rs` and `crates/valxos-tui/src/ui.rs`.
* Define a global `enum Message { LlmToken(String), CommandBlocked(String), UserInput(String) }`.
* The `App` struct must maintain the `input_buffer`, a list of `chat_blocks`, and an `active_mcp_servers` list.
* Implement an `update(&mut self, msg: Message)` function to handle state mutations.
* The UI must be split into three Ratatui panes: A left sidebar for Context/Rules, a main central area for the Transcript/Diffs, and a bottom input palette.

## 2. The Universal Message Format (UMF) & Routing
VALXOS must abstract OpenAI, Anthropic, Gemini, and Ollama behind a single canonical trait.
**Task:** Create `crates/valxos-core/src/umf.rs` and `crates/valxos-core/src/providers/mod.rs`.
* Define `ValxosInferenceRequest` containing the model string, temperature, and a standardized vector of `ValxosMessage` (role/content).
* Implement the `LlmProvider` trait with an async `complete` function.
* **Crucial:** Implement an "Escape Hatch" mechanism in the trait (`fn supports_feature(&self, feature: &str) -> bool`). If the user requests Anthropic's "Extended Thinking" or Gemini's 2M context window, the UMF must allow bypassing standard context compaction.

## 3. The Hook & Permission Sandbox
We must respect Claude Code's deterministic JSON hook protocol and OpenCode's strict permissions.
**Task:** Create `crates/valxos-security/src/sandbox.rs` and `crates/valxos-security/src/hooks.rs`.
* Implement a function `evaluate_tool_permission(tool_name: &str, input: &str) -> PermissionState`. It must return `Allow`, `Ask`, or `Deny` based on regex matchers in the config.
* Implement the Hook runner: Spawn a `bash` subprocess for the hook script, inject `$CLAUDE_PLUGIN_ROOT`, write the tool payload to `stdin` as JSON, and await the exit code.
* If `exit 0`, the tool runs. If `exit 2`, the tool is hard-blocked and `stderr` is captured to be fed back to the LLM.

## 4. MCP (Model Context Protocol) Host
VALXOS natively connects to external data sources via MCP over `stdio`.
**Task:** Create `crates/valxos-mcp/src/host.rs`.
* Build an async JSON-RPC 2.0 client.
* Implement the initialization handshake (`initialize` request -> `initialized` notification).
* Implement tool discovery (`tools/list`). Ensure tool schemas are dynamically mapped into the active LLM provider's specific function-calling format.

**Agent Execution Directive:** Begin by scaffolding the workspace `Cargo.toml` with `ratatui`, `tokio`, `serde`, and `anyhow`. Then, implement the TUI State Machine (Section 1) followed by the Hook Runner (Section 3) to establish the safety boundaries.
```