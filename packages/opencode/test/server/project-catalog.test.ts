import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Server } from "../../src/server/server"
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

describe("project.catalog endpoint", () => {
  test("returns the VALXOS catalog for the current workspace", async () => {
    await using home = await tmpdir()
    process.env.OPENCODE_TEST_HOME = home.path

    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, "opencode.json"),
          JSON.stringify({
            $schema: "https://opencode.ai/config.json",
            command: {
              deploy: {
                template: "Deploy the project.",
              },
            },
          }),
        )
      },
    })

    const app = Server.Default()
    const response = await app.request("/project/catalog", {
      headers: {
        "x-opencode-directory": tmp.path,
      },
    })

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.brand.productName).toBe("VALXOS Terminal")
    expect(body.agents.defaultAgent).toBe("build")
    expect(body.commands.available).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "deploy", source: "command" })]),
    )
  })
})
