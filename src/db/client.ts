import { drizzle } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'

export function createDatabase(database: D1Database) {
  return drizzle(database)
}
