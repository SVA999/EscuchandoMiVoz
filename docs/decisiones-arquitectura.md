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

## S-02 — Autenticación y sesiones

- **IDs:** A-14, A-15, A-16, A-17, A-18, A-26, A-27, A-28, A-29, A-30.
- **Estado:** aprobada el 25 de septiembre de 2026.
- **Contraseñas:** PBKDF2-HMAC-SHA-256 con Web Crypto, salt aleatorio mínimo de 16 bytes y 100.000 iteraciones iniciales. Se debe medir el costo en un Worker real antes de production.
- **Sesiones:** token aleatorio de 32 bytes; D1 conserva SHA-256 del token concatenado con `SESSION_PEPPER`. El pepper es secreto e independiente por entorno.
- **Cookie:** prefijo `__Host-` en preview/production; cookie sin ese prefijo en local cuando no haya HTTPS.
- **Rate limit:** D1, 5 fallos en 15 minutos y bloqueo de 15 minutos desde el sexto fallo. No se persiste IP cruda.
- **Origen:** no hay CORS; las solicitudes mutables validan `Origin` contra el origen exacto del entorno.
- **Bootstrap admin:** herramienta local interactiva, sin endpoint público, seed versionado ni contraseña en Git.
- **Restablecimiento admin:** herramienta local que invalida las sesiones activas.
- **Retención:** limpieza oportunista diaria y revisión manual mensual; eventos de autenticación durante 90 días.

## S-03 — Usuarios y admin

- **IDs:** A-15, A-16, A-17, A-18, A-56.
- **Estado:** aprobada e implementada el 25 de septiembre de 2026.
- **Usuarios:** `display_name` obligatorio de 2 a 80 caracteres Unicode; `username_normalized` permanece inmutable después de crear.
- **Listado:** completo, sin filtros ni paginación en el MVP; ordenado por nombre visible y luego usuario.
- **Estado inicial:** los vocalistas se crean `active`.
- **Desactivación:** conserva audios, borradores y evaluaciones; invalida sesiones sin eliminar información.
- **Reactivación:** conserva datos y relaciones, pero no recupera sesiones revocadas.
- **Administración:** solo la cuenta admin puede usar las rutas y la UI de vocalistas; la cuenta admin no se opera desde S-03.
