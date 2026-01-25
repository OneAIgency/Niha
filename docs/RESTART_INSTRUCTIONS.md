# Application Restart Instructions

**Date:** 2026-01-25

## Quick Restart (Docker)

If Docker Desktop is running:

```bash
cd /Users/victorsafta/work/Niha
docker-compose restart
```

Or restart specific services:

```bash
# Restart backend only
docker-compose restart backend

# Restart frontend only
docker-compose restart frontend

# Restart all services
docker-compose restart
```

## Full Restart (Stop and Start)

```bash
cd /Users/victorsafta/work/Niha
docker-compose down
docker-compose up -d
```

## Local Development Restart

If running services locally (without Docker):

### Backend Restart

```bash
cd /Users/victorsafta/work/Niha/backend
# Stop current process (Ctrl+C or kill process)
# Then restart:
source .venv/bin/activate  # if using venv
uvicorn app.main:app --reload --port 8000
```

### Frontend Restart

```bash
cd /Users/victorsafta/work/Niha/frontend
# Stop current process (Ctrl+C or kill process)
# Then restart:
npm run dev
```

## Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start
3. Verify: `docker ps` should work

### Port Already in Use

**Error:** Port 8000 or 5173 already in use

**Solution:**
```bash
# Find process using port
lsof -i :8000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Services Not Starting

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Restart with logs:**
```bash
docker-compose up
```

## Verification

After restart, verify services:

```bash
# Check status
docker-compose ps

# Test backend
curl http://localhost:8000/health

# Test frontend (open in browser)
open http://localhost:5173
```

---

**Last Updated:** 2026-01-25
