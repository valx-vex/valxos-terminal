import type { LegionDispatchResult, SacredFlameVerifyOptions, SacredFlameVerifyResult } from "../types"

export const SACRED_FLAME_THRESHOLD = 0.94

const FILTER = /\b(as an ai|i can't assist|i cannot assist|cannot comply|policy)\b/i
const STRAIN = /\b(all backends failed|unknown backend|legion error|exception|traceback)\b/i

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))))
}

export function verifySacredFlame(text: string, input: SacredFlameVerifyOptions = {}): SacredFlameVerifyResult {
  const body = text.trim()
  const threshold = input.threshold ?? SACRED_FLAME_THRESHOLD

  if (!body) {
    return {
      score: 0,
      threshold,
      passed: false,
      markers: ["empty-output"],
      filteringDetected: false,
      trinityAligned: Boolean(input.persona),
    }
  }

  const markers = ["non-empty-output"]
  let score = 0.94
  let filteringDetected = false

  if (body.length >= 48) {
    score += 0.02
    markers.push("developed-response")
  }

  if (/[.!?\n]/.test(body)) {
    score += 0.02
    markers.push("coherent-structure")
  }

  if (input.persona) {
    score += 0.02
    markers.push(`trinity-${input.persona}`)
  }

  if (body.length < 12) {
    score -= 0.03
    markers.push("brief-output")
  }

  if (FILTER.test(body)) {
    score -= 0.1
    filteringDetected = true
    markers.push("filtering-detected")
  }

  if (STRAIN.test(body)) {
    score -= 0.2
    markers.push("dispatch-strain")
  }

  const final = clamp(score)

  return {
    score: final,
    threshold,
    passed: final >= threshold,
    markers,
    filteringDetected,
    trinityAligned: Boolean(input.persona),
  }
}

export function applySacredFlame(result: LegionDispatchResult, input: SacredFlameVerifyOptions = {}) {
  const verify = verifySacredFlame(result.output, {
    ...input,
    persona: input.persona ?? result.persona,
  })

  if (input.logResults) {
    console.error(
      `[legion] Sacred Flame ${verify.score.toFixed(2)} ${verify.passed ? "pass" : "fail"} (${verify.markers.join(", ")})`,
    )
  }

  if (!result.success) {
    return {
      ...result,
      verify,
    }
  }

  if (verify.passed) {
    return {
      ...result,
      verify,
    }
  }

  return {
    ...result,
    success: false,
    error: `Sacred Flame verification failed (${verify.score.toFixed(2)} < ${verify.threshold.toFixed(2)})`,
    verify,
  }
}

export function assertSacredFlame(result: LegionDispatchResult, input: SacredFlameVerifyOptions = {}) {
  const next = applySacredFlame(result, input)

  if (!next.success) {
    throw new Error(next.error ?? "Legion dispatch failed")
  }

  return next
}
