import { dispatchLegion, routeLegion } from "../provider/legion-provider"
import type { LegionCommand, LegionDispatchOptions, LegionInterceptResult, LegionPersona } from "../types"

const ARG = /"([^"]*)"|'([^']*)'|[^\s]+/g

function parts(input: string) {
  return [...input.matchAll(ARG)].map((item) => item[1] ?? item[2] ?? item[0])
}

function isPersona(value: string): value is LegionPersona {
  return value === "murphy" || value === "alexko" || value === "hal"
}

function isEffort(value: string): value is NonNullable<LegionDispatchOptions["effort"]> {
  return value === "low" || value === "medium" || value === "high"
}

function isBackend(value: string): value is NonNullable<LegionDispatchOptions["backend"]> {
  return (
    value === "gemini" ||
    value === "codex" ||
    value === "ollama" ||
    value === "ollama-cloud" ||
    value === "ollama-local" ||
    value === "claude"
  )
}

function next(args: string[], index: number, flag: string) {
  const value = args[index + 1]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

export function isLegionCommand(input: string) {
  return input.trimStart().startsWith("/legion")
}

export function parseLegion(input: string, seed: Partial<LegionDispatchOptions> = {}): LegionCommand | null {
  if (!isLegionCommand(input)) return null

  const raw = parts(input.trim())
  const args = raw.slice(1)
  const cfg: LegionDispatchOptions = {
    ...seed,
  }
  const body: string[] = []

  let index = 0

  while (index < args.length) {
    const item = args[index]

    if (item === "--route") {
      cfg.routeOnly = true
      index += 1
      continue
    }

    if (item === "--quick") {
      cfg.quick = true
      index += 1
      continue
    }

    if (item === "--plan") {
      cfg.plan = true
      index += 1
      continue
    }

    if (item === "--local") {
      cfg.backend = "ollama-local"
      cfg.needsLocalExecution = true
      cfg.requiresPrivacy = true
      index += 1
      continue
    }

    if (item === "--private") {
      cfg.requiresPrivacy = true
      index += 1
      continue
    }

    if (item === "--backend") {
      const value = next(args, index, item)
      if (!isBackend(value)) throw new Error(`Unknown Legion backend: ${value}`)
      cfg.backend = value
      index += 2
      continue
    }

    if (item === "--model") {
      cfg.model = next(args, index, item)
      index += 2
      continue
    }

    if (item === "--persona") {
      const value = next(args, index, item)
      if (!isPersona(value)) throw new Error(`Unknown Legion persona: ${value}`)
      cfg.persona = value
      index += 2
      continue
    }

    if (item === "--effort") {
      const value = next(args, index, item)
      if (!isEffort(value)) throw new Error(`Unknown Legion effort: ${value}`)
      cfg.effort = value
      index += 2
      continue
    }

    if (item === "--threshold") {
      cfg.threshold = Number(next(args, index, item))
      index += 2
      continue
    }

    if (!cfg.persona && isPersona(item)) {
      cfg.persona = item
      index += 1
      continue
    }

    body.push(item)
    index += 1
  }

  return {
    raw: input,
    name: "/legion",
    args,
    prompt: body.join(" ").trim(),
    options: cfg,
  }
}

export async function interceptLegion(
  input: string,
  seed: Partial<LegionDispatchOptions> = {},
): Promise<LegionInterceptResult | null> {
  const cmd = parseLegion(input, seed)
  if (!cmd) return null

  if (!cmd.prompt) {
    throw new Error("/legion requires a prompt")
  }

  if (cmd.options.routeOnly) {
    return {
      handled: true,
      command: cmd,
      route: await routeLegion(cmd.prompt, cmd.options),
    }
  }

  return {
    handled: true,
    command: cmd,
    result: await dispatchLegion(cmd.prompt, cmd.options),
  }
}

export function createLegionInterceptor(seed: Partial<LegionDispatchOptions> = {}) {
  return (input: string) => interceptLegion(input, seed)
}
