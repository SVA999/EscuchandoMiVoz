import { getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { sessionCookieName, type AppEnv } from './session'

export function readSessionToken(context: Context<AppEnv>): string | undefined {
  return getCookie(context, sessionCookieName(context.env.APP_ENV))
}

export function writeSessionCookie(context: Context<AppEnv>, token: string, expiresAt: number) {
  setCookie(context, sessionCookieName(context.env.APP_ENV), token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: context.env.APP_ENV !== 'local' || new URL(context.req.url).protocol === 'https:',
    path: '/',
    maxAge: Math.floor((expiresAt - Date.now()) / 1000),
  })
}

export function clearSessionCookie(context: Context<AppEnv>) {
  setCookie(context, sessionCookieName(context.env.APP_ENV), '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: context.env.APP_ENV !== 'local' || new URL(context.req.url).protocol === 'https:',
    path: '/',
    maxAge: 0,
  })
}
