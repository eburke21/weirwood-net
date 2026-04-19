# Weirwood.net — developer commands
#
# Run `make` or `make help` to see all available targets.
# Most workflows are Docker-first; local-dev equivalents are provided too.

.DEFAULT_GOAL := help
SHELL := /bin/bash
DB_PATHS := data/weirwood.db backend/data/weirwood.db

.PHONY: help \
	up down restart logs build \
	backend-dev frontend-dev \
	install backend-install frontend-install \
	test backend-test frontend-test \
	lint typecheck \
	db-shell db-reset db-backup spend \
	clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "; print "\nUsage: make <target>\n\nTargets:"} \
		/^## [A-Za-z]/ {printf "\n  \033[1m%s\033[0m\n", substr($$0, 4); next} \
		/^[a-zA-Z_-]+:.*?## / {printf "    \033[36m%-20s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo

## Docker (default dev environment)

up: ## Build + start backend and frontend containers (detached)
	docker compose up --build -d
	@printf "\n  Backend:  \033[36mhttp://localhost:8000\033[0m\n"
	@printf "  Frontend: \033[36mhttp://localhost:5173\033[0m\n\n"

down: ## Stop and remove containers
	docker compose down

restart: ## Stop, rebuild, and restart containers
	docker compose down
	docker compose up --build -d

logs: ## Tail logs from both services
	docker compose logs -f

build: ## Build Docker images without starting them
	docker compose build

## Local dev (no Docker)

backend-dev: ## Run backend with uvicorn --reload on :8000
	cd backend && uv run uvicorn app.main:app --reload --port 8000

frontend-dev: ## Run Vite dev server on :5173
	cd frontend && npm run dev

## Dependencies

install: backend-install frontend-install ## Install backend and frontend deps

backend-install: ## uv sync for the backend (includes dev deps)
	cd backend && uv sync --dev

frontend-install: ## npm ci for the frontend
	cd frontend && npm ci

## Quality checks

test: backend-test frontend-test ## Run backend + frontend test suites

backend-test: ## pytest -v for backend
	cd backend && uv run pytest -v

frontend-test: ## vitest run for frontend
	cd frontend && npx vitest run

lint: ## ruff (backend) + eslint (frontend)
	cd backend && uv run ruff check .
	cd frontend && npx eslint src/

typecheck: ## mypy (backend) + tsc --noEmit (frontend)
	cd backend && uv run mypy app/ --ignore-missing-imports
	cd frontend && npx tsc --noEmit

## Database

db-shell: ## Open a SQLite shell against data/weirwood.db
	sqlite3 data/weirwood.db

db-reset: ## Wipe the SQLite DB and restart the backend to trigger re-seeding
	@running=$$(docker compose ps --services --filter "status=running" 2>/dev/null | grep -cx backend || true); \
	if [ "$${running:-0}" -gt 0 ]; then \
		echo "→ Stopping backend container..."; \
		docker compose stop backend >/dev/null; \
		rm -f $(DB_PATHS); \
		echo "→ Database wiped."; \
		echo "→ Restarting backend (this also re-runs the seed loader)..."; \
		docker compose up -d --wait backend >/dev/null; \
		echo "✓ Done — backend healthy with fresh seed data."; \
	else \
		rm -f $(DB_PATHS); \
		echo "✓ Database wiped."; \
		echo "  Run 'make backend-dev' (or 'make up') to start the backend; seed data will load on startup."; \
	fi

db-backup: ## Timestamped copy of the DB into data/
	@mkdir -p data
	@target="data/weirwood.backup-$$(date +%Y%m%d-%H%M%S).db"; \
	cp data/weirwood.db "$$target" && echo "✓ Backup saved to $$target"

spend: ## Show today's Claude API spend from spend_log
	@sqlite3 -header -column data/weirwood.db \
		"SELECT datetime(timestamp, 'localtime') AS at, endpoint, input_tokens AS in_tok, output_tokens AS out_tok, printf('\$$%.4f', cost_usd) AS cost \
		 FROM spend_log WHERE timestamp >= date('now') ORDER BY id DESC;" 2>/dev/null \
		|| echo "  (no spend_log table yet — backend hasn't run since the spend-tracking feature was added)"
	@echo ""
	@sqlite3 data/weirwood.db \
		"SELECT printf('  Total today: \$$%.4f (%d calls)', COALESCE(SUM(cost_usd), 0), COUNT(*)) FROM spend_log WHERE timestamp >= date('now');" 2>/dev/null

## Housekeeping

clean: ## Remove build artifacts and caches (keeps the DB)
	rm -rf frontend/dist
	rm -rf backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache
	find backend -type d -name __pycache__ -prune -exec rm -rf {} +
	@echo "✓ Cleaned build artifacts and caches."
