# Movie Explorer AI

Web + API (y mobile) para explorar películas (TMDb), ver detalles, gestionar favoritos autenticados y obtener recomendaciones con fallback a TMDb si la IA falla.

## Índice rápido
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Variables de entorno](#variables-de-entorno)
- [Tests](#tests)
- [Patrones de arquitectura](#patrones-de-arquitectura)
- [Estado actual (resumen)](#estado-actual-resumen)
- [Roadmap / Deploy](#roadmap--deploy)

## Tecnologías
- **Web:** Next.js (App Router), React 19, React Query.
- **Backend:** Express + Prisma, Auth0 JWT, TMDb + OpenAI (fallback a TMDb).
- **Mobile:** Expo / React Native (MVP listo).
- **Monorepo:** npm workspaces.
- **Testing:**  
  - Backend: Jest + Supertest.  
  - Web: Vitest + React Testing Library + MSW (sin polyfills manuales).

## Ejecución local
Instalación en la raíz:
```bash
npm install
```

Todo (API + Web):
```bash
npm run dev
```

Solo Web:
```bash
npm run dev:web
```

Solo API:
```bash
npm run dev:api
```

## Variables de entorno

### Web (`apps/web/.env.local`)
- `TMDB_API_KEY` (requerida salvo `TMDB_MOCK=true`)
- `TMDB_MOCK` (`true`/`false`) — usa dataset TMDb mock embebido si no hay API key.
- Auth0 (favoritos autenticados):  
  `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`

### API (`services/api/.env`)
- `DATABASE_URL`
- Auth0 JWT: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`
- Recomendaciones / IA:  
  `TMDB_API_KEY` (requerida), `OPENAI_API_KEY` (opcional, si falta se usa TMDb similar), `OPENAI_MODEL` (default `gpt-4o-mini`)
- Logging IA opcional:  
  `API_LOG_OPENAI`, `API_LOG_DIR`, `API_LOG_OPENAI_FILE`, `API_LOG_OPENAI_MAX_CHARS`
- Dev-only: `AUTH_DISABLED=true` (bypass)

## Tests
- Backend: `npm test --workspace api` (Jest + Supertest).  
  Cobertura crítica: health, favoritos, TMDb search/discover/genres con filtros y fallback por año.
- Web: `npm test --workspace web` (Vitest + RTL + MSW).  
  Cobertura crítica: HomeBrowse (trending inicial, búsqueda por título, filtros año+género en discover).

## Patrones de arquitectura
- **BFF / API Gateway (Next.js routes):** `apps/web/src/app/api/*` reenvían al backend y anexan Auth0 tokens.
- **Capa backend en 3 niveles:** Router → Service → Clients/Repositories. Separación de validación, lógica y acceso externo/DB.
- **Auth como middleware:** `requireAuth` en backend; sesión Auth0 en web.
- **Resiliencia:** Recomendaciones usan OpenAI si está disponible; fallback a TMDb similar en caso de fallo/ausencia.
- **Monitoreo (opt-in):** Logs de prompts/respuestas OpenAI a archivo, activados por env.

## Estado actual (resumen)
- Web: búsqueda TMDb, detalles, favoritos con Auth0, edición de favorito, paginación, recomendaciones (5), tests críticos pasando.
- Backend: CRUD favoritos protegido, recomendaciones con fallback, TMDb client con filtros año/género y fallback por año, tests críticos pasando.
- Mobile: MVP Expo con login, búsqueda, detalles, favoritos, recomendaciones.

## Roadmap / Deploy
- Web en AWS Amplify (pendiente).
- Backend en AWS App Runner (listo: https://epw3x6q244.us-east-2.awsapprunner.com).
- README pendiente de guías de despliegue y documentación de patrones formales (hooks/containers en web).
