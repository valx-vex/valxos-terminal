# Internal Project Archaeology and Reuse Strategy for VALXOS Terminal

## Why “archaeology” is its own engineering discipline

Validated: Large-scale consolidation work (many repos and partial experiments) fails most often when teams either (a) “big-bang merge” everything and inherit hidden technical debt, licensing risk, and inconsistent abstractions, or (b) “start over” and repeat years of discovery. Engineering practice has evolved strong patterns precisely to avoid these extremes: run an audit, classify assets, preserve provenance, and move toward a “strangler” migration where new systems wrap or replace old ones incrementally. The Strangler Fig pattern is a well-known approach: gradually replace a legacy system by routing functionality to the new implementation while keeping the old working until the replacement is complete. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

Validated: “Software archaeology” is a recognized practice used in refactoring and legacy modernization: you examine history, dependencies, usage, and intent to decide what to keep and how to evolve it. Fowler’s broader refactoring guidance emphasizes incremental change with safety nets (tests) rather than wholesale rewrites. ([martinfowler.com](https://martinfowler.com/books/refactoring.html?utm_source=chatgpt.com))

Inference: For VALXOS, archaeology needs to be systematic because the product is intrinsically multi-domain: TUI, plugins, MCP, orchestration, routing, and safety boundaries. Each subdomain has different reuse economics and different “risk multipliers” when imported from old work.

## Recommended archaeology process

### The consolidation audit should be staged

Inference: Run archaeology as a **three-pass pipeline** so you don’t waste time reading everything deeply up front.

**Pass A: Inventory and fingerprint (fast, exhaustive)**
Goal: build a complete index and remove blind spots.

Actions:
- List all repos/folders and classify by origin (internal, fork, vendor example, prototype).
- Compute “fingerprints”:
  - languages/frameworks,
  - build systems,
  - dependencies,
  - license files,
  - last commit activity,
  - test presence,
  - CI configuration,
  - security signals (secrets, unsafe shell, network).
- Extract the “declared purpose” from README/docs and top-level architecture notes.
- Capture “surface compatibility claims” (e.g., Claude plugin import, MCP support, routing policies).

Validated: This mirrors the “walk the codebase” step of software archaeology and avoids premature design decisions. ([martinfowler.com](https://martinfowler.com/books/refactoring.html?utm_source=chatgpt.com))

**Pass B: Triage and scoring (medium, selective)**
Goal: decide which artifacts deserve deep review.

Actions:
- Score each repo/project using a reuse rubric (below).
- Pull the top candidates from each domain:
  - TUI/UI foundations,
  - extension/plugin runtime,
  - routing/orchestration,
  - MCP integrations,
  - session storage and artifact model,
  - security/sandbox scaffolding.

**Pass C: Deep dive and extraction (slow, surgical)**
Goal: extract reusable assets without importing “baggage.”

Actions:
- For high-score candidates: identify modules/components that can be isolated and imported behind stable interfaces.
- For medium-score candidates: extract *concepts* (docs, design notes, heuristics, test cases) and rewrite the implementation.
- For low-score or risky candidates: archive with a short note explaining why.

Validated: This approach parallels incremental modernization patterns (like Strangler Fig) where you keep legacy systems isolated behind interfaces until replaced. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

### What to collect for each project during the audit

Inference: Each project should yield:
- A one-page metadata record (template below).
- A domain classification (TUI, orchestration, plugins, MCP, etc.).
- A reuse decision (import, wrap, rewrite, archive).
- A “provenance plan” (how we preserve credit/history, how we handle licensing).
- A list of extracted artifacts (code modules, docs, test fixtures).

## Finding classification system

### Classification categories

Inference: Use a consistent classification for everything you find to avoid arguing case-by-case:

**Reusable code (R-code):** a module or library that can be imported with minimal changes and stable boundaries.

**Reusable concepts (R-concept):** algorithms, heuristics, patterns, or UI interaction designs worth reimplementing.

**Reusable docs (R-doc):** specs, prompts, migration notes, diagrams, compatibility matrices.

**Infra-only assets (Infra):** CI pipelines, release scripts, packaging manifests, build reproducibility.

**Risky baggage (Risk):** unclear licensing, copied code, embedded secrets, brittle dependencies, unsafe execution, unbounded telemetry, or “magic” unit tests that don’t reflect real behavior.

**Dead experiments (Dead):** unmaintained prototypes whose implementation is not worth reviving, but may still contain R-concepts/R-doc.

### Common “risk multipliers” for VALXOS specifically

Inference: In VALXOS’s problem space, some assets are uniquely dangerous to reuse directly:
- Anything that runs arbitrary shell code or edits files without a robust permission model.
- Anything that hardcodes prompt logic or includes proprietary prompt fragments (clean-room constraints).
- Anything with unclear plugin sandboxing (because it becomes a supply-chain and local security risk surface).
- Anything that implements provider APIs without strict error handling and quota backoff.

These “risk multipliers” should reduce reuse scores even if the code is “good,” because they create production-release blockers later.

## Reuse decision framework

### Import vs wrap vs rewrite vs archive: explicit criteria

Validated: The Strangler Fig pattern frames “wrap and replace gradually” as a best practice for systems with uncertain legacy quality or broad integration risk, because it allows incremental replacement while keeping the system usable. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

Inference: Use these explicit decisions:

**Import** (direct reuse)
Choose when:
- License is clean and compatible.
- The module has clear boundaries and low coupling.
- Tests exist or can be cheaply added.
- It matches the target architecture direction (or can be adapted without deep surgery).
- Security properties are acceptable (no hidden execution surfaces, no leaked secrets).

**Wrap** (keep but isolate behind an interface)
Choose when:
- The module works and is valuable, but structure is messy or too coupled.
- The behavior is better verified by black-box tests than by refactoring internals.
- You expect to replace it later but need it now to ship.

This is the “strangler” approach: put the legacy module behind a new stable interface and gradually replace. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

**Rewrite** (re-implement)
Choose when:
- The concept is valuable but code is brittle/outdated.
- Dependencies are dead/heavy.
- Performance/security model is wrong for production.
- The code violates clean-room constraints or licensing uncertainty exists.

**Archive** (stop investing)
Choose when:
- The module duplicates better work elsewhere.
- The architecture diverges from VALXOS goals.
- It is unmaintained and lacks unique ideas.
- It carries unacceptable risk (e.g., unknown license, embedded secrets).

### Signals that predict “import” success

Inference: High-probability predictors:
- Clear “library-like” shape (src/ + tests/ + versioning).
- Minimal external dependencies.
- Well-defined interfaces.
- Deterministic behavior (stable outputs, clear error handling).
- Good docs and examples.
- Recent activity / compatibility with modern toolchains.

### Signals that predict “rewrite” is cheaper

Inference: Strong predictors:
- “Prototype glue” architecture: lots of global state, no separation between UI and engine.
- Everything coupled to one provider API shape.
- Heavy bespoke internal abstractions that don’t match your new orchestrator contract.
- Hard-coded file paths and implicit environment assumptions.
- No tests, no reproducible build.

### A quantitative reuse scoring rubric

Inference: Use a weighted score to avoid bias toward “cool prototypes”:

- Functional value for VALXOS roadmap (0–5) × 3  
- Boundary clarity (0–5) × 2  
- Test maturity (0–5) × 2  
- Dependency health (0–5) × 2  
- Security posture (0–5) × 3  
- License/provenance clarity (0–5) × 3  
- User-facing polish or UX reuse potential (0–5) × 1  
- Maintenance recency (0–5) × 1  

Then:
- **Score ≥ 40:** Import (or wrap if coupling is medium)
- **Score 25–39:** Wrap or rewrite depending on security/provenance
- **Score < 25:** Archive (extract concepts/docs only)

Make “license/provenance clarity” and “security posture” high-weight to prevent accidental contamination.

## Suggested metadata template for each discovered project

Use a single file per project, e.g., `audit/<project-id>.md`.

```md
# Project Metadata: <project name>

## Identity
- Project ID:
- Repo/folder path:
- Owner/author(s):
- Last modified date:
- Primary language(s):
- Build system(s):
- License (file + type):
- Provenance notes (fork? copied? vendor sample? unknown?):

## Declared purpose
- Summary (1–2 sentences):
- Intended users:
- Domain tags: [tui, plugins, mcp, routing, sessions, release, infra, etc.]

## Actual contents (inventory)
- Key modules/components:
- Key commands/entrypoints:
- External services/providers used:
- Plugin/extension formats supported:
- MCP integration: yes/no; transport; config format

## Quality and safety signals
- Tests present? (unit/integration/e2e):
- CI present? (yes/no; what):
- Secret scanning needed? (yes/no):
- Shell execution surfaces:
- Network egress surfaces:
- Telemetry/crash reporting behavior (default/opt-in):
- Data storage locations (sessions, caches):

## Compatibility relevance
- Claude plugin import? yes/no; which parts:
- OpenCode compatibility? yes/no:
- MCP compliance level:
- Routing/orchestration relevance:

## Reuse assessment
- Reuse score (with rubric):
- Recommendation: Import / Wrap / Rewrite / Archive
- Why (short, concrete):
- Extractables: [code modules], [docs], [tests], [fixtures], [UI patterns]

## Migration notes
- Target location in consolidated tree:
- Required refactors:
- Deprecations/replace-by plan:
- Risks and mitigations:
```

Inference: This template forces the two hardest decisions early: provenance and security posture, while still capturing “gold nuggets” like UI patterns and test fixtures.

## Suggested target folder structure for consolidated assets

Inference: The consolidation target should preserve provenance while making new development clean. A proven structure is:

```
valxos/
  README.md
  LICENSE
  docs/
    research/                     # imported research outputs (like the prompt pack)
    architecture/                 # decisions, diagrams, specs
    compatibility/                # Claude/OpenCode/MCP compatibility specs + tests
    security/                     # threat model, sandboxing, permissions
  audit/                          # archaeology outputs (metadata + scoring)
  archive/                        # frozen snapshots of dead projects (read-only)
  packages/                       # reusable libraries (imported or rewritten)
    core/                         # session model, logging, config precedence
    orchestrator/                 # routing engine, policies, providers
    extensions/                   # package manager, capability model, shims
    mcp/                          # MCP client/server wrappers, diagnostics
    tui/                          # shared UI primitives
  apps/
    terminal/                     # VALXOS Terminal TUI application
    companion/                    # optional future desktop/web companion
  tools/
    migration/                    # scripts for importing old projects/artifacts
    lint/                         # static analysis, secret scanning configs
    release/                      # build, signing, packaging automation
  fixtures/
    mcp/                          # mock servers (stdout noise, slow responses)
    plugins/                      # test plugins (claude-style, opencode-style)
    repos/                        # mini sample repos for integration tests
```

Validated: This structure supports “wrap and replace gradually” by allowing old code to live in `archive/` while new stable interfaces go in `packages/`, aligning with incremental modernization strategies. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

Inference: The crucial design choice is that `archive/` is read-only and never referenced from production builds. If something is valuable, it gets extracted into `packages/` (import or rewrite) with an explicit provenance note.

## Import versus rewrite criteria: a decision table

| Question | If “yes” → lean Import/Wrap | If “no” → lean Rewrite/Archive |
|---|---|---|
| Is the license clear and compatible? | Continue | Stop or rewrite clean-room |
| Is there a clean module boundary? | Import | Wrap or rewrite |
| Are tests present or easily added? | Import/Wrap | Rewrite |
| Does it match current target architecture? | Import | Rewrite |
| Does it execute shell/network/file writes safely? | Import/Wrap (with policy gates) | Rewrite or isolate/disable by default |
| Is it actively maintained or at least buildable on modern toolchains? | Import/Wrap | Rewrite/Archive |
| Is it duplicative of other work? | Prefer best implementation | Archive others (extract docs) |

Validated: The “wrap” option is justified by the Strangler Fig pattern as a standard way to contain legacy complexity while enabling gradual replacement. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

## Reporting template for the final audit

Inference: The final output should be a consolidated report that lets you make decisions quickly:

```md
# VALXOS Consolidation Audit Report

## Summary
- Total projects scanned:
- High-value candidates:
- High-risk items (license/security):
- Recommended consolidation phases:

## Portfolio map
(Table of projects with tags, score, recommendation)

## Domain deep dives
### TUI/UI
- Keep:
- Wrap:
- Rewrite:
- Archive:
- Reusable patterns extracted:

### Extensions and plugins
...

### MCP and tools
...

### Routing/orchestration
...

## Cross-cutting risks
- Licenses and provenance
- Secrets/credential leaks
- Unsafe shell behavior
- Telemetry/privacy violations
- Dependency rot

## Migration plan
- Phase 1: establish new core packages and interfaces
- Phase 2: import/wrap top 3–5 components
- Phase 3: rewrite high-value prototypes with tests
- Phase 4: archive everything else and freeze

## Appendices
- Project metadata pages (links)
- Extracted assets list
- Test fixtures inventory
```

Inference: Keep the portfolio map short (one page), and push details into linked metadata pages. The goal is to make decisions fast and reversible.

## Examples from engineering practice worth borrowing

Validated: The Strangler Fig pattern is a practical blueprint for “consolidate without a rewrite”: build the new system around the old, route traffic/usage incrementally, then remove the old once replaced. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

Inference: Apply this directly to VALXOS by treating old projects as “legacy subsystems” and putting them behind:
- a new session/artifact model,
- a new routing/orchestrator interface,
- and a new extension manager.
Then gradually replace legacy modules while keeping user-facing behavior stable.

Validated: Refactoring practice emphasizes incremental improvement with safety nets and tests, as opposed to rewriting without feedback loops. This supports the idea that importing old assets should be coupled with targeted tests rather than endless refactors. ([martinfowler.com](https://martinfowler.com/books/refactoring.html?utm_source=chatgpt.com))

## Recommended Consolidation Workflow For VALXOS

Validated grounding: Use incremental modernization principles—especially Strangler Fig—to avoid a risky all-in-one merge or a total rewrite. ([martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com))

Inference: The recommended workflow is:

1. **Create the audit index** (Pass A): inventory everything; fingerprint language/build/license/tests/CI/security surfaces; write a metadata file per project.
2. **Score and triage** (Pass B): apply the reuse rubric; pick top candidates per domain; mark high-risk items for quarantine.
3. **Define the new “core contracts” first**: session model, routing interface, extension graph, MCP manager interface, TUI state model. These contracts become the stable targets for extraction.
4. **Extract or wrap high-value modules** (Pass C): import modules that fit cleanly; wrap those with value but high coupling; rewrite those that violate security/provenance constraints but contain good ideas.
5. **Preserve provenance explicitly**: for any imported module, include a `PROVENANCE.md` next to it linking to the original repo and commit/tag; keep the original repo snapshot in `archive/` read-only.
6. **Archive aggressively**: if it’s not imported/wrapped/rewritten by a defined milestone, archive it. Extract only docs/fixtures/patterns into the new tree.
7. **Publish the portfolio map** in `docs/architecture/` and keep it updated as the consolidation proceeds, so future contributors don’t resurrect dead experiments by accident.

This yields a consolidation program that is fast, reversible, legally safer, and aligned with how modern teams successfully modernize complex software systems.