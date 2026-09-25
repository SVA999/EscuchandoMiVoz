# S-03 — Usuarios y admin

> **Estado:** APROBADA — autoriza implementar exclusivamente el alcance de esta spec.
> **Versión:** 0.1.0
> **SSOT de referencia:** `SSOT.md` v1.0.0
> **Cubre:** A-15, A-16, A-17, A-18, A-56
> **Depende de:** S-01 y S-02 aprobadas e implementadas en su alcance técnico
> **No cubre:** login, logout, cookies, rate limit, bootstrap/restablecimiento local del admin, gestión de audios, reproducción, borradores, evaluaciones ni comentarios.

## 1. Objetivo

Definir la administración de vocalistas por la única cuenta administrativa **Ministerio de Alabanza**. La spec establece las operaciones de creación, consulta, edición, activación, desactivación y reemplazo de contraseñas, con autorización en el Worker y sin permitir que estas operaciones creen o modifiquen cuentas admin.

S-02 conserva la propiedad del mecanismo transversal de autenticación, sesiones, cookies, rate limit, validación de `Origin` e invalidación de sesiones. S-03 consume ese contexto autenticado y agrega las reglas de dominio para administrar vocalistas.

## 2. Decisiones heredadas y límites

- Solo existen los roles `admin` y `vocalista`.
- Existe exactamente una cuenta admin: **Ministerio de Alabanza**, con usuario técnico inicial `ministerio-alabanza`.
- S-03 no crea, edita, desactiva ni cambia la contraseña del admin mediante endpoints del panel.
- Solo un admin autenticado puede ejecutar las operaciones de S-03.
- Un vocalista no puede listar, leer, modificar, activar, desactivar ni cambiar la contraseña de otro vocalista.
- Las contraseñas se entregan individualmente y cumplen la política aprobada por S-02: mínimo 6 caracteres, hash PBKDF2-HMAC-SHA-256, sin texto plano.
- Reemplazar una contraseña invalida inmediatamente todas las sesiones activas de la cuenta objetivo mediante la función transversal de S-02.
- Desactivar un vocalista invalida inmediatamente todas sus sesiones activas.
- Las operaciones mutables validan `Origin` conforme a S-02 y no habilitan CORS.
- S-03 no incorpora recuperación automática, Google OAuth, registro público ni cambio de contraseña iniciado por el vocalista.
- La administración de audios y sus estados se implementa en S-04; S-03 no inventa ni duplica ese modelo.
- `display_name` pertenece a `users`, es obligatorio al crear, editable únicamente por admin y no es identificador de login.
- `username_normalized` no cambia después de crear la cuenta; para otro login se desactiva la cuenta anterior y se crea una nueva.

## 3. Alcance de implementación

### 3.1 Incluido

1. Modelo de datos de presentación y administración que sea aprobado para `users`.
2. Listado administrativo de vocalistas.
3. Creación de vocalistas con usuario técnico y contraseña inicial.
4. Consulta del detalle de un vocalista autorizado.
5. Edición de los campos administrativos aprobados.
6. Activación y desactivación con confirmación explícita en la interfaz.
7. Reemplazo de contraseña por el admin, sin mostrar ni recuperar la anterior.
8. Invalidación inmediata de sesiones al desactivar o cambiar contraseña.
9. Interfaz administrativa completa de usuarios: lista, crear, detalle, editar nombre visible, activar, desactivar y reemplazar contraseña.
10. Mensajes y estados en español de Colombia, incluyendo el estado exacto sin audios cuando corresponda.
11. Registro de los eventos de seguridad ya definidos por S-02.
12. Pruebas unitarias, integración y E2E de autorización y aislamiento.

### 3.2 Fuera de alcance

- Login, logout, sesión, cookies, rate limit y bootstrap/restablecimiento del admin.
- Creación de una segunda cuenta admin o cualquier subrol.
- Carga, asignación, reemplazo, reproducción o eliminación de MP3.
- Lectura o modificación de borradores.
- Consulta o modificación de respuestas de autoevaluaciones.
- Comentarios, retroalimentación, chat o notificaciones.
- Recuperación de contraseña por correo, enlace o código.
- Cambio de contraseña iniciado por el vocalista.
- Métricas, rankings, puntajes o clasificación de personas.

## 4. Actores y permisos

| Actor                  | Capacidades en S-03                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Ministerio de Alabanza | Listar, crear, consultar, editar, activar, desactivar y reemplazar contraseña de vocalistas.                                          |
| Vocalista              | No tiene capacidades administrativas de S-03.                                                                                         |
| Usuario no autenticado | No puede consultar ni modificar vocalistas.                                                                                           |
| Operador de despliegue | No administra vocalistas mediante endpoints públicos; usa únicamente las herramientas operativas ya definidas por S-02 para el admin. |

Toda operación administrativa debe comprobar en el Worker que la sesión sea válida, el usuario esté activo y el rol sea exactamente `admin`.

## 5. Flujos

### 5.1 Crear vocalista

1. Admin abre la acción de crear vocalista.
2. Introduce los campos aprobados para el usuario y la contraseña inicial.
3. El servidor valida y normaliza el usuario antes de consultar o escribir.
4. El servidor verifica que no exista un usuario con el mismo `username_normalized`.
5. Genera el hash y salt con la política de S-02; nunca persiste la contraseña original.
6. Valida y persiste el `display_name` obligatorio.
7. Crea el usuario con rol `vocalista` y estado `active`.
8. Registra la activación según el catálogo de eventos aprobado.
9. No crea audios, borradores ni evaluaciones.

### 5.2 Consultar y listar vocalistas

El listado completo se ordena alfabéticamente por `display_name` y, en empate, por `username_normalized`. No tiene paginación, búsqueda ni filtros en el MVP. Solo muestra nombre visible y estado. Nunca devuelve hash, salt, parámetros de contraseña, tokens, sesiones ni eventos sensibles.

El detalle muestra únicamente `display_name`, `username_normalized`, estado, fecha de creación, fecha de última actualización si la UI la muestra y acciones disponibles. No muestra audios, borradores, evaluaciones ni respuestas.

### 5.3 Editar vocalista

La edición solo cambia `display_name`. No permite cambiar usuario normalizado, rol, estado, campos de seguridad, sesiones ni relaciones de dominio.

### 5.4 Activar vocalista

1. Admin solicita activar una cuenta vocalista inactiva.
2. El servidor comprueba que el objetivo existe y que su rol es `vocalista`.
3. Actualiza el estado y limpia `deactivated_at` según el modelo aprobado.
4. Registra `cuenta_activada`.
5. La activación no crea una sesión automáticamente.

### 5.5 Desactivar vocalista

1. Admin solicita desactivar una cuenta vocalista.
2. La interfaz exige confirmación explícita con texto español claro.
3. El servidor comprueba que el objetivo existe, es vocalista y no es la cuenta admin.
4. Actualiza el estado y `deactivated_at` en una transacción.
5. Invalida inmediatamente todas las sesiones mediante la función de S-02.
6. Registra `cuenta_desactivada` y `sesiones_revocadas_por_desactivacion`.
7. Conserva sin modificar audios, borradores y evaluaciones; no reasigna ni elimina información automáticamente.

La confirmación visual usa:

- Título: `Desactivar vocalista`.
- Mensaje: `¿Deseas desactivar a este vocalista? No podrá iniciar sesión, pero sus audios y evaluaciones se conservarán.`
- Acciones: `Cancelar` y `Sí, desactivar`.
- Éxito: `El vocalista fue desactivado.`

Si ya estaba inactivo, responde `204` sin error ni evento de transición duplicado.

### 5.6 Reemplazar contraseña

1. Admin abre la acción de reemplazar contraseña de un vocalista.
2. La interfaz solicita la nueva contraseña y confirmación sin mostrar la anterior.
3. El servidor valida mínimo 6 caracteres y genera hash localmente en el Worker.
4. Actualiza hash, salt, algoritmo, parámetros, fechas de cambio y `updated_at` en una transacción.
5. Revoca todas las sesiones activas del objetivo.
6. Registra `password_reemplazada_admin` y `sesiones_revocadas_por_cambio_clave`.
7. Nunca devuelve ni registra la contraseña.

## 6. Contratos API propuestos

Los contratos son propuesta y quedan sujetos a las preguntas abiertas y aprobación de esta spec.

### `GET /api/admin/vocalistas`

Requiere sesión `admin`.

Respuesta `200` propuesta:

```json
{
  "vocalistas": [
    {
      "id": "id-opaco",
      "nombreVisible": "Deisy López",
      "nombreUsuario": "deisy-lopez",
      "estado": "activo",
      "creadoEn": "fecha-utc"
    }
  ]
}
```

La lista completa se ordena por `nombreVisible` y luego `nombreUsuario`; no tiene paginación, búsqueda ni filtros en el MVP.

### `POST /api/admin/vocalistas`

Entrada propuesta:

```json
{
  "nombreUsuario": "deisy-lopez",
  "nombreVisible": "Deisy López",
  "contrasena": "texto-secreto"
}
```

La respuesta no incluye contraseña, hash, salt ni sesiones.

### `GET /api/admin/vocalistas/:id`

Requiere sesión `admin`. Devuelve únicamente `nombreVisible`, `nombreUsuario`, estado, fechas visibles y acciones disponibles. No devuelve credenciales, audios, borradores, evaluaciones ni respuestas.

### `PATCH /api/admin/vocalistas/:id`

Solo acepta `{ "nombreVisible": "texto" }`. No acepta `role`, usuario normalizado, contraseña, estado, identificadores internos ni campos de seguridad.

### `POST /api/admin/vocalistas/:id/activar`

Activa únicamente una cuenta `vocalista`. Debe ser idempotente si ya está activa, según Q-S03-08.

### `POST /api/admin/vocalistas/:id/desactivar`

Desactiva únicamente una cuenta `vocalista`, invalida sesiones y debe ser idempotente según Q-S03-08. La confirmación visual no sustituye la comprobación en servidor.

### `POST /api/admin/vocalistas/:id/password`

Reemplaza la contraseña de una cuenta `vocalista`, invalida todas sus sesiones y no devuelve la contraseña. Debe ser idempotente respecto a reintentos de la solicitud según Q-S03-08.

### Errores comunes

- `401`: sesión ausente, vencida, revocada o usuario inactivo.
- `403`: sesión válida sin rol `admin`, intento de operar la cuenta admin o `Origin` no permitido.
- `404`: objetivo vocalista inexistente, con `{ "error": { "codigo": "VOCALISTA_NO_ENCONTRADO", "mensaje": "No encontramos el vocalista solicitado." } }`.
- `409`: nombre de usuario ya existente o conflicto de estado.
- `422`: entrada inválida según las reglas de validación.
- `503`: dependencia D1 no disponible, sin revelar detalles internos.

Los errores no deben incluir SQL, stack traces, hashes, tokens, nombres de bindings ni secretos.

## 7. Modelo de datos afectado

### `users`

S-03 conserva los campos de autenticación definidos por S-02 y puede agregar únicamente los campos de presentación aprobados:

- `id`
- `role`
- `username_normalized`
- `password_hash`
- `password_salt`
- `password_algorithm`
- `password_parameters`
- `status`
- `created_at`
- `updated_at`
- `password_changed_at`
- `deactivated_at`
- `display_name`: obligatorio y editable por admin.

S-03 no puede modificar la unicidad de `username_normalized`, los roles, el algoritmo de hash ni el contrato de sesiones de S-02.

### Relaciones futuras

- Los audios se relacionarán con vocalistas en S-04.
- Los borradores y evaluaciones se relacionarán con vocalistas en S-05.
- S-03 no crea tablas de audios, borradores, evaluaciones, respuestas ni comentarios.

## 8. Validaciones y errores

- `nombreUsuario` se normaliza con la regla de S-02: minúsculas, sin espacios externos, solo `a-z`, `0-9` y `-`, longitud de 3 a 40.
- El usuario normalizado debe ser único sin distinguir mayúsculas/minúsculas.
- La contraseña nueva tiene mínimo 6 caracteres y nunca se registra.
- El servidor fuerza `role = vocalista` al crear; el cliente no puede elegir el rol.
- El servidor rechaza cualquier intento de operar la cuenta admin desde S-03.
- El servidor rechaza modificación de campos no permitidos, incluidos hashes, salts, sesiones y fechas de seguridad.
- Activar, desactivar y reemplazar contraseña comprueban el estado actual de la cuenta en el servidor.
- `display_name` debe tener entre 2 y 80 caracteres, permitir letras Unicode, tildes, ñ, espacios, apóstrofe y guion medio, sin números, símbolos adicionales, espacios externos ni espacios consecutivos.
- `display_name` se muestra exactamente como nombre visible y nunca funciona como identificador de login.
- Los mensajes son simples, en español de Colombia y no exponen detalles técnicos.

## 9. Seguridad y privacidad

- Todas las rutas requieren autenticación y autorización `admin` en el Worker.
- No se confía en ocultar botones, rutas cliente, IDs ni cuerpos enviados por el navegador.
- La cuenta admin no puede ser creada, duplicada, desactivada ni modificada por endpoints de vocalistas.
- Un vocalista no puede inferir el listado, detalle, estado o credenciales de otro vocalista.
- El detalle administrativo nunca devuelve contraseñas, hashes, salts, parámetros, tokens ni sesiones.
- El reemplazo de contraseña y la desactivación usan transacciones y revocación de sesiones de S-02.
- Las acciones destructivas o sensibles requieren confirmación visual, pero el servidor vuelve a validar la operación.
- Los eventos permitidos se limitan al catálogo de S-02; no se registran contraseñas, tokens, IP cruda, audios ni respuestas.
- No se agregan comentarios, retroalimentación, métricas ni clasificaciones.

## 10. Decisiones resueltas

Las preguntas Q-S03-01 a Q-S03-12 fueron respondidas por Santiago Viana y quedan incorporadas a esta spec.

| ID       | Decisión                                                                                                                                                                                                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-S03-01 | `display_name` se agrega a `users`, es obligatorio al crear y editable por admin. Tiene 2 a 80 caracteres; permite letras Unicode, tildes, ñ, espacios, apóstrofe y guion medio; no permite números, otros símbolos, espacios externos ni espacios consecutivos. Se muestra como nombre visible y no es login. |
| Q-S03-02 | `username_normalized` no cambia después de crear. Para otro login se desactiva la cuenta anterior y se crea una nueva.                                                                                                                                                                                         |
| Q-S03-03 | El único campo editable después de crear es `display_name`. Estado solo cambia mediante activar/desactivar; los campos técnicos, seguridad, sesiones y relaciones quedan protegidos.                                                                                                                           |
| Q-S03-04 | Lista completa, sin paginación, búsqueda ni filtros. Orden: `display_name`, luego `username_normalized`; volumen esperado de 20 a 50 vocalistas.                                                                                                                                                               |
| Q-S03-05 | La interfaz administrativa completa de usuarios se implementa en S-03: lista, crear, detalle, editar nombre visible, activar, desactivar y reemplazar contraseña.                                                                                                                                              |
| Q-S03-06 | Desactivar conserva audios, borradores y evaluaciones sin modificar ni reasignar automáticamente. El vocalista no puede iniciar sesión ni acceder a recursos mientras esté inactivo.                                                                                                                           |
| Q-S03-07 | Reactivar conserva todos los datos y relaciones. No recupera sesiones revocadas ni crea una sesión automática.                                                                                                                                                                                                 |
| Q-S03-08 | Activar, desactivar y reemplazar contraseña son idempotentes ante reintentos seguros. Activar/desactivar repetidos responden `204`; el reemplazo siempre aplica la nueva contraseña e invalida sesiones.                                                                                                       |
| Q-S03-09 | Objetivo inexistente responde `404` con código `VOCALISTA_NO_ENCONTRADO` y mensaje `No encontramos el vocalista solicitado.`.                                                                                                                                                                                  |
| Q-S03-10 | El detalle solo muestra datos de S-03: nombre visible, usuario, estado, fechas y acciones. Audios son de S-04; evaluaciones son de S-06.                                                                                                                                                                       |
| Q-S03-11 | El estado inicial es `active`; puede iniciar sesión inmediatamente con las credenciales entregadas por canal privado.                                                                                                                                                                                          |
| Q-S03-12 | Modal: título `Desactivar vocalista`; mensaje `¿Deseas desactivar a este vocalista? No podrá iniciar sesión, pero sus audios y evaluaciones se conservarán.`; acciones `Cancelar` y `Sí, desactivar`. Éxito: `El vocalista fue desactivado.`                                                                   |

## 11. Criterios de aceptación

S-03 se considerará implementada solo si, después de la aprobación formal de esta spec, se cumple todo lo siguiente:

1. Solo un admin activo puede operar las rutas administrativas. [A-15, A-16]
2. S-03 solo crea y administra cuentas `vocalista`; no crea ni modifica admins. [A-14, A-15]
3. Crear un vocalista persiste solo el hash de su contraseña y aplica las validaciones aprobadas. [A-16, A-26]
4. `display_name` se valida, persiste y muestra como nombre visible sin funcionar como login. [A-56]
5. El listado y detalle nunca exponen secretos, sesiones ni datos de otros usuarios no autorizados. [A-16, A-17, A-29]
6. Editar solo modifica `display_name` y conserva el rol `vocalista`. [A-56]
7. Activar y desactivar actualizan el estado correcto y registran los eventos permitidos. [A-56]
8. Desactivar invalida inmediatamente las sesiones del vocalista y conserva sus relaciones. [A-28, A-56]
9. Reemplazar contraseña invalida inmediatamente todas las sesiones del vocalista. [A-16, A-28, A-56]
10. Un vocalista no puede alcanzar ninguna operación administrativa aunque altere URL, ID, cuerpo o estado del frontend. [A-17, A-29]
11. Un vocalista sin audios muestra exactamente `Aún no tienes audios asignados.` cuando el contrato de audios lo informe. [A-18]
12. No se implementan audios, borradores, evaluaciones, comentarios ni métricas en S-03. [A-13, A-59]
13. Todas las pruebas de autorización, persistencia, invalidación y errores pasan. [A-29, A-70, A-71]

## 12. Pruebas requeridas

### Unitarias

- Normalización y validación de campos de vocalista.
- Rechazo de roles distintos de `vocalista` en creación.
- Rechazo de edición de campos protegidos.
- Validación de contraseña mínima y delegación al hash de S-02.
- Transiciones de estado activa/inactiva.
- Idempotencia de activar, desactivar y reemplazar contraseña según la decisión aprobada.

### Integración

- Admin puede crear, listar, consultar y editar vocalistas.
- Admin puede activar, desactivar y reemplazar contraseñas.
- Cada operación sensible invalida las sesiones requeridas.
- La cuenta admin no puede ser operada desde endpoints de S-03.
- Un vocalista recibe `403` en todas las rutas administrativas.
- Un usuario no autenticado recibe `401`.
- Usuario duplicado recibe el conflicto aprobado.
- Datos de contraseña y sesión nunca aparecen en respuestas.

### E2E

- Flujo administrativo completo con datos ficticios.
- Aislamiento de vocalista frente a panel y endpoints admin.
- Creación de vocalista e inicio de sesión con la contraseña definida por admin.
- Reemplazo de contraseña invalida la sesión anterior.
- Desactivación invalida la sesión inmediatamente.
- Reactivación conserva o modifica relaciones según la decisión aprobada.
- Confirmaciones visuales de desactivación y reemplazo de contraseña.
- Estados de listado, vacío, error y conflicto en móvil y escritorio.

## 13. Documentación y trazabilidad

Al implementar S-03 se actualizarán:

- `specs/README.md` con estado aprobado/implementado.
- `docs/decisiones-arquitectura.md` con campos, contratos y decisiones de desactivación.
- `docs/runbook-operacion.md` con el procedimiento administrativo autorizado.
- Migraciones Drizzle revisables, sin tocar entidades fuera del alcance.
- Pruebas y pull request con referencias `A-15`, `A-16`, `A-17`, `A-18`, `A-29`, `A-56`.

## 14. Aprobación requerida

Con Q-S03-01 a Q-S03-12 resueltas, Santiago Viana debe aprobar esta spec con la frase:

> **Apruebo S-03 Usuarios y admin v0.1.0**

La aprobación de S-02 no autoriza implementar S-03.
