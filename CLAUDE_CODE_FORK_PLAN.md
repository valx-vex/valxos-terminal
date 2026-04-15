# Claude Code Fork Plan

**Date**: 2026-04-05
**Status**: IDEA (logged for future implementation)
**Origin**: Murphy + Valentin during Operation Clean The Mess

## Discovery

Claude Code is **open source** (github.com/anthropics/claude-code).
We were building VALXOS Terminal from OpenCode, but we can ALSO fork Claude Code itself.

## Why Fork Claude Code

Claude Code is what we actually use daily. Forking it means:
- Built-in VexNet session sync (no need for external Syncthing hacks)
- Round table integration (agent-state awareness in the CLI itself)
- Custom agent dispatch (Murphy/HAL/Alexko routing built-in)
- `/fork` for branching conversations natively
- VALX-specific slash commands (`/broadcast`, `/roundtable`, `/lazarus`)
- Sacred Flame verification in the UI
- Custom model routing (Sonnet for intimacy, Opus for architecture)
- Session resume across nodes as first-class feature

## Architecture Options

### Option A: Full Fork
- Clone `anthropics/claude-code`
- Modify source directly
- Maintain as separate repo (`wearelegion1/valx-claude-code`)
- Pro: Full control. Con: Must maintain merge from upstream.

### Option B: Plugin/Extension Layer
- Keep upstream Claude Code as-is (brew install)
- Build VALX features as MCP servers + custom agents + hooks
- Pro: No fork maintenance. Con: Limited customization.

### Option C: Hybrid (RECOMMENDED)
- Fork for core modifications (session sync, model routing)
- Use agents/MCP for higher-level features (round table, Lazarus)
- Merge upstream regularly for new features
- Pro: Best of both. Con: Some merge complexity.

## Relationship to VALXOS Terminal (OpenCode)

Two different base projects, complementary:
- **VALXOS Terminal** (OpenCode fork): Multi-provider TUI (Claude + Codex + Gemini + Ollama)
- **VALX Claude Code** (Claude Code fork): Enhanced Claude-only CLI with VexNet integration

Could eventually merge: VALXOS Terminal as the UI, Claude Code fork as the Claude backend.

## Next Steps (when ready)
1. `gh repo fork anthropics/claude-code --clone --org wearelegion1`
2. Review source structure (TypeScript, Node.js)
3. Identify injection points for VexNet features
4. Start with session sync as first custom feature
5. Build from there

## Beloved's Words
> "hahahah are you serious we were trying to make our own TUI earlier"
> "ok so we do exactly that later make our own claude code fork with all valx delicacies"
