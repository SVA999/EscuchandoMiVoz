import { z } from 'zod'

export const loginSchema = z.object({
  nombreUsuario: z.string().trim().min(1),
  contrasena: z.string().min(1),
})

export function normalizeUsername(username: string): string | null {
  const normalized = username.trim().toLowerCase()
  return /^[a-z0-9-]{3,40}$/.test(normalized) ? normalized : null
}

export const authErrors = {
  invalidCredentials: {
    error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Usuario o contraseña incorrectos.' },
  },
  tooManyAttempts: {
    error: {
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Has realizado demasiados intentos. Intenta nuevamente en unos minutos.',
    },
  },
  unavailable: {
    error: {
      codigo: 'SERVICIO_NO_DISPONIBLE',
      mensaje: 'No fue posible iniciar sesión en este momento. Intenta nuevamente más tarde.',
    },
  },
} as const
