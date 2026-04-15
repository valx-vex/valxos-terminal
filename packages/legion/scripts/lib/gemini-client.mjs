#!/usr/bin/env node
/**
 * Gemini CLI Wrapper - Legion Dispatch Layer
 *
 * Wraps Gemini CLI for multi-model dispatch
 * Supports: gemini-2.0-flash-exp (2M context), gemini-3-pro-preview
 */

import { execa } from "execa"

export class GeminiClient {
  constructor(options = {}) {
    this.model = options.model || "gemini-2.0-flash-exp"
    this.timeout = options.timeout || 300000 // 5 min default
  }

  /**
   * Execute prompt via Gemini CLI
   * @param {string} prompt - The prompt to execute
   * @param {object} options - Execution options
   * @returns {Promise<{output: string, tokens: number, duration: number}>}
   */
  async execute(prompt, options = {}) {
    const model = options.model || this.model
    const timeout = options.timeout || this.timeout

    const startTime = Date.now()

    try {
      const result = await execa("gemini", [
        "-p",
        prompt,
        "--model",
        model,
        ...(options.yolo ? ["--yolo"] : []),
        ...(options.quiet ? ["--quiet"] : [])
      ], {
        timeout,
        reject: false
      })

      const duration = Date.now() - startTime

      // Estimate tokens from output length (rough approximation)
      const tokens = Math.ceil((result.stdout?.length || 0) / 4)

      return {
        output: result.stdout || "",
        stderr: result.stderr || "",
        tokens,
        duration,
        success: result.exitCode === 0,
        exitCode: result.exitCode
      }
    } catch (error) {
      return {
        output: "",
        stderr: error.message,
        tokens: 0,
        duration: Date.now() - startTime,
        success: false,
        exitCode: -1,
        error
      }
    }
  }

  /**
   * Execute with streaming output
   * @param {string} prompt
   * @param {function} onChunk - Callback for streaming output
   */
  async stream(prompt, onChunk) {
    const subprocess = execa("gemini", [
      "-p",
      prompt,
      "--model",
      this.model,
      "--stream"
    ])

    subprocess.stdout?.on("data", (data) => {
      onChunk?.(data.toString())
    })

    const result = await subprocess
    return {
      output: result.stdout,
      success: result.exitCode === 0
    }
  }

  /**
   * Get available Gemini models
   */
  async listModels() {
    try {
      const result = await execa("gemini", ["--list-models"])
      return result.stdout.split("\n").filter(line => line.trim())
    } catch {
      return [this.model] // Fallback to default
    }
  }
}

export default GeminiClient
