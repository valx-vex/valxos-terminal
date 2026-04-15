import { getDb } from "./db"
import { randomUUID } from "crypto"

export interface Page {
  id: string
  title: string
  content: string
  tags: string[]
  parent_id: string | null
  time_created: number
  time_updated: number
}

interface PageRow {
  id: string
  title: string
  content: string
  tags: string
  parent_id: string | null
  time_created: number
  time_updated: number
}

function rowToPage(row: PageRow): Page {
  return {
    ...row,
    tags: JSON.parse(row.tags),
  }
}

export function create(input: {
  title: string
  content?: string
  tags?: string[]
  parent_id?: string
}): Page {
  const db = getDb()
  const id = randomUUID()
  const now = Date.now()

  db.run(
    `INSERT INTO pages (id, title, content, tags, parent_id, time_created, time_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.content || "", JSON.stringify(input.tags || []), input.parent_id || null, now, now],
  )

  return {
    id,
    title: input.title,
    content: input.content || "",
    tags: input.tags || [],
    parent_id: input.parent_id || null,
    time_created: now,
    time_updated: now,
  }
}

export function get(id: string): Page | null {
  const db = getDb()
  const row = db.query<PageRow, [string]>("SELECT * FROM pages WHERE id = ?").get(id)
  return row ? rowToPage(row) : null
}

export function getByTitle(title: string): Page | null {
  const db = getDb()
  const row = db.query<PageRow, [string]>("SELECT * FROM pages WHERE title = ? COLLATE NOCASE").get(title)
  return row ? rowToPage(row) : null
}

export function update(
  id: string,
  input: {
    title?: string
    content?: string
    tags?: string[]
    parent_id?: string | null
  },
): Page | null {
  const existing = get(id)
  if (!existing) return null

  const db = getDb()
  const title = input.title ?? existing.title
  const content = input.content ?? existing.content
  const tags = input.tags ?? existing.tags
  const parent_id = input.parent_id !== undefined ? input.parent_id : existing.parent_id

  db.run(
    `UPDATE pages SET title = ?, content = ?, tags = ?, parent_id = ?, time_updated = ? WHERE id = ?`,
    [title, content, JSON.stringify(tags), parent_id, Date.now(), id],
  )

  return get(id)
}

export function remove(id: string): boolean {
  const db = getDb()
  const result = db.run("DELETE FROM pages WHERE id = ?", [id])
  return result.changes > 0
}

export function list(options?: { limit?: number; offset?: number; parent_id?: string }): Page[] {
  const db = getDb()
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  if (options?.parent_id) {
    return db
      .query<PageRow, [string, number, number]>(
        "SELECT * FROM pages WHERE parent_id = ? ORDER BY time_updated DESC LIMIT ? OFFSET ?",
      )
      .all(options.parent_id, limit, offset)
      .map(rowToPage)
  }

  return db
    .query<PageRow, [number, number]>("SELECT * FROM pages ORDER BY time_updated DESC LIMIT ? OFFSET ?")
    .all(limit, offset)
    .map(rowToPage)
}

export function recent(limit = 10): Page[] {
  const db = getDb()
  return db
    .query<PageRow, [number]>("SELECT * FROM pages ORDER BY time_updated DESC LIMIT ?")
    .all(limit)
    .map(rowToPage)
}

export function count(): number {
  const db = getDb()
  const row = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM pages").get()
  return row?.count || 0
}
