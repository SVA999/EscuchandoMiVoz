# Procedimiento manual de cierre — Escuchando mi propia voz

**Estado:** procedimiento operativo para usar al finalizar la temporada. No ejecutar una eliminación sin autorización explícita de Santiago Viana. **Estas acciones son irreversibles** una vez se eliminan el bucket, la base de datos, el Worker o los respaldos.

## 1. Objetivo

Cerrar o retirar de operación la aplicación temporal **Escuchando mi propia voz** sin afectar los MP3 originales conservados en Google Drive. Este procedimiento describe cómo conservar un respaldo opcional, revocar accesos, retirar el despliegue y, si se aprueba, eliminar datos de Cloudflare.

La aplicación usa:

- Un Cloudflare Worker para interfaz, API, autorización y sesiones.
- Cloudflare D1 para usuarios, sesiones, metadatos de audio, borradores, evaluaciones y respuestas.
- Cloudflare R2 privado para las copias de MP3 utilizadas por la aplicación.
- Google Drive personal como respaldo/origen de los MP3, fuera de la infraestructura de la app.

## 2. Principios de seguridad

- **No eliminar nada de Google Drive** como parte de este procedimiento. Drive contiene el respaldo/original y no se ve afectado por borrar R2 o D1.
- Usar solo la cuenta Cloudflare de Santiago Viana, verificando nombre de Worker, base D1 y bucket R2 antes de cada operación.
- No ejecutar comandos con `--yes`, `--force` ni saltos de confirmación hasta comprobar el objetivo real.
- Hacer una exportación de D1 si se desea conservar las respuestas o poder recuperar información posteriormente.
- Guardar cualquier exportación en un sitio privado y protegido. Puede contener nombres de usuarios, metadatos de audios y respuestas de autoevaluación.
- Confirmar que ningún integrante necesita acceso antes de retirar el Worker o invalidar sesiones.

## 3. Inventario previo

Antes de cerrar, registrar en un documento privado:

| Recurso     | Dato que se debe verificar                                                    |
| ----------- | ----------------------------------------------------------------------------- |
| Worker      | Nombre exacto del Worker desplegado y URL pública                             |
| D1          | Nombre y UUID de la base de datos remota                                      |
| R2          | Nombre exacto del bucket privado                                              |
| Repositorio | Organización/usuario y repositorio Git correspondiente                        |
| Drive       | Carpeta de respaldo original; verificar que los MP3 existen y se pueden abrir |
| Secretos    | Lista de secretos/configuraciones usados por el Worker                        |

No incluir tokens, contraseñas ni claves en este inventario.

## 4. Ruta A: retirar acceso, conservar datos

Usar esta ruta si se desea terminar la temporada, pero conservar información temporalmente.

1. Verificar que los MP3 originales siguen presentes en Drive y que el propietario puede acceder a ellos.
2. Exportar D1 si se requiere respaldo de usuarios, evaluaciones y respuestas.
3. Revocar todas las sesiones activas desde el panel o mediante la acción administrativa que implemente la aplicación.
4. Cambiar la contraseña de Ministerio de Alabanza y/o desactivar las cuentas vocalistas.
5. Retirar el enlace de WhatsApp, páginas públicas y accesos compartidos.
6. Opcional: retirar el despliegue del Worker o reemplazarlo por una página de cierre estática que no exponga datos.
7. Conservar D1 y R2 privados mientras dure el periodo de retención definido por Santiago Viana.
8. Registrar una fecha futura para decidir entre reactivar, exportar o borrar definitivamente.

Esta ruta no debe depender de una función interna de «apagado» porque el producto no la incluye. Si el Worker permanece desplegado, las cuentas desactivadas y las sesiones revocadas deben impedir acceso.

## 5. Ruta B: exportar y eliminar definitivamente

Usar esta ruta solo cuando Santiago Viana autorice borrar los datos de Cloudflare. Se recomienda hacerla con calma y en este orden.

### Paso 1 — Confirmación final

Confirmar por escrito:

- Que el Ministerio ya no necesita la aplicación activa.
- Que los MP3 originales están disponibles en Drive.
- Si se requiere exportación de evaluaciones/respuestas.
- Que se entiende que borrar R2 elimina las copias de audio de la app y borrar D1 elimina usuarios, sesiones, evaluaciones y borradores.

### Paso 2 — Exportar D1 opcionalmente

Para guardar el esquema y datos completos de la base D1 remota, usar Wrangler desde el proyecto autorizado:

```bash
npx wrangler d1 export <NOMBRE_BASE_D1> --remote --output=./respaldo-d1-fecha.sql
```

Cloudflare documenta `wrangler d1 export` para exportar una base D1 completa o tablas específicas a un archivo `.sql`. [web:108][web:112]

Después:

1. Confirmar que el archivo existe y no está vacío.
2. Guardarlo en almacenamiento privado, no en un repositorio público ni en WhatsApp.
3. Si no se requiere conservar datos, destruir el archivo de exportación después de confirmar la eliminación.

### Paso 3 — Retirar el Worker

1. Revocar sesiones y desactivar vocalistas si el Worker seguirá accesible durante el cierre.
2. Retirar el despliegue o eliminar el Worker únicamente tras verificar que el nombre exacto corresponde a esta app.
3. Verificar en navegador que la URL anterior ya no permite autenticarse ni reproducir audio.

El procedimiento técnico exacto de eliminación/retiro depende del método de despliegue que se documente durante implementación; no adivinar comandos ni borrar otros Workers del mismo propietario.

### Paso 4 — Eliminar MP3 de R2

1. Abrir el bucket R2 correcto y revisar una última vez que el nombre corresponde a la aplicación.
2. Vaciar/eliminar todos los objetos MP3 del bucket por Dashboard o herramienta autorizada.
3. Confirmar que el bucket está vacío.
4. Si no se reutilizará, eliminar el bucket vacío.

Cloudflare indica que para eliminar un bucket hay que eliminar primero todos sus objetos; vaciar un bucket elimina todos los objetos y después se puede borrar el bucket. [web:106][web:107]

**Advertencia:** esta operación no se puede deshacer desde la app. Solo elimina las copias R2, no los archivos originales de Drive.

### Paso 5 — Eliminar D1

1. Confirmar que la exportación opcional está guardada si se necesitaba.
2. Verificar el nombre y UUID de D1 por segunda vez.
3. Eliminar la base D1 mediante el Dashboard o el procedimiento Wrangler documentado para la cuenta.
4. Confirmar que ya no aparecen datos, sesiones ni evaluaciones en el recurso eliminado.

No eliminar una base D1 compartida con otro proyecto. La base de esta aplicación debe haber sido creada exclusivamente para ella.

### Paso 6 — Revocar secretos y accesos técnicos

1. Eliminar secretos vinculados al Worker que ya no se usarán.
2. Revocar o eliminar tokens API, credenciales de despliegue y claves de integración exclusivos de la aplicación.
3. Revisar variables de entorno, bindings y accesos del repositorio.
4. Eliminar o archivar el repositorio según la decisión de Santiago Viana; no exponer archivos `.env`, respaldos SQL ni datos de usuarios.

Cloudflare permite borrar secretos del Worker mediante Dashboard o `wrangler secret delete`; la operación despliega una nueva versión del Worker. [web:109]

## 6. Verificación posterior

Completar esta lista antes de considerar cerrado el proyecto:

- [ ] Drive conserva los MP3 originales y siguen accesibles para su propietario.
- [ ] La URL de la aplicación ya no permite acceder con credenciales antiguas.
- [ ] No quedan sesiones válidas de vocalistas.
- [ ] R2 fue retenido o eliminado según la autorización.
- [ ] D1 fue retenido, exportado o eliminado según la autorización.
- [ ] Los secretos y tokens exclusivos fueron revocados o eliminados.
- [ ] No se subieron exportaciones SQL, MP3, usuarios o contraseñas a repositorios públicos.
- [ ] El propietario documentó la fecha, ruta elegida y recursos eliminados/conservados.

## 7. Reapertura futura

Si en otra temporada se desea reactivar el proyecto:

- No reutilizar tokens, contraseñas o sesiones antiguas.
- Revisar que Cloudflare mantenga los límites/precios aceptables antes de desplegar.
- Crear usuarios con nuevas credenciales o restablecerlas.
- Copiar nuevamente los MP3 requeridos desde Drive a un R2 privado.
- Revisar y aprobar de nuevo el formulario y la política de datos antes de habilitar acceso.

No asumir que un respaldo SQL o un bucket anterior es seguro o apropiado para una temporada futura sin revisión previa.
