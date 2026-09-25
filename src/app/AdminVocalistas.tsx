import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Vocalista = {
  id: string
  nombreVisible: string
  nombreUsuario: string
  estado: 'activo' | 'inactivo'
  creadoEn: string
  actualizadoEn: string
}

type ApiError = { error?: { mensaje?: string } }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(body.error?.mensaje ?? 'No fue posible completar la solicitud.')
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export function AdminVocalistas() {
  const [vocalistas, setVocalistas] = useState<Vocalista[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [passwordId, setPasswordId] = useState<string | null>(null)
  const [deactivationId, setDeactivationId] = useState<string | null>(null)

  async function loadVocalistas() {
    setLoading(true)
    setError('')
    try {
      const result = await request<{ vocalistas: Vocalista[] }>('/api/admin/vocalistas')
      setVocalistas(result.vocalistas)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible consultar los vocalistas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadVocalistas())
  }, [])

  async function createVocalista(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await request('/api/admin/vocalistas', {
        method: 'POST',
        body: JSON.stringify({
          nombreVisible: form.get('nombreVisible'),
          nombreUsuario: form.get('nombreUsuario'),
          contrasena: form.get('contrasena'),
        }),
      })
      event.currentTarget.reset()
      setMessage('El vocalista fue creado.')
      await loadVocalistas()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible crear el vocalista.')
    }
  }

  async function updateVocalista(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await request(`/api/admin/vocalistas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nombreVisible: form.get('nombreVisible') }),
      })
      setEditingId(null)
      setMessage('El nombre visible fue actualizado.')
      await loadVocalistas()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible actualizar el vocalista.')
    }
  }

  async function changeStatus(vocalista: Vocalista) {
    try {
      await request(
        `/api/admin/vocalistas/${vocalista.id}/${vocalista.estado === 'activo' ? 'desactivar' : 'activar'}`,
        { method: 'POST', body: '{}' },
      )
      setDeactivationId(null)
      setMessage(
        vocalista.estado === 'activo'
          ? 'El vocalista fue desactivado.'
          : 'El vocalista fue activado.',
      )
      await loadVocalistas()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible cambiar el estado.')
    }
  }

  async function replacePassword(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('contrasena') ?? '')
    const confirmation = String(form.get('confirmacion') ?? '')
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    try {
      await request(`/api/admin/vocalistas/${id}/password`, {
        method: 'POST',
        body: JSON.stringify({ contrasena: password }),
      })
      setPasswordId(null)
      setMessage('La contraseña fue reemplazada y las sesiones anteriores fueron cerradas.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible reemplazar la contraseña.')
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
              Ministerio de Alabanza
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Vocalistas</h1>
            <p className="mt-2 text-slate-600">
              Administra cuentas y credenciales. Los audios se gestionan en otra sección.
            </p>
          </div>
          <Link className="rounded-full border border-slate-300 px-4 py-2 font-medium" to="/">
            Volver
          </Link>
        </header>

        {message && (
          <p className="rounded-xl bg-emerald-100 px-4 py-3 text-emerald-900" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-rose-100 px-4 py-3 text-rose-900" role="alert">
            {error}
          </p>
        )}

        <section
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
          aria-labelledby="crear-titulo"
        >
          <h2 id="crear-titulo" className="text-2xl font-semibold">
            Crear vocalista
          </h2>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={createVocalista}>
            <label className="grid gap-2 font-medium">
              Nombre visible
              <input
                className="rounded-xl border border-slate-300 px-3 py-3"
                name="nombreVisible"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label className="grid gap-2 font-medium">
              Nombre de usuario
              <input
                className="rounded-xl border border-slate-300 px-3 py-3"
                name="nombreUsuario"
                required
                minLength={3}
                maxLength={40}
              />
            </label>
            <label className="grid gap-2 font-medium sm:col-span-2">
              Contraseña inicial
              <input
                className="rounded-xl border border-slate-300 px-3 py-3"
                name="contrasena"
                type="password"
                required
                minLength={6}
              />
            </label>
            <button
              className="rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white sm:col-span-2"
              type="submit"
            >
              Crear vocalista
            </button>
          </form>
        </section>

        <section aria-labelledby="lista-titulo">
          <h2 id="lista-titulo" className="text-2xl font-semibold">
            Lista completa
          </h2>
          {loading && <p className="mt-4 text-slate-600">Cargando vocalistas...</p>}
          {!loading && vocalistas.length === 0 && (
            <p className="mt-4 rounded-xl bg-white p-5 text-slate-600">
              Aún no hay vocalistas creados.
            </p>
          )}
          <div className="mt-4 grid gap-4">
            {vocalistas.map((vocalista) => (
              <article
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                key={vocalista.id}
              >
                {editingId === vocalista.id ? (
                  <form
                    className="grid gap-3 sm:grid-cols-[1fr_auto]"
                    onSubmit={(event) => updateVocalista(vocalista.id, event)}
                  >
                    <label className="grid gap-2 font-medium">
                      Nombre visible
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-3"
                        name="nombreVisible"
                        defaultValue={vocalista.nombreVisible}
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        className="rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white"
                        type="submit"
                      >
                        Guardar
                      </button>
                      <button
                        className="rounded-xl border border-slate-300 px-4 py-3"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{vocalista.nombreVisible}</h3>
                      <p className="text-slate-600">{vocalista.nombreUsuario}</p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {vocalista.estado}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl border border-slate-300 px-3 py-2"
                        type="button"
                        onClick={() => setEditingId(vocalista.id)}
                      >
                        Editar nombre
                      </button>
                      <button
                        className="rounded-xl border border-slate-300 px-3 py-2"
                        type="button"
                        onClick={() =>
                          vocalista.estado === 'activo'
                            ? setDeactivationId(vocalista.id)
                            : void changeStatus(vocalista)
                        }
                      >
                        {vocalista.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        className="rounded-xl border border-slate-300 px-3 py-2"
                        type="button"
                        onClick={() =>
                          setPasswordId(passwordId === vocalista.id ? null : vocalista.id)
                        }
                      >
                        Reemplazar contraseña
                      </button>
                    </div>
                  </div>
                )}
                {passwordId === vocalista.id && (
                  <form
                    className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2"
                    onSubmit={(event) => replacePassword(vocalista.id, event)}
                  >
                    <label className="grid gap-2 font-medium">
                      Nueva contraseña
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-3"
                        name="contrasena"
                        type="password"
                        required
                        minLength={6}
                      />
                    </label>
                    <label className="grid gap-2 font-medium">
                      Confirmar contraseña
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-3"
                        name="confirmacion"
                        type="password"
                        required
                        minLength={6}
                      />
                    </label>
                    <button
                      className="rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white sm:col-span-2"
                      type="submit"
                    >
                      Confirmar reemplazo
                    </button>
                  </form>
                )}
                {deactivationId === vocalista.id && (
                  <div
                    className="fixed inset-0 z-10 grid place-items-center bg-slate-950/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="desactivar-titulo"
                  >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                      <h2 id="desactivar-titulo" className="text-2xl font-semibold">
                        Desactivar vocalista
                      </h2>
                      <p className="mt-3 text-slate-700">
                        ¿Deseas desactivar a este vocalista? No podrá iniciar sesión, pero sus
                        audios y evaluaciones se conservarán.
                      </p>
                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          className="rounded-xl border border-slate-300 px-4 py-3"
                          type="button"
                          onClick={() => setDeactivationId(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="rounded-xl bg-rose-700 px-4 py-3 font-semibold text-white"
                          type="button"
                          onClick={() => void changeStatus(vocalista)}
                        >
                          Sí, desactivar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
