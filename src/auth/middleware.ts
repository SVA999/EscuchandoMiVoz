import type { Context, Next } from 'hono'
import { readSessionToken } from './cookies'
import { authenticateSession, type AppEnv } from './session'

export async function requireAuth(context: Context<AppEnv>, next: Next) {
  const token = readSessionToken(context)
  if (!token)
    return context.json(
      { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Debes iniciar sesión.' } },
      401,
    )

  try {
    const authentication = await authenticateSession(
      context.env.DB,
      token,
      context.env.SESSION_PEPPER,
    )
    if (!authentication) {
      return context.json(
        { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Debes iniciar sesión.' } },
        401,
      )
    }
    context.set('auth', authentication)
    return next()
  } catch {
    return context.json(
      { error: { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'No fue posible validar la sesión.' } },
      503,
    )
  }
}
