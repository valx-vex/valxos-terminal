import * as Pages from "./pages"
import * as Search from "./search"
import * as Links from "./links"
import { closeDb, DB_PATH } from "./db"

const COMMANDS: Record<string, (args: string[]) => void> = {
  create(args) {
    const title = args[0]
    if (!title) {
      console.error("Usage: wiki create <title> [content]")
      process.exit(1)
    }
    const content = args.slice(1).join(" ")
    const page = Pages.create({ title, content })
    if (content) Links.syncLinks(page.id, content)
    console.log(`Created: ${page.title} (${page.id})`)
  },

  get(args) {
    const id = args[0]
    if (!id) {
      console.error("Usage: wiki get <id|title>")
      process.exit(1)
    }
    const page = Pages.get(id) || Pages.getByTitle(id)
    if (!page) {
      console.error(`Page not found: ${id}`)
      process.exit(1)
    }
    console.log(`# ${page.title}\n`)
    console.log(page.content)
    console.log(`\nTags: ${page.tags.join(", ") || "none"}`)
    console.log(`ID: ${page.id}`)
    console.log(`Updated: ${new Date(page.time_updated).toISOString()}`)
  },

  search(args) {
    const query = args.join(" ")
    if (!query) {
      console.error("Usage: wiki search <query>")
      process.exit(1)
    }
    const results = Search.search(query)
    if (results.length === 0) {
      console.log("No results found.")
      return
    }
    for (const r of results) {
      console.log(`[${r.page.id.slice(0, 8)}] ${r.page.title}`)
      console.log(`  ${r.snippet}`)
      console.log()
    }
    console.log(`${results.length} result(s)`)
  },

  list(args) {
    const limit = parseInt(args[0]) || 20
    const pages = Pages.list({ limit })
    if (pages.length === 0) {
      console.log("Wiki is empty. Use 'wiki create <title>' to add a page.")
      return
    }
    for (const p of pages) {
      const tags = p.tags.length > 0 ? ` [${p.tags.join(", ")}]` : ""
      console.log(`${p.id.slice(0, 8)}  ${p.title}${tags}`)
    }
    console.log(`\n${Pages.count()} page(s) total`)
  },

  edit(args) {
    const id = args[0]
    const content = args.slice(1).join(" ")
    if (!id || !content) {
      console.error("Usage: wiki edit <id> <new content>")
      process.exit(1)
    }
    const page = Pages.update(id, { content })
    if (!page) {
      console.error(`Page not found: ${id}`)
      process.exit(1)
    }
    Links.syncLinks(page.id, content)
    console.log(`Updated: ${page.title}`)
  },

  tag(args) {
    const id = args[0]
    const tags = args.slice(1)
    if (!id || tags.length === 0) {
      console.error("Usage: wiki tag <id> <tag1> [tag2] ...")
      process.exit(1)
    }
    const page = Pages.update(id, { tags })
    if (!page) {
      console.error(`Page not found: ${id}`)
      process.exit(1)
    }
    console.log(`Tagged: ${page.title} [${tags.join(", ")}]`)
  },

  delete(args) {
    const id = args[0]
    if (!id) {
      console.error("Usage: wiki delete <id>")
      process.exit(1)
    }
    const success = Pages.remove(id)
    console.log(success ? "Deleted." : `Page not found: ${id}`)
  },

  backlinks(args) {
    const id = args[0]
    if (!id) {
      console.error("Usage: wiki backlinks <id>")
      process.exit(1)
    }
    const links = Links.getBacklinks(id)
    if (links.length === 0) {
      console.log("No backlinks found.")
      return
    }
    for (const link of links) {
      const page = Pages.get(link.source_id)
      if (page) console.log(`${page.id.slice(0, 8)}  ${page.title}`)
    }
  },

  stats() {
    const total = Pages.count()
    console.log(`Wiki: ${total} page(s)`)
    console.log(`Database: ${DB_PATH}`)
  },

  help() {
    console.log(`VALXOS Wiki - Local-first knowledge base

Commands:
  create <title> [content]   Create a new page
  get <id|title>             View a page
  search <query>             Full-text search (FTS5)
  list [limit]               List recent pages
  edit <id> <content>        Update page content
  tag <id> <tag1> [tag2...]  Set tags on a page
  delete <id>                Delete a page
  backlinks <id>             Show pages linking to this page
  stats                      Show wiki statistics
  help                       Show this help`)
  },
}

export function run(args: string[]) {
  const cmd = args[0] || "help"
  const handler = COMMANDS[cmd]
  if (!handler) {
    console.error(`Unknown command: ${cmd}. Use 'wiki help' for available commands.`)
    process.exit(1)
  }
  try {
    handler(args.slice(1))
  } finally {
    closeDb()
  }
}
