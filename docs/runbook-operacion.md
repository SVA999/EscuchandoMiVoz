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

## Migraciones

Las migraciones se generan con Drizzle y se aplican explícitamente. Nunca se ejecuta una migración automática contra producción desde una rama de desarrollo.
