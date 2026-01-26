#!/usr/bin/env bash
# Nihao Carbon Platform – full rebuild (stop, clean build, start)
# Usage: ./rebuild.sh [--volumes]
#   --volumes  also remove volumes (fresh DB, data loss)

set -e
cd "$(dirname "$0")"

REMOVE_VOLUMES=""
for arg in "$@"; do
  case $arg in
    --volumes) REMOVE_VOLUMES="--volumes" ;;
  esac
done

echo "Cleaning up any previous project (niha_rebuild, niha)..."
docker compose -p niha_rebuild down --remove-orphans 2>/dev/null || true
docker compose -p niha down --remove-orphans 2>/dev/null || true

echo "Stopping all services (project: niha_platform)..."
docker compose down --remove-orphans $REMOVE_VOLUMES

echo "Rebuilding images (no cache)..."
docker compose build --no-cache

echo "Starting services..."
docker compose up -d

echo "Waiting for services to be healthy..."
sleep 12

echo "Verifying..."
docker compose ps
if curl -sf http://localhost:8000/health > /dev/null; then
  echo "Backend: OK"
else
  echo "Backend: waiting..."
  sleep 5
  curl -sf http://localhost:8000/health > /dev/null && echo "Backend: OK" || echo "Backend: check logs with: docker compose logs backend"
fi
if curl -sf -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q 200; then
  echo "Frontend: OK"
else
  echo "Frontend: check logs with: docker compose logs frontend"
fi

echo ""
echo "Rebuild complete."
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API docs:  http://localhost:8000/docs"
