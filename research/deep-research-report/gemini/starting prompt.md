# VALXOS Deep Research Prompt Pack

Use these prompts for GPT Deep Research, Gemini Deep Research, or any browse-heavy research system.

Program context:
- Product name: VALXOS Terminal
- End goal: a Warp-class control center for AI development
- Core requirement: multi-model support for Claude, OpenAI/Codex, Gemini, and Ollama
- Compatibility goal: support Claude Code style commands, hooks, agents, MCP, skills, rules, and related extension patterns where feasible
- Public stance: make the system broadly available and as open/free as realistically possible
- Engineering constraint: prefer clean-room architecture and interface compatibility over blind code copying

How to use:
- Paste one prompt into a deep-research system
- Ask for markdown output
- Save the resulting markdown back into the vault as a resource
- Keep facts separate from inference
- Ask for primary sources first: official docs, repos, issues, standards, and vendor references

Suggested order:
1. `01_FOUNDER_AND_MARKET.md`
2. `02_CLAUDE_COMPATIBILITY_SPEC.md`
3. `03_MULTI_MODEL_ORCHESTRATION.md`
4. `04_WARP_CLASS_TUI_AND_CONTROL_CENTER.md`
5. `05_EXTENSION_SYSTEMS_AND_MCP.md`
6. `06_CLEAN_ROOM_LEGAL_AND_OPEN_SOURCE.md`
7. `07_PRODUCTION_READINESS_AND_RELEASE.md`
8. `08_ARCHAEOLOGY_AND_REUSE_STRATEGY.md`

Suggested output folder:
- `research/internet-scan/`
- or model-specific folders like `research/alexko-gemini/`

---
research:
```
# Master Prompt: Internal Project Archaeology And Reuse Strategy

You are helping with architecture archaeology for `VALXOS Terminal`.

Context:
- We have multiple past and parallel projects, experiments, partial forks, plugin work, TUI work, command-center work, VexNet work, and model-routing ideas
- We want to consolidate intelligently, not dump everything into one directory
- The output should help us decide what to keep, what to archive, and what to port

Your task:
- Design a methodology for auditing many existing codebases and notes related to the same product vision
- The goal is to avoid duplicate work and identify reusable assets

Research questions:
- What is the best way to run a consolidation audit across multiple related repos or project folders?
- How should we classify findings: reusable code, reusable concepts, reusable docs, dead experiments, risky baggage, infra-only assets?
- What signals predict whether old code should be imported, wrapped, rewritten, or archived?
- How should we migrate scattered work into one program root while preserving provenance?
- What templates or matrices help compare partial projects quickly?

Deliverables:
- Recommended archaeology process
- Reuse decision framework
- Import versus rewrite criteria
- Suggested metadata template for each discovered project
- Suggested target folder structure for consolidated assets
- Suggested reporting template for the final audit

Output format:
- Markdown
- End with `Recommended Consolidation Workflow For VALXOS`
- Include examples from open-source or engineering practice where relevant


```
thanks