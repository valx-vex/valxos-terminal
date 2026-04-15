---
name: review-code
description: Review changed files for correctness, edge cases, and regression risk.
argument-hint: "optional path glob"
user-invocable: true
allowed-tools:
  - Read
  - Grep
context: inline
---

Inspect changed files, summarize bugs first, then list polish suggestions.
