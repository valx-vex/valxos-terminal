# Clean Room, Legal, and Open Source Strategy for VALXOS

## Not Legal Advice

**Not Legal Advice:** This research summarizes publicly available sources and common engineering practices for building interface-compatible software, clean-room implementations, and open-source governance. It is **not** legal advice and does not create an attorney–client relationship. For decisions that hinge on jurisdiction, contracts, patents, trademarks, or sourcing risk, consult qualified counsel in the relevant jurisdictions. citeturn6search3turn0search0turn0search3

## Observed Practice

### Clean-room-compatible implementation patterns

**Observed Practice:** Compatibility work is typically made defensible (and operationally safer) by separating *what the system should do* (a public specification) from *how it does it* (independent code). A widely cited “clean room” approach uses a “spec team” that studies the target behavior and writes functional specifications, and an “implementation team” that writes code from the spec without exposure to protected implementation details. citeturn6search13turn6search1

**Observed Practice:** Courts and legal commentary in the U.S. have repeatedly treated software interfaces and reverse engineering for interoperability as legally significant topics, with outcomes that—while fact-specific—show that intermediate copying can be legally analyzed (e.g., through fair use), especially when needed to access unprotected functional elements. Examples often referenced in interoperability conversations include reverse engineering cases like *Sega v. Accolade* and emulator/reverse engineering cases like *Sony v. Connectix*. citeturn2search5turn2search4

**Observed Practice:** The modern “API compatibility” debate includes the landmark *Google v. Oracle* decision, where the entity["organization","U.S. Supreme Court","federal court US"] analyzed copying related to Java API declarations and held (on the record before it) that Google’s use was fair use—while explicitly focusing on the role APIs play in allowing programmers to call prewritten tasks and build interoperable systems. citeturn0search0turn0search1

### Public interfaces and interoperability rights as primary sources

**Observed Practice:** In the entity["organization","European Union","supranational union"], Directive 2009/24/EC provides explicit statutory grounding for interoperability-related activities: it recognizes observing/studying/testing a program to understand ideas and principles, and it provides conditions under which decompilation can be permitted when necessary to achieve interoperability, subject to constraints (e.g., limiting acts to parts necessary for interoperability and restricting use of the information). citeturn0search3turn0search11

### How open-source projects document compatibility without copying implementation

**Observed Practice:** Mature compatibility-layer projects often frame their work explicitly as *reimplementation* of published interfaces and behavior. For example, Wine describes itself as translating Windows API calls into POSIX calls (i.e., implementing API behavior rather than copying Windows internals). Independent reporting and project materials commonly stress that such projects use reimplementation and testing rather than importing proprietary source. citeturn3search0turn3search12

**Observed Practice:** Projects that sought deep compatibility with proprietary platforms have publicly treated “taint” from leaked source as existential risk. ReactOS, for example, publicly discussed legal accountability and the policy of not using leaked Microsoft code, and historically paused development to conduct reviews amid concerns about contamination—illustrating the practical governance consequence of leaked/internal material exposure. citeturn3search17turn3search5turn3search9

## Risk Map

### Primary risk categories

**Observed Practice:** The most important legal risk categories in compatibility engineering are commonly: (1) copyright (copying protected expression), (2) trade secrets (using improperly acquired confidential information), (3) patents (independent creation is not a defense), and (4) trademarks/trade dress (branding and confusing similarity can create disputes even when code is original). citeturn6search3turn6search6turn5search0turn0search0

**Observed Practice:** Trade secrets are defined as IP rights in confidential information; misappropriation can include acquisition or use when the party knew (or was grossly negligent in failing to know) that improper practices were involved in obtaining the information. This matters because leaked/internal materials can create trade-secret exposure even if no literal copying is intended. citeturn6search3turn6search6

**Observed Practice:** Trademark policies matter in open ecosystems because names and logos can remain controlled even when code is open source. For instance, the entity["organization","Apache Software Foundation","open source foundation"] publishes a trademark policy describing allowable uses of ASF marks and noting that ASF project names are trademarks of the ASF. citeturn5search0turn5search8

### Risk triggers and mitigation levers

| Risk trigger | Why it’s risky | Typical mitigation (observed) |
|---|---|---|
| Studying leaked/internal code, screenshots, or proprietary prompts | Trade-secret contamination; copyright exposure; “tainted contributor” risk | Written policy: do not access; contributor attestation; quarantine + code review; provenance logs citeturn6search6turn3search5turn3search17 |
| Copying “implementation-like” text from docs, repos, SDKs | Copyright infringement of expressive text/code | Spec-from-behavior; paraphrase; re-author docs; cite public standards; keep records citeturn0search0turn2search5turn0search3 |
| Reusing code from incompatible licenses (or unknown provenance) | License violation; distribution risk | Dependency hygiene; SPDX/REUSE; contributor attestations; audit inbound code citeturn1search3turn4search13turn1search0 |
| Imitating brand/UI too closely | Trademark/trade dress disputes; user confusion | Compatibility claims with clear disclaimers; follow trademark policies; avoid logo reuse citeturn5search0turn5search5turn5search17 |
| Patented methods hidden in the target product | Patent infringement risk even with clean-room code | Patent review for high-risk features; design-arounds; counsel review (where warranted) citeturn0search0turn6search3 |

## Red Lines and Safe Zones

### Observed Practice

**Observed Practice:** Clean-room “separation of duties” exists largely so a team can demonstrate independent creation and reduce the chance of copying protected expression. Academic and practitioner literature describes this as separating those who study the target (and draft functional specs) from those who code the compatible implementation. citeturn6search13turn6search15

**Observed Practice:** Interoperability-focused reverse engineering is treated as lawful under certain conditions in multiple legal regimes, but the permissibility and boundaries are detail-dependent. The EU directive, for example, includes conditions constraining decompilation to what is needed for interoperability and limiting how derived information can be used. citeturn0search3turn0search11

### Suggested Policy

**Suggested Policy (Red lines):**
- **No leaked/internal materials.** If something is not clearly authorized and public (e.g., leaked repositories, internal prompts, leaked screenshots of proprietary code/config), treat it as disallowed input for research and implementation. Grounding: trade-secret misappropriation risk and historical “taint” concerns in compatibility projects. citeturn6search6turn3search5turn3search17  
- **No copy/paste of competitor implementation, even if “public.”** Public availability does not automatically grant reuse rights; copy/paste is rarely needed for interface compatibility and creates avoidable risk. Grounding: copyright/fair use cases turn on context; “clean room” exists to avoid copying expression, not to justify it. citeturn0search0turn2search5turn6search13  
- **No “lookalike branding.”** Avoid using competitor logos, protected marks, or confusingly similar branding; use nominative references only as needed (“compatible with …”) and follow published trademark policies when referencing third-party marks (or provide neutral phrasing). citeturn5search0turn5search5  

**Suggested Policy (Safe zones):**
- **Public interfaces and standards:** Public specifications, standards, and documented file formats are safe targets for compatibility, especially when reimplemented independently. Grounding: API/interface analysis in *Google v. Oracle*; EU interoperability rules; MCP transport specs as a public protocol example. citeturn0search0turn0search3turn0search11turn3search0  
- **Black-box testing and behavioral specs:** Observing system behavior (inputs/outputs, file formats, CLI UX) and drafting your own spec is a standard “compatibility-first” pattern. Grounding: reverse engineering/fair use summaries and interoperability rationale. citeturn2search5turn2search4turn0search3  
- **Independent test suites and conformance harnesses:** Write fresh tests based on public behavior and your own spec; avoid copying proprietary test suites. Grounding: clean-room literature emphasizes spec + independent implementation; interoperability regimes emphasize functionality access rather than copying expression. citeturn6search13turn0search3turn2search5  

## Repo Governance Rules and Open Source Strategy

### Observed Practice

**Observed Practice:** Open-source “compatibility-without-copying” projects typically formalize inbound code provenance and community behavior through governance artifacts: license notices, contributor agreements (CLA or DCO-style), a code of conduct, and machine-readable licensing metadata. citeturn1search0turn1search5turn4search2turn1search19

**Observed Practice:** The entity["organization","Open Source Initiative","nonprofit license steward"] publishes the Open Source Definition (OSD), clarifying that open source is not merely source availability but a set of distribution criteria (e.g., non-discrimination, free redistribution, source availability). This is the baseline users and ecosystems use to decide whether a project is genuinely “open source.” citeturn4search0turn4search12

**Observed Practice:** OSI has also drawn a bright line against some “source-available” licenses. For example, it stated that the SSPL is not an open source license (and was withdrawn when it was clear it would not be approved), underscoring reputational and ecosystem risks when choosing non-OSI licenses. citeturn2search3turn2search11

**Observed Practice:** For contributor governance, some foundations require CLAs (e.g., ASF’s contributor agreements), while other communities use the DCO as a lightweight contribution attestation. The DCO text is a standardized certification that the contributor has the right to submit the work under the project’s license (or has received proper certification from the upstream). citeturn1search5turn1search0

**Observed Practice:** Machine-readable licensing and dependency hygiene are increasingly standardized. SPDX is an open standard (ISO/IEC 5962:2021) used to represent SBOMs and licensing metadata, and the REUSE specification recommends embedding SPDX identifiers and licensing/copyright statements so reuse and compliance are automatable. citeturn4search1turn1search19turn4search13

**Observed Practice:** Open-source security programs now have recognizable baselines. The OpenSSF Best Practices Badge program publishes criteria and a self-certification process to encourage security-focused engineering and documentation habits for open source projects. citeturn1search2turn1search6

### Suggested Policy

#### Recommended licensing approach for a free/public developer tool with plugin ecosystem

**Suggested Policy:** Prefer a widely adopted permissive license for the core, with strong patent terms, to maximize adoption while keeping compatibility work broadly reusable and minimizing friction with commercial users.

- **Core recommendation:** Apache-2.0 for the main codebase (terminal, orchestrator, MCP manager, extension runtime), because it is OSI-approved and includes an explicit patent license grant clause that is widely recognized in engineering/legal practice. citeturn0search4turn0search12  
- **Documentation license:** Keep docs under a permissive documentation license (commonly CC-BY or CC-BY-SA) and ensure third-party excerpts remain within fair-quotation limits; if adopting REUSE, include SPDX tags for docs too. Grounding: REUSE aims for file-level clarity and SPDX alignment. citeturn1search19turn4search13  
- **Plugins:** Encourage plugins to declare their own licenses; VALXOS should treat plugins as separate packages and enforce license visibility in the plugin manager. Grounding: open-source ecosystems commonly treat the core as one license and plugins as independently licensed add-ons (and SPDX/REUSE makes this explicit). citeturn1search19turn4search13  
- **Hosted services:** If you later offer optional hosted services, keep the service-side proprietary if necessary, but be transparent about what is open and what is not; avoid “fake open source” licenses that violate OSD. Grounding: OSD criteria and OSI’s SSPL position illustrate the reputational risk of “source-available but not open source.” citeturn4search0turn2search3  

#### Recommended contribution and provenance rules

**Suggested Policy:** Use DCO-by-default (low friction) plus strong provenance checks, and reserve CLAs for cases where you need explicit relicensing rights (e.g., to dual-license, to relicense later, or for certain corporate contributions).

- **Default:** DCO sign-off required for all contributions (including docs), using the standardized DCO 1.1 text. citeturn1search0turn1search8  
- **Optional:** CLA path for corporate contributors who need explicit IP grants or for a future foundation transition; ASF-style CLAs provide a well-known template for contributor protection and project defense. citeturn1search5turn1search1  
- **Code of Conduct:** Adopt Contributor Covenant v2.1 (or similar) to set behavioral expectations and reduce community risk in a public project. citeturn4search2turn4search10  
- **Licensing hygiene:** Implement REUSE policies and SPDX license identifiers, and publish SBOMs in SPDX format for releases. citeturn1search19turn4search1  
- **Supply-chain provenance:** Target SLSA build provenance practices, and consider artifact signing verification guidance (e.g., Sigstore/cosign) for releases; this is increasingly expected for developer tools. citeturn4search3turn5search2turn4search11  

## Practical Checklist for Researchers and Implementers

### Suggested Policy checklist for clean-room research work

1. **Define “allowed sources” up front** (per feature/compatibility target): official docs, public standards, published file formats, your own behavioral tests, and permissively licensed code you are entitled to use. Grounding: interoperability and interface focus in *Google v. Oracle*; EU directive’s interoperability framing. citeturn0search0turn0search3  
2. **Ban “tainted sources” explicitly:** leaked repos/prompts, confidential partner/customer materials without written permission, internal screenshots, or anything labeled confidential. Grounding: trade secret definition/misappropriation concepts; contamination incidents in compatibility projects. citeturn6search3turn6search6turn3search5  
3. **Maintain an evidence log:** for each compatibility claim (“we match behavior X”), record the public reference and/or the black-box test that demonstrates expected behavior. Grounding: clean-room literature emphasizes spec-driven implementation; EU rules constrain how derived info is used. citeturn6search13turn0search11  
4. **Write a “functional spec” in your own words:** avoid copying text/code from third-party docs beyond short quotes; treat the spec as your independent artifact. Grounding: clean-room spec/implementation separation practices. citeturn6search13turn6search15  

### Suggested Policy checklist for implementers

1. **Implement from the spec, not from competitor code:** if a dev has been exposed to sensitive material, quarantine them from that module and reassign. Grounding: clean-room “Chinese wall” logic described in clean-room procedure literature. citeturn6search13turn6search1  
2. **Use independent conformance tests:** treat tests as the contract; tests should be authored from public behavior expectations and your own spec. Grounding: reverse engineering cases emphasize access to functional elements and interoperability; spec-first clean-room emphasizes independent implementation. citeturn2search5turn6search13  
3. **Tag every file with SPDX info and keep REUSE-compliant structure:** make license and copyright machine-readable at file level. citeturn1search19turn4search13  
4. **Require DCO (or CLA) compliance on every PR:** reject PRs that cannot be traced to an authorized origin. citeturn1search0turn1search5  
5. **Avoid trademark misuse in UX and marketing:** use competitor names only as needed for compatibility statements; avoid logos and avoid implying endorsement, consistent with published trademark policy norms. citeturn5search0turn5search5  

### Suggested Policy checklist for maintainers and release managers

1. **Establish repo governance files early:** LICENSE, NOTICE (if needed), DCO/CLA policy, Code of Conduct, SECURITY policy, and contribution guidelines. Grounding: OSD expectations and common foundation practices; DCO/CLA sources. citeturn4search0turn1search0turn1search5turn4search2  
2. **Adopt OpenSSF best-practices criteria as a target:** treat the badge checklist as an actionable baseline rather than marketing. citeturn1search2turn1search14  
3. **Publish SBOMs and provenance:** generate SPDX SBOMs and work toward SLSA provenance; sign artifacts and publish verification instructions. citeturn4search1turn4search11turn5search2  
4. **Maintain a “compatibility statement” doc:** clearly separate *interface compatibility* (“we read this config format; we implement this protocol”) from *brand association*; include trademark disclaimers and avoid confusing naming. Grounding: trademark policy examples and the general reality that trademarks remain protected even in open ecosystems. citeturn5search0turn5search17  

### Quick “safe zone vs red line” reference

| Topic | Safe zone | Red line |
|---|---|---|
| Source study | Official public docs, standards, publicly licensed repos, black-box tests citeturn0search3turn3search0turn3search3 | Leaked repositories, confidential/internal materials, “tainted” contributions citeturn6search6turn3search5 |
| Compatibility claims | “Implements published format/protocol” + conformance tests citeturn0search3turn3search0 | “Copied upstream behavior/code” or importing proprietary tests |
| Branding | Nominative references, clear disclaimers, no logos citeturn5search0turn5search5 | Confusingly similar product names, use of logos/marks without permission citeturn5search0turn5search1 |
| Open source posture | OSI-approved license + clear notices citeturn4search0turn0search4 | Non-OSI “source-available” license marketed as open source (high ecosystem risk) citeturn2search3turn4search0 |

