import { handle } from 'hono/vercel'
import app from '../src/app'

// Node.js runtime — required for postgres, bcryptjs, pino (not Edge-compatible)
export const config = { runtime: 'nodejs', maxDuration: 30 }

export default handle(app)
