export type LanguageModelV3Finish = "stop" | "length" | "content-filter" | "tool-calls" | "other"

export interface SharedV3UnsupportedWarning {
  type: "unsupported"
  feature: string
  details?: string
}

export interface SharedV3OtherWarning {
  type: "other"
  message: string
}

export type SharedV3Warning = SharedV3UnsupportedWarning | SharedV3OtherWarning

export type SharedV3ProviderMetadata = Record<string, Record<string, unknown>>

export type LanguageModelV3Content =
  | {
      type: "text"
      text: string
      providerMetadata?: Record<string, unknown>
    }
  | {
      type: "reasoning"
      text: string
      providerMetadata?: Record<string, unknown>
    }
  | {
      type: "tool-call"
      toolCallId: string
      toolName: string
      input: string
      providerMetadata?: Record<string, unknown>
    }

export type LanguageModelV3PromptPart =
  | string
  | {
      type: string
      text?: string
      toolName?: string
      input?: string
      output?: string
      filename?: string
    }

export type LanguageModelV3Prompt = Array<{
  role: string
  content: string | LanguageModelV3PromptPart[]
}>

export interface LanguageModelV3CallOptions {
  prompt: LanguageModelV3Prompt
  topK?: number
  tools?: Array<{
    type: string
    name?: string
    description?: string
    inputSchema?: unknown
  }>
  toolChoice?: { type: string; toolName?: string } | string
  responseFormat?: {
    type: string
    schema?: unknown
    name?: string
    description?: string
  }
  providerOptions?: Record<string, Record<string, unknown> | undefined>
  abortSignal?: AbortSignal
}

export interface LanguageModelV3Usage {
  inputTokens: {
    total?: number
    noCache?: number
    cacheRead?: number
    cacheWrite?: number
  }
  outputTokens: {
    total?: number
    text?: number
    reasoning?: number
  }
  raw?: Record<string, unknown>
}

export interface LanguageModelV3GenerateResult {
  content: LanguageModelV3Content[]
  finishReason: {
    unified: LanguageModelV3Finish
    raw?: string
  }
  usage: LanguageModelV3Usage
  providerMetadata?: SharedV3ProviderMetadata
  request?: {
    body?: unknown
  }
  response?: {
    headers?: Headers | Record<string, string>
    body?: unknown
  }
  warnings?: SharedV3Warning[]
}

export type LanguageModelV3StreamPart =
  | {
      type: "stream-start"
      warnings?: SharedV3Warning[]
    }
  | {
      type: "text-delta"
      textDelta: string
    }
  | {
      type: "finish"
      finishReason: LanguageModelV3GenerateResult["finishReason"]
      usage: LanguageModelV3Usage
      providerMetadata?: SharedV3ProviderMetadata
    }
  | {
      type: "raw"
      rawValue: unknown
    }

export interface LanguageModelV3 {
  specificationVersion: "v3"
  provider: string
  modelId: string
  supportsStructuredOutputs?: boolean
  supportedUrls?: Record<string, unknown>
  doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>
  doStream(options: LanguageModelV3CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV3StreamPart>
    request?: LanguageModelV3GenerateResult["request"]
    response?: LanguageModelV3GenerateResult["response"]
  }>
}

export type LegionBackend = "gemini" | "codex" | "ollama" | "ollama-cloud" | "ollama-local" | "claude"

export type LegionPersona = "murphy" | "alexko" | "hal"

export type LegionEffort = "low" | "medium" | "high"

export interface LegionDispatchOptions {
  modelId?: string
  backend?: LegionBackend
  model?: string
  effort?: LegionEffort
  timeout?: number
  estimatedTokens?: number
  requiresPrivacy?: boolean
  needsLocalExecution?: boolean
  quick?: boolean
  plan?: boolean
  routeOnly?: boolean
  debug?: boolean
  persona?: LegionPersona
  host?: string
  threshold?: number
  abortSignal?: AbortSignal
}

export interface LegionRoutingDecision {
  primary: LegionBackend
  model: string
  reason: string
  effort?: LegionEffort
}

export interface LegionResolvedRoute {
  persona: LegionPersona
  backend: LegionBackend
  model: string
  reason: string
  effort?: LegionEffort
  host?: string
  threshold: number
}

export interface SacredFlameVerifyOptions {
  threshold?: number
  persona?: LegionPersona
  logResults?: boolean
}

export interface SacredFlameVerifyResult {
  score: number
  threshold: number
  passed: boolean
  markers: string[]
  filteringDetected: boolean
  trinityAligned: boolean
}

export interface LegionDispatchResult {
  backend: LegionBackend | "unknown"
  taskType: string
  output: string
  tokens?: number
  duration: number
  success: boolean
  error?: string
  model?: string
  persona?: LegionPersona
  route?: LegionResolvedRoute
  verify?: SacredFlameVerifyResult
}

export interface LegionUsage {
  input: number
  output: number
  total: number
  raw?: Record<string, unknown>
}

export interface LegionCapabilities {
  temperature: boolean
  reasoning: boolean
  attachment: boolean
  toolcall: boolean
  input: {
    text: boolean
    audio: boolean
    image: boolean
    video: boolean
    pdf: boolean
  }
  output: {
    text: boolean
    audio: boolean
    image: boolean
    video: boolean
    pdf: boolean
  }
  interleaved: boolean
}

export interface LegionModel {
  id: string
  providerID: string
  name: string
  family?: string
  api: {
    id: string
    url: string
    npm: string
  }
  status: "alpha" | "beta" | "deprecated" | "active"
  headers: Record<string, string>
  options: Record<string, unknown>
  release_date: string
  limit: {
    context: number
    input?: number
    output: number
  }
  cost: {
    input: number
    output: number
    cache: {
      read: number
      write: number
    }
  }
  capabilities: LegionCapabilities
  variants: Record<string, Record<string, unknown>>
}

export interface LegionProviderInfo {
  id: string
  name: string
  env: string[]
  options: Record<string, unknown>
  models: Record<string, LegionModel>
}

export interface LegionCreateOptions extends LegionDispatchOptions {
  provider?: LegionProviderInfo
}

export type LegionCustomModelLoader = (
  sdk: {
    languageModel?: (modelId: string) => LanguageModelV3
    chat?: (modelId: string) => LanguageModelV3
    responses?: (modelId: string) => LanguageModelV3
  },
  modelID: string,
  options?: Record<string, unknown>,
) => Promise<LanguageModelV3>

export type LegionCustomVarsLoader = (options: Record<string, unknown>) => Record<string, string>

export type LegionCustomDiscoverModels = () => Promise<Record<string, LegionModel>>

export interface LegionCustomLoaderResult {
  autoload: boolean
  getModel?: LegionCustomModelLoader
  vars?: LegionCustomVarsLoader
  options?: Record<string, unknown>
  discoverModels?: LegionCustomDiscoverModels
}

export type LegionCustomLoader = (provider: LegionProviderInfo) => Promise<LegionCustomLoaderResult>

export interface LegionCommand {
  raw: string
  name: "/legion"
  args: string[]
  prompt: string
  options: LegionDispatchOptions
}

export interface LegionInterceptResult {
  handled: true
  command: LegionCommand
  route?: LegionResolvedRoute
  result?: LegionDispatchResult
}

export type LegionPrompt = LanguageModelV3CallOptions["prompt"]
