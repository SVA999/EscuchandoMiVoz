import { describe, expect, it } from 'vitest'
import { healthRoute } from './health'

describe('GET /api/health', () => {
  it('devuelve un estado mínimo sin datos internos', async () => {
    const response = await healthRoute.request('http://localhost/')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ estado: 'ok' })
  })
})
