import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { KnowledgeService } from '../services/KnowledgeService.js'
import type { HonoVariables } from '../types.js'

const router  = new Hono<{ Variables: HonoVariables }>()
const service = new KnowledgeService()

// ─── GET /api/knowledge ───────────────────────────────────────────────────────

router.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const files  = await service.list(userId)
  return c.json({ data: files })
})

// ─── POST /api/knowledge ──────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  zValidator('json', z.object({
    filename: z.string().min(1).max(255).trim(),
    content:  z.string().default(''),
  })),
  async (c) => {
    const userId = c.get('userId')
    const { filename, content } = c.req.valid('json')
    const file = await service.create(userId, filename, content)
    return c.json({ data: file }, 201)
  },
)

// ─── PATCH /api/knowledge/:id ─────────────────────────────────────────────────

router.patch(
  '/:id',
  requireAuth,
  zValidator('json', z.object({
    filename: z.string().min(1).max(255).trim().optional(),
    content:  z.string().optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const fileId = c.req.param('id')
    const data   = c.req.valid('json')
    const file   = await service.update(fileId, userId, data)
    return c.json({ data: file })
  },
)

// ─── DELETE /api/knowledge/:id ────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const fileId = c.req.param('id')
  await service.delete(fileId, userId)
  return c.json({ data: { ok: true } })
})

export { router as knowledgeRoutes }
