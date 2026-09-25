# Runbook de operación

## Desarrollo local

1. Habilitar Corepack y ejecutar `corepack pnpm install`.
2. Ejecutar `corepack pnpm dev`.
3. Validar `corepack pnpm typecheck`, `corepack pnpm lint` y `corepack pnpm test`.
4. Usar únicamente datos ficticios.

## Preview

No se publica una URL temporal por pull request. La validación se realiza en local o en un entorno controlado que no use bindings, secretos ni datos de producción.

## Producción

La producción no se despliega desde S-01. Cuando una spec posterior lo autorice, requerirá revisión manual de Santiago Viana, recursos Cloudflare verificados y secretos configurados fuera de Git.

## Autenticación

Antes de usar producción, configurar los secretos `SESSION_PEPPER` y `RATE_LIMIT_PEPPER` de forma independiente por entorno mediante Wrangler. Nunca guardarlos en Git, `.env`, D1, logs ni argumentos de comandos.

Para crear la única cuenta admin, ejecutar localmente `corepack pnpm auth:bootstrap-admin`. La herramienta solicita la contraseña oculta y falla si ya existe un admin activo. Para restablecerla, ejecutar `corepack pnpm auth:reset-admin`; la operación invalida todas sus sesiones. No existen endpoints web de recuperación.

La rotación de `SESSION_PEPPER` invalida todas las sesiones. La limpieza de sesiones, rate limits y eventos se ejecuta de forma oportunista como máximo una vez al día; revisar manualmente los registros antiguos una vez al mes.

## Gestión de vocalistas

La gestión está disponible en `/admin/vocalistas` para una sesión admin válida. Crear un vocalista exige nombre visible, nombre de usuario y contraseña inicial. El nombre de usuario no se cambia posteriormente; para otro acceso se desactiva la cuenta anterior y se crea una nueva.

Desactivar conserva audios, borradores y evaluaciones, invalida las sesiones y no elimina información. Reactivar conserva las relaciones, pero la persona debe iniciar una sesión nueva. No operar la cuenta admin desde estos endpoints.

## Migraciones

Las migraciones se generan con Drizzle y se aplican explícitamente. Nunca se ejecuta una migración automática contra producción desde una rama de desarrollo.
