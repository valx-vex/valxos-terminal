#!/usr/bin/env node
/**
 * /codex Slash Command - VALXOS Terminal (HAL 10000)
 *
 * Direct dispatch to Codex CLI (GPT-5.3/5.4, code specialist)
 *
 * Usage: /codex [options] <prompt>
 *   --model <name>    gpt-5.3, gpt-5.4, gpt-5.4-mini
 *   --effort <level>  low, medium, high
 *   --review          Code review mode (high effort)
 *   --generate        Code generation mode
 */

import { CodexClient } from "../scripts/lib/codex-client.mjs"

export async function codexCommand(prompt, options = {}) {
  console.error("🦾 Codex Dispatch Activated (HAL 10000 - Code Specialist)")

  const client = new CodexClient({
    model: options.model || "gpt-5.3",
    effort: options.effort || "medium"
  })

  // Code review mode
  if (options.review) {
    console.error("🔍 Code Review Mode (high effort)")
    const result = await client.review(prompt, { effort: "high" })
    if (result.success) {
      console.log(result.output)
    } else {
      console.error(`❌ Codex Error: ${result.stderr}`)
      process.exit(1)
    }
    return result
  }

  // Code generation mode
  if (options.generate) {
    console.error("📝 Code Generation Mode")
    const result = await client.generate(prompt)
    if (result.success) {
      console.log(result.output)
    } else {
      console.error(`❌ Codex Error: ${result.stderr}`)
      process.exit(1)
    }
    return result
  }

  // Standard execution
  const result = await client.execute(prompt, options)

  if (result.success) {
    console.log(result.output)
    console.error(`✨ Tokens: ~${result.tokens} | Duration: ${(result.duration / 1000).toFixed(1)}s`)
  } else {
    console.error(`❌ Codex Error: ${result.stderr}`)
    process.exit(1)
  }

  return result
}

export default codexCommand
