import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { ProjectService } from '../services/ProjectService.js'
import type { HonoVariables } from '../types.js'

const router  = new Hono<{ Variables: HonoVariables }>()
const service = new ProjectService()

// ─── GET /api/projects/mine ───────────────────────────────────────────────────

router.get('/mine', requireAuth, async (c) => {
  const userId  = c.get('userId')
  const project = await service.getByUser(userId)
  return c.json({ data: project })
})

// ─── PATCH /api/projects/mine ─────────────────────────────────────────────────

const websiteCategorySchema = z.enum([
  'portfolio', 'ecommerce', 'business', 'blog', 'saas', 'agency', 'other',
])

router.patch(
  '/mine',
  requireAuth,
  zValidator('json', z.object({
    name:            z.string().min(1).max(255).trim().optional(),
    websiteUrl:      z.string().url().optional().or(z.literal('')),
    websiteCategory: websiteCategorySchema.optional(),
  })),
  async (c) => {
    const userId  = c.get('userId')
    const data    = c.req.valid('json')
    const project = await service.getByUser(userId)
    const updated = await service.update(project.id, userId, {
      ...data,
      websiteUrl: data.websiteUrl === '' ? undefined : data.websiteUrl,
    })
    return c.json({ data: updated })
  },
)

export { router as projectRoutes }
