# S-02 — Autenticación y sesiones

> **Estado:** PENDIENTE DE APROBACIÓN — no autoriza escribir código, migraciones ni infraestructura ejecutable.
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

El sistema debe crear exactamente una cuenta `admin` con nombre visible **Ministerio de Alabanza**, de forma idempotente y sin contraseña versionada. El mecanismo concreto queda bloqueado hasta responder Q-S02-01 a Q-S02-04.

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
    "nombreVisible": "texto",
    "rol": "admin"
  }
}
```

La respuesta no incluye contraseña, hash, token, identificador de sesión, secreto, estado interno ni datos de otros usuarios.

**Error neutral propuesto:** `401` con:

```json
{
  "error": "No fue posible iniciar sesión. Verifica tus credenciales."
}
```

Las respuestas por cuenta inexistente, contraseña incorrecta o cuenta inactiva no deben permitir distinguir la causa. El estado HTTP y el texto final quedan sujetos a Q-S02-12.

### `GET /api/auth/me`

**Éxito:** `200` con la identidad mínima de la sesión actual, sin credenciales ni datos de otras cuentas.

**Sin sesión válida:** `401` con un error neutral y estable.

### `POST /api/auth/logout`

**Éxito:** `204` sin cuerpo, o el contrato alternativo aprobado en Q-S02-14. Debe retirar la cookie y revocar la sesión actual.

**Sin sesión:** la operación debe ser idempotente y no revelar información; se propone `204`.

### Rutas no autenticadas y protegidas

- `POST /api/auth/login` es público con limitación de intentos.
- `GET /api/auth/me` y `POST /api/auth/logout` requieren o toleran sesión según el contrato anterior.
- No se agregarán endpoints de usuarios, admin, audio, evaluaciones o borradores en S-02.
- Las rutas futuras deberán rechazar por defecto la ausencia de contexto autenticado y comprobar el rol en el Worker.

## 7. Modelo de datos afectado

### `users`

Campos mínimos propuestos:

- `id`: identificador interno no derivado del nombre de usuario.
- `username_normalized`: identificador único para autenticación, sin distinguir mayúsculas/minúsculas.
- `display_name`: nombre visible.
- `role`: `admin` o `vocalista`.
- `password_hash`: hash adaptativo con sal; nunca contraseña plana.
- `is_active`: estado de acceso.
- `created_at` y `updated_at`.

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

S-02 no crea tablas de audios, preguntas, borradores, evaluaciones ni respuestas.

## 8. Validaciones y errores

- El nombre de usuario es obligatorio y se normaliza sin alterar el valor visible.
- La contraseña es obligatoria y no se devuelve ni se registra.
- Las contraseñas nuevas deben cumplir mínimo 6 caracteres; S-02 no implementa la pantalla que las establece.
- JSON inválido, campos desconocidos o tipos incorrectos reciben un error español estable sin detalles técnicos.
- Nunca se devuelven SQL, stack traces, nombres de bindings, hashes, tokens ni mensajes crudos de Cloudflare.
- Sesión ausente, inválida, vencida, revocada o asociada a usuario inactivo se trata como no autenticada.
- El rate limit responde de forma neutral y no confirma existencia de una cuenta.

## 9. Seguridad

- El token de sesión se genera con una fuente criptográficamente segura y con longitud suficiente; no se deriva de usuario, hora ni contraseña.
- D1 almacena únicamente el hash del token.
- La cookie será `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` y usará prefijo `__Host-` en production si la decisión de entorno lo confirma.
- No se almacenan credenciales, tokens ni identidad sensible en `localStorage`.
- Las operaciones mutables usarán la protección CSRF/origen aprobada; `SameSite=Lax` por sí solo no se considerará decisión completa sin resolver Q-S02-16.
- La comparación de contraseñas será resistente a filtraciones y no permitirá respuestas diferenciadas por existencia de cuenta.
- Los logs de autenticación no incluirán contraseñas, tokens, hashes ni cuerpos completos de solicitudes.
- El diseño de limitación de intentos debe funcionar entre instancias y no depender exclusivamente de memoria del Worker.
- El mecanismo de hash, pepper, rate limit y limpieza de sesiones no añadirá servicios externos sin propuesta y aprobación conforme a A-08 y A-22.

## 10. Preguntas abiertas bloqueantes

S-02 no puede aprobarse ni implementarse hasta responder estas decisiones. Las respuestas deben quedar incorporadas en una versión posterior de esta spec.

| ID       | Pregunta                                                                                     | Respuesta requerida                                              |
| -------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Q-S02-01 | ¿Cuál será el `nombre_usuario` inicial de la cuenta **Ministerio de Alabanza**?              | Texto exacto                                                     |
| Q-S02-02 | ¿Cómo se crea la cuenta admin inicial?                                                       | Bootstrap operativo, migración controlada u otra opción aprobada |
| Q-S02-03 | ¿Dónde se entrega/configura la contraseña inicial del admin sin guardarla en Git o logs?     | Procedimiento operativo                                          |
| Q-S02-04 | ¿Cómo se reemplaza la contraseña del admin si se pierde el acceso al panel?                  | Procedimiento operativo autorizado                               |
| Q-S02-05 | ¿Se aprueba `username_normalized` como identificador de login y qué caracteres/largo acepta? | Regla exacta                                                     |
| Q-S02-06 | ¿Qué campos adicionales de `users` son necesarios en S-02 y cuáles se dejan para S-03?       | Lista de campos                                                  |
| Q-S02-07 | ¿Qué algoritmo y parámetros de hash se aprueban?                                             | Algoritmo, variante y costos; debe ser compatible con Workers    |
| Q-S02-08 | ¿Se usará `SESSION_PEPPER`?                                                                  | Sí/no; si sí, mezcla, almacenamiento y rotación                  |
| Q-S02-09 | ¿Cuál será el nombre exacto de la cookie de sesión?                                          | Nombre exacto                                                    |
| Q-S02-10 | ¿Se usará cookie `__Host-` en production y una excepción controlada para local?              | Sí/no y regla por entorno                                        |
| Q-S02-11 | ¿Cerrar sesión invalida solo la sesión actual o todas las sesiones del usuario?              | Una opción                                                       |
| Q-S02-12 | ¿Qué estado HTTP y texto final tendrá el error de credenciales inválidas o cuenta inactiva?  | Contrato exacto                                                  |
| Q-S02-13 | ¿Reemplazar contraseña invalida todas las sesiones del usuario?                              | Sí/no                                                            |
| Q-S02-14 | ¿El contrato de logout será `204` idempotente incluso sin sesión?                            | Sí/no y alternativa                                              |
| Q-S02-15 | ¿Desactivar un vocalista invalida inmediatamente todas sus sesiones?                         | Sí/no                                                            |
| Q-S02-16 | ¿Qué protección CSRF/origen se aprueba para solicitudes mutables?                            | Token, validación de `Origin`/`Referer`, combinación u otra      |
| Q-S02-17 | ¿Cuál será el rate limit de login?                                                           | Límite, ventana, clave, bloqueo y respuesta                      |
| Q-S02-18 | ¿Dónde se almacenará el rate limit?                                                          | D1, mecanismo Cloudflare aprobado u otra opción                  |
| Q-S02-19 | ¿Qué ocurre si el almacenamiento del rate limit no está disponible?                          | Denegar, degradar controladamente u otra regla                   |
| Q-S02-20 | ¿Se permitirá CORS?                                                                          | No, o lista exacta de orígenes por entorno                       |
| Q-S02-21 | ¿Cómo y cuándo se limpiarán sesiones expiradas/revocadas?                                    | Política operativa                                               |
| Q-S02-22 | ¿Qué eventos mínimos de autenticación pueden registrarse sin datos sensibles?                | Lista de eventos y retención                                     |

## 11. Criterios de aceptación

S-02 se considerará implementada solo si, después de aprobar las preguntas abiertas, se cumple todo lo siguiente:

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
- Hash y verificación de contraseña, incluyendo rechazo de contraseñas menores de 6 caracteres.
- Generación de token y hash no reversible.
- Cálculo de vencimiento de 30 días y renovación por actividad.
- Rechazo de sesiones vencidas, revocadas o asociadas a usuario inactivo.
- Mensajes y contratos neutrales de error.
- Rate limit: ventana, umbral, bloqueo y liberación.

### Integración

- Login correcto crea usuario y sesión sin devolver token.
- Login incorrecto no revela si el usuario existe.
- `me` devuelve solo la identidad propia.
- Logout revoca la sesión y no permite reutilizar el token.
- Renovación concurrente no acorta ni duplica incorrectamente la sesión.
- Cambio de contraseña y desactivación invalidan sesiones según la decisión aprobada.
- La migración contiene únicamente las entidades de S-02 y sus restricciones.

### E2E

- Inicio de sesión admin y vocalista con datos ficticios.
- Persistencia al recargar y cierre/reapertura normal del navegador.
- Rechazo de contraseña incorrecta, cuenta inexistente e inactiva con mensaje neutral.
- Cierre de sesión y reutilización de una sesión revocada.
- Expiración simulada o controlada de sesión.
- Límite de intentos de login.
- Un usuario no autenticado no alcanza una ruta protegida.
- Un vocalista autenticado no obtiene contexto de admin alterando URL, cuerpo o estado del frontend.

## 13. Preguntas de implementación posteriores a la aprobación

Una vez respondidas las preguntas bloqueantes y aprobada S-02, se deberá actualizar esta spec con:

- Diagrama o descripción del flujo de sesión decidido.
- Esquema Drizzle y migración revisable.
- Contratos definitivos de errores y cookies.
- Procedimiento de bootstrap y operación del admin.
- Matriz de autorización transversal para S-03 y specs posteriores.
- Evidencia de pruebas y referencias de tareas, ramas y commits con IDs A-xx.

Hasta entonces, no se deben crear tablas, endpoints de autenticación, cookies, hashes, rate limiting ni secretos operativos.

## 14. Aprobación requerida

Después de resolver Q-S02-01 a Q-S02-22, Santiago Viana debe aprobar esta versión o una versión posterior con la frase:

> **Apruebo S-02 Autenticación y sesiones v0.1.0**

La aprobación de S-01 no autoriza implementar S-02.
