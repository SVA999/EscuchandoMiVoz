import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createDatabase } from '../db/client'
import { users } from '../db/schema'
import { clearSessionCookie, readSessionToken, writeSessionCookie } from '../auth/cookies'
import { recordAuthEvent } from '../auth/events'
import { requireAuth } from '../auth/middleware'
import { requireSameOrigin } from '../auth/origin'
import {
  checkRateLimit,
  clearRateLimit,
  rateLimitKey,
  recordFailedAttempt,
  requestIp,
} from '../auth/rate-limit'
import { createSession, revokeSession, type AppEnv } from '../auth/session'
import { authErrors, loginSchema, normalizeUsername } from '../auth/validation'
import { verifyPassword } from '../auth/crypto'
import { cleanupAuthenticationData } from '../auth/maintenance'

const auth = new Hono<AppEnv>()

auth.post('/login', requireSameOrigin, async (context) => {
  void cleanupAuthenticationData(context.env.DB, context.env.APP_ENV).catch(() => undefined)
  const body = await context.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  const rawUsername = parsed.success ? parsed.data.nombreUsuario : ''
  const normalizedUsername = normalizeUsername(rawUsername) ?? rawUsername.trim().toLowerCase()

  if (!parsed.success || !normalizedUsername) {
    return context.json(authErrors.invalidCredentials, 401)
  }

  let key: string
  try {
    key = await rateLimitKey(
      requestIp(context.req.raw),
      normalizedUsername,
      context.env.RATE_LIMIT_PEPPER,
    )
    if ((await checkRateLimit(context.env.DB, key)).blocked) {
      await recordAuthEvent(context.env.DB, 'login_bloqueado_rate_limit')
      return context.json(authErrors.tooManyAttempts, 429)
    }

    const user = await createDatabase(context.env.DB)
      .select()
      .from(users)
      .where(eq(users.usernameNormalized, normalizedUsername))
      .get()

    const valid = user
      ? await verifyPassword(parsed.data.contrasena, {
          hash: user.passwordHash,
          salt: user.passwordSalt,
          algorithm: user.passwordAlgorithm,
          parameters: user.passwordParameters,
        })
      : false

    if (!user || user.status !== 'active' || !valid) {
      const attempt = await recordFailedAttempt(context.env.DB, key)
      await recordAuthEvent(
        context.env.DB,
        attempt.blocked ? 'login_bloqueado_rate_limit' : 'login_fallido',
      )
      return context.json(
        attempt.blocked ? authErrors.tooManyAttempts : authErrors.invalidCredentials,
        attempt.blocked ? 429 : 401,
      )
    }

    await clearRateLimit(context.env.DB, key)
    const identity = {
      id: user.id,
      role: user.role,
      usernameNormalized: user.usernameNormalized,
    } as const
    const session = await createSession(context.env.DB, identity, context.env.SESSION_PEPPER)
    await recordAuthEvent(context.env.DB, 'login_exitoso', { targetUserId: user.id })
    writeSessionCookie(context, session.token, session.expiresAt)
    return context.json({
      usuario: { id: user.id, nombreUsuario: user.usernameNormalized, rol: user.role },
    })
  } catch {
    return context.json(authErrors.unavailable, 503)
  }
})

auth.get('/me', requireAuth, (context) => {
  const authentication = context.get('auth')
  return context.json({
    usuario: {
      id: authentication.identity.id,
      nombreUsuario: authentication.identity.usernameNormalized,
      rol: authentication.identity.role,
    },
  })
})

auth.post('/logout', requireSameOrigin, async (context) => {
  try {
    const token = readSessionToken(context)
    if (token) {
      await revokeSession(context.env.DB, token, context.env.SESSION_PEPPER)
      await recordAuthEvent(context.env.DB, 'logout')
    }
  } catch {
    clearSessionCookie(context)
    return context.body(null, 204)
  }
  clearSessionCookie(context)
  return context.body(null, 204)
})

export { auth }
