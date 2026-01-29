# AGENTS

This repository contains a FastAPI backend and a Vite + React frontend
for the Nihao carbon platform. Use the guidance below when working in
this repo.

## Project layout

- `backend/`: FastAPI app, Alembic migrations (single baseline; schema from app startup `init_db`), and Python requirements.
- `frontend/`: Vite + React app and UI components.
- `docs/`: product, architecture, and workflow documentation.
- `docker-compose.yml`: local stack (Postgres, Redis, backend, frontend). Project name: `niha_platform`.
- `.env.example`: sample environment variables.
- `rebuild.sh`: full Docker rebuild (stop → build --no-cache → start).
- `restart.sh`: Docker restart (stop → start).

## Quick start (Docker)

```bash
docker compose up --build
```

**Rebuild (clean):**

```bash
./rebuild.sh
```

**Restart (no rebuild):**

```bash
./restart.sh
```

See [docs/REBUILD_INSTRUCTIONS.md](docs/REBUILD_INSTRUCTIONS.md) and [docs/RESTART_INSTRUCTIONS.md](docs/RESTART_INSTRUCTIONS.md).

## Local development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Linting

Frontend:

```bash
cd frontend
npm run lint
```

## Tests

Backend (if tests are present):

```bash
cd backend
pytest
```

## Environment

Copy `.env.example` to `.env` and adjust values as needed for local
development. Set `ENVIRONMENT=production` and `CORS_ORIGINS` for production;
see [CORS](docs/configuration/CORS.md).

## Documentation

- [CHANGELOG](docs/CHANGELOG.md) – recent changes
- [Admin Scraping API](docs/api/ADMIN_SCRAPING_API.md) – scraping sources (Settings)
- [Rebuild](docs/REBUILD_INSTRUCTIONS.md) – Docker full rebuild
- [Restart](docs/RESTART_INSTRUCTIONS.md) – Docker restart
