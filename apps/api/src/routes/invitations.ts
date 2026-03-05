import { Hono }        from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { setCookie }  from 'hono/cookie'
import { signToken }  from '../lib/session.js'
import { COOKIE_NAME, COOKIE_OPTIONS } from '../lib/session.js'
import { InvitationService } from '../services/InvitationService.js'
import type { HonoVariables } from '../types.js'

const router  = new Hono<{ Variables: HonoVariables }>()
const service = new InvitationService()

// ─── GET /api/invitations/:token ──────────────────────────────────────────────
// Public — returns name/email/plan to pre-fill the "Complete your account" form.

router.get('/:token', async (c) => {
  const token = c.req.param('token')
  const data  = await service.getByToken(token)
  return c.json({ data })
})

// ─── POST /api/invitations/:token/accept ──────────────────────────────────────
// Public — creates the user account and sets the auth cookie.

router.post(
  '/:token/accept',
  zValidator('json', z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })),
  async (c) => {
    const token    = c.req.param('token')
    const { password } = c.req.valid('json')

    const user = await service.accept(token, password)

    const jwt = await signToken(user.id, user.role)
    setCookie(c, COOKIE_NAME, jwt, COOKIE_OPTIONS)

    return c.json({ data: { user, token: jwt } }, 201)
  },
)

export { router as invitationRoutes }
