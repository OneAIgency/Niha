# Rebuild Instructions

**Last updated:** 2026-01-25  
**Purpose:** Full rebuild of the Nihao Docker stack (stop → build without cache → start).

## Prerequisites

- **Docker Desktop** running
- **Docker Compose** v2+ (`docker compose`, not `docker-compose`)

## Quick Rebuild (Recommended)

From the project root:

```bash
./rebuild.sh
```

With fresh database (removes volumes, **data loss**):

```bash
./rebuild.sh --volumes
```

## Manual Rebuild

```bash
cd /Users/victorsafta/work/Niha   # or your repo path

# 1. Stop and remove containers
docker compose down --remove-orphans

# 2. Rebuild images (no cache)
docker compose build --no-cache

# 3. Start services
docker compose up -d
```

## Project and Services

- **Compose project name:** `niha_platform` (set in `docker-compose.yml` via `name:`).
- **Services:** `db`, `redis`, `backend`, `frontend`
- **Containers:** `niha_db`, `niha_backend`, `niha_frontend`; Redis uses a generated name (no fixed `container_name` to avoid stale refs).

## Verify After Rebuild

```bash
docker compose ps
curl http://localhost:8000/health
```

- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:8000  
- **API docs:** http://localhost:8000/docs  

## Database and Migrations

- **Fresh install:** The backend runs `init_db()` on startup and creates tables from SQLAlchemy models. No Alembic run needed.
- **Migrations:** Use only when upgrading an **existing** database that was previously managed by Alembic. Do **not** run `alembic upgrade head` on a fresh DB.

```bash
# Only if you have an existing DB and use Alembic
docker compose exec backend alembic upgrade head
```

## Troubleshooting

### "No such container" / Stale container reference

**Symptom:** `Error response from daemon: No such container: ...`

**Cause:** Compose still references a container that was removed outside Compose (e.g. manual `docker rm`).

**Fix:**

```bash
docker compose down --remove-orphans
docker container prune -f
docker compose up -d
```

Or use `./rebuild.sh`, which runs `down --remove-orphans` by default.

### Port already in use

```bash
lsof -i :8000
lsof -i :5173
lsof -i :5433
# kill -9 <PID> if needed
```

### Frontend build / dependency issues

```bash
docker compose exec frontend rm -rf node_modules
docker compose exec frontend npm install
docker compose restart frontend
```

### Backend won’t start / DB errors

- Ensure `db` and `redis` are healthy: `docker compose ps`
- Check logs: `docker compose logs backend`
- Restart: `./restart.sh` or `docker compose restart backend`

## Rebuild Only One Service

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

## Notes

- **Data:** `docker compose down` keeps volumes. Use `./rebuild.sh --volumes` or `down --volumes` for a clean DB.
- **Hot-reload:** Backend and frontend use dev servers; code changes apply without rebuild.
