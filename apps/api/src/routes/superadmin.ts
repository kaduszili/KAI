import { Hono }             from 'hono'
import { zValidator }       from '@hono/zod-validator'
import { z }                from 'zod'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js'
import { adminService }     from '../services/AdminService.js'
import { InvitationService } from '../services/InvitationService.js'
import type { HonoVariables } from '../types.js'

const invitationSvc = new InvitationService()

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
    active:           z.boolean().optional(),
  })),
  async (c) => {
    const requesterId = c.get('userId')
    const targetId    = c.req.param('id')
    const body        = c.req.valid('json')
    await adminService.updateUser(requesterId, targetId, body)
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

// ─── POST /api/superadmin/invitations ─────────────────────────────────────────

router.post(
  '/invitations',
  zValidator('json', z.object({
    name:  z.string().min(1).max(255),
    email: z.string().email(),
    plan:  z.enum(['free', 'pro']),
  })),
  async (c) => {
    const createdById = c.get('userId')
    const body        = c.req.valid('json')
    const data        = await invitationSvc.create(createdById, body)
    return c.json({ data }, 201)
  },
)

export { router as superadminRoutes }
