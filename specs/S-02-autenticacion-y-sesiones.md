# S-02 — Autenticación y sesiones

> **Estado:** APROBADA — autoriza implementar exclusivamente el alcance de esta spec.
> **Versión:** 0.1.0
> **SSOT de referencia:** `SSOT.md` v1.0.0
> **Cubre:** A-14, A-15, A-16, A-17, A-18, A-26, A-27, A-28, A-29, A-30
> **Depende de:** S-01 aprobada e implementada en su alcance técnico
> **No cubre:** administración de vocalistas, carga/reproducción de audio, borradores, evaluaciones, panel administrativo ni recuperación automática de contraseña.

## 1. Objetivo

Definir la autenticación, las sesiones persistentes y el contexto de autorización del monolito **Escuchando mi voz**. La implementación permitirá que la cuenta administrativa única y los vocalistas inicien sesión con credenciales entregadas individualmente, manteniendo las sesiones en cookies seguras y aplicando autorización en el Worker.

La spec separa el mecanismo transversal de autenticación de las operaciones de usuarios que se detallarán en S-03. S-02 podrá crear únicamente las entidades y endpoints necesarios para iniciar, consultar, renovar y cerrar sesiones, además del mecanismo operativo aprobado para crear la cuenta administrativa inicial.

## 2. Decisiones heredadas de la SSOT y S-01

- Solo existen los roles `admin` y `vocalista`.
- Existe una única cuenta administrativa con nombre visible **Ministerio de Alabanza**.
- El acceso se realiza con credenciales entregadas individualmente por WhatsApp; no hay registro público, Google, recuperación automática ni cambio obligatorio de contraseña.
- Las contraseñas tienen mínimo 6 caracteres y nunca se almacenan en texto plano.
- La sesión dura 30 días desde la última actividad válida y se renueva con cada solicitud autenticada válida.
- La sesión usa un token opaco aleatorio en cookie `HttpOnly`, `Secure`, `SameSite=Lax` y `Path=/`; D1 almacena únicamente el hash del token.
- Toda autenticación y autorización se verifica en el Worker; el frontend no es una frontera de seguridad.
- Los mensajes de usuario estarán en español de Colombia y no revelarán si existe una cuenta.
- Local, preview y production permanecen separados; no se usarán datos reales fuera de production.
- Se usarán Hono, Zod, Drizzle/D1, TypeScript estricto, Vitest, Testing Library y Playwright ya configurados por S-01.

## 3. Alcance de implementación

### 3.1 Incluido

1. Modelo de usuarios mínimo para autenticación, con roles `admin` y `vocalista`.
2. Modelo de sesiones con hash de token, vencimiento, revocación y última actividad.
3. Hash y verificación de contraseñas según el algoritmo y parámetros aprobados en las preguntas abiertas.
4. Bootstrap seguro de la única cuenta admin, sin exponer la contraseña en Git, logs ni respuestas HTTP.
5. `POST /api/auth/login` con validación Zod y mensaje neutral ante credenciales inválidas.
6. `GET /api/auth/me` para consultar la sesión actual sin revelar secretos.
7. `POST /api/auth/logout` para revocar la sesión actual y retirar la cookie.
8. Middleware Hono para obtener identidad, rol y usuario activo en handlers protegidos.
9. Renovación de sesión, expiración, revocación y rechazo de sesiones inválidas.
10. Limitación de intentos de inicio de sesión conforme al mecanismo aprobado.
11. Protección de solicitudes mutables conforme a la decisión aprobada sobre CSRF/origen.
12. Pruebas unitarias, de integración y E2E proporcionales al riesgo de autenticación.

### 3.2 Fuera de alcance

- Pantalla final de gestión de vocalistas y sus credenciales, que corresponde a S-03.
- Creación, edición, activación o desactivación de vocalistas desde un panel.
- Cambio de contraseña iniciado por el vocalista.
- Recuperación automática de contraseña.
- Inicio de sesión con Google o proveedores externos.
- Autorización específica de audios, evaluaciones, borradores o rutas administrativas de dominio.
- Registro de aperturas, reproducción, telemetría o actividad de escucha.
- Auditoría detallada de acciones de usuarios, salvo los eventos mínimos aprobados para seguridad.

## 4. Actores y permisos

| Actor                             | Capacidades en S-02                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Ministerio de Alabanza            | Iniciar sesión como `admin`, consultar su sesión y cerrarla. La gestión de vocalistas se especifica en S-03.                       |
| Vocalista                         | Iniciar sesión como `vocalista`, consultar su propia sesión y cerrarla.                                                            |
| Usuario no autenticado            | Intentar iniciar sesión y recibir respuestas neutrales; no acceder a contexto protegido.                                           |
| Operador de despliegue autorizado | Ejecutar el bootstrap inicial o reemplazo administrativo definido por la operación aprobada, sin consultar contraseñas existentes. |

No se crearán otros roles, administradores ni permisos parciales.

## 5. Flujos

### 5.1 Inicio de sesión

1. El cliente envía nombre de usuario y contraseña a `POST /api/auth/login` por HTTPS en entornos desplegados.
2. El Worker normaliza el identificador según la regla aprobada y aplica limitación de intentos antes de la verificación costosa.
3. El servidor busca la cuenta sin distinguir mayúsculas/minúsculas, verifica que esté activa y compara la contraseña con el hash almacenado.
4. Si la verificación falla, responde con el mensaje neutral aprobado y no indica si falló usuario, estado o contraseña.
5. Si es correcta, genera un token opaco criptográficamente aleatorio, almacena solo su hash y crea una sesión con vencimiento móvil de 30 días.
6. Responde sin token en el cuerpo y establece la cookie con los atributos aprobados.

### 5.2 Solicitud autenticada

1. El middleware obtiene la cookie de sesión.
2. Hashea el token recibido y busca una sesión no revocada y no vencida.
3. Verifica que el usuario exista y esté activo.
4. Renueva vencimiento y última actividad según la política aprobada.
5. Expone al handler únicamente el identificador y rol necesarios para autorización.
6. Si la sesión es inválida, responde como no autenticado sin revelar si la sesión existió.

### 5.3 Cierre de sesión

1. El cliente envía `POST /api/auth/logout` con la cookie actual.
2. El servidor revoca la sesión según la política aprobada, incluso si ya está vencida cuando sea posible.
3. Responde con éxito sin revelar datos y envía una instrucción para retirar la cookie.
4. Las solicitudes posteriores con el token revocado son rechazadas.

### 5.4 Invalidación administrativa

El reemplazo de contraseña y la desactivación de una cuenta deberán invalidar las sesiones correspondientes. La operación concreta pertenece a S-03, pero S-02 debe proporcionar la función transversal y sus restricciones. La cuenta admin no se podrá desactivar desde una operación de vocalista.

### 5.5 Bootstrap del admin

El sistema debe crear exactamente una cuenta `admin` con nombre visible **Ministerio de Alabanza**, mediante una herramienta local administrativa ejecutada por Santiago Viana contra D1 de producción. La herramienta solicita la contraseña de forma interactiva y oculta, falla si ya existe una cuenta admin activa y nunca expone ni guarda la contraseña fuera del hash almacenado en D1.

## 6. Contratos API propuestos

Los contratos siguientes son propuesta de S-02 y se vuelven definitivos solo después de resolver las preguntas abiertas y aprobar la spec.

### `POST /api/auth/login`

**Entrada JSON:**

```json
{
  "nombreUsuario": "texto",
  "contrasena": "texto"
}
```

**Éxito:** `200` con cuerpo mínimo:

```json
{
  "usuario": {
    "id": "id-opaco",
    "nombreUsuario": "username_normalized",
    "rol": "admin"
  }
}
```

La respuesta no incluye contraseña, hash, token, identificador de sesión, secreto, estado interno ni datos de otros usuarios.

**Error neutral definitivo:** `401` con:

```json
{
  "error": {
    "codigo": "CREDENCIALES_INVALIDAS",
    "mensaje": "Usuario o contraseña incorrectos."
  }
}
```

Las respuestas por cuenta inexistente, contraseña incorrecta o cuenta inactiva son idénticas.

Durante el bloqueo por rate limit responde `429`:

```json
{
  "error": {
    "codigo": "DEMASIADOS_INTENTOS",
    "mensaje": "Has realizado demasiados intentos. Intenta nuevamente en unos minutos."
  }
}
```

Si D1 no está disponible para consultar o actualizar el rate limit, responde `503`:

```json
{
  "error": {
    "codigo": "SERVICIO_NO_DISPONIBLE",
    "mensaje": "No fue posible iniciar sesión en este momento. Intenta nuevamente más tarde."
  }
}
```

### `GET /api/auth/me`

**Éxito:** `200` con la identidad mínima de la sesión actual, sin credenciales ni datos de otras cuentas.

**Sin sesión válida:** `401` con un error neutral y estable.

### `POST /api/auth/logout`

**Éxito:** `204` sin cuerpo, o el contrato alternativo aprobado en Q-S02-14. Debe retirar la cookie y revocar la sesión actual.

**Sin sesión:** la operación debe ser idempotente y no revelar información; se propone `204`.

### Rutas no autenticadas y protegidas

- `POST /api/auth/login` es público con limitación de intentos.
- `GET /api/auth/me` requiere una sesión válida.
- `POST /api/auth/logout` es idempotente y responde `204` incluso sin sesión válida.
- No se agregarán endpoints de usuarios, admin, audio, evaluaciones o borradores en S-02.
- Las rutas futuras deberán rechazar por defecto la ausencia de contexto autenticado y comprobar el rol en el Worker.

## 7. Modelo de datos afectado

### `users`

Campos mínimos propuestos:

- `id`: identificador interno no derivado del nombre de usuario.
- `username_normalized`: identificador único para autenticación, sin distinguir mayúsculas/minúsculas.
- `role`: `admin` o `vocalista`.
- `password_hash`: hash adaptativo con sal; nunca contraseña plana.
- `password_salt`: salt aleatorio de la contraseña.
- `password_algorithm`: algoritmo de hash.
- `password_parameters`: iteraciones y parámetros codificados.
- `status`: estado de acceso.
- `created_at` y `updated_at`.
- `password_changed_at` y `deactivated_at`.

`display_name` y datos de presentación se agregarán en S-03.

Las reglas definitivas del nombre de usuario, el identificador, el estado del admin y los campos adicionales quedan sujetas a Q-S02-05 y Q-S02-06.

### `sessions`

Campos mínimos propuestos:

- `id`: identificador de sesión.
- `user_id`: referencia a `users`.
- `token_hash`: hash del token opaco, único; nunca el token.
- `expires_at`: vencimiento absoluto de la sesión móvil.
- `last_activity_at`: última solicitud autenticada válida.
- `revoked_at`: nulo mientras la sesión sea válida.
- `created_at`.

Restricciones propuestas:

- `users.username_normalized` es único.
- `sessions.token_hash` es único.
- Una sesión revocada nunca vuelve a ser válida.
- Una sesión vencida nunca vuelve a ser válida.
- Las consultas de autenticación filtran usuario activo, no vencido y no revocado.
- El reemplazo de contraseña y la desactivación invalidan las sesiones requeridas de forma transaccional.

El rate limit tendrá una entidad separada con el identificador hash de la combinación IP + usuario normalizado, contador de fallos, inicio de ventana, bloqueo hasta y fechas de creación/actualización. La IP cruda no se persiste.

Los eventos mínimos de autenticación tendrán una entidad separada con tipo, actor/objetivo cuando ya sean conocidos, fecha UTC, contexto técnico mínimo y correlación temporal opcional. Se retienen 90 días.

S-02 no crea tablas de audios, preguntas, borradores, evaluaciones ni respuestas.

## 8. Validaciones y errores

- El nombre de usuario es obligatorio, se recorta, se convierte a minúsculas y debe cumplir `^[a-z0-9-]{3,40}$`.
- La contraseña es obligatoria y no se devuelve ni se registra.
- Las contraseñas nuevas deben cumplir mínimo 6 caracteres; S-02 no implementa la pantalla que las establece.
- JSON inválido, campos desconocidos o tipos incorrectos reciben un error español estable sin detalles técnicos.
- Nunca se devuelven SQL, stack traces, nombres de bindings, hashes, tokens ni mensajes crudos de Cloudflare.
- Sesión ausente, inválida, vencida, revocada o asociada a usuario inactivo se trata como no autenticada.
- El rate limit responde de forma neutral y no confirma existencia de una cuenta.
- Las solicitudes mutables validan `Origin`; si falta o no coincide exactamente con el origen del entorno, responden `403`.
- No se permite CORS ni `OPTIONS` para orígenes externos.

## 9. Seguridad

- El token de sesión se genera con una fuente criptográficamente segura y con longitud suficiente; no se deriva de usuario, hora ni contraseña.
- D1 almacena únicamente el hash del token.
- Production y preview usan `__Host-escuchando-mi-propia-voz-session` con `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sin `Domain` y duración renovable de 30 días. Local usa `escuchando-mi-propia-voz-session` y solo activa `Secure` cuando usa HTTPS.
- Los hash de contraseña usan PBKDF2-HMAC-SHA-256 mediante Web Crypto, con salt mínimo de 16 bytes y 100.000 iteraciones iniciales; el costo debe medirse en un Worker real antes de producción.
- El hash de sesión usa SHA-256 del token concatenado con `SESSION_PEPPER`; el pepper es secreto por entorno y su rotación revoca todas las sesiones.
- No se almacenan credenciales, tokens ni identidad sensible en `localStorage`.
- Las operaciones mutables usarán la protección CSRF/origen aprobada; `SameSite=Lax` por sí solo no se considerará decisión completa sin resolver Q-S02-16.
- La comparación de contraseñas será resistente a filtraciones y no permitirá respuestas diferenciadas por existencia de cuenta.
- Los logs de autenticación no incluirán contraseñas, tokens, hashes ni cuerpos completos de solicitudes.
- El diseño de limitación de intentos se almacena en D1 y no usa memoria del Worker como fuente de verdad ni servicios externos.
- Si D1 no está disponible para el rate limit, el login se deniega con `503`.
- La limpieza oportunista de sesiones y eventos no bloquea solicitudes normales y elimina solo registros fuera de sus periodos de retención.
- No se agregan servicios externos para hash, pepper, rate limit o limpieza.

El identificador persistido del rate limit es un hash de IP + `username_normalized` usando una clave/pepper de aplicación; la IP cruda nunca se guarda. Se permiten 5 fallos en 15 minutos; el sexto activa un bloqueo de 15 minutos y un login exitoso elimina contador y bloqueo.

Los eventos permitidos son `login_exitoso`, `login_fallido`, `login_bloqueado_rate_limit`, `logout`, `password_reemplazada_admin`, `sesion_revocada_por_cambio_clave`, `sesiones_revocadas_por_desactivacion`, `cuenta_desactivada`, `cuenta_activada` y `restablecimiento_admin_local`. Solo incluyen datos técnicos mínimos, sin contraseñas, hashes, tokens, cookies, IP cruda, audios, respuestas ni el usuario normalizado de intentos no autenticados. Se retienen 90 días.

## 10. Decisiones resueltas

Las preguntas bloqueantes fueron respondidas por Santiago Viana. Estas decisiones quedan incorporadas a S-02 y deben respetarse durante la implementación.

| ID       | Decisión                                                                                                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-S02-01 | El usuario inicial es `ministerio-alabanza`. El identificador se normaliza a minúsculas, sin espacios externos, y acepta solo `a-z`, `0-9` y `-`, con longitud de 3 a 40 caracteres.                                                                                                                     |
| Q-S02-02 | Bootstrap local controlado contra D1 de producción; no se usa migración con contraseña, endpoint público, seed versionado ni GitHub Actions. Falla si ya existe un admin activo.                                                                                                                         |
| Q-S02-03 | La contraseña inicial se introduce oculta en terminal, sin argumento, archivo, log, Git ni GitHub Actions. El hash se genera localmente.                                                                                                                                                                 |
| Q-S02-04 | El restablecimiento del admin se ejecuta mediante herramienta local, solicita una nueva contraseña oculta, actualiza solo el admin e invalida todas sus sesiones. No hay recuperación web, correo ni contraseña maestra.                                                                                 |
| Q-S02-05 | Se aprueba `username_normalized` como identificador técnico único, con la regla de normalización y caracteres indicada en Q-S02-01.                                                                                                                                                                      |
| Q-S02-06 | S-02 usa `id`, `role`, `username_normalized`, datos de contraseña, `status`, fechas de creación/actualización, `password_changed_at` y `deactivated_at`. `display_name` y datos de presentación quedan para S-03.                                                                                        |
| Q-S02-07 | Se usará PBKDF2-HMAC-SHA-256 mediante Web Crypto, hash derivado de 256 bits, salt aleatorio mínimo de 16 bytes y 100.000 iteraciones iniciales. El formato guarda algoritmo, iteraciones, salt y hash; se permitirá aumentar iteraciones. Debe medirse en un Worker real antes de fijarlo en producción. |
| Q-S02-08 | Se usará `SESSION_PEPPER` solo para `SHA-256(token + SESSION_PEPPER)`. Será secreto independiente por entorno; rotarlo invalida todas las sesiones. No se usa para contraseñas.                                                                                                                          |
| Q-S02-09 | Cookie de producción/preview: `__Host-escuchando-mi-propia-voz-session`.                                                                                                                                                                                                                                 |
| Q-S02-10 | Production/preview usan `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, sin `Domain` y con duración renovable de 30 días. Local usa `escuchando-mi-propia-voz-session`; `Secure` solo con HTTPS y sin prefijo `__Host-` en localhost.                                                                    |
| Q-S02-11 | Logout invalida únicamente la sesión actual.                                                                                                                                                                                                                                                             |
| Q-S02-12 | Credenciales inválidas o cuenta inactiva responden `401` con `{ "error": { "codigo": "CREDENCIALES_INVALIDAS", "mensaje": "Usuario o contraseña incorrectos." } }`.                                                                                                                                      |
| Q-S02-13 | Reemplazar una contraseña invalida inmediatamente todas las sesiones activas del usuario.                                                                                                                                                                                                                |
| Q-S02-14 | Logout es `POST /api/auth/logout`, idempotente, responde `204` incluso sin cookie o con sesión inválida.                                                                                                                                                                                                 |
| Q-S02-15 | Desactivar un vocalista invalida inmediatamente todas sus sesiones activas.                                                                                                                                                                                                                              |
| Q-S02-16 | Solicitudes `POST`, `PUT`, `PATCH` y `DELETE` validan `Origin` contra el origen exacto del entorno. Origin ausente o inválido responde `403`; no se usa token CSRF separado. No se permite CORS sin una nueva decisión aprobada.                                                                         |
| Q-S02-17 | Rate limit: 5 intentos fallidos en 15 minutos por hash de IP + `username_normalized`; el sexto intento fallido bloquea 15 minutos. Un login exitoso elimina contador y bloqueo. El bloqueo responde `429` con código `DEMASIADOS_INTENTOS` y mensaje neutral.                                            |
| Q-S02-18 | El rate limit se almacena en D1; no se usan KV, Durable Objects, Rate Limiting Binding, CAPTCHA ni servicios externos. No se guarda IP cruda.                                                                                                                                                            |
| Q-S02-19 | Si D1 o el almacenamiento del rate limit no está disponible, se deniega el login con `503`, código `SERVICIO_NO_DISPONIBLE` y mensaje neutral.                                                                                                                                                           |
| Q-S02-20 | No se permite CORS. SPA y API usan el mismo origen; no se envían `Access-Control-Allow-Origin` ni se habilita `OPTIONS` externo.                                                                                                                                                                         |
| Q-S02-21 | Limpieza oportunista limitada a una vez al día por entorno; elimina sesiones vencidas/revocadas de más de 30 días sin bloquear solicitudes. Se documenta revisión manual mensual.                                                                                                                        |
| Q-S02-22 | Se permiten eventos mínimos de autenticación sin secretos ni IP cruda, con retención de 90 días y limpieza diaria oportunista; se documenta revisión mensual.                                                                                                                                            |

## 11. Criterios de aceptación

S-02 se considerará implementada solo si, después de la aprobación formal de esta spec, se cumple todo lo siguiente:

1. Solo existen los roles `admin` y `vocalista`, y la cuenta admin es única. [A-14, A-15]
2. Las credenciales nunca se almacenan ni se transmiten en texto plano fuera de la solicitud HTTPS. [A-26]
3. Las contraseñas se verifican con el hash adaptativo y parámetros aprobados. [A-26]
4. Login correcto crea una sesión persistente de 30 días desde la última actividad. [A-27]
5. La cookie cumple todos los atributos aprobados y nunca expone el token a JavaScript. [A-28]
6. D1 almacena el hash del token, no el token original. [A-28]
7. `GET /api/auth/me` solo devuelve la identidad de la sesión actual. [A-17, A-29]
8. Logout revoca la sesión según la política aprobada y es idempotente. [A-28]
9. Desactivación y reemplazo de contraseña invalidan las sesiones correspondientes. [A-28]
10. Credenciales inválidas, cuentas inactivas y sesiones inválidas producen mensajes neutrales. [A-30]
11. El rate limit funciona de forma consistente entre solicitudes e instancias y tiene pruebas de abuso. [A-30]
12. Las rutas protegidas rechazan ausencia, expiración, revocación o cambio de usuario/rol. [A-29]
13. No existen endpoints ni tablas de dominio fuera del alcance de S-02. [A-02, A-03]
14. No hay secretos, tokens, contraseñas, datos reales ni hashes de producción en Git, logs o fixtures. [A-24]

## 12. Pruebas requeridas

### Unitarias

- Normalización y validación del nombre de usuario.
- Hash y verificación PBKDF2-HMAC-SHA-256, incluyendo rechazo de contraseñas menores de 6 caracteres.
- Generación de token y hash no reversible.
- Cálculo de vencimiento de 30 días y renovación por actividad.
- Rechazo de sesiones vencidas, revocadas o asociadas a usuario inactivo.
- Mensajes y contratos neutrales de error.
- Rate limit en D1: ventana, umbral, bloqueo, liberación y hash de correlación sin IP cruda.
- Validación estricta de `Origin` y ausencia de CORS.

### Integración

- Login correcto crea usuario y sesión sin devolver token.
- Login incorrecto no revela si el usuario existe.
- `me` devuelve solo la identidad propia.
- Logout revoca la sesión y no permite reutilizar el token.
- Renovación concurrente no acorta ni duplica incorrectamente la sesión.
- Cambio de contraseña y desactivación invalidan sesiones según la decisión aprobada.
- La migración contiene únicamente las entidades de S-02 y sus restricciones.
- D1 no disponible para rate limit deniega el login con `503`.
- Limpieza oportunista no elimina sesiones vigentes ni bloquea solicitudes normales.

### E2E

- Inicio de sesión admin y vocalista con datos ficticios.
- Persistencia al recargar y cierre/reapertura normal del navegador.
- Rechazo de contraseña incorrecta, cuenta inexistente e inactiva con mensaje neutral.
- Cierre de sesión y reutilización de una sesión revocada.
- Expiración simulada o controlada de sesión.
- Límite de intentos de login.
- Rechazo de solicitudes mutables con `Origin` ausente o no permitido.
- Ausencia de cabeceras CORS y rechazo de `OPTIONS` externo.
- Un usuario no autenticado no alcanza una ruta protegida.
- Un vocalista autenticado no obtiene contexto de admin alterando URL, cuerpo o estado del frontend.

## 13. Decisiones operativas que deben documentarse al implementar

Una vez aprobada S-02, la implementación deberá documentar:

- Diagrama o descripción del flujo de sesión decidido.
- Esquema Drizzle y migración revisable.
- Contratos definitivos de errores y cookies.
- Herramientas locales de bootstrap y restablecimiento del admin, sin incluir contraseñas.
- Medición del costo de 100.000 iteraciones PBKDF2 en un Worker real antes de production.
- Procedimiento para rotar `SESSION_PEPPER` e invalidar sesiones.
- Tarea de limpieza oportunista diaria y revisión manual mensual.
- Catálogo y retención de eventos de autenticación.
- Matriz de autorización transversal para S-03 y specs posteriores.
- Evidencia de pruebas y referencias de tareas, ramas y commits con IDs A-xx.

La implementación no puede ampliar el alcance hacia usuarios, panel, audio o evaluaciones.

## 14. Aprobación requerida

Con Q-S02-01 a Q-S02-22 resueltas, Santiago Viana debe aprobar esta versión con la frase:

> **Apruebo S-02 Autenticación y sesiones v0.1.0**

La aprobación de S-01 no autoriza implementar S-02.
