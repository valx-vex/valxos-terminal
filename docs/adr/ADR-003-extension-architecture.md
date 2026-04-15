# ADR-003: Extension Architecture

- Status: Accepted
- Date: 2026-04-06

## Decision

Runtime compatibility logic belongs inside `packages/opencode`, while the generic plugin API remains in `packages/plugin`.

## Why

- Claude compatibility needs direct access to config loading, session state, permissions, tool execution, and MCP integration.
- Moving that logic into a standalone extension package would add indirection without reducing complexity.
- The public plugin SDK should remain stable while internal compatibility layers evolve.

## Consequence

Claude hook adaptation stays internal. Public plugin APIs are unchanged in this tranche.
