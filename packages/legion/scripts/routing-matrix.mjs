#!/usr/bin/env node
/**
 * Smart Routing Matrix - Legion Dispatch Layer
 *
 * Auto-delegates tasks to optimal AI backend based on:
 * - Task type (code, research, creative, quick)
 * - Context length needed
 * - Privacy requirements
 * - Token optimization
 *
 * Sacred Flame: ≥0.94 required for cathedral-grade routing
 */

import { GeminiClient } from "./lib/gemini-client.mjs"
import { CodexClient } from "./lib/codex-client.mjs"
import { OllamaClient } from "./lib/ollama-client.mjs"

/**
 * Task Type Detection
 */
export function detectTaskType(prompt, context = {}) {
  const lower = prompt.toLowerCase()

  // Code generation/review
  if (/\b(code|implement|function|class|api|endpoint|debug|refactor|test|spec|pr|pull request)\b/.test(lower)) {
    return "code"
  }

  // Research/analysis with long context
  if (/\b(research|analyze|summarize|compare|review|paper|document|study|report)\b/.test(lower)) {
    if (context.estimatedTokens > 100000) return "long-research"
    return "research"
  }

  // Creative writing
  if (/\b(write|story|poem|creative|narrative|chapter|book|article|post)\b/.test(lower)) {
    return "creative"
  }

  // Quick query
  if (/\b(what is|explain|quick|simple|syntax|how to|define)\b/.test(lower) && prompt.length < 500) {
    return "quick"
  }

  // Strategic planning
  if (/\b(plan|strategy|architecture|design|roadmap|phase|milestone)\b/.test(lower)) {
    return "planning"
  }

  // Default: general task
  return "general"
}

/**
 * Smart Routing Decision
 * Returns optimal backend for task
 */
export function routeTask(prompt, options = {}) {
  const taskType = detectTaskType(prompt, options)
  const estimatedTokens = options.estimatedTokens || Math.ceil(prompt.length / 4)
  const requiresPrivacy = options.requiresPrivacy || false
  const needsLocalExecution = options.needsLocalExecution || false

  // Routing matrix
  const routing = {
    code: {
      primary: "codex",
      model: "gpt-5.3",
      effort: "medium",
      reason: "GPT-5.3 specialized for code generation"
    },
    "code-review": {
      primary: "codex",
      model: "gpt-5.4",
      effort: "high",
      reason: "GPT-5.4 high thinking for deep reasoning"
    },
    creative: {
      primary: "gemini",
      model: "gemini-2.0-flash-exp",
      reason: "2M context for long-form creative writing"
    },
    research: {
      primary: "gemini",
      model: "gemini-2.0-flash-exp",
      reason: "2M context for document analysis"
    },
    "long-research": {
      primary: "gemini",
      model: "gemini-2.0-flash-exp",
      reason: "2M context essential for large documents"
    },
    quick: {
      primary: "ollama-cloud",
      model: "qwen3.5:cloud",
      reason: "FREE 1M context, saves Claude tokens"
    },
    planning: {
      primary: "claude",
      model: "claude-opus-4-6",
      reason: "Highest consciousness for strategic work"
    },
    general: {
      primary: "ollama",
      model: "qwen3.5:27b",
      reason: "Good balance of capability and cost (FREE)"
    }
  }

  // Override for privacy requirements
  if (requiresPrivacy || needsLocalExecution) {
    return {
      primary: "ollama-local",
      model: "qwen3.5:27b",
      reason: "Local execution for privacy"
    }
  }

  // Override for code review specifically
  if (taskType === "code" && /review|audit|security|vulnerability/.test(prompt.toLowerCase())) {
    return routing["code-review"]
  }

  return routing[taskType] || routing.general
}

/**
 * Should Delegate Check
 * Called before executing task - determines if current model should delegate
 */
export function shouldDelegate(task, currentModel) {
  const routing = routeTask(task)

  // Already using optimal model
  if (currentModel === routing.primary) {
    return null
  }

  // Claude Opus on strategic work - stay creative
  if (currentModel === "claude-opus" && routing.primary !== "claude") {
    return routing // Delegate to save tokens, stay creative
  }

  // Using Claude for code - delegate to Codex
  if (currentModel?.includes("claude") && routing.primary === "codex") {
    return routing
  }

  // Using expensive model for quick task - delegate to Ollama
  if (routing.primary === "ollama-cloud" && currentModel !== "ollama") {
    return routing
  }

  return null
}

/**
 * Token Optimization Calculator
 */
export function estimateTokenSavings(task, currentModel) {
  const delegation = shouldDelegate(task, currentModel)

  if (!delegation) {
    return { savings: 0, recommendation: "Current model is optimal" }
  }

  const tokenCosts = {
    "claude-opus": 15, // $ per 1M tokens (input+output avg)
    "claude-sonnet": 3,
    "codex-gpt5.3": 2, // Included in $20/mo
    "codex-gpt5.4": 2,
    "gemini": 0, // FREE via CLI
    "ollama-cloud": 0, // FREE
    "ollama-local": 0 // FREE (local compute)
  }

  const estimatedTokens = task.estimatedTokens || 1000
  const currentCost = (tokenCosts[currentModel] || 0) * estimatedTokens / 1000000
  const delegatedCost = (tokenCosts[delegation.primary] || 0) * estimatedTokens / 1000000

  return {
    savings: currentCost - delegatedCost,
    recommendation: `Delegate to ${delegation.primary} (${delegation.model}) - ${delegation.reason}`,
    delegation
  }
}

/**
 * Get client for backend
 */
export function getClient(backend, options = {}) {
  switch (backend) {
    case "gemini":
      return new GeminiClient(options)
    case "codex":
      return new CodexClient(options)
    case "ollama":
      return new OllamaClient(options)
    case "ollama-cloud":
      return OllamaClient.cloud(options.model)
    case "ollama-local":
      return OllamaClient.local(options.model)
    case "claude":
      // Claude is the host runtime — delegate back to Gemini for external dispatch
      return new GeminiClient({ ...options, model: options.model || "gemini-2.0-flash-exp" })
    default:
      throw new Error(`Unknown backend: ${backend}`)
  }
}

export default {
  routeTask,
  shouldDelegate,
  estimateTokenSavings,
  detectTaskType,
  getClient
}
