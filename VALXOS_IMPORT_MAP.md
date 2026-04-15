# VALXOS Import Map

## Keep As Live Base

- `packages/opencode`
- `packages/plugin`
- `packages/legion`
- `packages/desktop`

These packages are the active product base and should absorb compatibility work by extension, not replacement.

## Transplant Concepts Or Tests Only

Source: GPT starter pack

- `config`: useful for precedence cases, fixture ideas, and compat edge-case coverage
- `compat`: useful for surface inventory, parser cases, and migration fixtures

These should be selectively re-expressed inside the live `packages/opencode` tree.

## Reference Only

Source: GPT starter pack and Rust-first masterpack assumptions

- `providers`
- `mcp`
- `control-plane`
- `shared`
- `extensions`
- Rust-first package topology

These are architecture references, not direct import targets for the current lane.

## Archive Without Deleting

- deep research markdown bundles
- Gemini blueprint documents
- historical compatibility experiments outside the live runtime

Keep them available for design pressure and archaeology, but do not let them dictate the repo layout.
