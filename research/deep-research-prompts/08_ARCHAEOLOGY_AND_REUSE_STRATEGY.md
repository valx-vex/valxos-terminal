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

