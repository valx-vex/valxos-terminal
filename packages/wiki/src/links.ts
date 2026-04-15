import { getDb } from "./db"

export interface Link {
  source_id: string
  target_id: string
  time_created: number
}

export function addLink(sourceId: string, targetId: string): void {
  const db = getDb()
  db.run(
    `INSERT OR IGNORE INTO links (source_id, target_id, time_created) VALUES (?, ?, ?)`,
    [sourceId, targetId, Date.now()],
  )
}

export function removeLink(sourceId: string, targetId: string): void {
  const db = getDb()
  db.run("DELETE FROM links WHERE source_id = ? AND target_id = ?", [sourceId, targetId])
}

export function getOutgoingLinks(pageId: string): Link[] {
  const db = getDb()
  return db.query<Link, [string]>("SELECT * FROM links WHERE source_id = ?").all(pageId)
}

export function getBacklinks(pageId: string): Link[] {
  const db = getDb()
  return db.query<Link, [string]>("SELECT * FROM links WHERE target_id = ?").all(pageId)
}

/**
 * Extract [[wiki links]] from content and sync to links table
 */
export function syncLinks(pageId: string, content: string): void {
  const db = getDb()
  const linkPattern = /\[\[([^\]]+)\]\]/g
  const matches = new Set<string>()

  let match
  while ((match = linkPattern.exec(content)) !== null) {
    matches.add(match[1].trim())
  }

  // Remove old outgoing links
  db.run("DELETE FROM links WHERE source_id = ?", [pageId])

  // Add new links (resolve title to id)
  for (const title of matches) {
    const target = db
      .query<{ id: string }, [string]>("SELECT id FROM pages WHERE title = ? COLLATE NOCASE")
      .get(title)
    if (target) {
      addLink(pageId, target.id)
    }
  }
}
