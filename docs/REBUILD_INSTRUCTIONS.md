# Rebuild Instructions

**Date:** 2026-01-25  
**Purpose:** Complete rebuild of all services after Market Maker Order Book integration

## Prerequisites

1. **Docker Desktop** must be running
2. **Docker Compose** v2+ installed
3. All code changes committed (optional but recommended)

## Full Rebuild Process

### Step 1: Stop All Running Containers

```bash
cd /Users/victorsafta/work/Niha
docker-compose down
```

This stops and removes all containers, networks, and volumes (if using `--volumes` flag).

### Step 2: Clean Build (Recommended)

For a complete clean rebuild:

```bash
# Remove all containers, networks, and volumes
docker-compose down --volumes

# Remove old images (optional - frees disk space)
docker-compose rm -f
docker image prune -f
```

### Step 3: Rebuild All Services

```bash
# Rebuild all services from scratch
docker-compose build --no-cache

# Start all services
docker-compose up -d
```

Or combine in one command:

```bash
docker-compose up --build --force-recreate
```

### Step 4: Verify Services

Check that all services are running:

```bash
docker-compose ps
```

Expected output:
```
NAME            STATUS          PORTS
niha_backend    Up (healthy)    0.0.0.0:8000->8000/tcp
niha_db         Up (healthy)    0.0.0.0:5433->5432/tcp
niha_frontend   Up              0.0.0.0:5173->5173/tcp
niha_redis      Up (healthy)    6379/tcp
```

### Step 5: Check Logs

Verify services started correctly:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Step 6: Run Database Migrations

After backend starts, run migrations:

```bash
docker-compose exec backend alembic upgrade head
```

## Service-Specific Rebuilds

### Backend Only

```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend Only

```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Database Only (Preserves Data)

```bash
docker-compose stop db
docker-compose rm -f db
docker-compose up -d db
```

## Troubleshooting

### Docker Daemon Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Start Docker Desktop application
2. Wait for Docker to fully start (whale icon in menu bar)
3. Verify: `docker ps` should work without errors

### Port Already in Use

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solution:**
```bash
# Find process using port
lsof -i :8000

# Kill process (replace PID with actual process ID)
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Build Cache Issues

**Error:** Old code still running after rebuild

**Solution:**
```bash
# Force rebuild without cache
docker-compose build --no-cache

# Recreate containers
docker-compose up -d --force-recreate
```

### Database Connection Errors

**Error:** Backend can't connect to database

**Solution:**
```bash
# Wait for database to be healthy
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Frontend Build Errors

**Error:** Frontend build fails

**Solution:**
```bash
# Clean node_modules
docker-compose exec frontend rm -rf node_modules

# Reinstall dependencies
docker-compose exec frontend npm install

# Rebuild
docker-compose restart frontend
```

## Quick Rebuild Script

Create a script `rebuild.sh`:

```bash
#!/bin/bash
set -e

echo "Stopping all services..."
docker-compose down

echo "Rebuilding all services..."
docker-compose build --no-cache

echo "Starting all services..."
docker-compose up -d

echo "Waiting for services to be healthy..."
sleep 10

echo "Running database migrations..."
docker-compose exec -T backend alembic upgrade head

echo "Checking service status..."
docker-compose ps

echo "Rebuild complete!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
```

Make it executable:
```bash
chmod +x rebuild.sh
```

Run it:
```bash
./rebuild.sh
```

## Post-Rebuild Verification

### 1. Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}` or similar

### 2. API Documentation

Open in browser: http://localhost:8000/docs

### 3. Frontend

Open in browser: http://localhost:5173

### 4. Database Connection

```bash
docker-compose exec db psql -U niha_user -d niha_carbon -c "SELECT version();"
```

### 5. Test Market Maker Order Book

```bash
# Get order book (should include Market Maker orders)
curl http://localhost:8000/api/v1/cash-market/real/orderbook/CEA
```

## What Was Changed

This rebuild includes:

1. **Order Book Integration**
   - Market Maker orders now included in order book queries
   - Defensive checks for data integrity
   - Error handling improvements

2. **Code Updates**
   - `backend/app/services/order_matching.py` - Updated `get_real_orderbook()`
   - Added logging and error handling
   - Added defensive checks for multiple source IDs

3. **Tests**
   - New test file: `backend/tests/test_order_matching.py`
   - 10 comprehensive unit tests

4. **Documentation**
   - Updated API documentation
   - Updated admin guide
   - New architecture document

## Notes

- **Data Preservation:** Using `docker-compose down` (without `--volumes`) preserves database data
- **Clean Slate:** Using `docker-compose down --volumes` removes all data (fresh start)
- **Development Mode:** Services run with hot-reload enabled (code changes reflect immediately)
- **Production:** For production builds, use `docker-compose -f docker-compose.prod.yml up --build`

## Next Steps After Rebuild

1. Verify all services are running
2. Run database migrations
3. Test Market Maker order placement
4. Verify orders appear in order book
5. Check logs for any errors

---

**Last Updated:** 2026-01-25
