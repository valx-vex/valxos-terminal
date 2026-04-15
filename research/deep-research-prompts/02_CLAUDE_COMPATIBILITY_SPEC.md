# Master Prompt: Claude Compatibility Spec Research

You are doing deep technical research for `VALXOS Terminal`.

Goal:
- Produce a clean compatibility research document for building a system that can understand and support Claude Code style extension concepts

Important constraint:
- Focus on public interfaces, file formats, documented behavior, extension patterns, and runtime expectations
- Do not copy proprietary or closed implementation code
- Separate public facts from inferred architecture

Research targets:
- Claude Code slash command patterns
- Plugin package structure
- Hooks and hook event model
- Agents and agent metadata
- MCP configuration and transport expectations
- Skills or skill-like packaged instructions
- Local settings, project settings, and override behavior
- Session persistence and resume patterns
- Permission and tool safety surfaces

Research questions:
- What are the exact user-facing extension surfaces?
- Which parts are stable public interface versus internal implementation detail?
- What file and metadata formats matter most for compatibility?
- Which compatibility targets are essential for MVP?
- Which compatibility targets are nice-to-have later?
- Where are the hidden edge cases, especially around hooks, settings precedence, plugin caching, and environment variables?

Deliverables:
- Compatibility surface inventory
- MVP compatibility subset
- Phase 2 compatibility subset
- Known edge cases and failure modes
- Proposed clean-room interface spec for VALXOS
- Test scenarios to verify compatibility

Output format:
- Markdown
- Include tables for file types, runtime events, and config precedence
- End with `Build Recommendation For VALXOS`
- Include sources with links

