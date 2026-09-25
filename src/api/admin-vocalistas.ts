import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { createDatabase } from '../db/client'
import { hashPassword } from '../auth/crypto'
import { recordAuthEvent } from '../auth/events'
import { requireAdmin } from '../auth/admin'
import { requireSameOrigin } from '../auth/origin'
import { revokeAllUserSessions } from '../auth/session'
import { normalizeUsername } from '../auth/validation'
import { randomToken } from '../auth/crypto'
import { users } from '../db/schema'
import type { AppEnv } from '../auth/session'
import { z } from 'zod'

const adminVocalistas = new Hono<AppEnv>()
const displayNamePattern = /^\p{L}+(?:[ '-]\p{L}+)*$/u

const displayNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .refine(
    (value) => displayNamePattern.test(value) && !/\s{2,}/u.test(value),
    'El nombre visible contiene caracteres o espacios no permitidos.',
  )

const createSchema = z.object({
  nombreUsuario: z.string(),
  nombreVisible: displayNameSchema,
  contrasena: z.string().min(6),
})

const updateSchema = z.object({ nombreVisible: displayNameSchema }).strict()
const passwordSchema = z.object({ contrasena: z.string().min(6) }).strict()

function notFound(context: Context<AppEnv>) {
  return context.json(
    {
      error: {
        codigo: 'VOCALISTA_NO_ENCONTRADO',
        mensaje: 'No encontramos el vocalista solicitado.',
      },
    },
    404,
  )
}

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    nombreVisible: user.displayName,
    nombreUsuario: user.usernameNormalized,
    estado: user.status === 'active' ? 'activo' : 'inactivo',
    creadoEn: new Date(user.createdAt).toISOString(),
    actualizadoEn: new Date(user.updatedAt).toISOString(),
  }
}

adminVocalistas.use('*', requireAdmin)

adminVocalistas.get('/', async (context) => {
  try {
    const vocalistas = await createDatabase(context.env.DB)
      .select()
      .from(users)
      .where(eq(users.role, 'vocalista'))
      .orderBy(asc(users.displayName), asc(users.usernameNormalized))
    return context.json({ vocalistas: vocalistas.map(publicUser) })
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible consultar los vocalistas.',
        },
      },
      503,
    )
  }
})

adminVocalistas.post('/', requireSameOrigin, async (context) => {
  const parsed = createSchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success)
    return context.json(
      { error: { codigo: 'DATOS_INVALIDOS', mensaje: 'Revisa los datos ingresados.' } },
      422,
    )
  const username = normalizeUsername(parsed.data.nombreUsuario)
  if (!username)
    return context.json(
      { error: { codigo: 'DATOS_INVALIDOS', mensaje: 'Revisa los datos ingresados.' } },
      422,
    )
  try {
    const db = createDatabase(context.env.DB)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.usernameNormalized, username))
      .get()
    if (existing)
      return context.json(
        {
          error: { codigo: 'USUARIO_YA_EXISTE', mensaje: 'Ese nombre de usuario ya está en uso.' },
        },
        409,
      )
    const password = await hashPassword(parsed.data.contrasena)
    const now = Date.now()
    const id = randomToken(16)
    await db.insert(users).values({
      id,
      role: 'vocalista',
      usernameNormalized: username,
      displayName: parsed.data.nombreVisible,
      passwordHash: password.hash,
      passwordSalt: password.salt,
      passwordAlgorithm: password.algorithm,
      passwordParameters: password.parameters,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      passwordChangedAt: now,
      deactivatedAt: null,
    })
    await recordAuthEvent(context.env.DB, 'cuenta_activada', {
      targetUserId: id,
      actorUserId: context.get('auth').identity.id,
    })
    const created = await db.select().from(users).where(eq(users.id, id)).get()
    return context.json({ vocalista: publicUser(created!) }, 201)
  } catch (error) {
    if (String(error).includes('UNIQUE'))
      return context.json(
        {
          error: { codigo: 'USUARIO_YA_EXISTE', mensaje: 'Ese nombre de usuario ya está en uso.' },
        },
        409,
      )
    return context.json(
      {
        error: { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'No fue posible crear el vocalista.' },
      },
      503,
    )
  }
})

adminVocalistas.get('/:id', async (context) => {
  try {
    const userId = context.req.param('id')
    if (!userId) return notFound(context)
    const user = await createDatabase(context.env.DB)
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get()
    if (!user || user.role !== 'vocalista') return notFound(context)
    return context.json({ vocalista: publicUser(user) })
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible consultar el vocalista.',
        },
      },
      503,
    )
  }
})

adminVocalistas.patch('/:id', requireSameOrigin, async (context) => {
  const parsed = updateSchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success)
    return context.json(
      { error: { codigo: 'DATOS_INVALIDOS', mensaje: 'Revisa los datos ingresados.' } },
      422,
    )
  try {
    const db = createDatabase(context.env.DB)
    const userId = context.req.param('id')
    if (!userId) return notFound(context)
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!user || user.role !== 'vocalista') return notFound(context)
    const now = Date.now()
    await db
      .update(users)
      .set({ displayName: parsed.data.nombreVisible, updatedAt: now })
      .where(eq(users.id, user.id))
    const updated = await db.select().from(users).where(eq(users.id, user.id)).get()
    return context.json({ vocalista: publicUser(updated!) })
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible actualizar el vocalista.',
        },
      },
      503,
    )
  }
})

adminVocalistas.post('/:id/activar', requireSameOrigin, async (context) => {
  try {
    const db = createDatabase(context.env.DB)
    const userId = context.req.param('id')
    if (!userId) return notFound(context)
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!user || user.role !== 'vocalista') return notFound(context)
    if (user.status === 'active') return context.body(null, 204)
    const now = Date.now()
    await db
      .update(users)
      .set({ status: 'active', deactivatedAt: null, updatedAt: now })
      .where(eq(users.id, user.id))
    await recordAuthEvent(context.env.DB, 'cuenta_activada', {
      targetUserId: user.id,
      actorUserId: context.get('auth').identity.id,
    })
    return context.body(null, 204)
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible activar el vocalista.',
        },
      },
      503,
    )
  }
})

adminVocalistas.post('/:id/desactivar', requireSameOrigin, async (context) => {
  try {
    const db = createDatabase(context.env.DB)
    const userId = context.req.param('id')
    if (!userId) return notFound(context)
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!user || user.role !== 'vocalista') return notFound(context)
    if (user.status === 'inactive') return context.body(null, 204)
    const now = Date.now()
    await db
      .update(users)
      .set({ status: 'inactive', deactivatedAt: now, updatedAt: now })
      .where(eq(users.id, user.id))
    await revokeAllUserSessions(context.env.DB, user.id, now)
    await recordAuthEvent(context.env.DB, 'cuenta_desactivada', {
      targetUserId: user.id,
      actorUserId: context.get('auth').identity.id,
    })
    await recordAuthEvent(context.env.DB, 'sesiones_revocadas_por_desactivacion', {
      targetUserId: user.id,
      actorUserId: context.get('auth').identity.id,
    })
    return context.body(null, 204)
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible desactivar el vocalista.',
        },
      },
      503,
    )
  }
})

adminVocalistas.post('/:id/password', requireSameOrigin, async (context) => {
  const parsed = passwordSchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success)
    return context.json(
      {
        error: {
          codigo: 'DATOS_INVALIDOS',
          mensaje: 'La contraseña debe tener al menos 6 caracteres.',
        },
      },
      422,
    )
  try {
    const db = createDatabase(context.env.DB)
    const userId = context.req.param('id')
    if (!userId) return notFound(context)
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!user || user.role !== 'vocalista') return notFound(context)
    const password = await hashPassword(parsed.data.contrasena)
    const now = Date.now()
    await db
      .update(users)
      .set({
        passwordHash: password.hash,
        passwordSalt: password.salt,
        passwordAlgorithm: password.algorithm,
        passwordParameters: password.parameters,
        passwordChangedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
    await revokeAllUserSessions(context.env.DB, user.id, now)
    await recordAuthEvent(context.env.DB, 'password_reemplazada_admin', {
      targetUserId: user.id,
      actorUserId: context.get('auth').identity.id,
    })
    await recordAuthEvent(context.env.DB, 'sesion_revocada_por_cambio_clave', {
      targetUserId: user.id,
      actorUserId: context.get('auth').identity.id,
    })
    return context.body(null, 204)
  } catch {
    return context.json(
      {
        error: {
          codigo: 'SERVICIO_NO_DISPONIBLE',
          mensaje: 'No fue posible reemplazar la contraseña.',
        },
      },
      503,
    )
  }
})

export { adminVocalistas }
