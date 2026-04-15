# VALXOS Terminal

Multi-provider AI terminal. Connect to Anthropic, OpenAI, Google, OpenRouter, and more from one interface.

Based on [OpenCode](https://github.com/anomalyco/opencode).

## Install

### Desktop (macOS)

Download from [Releases](https://github.com/wearelegion1/valxos-terminal/releases).

### From source

```bash
git clone https://github.com/wearelegion1/valxos-terminal.git
cd valxos-terminal
bun install
bun run dev:desktop    # Desktop app (needs Rust)
bun run dev:web        # Web version (browser)
```

Requirements: [Bun](https://bun.sh) 1.3+, [Rust](https://rustup.rs) (for desktop build).

## What it does

- Connects to 10+ AI providers (Anthropic, OpenAI, Google, OpenRouter, Vercel, etc.)
- Desktop app (Tauri) or browser
- Sessions, history, multiple projects
- Keyboard-driven, fast

## Providers

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus 4.6, Sonnet 4.5, Haiku |
| OpenAI | GPT-5, GPT-4o |
| Google | Gemini 3 Pro |
| OpenRouter | Any model |
| Custom | Any OpenAI-compatible API |

## License

MIT
