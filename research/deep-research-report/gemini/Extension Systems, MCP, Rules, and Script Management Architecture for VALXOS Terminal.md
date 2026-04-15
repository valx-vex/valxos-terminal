# Extension Systems, MCP, Rules, and Script Management Architecture for VALXOS Terminal

The evolution of artificial intelligence development environments has necessitated a fundamental paradigm shift from standard command-line interfaces to highly orchestrated, context-aware control centers. To achieve the objective of establishing a Warp-class control center for AI development, the underlying architecture must support an exhaustive and unified extension model. This design must seamlessly facilitate multi-model integration, encompassing Claude, OpenAI/Codex, Gemini, and Ollama, while maintaining rigorous compatibility with existing ecosystem standards. These standards include Claude Code plugins, the Model Context Protocol (MCP), and dynamic workflow rules. The architectural principles outlined in this report prioritize clean-room engineering, interface compatibility, deterministic state management, and an advanced Terminal User Interface (TUI) designed to manage complex AI agent lifecycles effectively.

## Architectural Foundations and Ecosystem Analysis

To design a unified extension model that absorbs disparate paradigms into a single environment, it is imperative to conduct a granular analysis of the foundational concepts dictating AI extensibility across leading platforms. The current market exhibits a fragmentation of extension patterns, broadly divided between deterministic tool integrations, which execute specific code automatically, and probabilistic prompt modifications, which rely on the non-deterministic interpretation of a Large Language Model (LLM).

The Claude Code architecture utilizes a highly structured, manifest-driven approach, packaging capabilities into deployable units referred to as plugins.1 A plugin serves as a distribution layer that bundles various functional components into a single, installable namespace.1 Within this ecosystem, skills operate as reusable knowledge repositories or workflow instructions defined in Markdown files.1 These skills utilize a progressive disclosure pattern where only the names and metadata descriptions are loaded into the initial context window, preserving expensive token limits.1 The full textual content is dynamically injected only upon explicit user invocation or automatic relevance matching by the LLM.1 Hooks, conversely, function as deterministic lifecycle interceptors.3 They execute external shell commands, HTTP requests, or lightweight prompts at specific execution phases, such as immediately before or after a tool is used.3 Operating entirely outside the probabilistic agentic loop, hooks provide guaranteed execution for safety checks, codebase formatting, and event notifications without relying on LLM decision-making.1 Furthermore, the Claude ecosystem leverages subagents, which are isolated context windows equipped with specialized system prompts and restricted tool access.1 These subagents run independent logic loops and report concise summaries back to the primary session, thus optimizing token utilization and isolating operational side effects.1 Project-specific instructions are typically codified in persistent context files, which inject global rules into every session.1

Conversely, the OpenCode environment introduces a rigid agent hierarchy and explicit permission models governed directly within the terminal interface.6 The OpenCode topology differentiates strictly between primary agents, which handle the main conversational loop, and subagents, which are spawned for specialized, read-only codebase exploration or highly constrained problem-solving tasks.6 This architecture employs a deterministic permission matrix that assigns explicit behavioral states to specific tools, requiring the terminal to either silently allow execution, explicitly ask for user authorization via the terminal interface, or outright deny execution based on predefined glob patterns.6 OpenCode's TUI architecture relies heavily on asynchronous state updates, rendering complex parallel subagent executions and enabling multi-pane session navigation.7

The Model Context Protocol (MCP) establishes a standardized methodology for the integration of external data sources and execution tools via JSON-RPC 2.0 messages.8 Operating over transports such as standard input/output (stdio) or Server-Sent Events (SSE) over HTTP, MCP servers expose three distinct primitives.8 Resources provide static context and data, Tools expose executable functions for the LLM to invoke, and Prompts offer templated workflows.8 Because MCP relies on a strict client-server boundary, it inherently provides a sandboxed execution environment compared to inline shell execution, standardizing the supply chain of AI tool integration.10 The protocol maintains stateful connections and supports complex server-initiated behaviors, allowing for dynamic capability negotiation during the connection lifecycle.8

Beyond these primary agentic frameworks, the broader development ecosystem relies on text-based rule engines and parameterized terminal commands. Environments leveraging Cursor typically rely on specific configuration files containing YAML frontmatter that dictates when a rule should be applied, often utilizing glob patterns to match against the current working directory.13 The underlying markdown bodies provide the actual instruction to the LLM.13 Migration tools currently exist to transform these legacy rules into standardized markdown formats, indicating a strong market demand for cross-compatibility between IDEs and terminal-based agents.13 Simultaneously, the Warp terminal ecosystem introduces the concept of parameterized commands saved as workflows.15 These workflows utilize variables with specific text or enumeration types, allowing complex, multi-flag bash sequences to be executed via a simple, searchable command palette, entirely bypassing the need for an LLM to generate the command syntax.15

## Unified Extension Topology for the Terminal

To absorb these disparate ecosystems into a single, cohesive Warp-class terminal, the architecture must define a superset of these capabilities. The system must establish clear ontological boundaries between deterministic execution, representing what the system does automatically, and probabilistic execution, representing what the LLM decides to do based on its contextual interpretation. The integration of Claude, OpenAI, Gemini, and Ollama requires a normalization layer that translates these generic extension concepts into the specific API schemas expected by each distinct provider.

The architecture will model extensions across seven core domains, each serving a distinct function in the AI development lifecycle. The table below delineates the attributes, functions, and contextual costs associated with each extension type.

  

|   |   |   |   |   |
|---|---|---|---|---|
|Extension Type|Primary Function|Invocation Mechanism|Context Cost|Deterministic vs. Stochastic|
|Commands|Parameterized terminal sequences for repetitive tasks.15|Manual user invocation via TUI command palette.15|Zero (executes outside LLM context).|Deterministic.|
|Hooks|Lifecycle event listeners for automation and security.3|Automatic trigger on system events.3|Zero (unless configured to inject output into context).1|Deterministic.|
|Agents|Autonomous LLM execution loops with specific system prompts.5|Manual user invocation or automatic delegation by primary agent.5|High (requires dedicated context window).5|Stochastic.|
|Skills|Reusable domain knowledge and workflow instructions.1|Manual invocation or dynamic LLM relevance matching.1|Low initially (metadata only), moderate upon invocation.1|Stochastic logic, deterministic injection.|
|MCP Servers|External tool and resource providers communicating via JSON-RPC.8|Negotiated at session start; tools invoked by LLM.9|Low (schema declarations only until tool execution).1|Deterministic server, stochastic tool selection.|
|Rules / Policies|Persistent contextual instructions and security constraints.1|Injected automatically based on glob patterns or global configurations.1|Moderate (consumes token limits continually).|Stochastic interpretation (Markdown) / Deterministic enforcement (Rego).|
|Scripts|Raw executable files utilized by other extensions.3|Executed by Hooks, Commands, or Skills.3|Zero.|Deterministic.|

Commands are modeled directly after modern terminal workflows, defining syntax, expected arguments, and the resulting shell execution.15 They do not inherently consume LLM context but provide developers with rapid access to complex operations without the latency of AI generation.16 Hooks are modeled as deterministic event listeners bound to the system lifecycle, capturing events before and after tool usage.3 A hook consists of an event trigger, an optional regex matcher, and an action, which may be a shell script, HTTP POST request, or a secondary lightweight LLM evaluation.3 Hooks act as absolute guardrails; for instance, a pre-execution hook that returns a non-zero exit code will immediately block the LLM's intended action, capturing the standard error output and feeding it back into the conversation as a system message to guide the LLM's correction.3

Agents, encompassing both primary orchestrators and specialized subagents, define autonomous execution loops governed by strict configurations including temperature settings, model routing preferences, and explicit tool permissions.6 Subagents function within mathematically isolated memory spaces, executing complex multi-step tasks before returning only synthesized summaries to the parent session, thereby preventing the primary context window from becoming polluted with raw operational data.5 Skills function as portable packages of domain expertise, containing a manifest with YAML frontmatter that dictates invocation rules, coupled with subdirectories for scripts and reference assets.1 The terminal employs a progressive disclosure paradigm for skills, loading only the descriptions into the default system prompt, and dynamically injecting the full markdown body only when the LLM determines the skill is required for the current task.1

MCP Servers operate as out-of-process tool providers, configured via a registry that defines the execution command required to spawn the local server or the network endpoint for a remote server.9 The terminal acts as the definitive MCP Host, proxying the negotiated JSON-RPC schemas directly into the function-calling mechanisms of the active LLM provider.8 Rules and Policy Packs represent always-on constraints, evaluated on two distinct fronts. For LLM guidance, rules are plain markdown files that establish coding conventions.1 For deterministic security constraints, the system adopts an Open Policy Agent (OPA) architecture, utilizing the declarative Rego language to validate the parameters of every tool input prior to execution.18 Scripts and automations serve as the foundational execution layer, representing arbitrary executables that provide the underlying logic for hooks and skills.3

## First-Class Implementations Versus Compatibility Shims

To fulfill the engineering constraint of preferring clean-room architecture over blind code copying, the system must differentiate rigidly between its native, first-class primitives and its legacy compatibility shims. The terminal's internal orchestration engine is designed entirely around native implementations that do not infringe upon proprietary codebases, ensuring a legally defensible and performant open-source foundation.

First-class primitives constitute the core functionality of the terminal. The Model Context Protocol is implemented natively as the absolute primary mechanism for extending agent capabilities, adhering strictly to the open specification without relying on third-party SDK wrappers.8 This ensures that any MCP-compliant server, regardless of its origin, interfaces flawlessly with the terminal.22 Parameterized commands are similarly native, utilizing high-performance Rust-like concurrency models to manage standard input and output streams during interactive terminal sessions.15 The continuous ingestion of project-level markdown context is also a native operation, maintaining an internal vector representation or localized memory cache to manage token limits efficiently.7

Compatibility shims operate strictly as just-in-time translation layers, existing purely to map foreign configuration schemas into the terminal's native in-memory representation. When the system detects a Claude-style plugin manifest, the compatibility shim parses the JSON document to identify the declared components.23 The shim dynamically translates the proprietary directory structures, mapping the foreign skills, hooks, and agents into the corresponding native structs utilized by the terminal's orchestration engine.24 This translation occurs entirely in memory at runtime, fulfilling interface compatibility without executing proprietary orchestration code.

A similar translation mechanism is employed for Cursor configurations. A dedicated file watcher monitors the workspace for legacy rule files.13 Upon detection, the compatibility shim utilizes an Abstract Syntax Tree (AST) parsing mechanism to extract the YAML frontmatter, process the glob filters, and separate the raw markdown instructions.14 These instructions are then dynamically converted into native contextual rules, ensuring that users migrating from legacy environments experience zero degradation in functionality or context awareness.13 This clean-room methodology guarantees that the terminal remains unencumbered by restrictive licenses while achieving complete ecosystem interoperability.

## Lifecycle States and Deterministic Execution Flow

Extensions within this architecture do not exist as static entities; they transition through a rigorous lifecycle governed by the terminal's core orchestration engine. Proper state management is mathematically critical for avoiding race conditions, preventing context overflow across multiple LLM calls, and ensuring absolute deterministic behavior in an otherwise non-deterministic probabilistic environment.

The integration of these extensions requires a unidirectional data flow architecture designed to handle the complexities of multi-model interactions. The following table defines the chronological lifecycle states applicable to all extension types within the terminal's architecture.

  

|   |   |   |   |
|---|---|---|---|
|Lifecycle State|Description|Applicable Extensions|Trigger Mechanism|
|Discovery|The terminal scans configured hierarchical directories for manifests and executable scripts.6|All Extensions|Application startup, explicit refresh command, or file watcher event.24|
|Validation|The system verifies JSON schema integrity, file execution permissions, and topological structures.23|Plugins, Skills, MCP Servers|Immediate post-discovery.23 Invalid configurations transition to a failure state.|
|Negotiation|Client-server handshakes establish supported features, schemas, and transport protocols.8|MCP Servers|Session start or dynamic server attachment.8|
|Registration|Extension metadata is loaded into the orchestration engine's active registry.1|Skills, Hooks, Commands, Agents|Session initialization. Only descriptions are loaded to minimize token consumption.1|
|Invocation|The extension is explicitly called by the user or dynamically selected via an LLM tool call.17|Commands, Skills, Agents, Tools|User slash command or LLM JSON output generation.1|
|Pre-Execution|Deterministic interceptor phase. Scripts and policies are evaluated before the primary action occurs.3|Hooks, Rego Policies|Triggered immediately before an invoked action executes. Can block execution entirely.4|
|Execution|The core logic of the extension is executed, running subprocesses, scripts, or LLM sub-loops.7|Commands, Scripts, Agents, Tools|Triggered exclusively after a successful and permitted Pre-Execution phase.|
|Post-Execution|Secondary interceptor phase for output formatting, cleanup, or subsequent triggers.19|Hooks|Triggered immediately upon completion of the Execution phase.19|
|Compaction|Memory management phase where large contexts from completed operations are summarized or evicted.6|Skills, Agents, Rules|Triggered when the active context window approaches maximum token thresholds.7|
|Termination|Graceful shutdown of subprocesses and release of allocated system resources and memory buffers.8|MCP Servers, Agents|Session end or explicit user-initiated kill command.|

The execution flow begins when a user provides a prompt via the TUI. The system immediately initiates the context assembly phase, gathering global rules, active MCP tool schemas, and registered skill descriptions into a unified payload.1 A pre-prompt hook intercepts this assembly, allowing automated scripts to append real-time context, such as git status or system metrics, before the payload reaches the LLM.20 The selected model, whether it is Claude, OpenAI, Gemini, or a local Ollama instance, processes this context through the normalization layer.

If the LLM determines an action is necessary, it emits a tool call. Before this call is honored, the system routes the raw JSON request to the pre-execution phase.3 Here, deterministic hook scripts and Rego policies evaluate the payload.3 If any hook exits with an error code, or if a policy evaluates to false, the action is blocked instantly. The standard error output is captured and fed back to the LLM as an execution failure, forcing the model to re-evaluate its approach.20 If the pre-execution checks pass, the terminal consults the permission matrix. If the tool requires explicit permission, the orchestration loop halts, and the TUI prompts the user.6 Upon authorization, the tool executes. The resulting standard output is captured, routed through post-execution hooks for potential formatting or linting, and finally returned to the LLM to complete the conversational turn.19 This rigorous lifecycle ensures that the LLM remains securely constrained by deterministic engineering principles.

## Installation, Resolution, and Context Boundaries

Managing extensibility across multiple projects, organizational teams, and distinct codebases requires a robust, hierarchically scoped boundary mechanism. The architecture must ensure that highly specific, project-level rules do not permanently pollute the global operational environment, while simultaneously allowing essential global utilities to remain universally available.

The system resolves extensions using a strict layered hierarchy. When naming collisions occur during the discovery phase, the most localized scope mathematically overrides the global scope, mirroring the conceptual resolution of environment variables.2 The system enforces three primary boundary levels. The Enterprise Scope represents managed policies pushed by IT administrators, typically residing in protected system directories. These policies establish non-negotiable Open Policy Agent security boundaries and cannot be overridden by user-level configurations.4 The Global User Scope contains extensions installed in the user's home directory, encompassing universally applicable CLI tools, heavily utilized MCP servers, and global workflow scripts.6 Finally, the Workspace Scope consists of extensions residing directly within the current working directory, governing project-specific workflows, local subagents, and repository-specific context guidelines.4

During initialization, the terminal's auto-discovery engine recursively traverses these hierarchical directories.17 It identifies extensions by scanning for specific file extensions and manifest schemas.24 To optimize initialization performance and prevent infinite loops in large monorepos, the discovery engine enforces a maximum directory traversal depth and strictly respects standard ignore patterns.26 Furthermore, the system dynamically sets environment variables during hook execution, ensuring that paths relative to the plugin root or the project workspace resolve accurately regardless of the terminal's current working directory.3

To manage external dependencies effectively, the terminal implements a package management mechanism capable of pulling extensions from remote repositories. To prevent redundant network operations across multiple projects utilizing the same MCP servers or standard plugins, the architecture employs a centralized plugin cache, structurally similar to the caching mechanisms utilized by infrastructure-as-code tools.27 The orchestrator computes a cryptographic hash of the requested extension and verifies if a matching semantic version exists within the local cache before initiating a remote download.27

All packaged plugins and MCP server manifests are required to declare a version string following Semantic Versioning principles, ensuring predictable upgrade paths.28 To mitigate namespace collisions between disparate plugins offering similarly named commands, the system enforces strict namespacing. If multiple plugins provide a tool with identical nomenclature, they must be invoked via their namespace, preventing ambiguous LLM tool execution.1 When conflict resolution is required for lifecycle hooks, the architecture dictates that identically targeted hooks do not override one another; rather, they concatenate into a deterministic execution chain, firing sequentially based on their hierarchical scope.1

## Trust, Security, and Granular Permission Models

Extensible AI agents operating within a terminal environment present unprecedented security vulnerabilities. By granting a non-deterministic LLM access to external APIs, persistent MCP servers, and local bash execution, the system introduces severe risks of prompt injection, unauthorized data exfiltration, and destructive filesystem modifications. The security model must therefore protect the user and the host machine without crushing the usability of the terminal beneath a barrage of authorization prompts.

The foundation of this security architecture is the absolute enforcement of the principle of least privilege.29 Extensions, subagents, and skills must explicitly declare the specific tools they require within their manifest frontmatter.30 If a subagent attempts to invoke a tool outside of its mathematically declared scope, the orchestrator intercepts and denies the request natively at the translation layer, effectively preventing the LLM from hallucinating unauthorized capabilities or attempting privilege escalation.6

To manage operational execution, the system implements a granular, rule-based permission matrix for all tool invocations.6 This matrix dictates three absolute behavioral states. The "Allow" state permits the tool to execute silently without user intervention, ideal for non-destructive operations such as reading files, utilizing the grep command, or making safe MCP data queries.6 The "Ask" state forces the execution loop to halt, displaying a highly visible prompt in the TUI that requires explicit human authorization before proceeding. This state is strictly applied to file modifications, network fetch requests, and standard bash commands.6 The "Deny" state completely disables the tool, removing it from the LLM's negotiated schema to prevent the generation of destructive shell commands or unauthorized external connections.6 This matrix evaluates commands contextually; a bash execution requesting status information can be evaluated as permissible, while a command requesting deletion evaluates as requiring explicit authorization based on regular expression matching.6

For enterprise deployments requiring compliance guarantees, simple pattern matching is insufficient. The architecture integrates an Open Policy Agent (OPA) engine to evaluate highly complex Rego policies during the pre-execution phase.18 Rego allows security engineers to express context-aware constraints as declarative code. By leveraging logical optimizations such as De Morgan's laws within the Rego syntax, the policy engine rapidly evaluates complex disjunctions without introducing significant latency into the LLM conversational loop.31 For example, a Rego policy can mathematically guarantee that an MCP server can only access the local filesystem if the requested absolute path resolves strictly within the current working directory, programmatically neutralizing path traversal attacks regardless of the LLM's output.18

Explaining these complex security boundaries to users requires a carefully considered UX design. Alert fatigue is a critical vulnerability; if users are constantly bombarded with prompts, they will blindly approve destructive actions.32 The TUI mitigates this through progressive trust paradigms.32 When an authorization prompt appears, the interface explicitly displays the exact command, the originating agent, and the specific files targeted, preventing obfuscation.32 Users possess the capability to manually edit the command string within the terminal prompt before granting approval.32 To maintain flow, users can grant session-level trust, temporarily elevating a specific tool's permission status for a bounded timeframe.32 Furthermore, every tool execution is logged with high fidelity into a persistent local SQLite database, generating a comprehensive, tamper-evident audit trail of the agent's actions for subsequent review.7

## Terminal User Interface (TUI) Patterns for Orchestration

The Terminal User Interface is the defining architectural feature of a Warp-class control center. Standard, sequential scrolling text interfaces are entirely inadequate for managing the complexity of concurrent AI agent loops, monitoring multiple active MCP servers, and navigating deeply nested plugin structures. The TUI must leverage modern, high-performance compositor patterns, structurally similar to advanced terminal frameworks, to manage asynchronous state updates and complex rendering topologies without blocking the primary input thread.33

The interface model abandons standard chat paradigms in favor of dedicated, switchable dashboards, drawing heavy inspiration from advanced operational tools designed for complex cluster management and version control.35

The Rules Manager provides critical observability into the exact context the LLM is consuming. The visual layout consists of a dual-pane viewport. The left pane lists all active context sources hierarchically, distinguishing between global enterprise policies, local workspace rules, and migrated legacy instructions. The right pane displays the compiled markdown payload exactly as it will be transmitted to the LLM provider. Users can dynamically toggle specific rules on or off with a single keystroke. As rules are manipulated, the UI updates the estimated token count in real-time, empowering developers to actively balance context richness against API latency and cost limitations.7

Managing external capabilities necessitates the MCP Manager, as these servers represent powerful vectors for both productivity and potential systemic failure. The visual layout mirrors container management interfaces, presenting a comprehensive list of configured MCP servers alongside deterministic status indicators representing connected, negotiating, or failed states.35 Selecting a specific server expands a detailed nested view, enumerating the exact Tools, Resources, and Prompts successfully negotiated during the initial lifecycle handshake.8 Crucially, a dedicated debugging pane tails the raw JSON-RPC traffic for the selected server, enabling developers to inspect the exact payloads generated by the LLM and the subsequent responses, a feature essential for diagnosing silent schema failures.1

The Script and Hook Manager addresses the inherent invisibility of deterministic lifecycle interceptors. Because hooks operate in the background, a script blocking an LLM action without clear feedback results in severe developer confusion.4 The visual layout provides a dashboard listing all registered event hooks grouped by their lifecycle trigger. It displays the regex matchers responsible for each hook. When a hook fires, a temporary visual badge indicates its exit status. If a hook blocks an action, the TUI must surface a highly visible modal overlay directly within the primary interaction interface, unequivocally stating which script blocked the action and rendering the standard error output, ensuring the user possesses complete diagnostic context.20

For complex, multi-step engineering tasks, the interface transitions to the Autonomous Orchestrator View. Inspired by continuous execution tools, when a team of subagents is launched, the interface abandons the standard chat prompt entirely.36 This dashboard presents a Kanban-style visualization of planned sub-tasks, tracks active subagents executing in parallel, and provides a live, scrolling tail of the tools currently being utilized by the models.36 The orchestrator utilizes token-based completion detection to recognize when an agent has successfully fulfilled its objective, automatically advancing the loop to the next sequential task.36 A centralized, immediate interruption mechanism is prominently featured, guaranteed to send termination signals to all active child processes and subprocesses, fulfilling the strict requirement for absolute user control over autonomous behaviors.32

## Migration Strategies for Legacy Ecosystems

A newly architected terminal environment, regardless of its technical superiority, will encounter insurmountable adoption friction if developers cannot seamlessly migrate their existing, highly customized configurations. The architecture must therefore provide mathematically frictionless, automated migration pathways from the two dominant legacy paradigms: the Claude Code ecosystem and the Cursor editor environment.

Because the terminal employs a sophisticated compatibility shim at its core, migration from Claude Code is primarily a structural mapping operation rather than a manual translation effort. The system natively parses the directory structures associated with Claude plugins and parses the JSON manifests without modification.24 Users simply re-point the terminal's configuration paths to their existing directories. Claude Code relies on storing deterministic hooks within a generic JSON settings file.4 The migration tooling reads this document, maps the proprietary event nomenclature to the terminal's internal, standardized event bus, and leaves the underlying shell scripts entirely untouched. The scripts execute within the new environment exactly as originally engineered.19 Similarly, external tool setups utilizing MCP configurations are parsed identically, ensuring immediate operational readiness.14

Migrating from the Cursor ecosystem requires a more complex semantic translation. Cursor environments rely heavily on specific rule files containing YAML frontmatter that dictates contextual applicability based on filesystem matching.13 The terminal includes a dedicated migration utility that executes an automated conversion process. This command utilizes an Abstract Syntax Tree parser to programmatically separate the declarative YAML instructions from the qualitative markdown bodies.14

The logic mapping phase interprets the extracted frontmatter. If the legacy file dictates unconditional application, the textual content is seamlessly merged into the terminal's global project rules, equivalent to appending a standard markdown context file.13 If the frontmatter contains specific glob patterns, the system algorithmically converts these patterns into dynamic, conditional rules within the terminal's active memory registry. The orchestrator will only inject the associated markdown body into the active LLM context window when the user's prompt or the agent's current working directory intersects mathematically with the specified glob pattern, optimizing token usage while maintaining strict parity with the legacy environment.13 Crucially, this migration utility operates in a strictly non-destructive manner. It copies the translated logic into the terminal's native directory structure while leaving the original legacy files entirely intact and unmodified. This ensures that engineering teams can maintain dual-compatibility during complex, staggered transition periods without risking data loss or operational disruption.14

Recommended Extension Architecture For VALXOS

#### Works cited

1. Extend Claude Code - Claude Code Docs, accessed on April 6, 2026, [https://code.claude.com/docs/en/features-overview](https://code.claude.com/docs/en/features-overview)
    
2. Create plugins - Claude Code Docs, accessed on April 6, 2026, [https://code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
    
3. Hooks reference - Claude Code Docs, accessed on April 6, 2026, [https://code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks)
    
4. Understanding Claude Code hooks documentation - PromptLayer Blog, accessed on April 6, 2026, [https://blog.promptlayer.com/understanding-claude-code-hooks-documentation/](https://blog.promptlayer.com/understanding-claude-code-hooks-documentation/)
    
5. Create custom subagents - Claude Code Docs, accessed on April 6, 2026, [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)
    
6. Agents | OpenCode, accessed on April 6, 2026, [https://opencode.ai/docs/agents/](https://opencode.ai/docs/agents/)
    
7. Architecture - OpenCode - Mintlify, accessed on April 6, 2026, [https://mintlify.com/opencode-ai/opencode/core-concepts/architecture](https://mintlify.com/opencode-ai/opencode/core-concepts/architecture)
    
8. Specification - Model Context Protocol, accessed on April 6, 2026, [https://modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
    
9. Model Context Protocol (MCP) explained: An FAQ - Vercel, accessed on April 6, 2026, [https://vercel.com/blog/model-context-protocol-mcp-explained](https://vercel.com/blog/model-context-protocol-mcp-explained)
    
10. What is Model Context Protocol (MCP)? A guide | Google Cloud, accessed on April 6, 2026, [https://cloud.google.com/discover/what-is-model-context-protocol](https://cloud.google.com/discover/what-is-model-context-protocol)
    
11. Model Context Protocol (MCP): A comprehensive introduction for developers - Stytch, accessed on April 6, 2026, [https://stytch.com/blog/model-context-protocol-introduction/](https://stytch.com/blog/model-context-protocol-introduction/)
    
12. Lifecycle - Model Context Protocol, accessed on April 6, 2026, [https://modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle](https://modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle)
    
13. StackOneHQ/cursor-rules-to-claude - GitHub, accessed on April 6, 2026, [https://github.com/StackOneHQ/cursor-rules-to-claude](https://github.com/StackOneHQ/cursor-rules-to-claude)
    
14. Migrate from Cursor - Conductor, accessed on April 6, 2026, [https://docs.conductor.build/guides/migrate-from-cursor](https://docs.conductor.build/guides/migrate-from-cursor)
    
15. Warp Drive Workflows, accessed on April 6, 2026, [https://docs.warp.dev/knowledge-and-collaboration/warp-drive/workflows](https://docs.warp.dev/knowledge-and-collaboration/warp-drive/workflows)
    
16. Using Workflows and Commands.dev to Remember Commands We Often Forget - Warp, accessed on April 6, 2026, [https://www.warp.dev/blog/using-workflows-and-commands-dev-to-remember-commands-we-often-forget](https://www.warp.dev/blog/using-workflows-and-commands-dev-to-remember-commands-we-often-forget)
    
17. Agent Skills | Microsoft Learn, accessed on April 6, 2026, [https://learn.microsoft.com/en-us/agent-framework/agents/skills](https://learn.microsoft.com/en-us/agent-framework/agents/skills)
    
18. Policy Language, accessed on April 6, 2026, [https://openpolicyagent.org/docs/policy-language](https://openpolicyagent.org/docs/policy-language)
    
19. Automate workflows with hooks - Claude Code Docs, accessed on April 6, 2026, [https://code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide)
    
20. Introduction to Hooks | CodeSignal Learn, accessed on April 6, 2026, [https://codesignal.com/learn/courses/automating-workflows-with-hooks/lessons/introduction-to-hooks](https://codesignal.com/learn/courses/automating-workflows-with-hooks/lessons/introduction-to-hooks)
    
21. Getting started with Open Policy Agent (OPA) to improve your cloud security | Wiz Blog, accessed on April 6, 2026, [https://www.wiz.io/blog/getting-started-with-open-policy-agent-opa-to-improve-your-cloud-security](https://www.wiz.io/blog/getting-started-with-open-policy-agent-opa-to-improve-your-cloud-security)
    
22. modelcontextprotocol/servers: Model Context Protocol Servers - GitHub, accessed on April 6, 2026, [https://github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
    
23. cc-marketplace/PLUGIN_SCHEMA.md at main - GitHub, accessed on April 6, 2026, [https://github.com/ananddtyagi/claude-code-marketplace/blob/main/PLUGIN_SCHEMA.md](https://github.com/ananddtyagi/claude-code-marketplace/blob/main/PLUGIN_SCHEMA.md)
    
24. plugin-structure | Skills Marketplace - LobeHub, accessed on April 6, 2026, [https://lobehub.com/it/skills/sjnims-plugin-dev-plugin-structure](https://lobehub.com/it/skills/sjnims-plugin-dev-plugin-structure)
    
25. michael-elkabetz/cursor-rules-to-claude - GitHub, accessed on April 6, 2026, [https://github.com/michael-elkabetz/cursor-rules-to-claude](https://github.com/michael-elkabetz/cursor-rules-to-claude)
    
26. Built-in tools - CLI - Docs - Kiro, accessed on April 6, 2026, [https://kiro.dev/docs/cli/reference/built-in-tools/](https://kiro.dev/docs/cli/reference/built-in-tools/)
    
27. CLI Configuration File ( .tofurc or tofu.rc ) - OpenTofu, accessed on April 6, 2026, [https://opentofu.org/docs/cli/config/config-file/](https://opentofu.org/docs/cli/config/config-file/)
    
28. CLI Design Best Practices - Cody A. Ray, accessed on April 6, 2026, [https://codyaray.com/2020/07/cli-design-best-practices](https://codyaray.com/2020/07/cli-design-best-practices)
    
29. Best Practices of Authorizing AI Agents - Oso, accessed on April 6, 2026, [https://www.osohq.com/learn/best-practices-of-authorizing-ai-agents](https://www.osohq.com/learn/best-practices-of-authorizing-ai-agents)
    
30. OpenAgentsControl/docs/features/agent-system-blueprint.md at main - GitHub, accessed on April 6, 2026, [https://github.com/darrenhinde/OpenAgentsControl/blob/main/docs/features/agent-system-blueprint.md](https://github.com/darrenhinde/OpenAgentsControl/blob/main/docs/features/agent-system-blueprint.md)
    
31. 5 tips for using the Rego language for Open Policy Agent (OPA) - Snyk, accessed on April 6, 2026, [https://snyk.io/blog/5-tips-for-using-the-rego-language-for-open-policy-agent-opa/](https://snyk.io/blog/5-tips-for-using-the-rego-language-for-open-policy-agent-opa/)
    
32. UX Design for AI Agent Applications: A Practical Guide | by Amarpreet Bhatia | Medium, accessed on April 6, 2026, [https://medium.com/@amarpreetbhatia/ux-design-for-ai-agent-applications-a-practical-guide-ce41a6d545ab](https://medium.com/@amarpreetbhatia/ux-design-for-ai-agent-applications-a-practical-guide-ce41a6d545ab)
    
33. TUI Component Design Patterns | Claude Code Skill - MCP Market, accessed on April 6, 2026, [https://mcpmarket.com/tools/skills/tui-component-design-patterns](https://mcpmarket.com/tools/skills/tui-component-design-patterns)
    
34. GitHub - DokaDev/lazytui: Component-based TUI framework for Go. Build terminal apps like LazyGit with panels, modals, tabs, and background tasks. Wraps gocui & lazycore to reduce boilerplate. Focus on features, not terminal APIs., accessed on April 6, 2026, [https://github.com/DokaDev/lazytui](https://github.com/DokaDev/lazytui)
    
35. Essential CLI/TUI Tools for Developers - freeCodeCamp, accessed on April 6, 2026, [https://www.freecodecamp.org/news/essential-cli-tui-tools-for-developers/](https://www.freecodecamp.org/news/essential-cli-tui-tools-for-developers/)
    
36. Introduction | Ralph TUI, accessed on April 6, 2026, [https://ralph-tui.com/docs](https://ralph-tui.com/docs)
    
37. Ralph TUI: AI Agent Orchestration That Actually Works - Peerlist, accessed on April 6, 2026, [https://peerlist.io/leonardo_zanobi/articles/ralph-tui-ai-agent-orchestration-that-actually-works](https://peerlist.io/leonardo_zanobi/articles/ralph-tui-ai-agent-orchestration-that-actually-works)
    

**