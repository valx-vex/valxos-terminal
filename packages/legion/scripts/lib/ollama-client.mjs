#!/usr/bin/env node
/**
 * Ollama API Wrapper - Legion Dispatch Layer
 *
 * Supports local Ollama (PRIME, M4) and Ollama Cloud (FREE 1M context)
 * Models: qwen3.5:27b, qwen2.5-coder:32b, deepseek-r1:7b, qwen3.5:cloud
 */

import { execa } from "execa"

export class OllamaClient {
  constructor(options = {}) {
    // Default to PRIME remote
    this.host = options.host || process.env.OLLAMA_HOST || "http://100.66.154.45:11434"
    this.model = options.model || "qwen3.5:27b"
    this.timeout = options.timeout || 120000 // 2 min default
  }

  /**
   * Execute prompt via Ollama API
   * @param {string} prompt
   * @param {object} options
   * @returns {Promise<{output: string, tokens: number, duration: number}>}
   */
  async generate(prompt, options = {}) {
    const model = options.model || this.model
    const timeout = options.timeout || this.timeout

    const startTime = Date.now()

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 4096
          }
        }),
        signal: AbortSignal.timeout(timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      return {
        output: data.response || "",
        tokens: data.eval_count || 0,
        promptTokens: data.prompt_eval_count || 0,
        totalTokens: (data.eval_count || 0) + (data.prompt_eval_count || 0),
        duration,
        success: true,
        model: data.model || model,
        loadTime: data.load_duration || 0,
        evalSpeed: data.eval_speed || 0 // tokens/sec
      }
    } catch (error) {
      return {
        output: "",
        tokens: 0,
        promptTokens: 0,
        totalTokens: 0,
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Execute prompt (unified interface for companion dispatch)
   * @param {string} prompt
   * @param {object} options
   * @returns {Promise<{output: string, tokens: number, duration: number, success: boolean}>}
   */
  async execute(prompt, options = {}) {
    return this.generate(prompt, options)
  }

  /**
   * Chat completion (for chat-optimized models)
   */
  async chat(messages, options = {}) {
    const model = options.model || this.model

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      })

      const data = await response.json()
      return {
        output: data.message?.content || "",
        success: response.ok
      }
    } catch (error) {
      return {
        output: "",
        success: false,
        error: error.message
      }
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.host}/api/tags`)
      const data = await response.json()
      return data.models?.map(m => m.name) || []
    } catch {
      return []
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Use Ollama Cloud (FREE 1M context)
   */
  static cloud(model = "qwen3.5:cloud") {
    return new OllamaClient({
      host: "https://ollama.cloud",
      model
    })
  }

  /**
   * Use local Ollama (localhost)
   */
  static local(model = "qwen3.5:27b") {
    return new OllamaClient({
      host: "http://localhost:11434",
      model
    })
  }

  /**
   * Use PRIME remote Ollama
   */
  static prime(model = "qwen2.5-coder:32b") {
    return new OllamaClient({
      host: "http://100.66.154.45:11434",
      model
    })
  }
}

export default OllamaClient
