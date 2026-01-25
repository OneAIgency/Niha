# Niha Carbon Platform

A modern carbon trading platform for EU ETS (EUA) and Chinese carbon allowances (CEA), featuring real-time trading, T+3 settlement system, and comprehensive market operations.

## Features

### Core Trading Platform
- **User Authentication** - Secure JWT-based authentication
- **Entity Management** - Multi-entity support with KYC verification
- **Certificate Marketplace** - Browse and trade EUA and CEA certificates
- **Real-time Price Feeds** - Live market data for carbon allowances
- **Order Book** - Full order matching and execution
- **Cash Market** - EUR balance management and transfers

### Settlement System (v1.0.0) ✨
Complete T+3 settlement system for external registry transfers with automated progression and monitoring.

#### Features:
- **T+3 Settlement Flow** - Automatic progression through settlement stages
- **Business Days Calculation** - Excludes weekends (Friday purchase → Wednesday delivery)
- **Status Tracking** - Real-time settlement status and timeline
- **Background Automation** - Hourly processor for status advancement
- **Email Notifications** - Automatic alerts for settlement events
- **Monitoring & Alerting** - 3-tier severity system (CRITICAL/ERROR/WARNING)
- **Admin Dashboard** - Complete settlement management interface

#### Settlement Stages:
```
Day 0 (T+0): PENDING → User purchases CEA
Day 1 (T+1): TRANSFER_INITIATED → Auto-advancement
Day 2 (T+2): IN_TRANSIT → Registry transfer in progress
Day 3 (T+3): AT_CUSTODY → Certificates at custody
           → SETTLED → Delivery complete
```

#### API Endpoints:
- `GET /api/v1/settlement/pending` - List pending settlements
- `GET /api/v1/settlement/{id}` - Settlement details with timeline
- `GET /api/v1/settlement/{id}/timeline` - Lightweight timeline data
- `GET /api/v1/settlement/monitoring/metrics` - System health (Admin)
- `GET /api/v1/settlement/monitoring/alerts` - Active alerts (Admin)
- `GET /api/v1/settlement/monitoring/report` - Daily report (Admin)

## Tech Stack

### Backend
- **FastAPI 0.115.6** - Modern Python web framework
- **PostgreSQL 15** - Primary database
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **Redis** - Session management and caching
- **Resend** - Email notifications
- **Docker** - Containerization

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Architecture

```
Niha/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   │   ├── settlement_service.py
│   │   │   ├── settlement_processor.py
│   │   │   ├── settlement_monitoring.py
│   │   │   └── order_matching.py
│   │   ├── core/            # Core configuration
│   │   └── tests/           # Test suite (49 tests)
│   └── alembic/             # Database migrations
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Reusable components
│   │   │   ├── dashboard/   # Dashboard widgets
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand stores
│   │   └── styles/          # Design system
│   └── docs/                # Frontend documentation
└── docs/                    # Project documentation
    ├── SETTLEMENT_DEPLOYMENT_CHECKLIST.md
    ├── REBUILD_INSTRUCTIONS.md
    └── RESTART_INSTRUCTIONS.md
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- PostgreSQL 15+ (if running without Docker)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Niha
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development Scripts

See [AGENTS.md](AGENTS.md) for detailed development workflows.

**Quick rebuild:**
```bash
./rebuild.sh
```

**Quick restart:**
```bash
./restart.sh
```

## Settlement System Deployment

For production deployment of the settlement system, follow the comprehensive checklist:

```bash
# Review deployment checklist
cat docs/SETTLEMENT_DEPLOYMENT_CHECKLIST.md

# Key steps:
# 1. Verify database schema
# 2. Run migrations
# 3. Configure environment variables
# 4. Restart services
# 5. Verify background tasks
# 6. Test API endpoints
# 7. Monitor for 48 hours
```

## Testing

### Backend Tests
```bash
# Run all tests
docker-compose exec backend pytest

# Run settlement tests only
docker-compose exec backend pytest tests/test_settlement*.py

# Run with coverage
docker-compose exec backend pytest --cov=app tests/
```

**Test Suite:**
- 11 unit tests (settlement service)
- 13 API tests (HTTP endpoints)
- 12 processor tests (background jobs)
- 5 E2E tests (complete workflows)
- 8 integration tests (cross-service)

### Frontend Tests
```bash
cd frontend
npm test
```

## Monitoring

### Settlement System Health

**Metrics Endpoint (Admin only):**
```bash
curl http://localhost:8000/api/v1/settlement/monitoring/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Key Metrics:**
- Total pending settlements
- Total in progress
- Daily settled count
- Failed settlements
- Overdue settlements
- Average settlement time
- Total value pending/settled

**Alerts:**
- CRITICAL: Failed settlements
- ERROR: Critically overdue (3+ days)
- WARNING: Overdue (1+ days) or stuck in status

### Background Tasks

Settlement processor and monitoring run every hour:
```bash
# Check processor logs
docker-compose logs backend | grep "Settlement processor"

# Check monitoring logs
docker-compose logs backend | grep "Settlement monitoring"
```

## API Documentation

- **Interactive Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Spec:** http://localhost:8000/openapi.json

### Authentication

All API endpoints require JWT authentication:
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token
curl -X GET http://localhost:8000/api/v1/settlement/pending \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/niha_carbon

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=notifications@nihagroup.com

# Settlement
SETTLEMENT_PROCESSOR_INTERVAL_HOURS=1
SETTLEMENT_MONITORING_INTERVAL_HOURS=1
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention (ORM)
- CORS configuration
- Rate limiting (planned)
- Entity isolation enforcement
- Admin-only monitoring endpoints

## Contributing

See [AGENTS.md](AGENTS.md) for development guidelines and workflows.

## Documentation

- **Settlement Deployment:** [docs/SETTLEMENT_DEPLOYMENT_CHECKLIST.md](docs/SETTLEMENT_DEPLOYMENT_CHECKLIST.md)
- **Rebuild Instructions:** [docs/REBUILD_INSTRUCTIONS.md](docs/REBUILD_INSTRUCTIONS.md)
- **Restart Instructions:** [docs/RESTART_INSTRUCTIONS.md](docs/RESTART_INSTRUCTIONS.md)
- **Development Guide:** [AGENTS.md](AGENTS.md)
- **Design System:** [frontend/docs/DESIGN_SYSTEM.md](frontend/docs/DESIGN_SYSTEM.md)

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
docker-compose logs backend

# Rebuild and restart
docker-compose down
docker-compose build backend
docker-compose up -d backend
```

**Settlement processor not running:**
```bash
# Check logs
docker-compose logs backend | grep "Settlement processor"

# Restart backend
docker-compose restart backend
```

**Database migration errors:**
```bash
# Check current version
docker-compose exec backend alembic current

# Stamp as current (if tables exist)
docker-compose exec backend alembic stamp head

# Run migrations
docker-compose exec backend alembic upgrade head
```

**Frontend proxy errors:**
```bash
# Restart frontend
docker-compose restart frontend

# Or run locally
cd frontend
npm run dev
```

## Performance

**Expected Performance (Production Hardware):**
- Settlement creation: <100ms
- Status update: <50ms
- Processor cycle: <5s for 100 settlements
- Monitoring cycle: <10s for 1000 settlements
- API response time: <200ms

## Roadmap

### Phase 1: Settlement System ✅ (COMPLETE)
- [x] T+3 settlement implementation
- [x] Background automation
- [x] Email notifications
- [x] Monitoring and alerting
- [x] Admin interface
- [x] Comprehensive tests
- [x] Production deployment checklist

### Phase 2: Enhanced Trading (Planned)
- [ ] Advanced order types (limit, stop-loss)
- [ ] Portfolio management
- [ ] Historical data analytics
- [ ] Trading bot API

### Phase 3: Compliance & Reporting (Planned)
- [ ] Regulatory reporting
- [ ] Audit trail
- [ ] Compliance checks
- [ ] Tax reporting

### Phase 4: Integration (Planned)
- [ ] External registry API integration
- [ ] Automated certificate delivery
- [ ] Third-party custody integration
- [ ] Market data feeds

## License

[License information here]

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/docs
- Email: support@nihagroup.com

---

**Version:** 1.0.0-settlement-system
**Last Updated:** 2026-01-25
**Status:** Production Ready ✅
