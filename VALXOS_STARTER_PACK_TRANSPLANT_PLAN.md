# VALXOS Starter Pack Transplant Plan

## Rules

- Do not import the starter-pack package layout.
- Do not replace live packages with starter-pack folders.
- Recreate only the behavior that improves the active runtime.

## Phase-1 Transplants

1. Config precedence cases
   Land inside `packages/opencode/src/config` and `packages/opencode/test/config`.

2. Claude compatibility parsing ideas
   Land inside `packages/opencode/src/compat/claude`.

3. Sanitized compat fixtures and tests
   Land inside `packages/opencode/test/compat`, `packages/opencode/test/config`, and `packages/opencode/test/agent`.

## Explicit Non-Transplants

- provider adapter rewrites
- MCP host replacement
- control-plane replacement
- extension package re-layout
- Rust/TUI restructuring

## Acceptance Standard

A transplant is acceptable only if it:

- reduces implementation risk in the live runtime
- preserves native `opencode` authority over config and execution
- stays clean-room with respect to proprietary Claude behavior
- lands with focused regression coverage
