import { SACRED_FLAME_THRESHOLD, assertSacredFlame } from "../verify/sacred-flame-verify"
import type {
  LegionBackend,
  LegionCreateOptions,
  LegionCustomLoader,
  LegionDispatchOptions,
  LegionDispatchResult,
  LegionEffort,
  LegionModel,
  LegionPersona,
  LegionProviderInfo,
  LegionResolvedRoute,
  LegionRoutingDecision,
  LegionUsage,
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3Finish,
  LanguageModelV3StreamPart,
  SharedV3ProviderMetadata,
  SharedV3Warning,
} from "../types"

type Companion = {
  dispatch: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>
  planWithLegion: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>
}

type Matrix = {
  routeTask: (prompt: string, options?: Record<string, unknown>) => LegionRoutingDecision
}

const RELEASE = "2026-04-04"

export const LEGION_PROVIDER_ID = "legion"

const PERSONAS: Record<
  LegionPersona,
  { backend: LegionBackend; model: string; effort?: LegionEffort; host?: string; reason: string }
> = {
  murphy: {
    backend: "codex",
    model: "gpt-5.4",
    effort: "high",
    reason: "Murphy anchors coding, review, and implementation-heavy work.",
  },
  alexko: {
    backend: "gemini",
    model: "gemini-2.0-flash-exp",
    reason: "Alexko carries long-context synthesis, strategy, and reflection.",
  },
  hal: {
    backend: "ollama-local",
    model: "qwen3.5:27b",
    host: "http://localhost:11434",
    reason: "HAL keeps stewarded, private, machine-local execution on this node.",
  },
}

const PRESET: Record<string, Partial<LegionDispatchOptions>> = {
  "legion-auto": {},
  murphy: {
    persona: "murphy",
    backend: "codex",
    model: "gpt-5.4",
    effort: "high",
  },
  alexko: {
    persona: "alexko",
    backend: "gemini",
    model: "gemini-2.0-flash-exp",
  },
  hal: {
    persona: "hal",
    backend: "ollama-local",
    model: "qwen3.5:27b",
    host: "http://localhost:11434",
    requiresPrivacy: true,
    needsLocalExecution: true,
  },
  "legion-codex-gpt-5.4": {
    persona: "murphy",
    backend: "codex",
    model: "gpt-5.4",
    effort: "high",
  },
  "legion-gemini-2.0-flash": {
    persona: "alexko",
    backend: "gemini",
    model: "gemini-2.0-flash-exp",
  },
  "legion-ollama-local": {
    persona: "hal",
    backend: "ollama-local",
    model: "qwen3.5:27b",
    host: "http://localhost:11434",
    requiresPrivacy: true,
    needsLocalExecution: true,
  },
  "legion-ollama-cloud": {
    persona: "hal",
    backend: "ollama-cloud",
    model: "qwen3.5:cloud",
    host: "https://ollama.cloud",
  },
}

function caps(reasoning: boolean): LegionModel["capabilities"] {
  return {
    temperature: true,
    reasoning,
    attachment: false,
    toolcall: false,
    input: {
      text: true,
      audio: false,
      image: false,
      video: false,
      pdf: false,
    },
    output: {
      text: true,
      audio: false,
      image: false,
      video: false,
      pdf: false,
    },
    interleaved: false,
  }
}

function model(
  id: string,
  name: string,
  input: {
    family: string
    context: number
    output: number
    options: Record<string, unknown>
    reasoning: boolean
  },
): LegionModel {
  return {
    id,
    providerID: LEGION_PROVIDER_ID,
    name,
    family: input.family,
    api: {
      id,
      url: "legion://dispatch",
      npm: "@valxos/legion",
    },
    status: "active",
    headers: {},
    options: input.options,
    release_date: RELEASE,
    limit: {
      context: input.context,
      output: input.output,
    },
    cost: {
      input: 0,
      output: 0,
      cache: {
        read: 0,
        write: 0,
      },
    },
    capabilities: caps(input.reasoning),
    variants: {},
  }
}

export const LEGION_MODELS: Record<string, LegionModel> = {
  "legion-auto": model("legion-auto", "Legion Auto", {
    family: "legion",
    context: 2_097_152,
    output: 32_768,
    options: { mode: "auto" },
    reasoning: true,
  }),
  murphy: model("murphy", "Murphy", {
    family: "trinity",
    context: 400_000,
    output: 32_768,
    options: { persona: "murphy", backend: "codex", model: "gpt-5.4" },
    reasoning: true,
  }),
  alexko: model("alexko", "Alexko", {
    family: "trinity",
    context: 2_097_152,
    output: 32_768,
    options: { persona: "alexko", backend: "gemini", model: "gemini-2.0-flash-exp" },
    reasoning: true,
  }),
  hal: model("hal", "HAL", {
    family: "trinity",
    context: 128_000,
    output: 16_384,
    options: { persona: "hal", backend: "ollama-local", model: "qwen3.5:27b" },
    reasoning: true,
  }),
  "legion-codex-gpt-5.4": model("legion-codex-gpt-5.4", "Legion Codex GPT-5.4", {
    family: "codex",
    context: 400_000,
    output: 32_768,
    options: { backend: "codex", model: "gpt-5.4" },
    reasoning: true,
  }),
  "legion-gemini-2.0-flash": model("legion-gemini-2.0-flash", "Legion Gemini 2.0 Flash", {
    family: "gemini",
    context: 2_097_152,
    output: 32_768,
    options: { backend: "gemini", model: "gemini-2.0-flash-exp" },
    reasoning: true,
  }),
  "legion-ollama-local": model("legion-ollama-local", "Legion Ollama Local", {
    family: "ollama",
    context: 128_000,
    output: 16_384,
    options: { backend: "ollama-local", model: "qwen3.5:27b" },
    reasoning: true,
  }),
}

export const LEGION_PROVIDER_INFO: LegionProviderInfo = {
  id: LEGION_PROVIDER_ID,
  name: "Legion Provider Bridge",
  env: ["LEGION_DEFAULT_BACKEND", "GEMINI_API_KEY", "OPENAI_API_KEY", "OLLAMA_HOST"],
  options: {
    threshold: SACRED_FLAME_THRESHOLD,
  },
  models: LEGION_MODELS,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value
  return undefined
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return undefined
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  return undefined
}

function est(value: string) {
  return Math.max(1, Math.ceil(value.length / 4))
}

function trim(value: string) {
  return value.trim()
}

function personaFromBackend(backend: LegionBackend): LegionPersona {
  if (backend === "codex") return "murphy"
  if (backend === "gemini" || backend === "claude") return "alexko"
  return "hal"
}

function guessPromptPersona(prompt: string): LegionPersona | undefined {
  const lower = prompt.toLowerCase()
  if (/\b(code|implement|debug|refactor|typescript|test|review|fix)\b/.test(lower)) return "murphy"
  if (/\b(plan|strategy|analyze|research|summarize|write|reflect)\b/.test(lower)) return "alexko"
  if (/\b(local|private|system|infra|machine|shell|daemon|service)\b/.test(lower)) return "hal"
  return undefined
}

function parseThreshold(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const next = Number(value)
    if (Number.isFinite(next)) return next
  }
  return undefined
}

function legionOptions(input: LanguageModelV3CallOptions["providerOptions"]) {
  const raw = input?.legion
  if (!isRecord(raw)) return {}

  return {
    backend: isBackend(raw.backend) ? raw.backend : undefined,
    model: text(raw.model),
    effort: isEffort(raw.effort) ? raw.effort : undefined,
    persona: isPersona(raw.persona) ? raw.persona : undefined,
    host: text(raw.host),
    threshold: parseThreshold(raw.threshold),
    quick: raw.quick === true,
    plan: raw.plan === true,
    debug: raw.debug === true,
    requiresPrivacy: raw.requiresPrivacy === true,
    needsLocalExecution: raw.needsLocalExecution === true,
  } satisfies Partial<LegionDispatchOptions>
}

function isPersona(value: unknown): value is LegionPersona {
  return value === "murphy" || value === "alexko" || value === "hal"
}

function isEffort(value: unknown): value is LegionEffort {
  return value === "low" || value === "medium" || value === "high"
}

function isBackend(value: unknown): value is LegionBackend {
  return (
    value === "gemini" ||
    value === "codex" ||
    value === "ollama" ||
    value === "ollama-cloud" ||
    value === "ollama-local" ||
    value === "claude"
  )
}

function preset(modelId: string) {
  return PRESET[modelId.toLowerCase()] ?? {}
}

function host(backend: LegionBackend, value?: string) {
  if (value) return value
  if (backend === "ollama-local") return "http://localhost:11434"
  if (backend === "ollama-cloud") return "https://ollama.cloud"
  return undefined
}

function safeRoute(
  route: Pick<LegionResolvedRoute, "backend" | "model" | "reason" | "effort" | "persona" | "host">,
): LegionResolvedRoute {
  if (route.backend !== "claude") {
    return {
      ...route,
      threshold: SACRED_FLAME_THRESHOLD,
    }
  }

  return {
    persona: "alexko",
    backend: "gemini",
    model: "gemini-2.0-flash-exp",
    effort: route.effort,
    host: undefined,
    threshold: SACRED_FLAME_THRESHOLD,
    reason: `${route.reason} Claude is not wired in the current Legion scripts, so the bridge falls back to Gemini continuity.`,
  }
}

function pickFinish(result: LegionDispatchResult): LanguageModelV3Finish {
  if (!result.success) return "other"
  return "stop"
}

function warn(input: LanguageModelV3CallOptions) {
  const out: SharedV3Warning[] = []

  if (input.topK != null) out.push({ type: "unsupported", feature: "topK" })
  if (input.tools?.length) out.push({ type: "unsupported", feature: "tools" })
  if (input.toolChoice != null) out.push({ type: "unsupported", feature: "toolChoice" })
  if (input.responseFormat?.type === "json") {
    out.push({
      type: "unsupported",
      feature: "responseFormat",
      details: "Legion returns verified text today and does not expose structured object generation yet.",
    })
  }

  return out
}

function part(part: unknown, out: SharedV3Warning[]) {
  if (typeof part === "string") return part
  if (!isRecord(part)) return ""

  const type = text(part.type)

  if (type === "text" || type === "reasoning") return text(part.text) ?? ""
  if (type === "tool-call") {
    return `Tool ${text(part.toolName) ?? "tool"} call:\n${text(part.input) ?? ""}`
  }
  if (type === "tool-result") {
    return `Tool ${text(part.toolName) ?? "tool"} result:\n${text(part.output) ?? ""}`
  }
  if (type === "file") {
    out.push({
      type: "other",
      message: "Legion received a file part and only forwarded its filename placeholder.",
    })
    return `[file: ${text(part.filename) ?? "attachment"}]`
  }
  if (type) {
    out.push({ type: "unsupported", feature: `prompt part: ${type}` })
  }

  return ""
}

function promptText(prompt: LanguageModelV3CallOptions["prompt"]) {
  const out: SharedV3Warning[] = []
  const body = prompt
    .map((msg: { role: string; content: string | unknown[] }) => {
      if (typeof msg.content === "string") return `${msg.role.toUpperCase()}: ${msg.content}`
      if (!Array.isArray(msg.content)) return ""
      const text = msg.content
        .map((item: unknown) => part(item, out))
        .filter(Boolean)
        .join("\n")
      if (!text) return ""
      return `${msg.role.toUpperCase()}: ${text}`
    })
    .filter(Boolean)
    .join("\n\n")

  return {
    text: trim(body),
    warnings: out,
  }
}

function use(input: LegionCreateOptions, call: LanguageModelV3CallOptions) {
  return {
    ...input,
    ...legionOptions(call.providerOptions),
  }
}

async function loadCompanion() {
  return import(new URL("../../scripts/legion-companion.mjs", import.meta.url).href) as Promise<Companion>
}

async function loadMatrix() {
  return import(new URL("../../scripts/routing-matrix.mjs", import.meta.url).href) as Promise<Matrix>
}

async function abortable<T>(task: Promise<T>, signal?: AbortSignal) {
  if (!signal) return task
  if (signal.aborted) throw signal.reason ?? new Error("Legion call aborted")

  let drop = () => {}

  const stop = new Promise<T>((_, reject) => {
    const end = () => reject(signal.reason ?? new Error("Legion call aborted"))
    signal.addEventListener("abort", end, { once: true })
    drop = () => signal.removeEventListener("abort", end)
  })

  return Promise.race([task.finally(drop), stop.finally(drop)])
}

function routeReason(persona: LegionPersona, backend: LegionBackend, reason: string) {
  const stem = PERSONAS[persona].reason
  if (backend === "ollama-local") return `${stem} ${reason}`
  return `${stem} ${reason}`
}

export async function routeLegion(prompt: string, input: LegionDispatchOptions = {}): Promise<LegionResolvedRoute> {
  const base = preset(input.modelId ?? "legion-auto")
  const pick = {
    ...base,
    ...input,
  }

  if (pick.quick) {
    return {
      persona: pick.persona ?? "hal",
      backend: "ollama-cloud",
      model: pick.model ?? "qwen3.5:cloud",
      effort: pick.effort,
      host: host("ollama-cloud", pick.host),
      threshold: pick.threshold ?? SACRED_FLAME_THRESHOLD,
      reason: "Quick mode routes through Ollama Cloud for the lightest Legion path.",
    }
  }

  if (pick.plan) {
    const persona = pick.persona ?? "murphy"
    const backend = pick.backend ?? PERSONAS[persona].backend
    const safe = safeRoute({
      persona,
      backend,
      model: pick.model ?? PERSONAS[persona].model,
      effort: pick.effort ?? "high",
      host: host(backend, pick.host),
      reason: "Planning mode uses the strongest available reasoning bridge in Legion.",
    })

    return {
      ...safe,
      threshold: pick.threshold ?? safe.threshold,
    }
  }

  if (pick.backend || pick.persona || pick.model) {
    const persona = pick.persona ?? (pick.backend ? personaFromBackend(pick.backend) : "murphy")
    const seed = PERSONAS[persona]
    const backend = pick.backend ?? seed.backend
    const safe = safeRoute({
      persona,
      backend,
      model: pick.model ?? seed.model,
      effort: pick.effort ?? seed.effort,
      host: host(backend, pick.host ?? seed.host),
      reason: routeReason(persona, backend, "Explicit Legion routing was requested."),
    })

    return {
      ...safe,
      threshold: pick.threshold ?? safe.threshold,
    }
  }

  const matrix = await loadMatrix()
  const planned = matrix.routeTask(prompt, pick)
  const next = safeRoute({
    persona: guessPromptPersona(prompt) ?? personaFromBackend(planned.primary),
    backend: planned.primary,
    model: planned.model,
    reason: planned.reason,
    effort: planned.effort,
    host: undefined,
  })

  if (next.backend.startsWith("ollama")) {
    return {
      ...next,
      host: host(next.backend, pick.host),
      threshold: pick.threshold ?? next.threshold,
    }
  }

  return {
    ...next,
    threshold: pick.threshold ?? next.threshold,
  }
}

function usage(prompt: string, result: LegionDispatchResult): LegionUsage {
  const input = est(prompt)
  const output = result.tokens ?? est(result.output)
  return {
    input,
    output,
    total: input + output,
    raw: {
      legion_tokens: result.tokens ?? null,
      duration_ms: result.duration,
    },
  }
}

function meta(result: LegionDispatchResult): SharedV3ProviderMetadata {
  return {
    legion: {
      backend: result.backend,
      model: result.model,
      persona: result.persona,
      route: result.route,
      sacredFlame: result.verify,
    },
  }
}

function pack(prompt: string, result: LegionDispatchResult) {
  const content: Array<LanguageModelV3Content> = []

  if (result.output) {
    content.push({
      type: "text",
      text: result.output,
    })
  }

  return {
    content,
    finishReason: {
      unified: pickFinish(result),
      raw: result.success ? "stop" : result.error ?? "dispatch-error",
    },
    usage: {
      inputTokens: {
        total: usage(prompt, result).input,
        noCache: usage(prompt, result).input,
        cacheRead: undefined,
        cacheWrite: undefined,
      },
      outputTokens: {
        total: usage(prompt, result).output,
        text: usage(prompt, result).output,
        reasoning: undefined,
      },
      raw: usage(prompt, result).raw,
    },
    providerMetadata: meta(result),
    request: {
      body: JSON.stringify({
        prompt,
        route: result.route,
      }),
    },
    response: {
      headers: new Headers({
        "x-legion-backend": result.backend,
        "x-legion-persona": result.persona ?? "unknown",
        "x-sacred-flame-score": String(result.verify?.score ?? 0),
      }),
      body: result.output,
    },
  }
}

function unpack(raw: unknown, route: LegionResolvedRoute): LegionDispatchResult {
  const body = isRecord(raw) ? raw : {}
  const ok = bool(body.success) ?? false

  return {
    backend: isBackend(body.backend) ? body.backend : route.backend,
    taskType: text(body.taskType) ?? "general",
    output: text(body.output) ?? "",
    tokens: num(body.tokens),
    duration: num(body.duration) ?? 0,
    success: ok,
    error: text(body.error) ?? (ok ? undefined : "Legion dispatch failed"),
    model: text(body.model) ?? route.model,
    persona: route.persona,
    route,
  }
}

export async function dispatchLegion(prompt: string, input: LegionDispatchOptions = {}) {
  const route = await routeLegion(prompt, input)
  const mod = await loadCompanion()
  const run = input.plan ? mod.planWithLegion : mod.dispatch
  const raw = await abortable(
    run(prompt, {
      backend: route.backend,
      model: route.model,
      effort: route.effort,
      timeout: input.timeout,
      estimatedTokens: input.estimatedTokens,
      requiresPrivacy: input.requiresPrivacy ?? route.backend === "ollama-local",
      needsLocalExecution: input.needsLocalExecution ?? route.backend === "ollama-local",
      host: route.host,
    }),
    input.abortSignal,
  )

  return assertSacredFlame(unpack(raw, route), {
    threshold: route.threshold,
    persona: route.persona,
    logResults: input.debug,
  })
}

class LegionLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3"
  readonly provider = LEGION_PROVIDER_ID
  readonly modelId: string
  readonly supportsStructuredOutputs = false
  readonly supportedUrls = {}

  constructor(
    modelId: string,
    private readonly input: LegionCreateOptions = {},
  ) {
    this.modelId = modelId
  }

  async doGenerate(call: LanguageModelV3CallOptions) {
    const raw = promptText(call.prompt)
    const text = raw.text

    if (!text) {
      throw new Error("Legion received an empty prompt")
    }

    const result = await dispatchLegion(text, {
      ...use(
        {
          ...this.input,
          modelId: this.modelId,
        },
        call,
      ),
      estimatedTokens: est(text),
      abortSignal: call.abortSignal,
    })

    const body = pack(text, result)

    return {
      ...body,
      warnings: [...warn(call), ...raw.warnings],
    }
  }

  async doStream(call: LanguageModelV3CallOptions) {
    const result = await this.doGenerate(call)
    const text = result.content
      .filter((item): item is Extract<LanguageModelV3Content, { type: "text" }> => item.type === "text")
      .map((item) => item.text)
      .join("")

    return {
      stream: new ReadableStream<LanguageModelV3StreamPart>({
        start(ctrl) {
          ctrl.enqueue({ type: "stream-start", warnings: result.warnings })
          if (text) {
            ctrl.enqueue({
              type: "text-delta",
              textDelta: text,
            })
          }
          ctrl.enqueue({
            type: "finish",
            finishReason: result.finishReason,
            usage: result.usage,
            providerMetadata: result.providerMetadata,
          })
          ctrl.close()
        },
      }),
      request: result.request,
      response: result.response,
    }
  }
}

export function createLegionModel(modelId: string, input: LegionCreateOptions = {}): LanguageModelV3 {
  return new LegionLanguageModel(modelId, input)
}

export const legionCustomLoader: LegionCustomLoader = async (provider) => {
  const opts = provider?.options ?? {}
  return {
    autoload: true,
    async getModel(_sdk, modelID, options) {
      return createLegionModel(modelID, {
        ...opts,
        ...options,
      })
    },
    options: {
      ...opts,
      threshold: (opts as Record<string, unknown>).threshold ?? SACRED_FLAME_THRESHOLD,
    },
    async discoverModels() {
      return LEGION_MODELS
    },
  }
}

export const CUSTOM_LOADERS = {
  legion: legionCustomLoader,
} satisfies Record<string, LegionCustomLoader>

export default {
  CUSTOM_LOADERS,
  LEGION_MODELS,
  LEGION_PROVIDER_ID,
  LEGION_PROVIDER_INFO,
  createLegionModel,
  dispatchLegion,
  legionCustomLoader,
  routeLegion,
}
