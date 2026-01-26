# Restart Instructions

**Last updated:** 2026-01-25  
**Purpose:** Restart the Nihao Docker stack (stop → start, no rebuild).

## Quick Restart (Recommended)

From the project root:

```bash
./restart.sh
```

## Manual Restart

```bash
cd /Users/victorsafta/work/Niha   # or your repo path

docker compose down --remove-orphans
docker compose up -d
```

## Restart Specific Services

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart db
docker compose restart redis
```

## Verify

```bash
docker compose ps
curl http://localhost:8000/health
```

- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:8000  

## Local Development (No Docker)

**Backend:**

```bash
cd backend
source .venv/bin/activate   # or equivalent
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **Docker not running:** Start Docker Desktop and wait until it’s ready.
- **Port in use:** `lsof -i :8000` / `lsof -i :5173` then `kill -9 <PID>` if needed.
- **"No such container":** Run `docker compose down --remove-orphans` then `docker compose up -d` (or use `./restart.sh`).
