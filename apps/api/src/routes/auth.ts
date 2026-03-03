import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { AuthService } from '../services/AuthService.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '../lib/session.js'
import type { HonoVariables } from '../types.js'

const auth    = new Hono<{ Variables: HonoVariables }>()
const service = new AuthService()

// ─── Register ────────────────────────────────────────────────────────────────

auth.post(
  '/register',
  zValidator('json', z.object({
    name:     z.string().min(1).max(255).trim(),
    email:    z.string().email(),
    password: z.string().min(8),
  })),
  async (c) => {
    const { name, email, password } = c.req.valid('json')
    const user  = await service.register(name, email, password)
    const token = await signToken(user.id, user.role)

    setCookie(c, COOKIE_NAME, token, COOKIE_OPTIONS)

    return c.json({ data: { user, token } }, 201)
  },
)

// ─── Login ───────────────────────────────────────────────────────────────────

auth.post(
  '/login',
  zValidator('json', z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json')
    const user  = await service.login(email, password)
    const token = await signToken(user.id, user.role)

    setCookie(c, COOKIE_NAME, token, COOKIE_OPTIONS)

    return c.json({ data: { user, token } })
  },
)

// ─── Logout ──────────────────────────────────────────────────────────────────

auth.post('/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ data: { ok: true } })
})

// ─── Me ──────────────────────────────────────────────────────────────────────

auth.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const user   = await service.getById(userId)
  return c.json({ data: user })
})

// ─── Update Profile ──────────────────────────────────────────────────────────

auth.patch(
  '/profile',
  requireAuth,
  zValidator('json', z.object({
    name:            z.string().min(1).max(255).trim().optional(),
    email:           z.string().email().optional(),
    currentPassword: z.string().optional(),
    newPassword:     z.string().min(8).optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const data   = c.req.valid('json')
    const user   = await service.updateProfile(userId, data)
    return c.json({ data: user })
  },
)

export { auth as authRoutes }
