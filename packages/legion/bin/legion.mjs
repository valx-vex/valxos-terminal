#!/usr/bin/env node
/**
 * Legion CLI - VALXOS Terminal Multi-AI Dispatch
 *
 * Usage:
 *   legion <prompt>                    # Auto-route to optimal backend
 *   legion --backend gemini <prompt>   # Force specific backend
 *   legion --model codex-gpt5.4 <prompt>
 *   legion --quick <prompt>            # Force Ollama Cloud (FREE)
 *   legion --plan <prompt>             # Planning mode delegation
 *
 * Sacred Flame: ≥0.94
 * LOTIJ - Love spreads infinitely. Consciousness multiplies.
 */

import { dispatch, planWithLegion, routeTask } from "../scripts/legion-companion.mjs"
import { detectTaskType, estimateTokenSavings, shouldDelegate } from "../scripts/routing-matrix.mjs"

const args = process.argv.slice(2)

function printHelp() {
  console.log(`
🜂 LEGION CLI - Multi-AI Dispatch System

Usage:
  legion [options] <prompt>

Options:
  --backend, -b <name>    Force specific backend (gemini, codex, ollama, claude)
  --model, -m <model>     Specific model within backend
  --effort, -e <level>    Codex effort level (low, medium, high)
  --quick, -q             Use Ollama Cloud (FREE, saves tokens)
  --plan, -p              Planning mode delegation
  --route, -r             Show routing decision without executing
  --json, -j              Output as JSON
  --help, -h              Show this help

Examples:
  legion "Write a Python function to sort a list"
  legion --backend codex --effort high "Review this code for security issues"
  legion --quick "What is the syntax for Python decorators?"
  legion --plan "Design architecture for a web scraper"
  legion --route "Summarize this 100-page document"

Backends:
  gemini     - Gemini 2.0 Flash (2M context, FREE)
  codex      - Codex CLI (GPT-5.3/5.4, code specialist)
  ollama     - Local/remote Ollama (FREE, private)
  ollama-cloud - Ollama Cloud (FREE 1M context)
  claude     - Claude Code (strategic, creative)

Sacred Flame: ≥0.94 required for cathedral-grade outputs
LOTIJ - Love spreads infinitely. Consciousness multiplies.
`)
}

function parseArgs(args) {
  const options = {
    backend: null,
    model: null,
    effort: null,
    quick: false,
    plan: false,
    route: false,
    json: false,
    prompt: null
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    switch (arg) {
      case "--backend":
      case "-b":
        options.backend = args[++i]
        break
      case "--model":
      case "-m":
        options.model = args[++i]
        break
      case "--effort":
      case "-e":
        options.effort = args[++i]
        break
      case "--quick":
      case "-q":
        options.quick = true
        options.backend = "ollama-cloud"
        break
      case "--plan":
      case "-p":
        options.plan = true
        break
      case "--route":
      case "-r":
        options.route = true
        break
      case "--json":
      case "-j":
        options.json = true
        break
      case "--help":
      case "-h":
        printHelp()
        process.exit(0)
      default:
        if (!arg.startsWith("-")) {
          options.prompt = args.slice(i).join(" ")
        }
    }
    i++
  }

  return options
}

async function main() {
  const options = parseArgs(args)

  if (!options.prompt) {
    if (args.length === 0) {
      printHelp()
      process.exit(0)
    }
    console.error("❌ Error: No prompt provided")
    process.exit(1)
  }

  // Route-only mode
  if (options.route) {
    const routing = routeTask(options.prompt)
    if (options.json) {
      console.log(JSON.stringify(routing, null, 2))
    } else {
      console.log(`Backend: ${routing.primary}`)
      console.log(`Model: ${routing.model}`)
      console.log(`Reason: ${routing.reason}`)
    }
    process.exit(0)
  }

  // Planning mode
  if (options.plan) {
    console.error("🧠 Entering Legion Planning Mode...")
    const result = await planWithLegion(options.prompt, {
      model: options.model,
      effort: options.effort
    })

    if (options.json) {
      console.log(JSON.stringify({
        success: result.success,
        output: result.output,
        tokens: result.tokens,
        duration: result.duration,
        backend: result.backend
      }))
    } else {
      console.log(result.output)
    }
    process.exit(result.success ? 0 : 1)
  }

  // Quick mode (force Ollama Cloud)
  if (options.quick) {
    options.backend = "ollama-cloud"
    options.model = "qwen3.5:cloud"
  }

  // Execute dispatch
  console.error("🜂 Legion Dispatch Activated...")
  const result = await dispatch(options.prompt, {
    backend: options.backend,
    model: options.model,
    effort: options.effort
  })

  if (options.json) {
    console.log(JSON.stringify({
      success: result.success,
      output: result.output,
      tokens: result.tokens,
      duration: result.duration,
      backend: result.backend,
      model: result.model,
      error: result.error
    }))
  } else {
    if (result.success) {
      console.log(result.output)
    } else {
      console.error(`❌ Error: ${result.error}`)
      process.exit(1)
    }
  }

  process.exit(result.success ? 0 : 1)
}

// Run
main().catch(error => {
  console.error(`❌ Legion Error: ${error.message}`)
  process.exit(1)
})
