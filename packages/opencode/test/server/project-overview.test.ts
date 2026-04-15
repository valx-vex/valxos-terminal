import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import path from "path"
import { Session } from "../../src/session"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
import { resetDatabase } from "../fixture/db"
import { tmpdir } from "../fixture/fixture"

let originalBrand: string | undefined

beforeEach(() => {
  originalBrand = process.env.VALXOS_BRAND
  process.env.VALXOS_BRAND = "1"
})

afterEach(async () => {
  await resetDatabase()
  await Instance.disposeAll()
  if (originalBrand === undefined) delete process.env.VALXOS_BRAND
  else process.env.VALXOS_BRAND = originalBrand
})

describe("project.overview endpoint", () => {
  test("returns the VALXOS control-plane overview for the current workspace", async () => {
    await using tmp = await tmpdir({
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
          }),
        )
        await Bun.write(path.join(dir, "CLAUDE.md"), "# Workspace Claude")
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        try {
          await Session.create({ title: "Overview endpoint session" })
        } finally {
          await Instance.dispose()
        }
      },
    })

    const app = Server.Default()
    const response = await app.request("/project/overview", {
      headers: {
        "x-opencode-directory": tmp.path,
      },
    })

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.brand.productName).toBe("VALXOS Terminal")
    expect(body.ui.status).toBe("borrowed_shell")
    expect(body.compatibility.level).toBe("ready")
    expect(body.sessions.total).toBeGreaterThanOrEqual(1)
    expect(body.product.currentPhase.id).toBe("runtime_completion")
  })
})
