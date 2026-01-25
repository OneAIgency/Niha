# CORS Configuration

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Status:** Production

## Overview

Cross-Origin Resource Sharing (CORS) is configured to allow secure API access from authorized frontend origins while maintaining security in production environments.

## Configuration

### Location
`backend/app/main.py`

### Implementation

```python
_cors_origins = settings.cors_origins_list if settings.ENVIRONMENT == "production" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

## Environment-Based Configuration

### Development Mode

When `ENVIRONMENT != "production"`:
- **`allow_origins`**: `["*"]` - Allows all origins
- **Purpose**: Easier development and testing
- **Security**: Lower (acceptable for development only)

### Production Mode

When `ENVIRONMENT == "production"`:
- **`allow_origins`**: `settings.cors_origins_list` - Only configured origins
- **Purpose**: Security and access control
- **Security**: High (restricted to known origins)

## Allowed Origins Configuration

### Settings Location
`backend/app/core/config.py`

### Configuration

```python
CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://platonos.mooo.com,https://platonos.mooo.com,http://192.168.10.42:5173,http://192.168.10.42:8000"

@property
def cors_origins_list(self) -> List[str]:
    return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
```

### Environment Variable

Set in `.env` file:
```
CORS_ORIGINS=http://localhost:5173,https://app.nihaogroup.com,https://www.nihaogroup.com
```

## Allowed Methods

The following HTTP methods are allowed:
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Delete resources
- `OPTIONS` - CORS preflight requests

## Allowed Headers

The following headers are allowed:
- `Content-Type` - Request body content type
- `Authorization` - JWT authentication tokens

## Credentials

**`allow_credentials: True`**

Allows cookies and authentication credentials to be sent with cross-origin requests. Required for JWT token-based authentication.

## Production Deployment

### Required Steps

1. **Set `ENVIRONMENT=production`** in production `.env`
2. **Configure `CORS_ORIGINS`** with production frontend URLs
3. **Verify CORS behavior** in production environment
4. **Monitor CORS errors** in application logs

### Example Production Configuration

```env
ENVIRONMENT=production
CORS_ORIGINS=https://app.nihaogroup.com,https://www.nihaogroup.com,https://admin.nihaogroup.com
```

### Testing CORS in Production

```bash
# Test from allowed origin
curl -H "Origin: https://app.nihaogroup.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.nihaogroup.com/api/v1/auth/login

# Should return:
# Access-Control-Allow-Origin: https://app.nihaogroup.com
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Troubleshooting

### CORS Errors in Production

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions:**
1. Verify origin is in `CORS_ORIGINS` environment variable
2. Check `ENVIRONMENT` is set to `production`
3. Ensure origin URL matches exactly (including protocol, port, trailing slash)
4. Check browser console for exact blocked origin

### Development CORS Issues

**Error:** CORS errors in development

**Solutions:**
1. Verify `ENVIRONMENT != "production"` in `.env`
2. Check backend is running and accessible
3. Verify frontend is using correct API URL
4. Check browser console for detailed CORS error

### Common Mistakes

1. **Missing protocol** - Use `https://` not just `app.nihaogroup.com`
2. **Port mismatch** - Include port if not standard (80/443)
3. **Trailing slash** - Ensure consistency (with or without `/`)
4. **Environment variable not set** - Verify `.env` file is loaded

## Security Considerations

### Production Security

- ✅ Only allow known, trusted origins
- ✅ Use HTTPS in production
- ✅ Regularly review and update allowed origins
- ✅ Monitor CORS error logs for unauthorized access attempts

### Development Security

- ⚠️ `allow_origins=["*"]` is acceptable for development only
- ⚠️ Never use `["*"]` in production
- ⚠️ Be cautious when testing with external tools

## Related Documentation

- [Error Handling Architecture](../architecture/error-handling.md)
- [API Documentation](../api/)
- [Deployment Guide](../DEPLOYMENT_SUMMARY.md)
