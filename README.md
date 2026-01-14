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
- `NEXT_PUBLIC_API_BASE_URL` **(producción)**: URL pública del backend en App Runner (sin `/api` al final). Ej: `https://epw3x6q244.us-east-2.awsapprunner.com`.
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
- **Frontend (Web):**
  - Data fetching vía hooks + React Query con helpers en `apps/web/src/lib/tmdb.ts` / `lib/backend.ts`.
  - Páginas/Componentes se mantienen presentacionales, consumen hooks y muestran UI (ej. `HomeBrowse`, `FavoritesList`, `Recommendations`).
  - Rutas API de Next (`apps/web/src/app/api/*`) actúan como BFF para favoritos/recommendations, añadiendo tokens Auth0 al backend.
- **Backend:** Capa en 3 niveles: Router → Service → Clients/Repositories. Validación con `zod`; Auth middleware `requireAuth`.
- **Resiliencia:** Recomendaciones usan OpenAI si está disponible; fallback a TMDb similar si falla/ausente.
- **Monitoreo (opt-in):** Logs de prompts/respuestas OpenAI a archivo, activados por env.

## Estado actual (resumen)
- Web: búsqueda TMDb, detalles, favoritos con Auth0, edición de favorito, paginación, recomendaciones (5), tests críticos pasando.
- Backend: CRUD favoritos protegido, recomendaciones con fallback, TMDb client con filtros año/género y fallback por año, tests críticos pasando.
- Mobile: MVP Expo con login, búsqueda, detalles, favoritos, recomendaciones.

## Roadmap / Deploy
- Web en AWS Amplify (desplegado: https://main.d3qdp570j073t1.amplifyapp.com/).
- Backend en AWS App Runner (desplegado: https://epw3x6q244.us-east-2.awsapprunner.com).
- Patrones frontend documentados arriba; guía de despliegue cubierta en CI/CD y variables de entorno.

## CI/CD
- GitHub Actions (`.github/workflows/ci.yml`):
  - Ejecuta tests en cada `push`/`pull_request` a `main` (web con Vitest, backend con Jest/Supertest).
  - En `push` a `main`: build de imagen backend (`services/api`), push a ECR y `aws apprunner start-deployment` para redeploy automático.
- Web: usar CI/CD nativo de AWS Amplify por rama; no duplicar pipeline en Actions. **Configurar env en Amplify**: `NEXT_PUBLIC_API_BASE_URL` apuntando al backend de App Runner.
- Secrets necesarios en GitHub (Settings → Secrets → Actions): `AWS_ROLE_TO_ASSUME`, `AWS_REGION`, `AWS_ECR_REGISTRY`, `AWS_ECR_REPOSITORY`, `APP_RUNNER_SERVICE_ARN`.
