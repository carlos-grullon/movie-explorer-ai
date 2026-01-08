# Movie Explorer AI

Web + API app to search movies via TMDb, view details, and manage authenticated favorites.

## Prerequisites
- Node.js (recommended: latest LTS)
- A TMDb API key (optional if you run in mock mode)

## Install
```bash
npm install
```

## Run (dev)
Run everything (API + Web):
```bash
npm run dev
```

Run only Web:
```bash
npm run dev:web
```

Run only API:
```bash
npm run dev:api
```

## Environment Variables

### Web (`apps/web/.env.local`)
- `TMDB_API_KEY` (required unless `TMDB_MOCK=true`)
- `TMDB_MOCK` (`true`/`false`) — if `true`, the app uses the built-in mock TMDb dataset.

Auth0 (required for authenticated favorites):
- `AUTH0_SECRET`
- `AUTH0_BASE_URL`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`

### API (`services/api/.env`)
- `DATABASE_URL`

Auth0 JWT validation:
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`

Recommendations (AI + fallback):
- `TMDB_API_KEY` (required)
- `OPENAI_API_KEY` (optional) — if set, recommendations use OpenAI; if missing/invalid, the API falls back to TMDb similar movies.
- `OPENAI_MODEL` (optional, default: `gpt-4o-mini`)

Temporary monitoring logs (AI prompt/response):
- `API_LOG_OPENAI=true` enables prompt/response logging for recommendations.
- `API_LOG_DIR` sets the base folder for logs (example: `../logs` writes to `services/logs`).
- `API_LOG_OPENAI_FILE` (default: `openai.log`) file name/path (relative paths are resolved under `API_LOG_DIR`).
- `API_LOG_OPENAI_MAX_CHARS` (default: `8000`) truncates long prompt/response values.

Optional:
- `AUTH_DISABLED=true` (dev-only bypass)

## AI Recommendations

The API endpoint `GET /recommendations/:movieId` generates up to 5 recommendations.

- If `OPENAI_API_KEY` is configured, it calls OpenAI (default model `gpt-4o-mini`) using a prompt built from TMDb movie details.
- If OpenAI is not configured (or returns an auth error), it falls back to TMDb's `similar` endpoint.

### Monitoring how the AI works (prompt + raw response)

When `API_LOG_OPENAI=true`, the API appends JSON lines to the configured log file (typically `services/logs/openai.log`).

Each recommendation call logs two entries:
- `phase: "before"` contains the exact prompt sent to OpenAI
- `phase: "after"` contains the raw `message.content` returned by OpenAI (before JSON parsing)

Security notes:
- Do not commit logs. They may include user-facing content (movie overview + model output).
- The app does not log API keys or JWTs.

## Software Development Patterns (Required)

This project intentionally uses a small set of common patterns to keep the codebase understandable, testable, and easy to extend.

Monorepo (npm workspaces):
- `apps/web` is the Next.js UI.
- `services/api` is the Express API.
- A root `package.json` orchestrates common workflows (`npm run dev`, `npm run dev:web`, `npm run dev:api`).

Why: a single repo makes it easy to keep API + Web changes in sync (especially for auth and recommendation contracts).

BFF / API Gateway (Next.js route handlers):
- The web app exposes server-side routes under `apps/web/src/app/api/*`.
- These routes forward requests to the backend API and attach Auth0 access tokens.

Why: keeps browser code simple (no token handling in the client) and centralizes auth/session concerns in one place.

Layered backend structure (Router → Service → Clients/Repositories):
- `routes/*` define HTTP endpoints and validation.
- `services/*` implement core business logic (favorites + recommendations).
- `tmdb/*` and `openai/*` are external API clients.
- `repositories/*` encapsulate database access (Prisma).

Why: separation of concerns; each layer is easier to test and replace.

Authentication as middleware (Auth0 JWT validation):
- Backend uses a dedicated auth middleware (`requireAuth`) to protect routes.
- Web uses Auth0 session handling to obtain an access token and call the backend.

Why: consistent enforcement at the edge of the API, while keeping route logic focused on business behavior.

Resilience via fallback strategy (OpenAI → TMDb):
- Recommendations prefer OpenAI when configured.
- If OpenAI is missing/invalid or returns an auth error, the API falls back to TMDb similar movies.

Why: keeps the app functional even when the AI provider is unavailable.

Feature monitoring via env-toggled file logs:
- OpenAI prompt/response logging is file-based and controlled by env vars.

Why: enables debugging/verification of AI behavior without changing runtime code paths for all environments.

## Notes
- The web dev server runs with `next dev --webpack` for stability in this monorepo setup.
