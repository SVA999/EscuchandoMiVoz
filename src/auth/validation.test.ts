import { describe, expect, it } from 'vitest'
import { normalizeUsername } from './validation'

describe('normalización de usuario', () => {
  it('normaliza valores válidos', () => {
    expect(normalizeUsername('  Ministerio-Alabanza ')).toBe('ministerio-alabanza')
    expect(normalizeUsername('natalia-02')).toBe('natalia-02')
  })

  it('rechaza caracteres y longitudes no aprobados', () => {
    expect(normalizeUsername('deisy_lopez')).toBeNull()
    expect(normalizeUsername('josé')).toBeNull()
    expect(normalizeUsername('ab')).toBeNull()
    expect(normalizeUsername('a'.repeat(41))).toBeNull()
  })
})
