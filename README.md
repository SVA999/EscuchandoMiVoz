# Escuchando mi voz

Aplicación web interna del Ministerio de Alabanza para escuchar audios propios y realizar autoevaluaciones. El desarrollo está gobernado por la SSOT y sus specs derivadas.

## Estado

S-01, Fundación y entornos, S-02, Autenticación y sesiones, y S-03, Usuarios y admin, están aprobadas e implementadas en su alcance técnico. No contiene gestión de audios, reproducción ni evaluaciones.

## Requisitos locales

- Node.js 24 o compatible con la toolchain fijada.
- Corepack habilitado para usar `pnpm@12.6.0`.

## Comandos

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```

## Arquitectura

React + Vite y Hono viven en un único Cloudflare Worker. D1 y R2 están declarados como bindings por entorno en `wrangler.jsonc`. Los identificadores reales de Cloudflare todavía no están configurados ni se usan en local.

## Datos y secretos

Local y preview usan únicamente datos ficticios. No se deben guardar secretos, archivos `.env` reales, MP3, exportaciones D1 ni datos de producción en Git.

## Documentación

- `SSOT.md`: fuente controlada de requisitos.
- `specs/`: specs derivadas y su estado de aprobación.
- `docs/decisiones-arquitectura.md`: decisiones técnicas.
- `docs/runbook-operacion.md`: operación de entornos.
- `docs/procedimiento-cierre-manual.md`: cierre autorizado de la aplicación.
