# ADR-001: Runtime Direction

- Status: Accepted
- Date: 2026-04-06

## Decision

VALXOS will remain TypeScript/Bun-first for the current implementation lane.

## Why

- The active product root is already a working TypeScript monorepo.
- The first compatibility and orchestration wins are file-surface and runtime-logic problems, not low-level performance problems.
- The validated Claude-side compatibility specimen is file and process based, which fits the current runtime.

## Consequence

Rust is deferred to a later, explicitly scoped subsystem if performance or TUI constraints justify it.
