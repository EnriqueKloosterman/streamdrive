# Plan Maestro de Producto: StreamDrive Hub

> **Estado:** v2.0 | **Fecha:** 2026-05-11

---

## 1. Visión del Producto

StreamDrive Hub es un Sistema de Gestión de Aprendizaje (LMS) privado que transforma el almacenamiento no estructurado de Google Drive en una plataforma educativa de alto rendimiento. Su valor central reside en la capacidad de respuesta instantánea mediante la indexación local de metadatos y una interfaz optimizada para el consumo de contenido técnico.

**Usuarios objetivo:** Equipos internos o comunidades que consumen material técnico formateado (cursos, tutoriales, workshops) almacenado en Drive, sin necesidad de una plataforma LMS dedicada.

---

## 2. Casos de Uso

| ID | Descripción |
|----|-------------|
| **UC-1: Sincronización de Contenido** | El usuario autenticado pulsa "Sync" para actualizar la base de datos local desde Drive. |
| **UC-2: Navegación de Catálogo** | El usuario consulta la galería de cursos (carga instantánea < 100ms). |
| **UC-3: Visualización de Lección** | El usuario selecciona una clase; el video inicia en streaming y aparece el resumen técnico. |
| **UC-4: Gestión de Metadatos** | El usuario edita títulos y descripciones de cursos/lecciones desde la interfaz. |
| **UC-5: Autenticación** | El usuario inicia sesión con su cuenta de Google para acceder a la plataforma. |

---

## 3. Convenciones de Contenido

### Estructura de Drive

```
📁 Drive Root
├── 📁 Curso A              → Representa un curso
│   ├──  course.md        → Metadata enriquecida (descripción, tags, imagen)
│   ├──  01-intro.mp4     → Lección 1
│   ├──  02-setup.mp4     → Lección 2
│   └──  02-setup.md      → Resumen técnico de la lección 2
├── 📁 Curso B
│   └── ...
```

**Reglas de mapeo:**
- Cada **carpeta inmediata** de la raíz de Drive = 1 curso.
- Cada **archivo de video** (`.mp4`, `.mkv`, `.webm`, `.mov`) = 1 lección.
- Los archivos de video se ordenan **alfabéticamente** dentro de la carpeta.
- Un archivo `course.md` en la raíz de la carpeta es **opcional** y define:
  ```markdown
  ---
  title: Título del Curso (opcional)
  description: Descripción enriquecida (opcional)
  tags: [tag1, tag2]
  ---
  ```
- Un archivo con el **mismo nombre base** que el video + extensión `.md` (ej: `01-intro.md` junto a `01-intro.mp4`) = resumen técnico de esa lección.

> **Nota:** Las carpetas dentro de una carpeta de curso se ignoran en la primera versión (v1).

### Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor Express. Default: `3001` | Sí |
| `NODE_ENV` | `development` \| `production` | Sí |
| `DB_PATH` | Ruta al archivo SQLite. Default: `./db/streamdrive.sqlite` | Sí |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON string completo de la Service Account | **Sí** |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta raíz de Drive a sincronizar | **Sí** |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth (Google Cloud Console) | **Sí** |
| `GOOGLE_CLIENT_SECRET` | Client Secret de OAuth | **Sí** |
| `GOOGLE_REDIRECT_URI` | URI de callback de OAuth. Default: `http://localhost:3001/api/auth/google/callback` | Sí |
| `SESSION_SECRET` | Secret para firmar sesiones. Mínimo 32 caracteres. | **Sí** |
| `FRONTEND_URL` | URL del frontend para CORS y redirects. Default: `http://localhost:5173` | Sí |

### Configuración de Google Cloud

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilitar **Google Drive API**.
3. Crear **Service Account** → descargar JSON → copiar contenido en `GOOGLE_SERVICE_ACCOUNT_JSON`.
4. Habilitar **Google OAuth 2.0** → crear credenciales OAuth 2.0.
5. Compartir la carpeta raíz de Drive (o carpetas de curso) con el **email de la Service Account**.
6. Agregar `GOOGLE_REDIRECT_URI` (default: `http://localhost:3001/api/auth/google/callback`) como **Authorized redirect URI** en las credenciales OAuth 2.0.

---

## 4. Flujo de Usuario (Happy Path)

1. **Login:** El usuario es redirigido a Google OAuth → autoriza → retorna autenticado.
2. **Catálogo:** Visualiza la galería de cursos (carga instantánea < 100ms).
3. **Sync:** Si es necesario, pulsa el botón "Sync" para actualizar contenido desde Drive.
4. **Exploración:** Navega por el programa del curso en el *sidebar*.
5. **Consumo:** Selecciona una clase → video en streaming → resumen técnico visible.
6. **Edición:** Edita metadata y resúmenes directamente desde la UI.

---

## 5. Arquitectura del Sistema

### 5.1 Stack Tecnológico y Dependencias

#### Frontend (React)

| Categoría | Herramienta |
|-----------|-------------|
| Framework | React 18+ + Vite |
| Estilos | Tailwind CSS |
| HTTP | Axios |
| Routing | react-router-dom |
| Iconos | lucide-react |
| Markdown | react-markdown |
| Video | video.js |
| OAuth | `@react-oauth/google` |

#### Backend (Node.js)

| Categoría | Herramienta |
|-----------|-------------|
| Framework | ExpressJS |
| Seguridad | `helmet`, `express-rate-limit`, `express-session` |
| Cliente Google | `googleapis` |
| ORM | `sequelize`, `sqlite3` |
| Validación | `express-validator` |
| OAuth | `passport`, `passport-google-oauth20` |
| caché | `node-cache` |
| Varios | `dotenv`, `cors`, `morgan` |

### 5.2 Estructura de Carpetas

```
/streamdrive-app
├── /backend
│   ├── /db                    # Almacenamiento persistente (.sqlite)
│   ├── /src
│   │   ├── /config
│   │   │   ├── db.js          # Sequelize
│   │   │   ├── googleClient.js # googleapis init
│   │   │   ├── limiter.js      # Rate limiting
│   │   │   ├── passport.js     # Google OAuth strategy
│   │   │   └── session.js      # Session config
│   │   ├── /controllers
│   │   │   ├── authController.js
│   │   │   ├── courseController.js
│   │   │   ├── lessonController.js
│   │   │   └── syncController.js
│   │   ├── /middleware
│   │   │   ├── auth.js          # Verificación de sesión
│   │   │   ├── cache.js         # caché de respuestas
│   │   │   ├── errorHandler.js  # Manejo global de errores
│   │   │   └── validator.js     # Validación de inputs
│   │   ├── /models
│   │   │   ├── Course.js
│   │   │   ├── Lesson.js
│   │   │   └── User.js
│   │   ├── /routes
│   │   │   ├── index.js
│   │   │   ├── apiRoutes.js
│   │   │   └── authRoutes.js
│   │   ├── /services
│   │   │   └── driveService.js  # Scraper de Drive
│   │   └── app.js
│   ├── .env
│   └── package.json
└── /frontend
    ├── /src
    │   ├── /components
    │   │   ├── Player.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── MarkdownRenderer.jsx
    │   │   ├── CourseCard.jsx
    │   │   └── SyncButton.jsx
    │   ├── /contexts
    │   │   └── AuthContext.jsx
    │   ├── /hooks
    │   │   ├── useFetch.js
    │   │   └── useSync.js
    │   ├── /pages
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── CourseDetail.jsx
    │   └── main.jsx
    ├── .env
    └── vite.config.js
```

### 5.3 Estructura de Datos

#### Tabla: Users

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | |
| google_id | String (Unique) | ID de Google OAuth |
| email | String (Unique) | |
| name | String | |
| picture | String | URL de avatar |
| created_at | DateTime | |

#### Tabla: Courses

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | |
| drive_folder_id | String (Unique) | ID de carpeta en Drive |
| title | String | |
| description | Text | |
| tags | Text (JSON) | Array serializado |
| last_sync | DateTime | Última sincronización |
| created_at | DateTime | |
| updated_at | DateTime | |

#### Tabla: Lessons

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | |
| course_id | FK → Course | |
| drive_file_id | String (Unique) | ID de archivo en Drive |
| title | String | |
| description | Text | |
| summary | Text | Contenido markdown del resumen técnico |
| order | Integer | Posición en el curso |
| duration | Integer | Duración en segundos (extraído de Drive) |
| created_at | DateTime | |
| updated_at | DateTime | |

#### Base de Datos

- **Motor:** SQLite (persistencia basada en archivos vía Sequelize).

---

## 6. API REST

### Autenticación

```
GET  /api/auth/google
     → Redirige a Google OAuth (scope: profile email).

GET  /api/auth/google/callback
     → Callback de Google OAuth. Establece sesión.
     ← Redirect a FRONTEND_URL/dashboard con token de sesión.

GET  /api/auth/me
     → Usuario actual.
     ← { id, googleId, email, name, picture }
     ← 401 si no autenticado.

POST /api/auth/logout
     → Destruye sesión.
     ← { message: "Logged out" }
```

### Cursos

```
GET /api/courses
     → Listado de todos los cursos (cached, TTL 5min).
     ← [ { id, title, description, tags, lessonCount, lastSync } ]

GET /api/courses/:id
     → Detalle de curso con sus lecciones.
     ← { id, title, description, tags, lastSync, lessons: [ ... ] }

PUT /api/courses/:id
     → Editar metadata del curso.
     Body: { title?, description?, tags? }
     ← { id, title, description, tags }

POST /api/courses/:id/summary
     → Guardar resumen general del curso (markdown).
     Body: { summary }
     ← { id, summary }
```

### Lecciones

```
GET /api/lessons/:id
     → Detalle de lección (sin stream).
     ← { id, courseId, title, description, summary, order, duration }

PUT /api/lessons/:id
     → Editar metadata de lección.
     Body: { title?, description?, summary? }
     ← { id, title, description, summary }

GET /api/lessons/:id/stream
     → Streaming de video.
     Headers: Range (soporte para streaming parcial).
     ← Content-Type: video/mp4 | 206 Partial Content | 416 Range Not Satisfiable
```

### Sincronización

```
POST /api/sync
     → Trigger manual de sincronización (async).
     Requiere: sesión autenticada.
     ← { message: "Sync started", syncId }

GET  /api/sync/status
     → Estado del último sync.
     ← { inProgress, lastSyncAt, lastSyncResult, totalCourses, totalLessons }
```

### Manejo de Errores

Todos los errores siguen el formato:

```json
{
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "Curso no encontrado.",
    "details": {}
  }
}
```

**Códigos de error:**

| Código | HTTP | Descripción |
|--------|------|-------------|
| `UNAUTHORIZED` | 401 | No autenticado. |
| `FORBIDDEN` | 403 | Sin permisos. |
| `COURSE_NOT_FOUND` | 404 | Curso inexistente. |
| `LESSON_NOT_FOUND` | 404 | Lección inexistente. |
| `VALIDATION_ERROR` | 400 | Datos de entrada inválidos. |
| `SYNC_IN_PROGRESS` | 409 | Ya hay un sync ejecutándose. |
| `GOOGLE_API_ERROR` | 502 | Error al comunicarse con Drive API. |
| `INTERNAL_ERROR` | 500 | Error interno del servidor. |

---

## 7. Requisitos No Funcionales (RNF)

| ID | Descripción | Meta |
|----|-------------|------|
| RNF-1 | **Performance:** Listado de cursos | < 100ms (desde caché < 20ms). |
| RNF-2 | **Performance:** Streaming de video | Soporte Range requests; buffering adaptativo. |
| RNF-3 | **Seguridad:** Credenciales | Service Account en `.env`; nunca en código. |
| RNF-4 | **Seguridad:** Rate limit | 100 req/min por IP en endpoints públicos; 1000 req/min en autenticados. |
| RNF-5 | **Seguridad:** OAuth | Sesión firmada con express-session; expiry configurable. |
| RNF-6 | **Resiliencia:** Caché | Navegación funcional durante sync en segundo plano. |
| RNF-7 | **Disponibilidad:** Fallback offline | Contenido del catálogo accesible sin conexión a Drive. |
| RNF-8 | **Mantenibilidad:** Separación de concerns | Controller → Service → Model; sin lógica de negocio en rutas. |

---

## 8. Roadmap de Versiones

### v1.0 — MVP
- [x] Autenticación Google OAuth
- [x] Sincronización manual (botón en UI)
- [x] Listado y detalle de cursos
- [x] Streaming de video (sin capítulos)
- [x] Resumen técnico (markdown)
- [x] Edición de metadata básica

### v1.1 — Enhancements
- [x] Indicador de progreso de sync en tiempo real (polling o SSE)
- [x] Búsqueda de cursos/lecciones
- [x] Caché inteligente (invalidación selectiva)

### v1.2 — Polish
- [x] Soporte para capítulos en video
- [x] Exportación de resumen como PDF (print-to-PDF desde el navegador)
- [x] Tema oscuro/claro

