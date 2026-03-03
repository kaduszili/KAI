import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { chatLogs, projectSettings, projects } from '../schema/index.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentLog {
  id:         string
  question:   string
  status:     string
  tokens:     number
  createdAt:  string
}

export interface DailyCount {
  date:  string   // 'YYYY-MM-DD'
  count: number
}

export interface DashboardStats {
  totalMessages:    number
  successCount:     number
  blockedCount:     number
  rateLimitedCount: number
  capExceededCount: number
  errorCount:       number
  successRate:      number        // 0–100, 1 decimal place
  monthlyTokens:    number
  monthlyTokenCap:  number
  dailyCounts:      DailyCount[]  // exactly 7 entries, oldest → newest, 0 for missing days
  recentLogs:       RecentLog[]   // last 10
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a 'YYYY-MM-DD' string in UTC for a given Date. */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Builds the array of 7 consecutive date strings ending today (UTC). */
function last7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    days.push(toDateStr(d))
  }
  return days
}

const ZERO_STATS: DashboardStats = {
  totalMessages:    0,
  successCount:     0,
  blockedCount:     0,
  rateLimitedCount: 0,
  capExceededCount: 0,
  errorCount:       0,
  successRate:      0,
  monthlyTokens:    0,
  monthlyTokenCap:  500_000,
  dailyCounts:      last7Days().map((date) => ({ date, count: 0 })),
  recentLogs:       [],
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class StatsService {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // ── 1. Resolve project ──────────────────────────────────────────────────
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) return ZERO_STATS

    const projectId = project.id

    // ── 2. Monthly token cap (from settings) ───────────────────────────────
    const settings = await db.query.projectSettings.findFirst({
      where: eq(projectSettings.projectId, projectId),
    })
    const monthlyTokenCap = settings?.monthlyTokenCap ?? 500_000

    // ── 3. Status breakdown (one query) ────────────────────────────────────
    const statusRows = await db
      .select({
        status: chatLogs.status,
        count:  sql<number>`cast(count(*) as int)`,
      })
      .from(chatLogs)
      .where(eq(chatLogs.projectId, projectId))
      .groupBy(chatLogs.status)

    const countFor = (s: string) =>
      statusRows.find((r) => r.status === s)?.count ?? 0

    const successCount     = countFor('success')
    const blockedCount     = countFor('blocked')
    const rateLimitedCount = countFor('rate_limited')
    const capExceededCount = countFor('cap_exceeded')
    const errorCount       = countFor('error')
    const totalMessages    = successCount + blockedCount + rateLimitedCount + capExceededCount + errorCount

    const successRate =
      totalMessages > 0
        ? Math.round((successCount / totalMessages) * 1000) / 10
        : 0

    // ── 4. Monthly tokens ───────────────────────────────────────────────────
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    const [monthlyResult] = await db
      .select({
        total: sql<number>`coalesce(sum(${chatLogs.tokensPrompt} + ${chatLogs.tokensCompletion}), 0)`,
      })
      .from(chatLogs)
      .where(
        and(
          eq(chatLogs.projectId, projectId),
          gte(chatLogs.createdAt, startOfMonth),
        ),
      )

    const monthlyTokens = monthlyResult?.total ?? 0

    // ── 5. Daily counts — last 7 days ──────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const rawDaily = await db
      .select({
        date:  sql<string>`to_char(${chatLogs.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(chatLogs)
      .where(
        and(
          eq(chatLogs.projectId, projectId),
          gte(chatLogs.createdAt, sevenDaysAgo),
        ),
      )
      .groupBy(sql`to_char(${chatLogs.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${chatLogs.createdAt}, 'YYYY-MM-DD')`)

    const dailyMap = new Map(rawDaily.map((r) => [r.date, r.count]))
    const dailyCounts: DailyCount[] = last7Days().map((date) => ({
      date,
      count: dailyMap.get(date) ?? 0,
    }))

    // ── 6. Recent logs (last 10) ────────────────────────────────────────────
    const rawLogs = await db
      .select({
        id:        chatLogs.id,
        question:  chatLogs.question,
        status:    chatLogs.status,
        tokens:    sql<number>`coalesce(${chatLogs.tokensPrompt} + ${chatLogs.tokensCompletion}, 0)`,
        createdAt: chatLogs.createdAt,
      })
      .from(chatLogs)
      .where(eq(chatLogs.projectId, projectId))
      .orderBy(desc(chatLogs.createdAt))
      .limit(10)

    const recentLogs: RecentLog[] = rawLogs.map((l) => ({
      id:        l.id,
      question:  l.question,
      status:    l.status,
      tokens:    l.tokens,
      createdAt: l.createdAt.toISOString(),
    }))

    return {
      totalMessages,
      successCount,
      blockedCount,
      rateLimitedCount,
      capExceededCount,
      errorCount,
      successRate,
      monthlyTokens,
      monthlyTokenCap,
      dailyCounts,
      recentLogs,
    }
  }
}

export const statsService = new StatsService()
