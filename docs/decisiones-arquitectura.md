# Decisiones de arquitectura

## S-01 — Fundación y entornos

- **IDs:** A-19, A-20, A-21, A-22, A-23, A-24, A-25, A-62, A-67, A-72, A-87, A-88.
- **Estado:** aprobado el 24 de septiembre de 2026.
- **Repositorio:** `https://github.com/SVA999/EscuchandoMiVoz`.
- **Gestor:** `pnpm@12.6.0`, ejecutado mediante Corepack.
- **Entornos:** `local`, `preview` y `production`, separados por configuración y recursos.
- **Preview:** no se habilita una URL pública temporal; la validación queda controlada localmente hasta definir una estrategia posterior.
- **Costo:** se trabaja con nivel gratuito y revisión manual de consumo; no se asume facturación habilitada ni un límite duro inexistente.
- **Migraciones:** Drizzle queda configurado sin tablas de dominio. La primera migración será vacía o técnica.

## Preguntas abiertas

La disponibilidad real de nombres Cloudflare y la creación de recursos remotos se verifican con Wrangler bajo autorización de Santiago Viana. No se crean recursos durante S-01 sin esa autorización operativa.

La validación de carga de 30 MB se realizará como spike técnico antes de S-04. S-01 no implementa carga real ni cambia el límite aprobado por A-34.
