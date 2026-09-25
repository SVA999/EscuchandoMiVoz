import { Hono } from 'hono'
import type { AppEnv } from '../auth/session'
import { auth } from './auth'
import { adminVocalistas } from './admin-vocalistas'
import { healthRoute } from './health'

export const api = new Hono<AppEnv>()
  .route('/health', healthRoute)
  .route('/auth', auth)
  .route('/admin/vocalistas', adminVocalistas)
