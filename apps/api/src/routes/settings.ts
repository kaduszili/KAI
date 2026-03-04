import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { SettingsService } from '../services/SettingsService.js'
import type { HonoVariables } from '../types.js'

const router  = new Hono<{ Variables: HonoVariables }>()
const service = new SettingsService()

// ─── GET /api/settings ────────────────────────────────────────────────────────

router.get('/', requireAuth, async (c) => {
  const userId   = c.get('userId')
  const settings = await service.getByUser(userId)
  return c.json({ data: settings })
})

// ─── PATCH /api/settings ──────────────────────────────────────────────────────

router.patch(
  '/',
  requireAuth,
  zValidator('json', z.object({
    openaiApiKey:    z.string().optional().nullable(),
    openaiModel:     z.enum(['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']).optional(),
    systemMessage:   z.string().max(2000).optional(),
    blockedKeywords: z.array(z.string().trim().min(1)).optional(),
    themeJson: z.object({
      global: z.object({
        fontFamily:  z.enum(['system', 'inter', 'roboto', 'open-sans']),
        colorPreset: z.string().nullable(),
      }).passthrough().optional(),
      bubble: z.object({
        position:        z.enum(['bottom-right', 'bottom-left']),
        backgroundColor: z.string(),
        iconUrl:         z.string().nullable(),
      }).passthrough().optional(),
      chatWindow: z.object({
        template:         z.enum(['default', 'minimal', 'rounded']),
        headerColor:      z.string(),
        userMessageColor: z.string(),
        aiMessageColor:   z.string(),
        borderRadius:     z.enum(['sharp', 'rounded', 'pill']),
      }).passthrough().optional(),
      advanced: z.object({
        customCss: z.string().max(5000),
      }).passthrough().optional(),
    }).optional(),
    errorMessages: z.object({
      noKnowledge: z.string().max(500).optional(),
      blocked:     z.string().max(500).optional(),
      rateLimited: z.string().max(500).optional(),
      capExceeded: z.string().max(500).optional(),
      apiError:    z.string().max(500).optional(),
      default:     z.string().max(500).optional(),
    }).optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const data   = c.req.valid('json')
    const settings = await service.update(userId, data)
    return c.json({ data: settings })
  },
)

export { router as settingsRoutes }
