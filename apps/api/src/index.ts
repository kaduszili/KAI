import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './app.js'
import { logger } from './lib/logger.js'

const port = parseInt(process.env.PORT ?? '3001', 10)

serve({ fetch: app.fetch, port }, () => {
  logger.info(`KAI API running on http://localhost:${port}`)
})
