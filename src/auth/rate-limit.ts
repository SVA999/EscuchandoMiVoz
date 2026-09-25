import { eq } from 'drizzle-orm'
import { createDatabase } from '../db/client'
import { authRateLimits } from '../db/schema'
import { randomToken, sha256 } from './crypto'
import type { Env } from '../config/env'

const WINDOW_MS = 15 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000

export async function rateLimitKey(ip: string, username: string, pepper: string) {
  return sha256(`${ip}:${username}:${pepper}`)
}

export async function checkRateLimit(database: Env['DB'], key: string, now = Date.now()) {
  const record = await createDatabase(database)
    .select()
    .from(authRateLimits)
    .where(eq(authRateLimits.id, key))
    .get()
  if (!record) return { blocked: false }
  if (record.blockedUntil && record.blockedUntil > now) return { blocked: true }
  if (now - record.windowStartedAt >= WINDOW_MS) return { blocked: false }
  return { blocked: false }
}

export async function recordFailedAttempt(database: Env['DB'], key: string, now = Date.now()) {
  const db = createDatabase(database)
  const record = await db.select().from(authRateLimits).where(eq(authRateLimits.id, key)).get()
  if (!record) {
    await db
      .insert(authRateLimits)
      .values({ id: key, attempts: 1, windowStartedAt: now, createdAt: now, updatedAt: now })
    return { blocked: false }
  }
  if (now - record.windowStartedAt >= WINDOW_MS) {
    await db
      .update(authRateLimits)
      .set({ attempts: 1, windowStartedAt: now, blockedUntil: null, updatedAt: now })
      .where(eq(authRateLimits.id, key))
    return { blocked: false }
  }
  const attempts = record.attempts + 1
  const blocked = attempts >= 6
  await db
    .update(authRateLimits)
    .set({ attempts, blockedUntil: blocked ? now + BLOCK_MS : record.blockedUntil, updatedAt: now })
    .where(eq(authRateLimits.id, key))
  return { blocked }
}

export async function clearRateLimit(database: Env['DB'], key: string) {
  await createDatabase(database).delete(authRateLimits).where(eq(authRateLimits.id, key))
}

export function requestIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export function correlationId(): string {
  return randomToken(12)
}
