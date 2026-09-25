import { Hono } from 'hono'
import { api } from './api'
import type { Env } from './config/env'

const app = new Hono<{ Bindings: Env }>().route('/api', api)

app.notFound((context) => context.json({ error: 'Ruta no encontrada' }, 404))

export default app
