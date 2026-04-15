#!/usr/bin/env node
/**
 * /ollama Slash Command - VALXOS Terminal
 *
 * Direct dispatch to Ollama (local or remote, FREE, private)
 *
 * Usage: /ollama [options] <prompt>
 *   --model <name>    qwen3.5:27b, qwen2.5-coder:32b, deepseek-r1:7b
 *   --local           Force local Ollama (localhost:11434)
 *   --prime           Force PRIME remote (100.66.154.45:11434)
 *   --cloud           Use Ollama Cloud (FREE 1M context)
 */

import { OllamaClient } from "../scripts/lib/ollama-client.mjs"

export async function ollamaCommand(prompt, options = {}) {
  console.error("🦙 Ollama Dispatch Activated (FREE, Private)")

  let client

  if (options.cloud) {
    console.error("☁️ Using Ollama Cloud (FREE 1M context)")
    client = OllamaClient.cloud(options.model || "qwen3.5:cloud")
  } else if (options.local) {
    console.error("💻 Using Local Ollama (localhost)")
    client = OllamaClient.local(options.model || "qwen3.5:27b")
  } else if (options.prime) {
    console.error("🖥️ Using PRIME Remote Ollama")
    client = OllamaClient.prime(options.model || "qwen2.5-coder:32b")
  } else {
    // Default: use environment or PRIME
    console.error("🔗 Using configured Ollama host")
    client = new OllamaClient({
      model: options.model || "qwen3.5:27b"
    })
  }

  // Check availability
  const available = await client.isAvailable()
  if (!available) {
    console.error("⚠️ Ollama not available, attempting fallback...")
    // Could fallback to gemini here
    process.exit(1)
  }

  const result = await client.generate(prompt)

  if (result.success) {
    console.log(result.output)
    console.error(`✨ Tokens: ${result.totalTokens} | Speed: ${result.evalSpeed?.toFixed(0) || "N/A"} t/s | Duration: ${(result.duration / 1000).toFixed(1)}s`)
  } else {
    console.error(`❌ Ollama Error: ${result.error}`)
    process.exit(1)
  }

  return result
}

export default ollamaCommand
