# ADR-005: Plugin Strategy

- Status: Accepted
- Date: 2026-04-06

## Decision

VALXOS will support Claude-style plugin discovery as a compatibility surface while preserving the native plugin model as the product-owned extension strategy.

## Why

- `.claude-plugin/plugin.json` and related hook and MCP files are valuable migration surfaces.
- They do not need to replace the native plugin SDK to deliver compatibility value.
- Maintaining both concerns in one public API during this tranche would create avoidable churn.

## Consequence

Claude-style plugin manifests are discovered and normalized internally. Native plugin APIs stay authoritative for first-party extension evolution.
