import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import path from "path"
import { DoctorReport } from "../../src/doctor/report"
import { Global } from "../../src/global"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

describe("DoctorReport", () => {
  let originalHome: string | undefined
  let originalConfig: string

  beforeEach(() => {
    originalHome = process.env.OPENCODE_TEST_HOME
    originalConfig = Global.Path.config
  })

  afterEach(() => {
    if (originalHome === undefined) delete process.env.OPENCODE_TEST_HOME
    else process.env.OPENCODE_TEST_HOME = originalHome
    ;(Global.Path as { config: string }).config = originalConfig
  })

  test("summarizes Claude-compatible project surfaces", async () => {
    await using home = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, ".claude", "CLAUDE.md"), "# User Claude")
      },
    })
    await using config = await tmpdir()
    await using workspace = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "CLAUDE.md"), "# Project Claude")
        await Bun.write(
          path.join(dir, ".claude", "settings.local.json"),
          JSON.stringify({
            mcpServers: {
              localClaude: {
                command: "bun",
                args: ["--version"],
              },
            },
          }),
        )
        await Bun.write(
          path.join(dir, ".mcp.json"),
          JSON.stringify({
            projectRemote: {
              url: "https://example.com/mcp",
            },
          }),
        )
        await Bun.write(
          path.join(dir, ".claude", "skills", "repo-skill", "SKILL.md"),
          [
            "---",
            "name: repo-skill",
            "description: Repo skill",
            "---",
            "",
            "Use this skill.",
          ].join("\n"),
        )
        await Bun.write(path.join(dir, ".claude", "agents", "reviewer.md"), "You review code.")
        await Bun.write(
          path.join(dir, ".claude-plugin", "plugin.json"),
          JSON.stringify({
            name: "repo-plugin",
            version: "0.1.0",
          }),
        )
        await Bun.write(
          path.join(dir, "hooks", "hooks.json"),
          JSON.stringify({
            hooks: {
              SessionStart: [{ hooks: [{ type: "command", command: "true" }] }],
            },
          }),
        )
      },
    })

    process.env.OPENCODE_TEST_HOME = home.path
    ;(Global.Path as { config: string }).config = config.path

    const report = await Instance.provide({
      directory: workspace.path,
      fn: async () => {
        try {
          return await DoctorReport.build()
        } finally {
          await Instance.dispose()
        }
      },
    })

    expect(report.status.level).toBe("ready")
    expect(report.instructions.claude.project).toBe(path.join(workspace.path, "CLAUDE.md"))
    expect(report.instructions.claude.user).toBe(path.join(home.path, ".claude", "CLAUDE.md"))
    expect(report.claude.skills.project).toHaveLength(1)
    expect(report.claude.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: path.join(workspace.path, ".claude", "agents", "reviewer.md"),
        }),
      ]),
    )
    expect(report.claude.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "repo-plugin",
        }),
      ]),
    )
    expect(report.native.effectiveMcpCount).toBe(2)
    expect(DoctorReport.format(report)).toContain("Ready To Test")
  })

  test("keeps working when Claude agents are invalid and records diagnostics", async () => {
    await using home = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, ".claude", "agents", "broken.md"),
          [
            "---",
            "tools: nope",
            "---",
            "",
            "Broken agent",
          ].join("\n"),
        )
      },
    })
    await using config = await tmpdir()
    await using workspace = await tmpdir()

    process.env.OPENCODE_TEST_HOME = home.path
    ;(Global.Path as { config: string }).config = config.path

    const report = await Instance.provide({
      directory: workspace.path,
      fn: async () => {
        try {
          return await DoctorReport.build()
        } finally {
          await Instance.dispose()
        }
      },
    })

    expect(report.claude.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: path.join(home.path, ".claude", "agents", "broken.md"),
        }),
      ]),
    )
  })
})
