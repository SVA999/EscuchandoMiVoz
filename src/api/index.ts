import { Hono } from 'hono'
import { healthRoute } from './health'

export const api = new Hono().route('/health', healthRoute)
