# ADR-004: Provider Orchestration

- Status: Accepted
- Date: 2026-04-06

## Decision

Provider orchestration remains anchored in the live runtime and `packages/legion`, not in the starter-pack control-plane scaffold.

## Why

- The existing repo already has stronger provider infrastructure than the research scaffold.
- The current tranche is about migration-grade compatibility, not provider stack replacement.
- Rewriting orchestration now would expand scope without validating the compatibility thesis faster.

## Consequence

Claude compatibility is layered onto the current runtime, while provider refactors stay deferred behind a stable MVP.
