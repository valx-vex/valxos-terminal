# VALXOS Starter Pack

This is a starter implementation pack for Codex to begin the VALXOS Terminal build phase.

## What is implemented
- workspace scaffold for a control-plane-first build
- `.claude` compatibility parsers for `CLAUDE.md`, `settings.json`, `settings.local.json`, `SKILL.md`, and `.claude-plugin/plugin.json`
- route heuristic skeleton for Anthropic / OpenAI / Gemini / Ollama
- permission evaluator using allow/deny/ask rule arrays
- hook runner skeleton using stdin/stdout JSON protocol
- stdio MCP host skeleton
- handover artifact generator for transcript continuity
- example repo to test compatibility surfaces

## What is not implemented yet
- real provider API adapters
- full TUI / block UI
- full MCP JSON-RPC negotiation
- plugin lifecycle manager
- sandboxing and OPA / Rego enforcement
- lazy MCP tool search and semantic cache

## Quick start
```bash
pnpm install
pnpm --filter @valxos/cli dev doctor --cwd ./examples/repo
pnpm --filter @valxos/cli dev route --prompt "Analyze repo and plan refactor" --contextSize huge
pnpm --filter @valxos/cli dev start --cwd ./examples/repo --provider openai
pnpm --filter @valxos/cli dev permission --cwd ./examples/repo --tool Bash --input "rm -rf tmp"
```

## Suggested Codex next moves
1. replace stub provider adapters with real SDK-backed adapters
2. implement real MCP JSON-RPC framing and tool discovery
3. add a proper block-based TUI app
4. add deterministic hook discovery from plugin roots and settings files
5. add test matrix for settings precedence, lazy skill loading, hook block behavior, plugin root resolution, and MCP spawn resilience
