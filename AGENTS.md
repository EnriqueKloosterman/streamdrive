# StreamDrive Hub — Agent Guide

## Project structure

```
streamDrive/
  specs.md              # Product spec — source of truth for features and API
  backend/              # Express + Sequelize + SQLite (CommonJS, no "type": "module")
    src/app.js          # Entrypoint
    .env                # All config via env vars (see specs.md §3)
  frontend/             # Vite + React 18 + Tailwind CSS v4 (ESM, "type": "module")
    src/main.jsx        # Entrypoint
```

## Commands

| Package | Command | What it does |
|---------|---------|-------------|
| backend | `npm run dev` | `node --watch src/app.js` (no nodemon needed) |
| backend | `npm start` | `node src/app.js` |
| frontend | `npm run dev` | Vite dev server on `:5173`, proxies `/api` → `:3001` |
| frontend | `npm run build` | Production build |

Both must run simultaneously for full-stack development.

## Key conventions

- **Course thumbnail**: `course.md` can include `image: https://...` for a hero image. Parsed during sync, stored in `Course.image_url`. Displayed in CourseCard (aspect-video) and CourseDetail banner.
- **Progress bar**: Shown in CourseDetail header and Sidebar. Bar turns green at 100%. Count shows `completed/total`.
- **Tag colors**: Each tag gets a deterministic color from a 6-color palette (hashed by tag name), instead of uniform gray.
- **Theme transition**: `* { transition: background-color, border-color, color 0.2s }` for smooth dark/light switch.
- **Rate limits**: `authLimiter` (1000 req/min) applied via `router.use(requireAuth, authLimiter)` on all `/api` routes.
- **No tests, no lint, no typecheck** configured yet.
- **Tailwind v4** — use `@import "tailwindcss"` in CSS, NOT `@tailwind` directives. Plugin is `@tailwindcss/vite`.
- **Backend is CommonJS** (`require`/`module.exports`). Frontend is ESM (`import`/`export`).
- **SQLite** via Sequelize (file at `DB_PATH`, default `./db/streamdrive.sqlite`). Dev mode runs `sequelize.sync({ alter: true })` on startup — no manual migrations needed.
- **Env vars** documented in `specs.md §3`. Must set `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_CLIENT_ID/SECRET`, `SESSION_SECRET` (min 32 chars).
- **Drive sync** (`POST /api/sync`) is async — reads folders from Drive root, maps videos → lessons, `course.md` → course metadata, `.md` sibling files → lesson summaries.
- **Video streaming** (`GET /api/lessons/:id/stream`) proxies Range requests from Drive API. Controller handles partial content manually.
- **OAuth flow**: Passport + express-session (no JWT). Session cookie set on Google callback redirect.
- **Cache**: `node-cache` with 5min TTL on `GET /api/courses` and `GET /api/courses/:id`. Invalidated after sync.
- **Sessions persist across backend restarts**: `connect-sqlite3` store writes sessions to `backend/db/sessions.db` — no more lost logins when `node --watch` restarts.
- **Toast notifications**: `ToastContext` provides `toast.success()`, `toast.error()`, `toast.info()` throughout the app. Auto-dismiss after 4s.
- **Responsive sidebar**: Collapsible on mobile (< 1024px) via hamburger button + overlay backdrop. Desktop always visible.
- **Page titles** update dynamically per page (Login, Dashboard, CourseDetail with lesson name).
- **Sync polling**: 5s interval (was 2s), max 120 polls (10 min timeout), status updated during polling to show progress.

## Architecture notes

- **No monorepo tool** — just two independent npm packages. Install and run separately.
- **specs.md** is the authoritative reference for API endpoints, data models, and content conventions. Read it first when implementing features.
- Auth middleware (`requireAuth`) checks `req.isAuthenticated()` from Passport session.
- Error format: `{ error: { code, message, details } }`.
- Rate limits: 100 req/min public, 1000 req/min authenticated.
- Backend has catch-all 404 handler for unknown `/api/*` routes.
- Video player shows loading spinner and error overlay with retry button (instead of silent black box).
- SearchBar supports keyboard navigation (↑↓EnterEscape) and shows "Searching..." state.
- Dashboard shows distinct error state when API fails (instead of misleading "No courses yet").
