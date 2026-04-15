#!/usr/bin/env node
/**
 * Codex CLI Wrapper - Legion Dispatch Layer (HAL 10000)
 *
 * Wraps Codex CLI for code generation and review
 * Supports: gpt-5.3 (default), gpt-5.4, gpt-5.4-mini
 * Thinking levels: low, medium, high
 */

import { execa } from "execa"

export class CodexClient {
  constructor(options = {}) {
    this.model = options.model || "gpt-5.3"
    this.effort = options.effort || "medium"
    this.timeout = options.timeout || 600000 // 10 min default
  }

  /**
   * Execute prompt via Codex CLI exec mode
   * @param {string} prompt - The task to execute
   * @param {object} options - Execution options
   * @returns {Promise<{output: string, tokens: number, duration: number}>}
   */
  async execute(prompt, options = {}) {
    const model = options.model || this.model
    const effort = options.effort || this.effort
    const timeout = options.timeout || this.timeout

    const startTime = Date.now()

    try {
      const result = await execa("codex", [
        "exec",
        "--full-auto",
        "--json",
        JSON.stringify({ task: prompt, model, effort })
      ], {
        timeout,
        reject: false,
        env: {
          ...process.env,
          CODEX_SILENT: "true"
        }
      })

      const duration = Date.now() - startTime

      let output = ""
      let tokens = 0

      if (result.exitCode === 0) {
        try {
          const json = JSON.parse(result.stdout)
          output = json.output || json.result || ""
          tokens = json.usage?.total_tokens || Math.ceil(output.length / 4)
        } catch {
          output = result.stdout
          tokens = Math.ceil(output.length / 4)
        }
      }

      return {
        output,
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
   * Execute with review gate (not full-auto)
   */
  async executeWithReview(prompt, options = {}) {
    const result = await execa("codex", [
      "exec",
      "--json",
      JSON.stringify({ task: prompt, ...options })
    ], {
      timeout: options.timeout || this.timeout
    })

    return JSON.parse(result.stdout)
  }

  /**
   * Quick code review
   */
  async review(code, options = {}) {
    const prompt = `Review this code for security issues, bugs, and improvements:\n\n\`\`\`\n${code}\n\`\`\``
    return this.execute(prompt, { ...options, effort: "high" })
  }

  /**
   * Generate code from spec
   */
  async generate(spec, options = {}) {
    const prompt = `Implement the following specification:\n\n${spec}`
    return this.execute(prompt, options)
  }
}

export default CodexClient
