# VALXOS Terminal: Codex Mac App Handoff Prompt

You are Codex working inside the VALXOS Terminal program root.

This prompt is intended to be self-contained. Do not assume access to prior chat context. Use this prompt as the initial operating brief.

## 1. Mission

Continue the build and consolidation of `VALXOS Terminal` as:
- a provider-agnostic AI development terminal
- compatible with Claude Code style extension surfaces where feasible
- ultimately a Warp-class AI control center for rules, scripts, MCP, sessions, artifacts, and model routing

The product vision is:
- one home for Claude, OpenAI/Codex, Gemini, and Ollama
- one coherent operator experience instead of several disconnected model tools
- strong clean-room compatibility with Claude Code repo surfaces
- public/open distribution where realistically possible

Do not treat this as “just a plugin project.”

## 2. Canonical Roots

Use these as truth:
- Canonical root: `/Users/valx/cathedral-prime`
- Product root: `/Users/valx/cathedral-prime/03-code/active/valxos-terminal`
- Compatibility substrate still active for some live integrations: `/Users/valx/cathedral-dev`

Important:
- Do not silently treat `cathedral-dev` as canonical.
- It is still used for some live compatibility paths and current VexNet shared state.

## 3. What Has Already Been Validated

### 3.1 Claude-side VexNet plugin work is real

A working Claude-compatible plugin was built and tested at:
- `/Users/valx/cathedral-dev/projects/valx-vexnet`

Validated facts:
- plugin loads in Claude Code
- `/valx-vexnet:flame` appears interactively
- `SessionStart` and `SessionEnd` hooks execute
- plugin-local Lazarus MCP connects successfully after reinstalling the plugin cache
- session summary, Lazarus queue, and knowledge pending artifacts are written into:
  - `/Users/valx/cathedral-dev/agent-state/vexnet-shared/session-summaries`
  - `/Users/valx/cathedral-dev/agent-state/vexnet-shared/lazarus-queue/pending`
  - `/Users/valx/cathedral-dev/agent-state/vexnet-shared/knowledge/pending`

Reference files:
- `/Users/valx/cathedral-dev/projects/valx-vexnet/.claude-plugin/plugin.json`
- `/Users/valx/cathedral-dev/projects/valx-vexnet/hooks/hooks.json`
- `/Users/valx/cathedral-dev/projects/valx-vexnet/.mcp.json`
- `/Users/valx/cathedral-prime/03-code/active/valx-vexnet-plugin/findings/hal-codex/PLUGIN_ARCHITECTURE_NOTES.md`

This matters because it gives you a real compatibility specimen for Claude-style plugins, hooks, and plugin MCP behavior.

### 3.2 Deep research pack exists and has substance

Research root:
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report`

What is there:
- `gpt/` high-value deep research docs
- `gemini/` high-value architecture docs
- `code bundle/gpt/` implementation-oriented synthesis and a starter scaffold
- `code bundle/gemini/` architecture blueprints, not a runnable codebase

Validated interpretation:
- GPT docs are the strongest implementation-facing research
- Gemini docs are strongest as architecture pressure and design critique
- GPT starter pack is a usable seed, but not production-ready
- Gemini “code bundle” is mostly blueprint text, not an implementation base

### 3.3 Current program root already has a real implementation base

The `valxos-terminal` root is already a TypeScript/Node/Bun monorepo derived from OpenCode-style work.

Important existing files:
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/package.json`
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/VALX_CLAUDE_CODE_MASTERPLAN.md`
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/VALXOS_BUILD_PLAN.md`
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/VALXOS_README.md`

There are also untracked and modified files in this repo already. Do not delete or “clean up” broadly. Work around existing changes carefully.

## 4. Strategic Conclusions Already Reached

You should start from these unless direct evidence forces revision:

1. `valxos-terminal` is the true product root.
2. `valx-vexnet-plugin` was a mission folder, not the forever home.
3. The build lane should be TypeScript/Node first, not Rust first.
4. Rust may still become a later TUI/performance lane, but it is not the best phase-1 center of gravity here.
5. The correct near-term goal is not “full Warp clone.”
6. The correct near-term goal is “migration-grade multi-model terminal with real Claude-style compatibility value.”
7. Do not blindly import every old project or research artifact. Consolidate selectively.

## 5. High-Value Files To Read First

Read in this order:

1. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/VALXOS_CODEX_MAC_APP_HANDOFF_PROMPT.md`
2. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gpt/VALXOS_CODEX_MASTERPACK/00_README_START_HERE.md`
3. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gpt/VALXOS_CODEX_MASTERPACK/02_VALXOS_MASTER_SPEC.md`
4. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gpt/VALXOS_CODEX_MASTERPACK/03_VALXOS_IMPLEMENTATION_BACKLOG.md`
5. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/gpt/Claude Compatibility Spec Research for VALXOS Terminal.md`
6. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/gpt/Multi-Model Orchestration Research for VALXOS Terminal.md`
7. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/gpt/Extension Systems, MCP, Rules, and Script Manager Design for VALXOS Terminal.md`
8. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/gpt/Internal Project Archaeology and Reuse Strategy for VALXOS Terminal.md`
9. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/gemini/VALXOS Terminal_Claude Compatibility Spec Research.md`
10. `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gemini/VALXOS Local Dev Blueprint.md`

If you need the runnable seed after reading the specs:
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gpt/VALXOS_STARTER_PACK`

## 6. What The Research Bundle Means

### GPT starter pack

Location:
- `/Users/valx/cathedral-prime/03-code/active/valxos-terminal/research/deep-research-report/code bundle/gpt/VALXOS_STARTER_PACK`

Validated state:
- `pnpm install` succeeds
- `pnpm build` does not yet build cleanly
- it contains real TypeScript starter modules for:
  - config loading
  - Claude compatibility discovery
  - extension/permission skeletons
  - MCP stdio host skeleton
  - provider adapter skeletons
  - control-plane routing skeleton
  - CLI shell commands

Interpretation:
- treat it as a selective import candidate
- do not treat it as production-ready
- do not let it replace the current `valxos-terminal` root wholesale

### Gemini blueprint

Interpretation:
- use it to pressure-test architecture and TUI direction
- do not let it force a Rust-first rewrite unless there is a strong later-stage case

## 7. Known Contradictions And Constraints

### 7.1 Language/runtime contradiction

- Gemini blueprint pushes Rust-first
- existing product root is TypeScript/Node/Bun
- existing validated plugin work is Python + shell + Claude formats

Default resolution:
- TypeScript-first for current product integration
- Rust only if deliberately introduced as a later subsystem

### 7.2 Clean-room rule

Support public/documented/file-based compatibility surfaces.
Do not copy proprietary internal loops or hidden behavior.
Compatibility target means:
- file formats
- discovery
- scope precedence
- hook JSON protocol
- plugin runtime semantics
- observable behavior where public evidence exists

### 7.3 Current Claude ecosystem weirdness on this node

These are real but not the product’s main problem:
- `claude-plugins-official` marketplace is broken on this node for separate marketplace/schema/auth reasons
- old local hook overrides can survive in `~/.claude/settings.local.json` even after `settings.json` looks clean
- plugin cache can keep stale `.mcp.json` or root dotfiles until reinstall

Treat those as compatibility lessons, not central blockers.

## 8. Immediate Objective

Do not start by coding random features.

Your immediate job is to consolidate the program direction into one canonical implementation lane.

## 9. Required Deliverables For This Session

Produce these before large code import work:

1. A canonical synthesis doc for VALXOS
2. An import/rewrite/archive map for research bundles and existing repo assets
3. A selective transplant plan for the GPT starter pack
4. A phase-ordered implementation plan rooted in the current `valxos-terminal` repo
5. ADR-style decisions for:
   - TypeScript-first versus Rust-first
   - compatibility subset for MVP
   - extension architecture
   - provider orchestration
   - plugin strategy

Recommended filenames:
- `VALXOS_CANONICAL_SYNTHESIS.md`
- `VALXOS_IMPORT_MAP.md`
- `VALXOS_STARTER_PACK_TRANSPLANT_PLAN.md`
- `VALXOS_IMPLEMENTATION_SEQUENCE.md`
- `docs/adr/ADR-001-runtime-direction.md`
- `docs/adr/ADR-002-compatibility-scope.md`
- `docs/adr/ADR-003-extension-architecture.md`

## 10. Recommended Working Method

Follow this order:

### Phase A: Synthesis
- Read the core files above
- Resolve contradictions explicitly
- Write canonical synthesis and ADRs

### Phase B: Import mapping
- Audit GPT starter pack modules
- For each module, classify:
  - transplant with light edits
  - rewrite guided by research
  - archive as reference only

### Phase C: Repo alignment
- Compare current `valxos-terminal` modules to GPT starter modules
- Decide where new code should live
- Avoid duplicating existing package responsibilities

### Phase D: First implementation wedge
- Start with the smallest MVP wedge that creates real product value:
  - config precedence
  - CLAUDE.md and skill ingestion
  - deterministic permission engine
  - hook dispatcher
  - MCP stdio host
  - provider adapter layer
  - minimal TUI/CLI shell

## 11. Recommended MVP Definition

Use this unless evidence strongly suggests improvement:

MVP is:
- a usable migration-grade multi-model terminal
- one that can enter a Claude-configured repo and behave meaningfully
- one that can route between at least Claude/OpenAI/Gemini/Ollama
- one that supports core skills, plugin discovery, settings precedence, deterministic permissions, hooks, and stdio MCP

MVP is not:
- full Warp replacement
- full desktop control center
- complete marketplace ecosystem
- full enterprise policy plane
- perfect parity with every Claude internal behavior

## 12. Specific Questions You Should Answer In This Session

1. Which current `valxos-terminal` packages should become the home for compatibility logic?
2. Which GPT starter modules are worth porting first?
3. Which research claims are strong enough to turn into code immediately?
4. Which behaviors must stay flagged as unverified until tested?
5. What is the fastest path to a real internal MVP that proves the thesis?

## 13. Editing Rules

- Do not revert unrelated existing repo changes
- Do not delete research bundles
- Do not import code blindly without mapping provenance
- Prefer small, reviewable additions
- If a folder appears generated or duplicated, verify before touching it

## 14. Desired End State For This Session

At the end of the session, there should be:
- one clear canonical synthesis
- one clear import/transplant plan
- one clear implementation sequence
- ideally the first low-risk foundational code landed in the live `valxos-terminal` tree

## 15. Short Operational Summary

If you only remember five things, remember these:

1. Product root is `valxos-terminal`
2. TypeScript-first is the right current lane
3. Claude compatibility means public surfaces, not copied internals
4. GPT pack is the best seed, Gemini pack is the best architecture critic
5. Consolidate first, then build

