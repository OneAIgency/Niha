# AGENTS

This repository contains a FastAPI backend and a Vite + React frontend
for the Nihao carbon platform. Use the guidance below when working in
this repo.

## Project layout

- `backend/`: FastAPI app, Alembic migrations, and Python requirements.
- `frontend/`: Vite + React app and UI components.
- `docs/`: product, architecture, and workflow documentation.
- `docker-compose.yml`: local stack (Postgres, Redis, backend, frontend).
- `.env.example`: sample environment variables.

## Quick start (Docker)

```bash
docker compose up --build
```

## Local development

Backend:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
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
