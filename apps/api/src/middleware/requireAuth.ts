import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyToken, COOKIE_NAME } from '../lib/session.js'
import { UnauthorizedError } from '../types.js'
import type { HonoVariables } from '../types.js'

export const requireAuth = createMiddleware<{ Variables: HonoVariables }>(
  async (c, next) => {
    const token = getCookie(c, COOKIE_NAME)
    if (!token) throw new UnauthorizedError('No session found')

    try {
      const payload = await verifyToken(token)
      c.set('userId',   payload.sub)
      c.set('userRole', payload.role)
    } catch {
      throw new UnauthorizedError('Session expired or invalid')
    }

    await next()
  },
)
