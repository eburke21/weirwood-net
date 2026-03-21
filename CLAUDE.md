# CLAUDE.md — Weirwood.net

## Project Overview

ASOIAF prophecy tracker & connection engine. FastAPI backend + React frontend monorepo with AI-powered literary analysis via the Anthropic Claude API. Portfolio project.

Detailed spec in `dev-docs/spec.md`, phased implementation plan in `dev-docs/plan.md`, progress log in `dev-docs/progress.md`.

**Current state:** Phase 1 complete (infrastructure skeleton). No business logic, CRUD routes, or seed data yet.

## Architecture

```
weirwood-net/
├── backend/          # FastAPI + Python 3.12+ (managed with uv)
│   ├── app/
│   │   ├── main.py        # FastAPI app, lifespan, CORS
│   │   ├── config.py      # pydantic-settings (reads .env)
│   │   ├── database.py    # Async SQLite engine, session factory
│   │   ├── models/        # SQLModel table definitions
│   │   ├── routers/       # API route handlers (empty, Phase 2)
│   │   ├── services/      # Business logic (empty, Phase 2+)
│   │   └── seed/          # JSON seed data files (empty, Phase 2)
│   └── tests/
├── frontend/         # React 18 + TypeScript + Vite
│   └── src/
│       ├── main.tsx       # Chakra UI v3 Provider + React Query + Router
│       ├── App.tsx        # Route definitions
│       ├── types/         # TS interfaces matching backend models
│       ├── api/           # API client (empty, Phase 2+)
│       ├── components/    # Shared components (empty, Phase 3+)
│       ├── pages/         # Page components (empty, Phase 3+)
│       ├── hooks/         # Custom hooks (empty, Phase 3+)
│       └── theme/         # Chakra UI theme tokens (placeholder)
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
uv run pytest                                        # Run tests (none yet)
```

### Frontend (run from `frontend/`)
```bash
npm run dev                    # Start Vite dev server (port 5173)
npm install                    # Install deps
npx tsc --noEmit               # Type-check without building
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
| Graph viz | D3.js (direct, not a React wrapper) | Phase 6 |
| Infra | Docker Compose | Single-command startup |

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

### Frontend (TypeScript)
- Chakra UI **v3** — uses `Provider` + `defaultSystem`, NOT `ChakraProvider` + `extendTheme`
- TypeScript interfaces in `src/types/index.ts` must mirror backend models
- React Router for navigation, TanStack Query for server state
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `strict` mode enabled
- ESLint with react-hooks and react-refresh plugins

### Docker
- Backend healthcheck uses Python `urllib` (no curl in slim image)
- Frontend Dockerfile runs `npm run dev -- --host 0.0.0.0` (required for Docker networking)
- SQLite persists via volume mount `./data:/app/data`

## Gotchas

- `greenlet` is a required dependency for async SQLAlchemy — without it, `init_db()` crashes at runtime with a confusing `ValueError`
- Chakra UI v3 online examples are often v2 syntax — always verify against v3 API (`Provider`, `defaultSystem`, `gap` not `spacing`)
- `uv init` generates boilerplate files (`hello.py`, `README.md`) — remove them
- The backend creates `data/weirwood.db` on first startup via the FastAPI lifespan handler
- Port 5173 (frontend) and 8000 (backend) must be free before running Docker or local dev

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

## Database Schema (4 tables)

- **prophecies** — Core prophecy entries with type, status, source info, JSON arrays for characters/keywords
- **connections** — AI-generated links between prophecies with type, confidence, evidence
- **events** — Pre-seeded canonical events for the fulfillment analyzer
- **analysis_cache** — Cached AI analysis results keyed by input hash

Tables are auto-created on backend startup. See `backend/app/models/` for full definitions.
