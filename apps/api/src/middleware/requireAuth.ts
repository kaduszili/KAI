import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { verifyToken, COOKIE_NAME } from '../lib/session.js'
import { UnauthorizedError } from '../types.js'
import { db } from '../lib/db.js'
import { users } from '../schema/index.js'
import type { HonoVariables } from '../types.js'

export const requireAuth = createMiddleware<{ Variables: HonoVariables }>(
  async (c, next) => {
    const token = getCookie(c, COOKIE_NAME)
    if (!token) throw new UnauthorizedError('No session found')

    let userId: string
    let userRole: string

    try {
      const payload = await verifyToken(token)
      userId   = payload.sub
      userRole = payload.role
    } catch {
      throw new UnauthorizedError('Session expired or invalid')
    }

    // Reject deactivated accounts immediately
    const user = await db.query.users.findFirst({
      where:   eq(users.id, userId),
      columns: { active: true },
    })
    if (!user || !user.active) {
      throw new UnauthorizedError('Account is deactivated')
    }

    c.set('userId',   userId)
    c.set('userRole', userRole)

    await next()
  },
)
