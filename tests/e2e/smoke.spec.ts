import { expect, test } from '@playwright/test'

test('carga la SPA en la ruta raíz', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Escuchando mi voz' })).toBeVisible()
})

test('consulta el endpoint de salud', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toEqual({ estado: 'ok' })
})
