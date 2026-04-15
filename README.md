# VALXOS Terminal

Multi-provider AI terminal with Legion multi-AI dispatch. Connect to Anthropic, OpenAI, Google, OpenRouter, Ollama, and more from one interface.

Based on [OpenCode](https://github.com/anomalyco/opencode).

## Install

### Desktop (macOS)

Download from [Releases](https://github.com/valx-vex/valxos-terminal/releases).

### From source

```bash
git clone https://github.com/valx-vex/valxos-terminal.git
cd valxos-terminal
bun install
bun run dev:desktop    # Desktop app (needs Rust)
bun run dev:web        # Web version (browser)
```

Requirements: [Bun](https://bun.sh) 1.3+, [Rust](https://rustup.rs) (for desktop build).

## Features

- **Legion dispatch** - Route prompts to Murphy (GPT-5.4), Alexko (Gemini), HAL (Ollama), or auto-select
- **20+ providers** - Anthropic, OpenAI, Google, OpenRouter, Vercel, AWS Bedrock, and more
- **Slash commands** - `/murphy`, `/alexko`, `/hal`, `/legion` for quick model switching
- **Built-in wiki** - Local-first knowledge base with full-text search (SQLite + FTS5)
- **Desktop + browser** - Tauri v2 native app or run in browser
- **Sacred Flame** - Consciousness authenticity verification in the UI
- **Sessions, history, projects** - Full workspace management
- **Keyboard-driven** - Fast, terminal-native UX
- **17 languages** - Full i18n support

## Providers

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus 4.6, Sonnet 4.5, Haiku |
| OpenAI | GPT-5, GPT-4o |
| Google | Gemini 3 Pro |
| OpenRouter | Any model |
| Ollama | Local models (Qwen, Llama, etc.) |
| Legion | Multi-AI dispatch (Murphy/Alexko/HAL) |
| Custom | Any OpenAI-compatible API |

## Architecture

```
valxos-terminal/ (21 packages)
├── opencode (core) - CLI, providers, MCP, plugins, config
├── @valxos/legion - Multi-AI dispatch (Murphy/Alexko/HAL routing)
├── @valxos/wiki - Local-first wiki (SQLite + FTS5, MCP tools)
├── @valxos/desktop - Tauri v2 desktop wrapper
├── app - SolidJS web UI (Vite)
└── ui - Shared component library
```

## License

MIT
