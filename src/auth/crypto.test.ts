import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './crypto'

describe('contraseñas', () => {
  it('genera y verifica PBKDF2 con parámetros persistibles', async () => {
    const stored = await hashPassword('clave-segura')

    expect(stored.algorithm).toBe('PBKDF2-HMAC-SHA-256')
    expect(await verifyPassword('clave-segura', stored)).toBe(true)
    expect(await verifyPassword('otra-clave', stored)).toBe(false)
  })
})
