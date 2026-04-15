import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import path from "path"
import { ValxosCatalog } from "../../src/control-plane/catalog"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { PermissionTable, SessionTable } from "../../src/session/session.sql"
import { Database, eq } from "../../src/storage/db"
import { resetDatabase } from "../fixture/db"
import { tmpdir } from "../fixture/fixture"

let originalBrand: string | undefined
let originalHome: string | undefined

beforeEach(() => {
  originalBrand = process.env.VALXOS_BRAND
  originalHome = process.env.OPENCODE_TEST_HOME
  process.env.VALXOS_BRAND = "1"
})

afterEach(async () => {
  await resetDatabase()
  await Instance.disposeAll()
  if (originalBrand === undefined) delete process.env.VALXOS_BRAND
  else process.env.VALXOS_BRAND = originalBrand
  if (originalHome === undefined) delete process.env.OPENCODE_TEST_HOME
  else process.env.OPENCODE_TEST_HOME = originalHome
})

describe("ValxosCatalog", () => {
  test("builds a deeper control-plane catalog for the active workspace", async () => {
    await using home = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, ".claude", "skills", "home-skill", "SKILL.md"),
          ["---", "name: home-skill", "description: Home skill", "---", "", "Use this skill."].join("\n"),
        )
      },
    })
    process.env.OPENCODE_TEST_HOME = home.path

    await using workspace = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, "opencode.json"),
          JSON.stringify({
            $schema: "https://opencode.ai/config.json",
            permission: {
              bash: "ask",
              webfetch: "deny",
            },
            command: {
              deploy: {
                description: "Deploy the workspace",
                agent: "build",
                template: "Deploy this project.",
                subtask: true,
              },
            },
            plugin: ["@example/valx-plugin"],
            share: "manual",
            mcp: {
              localDocs: {
                type: "local",
                enabled: true,
                command: ["bun", "--version"],
              },
            },
          }),
        )
        await Bun.write(
          path.join(dir, ".claude", "skills", "repo-skill", "SKILL.md"),
          ["---", "name: repo-skill", "description: Repo skill", "---", "", "Use this skill."].join("\n"),
        )
        await Bun.write(
          path.join(dir, ".claude", "agents", "repo-agent.md"),
          [
            "---",
            "description: Repo compatibility agent",
            "mode: subagent",
            "permission:",
            "  read: allow",
            "---",
            "",
            "Use this agent for Claude-compatible repository work.",
          ].join("\n"),
        )
        await Bun.write(
          path.join(dir, ".claude", "settings.local.json"),
          JSON.stringify({
            hooks: {
              SessionStart: [
                {
                  hooks: [{ command: "echo catalog" }],
                },
              ],
            },
            mcpServers: {
              claudeDocs: {
                command: "bun",
                args: ["--version"],
                enabled: true,
              },
            },
          }),
        )
        await Bun.write(
          path.join(dir, ".claude-plugin", "plugin.json"),
          JSON.stringify({
            name: "valx-compat-plugin",
            version: "0.1.0",
          }),
        )
      },
    })

    const report = await Instance.provide({
      directory: workspace.path,
      fn: async () => {
        try {
          const session = await Session.create({ title: "Catalog shared session" })
          Database.use((db) =>
            db
              .update(SessionTable)
              .set({
                share_url: "https://example.com/share/catalog",
              })
              .where(eq(SessionTable.id, session.id))
              .run(),
          )
          Database.use((db) =>
            db
              .insert(PermissionTable)
              .values({
                project_id: Instance.project.id,
                data: [{ permission: "bash", pattern: "*", action: "allow" }],
              })
              .run(),
          )

          return await ValxosCatalog.build()
        } finally {
          await Instance.dispose()
        }
      },
    })

    expect(report.agents.defaultAgent).toBe("build")
    expect(report.rules.configured).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ permission: "bash", action: "ask" }),
        expect.objectContaining({ permission: "webfetch", action: "deny" }),
      ]),
    )
    expect(report.rules.persistedApprovals).toEqual(
      expect.arrayContaining([expect.objectContaining({ permission: "bash", action: "allow" })]),
    )
    expect(report.scripts.configured).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "deploy", agent: "build", subtask: true })]),
    )
    expect(report.commands.available).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "deploy", source: "command" }),
        expect.objectContaining({ name: "repo-skill", source: "skill" }),
      ]),
    )
    expect(report.agents.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "build", native: true }),
        expect.objectContaining({ name: "repo-agent", native: false }),
      ]),
    )
    expect(report.skills.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "home-skill" }),
        expect.objectContaining({ name: "repo-skill" }),
      ]),
    )
    expect(report.mcp.effective).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "localDocs", enabled: true }),
        expect.objectContaining({ name: "claudeDocs", enabled: true }),
      ]),
    )
    expect(report.mcp.claudeCompat).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "claudeDocs" })]),
    )
    expect(report.plugins.configured).toEqual(
      expect.arrayContaining([expect.objectContaining({ specifier: "@example/valx-plugin" })]),
    )
    expect(report.plugins.claudeCompat).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "valx-compat-plugin" })]),
    )
    expect(report.claude.settings).toEqual(expect.arrayContaining([expect.objectContaining({ scope: "local" })]))
    expect(report.claude.hooks).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: "SessionStart" })]),
    )
    expect(report.shares.sharedSessions).toBe(1)
    expect(report.shares.recent).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "Catalog shared session" })]),
    )
    expect(ValxosCatalog.format(report)).toContain("Rules")
  })
})
