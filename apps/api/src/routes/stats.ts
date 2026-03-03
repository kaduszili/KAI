import { Hono } from 'hono'
import { requireAuth } from '../middleware/requireAuth.js'
import { statsService } from '../services/StatsService.js'
import type { HonoVariables } from '../types.js'

const router = new Hono<{ Variables: HonoVariables }>()

// ─── GET /api/stats/dashboard ─────────────────────────────────────────────────

router.get('/dashboard', requireAuth, async (c) => {
  const userId = c.get('userId')
  const stats  = await statsService.getDashboardStats(userId)
  return c.json({ data: stats })
})

export { router as statsRoutes }
