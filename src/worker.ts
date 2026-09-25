import { Hono } from 'hono'
import { api } from './api'
import type { AppEnv } from './auth/session'

const app = new Hono<AppEnv>().route('/api', api)

app.notFound((context) => context.json({ error: 'Ruta no encontrada' }, 404))

export default app
