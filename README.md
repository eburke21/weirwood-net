# Weirwood.net

**ASOIAF Prophecy Tracker & Connection Engine** — A literary analysis tool that catalogs every known prophecy in *A Song of Ice and Fire*, tracks fulfillment status, and uses AI to surface non-obvious relationships between them.

Built with React, FastAPI, D3.js, and Claude AI. Demonstrates entity extraction, relationship mapping, streaming AI responses, and graph visualization.

## Quick Start

```bash
git clone https://github.com/your-username/weirwood-net.git
cd weirwood-net
cp .env.example .env           # Add your ANTHROPIC_API_KEY
docker compose up --build      # Open http://localhost:5173
```

## What It Does

Weirwood.net is a searchable, filterable prophecy database with AI-powered connection discovery. Browse 75 hand-curated prophecies across all 5 books, find thematic links between them using Claude AI, analyze which prophecies a given event fulfills, and generate TWOW predictions — all with streaming responses and persistent caching.

## Features

- **Browse & Filter** — Dashboard with card/table views, full-text search (FTS5), filtering by book, type, status, character
- **AI Connection Finder** — Click "Find Connections" on any prophecy to discover thematic parallels, shared fulfillments, contradictions, and sequential links via Claude AI
- **Fulfillment Analyzer** — Describe any event (real or hypothetical) and see which prophecies it might fulfill, with confidence scores and reasoning
- **TWOW Predictions** — Per-prophecy predictions and comprehensive global reports for The Winds of Winter, with real-time token streaming
- **Graph Explorer** — D3 force-directed network graph showing prophecy connections. Nodes colored by type, sized by connection count. Zoom, pan, drag, filter.
- **Export** — Download any prophecy's full analysis (connections + predictions) as Markdown

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI framework with strict typing |
| Components | Chakra UI v3 | Component library + theming |
| Data Fetching | TanStack Query | Server state, caching, SSE consumption |
| Visualization | D3.js (direct) | Force-directed graph + spoke views |
| Animations | Framer Motion | Page transitions, card stagger |
| Backend | FastAPI + Python 3.12 | REST API + SSE streaming |
| ORM | SQLModel | SQLAlchemy + Pydantic unified |
| Database | SQLite + FTS5 | Zero-config storage + full-text search |
| AI | Anthropic Claude API | Connection analysis, predictions |
| Streaming | SSE (sse-starlette) | Real-time AI response delivery |
| Package Mgmt | uv (Python), npm (JS) | Fast dependency management |
| Infrastructure | Docker Compose | Single-command deployment |

## Architecture

```
Frontend (React)          Backend (FastAPI)          External
┌─────────────────┐      ┌─────────────────┐      ┌──────────┐
│ Dashboard       │─────▶│ REST API        │      │ Anthropic│
│ Detail + AI     │◀─SSE─│ AI Service      │─────▶│ Claude   │
│ Graph Explorer  │      │ SQLite + FTS5   │      │ API      │
│ Analyzer        │      │ Analysis Cache  │      └──────────┘
│ Predictions     │      └─────────────────┘
└─────────────────┘
```

**Key design decisions:**
- **SQLite over PostgreSQL** — Dataset is small (~75 prophecies), read-heavy, single-user. SQLite eliminates infrastructure complexity and makes Docker setup trivial.
- **SSE over WebSockets** — AI analysis is unidirectional (server → client). SSE is simpler, auto-reconnects, and matches the Anthropic SDK's streaming API.
- **Non-streaming AI + streaming transport** — Claude returns complete JSON for structured output (connections, fulfillment matches). SSE delivers validated results progressively. Token streaming used only for prose (predictions).
- **Persisted connections with refresh** — AI-generated connections are stored in SQLite for instant load on revisit. "Regenerate" button allows fresh analysis.
- **D3.js direct, not a wrapper** — Full control over force simulation, zoom, drag, tooltips, and visual encoding.

## Development

### Without Docker

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend && uv run pytest -v

# Frontend tests
cd frontend && npx vitest run

# Type checking
cd backend && uv run mypy app/ --ignore-missing-imports
cd frontend && npx tsc --noEmit
```

### Adding Prophecies

Edit `backend/app/seed/prophecies.json` following the existing entry format. Delete `backend/data/weirwood.db` and restart the backend to re-seed.

Required fields: `title`, `description`, `source_character`, `source_chapter`, `source_book` (1-5), `prophecy_type`, `status`, `subject_characters` (array), `keywords` (array).

## AI Prompt Design

The AI prompts use **evidence-constrained reasoning** — Claude is instructed to cite specific chapters and scenes, not speculate beyond the text. Connection types (thematic_parallel, shared_fulfillment, contradiction, sequential, reinterpretation) provide structured output that can be validated and stored.

All AI responses are validated before display: prophecy IDs checked against the database, confidence values clamped to 0-1, connection types verified against the enum. Invalid results are silently dropped.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, data model, API endpoints
- [Seed Data](docs/SEED_DATA.md) — Data curation methodology and quality checklist
- [Prompts](docs/PROMPTS.md) — AI prompt templates with design commentary
- [Deployment](dev-docs/deploy.md) — Step-by-step deployment instructions

## License

MIT — see [LICENSE](LICENSE)
