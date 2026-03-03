import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { chatLogs, projects } from '../schema/index.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullLogRow {
  id:        string
  question:  string
  answer:    string | null
  tokens:    number
  model:     string | null
  status:    string
  ipAddress: string | null
  createdAt: string
}

export interface MessagesPage {
  logs:  FullLogRow[]
  total: number
  page:  number
  limit: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25

export class MessagesService {
  async getPage(
    userId: string,
    opts: { page?: number; status?: string | null },
  ): Promise<MessagesPage> {
    // ── 1. Resolve project ─────────────────────────────────────────────────
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) return { logs: [], total: 0, page: 0, limit: PAGE_SIZE }

    const projectId = project.id
    const page      = Math.max(0, opts.page ?? 0)
    const offset    = page * PAGE_SIZE

    // ── 2. Build WHERE conditions ──────────────────────────────────────────
    const statusFilter = opts.status && opts.status !== 'all' ? opts.status : null

    const where = statusFilter
      ? and(eq(chatLogs.projectId, projectId), eq(chatLogs.status, statusFilter as any))
      : eq(chatLogs.projectId, projectId)

    // ── 3. Total count ─────────────────────────────────────────────────────
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(chatLogs)
      .where(where)

    // ── 4. Fetch page ──────────────────────────────────────────────────────
    const rows = await db
      .select({
        id:        chatLogs.id,
        question:  chatLogs.question,
        answer:    chatLogs.answer,
        tokens:    sql<number>`coalesce(${chatLogs.tokensPrompt} + ${chatLogs.tokensCompletion}, 0)`,
        model:     chatLogs.model,
        status:    chatLogs.status,
        ipAddress: chatLogs.ipAddress,
        createdAt: chatLogs.createdAt,
      })
      .from(chatLogs)
      .where(where)
      .orderBy(desc(chatLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset)

    const logs: FullLogRow[] = rows.map((r) => ({
      ...r,
      createdAt: (r.createdAt as Date).toISOString(),
    }))

    return { logs, total, page, limit: PAGE_SIZE }
  }
}

export const messagesService = new MessagesService()
