import { getDb } from "./db"
import type { Page } from "./pages"

interface SearchRow {
  id: string
  title: string
  content: string
  tags: string
  parent_id: string | null
  time_created: number
  time_updated: number
  rank: number
}

export interface SearchResult {
  page: Page
  rank: number
  snippet: string
}

export function search(query: string, options?: { limit?: number }): SearchResult[] {
  const db = getDb()
  const limit = options?.limit || 20

  // Escape FTS5 query: quote each term to prevent operator interpretation
  const ftsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replace(/"/g, '""')}"`)
    .join(" ")

  const rows = db
    .query<SearchRow, [string, number]>(
      `SELECT pages.*, pages_fts.rank
       FROM pages_fts
       JOIN pages ON pages.rowid = pages_fts.rowid
       WHERE pages_fts MATCH ?
       ORDER BY pages_fts.rank
       LIMIT ?`,
    )
    .all(ftsQuery, limit)

  return rows.map((row) => ({
    page: {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags),
      parent_id: row.parent_id,
      time_created: row.time_created,
      time_updated: row.time_updated,
    },
    rank: row.rank,
    snippet: extractSnippet(row.content, query),
  }))
}

export function searchByTag(tag: string): Page[] {
  const db = getDb()
  return db
    .query<any, [string]>(`SELECT * FROM pages WHERE tags LIKE ? ORDER BY time_updated DESC`)
    .all(`%"${tag}"%`)
    .map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags),
    }))
}

function extractSnippet(content: string, query: string, contextChars = 100): string {
  const lower = content.toLowerCase()
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  for (const term of terms) {
    const idx = lower.indexOf(term)
    if (idx >= 0) {
      const start = Math.max(0, idx - contextChars)
      const end = Math.min(content.length, idx + term.length + contextChars)
      const prefix = start > 0 ? "..." : ""
      const suffix = end < content.length ? "..." : ""
      return prefix + content.slice(start, end) + suffix
    }
  }

  return content.slice(0, contextChars * 2) + (content.length > contextChars * 2 ? "..." : "")
}
