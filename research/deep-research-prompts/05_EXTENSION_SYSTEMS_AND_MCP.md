# Master Prompt: Extension Systems, MCP, Rules, And Script Manager Research

You are researching how `VALXOS Terminal` should handle extensibility.

Goal:
- Build a practical, unified extension story that can absorb Claude Code style plugins and also support VALXOS-native rules, scripts, MCP servers, agents, and skills

Research questions:
- What extension concepts already exist across Claude Code, OpenCode, MCP ecosystems, editor plugin systems, and agent runtimes?
- How should VALXOS model these extension types:
  - commands
  - hooks
  - agents
  - skills
  - MCP servers
  - rules or policy packs
  - scripts or automations
- What should be first-class versus merely supported through compatibility shims?
- How should installation, discovery, enable/disable, versioning, caching, local versus global scope, and conflict handling work?
- What UI patterns are best for a rules manager, MCP manager, and script manager?
- How should security, trust, and permissions be explained to users without crushing usability?

Deliverables:
- Unified extension model for VALXOS
- Compatibility layer recommendations
- Installation and scope model
- Trust and permission model
- UI model for extension management
- Migration strategy for users coming from Claude Code style ecosystems

Output format:
- Markdown
- Include tables for extension types and lifecycle states
- End with `Recommended Extension Architecture For VALXOS`
- Include source links

