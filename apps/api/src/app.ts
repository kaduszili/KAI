import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { adminCors, publicCors } from './middleware/cors.js'
import { authRoutes }       from './routes/auth.js'
import { projectRoutes }    from './routes/projects.js'
import { onboardingRoutes } from './routes/onboarding.js'
import { knowledgeRoutes }    from './routes/knowledge.js'
import { settingsRoutes }     from './routes/settings.js'
import { chatRoutes }         from './routes/chat.js'
import { widgetConfigRoutes } from './routes/widgetConfig.js'
import { statsRoutes }        from './routes/stats.js'
import { AppError } from './types.js'
import { logger } from './lib/logger.js'
import type { HonoVariables } from './types.js'

const app = new Hono<{ Variables: HonoVariables }>()

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use('*', honoLogger())

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Public endpoints — open to any origin (widget, chat)
// Note: use /* suffix so the middleware applies to all sub-paths (e.g. /api/widget-config/:id)
app.use('/api/chat/*',          publicCors)
app.use('/api/widget-config/*', publicCors)

// All other API routes — restricted to admin dashboard origin
app.use('/api/*', adminCors)

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route('/api/auth',       authRoutes)
app.route('/api/projects',   projectRoutes)
app.route('/api/onboarding', onboardingRoutes)
app.route('/api/knowledge',      knowledgeRoutes)
app.route('/api/settings',       settingsRoutes)
app.route('/api/chat',           chatRoutes)
app.route('/api/widget-config',  widgetConfigRoutes)
app.route('/api/stats',          statsRoutes)

// Health check
app.get('/health', (c) => c.json({ ok: true, env: process.env.NODE_ENV }))

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: 'Not found', code: 'not_found' }, 404))

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.httpStatus as any)
  }
  // Unexpected error — log internally, return generic message
  logger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Something went wrong', code: 'server_error' }, 500)
})

export default app
