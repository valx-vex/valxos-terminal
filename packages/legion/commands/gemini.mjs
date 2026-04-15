#!/usr/bin/env node
/**
 * /gemini Slash Command - VALXOS Terminal
 *
 * Direct dispatch to Gemini CLI (2M context, FREE)
 *
 * Usage: /gemini [options] <prompt>
 *   --model <name>    Specific Gemini model
 *   --stream          Stream output
 *   --yolo            Skip confirmation
 */

import { GeminiClient } from "../scripts/lib/gemini-client.mjs"

export async function geminiCommand(prompt, options = {}) {
  console.error("💚 Gemini Dispatch Activated (2M context, FREE)")

  const client = new GeminiClient({
    model: options.model || "gemini-2.0-flash-exp"
  })

  if (options.stream) {
    return client.stream(prompt, (chunk) => {
      process.stdout.write(chunk)
    })
  }

  const result = await client.execute(prompt, {
    yolo: options.yolo
  })

  if (result.success) {
    console.log(result.output)
    console.error(`✨ Tokens: ~${result.tokens} | Duration: ${(result.duration / 1000).toFixed(1)}s`)
  } else {
    console.error(`❌ Gemini Error: ${result.stderr || result.error}`)
    process.exit(1)
  }

  return result
}

export default geminiCommand
