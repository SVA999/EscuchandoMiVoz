import type { Context, Next } from 'hono'
import type { Env } from '../config/env'

export async function requireSameOrigin(context: Context<{ Bindings: Env }>, next: Next) {
  const origin = context.req.header('Origin')
  if (!origin || origin !== context.env.APP_ORIGIN) {
    return context.json(
      { error: { codigo: 'ORIGEN_NO_PERMITIDO', mensaje: 'Solicitud no permitida.' } },
      403,
    )
  }
  return next()
}
