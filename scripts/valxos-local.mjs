#!/usr/bin/env node

import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageRoot = path.join(repoRoot, "packages", "opencode")
const cwd = process.cwd()
const input = process.argv.slice(2)
const nonTuiCommands = new Set([
  "acp",
  "mcp",
  "doctor",
  "status",
  "overview",
  "catalog",
  "inventory",
  "run",
  "generate",
  "debug",
  "account",
  "providers",
  "agent",
  "upgrade",
  "uninstall",
  "serve",
  "web",
  "models",
  "stats",
  "export",
  "import",
  "github",
  "pr",
  "session",
  "plug",
  "db",
  "completion",
])

function injectProjectArg(args) {
  if (args.length === 0) return [cwd]

  const [first, second] = args

  if (first === "doctor" || first === "status" || first === "overview" || first === "catalog" || first === "inventory") {
    if (!second || second.startsWith("-")) return [first, cwd, ...args.slice(1)]
    return args
  }

  if (first.startsWith("-")) return [cwd, ...args]

  return args
}

const args = injectProjectArg(input)

function isTuiLaunch(args) {
  if (args.length === 0) return true
  const [first] = args
  if (first === "-h" || first === "--help" || first === "-v" || first === "--version") return false
  return !nonTuiCommands.has(first)
}

if (isTuiLaunch(input) && process.stderr.isTTY) {
  process.stderr.write("Launching VALXOS Terminal... first paint can take a few seconds while plugins and providers initialize.\n")
}

const child = spawn("bun", ["run", "--cwd", packageRoot, "--conditions=browser", "src/index.ts", ...args], {
  stdio: "inherit",
  cwd,
  env: {
    ...process.env,
    VALXOS_BRAND: "1",
  },
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
