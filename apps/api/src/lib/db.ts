import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema/index.js'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(process.env.DATABASE_URL, {
  prepare: false,                        // required for Supabase transaction pooler
  ssl: { rejectUnauthorized: false },    // SSL without cert verification (required for PgBouncer/Supabase)
  max: 2,                                // serverless: keep connection pool small
  idle_timeout: 20,
  connect_timeout: 30,                   // allow time for cold starts
})

export const db = drizzle(client, { schema })
