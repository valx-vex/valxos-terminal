import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import { ValxosOverview } from "../../src/control-plane/overview"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { resetDatabase } from "../fixture/db"
import { tmpdir } from "../fixture/fixture"

afterEach(async () => {
  await resetDatabase()
})

describe("ValxosOverview", () => {
  test("builds a product-level overview for the active workspace", async () => {
    await using workspace = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, "opencode.json"),
          JSON.stringify({
            $schema: "https://opencode.ai/config.json",
            provider: {
              anthropic: {
                options: {
                  apiKey: "test-api-key",
                },
              },
            },
            mcp: {
              localDocs: {
                type: "local",
                enabled: true,
                command: ["bun", "--version"],
              },
              disabledLegacy: {
                type: "local",
                enabled: false,
                command: ["bun", "--version"],
              },
            },
          }),
        )
        await Bun.write(path.join(dir, "CLAUDE.md"), "# Workspace Claude")
        await Bun.write(
          path.join(dir, ".claude", "skills", "repo-skill", "SKILL.md"),
          ["---", "name: repo-skill", "description: Repo skill", "---", "", "Use this skill."].join("\n"),
        )
      },
    })

    const report = await Instance.provide({
      directory: workspace.path,
      fn: async () => {
        try {
          await Session.create({ title: "VALXOS runtime session" })
          return await ValxosOverview.build()
        } finally {
          await Instance.dispose()
        }
      },
    })

    expect(report.product.currentPhase.id).toBe("runtime_completion")
    expect(report.ui.status).toBe("borrowed_shell")
    expect(report.compatibility.level).toBe("ready")
    expect(report.providers.connected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "anthropic",
          source: "config",
        }),
      ]),
    )
    expect(report.mcp.configured).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "localDocs", enabled: true }),
        expect.objectContaining({ name: "disabledLegacy", enabled: false }),
      ]),
    )
    expect(report.sessions.total).toBeGreaterThanOrEqual(1)
    expect(report.sessions.recent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "VALXOS runtime session",
        }),
      ]),
    )
    expect(ValxosOverview.format(report)).toContain("Next Build Focus")
  })
})
