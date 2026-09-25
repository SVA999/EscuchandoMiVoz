import { and, eq, gt, isNull } from 'drizzle-orm'
import { createDatabase } from '../db/client'
import { sessions, users } from '../db/schema'
import { randomToken, sha256 } from './crypto'
import type { Env } from '../config/env'

export const SESSION_COOKIE_PRODUCTION = '__Host-escuchando-mi-propia-voz-session'
export const SESSION_COOKIE_LOCAL = 'escuchando-mi-propia-voz-session'
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export type AuthIdentity = { id: string; role: 'admin' | 'vocalista'; usernameNormalized: string }
export type AuthenticatedSession = { sessionId: string; identity: AuthIdentity }
export type AppEnv = { Bindings: Env; Variables: { auth: AuthenticatedSession } }

export function sessionCookieName(environment: Env['APP_ENV']): string {
  return environment === 'local' ? SESSION_COOKIE_LOCAL : SESSION_COOKIE_PRODUCTION
}

export async function hashSessionToken(token: string, pepper: string): Promise<string> {
  return sha256(`${token}${pepper}`)
}

export async function createSession(
  database: Env['DB'],
  user: AuthIdentity,
  pepper: string,
  now = Date.now(),
) {
  const token = randomToken()
  const id = randomToken(16)
  const tokenHash = await hashSessionToken(token, pepper)
  const db = createDatabase(database)
  await db.insert(sessions).values({
    id,
    userId: user.id,
    tokenHash,
    expiresAt: now + SESSION_DURATION_MS,
    lastActivityAt: now,
    createdAt: now,
  })
  return { token, expiresAt: now + SESSION_DURATION_MS }
}

export async function authenticateSession(
  database: Env['DB'],
  token: string,
  pepper: string,
  now = Date.now(),
) {
  const tokenHash = await hashSessionToken(token, pepper)
  const db = createDatabase(database)
  const result = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(users.status, 'active'),
      ),
    )
    .get()

  if (!result) return null

  await db
    .update(sessions)
    .set({ expiresAt: now + SESSION_DURATION_MS, lastActivityAt: now })
    .where(eq(sessions.id, result.session.id))

  return {
    sessionId: result.session.id,
    identity: {
      id: result.user.id,
      role: result.user.role,
      usernameNormalized: result.user.usernameNormalized,
    } satisfies AuthIdentity,
  }
}

export async function revokeSession(
  database: Env['DB'],
  token: string,
  pepper: string,
  now = Date.now(),
) {
  const tokenHash = await hashSessionToken(token, pepper)
  await createDatabase(database)
    .update(sessions)
    .set({ revokedAt: now })
    .where(eq(sessions.tokenHash, tokenHash))
}

export async function revokeAllUserSessions(database: Env['DB'], userId: string, now = Date.now()) {
  await createDatabase(database)
    .update(sessions)
    .set({ revokedAt: now })
    .where(eq(sessions.userId, userId))
}
