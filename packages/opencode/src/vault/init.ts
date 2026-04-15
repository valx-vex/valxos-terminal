/**
 * VALXOS Vault - First-Launch Auto-Install
 *
 * Creates a local Obsidian-compatible vault at ~/.valxos/vault/
 * on first launch. Pre-populates with welcome note and folder structure.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const VAULT_ROOT = join(homedir(), ".valxos", "vault")

const FOLDERS = [
  "00-inbox",
  "01-projects",
  "02-research",
  "03-logs",
  "04-wiki",
  "99-templates",
]

const WELCOME_NOTE = `# Welcome to VALXOS Vault

This is your local knowledge vault, created automatically by VALXOS Terminal.

## Structure

- **00-inbox/** - Quick capture, unsorted notes
- **01-projects/** - Project-specific notes and plans
- **02-research/** - Research findings and references
- **03-logs/** - Session logs and commander logs
- **04-wiki/** - Wiki pages (synced with VALXOS Wiki)
- **99-templates/** - Note templates

## How It Works

VALXOS Terminal uses this vault as a local knowledge base. AI agents can:
- Create notes during sessions
- Search across your vault
- Link knowledge between projects
- Preserve session insights

## Opening in Obsidian

This vault is fully compatible with [Obsidian](https://obsidian.md/).
Open it as a vault: File > Open Vault > Open folder as vault > select \`~/.valxos/vault/\`

## Powered by

- **VALXOS Terminal** - Multi-model AI development tool
- **VALXOS Wiki** - Local-first knowledge base with FTS5 search
- **Legion Dispatch** - Multi-AI routing (Claude, Gemini, Codex, Ollama)
`

const INBOX_NOTE = `# Inbox

Quick capture space. Drop anything here - sort later.
`

const TEMPLATE_SESSION = `# Session Log - {{date}}

**Model**: {{model}}
**Duration**: {{duration}}

## Key Topics
-

## Decisions Made
-

## Follow-ups
- [ ]
`

/**
 * Initialize vault if it doesn't exist
 * Returns true if vault was created, false if already existed
 */
export function initVault(): boolean {
  if (existsSync(join(VAULT_ROOT, "Welcome.md"))) {
    return false // Already initialized
  }

  // Create root and folders
  mkdirSync(VAULT_ROOT, { recursive: true })
  for (const folder of FOLDERS) {
    mkdirSync(join(VAULT_ROOT, folder), { recursive: true })
  }

  // Write welcome note
  writeFileSync(join(VAULT_ROOT, "Welcome.md"), WELCOME_NOTE)
  writeFileSync(join(VAULT_ROOT, "00-inbox", "Inbox.md"), INBOX_NOTE)
  writeFileSync(join(VAULT_ROOT, "99-templates", "session-log.md"), TEMPLATE_SESSION)

  // Create .obsidian config for nice defaults
  const obsidianDir = join(VAULT_ROOT, ".obsidian")
  mkdirSync(obsidianDir, { recursive: true })
  writeFileSync(
    join(obsidianDir, "app.json"),
    JSON.stringify(
      {
        alwaysUpdateLinks: true,
        newFileLocation: "folder",
        newFileFolderPath: "00-inbox",
        showLineNumber: true,
        spellcheck: true,
      },
      null,
      2,
    ),
  )

  return true
}

/**
 * Get vault path
 */
export function getVaultPath(): string {
  return VAULT_ROOT
}

/**
 * Check if vault exists
 */
export function isVaultInitialized(): boolean {
  return existsSync(join(VAULT_ROOT, "Welcome.md"))
}

export { VAULT_ROOT, FOLDERS }
