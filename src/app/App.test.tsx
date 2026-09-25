import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('muestra la pantalla técnica inicial', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Escuchando mi voz' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver estado técnico' })).toBeInTheDocument()
  })
})
