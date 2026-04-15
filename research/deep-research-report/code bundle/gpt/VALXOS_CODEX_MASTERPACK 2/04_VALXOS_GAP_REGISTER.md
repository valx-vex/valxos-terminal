# VALXOS GAP REGISTER

Purpose: prevent hallucinated certainty inside the implementation phase.

---

## Missing or not-uploaded research lanes

### G1. Warp-class TUI / control-center research output
Status: missing from upload
Impact:
- rich panel layout guidance is incomplete
- desktop/browser companion split is not fully grounded
- some UX claims in synthesized spec are adjacent-inference only

Current safe action:
- implement minimal terminal-first MVP shell
- write UI under feature flags
- do not hard-code advanced multi-pane architecture without validation pass

### G2. Internal project archaeology / reuse strategy output
Status: missing from upload
Impact:
- unknown reusable assets from prior VALXOS / VexNet / TUI / routing experiments
- repo structure in this pack is greenfield-biased
- risk of rewriting code that already exists

Current safe action:
- before large implementation sprint, run dedicated consolidation audit
- keep repo modular so reused modules can be swapped in later
- do not import old code blindly

### G3. GPT research vs Gemini research conflict map
Status: not directly provided
Impact:
- cannot author precise disagreement matrix across all topic lanes
- current pack is synthesis-first, not source-diff-first

Current safe action:
- treat uploaded docs as primary provided evidence
- add `EVIDENCE_STATUS` fields to ADRs when implementing ambiguous behaviors

---

## Inferred decisions that need explicit confirmation later

1. Rust-first codebase choice
Reason:
- strongest fit for terminal performance, distribution, and Warp-class ambition
Risk:
- prior reusable work may be in another language

2. Ratatui/crossterm-class TUI approach
Reason:
- ecosystem fit for keyboard-first terminal control
Risk:
- uploaded docs did not directly specify final stack

3. `.valxos/state.json` as persistence artifact
Reason:
- consistent with uploaded state-manifest idea
Risk:
- exact persistence schema not externally validated

4. Internal canonical type names (`ValxosConfig`, `UMF`, etc.)
Reason:
- needed to unblock implementation
Risk:
- names may change during archaeology/reuse audit

5. Core under Apache-2.0
Reason:
- strongly supported by clean-room/governance synthesis
Risk:
- final commercial strategy may later prefer different split for hosted components

---

## Behaviors that must stay flagged as unverified until tested

- exact array merge semantics for every Claude config field
- full plugin manifest schema compatibility edge cases
- all hook stdout JSON variants in the wild
- MCP channel behaviors and notification quirks
- settings override behavior for obscure local/global collisions
- vendor API behavior under rare failures/timeouts

Rule:
- unverified behaviors must be covered by fixtures or behind compatibility flags
- do not silently claim exact parity without fixture proof

---

## Recommended next input requests

If more source material becomes available, highest-value additions are:
1. dedicated TUI/control-center report
2. archaeology/reuse report
3. direct provider feature matrices
4. real `.claude` repo fixtures from target users
5. real plugin samples
6. real hook samples
7. real MCP server configs from intended users
