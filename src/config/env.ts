import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

export type AppEnvironment = 'local' | 'preview' | 'production'

export interface Env {
  APP_ENV: AppEnvironment
  DB: D1Database
  AUDIO_BUCKET: R2Bucket
  APP_ORIGIN: string
  SESSION_PEPPER: string
  RATE_LIMIT_PEPPER: string
}
