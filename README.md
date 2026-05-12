# StreamDrive Hub

> LMS autogestionado que convierte Google Drive en una plataforma educativa con streaming, progreso, subtítulos y tema oscuro.

---

## Características

-   **OAuth con Google** — login con cuenta de Google, sin registro manual
-   **Sync desde Drive** — escanea carpetas de Drive e indexa cursos, lecciones y metadatos
-   **Streaming de video** — reproducción directa desde Drive con soporte Range requests
-   **Subtítulos y transcripción** — detecta archivos `.vtt`/`.srt` y muestra transcript colapsable
-   **Capítulos** — agregá, editá y eliminá marcas temporales con búsqueda
-   **Progreso por usuario** — seguimiento automático cada 15s + al pausar/terminar, reanudá donde dejaste
-   **Resúmenes Markdown** — resumen técnico por lección, editable desde la UI
-   **Búsqueda** — buscá cursos y lecciones con navegación por teclado
-   **Tema oscuro/claro** — persistido en localStorage, transición suave
-   **Sidebar responsive** — colapsable en mobile con menú hamburguesa
-   **Exportar a PDF** — resumen imprimible desde el navegador
-   **Tags con colores** — cada tag tiene un color determinístico del palet de 6 colores
-   **Notificaciones toast** — feedback visual en toda la app
-   **Sesiones persistentes** — no se pierde el login al reiniciar el backend

---

## Requisitos

-   Node.js 18+
-   npm
-   Una cuenta de Google Cloud con Drive API habilitada
-   Una carpeta en Google Drive con contenido de cursos

---

## Guía de instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/EnriqueKloosterman/streamdrive.git
cd streamdrive
```

### 2. Configurar Google Cloud

1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar **Google Drive API**
3. Crear una **Service Account**:
   - Ir a APIs & Services → Credentials → Create Credentials → Service Account
   - Descargar el JSON y guardarlo como `backend/service-account.json`
4. Crear credenciales **OAuth 2.0**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5173/api/auth/google/callback`
   - Guardar **Client ID** y **Client Secret**

### 3. Compartir la carpeta de Drive

Compartir la/s carpeta/s raíz con el email de la Service Account (permiso de **Lector**).

### 4. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./db/streamdrive.sqlite
GOOGLE_SERVICE_ACCOUNT_PATH=service-account.json
GOOGLE_DRIVE_FOLDER_ID=id_de_tu_carpeta_en_drive
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
SESSION_SECRET=una_frase_segura_de_al_menos_32_caracteres
FRONTEND_URL=http://localhost:5173
```

> Soporta múltiples carpetas raíz separando los IDs con comas en `GOOGLE_DRIVE_FOLDER_ID`.

### 5. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 6. Iniciar la aplicación

Usando el script incluído:

```bash
start.bat
```

O manualmente en dos terminales:

```bash
# Terminal 1 — Backend (puerto 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (puerto 5173)
cd frontend && npm run dev
```

Abrir `http://localhost:5173` e iniciar sesión con Google.

---

## Estructura de Drive

```
📁 Carpeta Raíz (ID en GOOGLE_DRIVE_FOLDER_ID)
├── 📁 Mi Curso                → Se convierte en un curso
│   ├── course.md             → Metadata: título, descripción, tags, imagen
│   ├── 01-introduccion.mp4   → Lección 1
│   ├── 01-introduccion.md    → Resumen técnico de la lección 1
│   ├── 02-conceptos.mp4      → Lección 2
│   └── 02-conceptos.md       → Resumen técnico de la lección 2
├── 📁 Otro Curso
│   └── ...
```

### Reglas

-   Cada **carpeta inmediata** de la raíz = 1 curso
-   Cada **archivo de video** (`.mp4`, `.mkv`, `.webm`, `.mov`) = 1 lección
-   Los videos se ordenan **alfabéticamente** dentro de la carpeta
-   `course.md` es **opcional** y define metadatos del curso:

```markdown
---
title: Título del Curso
description: Descripción enriquecida
tags: [tag1, tag2]
image: https://ejemplo.com/imagen.jpg
---
```

-   Un `.md` con el **mismo nombre base** que el video = resumen técnico de esa lección
-   Archivos `.vtt` / `.srt` con el mismo nombre base = subtítulos (ej: `01-intro.es.vtt`)
-   Subcarpetas dentro de un curso = secciones (agrupan lecciones en el sidebar)

---

## Comandos

| Paquete   | Comando             | Descripción                           |
| --------- | ------------------- | ------------------------------------- |
| backend   | `npm run dev`       | Inicia con `node --watch` (hot reload) |
| backend   | `npm start`         | Inicia en producción                   |
| frontend  | `npm run dev`       | Vite dev server en puerto 5173         |
| frontend  | `npm run build`     | Build para producción                  |

El frontend redirige `/api/*` al backend (`:3001`) vía proxy de Vite.

---

## API REST

| Método | Ruta                           | Descripción                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/api/auth/google`             | Iniciar sesión con Google      |
| GET    | `/api/auth/google/callback`    | Callback OAuth                 |
| GET    | `/api/auth/me`                 | Usuario actual                 |
| POST   | `/api/auth/logout`             | Cerrar sesión                  |
| GET    | `/api/courses`                 | Listar cursos                  |
| GET    | `/api/courses/:id`             | Detalle del curso + lecciones  |
| PUT    | `/api/courses/:id`             | Editar metadata del curso      |
| GET    | `/api/lessons/:id`             | Detalle de lección             |
| PUT    | `/api/lessons/:id`             | Editar metadata de lección     |
| GET    | `/api/lessons/:id/stream`      | Stream de video (Range)        |
| GET    | `/api/lessons/:id/subtitles`   | Subtítulos de la lección       |
| GET    | `/api/lessons/:id/transcript`  | Transcript completo            |
| POST   | `/api/sync`                    | Iniciar sincronización         |
| GET    | `/api/sync/status`             | Estado del sync                |
| GET    | `/api/search?q=`               | Buscar cursos y lecciones      |
| GET    | `/api/progress/:courseId`      | Progreso del usuario en curso  |
| POST   | `/api/progress/:lessonId`      | Guardar progreso de lección    |

Todos los endpoints `/api/*` requieren autenticación.

---

## Stack

| Capa      | Tecnología                                         |
| --------- | -------------------------------------------------- |
| Frontend  | React 18, Vite, Tailwind CSS v4, lucide-react      |
| Backend   | Express, Passport, Sequelize                        |
| Base datos| SQLite                                              |
| Storage   | Google Drive API (googleapis)                       |
| Cache     | node-cache (TTL 5 min)                              |
| Sesiones  | express-session + connect-sqlite3                   |

---


---

## Licencia

MIT
