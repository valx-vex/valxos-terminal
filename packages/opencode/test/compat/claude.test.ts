import { describe, expect, test } from "bun:test"
import fs from "fs/promises"
import path from "path"
import { Effect, Layer } from "effect"
import { ClaudeCompat, discoverClaudeCompat, type ClaudeCompatState } from "../../src/compat/claude"
import { Config } from "../../src/config/config"
import { tmpdir } from "../fixture/fixture"

function live(state: ClaudeCompatState | undefined) {
  const config = Layer.mock(Config.Service)({
    get: () => Effect.succeed({ claude: state } as Config.Info),
  })
  return ClaudeCompat.layer.pipe(Layer.provide(config))
}

function run<A, E>(effect: Effect.Effect<A, E, ClaudeCompat.Service>, state: ClaudeCompatState | undefined) {
  return Effect.runPromise(effect.pipe(Effect.provide(live(state))))
}

async function writeHookScript(file: string, source: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await Bun.write(file, source)
}

describe("claude compat discovery", () => {
  test("discovers root and nested plugin manifests, MCP entries, and hook diagnostics", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await fs.mkdir(path.join(dir, ".claude-plugin"), { recursive: true })
        await Bun.write(
          path.join(dir, ".claude-plugin", "plugin.json"),
          JSON.stringify({ name: "root-plugin", version: "1.0.0" }),
        )
        await fs.mkdir(path.join(dir, "hooks"), { recursive: true })
        await Bun.write(
          path.join(dir, "hooks", "hooks.json"),
          JSON.stringify({
            hooks: {
              SessionStart: [{ hooks: [{ type: "command", command: "true" }] }],
              UnsupportedEvent: [{ hooks: [{ type: "command", command: "true" }] }],
            },
          }),
        )
        await Bun.write(
          path.join(dir, ".mcp.json"),
          JSON.stringify({
            project: {
              url: "https://project.example.com/mcp",
            },
          }),
        )

        const nested = path.join(dir, "vex-plugin")
        await fs.mkdir(path.join(nested, ".claude-plugin"), { recursive: true })
        await Bun.write(
          path.join(nested, ".claude-plugin", "plugin.json"),
          JSON.stringify({ name: "vex-plugin", version: "0.2.0" }),
        )
        await fs.mkdir(path.join(nested, "hooks"), { recursive: true })
        await Bun.write(
          path.join(nested, "hooks", "hooks.json"),
          JSON.stringify({
            hooks: {
              PreToolUse: [{ matcher: "bash", hooks: [{ type: "command", command: "true" }] }],
            },
          }),
        )
        await Bun.write(
          path.join(nested, ".mcp.json"),
          JSON.stringify({
            vex: {
              command: "bun",
              args: ["--version"],
            },
          }),
        )
      },
    })

    const discovery = await discoverClaudeCompat({
      directory: tmp.path,
      worktree: tmp.path,
      homeDir: tmp.path,
    })

    expect(discovery.state?.manifests.map((item) => item.name).sort()).toEqual(["root-plugin", "vex-plugin"])
    expect(Object.keys(discovery.config.mcp ?? {}).sort()).toEqual(["project", "vex"])
    expect(discovery.state?.hooks.map((item) => item.event).sort()).toEqual(["PreToolUse", "SessionStart"])
    expect(discovery.state?.provenance.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("UnsupportedEvent"),
        }),
      ]),
    )
  })
})

describe("claude compat hooks", () => {
  test("sessionStart returns additional context and lifecycle hooks execute", async () => {
    await using tmp = await tmpdir()
    const hookFile = path.join(tmp.path, "hooks", "lifecycle.mjs")
    const logFile = path.join(tmp.path, "hooks.log")
    await writeHookScript(
      hookFile,
      `
import fs from "node:fs"

const payload = JSON.parse(await new Response(process.stdin).text())
if (payload.event === "SessionStart") {
  process.stdout.write(JSON.stringify({
    continue: true,
    systemMessage: "session-system",
    hookSpecificOutput: {
      additionalContext: "session-context"
    }
  }))
} else {
  fs.appendFileSync(process.argv[2], payload.event + "\\n")
  process.stdout.write("{}")
}
`,
    )

    const state: ClaudeCompatState = {
      hooks: [
        {
          event: "SessionStart",
          command: `bun ${JSON.stringify(hookFile)} ${JSON.stringify(logFile)}`,
          source: hookFile,
        },
        {
          event: "Stop",
          command: `bun ${JSON.stringify(hookFile)} ${JSON.stringify(logFile)}`,
          source: hookFile,
        },
        {
          event: "SessionEnd",
          command: `bun ${JSON.stringify(hookFile)} ${JSON.stringify(logFile)}`,
          source: hookFile,
        },
      ],
      manifests: [],
      provenance: {
        settings: [],
        mcp: [],
        plugins: [],
        agents: [],
        hooks: [],
        diagnostics: [],
      },
    }

    const messages = await run(
      ClaudeCompat.Service.use((svc) =>
        Effect.gen(function* () {
          const start = yield* svc.sessionStart({
            cwd: tmp.path,
            sessionID: "ses_test" as any,
            trigger: "startup",
          })
          yield* svc.stop({ cwd: tmp.path, sessionID: "ses_test" as any, reason: "complete" })
          yield* svc.sessionEnd({ cwd: tmp.path, sessionID: "ses_test" as any, reason: "complete" })
          return start
        }),
      ),
      state,
    )

    const log = await Bun.file(logFile).text()
    expect(messages).toEqual(["session-context", "session-system"])
    expect(log.trim().split("\n")).toEqual(["Stop", "SessionEnd"])
  })

  test("preToolUse blocks when hook exits with code 2", async () => {
    await using tmp = await tmpdir()
    const hookFile = path.join(tmp.path, "hooks", "deny.mjs")
    await writeHookScript(
      hookFile,
      `
process.stdout.write(JSON.stringify({
  continue: false,
  systemMessage: "blocked"
}))
process.exit(2)
`,
    )

    const state: ClaudeCompatState = {
      hooks: [
        {
          event: "PreToolUse",
          matcher: "bash",
          command: `bun ${JSON.stringify(hookFile)}`,
          source: hookFile,
        },
      ],
      manifests: [],
      provenance: {
        settings: [],
        mcp: [],
        plugins: [],
        agents: [],
        hooks: [],
        diagnostics: [],
      },
    }

    await expect(
      run(
        ClaudeCompat.Service.use((svc) =>
          svc.preToolUse({
            cwd: tmp.path,
            sessionID: "ses_test" as any,
            tool: "bash",
            args: { command: "rm -rf ." },
          }),
        ),
        state,
      ),
    ).rejects.toBeInstanceOf(ClaudeCompat.HookBlockedError)
  })

  test("invalid post-tool hook output is non-fatal", async () => {
    await using tmp = await tmpdir()
    const hookFile = path.join(tmp.path, "hooks", "invalid.mjs")
    await writeHookScript(
      hookFile,
      `
console.log("this is not json")
`,
    )

    const state: ClaudeCompatState = {
      hooks: [
        {
          event: "PostToolUse",
          matcher: "bash",
          command: `bun ${JSON.stringify(hookFile)}`,
          source: hookFile,
        },
      ],
      manifests: [],
      provenance: {
        settings: [],
        mcp: [],
        plugins: [],
        agents: [],
        hooks: [],
        diagnostics: [],
      },
    }

    await expect(
      run(
        ClaudeCompat.Service.use((svc) =>
          svc.postToolUse({
            cwd: tmp.path,
            sessionID: "ses_test" as any,
            tool: "bash",
            args: { command: "echo ok" },
            output: { output: "ok" },
          }),
        ),
        state,
      ),
    ).resolves.toBeUndefined()
  })
})
