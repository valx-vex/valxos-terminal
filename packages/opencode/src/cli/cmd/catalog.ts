import { EOL } from "os"
import path from "path"
import { ValxosCatalog } from "@/control-plane/catalog"
import { Instance } from "@/project/instance"
import { Filesystem } from "@/util/filesystem"
import { cmd } from "./cmd"

export const CatalogCommand = cmd({
  command: "catalog [project]",
  aliases: ["inventory"],
  describe: "show the deeper VALXOS control-plane catalog for a workspace",
  builder: (yargs) =>
    yargs
      .positional("project", {
        type: "string",
        describe: "path to inspect",
      })
      .option("json", {
        type: "boolean",
        alias: ["j"],
        describe: "print the catalog as JSON",
      }),
  async handler(args) {
    const cwd = Filesystem.resolve(process.env.PWD ?? process.cwd())
    const target = args.project
      ? Filesystem.resolve(path.isAbsolute(args.project) ? args.project : path.join(cwd, args.project))
      : cwd

    await Instance.provide({
      directory: target,
      fn: async () => {
        try {
          const report = await ValxosCatalog.build()
          process.stdout.write(
            args.json ? JSON.stringify(report, null, 2) + EOL : ValxosCatalog.format(report).trimEnd() + EOL,
          )
        } finally {
          await Instance.dispose()
        }
      },
    })
  },
})
