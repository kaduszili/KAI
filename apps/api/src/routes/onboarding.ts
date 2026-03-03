import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { OnboardingService } from '../services/OnboardingService.js'
import { AuthService }       from '../services/AuthService.js'
import type { HonoVariables } from '../types.js'

const router  = new Hono<{ Variables: HonoVariables }>()
const service = new OnboardingService()
const auth    = new AuthService()

// ─── POST /api/onboarding/complete ───────────────────────────────────────────

router.post(
  '/complete',
  requireAuth,
  zValidator('json', z.object({
    projectName:     z.string().min(1).max(255).trim(),
    websiteUrl:      z.string().url().optional().or(z.literal('')),
    websiteCategory: z.enum([
      'portfolio', 'ecommerce', 'business', 'blog', 'saas', 'agency', 'other',
    ]).optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const data   = c.req.valid('json')

    await service.complete(userId, {
      projectName:     data.projectName,
      websiteUrl:      data.websiteUrl === '' ? undefined : data.websiteUrl,
      websiteCategory: data.websiteCategory,
    })

    // Return the updated user (onboardingDone: true)
    const user = await auth.getById(userId)
    return c.json({ data: { user } })
  },
)

export { router as onboardingRoutes }
