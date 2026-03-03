import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { chatLogs } from '../schema/index.js'
import { CapExceededError } from '../types.js'

export class TokenCapService {
  async check(projectId: string, monthlyTokenCap: number): Promise<void> {
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    const [result] = await db
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

    if ((result?.total ?? 0) >= monthlyTokenCap) throw new CapExceededError()
  }
}
