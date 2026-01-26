# Database Configuration

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Status:** Production

## Overview

The Nihao Carbon Platform uses PostgreSQL with SQLAlchemy async engine and connection pooling for optimal performance and reliability.

## Connection Pooling

### Configuration

**Location:** `backend/app/core/database.py`

**Pool Type:** `QueuePool` (replaces previous `NullPool`)

**Configuration:**
```python
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    poolclass=QueuePool,
    pool_size=10,          # Base pool size
    max_overflow=20,       # Additional connections beyond pool_size
    pool_pre_ping=True,    # Verify connections before using
)
```

### Pool Parameters

- **`pool_size`**: 10 - Number of connections to maintain in the pool
- **`max_overflow`**: 20 - Maximum additional connections beyond pool_size
- **`pool_pre_ping`**: True - Verifies connections are alive before using (handles stale connections)

### Benefits

1. **Connection Reuse**: Reduces overhead of creating new connections
2. **Better Performance**: Faster response times under load
3. **Stale Connection Handling**: `pool_pre_ping` detects and replaces dead connections
4. **Scalability**: Supports up to 30 concurrent connections (10 + 20 overflow)

### Monitoring

Monitor pool usage in production:
```python
# Check pool status
from sqlalchemy import inspect
inspector = inspect(engine)
pool = engine.pool
print(f"Pool size: {pool.size()}")
print(f"Checked out: {pool.checkedout()}")
print(f"Overflow: {pool.overflow()}")
```

## Database URL Configuration

### Format

The database URL is automatically converted from PostgreSQL to asyncpg format:

```python
# Input: postgresql://user:pass@host:port/db
# Output: postgresql+asyncpg://user:pass@host:port/db
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
```

### Environment Variables

**Required:** `DATABASE_URL` in `.env` file

**Format:**
```
DATABASE_URL=postgresql://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon
```

**Docker Environment:**
- Internal: `postgresql://niha_user:niha_secure_pass_2024@db:5432/niha_carbon`
- External: `postgresql://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon`

## Session Management

### AsyncSessionLocal

**Configuration:**
```python
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Objects remain accessible after commit
    autocommit=False,        # Manual transaction control
    autoflush=False,         # Manual flush control
)
```

### Usage Pattern

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

## Transaction Management

### Best Practices

1. **Always use try/except** for database operations
2. **Always rollback** on error
3. **Use context managers** for automatic cleanup
4. **Commit explicitly** after successful operations

### Example

```python
async def create_entity(data: EntityCreate, db: AsyncSession):
    try:
        entity = Entity(**data.dict())
        db.add(entity)
        await db.commit()
        await db.refresh(entity)
        return entity
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating entity", logger)
```

## Connection String Examples

### Development (Local)
```
DATABASE_URL=postgresql://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon
```

### Development (Docker)
```
DATABASE_URL=postgresql://niha_user:niha_secure_pass_2024@db:5432/niha_carbon
```

### Production
```
DATABASE_URL=postgresql://user:password@prod-db-host:5432/niha_carbon
```

## Performance Tuning

### Pool Size Guidelines

- **Small applications** (< 100 concurrent users): `pool_size=5, max_overflow=10`
- **Medium applications** (100-1000 users): `pool_size=10, max_overflow=20` (current)
- **Large applications** (> 1000 users): `pool_size=20, max_overflow=40`

### Monitoring Metrics

Monitor these metrics in production:
- Active connections
- Pool utilization
- Connection wait time
- Failed connection attempts

## Troubleshooting

### Connection Exhaustion

**Symptoms:**
- Slow response times
- Timeout errors
- "Too many connections" errors

**Solutions:**
1. Increase `pool_size` and `max_overflow`
2. Check for connection leaks (sessions not being closed)
3. Reduce connection timeout
4. Scale database server

### Stale Connections

**Symptoms:**
- Intermittent connection errors
- "Connection reset by peer" errors

**Solution:**
- `pool_pre_ping=True` (already enabled) automatically handles this

### Performance Issues

**Symptoms:**
- Slow queries
- High connection wait times

**Solutions:**
1. Check database indexes
2. Optimize queries
3. Increase pool size if needed
4. Monitor query performance

## Related Documentation

- [Error Handling Architecture](./error-handling.md)
- [Database Access Guide](../DATABASE_ACCESS.md)
- [Settlement System](./settlement-system.md)
