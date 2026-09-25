# S-01 — Fundación y entornos

> **Estado:** APROBADA — autoriza implementar exclusivamente el alcance de esta spec.  
> **Versión:** 0.1.0  
> **SSOT de referencia:** `SSOT.md` v1.0.0  
> **Cubre:** A-01, A-02, A-03, A-04, A-05, A-06, A-08, A-19, A-20, A-21, A-22, A-23, A-24, A-25, A-34, A-62, A-67, A-68, A-69, A-70, A-71, A-72, A-84, A-85, A-86, A-87, A-88  
> **No cubre:** autenticación funcional, usuarios, carga de MP3 real, reproducción, R2 operativo con archivos reales, borradores, formulario, evaluaciones ni panel administrativo.

---

## 1. Objetivo

Definir y dejar aprobado el fundamento técnico del monolito **Escuchando mi voz** antes de implementar cualquier funcionalidad de producto. Esta spec establece el repositorio, la estructura de carpetas, las tecnologías, los tres entornos, el esquema de configuración, los bindings de Cloudflare, la estrategia de migraciones, los datos ficticios, las reglas de secretos, la calidad automática, el CI y la validación técnica previa para el límite de carga de 30 MB.

La implementación de esta spec, una vez aprobada, puede crear el esqueleto del proyecto y automatizaciones de calidad, pero **no** puede implementar pantallas de negocio, inicio de sesión, usuarios reales, carga real de MP3, audio, formulario ni lógica de evaluación.

---

## 2. Decisiones heredadas de SSOT

| Tema                         | Decisión vigente                                                  |
| ---------------------------- | ----------------------------------------------------------------- |
| Tipo de sistema              | Monolito desplegable: frontend y API en un solo Cloudflare Worker |
| Frontend                     | React + Vite + TypeScript estricto                                |
| API                          | Hono dentro del mismo Worker                                      |
| Persistencia                 | Cloudflare D1 / SQLite                                            |
| Objetos de audio             | Cloudflare R2 privado, clase Standard                             |
| ORM y migraciones            | Drizzle ORM + drizzle-kit                                         |
| Validación                   | Zod                                                               |
| Formularios                  | React Hook Form + Zod resolver                                    |
| Estilos                      | Tailwind CSS                                                      |
| Componentes interactivos     | Radix UI solo cuando aporte accesibilidad/interacción compleja    |
| Unitarias/componentes        | Vitest + Testing Library                                          |
| E2E                          | Playwright                                                        |
| Estilo y calidad             | ESLint + Prettier                                                 |
| CI                           | GitHub Actions                                                    |
| Código                       | Repositorio Git privado                                           |
| Gestor de paquetes propuesto | `pnpm`, pendiente de confirmación                                 |
| Entornos                     | `local`, `preview`, `production`                                  |
| Datos reales                 | Solo en `production`                                              |
| Idioma                       | Español de Colombia, simple y no técnico                          |
| Propietario                  | Santiago Viana                                                    |

### Decisiones confirmadas para implementar

- Repositorio: `https://github.com/SVA999/EscuchandoMiVoz`.
- Cuenta u organización de GitHub: `SVA999`.
- Worker/subdominio de trabajo: `escuchando-mivoz`.
- Bucket R2 de trabajo: `escuchando-mivoz`.
- Base D1 de trabajo: `db-escuchando-mivoz`.
- Gestor de paquetes: `pnpm`.
- Control de gasto: revisión manual de consumo usando únicamente el nivel gratuito; no se asume facturación habilitada.
- Preview: no se habilita una URL pública temporal.
- Recursos por entorno: se aceptan sufijos diferenciados cuando sean necesarios.
- Creación de recursos Cloudflare: Wrangler, cuando corresponda y exista autorización operativa.
- Primera migración D1: vacía o exclusivamente técnica, sin tablas de dominio.

Cloudflare documenta una integración React + Vite para Workers mediante `@cloudflare/vite-plugin` y Wrangler. El plugin detecta por defecto un archivo `wrangler.jsonc`, `wrangler.json` o `wrangler.toml` en la raíz; el proyecto usará `wrangler.jsonc`. [web:121][web:131][web:136]

---

## 3. Alcance de implementación de S-01

### 3.1 Incluido al implementar S-01

1. Inicializar un repositorio privado con TypeScript estricto, React, Vite y configuración de Cloudflare Workers.
2. Configurar Hono como capa de API bajo prefijo `/api` sin endpoints de negocio.
3. Configurar Tailwind CSS, ESLint, Prettier, Vitest, Testing Library y Playwright.
4. Crear estructura de documentación, specs, código, pruebas y migraciones.
5. Crear configuración de `local`, `preview` y `production` sin secretos reales versionados.
6. Declarar bindings de D1 y R2 por entorno, dejando IDs/recursos reales solo en configuración segura de cada entorno.
7. Establecer Drizzle como fuente de esquema y generar una migración inicial **vacía o exclusivamente técnica**, sin tablas de usuarios, audios, sesiones, evaluaciones o respuestas hasta aprobación de sus specs respectivas.
8. Crear datos ficticios de desarrollo que no incluyan datos de personas reales, contraseñas reales, MP3 reales, enlaces de Drive ni respuestas reales.
9. Configurar GitHub Actions para ejecutar instalación reproducible, lint, typecheck y pruebas en pull requests.
10. Crear mecanismo de preview para pull requests, sin datos reales y sin acceso a recursos de producción.
11. Documentar el procedimiento manual de cierre aprobado, sin ejecutarlo.
12. Realizar y documentar la validación técnica de carga de MP3 de 30 MB **antes** de aprobar o implementar S-04.

### 3.2 Expresamente excluido al implementar S-01

- Pantalla terminada de inicio de sesión.
- Hash de contraseñas, creación de sesión, cookies o autorización.
- Tablas finales de usuarios/sesiones/audios/evaluaciones.
- Carga de archivos en R2 desde navegador o panel.
- Listado, reproducción, descarga o streaming de audio.
- Formularios de autoevaluación, preguntas, borradores y envío.
- Panel de Ministerio de Alabanza.
- Uso de nombres, credenciales, audios, evaluaciones o datos reales.
- Despliegue de cualquier funcionalidad a producción.

---

## 4. Decisiones confirmadas

Las preguntas de esta sección fueron respondidas por Santiago Viana antes de iniciar la implementación. Los nombres de recursos son valores de trabajo y deben verificarse por disponibilidad antes de crear recursos remotos.

| ID       | Pregunta                                  | Respuesta requerida                                     |
| -------- | ----------------------------------------- | ------------------------------------------------------- |
| Q-S01-01 | Nombre exacto del repositorio Git privado | `https://github.com/SVA999/EscuchandoMiVoz`             |
| Q-S01-02 | Cuenta u organización de GitHub           | `SVA999`                                                |
| Q-S01-03 | Gestor de paquetes                        | `pnpm`                                                  |
| Q-S01-04 | Worker y subdominio `workers.dev`         | `escuchando-mivoz`, sujeto a disponibilidad             |
| Q-S01-05 | Bucket R2 privado de producción           | `escuchando-mivoz`, sujeto a disponibilidad             |
| Q-S01-06 | Base D1 de producción                     | `db-escuchando-mivoz`, sujeto a disponibilidad          |
| Q-S01-07 | Facturación de Cloudflare                 | No se asume facturación habilitada; solo nivel gratuito |
| Q-S01-08 | Control de gasto                          | Revisión manual de consumo                              |
| Q-S01-09 | URL pública temporal de preview           | No                                                      |
| Q-S01-10 | Recursos diferenciados por entorno        | Sí, con sufijos cuando sean necesarios                  |
| Q-S01-11 | Creación de recursos Cloudflare           | Wrangler, con autorización operativa                    |
| Q-S01-12 | Migración D1 inicial                      | Sí, vacía o exclusivamente técnica                      |

---

## 5. Estructura del repositorio

Al implementar S-01, el repositorio seguirá esta estructura. Las carpetas pueden existir vacías si pertenecen a specs posteriores; no contienen lógica de negocio anticipada.

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── decisiones-arquitectura.md
│   ├── procedimiento-cierre-manual.md
│   └── runbook-operacion.md
├── migrations/
│   └── .gitkeep
├── public/
│   └── .gitkeep
├── specs/
│   ├── S-01-fundacion-y-entornos.md
│   └── README.md
├── src/
│   ├── api/
│   │   ├── index.ts
│   │   └── health.ts
│   ├── app/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   └── .gitkeep
│   ├── config/
│   │   └── env.ts
│   ├── db/
│   │   ├── client.ts
│   │   └── schema/
│   │       └── .gitkeep
│   ├── lib/
│   │   └── .gitkeep
│   ├── styles/
│   │   └── globals.css
│   ├── test/
│   │   ├── setup.ts
│   │   └── fixtures/
│   │       └── .gitkeep
│   └── worker.ts
├── tests/
│   └── e2e/
│       └── smoke.spec.ts
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── drizzle.config.ts
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── README.md
├── SSOT.md
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── wrangler.jsonc
```

### Reglas de estructura

- `SSOT.md` será la copia controlada de la SSOT aprobada.
- `specs/` guarda solo specs derivadas versionadas y aprobables.
- `migrations/` contiene migraciones revisables generadas por Drizzle/Wrangler según la decisión aprobada.
- `src/api/` no incluye dominio de negocio hasta S-02/S-04/S-05/S-06.
- `src/db/schema/` no contiene entidades de dominio hasta las specs que las aprueben.
- `docs/procedimiento-cierre-manual.md` reproduce el procedimiento aprobado, adaptado al nombre real de recursos solamente después de que estos se definan.
- `.env.example` enumera nombres de variables sin valores reales.
- Ningún `.env`, token, clave, credencial, exportación SQL, audio, archivo de datos reales o copia de producción entra al repositorio.

---

## 6. Configuración de aplicación

### 6.1 Worker y SPA

- Se usará `wrangler.jsonc` como archivo de configuración de Cloudflare en la raíz.
- Vite sirve/desarrolla la SPA React.
- El Worker recibe las rutas `/api/*` y sirve assets de la SPA para las demás rutas.
- El manejo de rutas SPA debe evitar que una ruta cliente válida resulte en 404 al recargar directamente.
- Debe existir endpoint de salud no autenticado: `GET /api/health`.
- Respuesta de salud mínima propuesta: `{ "estado": "ok" }`.
- No incluir versión, secretos, bindings, IDs, entorno, datos de infraestructura ni stack trace en esa respuesta.

La documentación de Cloudflare muestra `assets.not_found_handling: "single-page-application"` para SPA y la integración Vite/Worker en un solo proyecto. [web:131][web:139]

### 6.2 Hono

- Hono será el router API único dentro del Worker.
- La ruta base de API será `/api`.
- S-01 puede implementar únicamente `/api/health` y middleware técnico no funcional.
- No deben existir endpoints anticipados de `auth`, `users`, `audios`, `evaluations`, `drafts` o `admin` hasta la spec correspondiente.

### 6.3 Configuración de entorno

La aplicación definirá una interfaz TypeScript de bindings `Env`, sin secretos incrustados:

| Binding/variable    | Tipo conceptual                  | Uso futuro                                                          | S-01                                      |
| ------------------- | -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `DB`                | D1 binding                       | Datos relacionales                                                  | Declarar/configurar, sin dominio          |
| `AUDIO_BUCKET`      | R2 binding                       | Objetos MP3                                                         | Declarar/configurar, sin carga/audio real |
| `APP_ENV`           | Texto                            | Identificar `local`/`preview`/`production` sin exponerlo al usuario | Sí                                        |
| `SESSION_PEPPER`    | Secreto                          | Autenticación futura                                                | Solo documentar, no crear/usar hasta S-02 |
| `ADMIN_BOOTSTRAP_*` | Secreto/variable, si se requiere | Creación inicial de admin futura                                    | No definir ni usar hasta S-03             |

No agregar variables porque «podrían servir después» sin una spec aprobada.

---

## 7. Entornos y datos

### 7.1 Local

| Aspecto   | Regla                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| Ejecución | Desarrollo local con Vite + plugin Cloudflare / Wrangler                           |
| Datos     | Exclusivamente ficticios                                                           |
| D1 y R2   | Simulados localmente o recursos de desarrollo aislados aprobados; nunca producción |
| Secretos  | Archivo local no versionado o mecanismo local seguro                               |
| Objetivo  | Desarrollo, pruebas y reproducción de errores no sensibles                         |

### 7.2 Preview

| Aspecto  | Regla                                                              |
| -------- | ------------------------------------------------------------------ |
| Origen   | Pull request aprobado para preview según Q-S01-09                  |
| URL      | Temporal y diferenciada de producción                              |
| Datos    | Exclusivamente ficticios                                           |
| D1/R2    | Recursos aislados de preview o mocks; nunca bindings de producción |
| Audios   | No subir ni reproducir MP3 reales                                  |
| Objetivo | Revisión visual, flujo técnico y pruebas antes de producción       |

### 7.3 Production

| Aspecto    | Regla                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| Datos      | Usuarios, audios y evaluaciones reales permitidos                                   |
| Acceso     | Solo Santiago Viana administra infraestructura y despliegue                         |
| R2         | Bucket privado Standard de producción                                               |
| D1         | Base exclusiva de esta aplicación                                                   |
| Despliegue | Requiere aprobación manual de Santiago Viana y evidencia de criterios de aceptación |
| Secretos   | Solo en Cloudflare/GitHub según corresponda; nunca en Git                           |

### 7.4 Separación obligatoria

- Ningún binding, ID, bucket, base o secreto de producción se usa por defecto en local o preview.
- Los datos ficticios deben tener nombres claramente ficticios como `Vocalista Prueba Uno`, nunca nombres reales del Ministerio.
- Los archivos de audio usados en pruebas deben ser generados/sintéticos o metadatos simulados; no usar grabaciones reales.

---

## 8. Base de datos y migraciones

### 8.1 Decisión de ORM

- Drizzle ORM será el acceso tipado a D1 en el Worker.
- Drizzle Kit generará migraciones revisables a partir de esquemas aprobados.
- La configuración debe declarar dialecto SQLite/D1 compatible.
- La fuente de verdad de tablas futuras será el esquema TypeScript aprobado por las specs de dominio; las migraciones son el historial aplicable.

Drizzle documenta el adaptador `drizzle-orm/d1` para Cloudflare D1 y su configuración de binding D1 en Wrangler. [web:142]

### 8.2 Migración inicial

Si Q-S01-12 se aprueba, S-01 puede crear una migración vacía o técnica de inicialización, sin entidades de negocio. No debe crear prematuramente tablas `users`, `sessions`, `audio_files`, `evaluation_drafts`, `self_evaluations`, `answers`, ni las demás entidades de la SSOT.

### 8.3 Aplicación de migraciones

- Las migraciones se ejecutan explícitamente, nunca de forma implícita al arrancar el Worker.
- Local, preview y production usan rutas de migración separadas por configuración/ejecución, nunca una migración automática contra producción desde una rama de desarrollo.
- La spec S-08 definirá el proceso exacto de migrar preview y production después de que existan tablas de dominio.

---

## 9. Validación técnica: MP3 de 30 MB

### 9.1 Objetivo

Confirmar antes de S-04 que la arquitectura de carga soporta un MP3 de hasta **30 MB** sin exceder límites de solicitud, CPU, memoria o tiempo del Worker y sin exponer el bucket R2.

### 9.2 Enfoque propuesto para validar

La validación debe comparar y documentar dos alternativas, sin implementar el flujo final de producto:

| Alternativa           | Descripción                                                                                             | Ventaja                                | Riesgo/decisión                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Proxy por Worker      | Navegador envía el archivo al endpoint del Worker; este valida y escribe en R2                          | Control central simple                 | Puede encontrar límites de cuerpo/CPU/memoria; no asumir que admite 30 MB         |
| Carga directa firmada | Worker autorizado valida la intención y entrega URL firmada temporal de R2; navegador sube directo a R2 | El Worker no transporta archivo grande | Requiere definir control de tamaño, tipo, clave, vencimiento y confirmación final |

Cloudflare describe una arquitectura de carga de contenido de usuario con URL firmada temporal: el Worker valida intención y permisos, devuelve una URL `PUT` limitada y el navegador envía directamente a R2, evitando que el Worker transporte archivos grandes. R2 admite URLs prefirmadas para `PUT`. [web:132][web:135]

### 9.3 Criterios de validación

Antes de aprobar S-04, documentar el resultado de una prueba con archivo **ficticio** de 30 MB y responder:

1. ¿Qué alternativa funciona dentro de límites técnicos reales?
2. ¿Se puede validar tipo MIME, extensión y tamaño máximo de 30 MB sin confiar solo en el navegador?
3. ¿Cómo se genera una clave R2 no predecible y se evita que un usuario suba a claves ajenas?
4. ¿Cómo se confirma que el objeto se subió antes de crear el registro de audio?
5. ¿Qué pasa con una carga interrumpida o un objeto huérfano?
6. ¿La solución conserva el requisito de solo admin para cargar?
7. ¿La solución expone una URL o credencial reutilizable? Debe ser no.
8. ¿La alternativa requiere habilitar algo pagado/no gratuito? Debe ser informado y aprobado.

### 9.4 Regla de decisión

- Si una alternativa soporta 30 MB y cumple A-24, A-31 a A-35, se propone como decisión para S-04.
- Si ninguna alternativa cumple 30 MB, el agente debe presentar evidencia, opciones y preguntas para Santiago Viana. No puede bajar el límite, cambiar proveedor, permitir uploads públicos o desarrollar una solución distinta sin aprobación.
- La validación puede ser un spike técnico aislado posterior a aprobar/implementar S-01, documentado en `docs/decisiones-arquitectura.md` con referencia `A-34`.

---

## 10. Calidad, pruebas y CI

### 10.1 Scripts mínimos

El `package.json` tendrá, como mínimo, scripts equivalentes a:

```text
lint        — ESLint
format:check — Prettier en modo verificación
typecheck   — TypeScript sin emitir
test        — Vitest
test:watch  — Vitest en desarrollo
test:e2e    — Playwright
build       — Build de Vite/Worker
dev         — Desarrollo local
deploy      — Despliegue manual controlado
```

Los nombres definitivos pueden ajustarse a convenciones de las herramientas, pero no reducir las verificaciones sin aprobación.

### 10.2 Pruebas de S-01

| ID       | Prueba                          | Resultado esperado                                                          |
| -------- | ------------------------------- | --------------------------------------------------------------------------- |
| T-S01-01 | Smoke unitario de la aplicación | El runner Vitest ejecuta correctamente                                      |
| T-S01-02 | Health API                      | `GET /api/health` devuelve 200 y `{ "estado": "ok" }` sin detalles internos |
| T-S01-03 | Smoke SPA                       | La SPA carga en ruta raíz                                                   |
| T-S01-04 | Recarga SPA                     | Una ruta cliente de prueba no produce 404 al recargar                       |
| T-S01-05 | Lint y TypeScript               | Sin errores                                                                 |
| T-S01-06 | E2E básico                      | Playwright abre la SPA y consulta salud en entorno local/preview controlado |
| T-S01-07 | Secret scan manual              | No hay secretos, `.env` reales, archivos SQL reales o datos reales en Git   |

No implementar pruebas de comportamiento funcional que pertenezcan a specs posteriores.

### 10.3 GitHub Actions

En cada pull request, GitHub Actions ejecuta:

1. Instalación reproducible con lockfile.
2. `format:check`.
3. `lint`.
4. `typecheck`.
5. `test`.
6. `build`.
7. `test:e2e` cuando el entorno de CI pueda levantar la aplicación de manera reproducible.

Si E2E requiere configuración adicional de Cloudflare que no esté resuelta en S-01, el agente debe documentarlo y preguntar; no debe desactivar las pruebas silenciosamente.

### 10.4 Preview

- El preview de pull request se habilita solo si Q-S01-09 lo aprueba.
- Nunca se desplegará con secrets/bindings/datos reales de producción.
- La URL preview no sustituye la aprobación manual de producción.
- La estrategia concreta de despliegue preview debe documentarse en `docs/runbook-operacion.md` después de escoger recursos y permisos reales.

---

## 11. Seguridad de repositorio y secretos

### 11.1 Prohibiciones

No se permite incluir en Git:

- Contraseñas, hashes de contraseñas de producción o sesiones.
- IDs de recursos de producción si exponen información innecesaria en un repositorio no autorizado.
- Tokens Cloudflare, tokens GitHub, claves API, secretos de sesión o archivos `.env` reales.
- Exportaciones D1, MP3, respuestas de evaluaciones o nombres reales de vocalistas.
- Capturas de pantalla que revelen información personal o infraestructura sensible.

### 11.2 Archivos permitidos

- `.env.example` sin valores secretos.
- Configuración `wrangler.jsonc` sin secretos; los IDs/bindings se inyectan/declaran de manera segura según la estrategia aprobada.
- Fixtures puramente ficticios.
- Scripts de validación que no requieran credenciales incrustadas.

### 11.3 Secretos operativos

Cloudflare permite administrar secretos de Worker por Dashboard o Wrangler. La eliminación de secretos se contempla en el procedimiento de cierre y no se ejecuta por esta spec. [web:109]

---

## 12. Documentación requerida

Al implementar S-01 deben existir estos documentos:

| Archivo                               | Contenido mínimo                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                           | Propósito, requisitos locales, scripts, arquitectura breve, cómo ejecutar pruebas, reglas de datos ficticios y enlace a SSOT/specs |
| `SSOT.md`                             | Copia controlada de la SSOT aprobada                                                                                               |
| `specs/README.md`                     | Índice de specs, estado, IDs cubiertos y proceso de aprobación                                                                     |
| `docs/decisiones-arquitectura.md`     | Decisiones aprobadas, alternativas descartadas y resultado del spike de 30 MB cuando ocurra                                        |
| `docs/runbook-operacion.md`           | Entornos, despliegue, migrations, preview, operación y rollback; se completa progresivamente sin inventar secretos                 |
| `docs/procedimiento-cierre-manual.md` | Procedimiento aprobado para retirar acceso o eliminar definitivamente, preservando Drive                                           |

El documento de cierre debe indicar que D1 puede exportarse, R2 debe vaciarse antes de eliminar bucket y que los secretos se revocan por separado. [web:108][web:107][web:109]

---

## 13. Convenciones de trabajo

### 13.1 Ramas

Formato:

```text
<tipo>/A-xx-descripcion-corta
```

Ejemplos:

```text
chore/A-19-fundacion-worker
ci/A-72-pipeline-calidad
spike/A-34-carga-30mb
```

### 13.2 Commits

Formato obligatorio:

```text
<tipo>(A-xx[,A-yy]): descripción en español
```

Tipos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `ci`, `security`.

Ejemplos:

```text
chore(A-19,A-22): inicializa monolito React y Worker
ci(A-72): agrega validaciones de calidad en pull requests
test(A-70): incorpora smoke tests de fundación
docs(A-84,A-85): agrega procedimiento manual de cierre
```

### 13.3 Pull requests

Toda pull request incluirá:

- IDs `A-xx` cubiertos.
- Spec derivada correspondiente y estado de aprobación.
- Resumen de cambios.
- Pruebas ejecutadas y resultado.
- Evidencia visual móvil si se modifica UI.
- Riesgos, decisiones pendientes y cambios de migración si aplica.

---

## 14. Criterios de aceptación de S-01

S-01 se considera implementada solo si se cumple todo lo siguiente:

1. Existe repositorio privado con estructura definida en sección 5. [A-19, A-22, A-67]
2. `SSOT.md` está versionado y coincide con la SSOT aprobada. [A-01, A-67]
3. React, Vite, Cloudflare Vite plugin y Worker construyen y ejecutan localmente. [A-19, A-22]
4. La SPA se sirve correctamente y soporta recarga en rutas cliente de prueba. [A-06, A-19]
5. `GET /api/health` responde 200 con el contrato definido y sin exponer información interna. [A-05, A-24]
6. Existe configuración declarativa de D1 y R2 por bindings, sin usar recursos reales de producción en local/preview. [A-20, A-23, A-24]
7. Drizzle y la ruta de migraciones quedan configurados sin crear tablas de dominio antes de sus specs. [A-62]
8. Solo hay fixtures y datos ficticios; el repositorio no incluye datos, MP3, credenciales ni secretos reales. [A-23, A-24, A-62]
9. ESLint, Prettier, typecheck, Vitest y Playwright quedan configurados; los smoke tests definidos pasan. [A-70, A-71]
10. GitHub Actions ejecuta las verificaciones aplicables en pull requests. [A-72]
11. Existe estrategia documentada de preview que cumple la respuesta a Q-S01-09 y nunca usa datos reales. [A-23, A-72]
12. Están incluidos README, índice de specs, decisiones arquitectónicas, runbook y procedimiento de cierre. [A-67, A-84, A-85, A-86]
13. El límite funcional de 30 MB permanece documentado y la validación técnica queda planificada; no se implementa la carga real en S-01. [A-34, A-87]
14. Ninguna funcionalidad excluida en sección 3.2 se implementa anticipadamente. [A-02, A-03]

---

## 15. Aprobación requerida

Santiago Viana debe responder después de contestar Q-S01-01 a Q-S01-12:

> **Apruebo S-01 Fundación y entornos v0.1.0**

Hasta recibir esa aprobación exacta, el agente no debe generar código, crear recursos externos ni ejecutar despliegues. Después de aprobarla, puede implementar únicamente lo cubierto por esta spec y debe referenciar sus IDs `A-xx` en tareas, ramas, commits y pruebas.
