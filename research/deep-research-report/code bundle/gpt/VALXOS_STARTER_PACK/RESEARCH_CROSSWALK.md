# Research Crosswalk

## Implemented in this starter pack
- `.claude` settings precedence loader (managed/user/project/local/cli shape)
- `CLAUDE.md` ingestion
- `SKILL.md` discovery with frontmatter + body separation
- `.claude-plugin/plugin.json` discovery
- route heuristic for Anthropic / OpenAI / Gemini / Ollama
- permission evaluator for allow / deny / ask rules
- hook stdin/stdout execution skeleton
- stdio MCP host skeleton
- handover artifact generator for transcript continuity

## Explicitly deferred
- real provider API calls
- full TUI / Warp-class cockpit
- MCP lazy tool search and JSON-RPC negotiation details
- OPA/Rego policy engine
- semantic caching / token budget manager
- parallel thin-agent worker orchestration and file locks

## Why deferred
The pack is designed to maximize Codex boot velocity.
It creates stable seams first, then lets Codex deepen the implementation in the correct order.
