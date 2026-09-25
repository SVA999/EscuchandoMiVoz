import type { Context, Next } from 'hono'
import type { AppEnv } from './session'
import { requireAuth } from './middleware'

export async function requireAdmin(context: Context<AppEnv>, next: Next) {
  const response = await requireAuth(context, async () => undefined)
  if (response) return response
  const authentication = context.get('auth')
  if (authentication.identity.role !== 'admin') {
    return context.json(
      {
        error: { codigo: 'NO_AUTORIZADO', mensaje: 'No tienes permiso para realizar esta acción.' },
      },
      403,
    )
  }
  return next()
}
