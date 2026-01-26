# Development Guide

**Version:** 1.0  
**Last Updated:** 2026-01-25

## Overview

This guide covers development practices, code quality standards, and implementation patterns for the Nihao Carbon Platform.

## Code Quality Standards

### Error Handling

All database operations must include proper error handling:

```python
try:
    db.add(entity)
    await db.commit()
except Exception as e:
    await db.rollback()
    from ...core.exceptions import handle_database_error
    raise handle_database_error(e, "operation description", logger)
```

**See:** [Error Handling Architecture](./architecture/error-handling.md)

### Error Response Format

All API errors must use standardized format:

```python
from ...core.exceptions import create_error_response, ErrorCodes

raise create_error_response(
    status_code=404,
    error_code=ErrorCodes.NOT_FOUND,
    message="Resource not found",
    details={"resource_id": str(id)}
)
```

**See:** [API Error Handling](./api/ERROR_HANDLING.md)

### Design System Compliance

**Frontend components must:**
- ✅ Use Tailwind classes that reference design tokens
- ✅ Never use hard-coded hex/RGB colors
- ✅ Support light and dark themes
- ✅ Use spacing tokens (`--space-*`)
- ✅ Follow typography scale

**Example:**
```tsx
// ✅ Correct
<div className="bg-navy-800 text-white p-4 rounded-xl">
  <span className="text-navy-200">Secondary text</span>
</div>

// ❌ Incorrect
<div style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
  <span style={{ color: '#cbd5e1' }}>Secondary text</span>
</div>
```

**See:** [Design System Documentation](../frontend/docs/DESIGN_SYSTEM.md)

## Database Best Practices

### Connection Pooling

The application uses `QueuePool` for optimal performance:
- Pool size: 10 connections
- Max overflow: 20 additional connections
- Pre-ping: Enabled (handles stale connections)

**See:** [Database Configuration](./architecture/database-configuration.md)

### Transaction Management

Always use try/except with rollback:

```python
try:
    # Database operations
    await db.commit()
except Exception as e:
    await db.rollback()
    raise handle_database_error(e, "operation", logger)
```

## Security Best Practices

### CORS Configuration

- **Development:** Allows all origins (`["*"]`)
- **Production:** Only configured origins from `CORS_ORIGINS` environment variable

**See:** [CORS Configuration](./configuration/CORS.md)

### Environment Variables

Never commit sensitive values. Use `.env` file (excluded from git):

```env
# Required
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173,https://app.example.com

# Optional
ENVIRONMENT=production
DEBUG=false
SEED_ADMIN_PASSWORD=secure-password
SEED_TEST_PASSWORD=secure-password
```

## Code Organization

### Backend Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Core utilities (database, security, exceptions)
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── services/        # Business logic services
├── alembic/             # Database migrations
└── requirements.txt     # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── stores/          # Zustand state management
│   ├── services/        # API client
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── styles/          # Design tokens and global styles
└── docs/                # Documentation
```

## Testing

### Backend Testing

```bash
cd backend
pytest
```

### Frontend Testing

```bash
cd frontend
npm run lint
```

## Development Workflow

### Starting Development

1. **Start Docker services:**
   ```bash
   docker compose up --build
   ```
   **Rebuild (clean):** `./rebuild.sh` · **Restart:** `./restart.sh` — see [Rebuild](REBUILD_INSTRUCTIONS.md) and [Restart](RESTART_INSTRUCTIONS.md).

2. **Backend (if running locally):**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Database Access

See [Database Access Guide](./DATABASE_ACCESS.md) for:
- Connection details
- Query examples
- Python script usage

## Code Review Checklist

Before submitting code, ensure:

- [ ] All database operations have error handling with rollback
- [ ] Error responses use standardized format
- [ ] No hard-coded colors in frontend components
- [ ] Components support light/dark themes
- [ ] Environment variables are documented
- [ ] Code follows project structure
- [ ] Type hints are included (Python/TypeScript)
- [ ] Logging is appropriate (not too verbose, not too sparse)

## Related Documentation

- [Error Handling Architecture](./architecture/error-handling.md)
- [Database Configuration](./architecture/database-configuration.md)
- [CORS Configuration](./configuration/CORS.md)
- [API Error Handling](./api/ERROR_HANDLING.md)
- [Design System](../frontend/docs/DESIGN_SYSTEM.md)
- [Database Access Guide](./DATABASE_ACCESS.md)
