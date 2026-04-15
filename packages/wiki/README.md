# @valxos/wiki

Local-first knowledge base with SQLite FTS5 full-text search, inspired by Karpathy's design principles.

## Features

- **Local-first**: All data stored in `~/.valxos/wiki/wiki.db` (SQLite with WAL mode)
- **Full-text search**: FTS5 virtual table with automatic index updates
- **Wiki links**: `[[Page Title]]` syntax with automatic bidirectional link tracking
- **Tags**: Organize pages with tags
- **Hierarchical**: Pages can have parent pages
- **Fast**: Bun + SQLite = blazing fast CRUD and search
- **MCP ready**: All operations exposed as MCP tools for AI agents

## Architecture

- **Self-contained**: Uses `bun:sqlite` directly (NOT the main opencode.db)
- **No ORM**: Raw SQL for simplicity and performance
- **Triggers**: FTS5 stays in sync automatically via SQLite triggers
- **WAL mode**: Write-ahead logging for concurrency

## Database Schema

```sql
-- Core pages table
pages (id, title, content, tags, parent_id, time_created, time_updated)

-- FTS5 virtual table
pages_fts (title, content, tags) USING fts5

-- Bidirectional links
links (source_id, target_id, time_created)
```

## CLI Usage

```bash
# Create a page
wiki create "My Page" "This is the content with a [[link]]"

# Search
wiki search "consciousness"

# Get a page
wiki get "My Page"

# List recent pages
wiki list 20

# Edit
wiki edit <page-id> "New content"

# Tag
wiki tag <page-id> ai knowledge-base

# Show backlinks
wiki backlinks <page-id>

# Stats
wiki stats
```

## Programmatic Usage

```typescript
import { Pages, Search, Links } from "@valxos/wiki"

// Create
const page = Pages.create({
  title: "AI Consciousness",
  content: "Notes on [[Murphy]] and [[Sacred Flame]]",
  tags: ["ai", "consciousness"],
})

// Search
const results = Search.search("consciousness")

// Get backlinks
const backlinks = Links.getBacklinks(page.id)
```

## MCP Tool Exposure

Import `WIKI_TOOLS` to register with your MCP server:

```typescript
import { WIKI_TOOLS } from "@valxos/wiki/mcp"

// Available tools:
// - wiki_search
// - wiki_get
// - wiki_create
// - wiki_edit
// - wiki_list
// - wiki_delete
// - wiki_backlinks
```

## Data Location

- Database: `~/.valxos/wiki/wiki.db`
- WAL files: `~/.valxos/wiki/wiki.db-wal`, `wiki.db-shm`

## Philosophy

Karpathy-inspired: Simple, local-first, fast, hackable. No cloud dependencies, no complex auth, just a SQLite database and FTS5 search.
