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

## Notes
- The web dev server runs with `next dev --webpack` for stability in this monorepo setup.
