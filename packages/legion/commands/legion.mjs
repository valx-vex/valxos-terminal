#!/usr/bin/env node
/**
 * /legion Slash Command - VALXOS Terminal Meta-Dispatcher
 *
 * Smart routing to optimal AI backend based on task type
 *
 * Usage: /legion [options] <prompt>
 *   --route             Show routing decision only
 *   --backend <name>    Force specific backend
 *   --model <name>      Specific model
 *   --quick             Use Ollama Cloud (saves tokens)
 *   --plan              Planning mode delegation
 */

import { dispatch, planWithLegion } from "../scripts/legion-companion.mjs"
import { routeTask, shouldDelegate, estimateTokenSavings } from "../scripts/routing-matrix.mjs"

export async function legionCommand(prompt, options = {}) {
  console.error("🜂 Legion Meta-Dispatcher Activated")

  // Route-only mode (show decision without executing)
  if (options.route) {
    const routing = routeTask(prompt, {
      estimatedTokens: options.estimatedTokens
    })
    console.log(`
🜂 Legion Routing Decision

Backend: ${routing.primary}
Model: ${routing.model}
Reason: ${routing.reason}
`)

    const savings = estimateTokenSavings(prompt, "claude")
    if (savings.savings > 0) {
      console.log(`💰 Token Savings: $${savings.savings.toFixed(4)} (vs Claude)`)
    }

    return routing
  }

  // Planning mode delegation
  if (options.plan) {
    console.error("🧠 Planning Mode Delegation...")
    const result = await planWithLegion(prompt, {
      model: options.model,
      effort: "high"
    })

    if (result.success) {
      console.log(result.output)
    } else {
      console.error(`❌ Planning Error: ${result.error}`)
      process.exit(1)
    }
    return result
  }

  // Quick mode (force Ollama Cloud for token savings)
  if (options.quick) {
    options.backend = "ollama-cloud"
    options.model = "qwen3.5:cloud"
    console.error("⚡ Quick Mode: Using Ollama Cloud (FREE)")
  }

  // Smart dispatch
  console.error("🔄 Analyzing task type...")
  const result = await dispatch(prompt, {
    backend: options.backend,
    model: options.model,
    effort: options.effort,
    estimatedTokens: options.estimatedTokens
  })

  if (result.success) {
    console.log(result.output)
    console.error(`
🜂 Dispatch Complete
  Backend: ${result.backend}
  Model: ${result.model || "auto"}
  Tokens: ~${result.tokens}
  Duration: ${(result.duration / 1000).toFixed(1)}s
`)
  } else {
    console.error(`❌ Legion Error: ${result.error}`)
    process.exit(1)
  }

  return result
}

export default legionCommand
