import { EOL } from "os"
import path from "path"
import { DoctorReport } from "@/doctor/report"
import { Filesystem } from "@/util/filesystem"
import { Instance } from "@/project/instance"
import { cmd } from "./cmd"

export const DoctorCommand = cmd({
  command: "doctor [project]",
  describe: "inspect VALXOS and Claude compatibility for a workspace",
  builder: (yargs) =>
    yargs
      .positional("project", {
        type: "string",
        describe: "path to inspect",
      })
      .option("json", {
        type: "boolean",
        alias: ["j"],
        describe: "print the doctor report as JSON",
      })
      .option("strict", {
        type: "boolean",
        describe: "exit non-zero when diagnostics exist or no Claude-compatible surfaces are detected",
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
          const report = await DoctorReport.build()
          process.stdout.write(
            args.json ? JSON.stringify(report, null, 2) + EOL : DoctorReport.format(report).trimEnd() + EOL,
          )

          if (args.strict && (report.status.level === "empty" || report.claude.diagnostics.length > 0)) {
            process.exitCode = 1
          }
        } finally {
          await Instance.dispose()
        }
      },
    })
  },
})
