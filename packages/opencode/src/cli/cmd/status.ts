import { EOL } from "os"
import path from "path"
import { ValxosOverview } from "@/control-plane/overview"
import { Instance } from "@/project/instance"
import { Filesystem } from "@/util/filesystem"
import { cmd } from "./cmd"

export const StatusCommand = cmd({
  command: "status [project]",
  describe: "show the VALXOS control-plane overview for a workspace",
  aliases: ["overview"],
  builder: (yargs) =>
    yargs
      .positional("project", {
        type: "string",
        describe: "path to inspect",
      })
      .option("json", {
        type: "boolean",
        alias: ["j"],
        describe: "print the overview as JSON",
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
          const report = await ValxosOverview.build()
          process.stdout.write(
            args.json ? JSON.stringify(report, null, 2) + EOL : ValxosOverview.format(report).trimEnd() + EOL,
          )
        } finally {
          await Instance.dispose()
        }
      },
    })
  },
})
