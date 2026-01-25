#!/usr/bin/env bash
# Nihao Carbon Platform – restart (stop, start)
# Usage: ./restart.sh

set -e
cd "$(dirname "$0")"

echo "Cleaning up any previous project (niha_rebuild, niha)..."
docker compose -p niha_rebuild down --remove-orphans 2>/dev/null || true
docker compose -p niha down --remove-orphans 2>/dev/null || true

echo "Stopping all services (project: niha_platform)..."
docker compose down --remove-orphans

echo "Starting services..."
docker compose up -d

echo "Waiting for services..."
sleep 8

echo "Verifying..."
docker compose ps
curl -sf http://localhost:8000/health > /dev/null && echo "Backend: OK" || echo "Backend: check logs with: docker compose logs backend"
curl -sf -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q 200 && echo "Frontend: OK" || echo "Frontend: check logs with: docker compose logs frontend"

echo ""
echo "Restart complete."
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
