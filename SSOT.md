# SSOT — Escuchando mi propia voz

> **Estado:** ESPECIFICACIÓN APROBADA PARA INICIAR DESARROLLO GUIADO POR SPECS.
>
> **Versión:** 1.0.0  
> **Propietario del producto y aprobación:** Santiago Viana  
> **Última aprobación funcional:** 24 de septiembre de 2026  
> **Fuente única de verdad (SSOT):** este archivo reemplaza las versiones exploratorias anteriores para desarrollo. Si hay contradicción entre este archivo y un documento previo, prevalece este archivo.

---

## 1. Reglas de desarrollo

### A-01 — Fuente de verdad

Este documento es la fuente única de verdad para arquitectura, alcance, requisitos, decisiones e implementación. No se desarrollará una funcionalidad que no esté especificada aquí o en una spec derivada aprobada que referencie esta SSOT.

### A-02 — No código sin spec

El agente no escribe código, migraciones, infraestructura ejecutable ni pruebas de una funcionalidad hasta que exista una spec derivada aprobada para dicha funcionalidad.

### A-03 — Ambigüedad

Si algo no está definido aquí o una spec derivada no lo resuelve, el agente debe formular una pregunta concreta y esperar la respuesta. No debe inventar comportamiento, pantallas, datos, permisos, nombres, límites, textos, dependencias ni decisiones técnicas.

### A-04 — Trazabilidad

Cada requisito tiene un identificador `A-xx`. Toda spec derivada, tarea, rama, pull request, commit y prueba debe referenciar al menos un ID aplicable.

Ejemplos:

- Spec: `specs/S-03-autenticacion.md` → `Cubre: A-14, A-15, A-16, A-17`.
- Tarea: `T-014 — Implementar sesión persistente [A-16, A-17]`.
- Rama: `feat/A-31-carga-mp3`.
- Commit: `feat(A-31,A-32): agrega carga validada de MP3`.
- Prueba: `A-45 — un vocalista no accede a audio ajeno`.

### A-05 — Idioma y tono

Toda la interfaz, validación, estados vacíos, errores, mensajes de confirmación, documentación funcional y textos para usuarios estarán en español de Colombia, con lenguaje simple, claro, amable y no técnico.

### A-06 — Experiencia móvil

La experiencia será responsive y **mobile-first**. Los controles táctiles, reproductor, opciones de evaluación, carga administrativa y estados deben funcionar correctamente en pantallas móviles antes de optimizar escritorio.

### A-07 — No inventar métricas o juicios

La app no dará diagnósticos de salud o técnica vocal, no clasificará personas y no calculará puntajes, promedios, porcentajes, rankings ni etiquetas como «apto/no apto».

### A-08 — Control de cambios

Todo cambio de alcance, requisito o arquitectura requiere:

1. Propuesta escrita con IDs afectados.
2. Aprobación explícita de Santiago Viana.
3. Actualización versionada de esta SSOT.
4. Actualización de specs/tareas/pruebas afectadas antes de cambiar código.

---

## 2. Producto y alcance

### A-09 — Nombre y propósito

El nombre visible de la aplicación es **Escuchando mi voz**. Es una aplicación web temporal para uso interno del Ministerio de Alabanza que permite a vocalistas escuchar sus propios MP3 y realizar una autoevaluación detallada de su participación por cada audio.

### A-10 — Propósito pedagógico

La aplicación ayuda a cada persona a tomar conciencia de su canto y de aspectos que puede practicar. No es una audición, un ranking, una evaluación profesional ni una herramienta para juzgar personas.

### A-11 — Usuarios esperados

Se esperan entre 20 y 50 vocalistas. No hay menores de edad. Un vocalista puede tener muchos audios, uno o ninguno.

### A-12 — Duración y cierre

El uso principal estimado es de 2 a 3 meses. No se construirá una función automática para apagar o desactivar toda la aplicación. El cierre se realizará manualmente según `docs/procedimiento-cierre-manual.md`.

### A-13 — Funcionalidades excluidas

Quedan fuera del MVP:

- Comentarios, retroalimentación, chat, respuestas entre usuarios y notificaciones.
- Registro de apertura, contador de reproducción o validación de escucha completa.
- Puntajes, promedios, rankings, gráficos y etiquetas de aprobación.
- Registro público, recuperación automática de contraseña, cambio obligatorio de contraseña e inicio de sesión con Google.
- Descarga de MP3 desde la interfaz.
- Aplicación nativa móvil.
- Integración activa con Google Drive después de la copia inicial a R2.

---

## 3. Roles y permisos

### A-14 — Roles

Existen solo dos roles: `admin` y `vocalista`.

### A-15 — Cuenta administrativa única

Existe una única cuenta administrativa. Su nombre visible es **Ministerio de Alabanza** y Santiago Viana la administra. No existen otros administradores, subroles ni permisos parciales en el MVP.

### A-16 — Capacidades de Ministerio de Alabanza

El rol `admin` puede:

- Crear, editar, activar y desactivar vocalistas.
- Definir o reemplazar contraseñas de vocalistas.
- Cargar MP3.
- Ver audios sin asignar y asignarlos a un vocalista.
- Consultar y reproducir cualquier audio desde el panel.
- Consultar solo autoevaluaciones enviadas.
- Filtrar evaluaciones por vocalista.
- Eliminar lógicamente una evaluación enviada para permitir una nueva.
- Eliminar un borrador sin leer sus respuestas, solo para liberar un audio bloqueado.

### A-17 — Capacidades de vocalista

El rol `vocalista` puede:

- Iniciar sesión con credenciales entregadas individualmente por WhatsApp.
- Ver solo sus propios audios asignados.
- Reproducir sus propios audios sin obligación de realizar una evaluación.
- Reproducir el audio mientras responde la evaluación.
- Crear y continuar borradores propios.
- Enviar una autoevaluación definitiva.
- Consultar solo sus propias respuestas enviadas.

El rol `vocalista` no puede ver ni operar datos, audios, borradores o evaluaciones de otras personas; tampoco puede editar/eliminar evaluaciones enviadas, eliminar borradores, descargar MP3 ni acceder al panel administrativo.

### A-18 — Estado sin audios

Un vocalista sin audios asignados verá exactamente el mensaje: **«Aún no tienes audios asignados.»**

---

## 4. Infraestructura y arquitectura

### A-19 — Monolito desplegable

La aplicación será un monolito desplegable en **un Cloudflare Worker**: frontend web, API, autenticación, autorización, carga de audios y reproducción protegida viven en el mismo proyecto/despliegue. No se usarán microservicios ni un backend independiente.

### A-20 — Plataforma

La infraestructura principal será Cloudflare:

| Componente         | Servicio                              | Responsabilidad                                                      |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------- |
| Aplicación         | Cloudflare Workers                    | SPA, API, sesiones, autorización y lógica de negocio                 |
| Datos              | Cloudflare D1                         | Usuarios, sesiones, metadatos, borradores, evaluaciones y respuestas |
| Audio              | Cloudflare R2 privado, clase Standard | Copias MP3 usadas por la app                                         |
| Respaldo de origen | Google Drive personal                 | MP3 originales; no se integra a la app en ejecución                  |
| Código             | Repositorio Git privado               | Código, migraciones, specs, pruebas y documentación                  |

Cloudflare permite conectar D1 y R2 al Worker mediante bindings; los bindings son capacidades explícitas de acceso y se simulan localmente por defecto. [web:124]

### A-21 — Costo y límites

El objetivo es costo $0 durante el uso esperado, pero no existe garantía de costo ilimitado: Cloudflare puede cambiar precios/límites y el propietario debe monitorear consumo. El nivel gratuito publicado de Workers incluye 100.000 solicitudes/día y 10 ms de CPU por solicitud; D1 Free tiene una base máxima de 500 MB y R2 Free publica 10 GB-mes Standard, 1 millón de operaciones Class A y 10 millones de operaciones Class B mensuales. El banco estimado actual es de aproximadamente 30 MP3 / 300 MB, por lo que entra en el almacenamiento R2 informado. [web:119][web:125][web:77]

### A-22 — Estructura tecnológica aprobada

Se usará:

| Capa                          | Tecnología                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| Lenguaje                      | TypeScript con modo estricto                                     |
| UI                            | React + Vite                                                     |
| Runtime y despliegue          | Cloudflare Workers                                               |
| Adaptación Vite/Workers       | `@cloudflare/vite-plugin` + Wrangler                             |
| Rutas cliente                 | React Router                                                     |
| API HTTP                      | Hono, dentro del mismo Worker                                    |
| Base de datos                 | Cloudflare D1 / SQLite                                           |
| Consultas y migraciones       | Drizzle ORM + `drizzle-kit`, usando D1 como destino              |
| Validación de entradas        | Zod                                                              |
| Formularios cliente           | React Hook Form + Zod resolver                                   |
| Estilos                       | Tailwind CSS                                                     |
| Componentes accesibles        | Radix UI, solo donde aporte accesibilidad o interacción compleja |
| Pruebas unitarias/componentes | Vitest + Testing Library                                         |
| Pruebas E2E                   | Playwright                                                       |
| Formato/lint                  | ESLint + Prettier                                                |
| CI                            | GitHub Actions                                                   |

La guía oficial de Cloudflare documenta React + Vite, el plugin de Cloudflare, `wrangler`, `wrangler.jsonc` y un Worker en el mismo proyecto para servir una API con bindings. [web:121]

No sustituir, añadir ni cambiar una tecnología aprobada sin propuesta y aprobación siguiendo A-08. Dependencias de bajo nivel estrictamente necesarias y compatibles pueden proponerse, pero el agente debe explicarlas y solicitar aprobación antes de incorporarlas.

### A-23 — Configuración y entornos

Habrá tres entornos: `local`, `preview` y `production`.

- `local`: desarrollo en equipo local; D1/R2 simulados cuando sea viable.
- `preview`: despliegue automático de pull request para validar flujos antes de producción. No usará datos reales del ministerio.
- `production`: único entorno con usuarios reales, MP3 reales y datos reales.

No usar datos personales o audios reales fuera de `production`, salvo aprobación explícita de Santiago Viana.

### A-24 — Secretos

Secretos, tokens, claves y credenciales no se guardan en código, commits, archivos versionados, issues, logs ni capturas. Se administran en secretos/variables de Cloudflare o GitHub según el entorno. El repositorio incluye solo archivos de ejemplo sin secretos.

### A-25 — Propiedad

Santiago Viana controla la cuenta Cloudflare, el repositorio, el despliegue, los secretos y las decisiones de producción.

---

## 5. Seguridad y autenticación

### A-26 — Contraseñas

Las contraseñas se almacenan exclusivamente como hash adaptativo con sal; nunca en texto plano. Ministerio puede establecer o reemplazar una contraseña, pero no consultar la anterior. La longitud mínima aprobada es de **6 caracteres**. No se exigirán símbolos, mayúsculas ni números.

Guardar contraseñas en texto plano queda prohibido. OWASP recomienda hashes fuertes y lentos, como Argon2, en lugar de texto plano. [web:98][web:99]

### A-27 — Sesión persistente

La sesión debe sobrevivir recargas y cierres/reaperturas normales del navegador durante **30 días desde la última actividad**. Toda solicitud autenticada válida renueva la vigencia móvil de 30 días.

### A-28 — Cookie y token de sesión

La sesión se implementará con token aleatorio opaco en cookie `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` y, si el entorno lo admite, prefijo `__Host-`. D1 guarda solo el hash del token. No se guardarán tokens, contraseñas ni datos sensibles en `localStorage`.

Debe existir una acción visible **«Cerrar sesión»**. Cerrar sesión, desactivar un usuario o reemplazar una contraseña debe invalidar las sesiones correspondientes según la spec de autenticación aprobada. NIST recomienda cookies HTTPS inaccesibles a JavaScript cuando sea posible y tokens opacos; OWASP también exige expiración en sesiones persistentes. [web:91][web:92]

### A-29 — Autorización en servidor

Toda autorización se verifica en la API/Worker. Ocultar controles en el frontend nunca es suficiente. Un vocalista no puede listar, leer, reproducir, modificar ni inferir recursos ajenos aunque altere URL, cuerpo de solicitud o identificador.

### A-30 — Protección de abuso

La spec de autenticación deberá incluir limitación de intentos de inicio de sesión y mensajes de error neutrales que no revelen si existe un usuario. La tecnología/mecanismo concreto se propone antes de implementación según los límites gratuitos y requiere aprobación si añade un servicio no contemplado en A-22.

---

## 6. Gestión y protección de audio

### A-31 — Origen y almacenamiento

Los MP3 originales permanecen en Google Drive personal como respaldo. Antes del uso, los archivos se copian a un bucket privado R2. La aplicación no usa Drive para reproducir, listar, descargar o autenticar.

### A-32 — Bucket privado y transmisión

R2 no tendrá acceso público. El navegador nunca recibe URL permanente del objeto R2. La reproducción usa una ruta autenticada del Worker que verifica rol y asignación antes de transmitir bytes. Debe soportar solicitudes HTTP Range para adelantar y retroceder; R2 puede operar desde un Worker mediante bindings. [web:73][web:124]

### A-33 — Sin descarga desde UI

No existirá botón, enlace ni flujo de descarga de MP3. Esto no pretende ni promete DRM: un usuario autorizado puede capturar el audio que reproduce.

### A-34 — Formato y tamaño

El panel acepta solo MP3 con extensión `.mp3` y tipo MIME validado en servidor. El límite funcional aprobado es **30 MB por archivo**.

Antes de implementar la carga, el agente debe validar el límite técnico efectivo navegador → Worker → R2 para este enfoque. Si dicho límite impide 30 MB, el agente debe informarlo y pedir decisión; no puede modificar el límite por cuenta propia.

### A-35 — Carga y clave interna

Al cargar, el servidor genera una clave R2 interna no predecible. La asignación o autorización nunca se infiere del nombre del archivo. El archivo recién cargado queda en estado `sin_asignar`.

### A-36 — Nombre visible

Las tarjetas y el detalle muestran el nombre original del archivo. No existe nombre visible editable en el MVP.

### A-37 — Asignación única

Cada registro de audio puede estar asignado a exactamente un vocalista o permanecer sin asignar. Una persona puede tener cero, uno o muchos audios.

### A-38 — Estados de audio

Los estados definidos son:

| Estado                  | Significado                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `sin_asignar`           | MP3 cargado; ningún vocalista puede verlo                          |
| `asignado_pendiente`    | Asignado; sin evaluación activa ni borrador activo                 |
| `asignado_con_borrador` | Asignado; existe borrador activo del vocalista                     |
| `evaluado`              | Asignado; existe evaluación activa enviada                         |
| `no_disponible`         | El registro existe, pero el objeto R2 no se puede leer o no existe |

Un vocalista no ve el estado `sin_asignar`. Si un audio está `no_disponible`, verá exactamente: **«Este audio no está disponible en este momento.»** Una evaluación enviada relacionada sigue visible.

### A-39 — Bloqueo de reasignar/reemplazar

Un audio con evaluación activa enviada **o** borrador activo no puede reasignarse ni reemplazarse. El panel explica el bloqueo y ofrece únicamente las acciones administrativas definidas: eliminar evaluación activa o eliminar borrador sin leerlo.

### A-40 — No eliminación física ordinaria

La eliminación física de un MP3 de R2 no será una acción ordinaria del MVP. Si el objeto falta o no puede leerse, se marca `no_disponible`. La eliminación física solo se contempla en el procedimiento de cierre manual.

---

## 7. Autoevaluaciones y borradores

### A-41 — Unidad de evaluación

Una autoevaluación corresponde a un único audio asignado y a un único vocalista.

### A-42 — Acceso independiente

Un vocalista puede abrir y reproducir un audio sin iniciar una autoevaluación. El audio también debe poder reproducirse dentro de la pantalla de autoevaluación sin salir de ella ni perder el borrador.

### A-43 — Sin telemetría de escucha

No se registra apertura, duración reproducida, porcentaje escuchado ni finalización de audio. No se valida que una persona haya escuchado todo el archivo.

### A-44 — Respuestas cerradas

Todas las preguntas son obligatorias y cerradas. No existen preguntas abiertas, campos de texto ni comentarios de vocalistas.

### A-45 — Sin puntuación

Las respuestas no generan puntajes, porcentajes, promedios, tendencias, rankings ni conclusiones automáticas.

### A-46 — Borrador automático

Cada selección de respuesta se guarda automáticamente en D1, sin botón «Guardar borrador». Debe sobrevivir recargas, cierres del navegador y uso desde otro dispositivo mientras la sesión y el usuario sean válidos.

Solo puede existir un borrador activo por combinación `vocalista + audio` mientras no exista una evaluación activa enviada.

### A-47 — Privacidad de borradores

Ministerio de Alabanza nunca puede ver contenido ni respuestas de borradores. Solo puede conocer el estado de que un audio **tiene borrador** para aplicar el bloqueo A-39.

### A-48 — Eliminar borrador para liberar audio

Ministerio puede eliminar un borrador sin leer su contenido exclusivamente para liberar un audio bloqueado y permitir reemplazo o reasignación.

Flujo obligatorio:

1. El panel muestra el estado «Tiene borrador», sin respuestas ni detalle.
2. Ministerio pulsa **«Eliminar borrador para liberar audio»**.
3. Se muestra un modal con este aviso: **«Se eliminarán las respuestas sin enviar de este audio. El vocalista deberá comenzar de nuevo. Esta acción no se puede deshacer».**
4. Ministerio confirma explícitamente.
5. El sistema elimina el borrador y sus respuestas, deja el audio en estado pendiente y habilita las operaciones bloqueadas.

### A-49 — Envío definitivo

No habrá pantalla de resumen. Cuando todas las preguntas estén respondidas, aparece **«Enviar autoevaluación»**. Al pulsarlo, se muestra este modal:

> **¿Deseas enviar tu autoevaluación?**
>
> Después de enviarla no podrás cambiar tus respuestas desde tu cuenta. Ministerio de Alabanza podrá verlas.
>
> [Cancelar] [Sí, enviar]

Al confirmar, el servidor verifica autorización, asignación, completitud de las respuestas y ausencia de otra evaluación activa. El borrador se convierte en evaluación enviada de forma atómica; doble clic, reintento o recarga no pueden crear duplicados.

### A-50 — Evaluación enviada

Un vocalista no puede editar ni eliminar una evaluación enviada. Puede ver solo sus propias respuestas enviadas. Ministerio puede ver solo las evaluaciones enviadas, filtradas por vocalista.

### A-51 — Eliminación lógica de evaluación

Ministerio puede eliminar lógicamente una evaluación enviada mediante confirmación explícita. La evaluación eliminada deja de mostrarse al vocalista y no bloquea que ese mismo vocalista cree/envíe otra evaluación para el mismo audio.

Al eliminar lógicamente una evaluación, el nuevo borrador empieza vacío: no se prellenan respuestas de la evaluación eliminada.

### A-52 — Versionado del formulario

Cada evaluación enviada conserva la versión, textos y orden del formulario aplicado al momento de envío. Cambios futuros al formulario no cambian respuestas históricas.

---

## 8. Formulario aprobado

### A-53 — Introducción

Antes de las preguntas, mostrar exactamente:

> **Este espacio es para crecer en nuestro Ministerio, no para juzgarte.** Escucha tu audio con calma y responde con honestidad. Identificar lo que ya haces bien y lo que puedes practicar te ayuda a avanzar.

### A-54 — Opciones

Cada pregunta muestra exactamente estas cinco opciones:

1. **Sí, la mayor parte del tiempo**
2. **A veces**
3. **Quiero trabajarlo más**
4. **No logro identificarlo en este audio**
5. **No aplica en este audio**

Las opciones 4 y 5 no se presentan ni tratan como respuestas negativas y no generan calificaciones.

### A-55 — Preguntas

|   # | Bloque                            | Pregunta                                                                                                                                                                                           | Ayuda                                                                                       |
| --: | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
|   1 | Preparación y seguridad           | **Conocía la letra durante toda mi participación y pude cantarla sin depender de otras personas.**                                                                                                 | Piensa si pudiste concentrarte en cantar sin tener que seguir constantemente a alguien más. |
|   2 | Preparación y seguridad           | **Canté de una forma natural y cómoda, sin sentir que estaba forzando mi voz.**                                                                                                                    | Responde según cómo te sentiste al cantar.                                                  |
|   3 | Preparación y seguridad           | **Me sentí con seguridad para cantar mi parte, aunque hubiera otras voces alrededor.**                                                                                                             | —                                                                                           |
|   4 | Afinación y voz                   | **Las notas que canté se mantuvieron cerca de la melodía que me correspondía.**                                                                                                                    | Escucha si tu voz se mantuvo afinada o si se fue más alta o más baja de lo esperado.        |
|   5 | Afinación y voz                   | **Cuando tuve una nota difícil o me desafiné, pude volver a encontrar mi melodía.**                                                                                                                | Si no ocurrió una situación así en este audio, marca “No aplica en este audio”.             |
|   6 | Afinación y voz                   | **En las notas largas, mantuve la afinación hasta terminar la nota.**                                                                                                                              | Si no hubo notas largas, marca “No aplica en este audio”.                                   |
|   7 | Mi voz y la armonía               | **Identifiqué qué voz debía hacer: primera, segunda o tercera.**                                                                                                                                   | Piensa en la voz que te fue asignada para esta canción.                                     |
|   8 | Mi voz y la armonía               | **Realicé de forma consciente la voz que me correspondía e identifiqué los momentos oportunos para cantarla, en lugar de pasarme a otra voz por inercia o por intentar improvisar en el momento.** | —                                                                                           |
|   9 | Mi voz y la armonía               | **Mantuve mi línea melódica (voz) mientras escuchaba las otras voces.**                                                                                                                            | —                                                                                           |
|  10 | Mi voz y la armonía               | **Reconozco que la armonía que hice se integró con las demás voces.**                                                                                                                              | Si no hubo armonía o no puedes reconocerlo en este audio, marca la opción correspondiente.  |
|  11 | Tiempo e integración              | **Entré y terminé de cantar en los momentos que correspondían.**                                                                                                                                   | —                                                                                           |
|  12 | Tiempo e integración              | **Mantuve el ritmo sin adelantarme ni quedarme atrás.**                                                                                                                                            | —                                                                                           |
|  13 | Tiempo e integración              | **Escuché las otras voces y ajusté mi participación para integrarme al grupo.**                                                                                                                    | —                                                                                           |
|  14 | Tiempo e integración              | **Mi volumen se integró al grupo sin sobresalir demasiado ni desaparecer.**                                                                                                                        | —                                                                                           |
|  15 | Claridad, expresión y respiración | **Se entendieron las palabras que canté.**                                                                                                                                                         | —                                                                                           |
|  16 | Claridad, expresión y respiración | **No canté toda la canción con la misma intensidad; adapté mi volumen a los distintos momentos de la canción.**                                                                                    | —                                                                                           |
|  17 | Claridad, expresión y respiración | **Respiré en momentos que me permitieron completar las frases sin cortar palabras o ideas importantes.**                                                                                           | —                                                                                           |
|  18 | Claridad, expresión y respiración | **Pude terminar las frases sin quedarme sin aire de una forma que afectara mi canto.**                                                                                                             | —                                                                                           |

No se añadirá, quitará, reordenará ni reescribirá ninguna pregunta u opción sin actualización aprobada de la SSOT conforme a A-08.

---

## 9. Panel administrativo

### A-56 — Gestión de vocalistas

El panel permite crear, editar, activar/desactivar vocalistas y reemplazar sus contraseñas. El detalle de cada vocalista muestra sus propios audios y estados.

### A-57 — Gestión de audios

El panel permite cargar MP3, ver audios sin asignar/asignados, asignar un audio a una persona, ver su estado, reproducirlo mediante la misma protección y aplicar las restricciones A-39.

### A-58 — Gestión de evaluaciones

El filtro principal requerido es por **persona**. Dentro de una persona, se muestran sus audios y estado: `pendiente`, `con borrador`, `enviado` o `eliminado lógicamente`.

Ministerio solo puede abrir respuestas enviadas. Puede eliminar lógicamente una evaluación con una confirmación que explique que el vocalista podrá responder nuevamente.

### A-59 — Sin comentarios

No hay pantallas, endpoints, tablas, botones ni operaciones de comentarios o retroalimentación.

---

## 10. Datos, integridad y persistencia

### A-60 — Entidades mínimas

El diseño relacional incluye como mínimo:

| Entidad                  | Propósito                                                                     |
| ------------------------ | ----------------------------------------------------------------------------- |
| `users`                  | Vocalistas y cuenta admin; estado, rol y hash de contraseña                   |
| `sessions`               | Token hash, usuario, vencimiento, revocación y última actividad               |
| `audio_files`            | Clave R2, nombre original, tipo, tamaño, estado y vocalista asignado opcional |
| `questionnaire_versions` | Versiones del formulario y texto de introducción                              |
| `questions`              | Preguntas, bloque, orden, ayuda y estado                                      |
| `evaluation_drafts`      | Borrador por vocalista/audio/version                                          |
| `draft_answers`          | Selecciones del borrador                                                      |
| `self_evaluations`       | Evaluación enviada, versión, fecha y estado lógico                            |
| `answers`                | Selecciones definitivas por pregunta/evaluación                               |

No existen entidades de aperturas, reproducciones, comentarios o retroalimentaciones.

### A-61 — Restricciones

- `nombre_usuario` es único sin distinguir mayúsculas/minúsculas.
- Un audio se asigna a cero o un vocalista; un vocalista puede tener muchos audios.
- Solo existe una evaluación **activa** por combinación `vocalista + audio`.
- Una evaluación eliminada lógicamente no bloquea otra evaluación activa para el mismo par.
- Solo existe un borrador activo por `vocalista + audio` mientras no exista evaluación activa enviada.
- Borradores, envío y eliminaciones deben usar transacciones y restricciones de base de datos que eviten duplicados o estados contradictorios.
- No se eliminan físicamente respuestas/evaluaciones durante la operación normal salvo borradores eliminados conforme a A-48.

### A-62 — Migraciones y datos semilla

Las migraciones D1 son versionadas, revisables e idempotentes cuando aplique. Los datos semilla de desarrollo/preview deben ser ficticios. Nunca incluir usuarios reales, MP3 reales, contraseñas reales ni respuestas reales en Git.

---

## 11. Diseño y accesibilidad

### A-63 — Estilo visual

El diseño usa azules oscuros, beige y degradados suaves como inspiración estética. La prioridad es limpieza, legibilidad, contraste adecuado, jerarquía clara y una experiencia amable; la identidad visual no debe complicar la implementación.

### A-64 — Formularios y acciones irreversibles

Las opciones de respuesta y botones deben ser táctiles, claros y con estados visibles. Acciones destructivas o irreversibles —enviar evaluación, eliminar evaluación y eliminar borrador— deben requerir modal de confirmación con texto comprensible.

### A-65 — Estados y errores

Cargas, vacíos, errores de red, archivos no disponibles, errores de autenticación y validaciones deben tener estado visible y texto español simple. No exponer detalles técnicos, secretos, rutas internas ni mensajes crudos de infraestructura al usuario.

### A-66 — Accesibilidad mínima

La interfaz debe funcionar con teclado, foco visible, etiquetas semánticas, contraste suficiente, áreas táctiles adecuadas y mensajes de error asociados al control correspondiente. Componentes como modales deben manejar foco y cierre accesible.

---

## 12. Desarrollo guiado por specs

### A-67 — Estructura documental

El repositorio debe contener esta estructura mínima:

```text
README.md
SSOT.md
specs/
  S-01-fundacion-y-entornos.md
  S-02-autenticacion-y-sesiones.md
  S-03-usuarios-y-admin.md
  S-04-audios-y-R2.md
  S-05-autoevaluacion-y-borradores.md
  S-06-panel-evaluaciones.md
  S-07-diseno-y-accesibilidad.md
  S-08-pruebas-y-despliegue.md
docs/
  procedimiento-cierre-manual.md
  decisiones-arquitectura.md
  runbook-operacion.md
migrations/
```

`SSOT.md` será una copia controlada de este documento. Las specs derivadas no pueden contradecir la SSOT y deben indicar los IDs que cubren.

### A-68 — Orden de specs

El agente debe redactar, pedir aprobación y luego implementar en este orden:

1. `S-01-fundacion-y-entornos` — A-01 a A-08, A-19 a A-25, A-62, A-67.
2. `S-02-autenticacion-y-sesiones` — A-14 a A-18, A-26 a A-30.
3. `S-03-usuarios-y-admin` — A-15 a A-18, A-56.
4. `S-04-audios-y-R2` — A-31 a A-40, A-57.
5. `S-05-autoevaluacion-y-borradores` — A-41 a A-55, A-60 a A-61.
6. `S-06-panel-evaluaciones` — A-16, A-50 a A-51, A-58 a A-59.
7. `S-07-diseno-y-accesibilidad` — A-05 a A-07, A-63 a A-66.
8. `S-08-pruebas-y-despliegue` — todos los criterios aplicables, A-21 a A-25, A-62, A-69 a A-72.

Un documento de spec derivada debe incluir: objetivo, IDs cubiertos, fuera de alcance, actores, flujos, contratos API, modelo de datos afectado, validaciones, errores, seguridad, criterios de aceptación, pruebas y preguntas abiertas. No se implementa hasta que Santiago Viana apruebe la spec derivada.

### A-69 — Commits

Cada commit debe ser atómico, comprensible y referenciar IDs aplicables. Convención:

```text
<tipo>(<ids>): <descripción en español>
```

Tipos permitidos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `ci`, `security`.

Ejemplos:

```text
feat(A-26,A-27): agrega inicio de sesión y sesión persistente
feat(A-34,A-35): valida carga de MP3 y genera clave R2 privada
test(A-29,A-32): cubre acceso denegado a audio no asignado
docs(A-12): agrega procedimiento de cierre manual
```

### A-70 — Pruebas obligatorias

Cada requisito implementado debe tener evidencia de prueba proporcional al riesgo: unitaria, integración o E2E. Requisitos de seguridad, autorización, persistencia, carga y envío definitivo requieren pruebas automatizadas de integración/E2E además de unitarias cuando corresponda.

### A-71 — Criterios mínimos de calidad

No se puede declarar una spec implementada si fallan lint, verificación de tipos, migraciones, pruebas requeridas o pruebas E2E aplicables. No se despliega a producción sin revisar manualmente móvil, autenticación, autorización de audio y flujo de envío.

### A-72 — CI/CD

GitHub Actions debe ejecutar al menos instalación reproducible, lint, typecheck y pruebas en cada pull request. Los despliegues de preview no usarán datos reales. Producción requiere aprobación manual de Santiago Viana y validación de los criterios de aceptación de la spec correspondiente.

---

## 13. Criterios globales de aceptación

### A-73 — Privacidad de audio

Un vocalista no puede listar, abrir, reproducir ni obtener un audio de otro vocalista aunque modifique una URL, ID, cuerpo de solicitud o estado del frontend.

### A-74 — Privacidad de R2

Los objetos de R2 no se exponen por URL pública. Solo se reproducen desde una ruta autenticada y autorizada del Worker.

### A-75 — Audio y evaluación

Un vocalista puede reproducir audio sin evaluar y puede seguir reproduciéndolo mientras responde el formulario.

### A-76 — Borrador persistente

Seleccionar una respuesta persiste el borrador. Al recargar o volver a iniciar sesión durante la vigencia de sesión, las respuestas elegidas permanecen disponibles.

### A-77 — Borrador privado

Ministerio no puede ver contenido de borradores; solo ve el estado que bloquea operaciones de audio.

### A-78 — Envío único

El modal de envío comunica su carácter definitivo. Tras confirmar, hay una sola evaluación activa para el vocalista/audio y el vocalista no puede editarla.

### A-79 — Nueva evaluación tras eliminación lógica

Ministerio puede eliminar lógicamente una evaluación activa. Luego, el vocalista puede crear y enviar una evaluación nueva, vacía, sin que la eliminada bloquee el flujo.

### A-80 — Bloqueos de audio

Un audio con borrador o evaluación activa no puede reemplazarse ni reasignarse hasta que se elimine el registro que lo bloquea por la acción administrativa autorizada.

### A-81 — Panel de evaluaciones

Ministerio puede filtrar por persona, ver sus audios y abrir exclusivamente sus respuestas enviadas.

### A-82 — Formulario exacto

La app presenta exactamente las 18 preguntas y las cinco opciones aprobadas en A-53 a A-55.

### A-83 — Experiencia y lenguaje

La app funciona correctamente en móvil, se comunica en español de Colombia y sostiene una interfaz limpia basada en azul oscuro, beige y degradados sin comprometer legibilidad.

---

## 14. Operación y cierre

### A-84 — Documento de cierre

El repositorio debe incluir `docs/procedimiento-cierre-manual.md`, basado en el procedimiento aprobado, con dos rutas: retirar acceso conservando temporalmente los datos o exportar/eliminar definitivamente.

### A-85 — Preservación de Drive

El procedimiento de cierre nunca elimina ni modifica los MP3 originales de Google Drive. Solo cubre copias R2, datos D1, Worker, secretos, sesiones y despliegue.

### A-86 — Pasos mínimos de cierre

Cuando Santiago Viana lo autorice, el procedimiento documenta como mínimo: verificar Drive, exportar D1 opcionalmente, revocar sesiones, retirar Worker, vaciar/eliminar objetos y bucket R2, eliminar D1 si corresponde, revocar secretos/tokens y verificar que la URL/credenciales ya no dan acceso. Cloudflare documenta exportación D1, eliminación de objetos/buckets R2 y eliminación de secretos de Workers. [web:108][web:107][web:109]

---

## 15. Inicio del desarrollo

### A-87 — Primer paso obligatorio

Antes de generar código, el agente debe crear y presentar para aprobación la spec derivada **`specs/S-01-fundacion-y-entornos.md`**. Debe cubrir el proyecto React/Vite + Worker, estructura de repositorio, entornos, bindings D1/R2, variables/secretos, estrategia de migraciones, datos ficticios, CI, preview y validación técnica del límite de carga de 30 MB.

### A-88 — Preguntas pendientes en S-01

Antes de codificar S-01, el agente debe confirmar o preguntar únicamente lo que no esté resuelto, incluyendo como mínimo:

- Nombre exacto del repositorio Git privado: https://github.com/SVA999/EscuchandoMiVoz.
- Cuenta/organización de GitHub donde se alojará.
- Nombre exacto deseado del Worker y subdominio `workers.dev` disponible(escuchando-mivoz).
- Nombre exacto del bucket R2 (escuchando-mivoz) y base D1(db-escuchando-mivoz) en Cloudflare.
- Gestor de paquetes preferido: `pnpm` propuesto; confirmado
- Si se habilitará facturación/una tarjeta en Cloudflare para acceder a R2 y cómo se configurarán alertas/límites para no exceder el presupuesto.
- Resultado de la validación técnica de la carga de 30 MB antes de implementar el módulo A-34.

Después de que Santiago Viana apruebe `S-01`, se puede iniciar código solo de los requisitos que esta cubra. Cada spec posterior sigue A-68 y requiere su propia aprobación.

---

## 16. Aprobación de esta SSOT

Esta SSOT está aprobada como marco de desarrollo guiado por specs por la aprobación previa de la especificación v0.6 y la instrucción actual de consolidarla. Los módulos concretos siguen bloqueados hasta aprobar sus specs derivadas conforme a A-02 y A-87.
