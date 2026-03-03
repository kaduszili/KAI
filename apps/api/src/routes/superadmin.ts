import { Hono }             from 'hono'
import { zValidator }       from '@hono/zod-validator'
import { z }                from 'zod'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js'
import { adminService }     from '../services/AdminService.js'
import type { HonoVariables } from '../types.js'

const router = new Hono<{ Variables: HonoVariables }>()

// All routes in this file require super_admin role
router.use('*', requireSuperAdmin)

// ─── GET /api/superadmin/overview ─────────────────────────────────────────────

router.get('/overview', async (c) => {
  const data = await adminService.getOverviewStats()
  return c.json({ data })
})

// ─── GET /api/superadmin/users ────────────────────────────────────────────────

router.get('/users', async (c) => {
  const data = await adminService.getUsers()
  return c.json({ data })
})

// ─── PATCH /api/superadmin/users/:id ──────────────────────────────────────────

router.patch(
  '/users/:id',
  zValidator('json', z.object({
    plan:             z.enum(['free', 'pro']).optional(),
    platformTokenCap: z.number().int().min(0).nullable().optional(),
  })),
  async (c) => {
    const targetId = c.req.param('id')
    const body     = c.req.valid('json')
    await adminService.updateUser(targetId, body)
    return c.json({ data: { ok: true } })
  },
)

// ─── GET /api/superadmin/settings ─────────────────────────────────────────────

router.get('/settings', async (c) => {
  const data = await adminService.getPlatformSettings()
  return c.json({ data })
})

// ─── PATCH /api/superadmin/settings ───────────────────────────────────────────

router.patch(
  '/settings',
  zValidator('json', z.object({
    platformApiKey: z.string().min(1).nullable(),
  })),
  async (c) => {
    const { platformApiKey } = c.req.valid('json')
    await adminService.setPlatformApiKey(platformApiKey)
    return c.json({ data: { ok: true } })
  },
)

export { router as superadminRoutes }
