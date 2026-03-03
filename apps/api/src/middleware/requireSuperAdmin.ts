import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyToken, COOKIE_NAME } from '../lib/session.js'
import { UnauthorizedError, ForbiddenError } from '../types.js'
import type { HonoVariables } from '../types.js'

export const requireSuperAdmin = createMiddleware<{ Variables: HonoVariables }>(
  async (c, next) => {
    const token = getCookie(c, COOKIE_NAME)
    if (!token) throw new UnauthorizedError('No session found')

    try {
      const payload = await verifyToken(token)
      if (payload.role !== 'super_admin') throw new ForbiddenError()
      c.set('userId',   payload.sub)
      c.set('userRole', payload.role)
    } catch (err) {
      if (err instanceof ForbiddenError) throw err
      throw new UnauthorizedError('Session expired or invalid')
    }

    await next()
  },
)
