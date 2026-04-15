import * as Pages from "./pages"
import * as Search from "./search"
import * as Links from "./links"

/**
 * MCP Tool definitions for wiki
 * These can be registered with any MCP server implementation
 */
export const WIKI_TOOLS = {
  wiki_search: {
    description: "Search the local wiki using full-text search (FTS5)",
    parameters: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    handler: async (params: { query: string; limit?: number }) => {
      const results = Search.search(params.query, { limit: params.limit || 10 })
      return results.map((r) => ({
        title: r.page.title,
        id: r.page.id,
        snippet: r.snippet,
        tags: r.page.tags,
        rank: r.rank,
      }))
    },
  },

  wiki_get: {
    description: "Get a wiki page by ID or title",
    parameters: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page ID or title" },
      },
      required: ["id"],
    },
    handler: async (params: { id: string }) => {
      const page = Pages.get(params.id) || Pages.getByTitle(params.id)
      if (!page) return { error: "Page not found" }
      const backlinks = Links.getBacklinks(page.id)
      return {
        ...page,
        backlink_count: backlinks.length,
      }
    },
  },

  wiki_create: {
    description: "Create a new wiki page",
    parameters: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Page title" },
        content: { type: "string", description: "Page content (markdown)" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the page",
        },
      },
      required: ["title"],
    },
    handler: async (params: { title: string; content?: string; tags?: string[] }) => {
      const page = Pages.create(params)
      if (params.content) Links.syncLinks(page.id, params.content)
      return { id: page.id, title: page.title }
    },
  },

  wiki_edit: {
    description: "Update a wiki page",
    parameters: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page ID" },
        title: { type: "string", description: "New title" },
        content: { type: "string", description: "New content" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags",
        },
      },
      required: ["id"],
    },
    handler: async (params: { id: string; title?: string; content?: string; tags?: string[] }) => {
      const page = Pages.update(params.id, params)
      if (!page) return { error: "Page not found" }
      if (params.content) Links.syncLinks(page.id, params.content)
      return { id: page.id, title: page.title }
    },
  },

  wiki_list: {
    description: "List recent wiki pages",
    parameters: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max pages (default 20)" },
      },
    },
    handler: async (params?: { limit?: number }) => {
      const pages = Pages.recent(params?.limit || 20)
      return pages.map((p) => ({
        id: p.id,
        title: p.title,
        tags: p.tags,
        updated: new Date(p.time_updated).toISOString(),
      }))
    },
  },

  wiki_delete: {
    description: "Delete a wiki page",
    parameters: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page ID to delete" },
      },
      required: ["id"],
    },
    handler: async (params: { id: string }) => {
      const success = Pages.remove(params.id)
      return { success }
    },
  },

  wiki_backlinks: {
    description: "Get pages that link to a given page",
    parameters: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page ID" },
      },
      required: ["id"],
    },
    handler: async (params: { id: string }) => {
      const links = Links.getBacklinks(params.id)
      return links
        .map((l) => {
          const page = Pages.get(l.source_id)
          return page ? { id: page.id, title: page.title } : null
        })
        .filter(Boolean)
    },
  },
}

export type WikiToolName = keyof typeof WIKI_TOOLS
