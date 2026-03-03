import { cors } from 'hono/cors'

/**
 * Admin CORS — only the dashboard origin may send credentialed requests.
 * Applied to all /api/* routes except public ones.
 */
export const adminCors = cors({
  origin:           process.env.ADMIN_ORIGIN ?? 'http://localhost:5173',
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
