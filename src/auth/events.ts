import { createDatabase } from '../db/client'
import { authEvents } from '../db/schema'
import { randomToken } from './crypto'
import type { Env } from '../config/env'

export type AuthEventType =
  | 'login_exitoso'
  | 'login_fallido'
  | 'login_bloqueado_rate_limit'
  | 'logout'
  | 'password_reemplazada_admin'
  | 'sesion_revocada_por_cambio_clave'
  | 'sesiones_revocadas_por_desactivacion'
  | 'cuenta_desactivada'
  | 'cuenta_activada'
  | 'restablecimiento_admin_local'

export async function recordAuthEvent(
  database: Env['DB'],
  eventType: AuthEventType,
  values: { targetUserId?: string; actorUserId?: string; context?: string } = {},
) {
  await createDatabase(database)
    .insert(authEvents)
    .values({
      id: randomToken(16),
      eventType,
      targetUserId: values.targetUserId,
      actorUserId: values.actorUserId,
      occurredAt: Date.now(),
      context: values.context,
      correlationId: randomToken(12),
    })
}
