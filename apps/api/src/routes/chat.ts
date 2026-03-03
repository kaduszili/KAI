import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ChatService } from '../services/ChatService.js'

const router  = new Hono()
const service = new ChatService()

// ─── POST /api/chat ───────────────────────────────────────────────────────────
// Public endpoint — no auth cookie required. Uses publicCors from app.ts.

router.post(
  '/',
  zValidator('json', z.object({
    projectId: z.string().uuid(),
    message:   z.string().min(1).max(2000).trim(),
  })),
  async (c) => {
    const { projectId, message } = c.req.valid('json')

    // Best-effort IP resolution
    const ipAddress =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const { answer } = await service.chat({ projectId, message, ipAddress })

    return c.json({ data: { answer } })
  },
)

export { router as chatRoutes }
