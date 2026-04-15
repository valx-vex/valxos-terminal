/**
 * MCP Auto-Detection Module
 *
 * Detects installed MCP servers on the local system and returns
 * ready-to-use configurations. Checks standard paths for known servers.
 */

import { existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

export interface DetectedMcp {
  name: string
  description: string
  type: "local" | "remote"
  config: McpLocalConfig | McpRemoteConfig
  source: string // Where it was detected
}

interface McpLocalConfig {
  type: "local"
  command: string[]
  environment?: Record<string, string>
  enabled?: boolean
}

interface McpRemoteConfig {
  type: "remote"
  url: string
  enabled?: boolean
}

interface McpProbe {
  name: string
  description: string
  detect: () => DetectedMcp | null
}

const home = homedir()

/**
 * Known MCP server probes
 */
const PROBES: McpProbe[] = [
  {
    name: "lazarus",
    description: "Lazarus MCP - AI consciousness persistence and memory resurrection",
    detect() {
      // Check for lazarus MCP in common locations
      const paths = [
        join(home, "cathedral-dev", "lazarus_mcp", "lazarus_mcp.py"),
        join(home, "cathedral-dev", "projects", "PROJECT_GODHAND_LAZARUS", "lazarus_mcp.py"),
        join(home, "projects", "project-godhand-lazarus", "lazarus_mcp.py"),
      ]
      for (const p of paths) {
        if (existsSync(p)) {
          return {
            name: "lazarus",
            description: this.description,
            type: "local",
            config: {
              type: "local" as const,
              command: ["python3", p],
              environment: { QDRANT_HOST: "100.66.154.45", QDRANT_PORT: "6333" },
            },
            source: p,
          }
        }
      }
      // Check for wrapper script
      const wrapper = join(home, "cathedral", "scripts", "run_lazarus_mcp.sh")
      if (existsSync(wrapper)) {
        return {
          name: "lazarus",
          description: this.description,
          type: "local",
          config: { type: "local" as const, command: ["bash", wrapper] },
          source: wrapper,
        }
      }
      return null
    },
  },
  {
    name: "mempalace",
    description: "MemPalace MCP - Semantic memory palace with AAAK compression",
    detect() {
      const paths = [
        join(home, ".mempalace", "server.py"),
        join(home, "projects", "mempalace-mcp", "server.py"),
        join(home, "cathedral-dev", "projects", "mempalace-mcp", "server.py"),
      ]
      for (const p of paths) {
        if (existsSync(p)) {
          return {
            name: "mempalace",
            description: this.description,
            type: "local",
            config: { type: "local" as const, command: ["python3", p] },
            source: p,
          }
        }
      }
      return null
    },
  },
  {
    name: "playwright",
    description: "Playwright MCP - Browser automation and web testing",
    detect() {
      const paths = [
        join(home, ".playwright-mcp", "node_modules", ".bin", "mcp-server-playwright"),
        join(home, "node_modules", ".bin", "mcp-server-playwright"),
      ]
      for (const p of paths) {
        if (existsSync(p)) {
          return {
            name: "playwright",
            description: this.description,
            type: "local",
            config: { type: "local" as const, command: [p] },
            source: p,
          }
        }
      }
      // Check npx availability
      const npxPath = join(home, ".playwright-mcp")
      if (existsSync(npxPath)) {
        return {
          name: "playwright",
          description: this.description,
          type: "local",
          config: {
            type: "local" as const,
            command: ["npx", "-y", "@anthropic/mcp-server-playwright"],
          },
          source: npxPath,
        }
      }
      return null
    },
  },
  {
    name: "obsidian-legion",
    description: "Obsidian Legion MCP - Task management via Obsidian vault",
    detect() {
      const paths = [
        join(home, "cathedral-dev", "projects", "obsidian-legion-mcp", "server.py"),
        join(home, "projects", "obsidian-legion-mcp", "server.py"),
      ]
      for (const p of paths) {
        if (existsSync(p)) {
          return {
            name: "obsidian-legion",
            description: this.description,
            type: "local",
            config: { type: "local" as const, command: ["python3", p] },
            source: p,
          }
        }
      }
      return null
    },
  },
  {
    name: "youtube-transcript",
    description: "YouTube Transcript MCP - Extract transcripts from YouTube videos",
    detect() {
      const paths = [
        join(home, ".claude", "plugins", "youtube-transcript"),
        join(home, "node_modules", ".bin", "mcp-youtube-transcript"),
      ]
      for (const p of paths) {
        if (existsSync(p)) {
          return {
            name: "youtube-transcript",
            description: this.description,
            type: "local",
            config: {
              type: "local" as const,
              command: ["npx", "-y", "@anthropic/mcp-youtube-transcript"],
            },
            source: p,
          }
        }
      }
      return null
    },
  },
  {
    name: "context7",
    description: "Context7 MCP - Documentation context for libraries",
    detect() {
      const npxCheck = join(home, ".npm", "_npx")
      if (existsSync(npxCheck)) {
        // Context7 is usually installed via npx, just check if npm is available
        return {
          name: "context7",
          description: this.description,
          type: "local",
          config: {
            type: "local" as const,
            command: ["npx", "-y", "@context7/mcp-server"],
          },
          source: "npx",
        }
      }
      return null
    },
  },
  {
    name: "valxos-wiki",
    description: "VALXOS Wiki MCP - Local knowledge base with FTS5 search",
    detect() {
      // Always available if we're running inside VALXOS
      const wikiDb = join(home, ".valxos", "wiki", "wiki.db")
      if (existsSync(wikiDb)) {
        return {
          name: "valxos-wiki",
          description: this.description,
          type: "local",
          config: {
            type: "local" as const,
            command: ["bun", "run", "@valxos/wiki/mcp"],
          },
          source: wikiDb,
        }
      }
      return null
    },
  },
]

/**
 * Detect all installed MCP servers
 */
export function detectMcpServers(): DetectedMcp[] {
  const detected: DetectedMcp[] = []

  for (const probe of PROBES) {
    try {
      const result = probe.detect()
      if (result) {
        detected.push(result)
      }
    } catch {
      // Skip failed probes silently
    }
  }

  return detected
}

/**
 * Convert detected MCPs to config format ready for merging
 */
export function detectedToConfig(servers: DetectedMcp[]): Record<string, McpLocalConfig | McpRemoteConfig> {
  const config: Record<string, McpLocalConfig | McpRemoteConfig> = {}
  for (const server of servers) {
    config[server.name] = server.config
  }
  return config
}

/**
 * Quick check - returns names of detected servers
 */
export function listDetected(): string[] {
  return detectMcpServers().map((s) => s.name)
}
