import { Link, Outlet, Route, Routes } from 'react-router-dom'
import { AdminVocalistas } from './AdminVocalistas'

function Inicio() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-stone-100">
      <section className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Ministerio de Alabanza</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Escuchando mi voz</h1>
        <p className="max-w-xl text-lg leading-8 text-stone-300">
          La base técnica está lista para continuar el desarrollo guiado por specs.
        </p>
        <Link
          className="inline-flex rounded-full bg-amber-200 px-5 py-3 font-medium text-slate-950"
          to="/estado"
        >
          Ver estado técnico
        </Link>
      </section>
    </main>
  )
}

function Estado() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-3xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">S-01</p>
        <h1 className="text-4xl font-semibold tracking-tight">Fundación y entornos</h1>
        <p className="text-lg leading-8 text-slate-700">
          Esta pantalla es un smoke test técnico. No contiene funcionalidad de negocio.
        </p>
        <Link
          className="inline-flex rounded-full border border-slate-300 px-5 py-3 font-medium"
          to="/"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}

function Layout() {
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="estado" element={<Estado />} />
        <Route path="admin/vocalistas" element={<AdminVocalistas />} />
      </Route>
    </Routes>
  )
}
