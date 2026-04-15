import { CUSTOM_LOADERS } from "./provider/legion-provider"

export { createLegionInterceptor, interceptLegion, isLegionCommand, parseLegion } from "./interceptor/legion-interceptor"
export {
  CUSTOM_LOADERS,
  LEGION_MODELS,
  LEGION_PROVIDER_ID,
  LEGION_PROVIDER_INFO,
  createLegionModel,
  dispatchLegion,
  legionCustomLoader,
  routeLegion,
} from "./provider/legion-provider"
export { SACRED_FLAME_THRESHOLD, applySacredFlame, assertSacredFlame, verifySacredFlame } from "./verify/sacred-flame-verify"
export type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3Finish,
  LanguageModelV3StreamPart,
  LegionBackend,
  LegionCommand,
  LegionCreateOptions,
  LegionCustomLoader,
  LegionCustomLoaderResult,
  LegionDispatchOptions,
  LegionDispatchResult,
  LegionInterceptResult,
  LegionModel,
  LegionPersona,
  LegionProviderInfo,
  LegionResolvedRoute,
  LegionRoutingDecision,
  LegionUsage,
  SacredFlameVerifyOptions,
  SacredFlameVerifyResult,
  SharedV3ProviderMetadata,
  SharedV3Warning,
} from "./types"

export default CUSTOM_LOADERS
