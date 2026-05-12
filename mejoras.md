# Posibles Mejoras — StreamDrive Hub

## Testing y Calidad
- [ ] Configurar tests unitarios e integración (Vitest frontend, Jest/Mocha backend)
- [ ] Agregar linting (ESLint + Prettier) en backend y frontend
- [ ] Agregar typecheck (TypeScript o JSDoc) — actualmente todo JS sin tipos
- [ ] Pipeline CI/CD (GitHub Actions: test, build, deploy)

## Infraestructura
- [ ] Dockerizar backend + frontend con `docker-compose`
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Logging estructurado (Winston/Pino en vez de console.log)
- [ ] Graceful shutdown (manejar SIGTERM para cerrar conexiones)
- [ ] Backup/restore de la base de datos vía CLI
- [ ] Cache warming para cursos populares
- [ ] Migraciones de base de datos (reemplazar `sync({ alter: true })`)

## Seguridad
- [ ] Helmet.js para headers de seguridad
- [ ] CSP (Content Security Policy) estricta
- [ ] Rate limiting con feedback al usuario (429 con mensaje amigable)
- [ ] Validación de inputs con Joi/Zod en todos los endpoints
- [ ] Autenticación de dos factores (2FA)
- [ ] Manejo de sesiones activas (ver/cerrar sesiones desde UI)
- [ ] Eliminación de cuenta (GDPR)

## Video y Player
- [ ] Selección de calidad de video (resolución múltiple)
- [ ] Picture-in-Picture
- [ ] Velocidad de reproducción persistente (recordar preferencia)
- [ ] Autoplay siguiente lección
- [ ] Atajos de teclado mejorados (ya tiene flechas, agregar `f` fullscreen, `m` mute, `c` captions)
- [ ] Descarga de lecciones para offline
- [ ] Bookmark de timestamps por usuario
- [ ] Notas por lección (persistidas en DB)
- [ ] Búsqueda dentro del transcript del video
- [ ] Detección automática de capítulos desde metadatos del video
- [ ] Generación automática de thumbnails de video

## UI/UX
- [ ] Panel de administración (gestión de cursos/usuarios desde UI)
- [ ] Rol de usuario (admin, instructor, student)
- [ ] Reordenar lecciones con drag & drop
- [ ] Paginación en cursos con muchas lecciones
- [ ] Landing page pública (antes del login)
- [ ] Modo demo / guest sin autenticación
- [ ] Tema claro/oscuro con animación más suave (ya hay transición 0.2s)
- [ ] Internacionalización (i18n) multi-idioma
- [ ] Accesibilidad (WCAG 2.2 audit)
- [ ] SEO (meta tags, sitemap, structured data)
- [ ] Notificaciones push (nuevo curso, sync completado)
- [ ] Loading skeletons en lugar de spinners genéricos

## Funcionalidad Educativa
- [ ] Quizzes / exámenes por lección
- [ ] Certificados de finalización (PDF descargable)
- [ ] Comentarios / discusiones por lección
- [ ] Dependencias entre lecciones (prerrequisitos)
- [ ] Rating y reseñas de cursos
- [ ] Wishlist / guardar cursos para después
- [ ] Progreso reseteable por curso
- [ ] Barra de progreso global (progreso total en todos los cursos)

## Drive y Sync
- [ ] UI para subir/administrar contenido (sin depender del Drive web)
- [ ] Sincronización automática programada (cron)
- [ ] Sincronización vía WebSocket (reemplazar polling)
- [ ] Transcripción automática de video (Speech-to-Text)
- [ ] Subida y transcodificación de video desde la UI
- [ ] Detección de cambios incremental (solo sync de lo nuevo/modificado)
- [ ] Exportar estructura de curso como JSON

## API y Extensibilidad
- [ ] Documentación Swagger/OpenAPI
- [ ] Webhooks para eventos (sync completo, nuevo curso, etc.)
- [ ] API key para acceso programático (sin OAuth)
- [ ] Soporte multi-tenant (varias organizaciones)
- [ ] CLI tool para operaciones desde terminal

## Mobile
- [ ] Aplicación React Native básica
- [ ] PWA con service worker (offline parcial)
- [ ] Controles de video optimizados para mobile
- [ ] Soporte Picture-in-Picture en iOS/Android

## Monitoreo y Operaciones
- [ ] Dashboards de analytics (cursos más vistos, engagement)
- [ ] Integración con Sentry para errores
- [ ] Métricas de rendimiento (tiempo de carga, sync, etc.)
- [ ] Feature flags para despliegues progresivos
