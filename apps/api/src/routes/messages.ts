import { Hono } from 'hono'
import { requireAuth } from '../middleware/requireAuth.js'
import { messagesService } from '../services/MessagesService.js'
import type { HonoVariables } from '../types.js'

const router = new Hono<{ Variables: HonoVariables }>()

// GET /api/messages?page=0&status=blocked
router.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const page   = parseInt(c.req.query('page') ?? '0', 10)
  const status = c.req.query('status') ?? 'all'

  const data = await messagesService.getPage(userId, { page, status })
  return c.json({ data })
})

export { router as messagesRoutes }
