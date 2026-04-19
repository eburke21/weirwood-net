# CLAUDE.md — Weirwood.net

## Project Overview

ASOIAF prophecy tracker & connection engine. FastAPI backend + React frontend monorepo with AI-powered literary analysis via the Anthropic Claude API. Portfolio project.

Detailed spec in `dev-docs/spec.md`, phased implementation plan in `dev-docs/plan.md`, progress log in `dev-docs/progress.md`.

**Current state:** All 8 phases complete. Portfolio-ready. 57 tests passing, CI pipeline, comprehensive docs. Requires `ANTHROPIC_API_KEY` for AI features.

## Architecture

```
weirwood-net/
├── backend/          # FastAPI + Python 3.12+ (managed with uv)
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
│       ├── types/         # TS interfaces matching backend models
│       ├── api/           # fetchApi client + TanStack Query hooks
│       ├── components/    # layout/, shared/, prophecy/ components
│       ├── pages/         # All 6 pages fully implemented
│       ├── hooks/         # useDebounce, useSSE
│       └── theme/         # Custom Chakra system with weirwood tokens
├── data/             # SQLite database (gitignored, created at runtime)
├── docker-compose.yml
└── .env.example
```

## Quick Start

```bash
# Option 1: Docker (preferred for full-stack)
cp .env.example .env
docker compose up --build

# Option 2: Local development
# Backend:
cd backend && uv run uvicorn app.main:app --reload --port 8000
# Frontend (separate terminal):
cd frontend && npm run dev
```

## Common Commands

### Backend (run from `backend/`)
```bash
uv run uvicorn app.main:app --reload --port 8000   # Start dev server
uv sync                                             # Install/update deps
uv add <package>                                     # Add a dependency
uv run pytest -v                                     # Run tests (18 tests)
uv run ruff check .                                  # Lint
uv run mypy app/ --ignore-missing-imports            # Type check
```

### Frontend (run from `frontend/`)
```bash
npm run dev                    # Start Vite dev server (port 5173)
npm install                    # Install deps
npx tsc --noEmit               # Type-check without building
npx vitest run                 # Run tests (39 tests)
npx eslint src/                # Lint
```

### Docker
```bash
docker compose up --build      # Build and start both services
docker compose down            # Stop and remove containers
docker compose logs -f         # Tail logs
```

### Database
```bash
sqlite3 data/weirwood.db ".tables"     # List tables
sqlite3 data/weirwood.db ".schema"     # Show all schemas
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | FastAPI + SQLModel + aiosqlite | Python 3.12+, managed with `uv` |
| Frontend | React 18 + TypeScript + Chakra UI v3 | Vite build, TanStack Query for data fetching |
| Database | SQLite (async) | Single file at `data/weirwood.db`, created on startup |
| AI | Anthropic Claude API | SSE streaming for long analyses (Phase 4+) |
| Graph viz | D3.js (direct, not a React wrapper) | Force-directed + spoke graph via `useRef` + `useEffect` |
| Infra | Docker Compose | Single-command startup |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (`{"status": "ok", "version": "0.1.0"}`) |
| `GET` | `/api/v1/prophecies` | List prophecies with filtering, sorting, pagination |
| `GET` | `/api/v1/prophecies/{id}` | Single prophecy with connections array |
| `GET` | `/api/v1/events` | All pre-seeded events |
| `GET` | `/api/v1/prophecies/{id}/connections` | Cached connections for a prophecy |
| `POST` | `/api/v1/prophecies/{id}/connections/generate` | Generate connections via AI (SSE stream) |
| `POST` | `/api/v1/analyze/fulfillment` | Analyze event against prophecies (SSE stream) |
| `POST` | `/api/v1/predict/prophecy/{id}` | Per-prophecy TWOW prediction (SSE stream) |
| `POST` | `/api/v1/predict/global` | Global TWOW predictions report (SSE stream) |
| `GET` | `/api/v1/export/prophecy/{id}` | Download prophecy analysis as Markdown |
| `GET` | `/api/v1/graph` | Graph data: nodes + edges + stats (filterable) |

### Prophecy list filters (`GET /api/v1/prophecies`)
- `book` (1-5), `character` (case-insensitive contains), `type` (ProphecyType enum), `status` (ProphecyStatus enum)
- `subject` (substring match on subject_characters JSON), `search` (FTS5 full-text search)
- `sort_by` (source_book|title|prophecy_type|status|source_character), `sort_order` (asc|desc)
- `limit` (1-200, default 50), `offset` (default 0)
- Response: `{"items": [...], "total": N, "limit": N, "offset": N}`
- Each item includes computed `connection_count`

### Error format
All errors return: `{"error": {"code": "NOT_FOUND|VALIDATION_ERROR|AI_SERVICE_ERROR|RATE_LIMITED", "message": "..."}}`

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
- Freeform text input: sanitize with HTML tag stripping and 500-char limit before passing to AI
- Dual-input endpoints (e.g., fulfillment): accept `event_description` OR `event_id`, validate in service not router
- Export endpoint returns `Content-Type: text/markdown` with `Content-Disposition: attachment` for browser download

### Frontend (TypeScript)
- Chakra UI **v3.34** — uses `ChakraProvider` + custom `system` from `createSystem(defaultConfig, config)`, NOT `Provider` or `extendTheme`
- Compound component pattern for Drawer, Table, Alert, Select (e.g., `DrawerRoot` / `DrawerContent` / `DrawerTrigger`, `Table.Root` / `Table.Header` / `Table.Row`)
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

- **75 prophecies** covering all 9 types, all 5 statuses, all 5 books
- **23 canonical events** covering all 5 books
- Loaded from `backend/app/seed/*.json` on first boot (idempotent — skips if tables have data)
- FTS5 index populated after prophecy seeding
- To re-seed: delete `data/weirwood.db` and restart the backend

## Gotchas

- `greenlet` is a required dependency for async SQLAlchemy — without it, `init_db()` crashes at runtime with a confusing `ValueError`
- Chakra UI v3.34 uses `ChakraProvider` (not `Provider`) — wrong name causes blank page with console-only module import error
- Chakra UI v3 online examples are often v2 syntax — always verify compound component patterns (e.g., `DrawerRoot` not `Drawer`, `open` not `isOpen`, `onOpenChange` not `onClose`)
- `uv init` generates boilerplate files (`hello.py`, `README.md`) — remove them
- The backend creates `data/weirwood.db` on first startup via the FastAPI lifespan handler
- Port 5173 (frontend) and 8000 (backend) must be free before running Docker or local dev
- FTS5 index is not auto-synced — if prophecy data changes after seed, the FTS table must be manually updated
- `select(Model, computed_col)` returns tuples `(Model, value)`, not enriched model instances — unpack with `row[0]`, `row[1]`
- Searching JSON array columns: use `literal_column("col_name").like(...)` not `Model.col` (avoids SQLAlchemy JSON operator conflicts)
- Connections are directional (source→target) but queries must check both directions with `or_`
- Claude sometimes wraps JSON in markdown code fences despite "no markdown" in the prompt — `weirwood.py` strips them defensively
- When passing object options to custom hooks (like `useSSE`), wrap in `useMemo` to prevent infinite re-renders from reference changes
- `EventSource` API only supports GET — our SSE endpoints need POST with JSON body, so we use `fetch` + `ReadableStream.getReader()` instead
- `AnimatePresence` from framer-motion 12 crashes with React 19 (invalid hook call) — use `motion.div` with `key` prop for entrance-only animations instead
- Seed data: must delete `data/weirwood.db` (or `backend/data/weirwood.db`) to re-seed after changing JSON files — the loader skips if tables have data

## Frontend Component Map

```
src/
├── api/
│   ├── client.ts              # fetchApi<T>() generic client
│   ├── prophecies.ts          # useProphecies(), useProphecy() hooks
│   ├── events.ts              # useEvents() hook
│   ├── sse.ts                 # SSE event parser (parseSSEEvents)
│   └── graph.ts               # useGraphData() hook for graph endpoint
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx         # Sticky nav with links + mobile drawer
│   │   └── Layout.tsx         # Navbar + Outlet wrapper
│   ├── shared/
│   │   ├── StatusBadge.tsx    # Color-coded prophecy status
│   │   ├── TypeIcon.tsx       # Emoji + label for prophecy type
│   │   ├── BookBadge.tsx      # AGOT/ACOK/ASOS/AFFC/ADWD badge
│   │   ├── ConfidenceBadge.tsx # 0-100% colored badge
│   │   └── StreamingText.tsx  # Text with blinking cursor during AI streaming
│   ├── prophecy/
│   │   ├── SearchInput.tsx    # Debounced FTS search → URL param
│   │   ├── FilterBar.tsx      # Book/type/status/character dropdowns
│   │   ├── ProphecyCard.tsx   # Single card in grid view
│   │   ├── ProphecyCardGrid.tsx # Responsive 3-col card grid
│   │   ├── ProphecyTable.tsx  # Sortable table view
│   │   └── Pagination.tsx     # Previous/Next with "Showing X-Y of Z"
│   ├── connections/
│   │   ├── ConnectionCard.tsx # AI-generated connection with type badge + evidence
│   │   └── SpokeGraph.tsx     # Static radial SVG graph for detail page
│   └── graph/
│       ├── ForceGraph.tsx     # D3 force-directed network graph
│       ├── GraphControls.tsx  # Filter dropdowns + confidence slider
│       ├── GraphLegend.tsx    # Visual encoding reference (colors, sizes)
│       └── scales.ts         # D3 color/size/opacity scale functions
├── pages/
│   ├── Dashboard.tsx          # Main browse page (assembles all above)
│   ├── ProphecyDetail.tsx     # Full view + ConnectionsPanel + PredictionPanel + Export
│   ├── GraphExplorer.tsx      # D3 force graph + controls + legend + mobile list fallback
│   ├── FulfillmentAnalyzer.tsx # Event input + pre-seeded chips + SSE match cards
│   ├── TWOWPredictions.tsx    # Per-prophecy + global report with token streaming
│   └── About.tsx              # Portfolio page: tech stack, skills table, architecture, credits
├── hooks/
│   ├── useDebounce.ts         # Generic debounce hook
│   └── useSSE.ts              # SSE stream consumer (fetch + ReadableStream)
├── theme/
│   └── index.ts               # Custom Chakra system with weirwood tokens
└── types/
    └── index.ts               # All TS interfaces (Prophecy, Connection, etc.)
```

## Environment Variables

All defined in `backend/app/config.py`, with defaults. Copy `.env.example` to `.env`:

| Variable | Default | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | `""` | Yes (for AI features, Phase 4+) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/weirwood.db` | No |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | No |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | No |
| `RATE_LIMIT_PER_MINUTE` | `10` | No |
| `MAX_DAILY_API_SPEND_USD` | `5.0` | No |
| `LOG_LEVEL` | `INFO` | No |

## Database Schema (4 tables + 1 virtual)

- **prophecies** — Core prophecy entries with type, status, source info, JSON arrays for characters/keywords
- **connections** — AI-generated links between prophecies with type, confidence, evidence (unique on source+target+type)
- **events** — Pre-seeded canonical events for the fulfillment analyzer
- **analysis_cache** — Cached AI analysis results keyed by input hash (unique on type+hash)
- **prophecies_fts** — FTS5 virtual table indexing prophecy title, description, notes for full-text search

Tables are auto-created on backend startup. See `backend/app/models/` for full definitions.
