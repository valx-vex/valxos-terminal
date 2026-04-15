import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const WIKI_DIR = join(homedir(), ".valxos", "wiki")
const DB_PATH = join(WIKI_DIR, "wiki.db")

let _db: Database | null = null

export function getDb(): Database {
  if (_db) return _db

  if (!existsSync(WIKI_DIR)) {
    mkdirSync(WIKI_DIR, { recursive: true })
  }

  _db = new Database(DB_PATH)
  _db.run("PRAGMA journal_mode = WAL")
  _db.run("PRAGMA synchronous = NORMAL")
  _db.run("PRAGMA foreign_keys = ON")

  // Core tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      parent_id TEXT,
      time_created INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
      time_updated INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
      FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL
    )
  `)

  // FTS5 virtual table for full-text search
  _db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
      title,
      content,
      tags,
      content=pages,
      content_rowid=rowid
    )
  `)

  // Triggers to keep FTS in sync
  _db.run(`
    CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
      INSERT INTO pages_fts(rowid, title, content, tags)
      VALUES (new.rowid, new.title, new.content, new.tags);
    END
  `)

  _db.run(`
    CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
      INSERT INTO pages_fts(pages_fts, rowid, title, content, tags)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags);
    END
  `)

  _db.run(`
    CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
      INSERT INTO pages_fts(pages_fts, rowid, title, content, tags)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags);
      INSERT INTO pages_fts(rowid, title, content, tags)
      VALUES (new.rowid, new.title, new.content, new.tags);
    END
  `)

  // Links table (bidirectional wiki links)
  _db.run(`
    CREATE TABLE IF NOT EXISTS links (
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      time_created INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
      PRIMARY KEY (source_id, target_id),
      FOREIGN KEY (source_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES pages(id) ON DELETE CASCADE
    )
  `)

  _db.run(`CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id)`)
  _db.run(`CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id)`)
  _db.run(`CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(time_updated DESC)`)

  return _db
}

export function closeDb() {
  if (_db) {
    _db.close()
    _db = null
  }
}

export { DB_PATH, WIKI_DIR }
