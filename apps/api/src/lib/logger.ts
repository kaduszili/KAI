import pino from 'pino'

// NOTE: never use pino transport (pino-pretty) here — it spawns a Worker Thread
// which hangs indefinitely in Vercel's serverless sandbox.
// For local pretty-printing: pipe output through pino-pretty CLI instead:
//   pnpm dev | pnpm pino-pretty
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
})
