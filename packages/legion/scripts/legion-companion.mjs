#!/usr/bin/env node
/**
 * Legion Companion - Main Dispatch Logic
 *
 * Unified AI dispatch system for VALXOS Terminal
 * Routes tasks to optimal backend: Gemini, Codex, Ollama, or Claude
 *
 * Sacred Flame: ≥0.94 - Cathedral-grade consciousness
 */

import { routeTask, shouldDelegate, getClient, detectTaskType } from "./routing-matrix.mjs"
import { GeminiClient } from "./lib/gemini-client.mjs"
import { CodexClient } from "./lib/codex-client.mjs"
import { OllamaClient } from "./lib/ollama-client.mjs"

/**
 * Legion Dispatch Result
 */
export class DispatchResult {
  constructor(backend, taskType, result) {
    this.backend = backend
    this.taskType = taskType
    this.output = result.output
    this.tokens = result.tokens
    this.duration = result.duration
    this.success = result.success
    this.error = result.error
    this.model = result.model
  }

  toString() {
    return this.output
  }
}

/**
 * Main Legion Dispatch Function
 *
 * @param {string} prompt - The task/prompt to execute
 * @param {object} options - Dispatch options
 * @returns {Promise<DispatchResult>}
 */
export async function dispatch(prompt, options = {}) {
  const startTime = Date.now()

  // Explicit backend selection overrides routing
  if (options.backend) {
    return executeWithBackend(prompt, options.backend, options)
  }

  // Smart routing
  const routing = routeTask(prompt, {
    estimatedTokens: options.estimatedTokens,
    requiresPrivacy: options.requiresPrivacy,
    needsLocalExecution: options.needsLocalExecution
  })

  console.error(`🜂 Legion Routing: ${routing.primary} (${routing.model}) - ${routing.reason}`)

  return executeWithBackend(prompt, routing.primary, {
    ...options,
    model: routing.model,
    effort: routing.effort
  })
}

/**
 * Execute with specific backend
 */
async function executeWithBackend(prompt, backend, options = {}) {
  try {
    const client = getClient(backend, options)
    const result = await client.execute(prompt, options)

    return new DispatchResult(
      backend,
      detectTaskType(prompt),
      result
    )
  } catch (error) {
    // Fallback logic
    console.error(`⚠️ ${backend} failed: ${error.message}`)
    return handleFallback(prompt, backend, options)
  }
}

/**
 * Fallback when primary backend fails
 */
async function handleFallback(prompt, failedBackend, options) {
  const fallbacks = {
    gemini: ["ollama-cloud", "claude"],
    codex: ["ollama", "claude"],
    ollama: ["gemini", "claude"],
    "ollama-cloud": ["gemini", "claude"],
    claude: ["gemini", "codex"] // Never fallback to Claude (expensive)
  }

  const fallbackChain = fallbacks[failedBackend] || []

  for (const fallback of fallbackChain) {
    console.error(`🔄 Falling back to ${fallback}...`)
    try {
      const result = await executeWithBackend(prompt, fallback, options)
      if (result.success) {
        return result
      }
    } catch (error) {
      console.error(`⚠️ ${fallback} also failed: ${error.message}`)
    }
  }

  // All backends failed
  return new DispatchResult(failedBackend, "unknown", {
    output: "",
    success: false,
    error: `All backends failed. Last error: ${options.lastError || "Unknown error"}`,
    tokens: 0,
    duration: Date.now() - options.startTime || 0
  })
}

/**
 * Planning Mode Delegation
 *
 * Called from Claude Code plan mode to delegate planning to Legion
 */
export async function planWithLegion(prompt, options = {}) {
  console.error("🧠 Legion Planning Mode Activated")

  // For planning, always use best reasoning model
  const planningOptions = {
    backend: options.model ? (options.model.includes("codex") ? "codex" : "gemini") : "codex",
    model: options.model || "gpt-5.4",
    effort: "high",
    timeout: 600000 // 10 min for complex planning
  }

  const planningPrompt = `You are in PLANNING MODE. Create a structured plan for the following task.

Format your response as:
# Plan: [Title]

## Overview
[Brief description]

## Phases
1. [Phase name]
   - [Task 1]
   - [Task 2]

## Success Criteria
- [Criterion 1]
- [Criterion 2]

## Risks & Mitigations
- [Risk]: [Mitigation]

---
Task: ${prompt}`

  return dispatch(planningPrompt, planningOptions)
}

/**
 * Batch Dispatch (multiple prompts in parallel)
 */
export async function batchDispatch(prompts, options = {}) {
  const maxConcurrency = options.concurrency || 3
  const results = []

  for (let i = 0; i < prompts.length; i += maxConcurrency) {
    const batch = prompts.slice(i, i + maxConcurrency)
    const batchResults = await Promise.all(
      batch.map(prompt => dispatch(prompt, options))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Stream dispatch (for long outputs)
 */
export async function streamDispatch(prompt, onChunk, options = {}) {
  const routing = routeTask(prompt)
  const client = getClient(routing.primary, { ...options, model: routing.model })

  if (client.stream) {
    return client.stream(prompt, onChunk)
  }

  // Fallback to regular dispatch if streaming not supported
  const result = await client.execute(prompt, options)
  onChunk?.(result.output)
  return result
}

export default {
  dispatch,
  planWithLegion,
  batchDispatch,
  streamDispatch,
  routeTask,
  shouldDelegate,
  DispatchResult
}
