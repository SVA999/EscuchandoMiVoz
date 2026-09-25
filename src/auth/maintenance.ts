import { and, eq, lt, or } from 'drizzle-orm'
import { createDatabase } from '../db/client'
import { authEvents, authRateLimits, sessions } from '../db/schema'
import type { Env } from '../config/env'

const DAY_MS = 24 * 60 * 60 * 1000
const SESSION_RETENTION_MS = 30 * DAY_MS
const EVENT_RETENTION_MS = 90 * DAY_MS
const lastRunByEnvironment = new Map<string, number>()

export async function cleanupAuthenticationData(
  database: Env['DB'],
  environment: Env['APP_ENV'],
  now = Date.now(),
) {
  const lastRun = lastRunByEnvironment.get(environment) ?? 0
  if (now - lastRun < DAY_MS) return
  lastRunByEnvironment.set(environment, now)
  const db = createDatabase(database)
  const sessionCutoff = now - SESSION_RETENTION_MS
  const eventCutoff = now - EVENT_RETENTION_MS
  await db
    .delete(sessions)
    .where(
      or(
        lt(sessions.expiresAt, sessionCutoff),
        and(lt(sessions.revokedAt, sessionCutoff), eq(sessions.revokedAt, sessions.revokedAt)),
      ),
    )
  await db.delete(authEvents).where(lt(authEvents.occurredAt, eventCutoff))
  await db.delete(authRateLimits).where(lt(authRateLimits.updatedAt, sessionCutoff))
}
