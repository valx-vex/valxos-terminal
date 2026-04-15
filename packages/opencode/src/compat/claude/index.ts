import { buffer } from "node:stream/consumers"
import { Config } from "@/config/config"
import { Permission } from "@/permission"
import { Process } from "@/util/process"
import { errorMessage } from "@/util/error"
import { Log } from "@/util/log"
import { Shell } from "@/shell/shell"
import { Effect, Layer, ServiceMap } from "effect"
import type { ClaudeCompatState, ClaudeHookDefinition } from "./config"

export type {
  ClaudeCompatConfig,
  ClaudeCompatDiagnostic,
  ClaudeCompatDiscovery,
  ClaudeCompatProvenance,
  ClaudeCompatState,
  ClaudeHookDefinition,
  ClaudeHookEventName,
  ClaudePluginManifest,
} from "./config"
export { discoverClaudeCompat } from "./config"

type HookPayload = Record<string, unknown>

type HookOutput = {
  continue?: boolean
  suppressOutput?: boolean
  systemMessage?: string
  stopReason?: string
  hookSpecificOutput?: {
    hookEventName?: string
    additionalContext?: string
    permissionDecision?: "allow" | "deny" | "ask"
    permissionDecisionReason?: string
  }
}

type HookRunResult = {
  blocked: boolean
  reason?: string
  decision?: "allow" | "deny" | "ask"
  additionalContext: string[]
  systemMessages: string[]
}

export namespace ClaudeCompat {
  const log = Log.create({ service: "claude-compat" })

  export class HookBlockedError extends Error {
    constructor(
      readonly event: string,
      readonly source: string,
      message: string,
    ) {
      super(message)
      this.name = "ClaudeHookBlockedError"
    }
  }

  export interface Interface {
    readonly sessionStart: (input: { cwd: string; sessionID: string; trigger?: string }) => Effect.Effect<string[]>
    readonly userPromptSubmit: (input: {
      cwd: string
      sessionID: string
      prompt: string
    }) => Effect.Effect<string[]>
    readonly preToolUse: (input: {
      cwd: string
      sessionID: string
      tool: string
      args: unknown
    }) => Effect.Effect<void, HookBlockedError>
    readonly postToolUse: (input: {
      cwd: string
      sessionID: string
      tool: string
      args: unknown
      output: unknown
    }) => Effect.Effect<void, HookBlockedError>
    readonly permissionRequest: (input: {
      cwd: string
      sessionID: string
      permission: string
      patterns: string[]
      metadata: Record<string, unknown>
    }) => Effect.Effect<Permission.Action | undefined>
    readonly stop: (input: { cwd: string; sessionID: string; reason?: string }) => Effect.Effect<void>
    readonly sessionEnd: (input: { cwd: string; sessionID: string; reason?: string }) => Effect.Effect<void>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/ClaudeCompat") {}

  function matchHook(hook: ClaudeHookDefinition, matcher?: string) {
    if (!hook.matcher) return true
    if (!matcher) return false
    try {
      return new RegExp(hook.matcher).test(matcher)
    } catch {
      return hook.matcher === matcher
    }
  }

  function parseHookOutput(stdout: string): HookOutput | undefined {
    const trimmed = stdout.trim()
    if (!trimmed) return

    try {
      return JSON.parse(trimmed) as HookOutput
    } catch {}

    const lines = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines.toReversed()) {
      try {
        return JSON.parse(line) as HookOutput
      } catch {}
    }
  }

  async function executeHook(
    hook: ClaudeHookDefinition,
    input: { cwd: string; payload: HookPayload; env?: NodeJS.ProcessEnv },
  ) {
    const shell = Shell.preferred()
    const args = Shell.login(shell) ? ["-lc", hook.command] : ["-c", hook.command]
    const proc = Process.spawn([shell, ...args], {
      cwd: input.cwd,
      env: {
        ...input.env,
        ...(hook.root && { CLAUDE_PLUGIN_ROOT: hook.root }),
      },
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      timeout: hook.timeout ? hook.timeout * 1000 : 5_000,
    })

    proc.stdin?.end(JSON.stringify(input.payload))

    const [code, stdout, stderr] = await Promise.all([
      proc.exited,
      proc.stdout ? buffer(proc.stdout) : Promise.resolve(Buffer.alloc(0)),
      proc.stderr ? buffer(proc.stderr) : Promise.resolve(Buffer.alloc(0)),
    ])

    return {
      code,
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      parsed: parseHookOutput(stdout.toString()),
    }
  }

  async function runHooks(
    state: ClaudeCompatState | undefined,
    event: string,
    input: {
      matcher?: string
      cwd: string
      payload: HookPayload
      env?: NodeJS.ProcessEnv
    },
  ): Promise<HookRunResult> {
    const hooks = (state?.hooks ?? []).filter((hook) => hook.event === event && matchHook(hook, input.matcher))
    const result: HookRunResult = {
      blocked: false,
      additionalContext: [],
      systemMessages: [],
    }

    for (const hook of hooks) {
      try {
        const exec = await executeHook(hook, input)
        const parsed = exec.parsed
        const decision = parsed?.hookSpecificOutput?.permissionDecision
        const reason =
          parsed?.hookSpecificOutput?.permissionDecisionReason ||
          parsed?.stopReason ||
          parsed?.systemMessage ||
          exec.stderr.trim() ||
          exec.stdout.trim()

        if (parsed?.hookSpecificOutput?.additionalContext) {
          result.additionalContext.push(parsed.hookSpecificOutput.additionalContext)
        }
        if (parsed?.systemMessage && parsed.suppressOutput !== true) {
          result.systemMessages.push(parsed.systemMessage)
        }
        if (decision) result.decision = decision
        if (exec.code === 2 || parsed?.continue === false || decision === "deny") {
          result.blocked = true
          result.reason = reason || `${event} hook blocked execution`
          return result
        }
      } catch (error) {
        log.warn("claude hook failed", {
          event,
          source: hook.source,
          error: errorMessage(error),
        })
      }
    }

    return result
  }

  function hookPayload(input: {
    sessionID: string
    cwd: string
    event: string
    prompt?: string
    tool?: string
    args?: unknown
    output?: unknown
    permission?: string
    patterns?: string[]
    metadata?: Record<string, unknown>
    reason?: string
  }): HookPayload {
    return {
      event: input.event,
      session_id: input.sessionID,
      sessionId: input.sessionID,
      cwd: input.cwd,
      prompt: input.prompt,
      raw_user_prompt: input.prompt,
      rawUserPrompt: input.prompt,
      tool_name: input.tool,
      toolName: input.tool,
      tool_input: input.args,
      toolInput: input.args,
      tool_result: input.output,
      toolResult: input.output,
      permission: input.permission,
      patterns: input.patterns,
      metadata: input.metadata,
      stop_reason: input.reason,
      stopReason: input.reason,
    }
  }

  function appendMessages(result: HookRunResult) {
    return [...result.additionalContext, ...result.systemMessages].filter(Boolean)
  }

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const config = yield* Config.Service

      const sessionStart = Effect.fn("ClaudeCompat.sessionStart")(function* (input: {
        cwd: string
        sessionID: string
        trigger?: string
      }) {
        const state = yield* config.get()
        const result = yield* Effect.promise(() =>
          runHooks(state.claude, "SessionStart", {
            matcher: input.trigger ?? "startup",
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              event: "SessionStart",
              reason: input.trigger ?? "startup",
            }),
          }),
        )
        return appendMessages(result)
      })

      const userPromptSubmit = Effect.fn("ClaudeCompat.userPromptSubmit")(function* (input: {
        cwd: string
        sessionID: string
        prompt: string
      }) {
        const state = yield* config.get()
        const result = yield* Effect.promise(() =>
          runHooks(state.claude, "UserPromptSubmit", {
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              prompt: input.prompt,
              event: "UserPromptSubmit",
            }),
          }),
        )
        return appendMessages(result)
      })

      const preToolUse = Effect.fn("ClaudeCompat.preToolUse")(function* (input: {
        cwd: string
        sessionID: string
        tool: string
        args: unknown
      }) {
        const state = yield* config.get()
        const result = yield* Effect.promise(() =>
          runHooks(state.claude, "PreToolUse", {
            matcher: input.tool,
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              tool: input.tool,
              args: input.args,
              event: "PreToolUse",
            }),
          }),
        )

        if (result.decision === "ask" && !result.blocked) {
          throw new HookBlockedError("PreToolUse", "claude", result.reason || "Claude hook requested approval")
        }
        if (result.blocked) {
          throw new HookBlockedError("PreToolUse", "claude", result.reason || "Blocked by Claude hook")
        }
      })

      const postToolUse = Effect.fn("ClaudeCompat.postToolUse")(function* (input: {
        cwd: string
        sessionID: string
        tool: string
        args: unknown
        output: unknown
      }) {
        const state = yield* config.get()
        const result = yield* Effect.promise(() =>
          runHooks(state.claude, "PostToolUse", {
            matcher: input.tool,
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              tool: input.tool,
              args: input.args,
              output: input.output,
              event: "PostToolUse",
            }),
          }),
        )

        if (result.blocked) {
          throw new HookBlockedError("PostToolUse", "claude", result.reason || "Blocked by Claude hook")
        }
      })

      const permissionRequest = Effect.fn("ClaudeCompat.permissionRequest")(function* (input: {
        cwd: string
        sessionID: string
        permission: string
        patterns: string[]
        metadata: Record<string, unknown>
      }) {
        const state = yield* config.get()
        const result = yield* Effect.promise(() =>
          runHooks(state.claude, "PermissionRequest", {
            matcher: input.permission,
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              permission: input.permission,
              patterns: input.patterns,
              metadata: input.metadata,
              event: "PermissionRequest",
            }),
          }),
        )
        if (result.blocked) return "deny" as const
        return result.decision
      })

      const stop = Effect.fn("ClaudeCompat.stop")(function* (input: {
        cwd: string
        sessionID: string
        reason?: string
      }) {
        const state = yield* config.get()
        yield* Effect.promise(() =>
          runHooks(state.claude, "Stop", {
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              event: "Stop",
              reason: input.reason,
            }),
          }),
        ).pipe(Effect.ignore)
      })

      const sessionEnd = Effect.fn("ClaudeCompat.sessionEnd")(function* (input: {
        cwd: string
        sessionID: string
        reason?: string
      }) {
        const state = yield* config.get()
        yield* Effect.promise(() =>
          runHooks(state.claude, "SessionEnd", {
            cwd: input.cwd,
            payload: hookPayload({
              sessionID: input.sessionID,
              cwd: input.cwd,
              event: "SessionEnd",
              reason: input.reason,
            }),
          }),
        ).pipe(Effect.ignore)
      })

      return Service.of({
        sessionStart,
        userPromptSubmit,
        preToolUse,
        postToolUse,
        permissionRequest,
        stop,
        sessionEnd,
      })
    }),
  )

  export const defaultLayer = layer.pipe(Layer.provide(Config.defaultLayer))
}
