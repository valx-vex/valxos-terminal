# Master Prompt: Multi-Model Orchestration Research

You are researching the model-routing and orchestration layer for `VALXOS Terminal`.

Context:
- VALXOS should support Claude, OpenAI/Codex, Gemini, and Ollama
- It should feel like one coherent terminal, not four glued-together apps
- It should support provider switching, model-specific strengths, and shared workflows

Research questions:
- What are the best known patterns for multi-provider AI terminals?
- How should model selection work in a way that is simple for users but powerful for experts?
- What are the tradeoffs between one unified abstraction layer versus provider-specific feature escape hatches?
- How should routing work for tasks like coding, search, long-context analysis, local/private inference, and cheap background jobs?
- How should credentials, quotas, latency, token costs, and failure handling be surfaced?
- How should transcript continuity work when multiple models participate in one workflow?
- Which ideas from routers, agent runtimes, or orchestration frameworks are worth borrowing?

Deliverables:
- Recommended orchestration architecture
- Common abstraction model
- Required provider-specific escape hatches
- Routing heuristics for real workflows
- Failure and fallback strategy
- Cost and latency strategy
- Session continuity strategy
- Recommended MVP and post-MVP roadmap

Output format:
- Markdown
- Include at least one proposed architecture diagram in ASCII or structured bullets
- End with `Recommended Control Plane For VALXOS`
- Include sources with links

