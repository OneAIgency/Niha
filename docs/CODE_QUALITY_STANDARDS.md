# Code Quality Standards

**Version:** 1.0  
**Last Updated:** 2026-01-25

## Overview

This document defines code quality standards and best practices for the Nihao Carbon Platform, based on the comprehensive code review conducted on 2026-01-25.

## Error Handling Standards

### Database Operations

**Required Pattern:**
```python
try:
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
except Exception as e:
    await db.rollback()
    from ...core.exceptions import handle_database_error
    raise handle_database_error(e, "operation description", logger)
```

**Why:**
- Prevents database state inconsistencies
- Provides user-friendly error messages
- Ensures proper transaction rollback
- Logs errors for debugging

### API Error Responses

**Required Pattern:**
```python
from ...core.exceptions import create_error_response, ErrorCodes

raise create_error_response(
    status_code=404,
    error_code=ErrorCodes.NOT_FOUND,
    message="Resource not found",
    details={"resource_id": str(id)}
)
```

**Why:**
- Consistent error format across all endpoints
- Machine-readable error codes for client handling
- Human-readable messages for users
- Additional context for debugging

## Design System Standards

### Color Usage

**✅ DO:**
```tsx
<div className="bg-navy-800 text-white p-4">
  <span className="text-navy-200">Secondary text</span>
</div>
```

**❌ DON'T:**
```tsx
<div style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
  <span style={{ color: '#cbd5e1' }}>Secondary text</span>
</div>
```

**Why:**
- Enables theme switching (light/dark mode)
- Centralized color management
- Consistent design across application
- Easier maintenance

### Component Requirements

All frontend components must:
1. Use Tailwind classes that reference design tokens
2. Support light and dark themes
3. Use spacing tokens (`--space-*`)
4. Follow typography scale
5. Never use hard-coded colors, spacing, or typography

## Security Standards

### CORS Configuration

**Production:**
- Must use `settings.cors_origins_list`
- Only allow known, trusted origins
- Never use `["*"]` in production

**Development:**
- `["*"]` is acceptable for local development only

### Environment Variables

- Never commit sensitive values to git
- Use `.env` file (excluded from `.gitignore`)
- Document all environment variables
- Use secure defaults in production

## Database Standards

### Connection Pooling

**Configuration:**
- Use `QueuePool` (not `NullPool`)
- Configure appropriate pool size for expected load
- Enable `pool_pre_ping` for stale connection handling

**Current Settings:**
- `pool_size=10`
- `max_overflow=20`
- `pool_pre_ping=True`

### Transaction Management

- Always use try/except for write operations
- Always rollback on error
- Use context managers for automatic cleanup
- Commit explicitly after successful operations

## Code Organization

### File Structure

- Keep files focused and reasonably sized
- Split large files into logical modules
- Use clear, descriptive names
- Follow project structure conventions

### Naming Conventions

- **Python:** `snake_case` for functions/variables, `PascalCase` for classes
- **TypeScript:** `camelCase` for functions/variables, `PascalCase` for components
- **Constants:** `UPPER_SNAKE_CASE`

### Documentation

- Add docstrings to all public functions/classes
- Document complex algorithms
- Include examples for API endpoints
- Update documentation when code changes

## Testing Standards

### Error Scenarios

Test all error paths:
- Database failures
- Validation errors
- Authentication failures
- Network errors
- Edge cases

### Integration Testing

- Test API endpoints with real database
- Test error responses
- Test authentication/authorization
- Test WebSocket connections

## Performance Standards

### Database Queries

- Use indexes appropriately
- Avoid N+1 query problems
- Use connection pooling
- Monitor query performance

### Frontend Performance

- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Optimize bundle size
- Use code splitting where appropriate

## Code Review Checklist

Before submitting code:

- [ ] All database operations have error handling
- [ ] Error responses use standardized format
- [ ] No hard-coded colors in frontend
- [ ] Components support light/dark themes
- [ ] Environment variables documented
- [ ] Code follows project structure
- [ ] Type hints included
- [ ] Logging appropriate
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

## Related Documentation

- [Development Guide](./DEVELOPMENT.md)
- [Error Handling Architecture](./architecture/error-handling.md)
- [Database Configuration](./architecture/database-configuration.md)
- [Design System](../frontend/docs/DESIGN_SYSTEM.md)
