# Movie Explorer AI — Project Goals & Feature Checklist

This document tracks the challenge requirements, what is implemented, and what remains.

## Product Summary
A web + mobile app to explore movies (TMDb), view details, manage authenticated favorites persisted via a backend relational DB, and provide AI-powered recommendations (max 5).

---

## Environment Setup (Local)

### Web (`apps/web/.env.local`)
- `TMDB_API_KEY` (required unless `TMDB_MOCK=true`)
- `TMDB_MOCK` (`true`/`false`) — use built-in mock dataset for demos without a TMDb key.

### API (`services/api/.env`)
- `DATABASE_URL`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`

---

## Current Status (High Level)

### Web (Next.js)
- [x] Auth0 login/logout (session) wired
- [x] TMDb search + movie details
- [x] Favorites add/remove via backend API
- [x] Favorites edit form (custom title, personal notes)
- [x] Search pagination UI
- [ ] Recommendations UI (5 items max)

### Backend (Node/Express)
- [x] Favorites CRUD endpoints (GET/POST/PUT/DELETE)
- [x] Auth0 JWT protection for endpoints
- [x] Repository/Service pattern in place
- [ ] Recommendations endpoint fully wired to AI provider (or mock)

### Mobile (Expo)
- [ ] Expo app scaffold
- [ ] Auth0 login
- [ ] TMDb search/details
- [ ] Favorites CRUD via backend
- [ ] Recommendations

---

## Requirements Checklist

### Frontend Requirements

#### Web Desktop
- [x] Framework: Next.js
- [ ] Deploy on AWS Amplify

#### Mobile
- [ ] Framework: React Native (Expo)

#### Features
- [x] **Search**: search movies by title (TMDb)
- [x] **Movie details**: title, year, genre, plot
- [x] **Favorites management**:
  - [x] Add/remove favorites
  - [x] Persist favorites via backend + relational DB
  - [x] Only authenticated users can manage favorites
  - [x] Auth0 integrated
- [x] **Forms**: update favorite details (custom title, personal notes)

### Backend Requirements

#### Tech + Deploy
- [x] Node.js
- [ ] Deploy on free-tier provider (Render/Vercel/Lambda)

#### Authentication
- [x] Auth0 JWT validation (JWKS + issuer + audience)

#### API Endpoints
- [x] `GET /favorites`
- [x] `POST /favorites`
- [x] `PUT /favorites/{id}`
- [x] `DELETE /favorites/{id}`

#### AI Integration (Recommendations)
- [ ] `GET /recommendations/{movie_id}`
- [ ] Max 5 recommendations
- [ ] Integrate in frontend (movie details page)
- [ ] Free-tier AI provider strategy:
  - [ ] OpenAI (credits)
  - [ ] Hugging Face (free)
  - [ ] Cohere (free)

---

## Software Development Patterns (Required)

### Backend Pattern
- [x] Repository + Service
- [ ] README section explaining patterns used and why

### Frontend Pattern
- [x] App Router + Components
- [ ] Formalize and document a clear pattern:
  - Option A: Custom hooks (`useFavorites`, `useTmdbSearch`, `useRecommendations`)
  - Option B: Container/Presentational split for major screens
- [ ] README section explaining patterns used and why

---

## Bonus Points
- [ ] AI-based sentiment analysis (reviews/comments)
- [x] Pagination (search results)
- [ ] Testing (unit + integration)
- [ ] Performance optimization (React Query / memoization)
- [ ] Documentation (complete README)

---

## UX / Visual Polish ("Wow" Factor)

### UI Improvements (Web)
- [ ] Define a small design system: colors, spacing, typography, radius, shadows
- [ ] Consistent button variants (primary/secondary/destructive)
- [ ] Better empty states (search, favorites, recommendations)
- [ ] Loading skeletons (search results, favorites list, movie details)
- [ ] Improve mobile responsiveness (layout + tap targets)

---

## TMDb Dataset Expansion (Optional)

Goal: allow richer browsing without depending entirely on live TMDb calls.

Options:
- [ ] Expand mock dataset (fastest, good for offline demos)
- [ ] Add a server-side cache layer for TMDb details/search
- [ ] Build a one-time importer/seed script to store popular/top-rated movies in DB
- [ ] Add a "Trending" / "Popular" browse page using TMDb endpoints

---

## Deliverables
- [ ] Public GitHub repo
- [ ] Public live preview:
  - [ ] Web on AWS Amplify
  - [ ] Backend on free-tier provider
- [ ] README:
  - [ ] Local run instructions
  - [ ] Deployment steps
  - [ ] API docs (Swagger acceptable)
  - [ ] Patterns explanation

---

## Suggested Milestone Order (1-week delivery)

1. **Favorites Edit UI** (forms for title/notes)
2. **Search Pagination UI**
3. **UI Polish (Wow factor)**
4. **Recommendations endpoint + UI** (limit 5)
5. **Mobile (Expo) MVP** (login + search + favorites)
6. **Testing pass** (backend + web)
7. **Deploy** (Render + Amplify) + README
