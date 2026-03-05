import { cors } from 'hono/cors'

/**
 * Admin CORS — only the dashboard origin may send credentialed requests.
 * Applied to all /api/* routes except public ones.
 *
 * origin is a function so ADMIN_ORIGIN is read per-request rather than once
 * at module-load time — guards against stale cold-start values and
 * accidental whitespace in the env var.
 */
export const adminCors = cors({
  origin: (origin) => {
    const allowed = (process.env.ADMIN_ORIGIN ?? 'http://localhost:5173').trim()
    return origin === allowed ? origin : null
  },
  allowMethods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders:     ['Content-Type', 'Authorization'],
  credentials:      true,
  exposeHeaders:    ['Set-Cookie'],
})

/**
 * Public CORS — widget endpoints must work from any origin.
 * No credentials needed (widget does not send cookies).
 */
export const publicCors = cors({
  origin:       '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials:  false,
})
