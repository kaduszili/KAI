import { and, eq, gt } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { rateLimits } from '../schema/index.js'
import { RateLimitError } from '../types.js'

export class RateLimiterService {
  async check(ipAddress: string, projectId: string, limitPerMinute: number): Promise<void> {
    const windowCutoff = new Date(Date.now() - 60_000)

    const existing = await db.query.rateLimits.findFirst({
      where: and(
        eq(rateLimits.ipAddress, ipAddress),
        eq(rateLimits.projectId, projectId),
        gt(rateLimits.windowStart, windowCutoff),
      ),
    })

    if (existing) {
      if (existing.requestCount >= limitPerMinute) throw new RateLimitError()

      await db
        .update(rateLimits)
        .set({ requestCount: existing.requestCount + 1 })
        .where(eq(rateLimits.id, existing.id))
    } else {
      await db.insert(rateLimits).values({
        ipAddress,
        projectId,
        requestCount: 1,
        windowStart:  new Date(),
      })
    }
  }
}
