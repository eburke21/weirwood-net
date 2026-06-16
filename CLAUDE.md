# CLAUDE.md — Weirwood.net

## Project Overview

ASOIAF prophecy tracker & connection engine. FastAPI backend + React frontend monorepo with AI-powered literary analysis via the Anthropic Claude API. Portfolio project.

Detailed spec in `dev-docs/spec.md`, phased plan in `dev-docs/plan.md`, progress log in `dev-docs/progress.md`. These hold the exhaustive API/schema reference — keep this file focused on workflow and non-obvious patterns.

**Current state:** All 8 phases complete. **Deployed** (Railway backend + Vercel frontend) and portfolio-ready. **65 tests** passing (24 backend / 41 frontend), CI pipeline, comprehensive docs. Requires `ANTHROPIC_API_KEY` for AI features.

## Architecture

```
weirwood-net/
├── Makefile          # Task runner — the canonical command interface (see below)
├── backend/          # FastAPI + Python 3.12+ (managed with uv)
│   ├── railway.json       # Railway deploy config (Dockerfile build, /health check)
│   ├── app/
│   │   ├── main.py        # FastAPI app, lifespan, CORS
│   │   ├── config.py      # pydantic-settings (reads .env)
│   │   ├── database.py    # Async SQLite engine, session factory
│   │   ├── models/        # SQLModel table definitions
│   │   ├── routers/       # API route handlers (prophecies, events, connections, analyze, predict, export)
│   │   ├── services/      # AI service (weirwood.py), prompts, SSE streaming
│   │   ├── errors.py      # Custom exceptions + global error handlers
│   │   └── seed/          # JSON seed data + loader
│   └── tests/
├── frontend/         # React 18 + TypeScript + Vite
│   └── src/
│       ├── main.tsx       # Chakra UI v3 Provider + React Query + Router
│       ├── App.tsx        # Route definitions
│       ├── config.ts      # Centralized API_BASE (strips trailing slash from VITE_API_URL)
│       ├── types/         # TS interfaces matching backend models
│       ├── api/           # fetchApi client + TanStack Query hooks
│       ├── components/    # layout/, shared/, prophecy/, connections/, graph/
│       ├── pages/         # All 6 pages fully implemented
│       ├── hooks/         # useDebounce, useSSE
│       └── theme/         # Custom Chakra system with weirwood tokens
├── data/             # SQLite database (gitignored, created at runtime)
├── docker-compose.yml
└── .env.example
```

## Quick Start

```bash
cp .env.example .env       # add ANTHROPIC_API_KEY
make up                    # Docker: build + start backend (:8000) + frontend (:5173)
# or run locally in two terminals:
make backend-dev           # uvicorn --reload on :8000
make frontend-dev          # Vite dev server on :5173
```

## Common Commands

**The `Makefile` is the command interface — prefer `make <target>` over raw `uv`/`npm`.** Run `make help` for the full list. Most-used:

| Target | What it does |
|--------|--------------|
| `make up` / `make down` / `make logs` | Docker lifecycle |
| `make test` | Backend pytest + frontend vitest (65 tests) |
| `make lint` / `make typecheck` | ruff+eslint / mypy+tsc |
| `make db-reset` | Wipe SQLite DB + restart to re-seed |
| `make db-shell` / `make db-backup` | SQLite shell / timestamped DB copy |
| `make spend` | Show today's Claude API spend from `spend_log` |

Raw equivalents (when a Makefile target doesn't fit): backend uses `uv run <cmd>` from `backend/` (never activate the venv manually); frontend uses `npm`/`npx` from `frontend/`.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | FastAPI + SQLModel + aiosqlite | Python 3.12+, managed with `uv` |
| Frontend | React 18 + TypeScript + Chakra UI v3 | Vite build, TanStack Query for data fetching |
| Database | SQLite (async) | Single file at `data/weirwood.db`, created on startup |
| AI | Anthropic Claude API | SSE streaming for long analyses (Phase 4+) |
| Graph viz | D3.js (direct, not a React wrapper) | Force-directed + spoke graph via `useRef` + `useEffect` |
| Infra | Docker Compose (local) · Railway + Vercel (prod) | Single-command local startup |

## Deployment

- **Backend → Railway.** Config in `backend/railway.json`: Dockerfile build, start command binds `--host 0.0.0.0 --port ${PORT:-8000}`, healthcheck on `/health` (90s timeout), restart-on-failure. Railway injects `$PORT` — the server **must** bind it, not a hardcoded 8000.
- **Frontend → Vercel.** Built with `VITE_API_URL` pointing at the Railway backend URL. `src/config.ts` strips any trailing slash from that env var (Railway/Vercel dashboards copy URLs with one) to avoid `host//api/...` double-slash bugs.
- **CORS:** set `CORS_ORIGINS` on the backend to include the deployed Vercel origin (defaults to localhost only).

## API & Error Format

Full endpoint list, query filters, and response shapes live in `dev-docs/spec.md`. Quick orientation: REST under `/api/v1/*`; AI endpoints (`/connections/generate`, `/analyze/fulfillment`, `/predict/*`) are **POST + SSE streams**; `/health` and `/api/v1/graph` are plain GET.

All errors return:
```json
{"error": {"code": "NOT_FOUND|VALIDATION_ERROR|AI_SERVICE_ERROR|RATE_LIMITED", "message": "..."}}
```

## Code Conventions

### Backend (Python)
- Use `uv run` to execute commands — never activate the venv manually
- All models are SQLModel classes with `table=True` in `app/models/`
- New models must be imported in `app/models/__init__.py` (required for table creation)
- JSON array fields use `Field(default_factory=list, sa_column=Column(JSON))`
- Enums inherit from `(str, Enum)` for JSON serialization
- Timestamps use `datetime.now(timezone.utc)` (not `datetime.utcnow()`)
- Config via `pydantic-settings` in `config.py` — add new env vars there with defaults
- Async everywhere: async engine, async sessions, async route handlers
- Errors: raise domain exceptions (`NotFoundError`, etc.) — global handlers in `errors.py` produce the JSON response
- New routes: create a router in `app/routers/`, register in `main.py` via `app.include_router()`
- Sort fields must be whitelisted in `ALLOWED_SORT_FIELDS` set
- Search uses FTS5 `MATCH` with `LIKE` fallback — FTS index must be populated when data changes
- AI prompts centralized in `services/prompts.py` — all template strings and format functions live there
- Claude API calls are non-streaming (need complete JSON), but results are streamed to frontend via SSE events
- SSE events follow pattern: `status` → N × `connection`/`match` → `complete` or `error`
- AI service validates all output (check IDs exist, validate enums, clamp confidence) before persisting
- Connection upsert: check existing by `(source, target, type)` before inserting
- Two streaming patterns: non-streaming Claude for JSON output (connections, fulfillment) vs `client.messages.stream()` for prose (predictions)
- Analysis caching: SHA-256 hash of `type:input` → `analysis_cache` table. Check cache before API call, store after. Cache keys differ by type: fulfillment hashes event text, single prediction hashes `prophecy_id:model`, global prediction hashes `sorted_ids:model`
- Cached results replay as SSE events with same protocol as fresh results — frontend doesn't distinguish
- Every Claude call is logged to `spend_log` (tokens + cost); `MAX_DAILY_API_SPEND_USD` caps daily spend
- Freeform text input: sanitize with HTML tag stripping and 500-char limit before passing to AI
- Dual-input endpoints (e.g., fulfillment): accept `event_description` OR `event_id`, validate in service not router
- Export endpoint returns `Content-Type: text/markdown` with `Content-Disposition: attachment` for browser download

### Frontend (TypeScript)
- Chakra UI **v3.34** — uses `ChakraProvider` + custom `system` from `createSystem(defaultConfig, config)`, NOT `Provider` or `extendTheme`
- Compound component pattern for Drawer, Table, Alert, Select (e.g., `DrawerRoot` / `DrawerContent` / `DrawerTrigger`, `Table.Root` / `Table.Header` / `Table.Row`)
- Import `API_BASE` from `src/config.ts` — never read `import.meta.env.VITE_API_URL` directly (config strips trailing slashes)
- TypeScript interfaces in `src/types/index.ts` must mirror backend models — `ProphecyListItem` (with connection_count) and `ProphecyDetail` (with connections array) extend base `Prophecy`
- Filter state lives in URL search params (`useSearchParams`), NOT React state — enables bookmarking, sharing, browser back/forward
- Always use `{ replace: true }` when setting search params to avoid polluting browser history
- Always `params.delete("offset")` when any filter changes (prevents invalid pagination)
- Text inputs (search, character) must be debounced via `useDebounce` hook (300ms) — never wire raw onChange to URL params
- API client: `fetchApi<T>()` in `src/api/client.ts` — strips undefined/empty params, extracts backend error messages
- TanStack Query hooks: include filter params in `queryKey` array for automatic per-filter caching (e.g., `["prophecies", params]`)
- Use `enabled: id > 0` guard on detail queries to prevent fetching with invalid IDs
- Polymorphic `as` prop for navigation: `<Heading as={Link} to="/">` renders a single semantic element
- Responsive: use object syntax `{ base: 1, md: 2, lg: 3 }` for breakpoint values
- Three-branch render for data pages: `{isLoading && <Skeleton/>}`, `{isError && <Alert/>}`, `{data && <Content/>}`
- SSE: use `useSSE` hook (not native `EventSource` — our SSE endpoints need POST with JSON body). Hook uses `fetch` + `ReadableStream.getReader()`
- After SSE streaming completes, invalidate relevant TanStack Query caches with `queryClient.invalidateQueries()`
- For multiple independent SSE streams on one page (e.g., per-prophecy vs global predictions), instantiate separate `useSSE` hooks — don't try to reuse one with dynamic options
- Client-side Markdown export: `new Blob([text], {type: "text/markdown"})` + `URL.createObjectURL` + hidden `<a>` click. Use for data already in React state (e.g., global report). Use server endpoint for data that needs DB assembly (e.g., per-prophecy export with connections)
- D3 integration: D3 owns SVG DOM via `useRef` + `useEffect`, React owns data flow. Never mix D3 imperative updates with React declarative rendering on same elements
- D3 scales in `components/graph/scales.ts` — pure functions, shared by ForceGraph and SpokeGraph
- ForceGraph cleanup: `simulation.stop()` in `useEffect` return function to prevent memory leaks
- Graph responsive sizing: `ResizeObserver` on container div, pass dimensions as props to ForceGraph
- Animations: wrap Chakra components in `motion.div` (not `motion.create(Box)`) — Framer handles transform/opacity, Chakra handles colors/spacing, no conflicts
- Staggered card entrance: `delay: Math.min(i * 0.04, 0.4)` — cap prevents long waits on large lists
- Mobile degradation: render different content by breakpoint (`display={{ base: "none", md: "block" }}`) — graph → list, table toggle → hidden. Be honest with "best viewed on desktop" text
- Reduced motion: global CSS `@media (prefers-reduced-motion: reduce)` disables all animations with `0.01ms !important` (not `0s` — avoids skipping animation callbacks)
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `strict` mode enabled
- ESLint with react-hooks and react-refresh plugins

### Docker
- Backend healthcheck uses Python `urllib` (no curl in slim image)
- Frontend Dockerfile runs `npm run dev -- --host 0.0.0.0` (required for Docker networking)
- SQLite persists via volume mount `./data:/app/data`

## Seed Data

- **75 prophecies** (all 9 types, 5 statuses, 5 books) + **23 canonical events** (all 5 books)
- Loaded from `backend/app/seed/*.json` on first boot (idempotent — skips if tables have data)
- FTS5 index populated after prophecy seeding
- To re-seed: `make db-reset` (deletes `data/weirwood.db` and restarts the backend). The loader skips if tables already have data, so the delete is mandatory after editing seed JSON.

## Gotchas

- `greenlet` is a required dependency for async SQLAlchemy — without it, `init_db()` crashes at runtime with a confusing `ValueError`
- Chakra UI v3.34 uses `ChakraProvider` (not `Provider`) — wrong name causes blank page with console-only module import error
- Chakra UI v3 online examples are often v2 syntax — always verify compound component patterns (e.g., `DrawerRoot` not `Drawer`, `open` not `isOpen`, `onOpenChange` not `onClose`)
- The backend creates `data/weirwood.db` on first startup via the FastAPI lifespan handler
- Port 5173 (frontend) and 8000 (backend) must be free before running Docker or local dev
- Railway sets `$PORT` at runtime — the start command must bind it (`--port ${PORT:-8000}`), not a hardcoded port, or the healthcheck fails
- `VITE_API_URL` with a trailing slash produces `host//api/...` 404s — `src/config.ts` strips it defensively
- FTS5 index is not auto-synced — if prophecy data changes after seed, the FTS table must be manually updated
- `select(Model, computed_col)` returns tuples `(Model, value)`, not enriched model instances — unpack with `row[0]`, `row[1]`
- Searching JSON array columns: use `literal_column("col_name").like(...)` not `Model.col` (avoids SQLAlchemy JSON operator conflicts)
- Connections are directional (source→target) but queries must check both directions with `or_`
- Claude sometimes wraps JSON in markdown code fences despite "no markdown" in the prompt — `weirwood.py` strips them defensively
- When passing object options to custom hooks (like `useSSE`), wrap in `useMemo` to prevent infinite re-renders from reference changes
- `EventSource` API only supports GET — our SSE endpoints need POST with JSON body, so we use `fetch` + `ReadableStream.getReader()` instead
- `AnimatePresence` from framer-motion 12 crashes with React 19 (invalid hook call) — use `motion.div` with `key` prop for entrance-only animations instead

## Environment Variables

Defined with defaults in `backend/app/config.py` (read from `.env`). Key ones:

| Variable | Default | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | `""` | **Yes** (for AI features) |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | No |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | No (add prod origin when deployed) |
| `MAX_DAILY_API_SPEND_USD` | `5.0` | No |

Also: `DATABASE_URL`, `RATE_LIMIT_PER_MINUTE`, `LOG_LEVEL` — see `config.py` for full list and defaults. Frontend reads `VITE_API_URL` (build-time).

## Database Schema (5 tables + 1 virtual)

Defined in `backend/app/models/`, auto-created on backend startup.

- **prophecies** — Core entries: type, status, source info, JSON arrays for characters/keywords
- **connections** — AI-generated links between prophecies: type, confidence, evidence (unique on source+target+type)
- **events** — Pre-seeded canonical events for the fulfillment analyzer
- **analysis_cache** — Cached AI analysis results keyed by input hash (unique on type+hash)
- **spend_log** — Per-call Claude API usage (endpoint, model, tokens, `cost_usd`); backs `make spend` and the daily-spend cap
- **prophecies_fts** — FTS5 virtual table indexing prophecy title, description, notes for full-text search
