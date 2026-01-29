# Settings API (Mail & Auth)

**Base path:** `/api/v1/admin`  
**Authentication:** Bearer token with admin role required.

Mail and invitation settings are stored in the database. When present, the application uses them for sending invitation (and optionally other) emails; otherwise it falls back to environment variables (`RESEND_API_KEY`, `FROM_EMAIL`).

### Environment and configuration

- **When no mail config row exists** or **use_env_credentials** is true, the backend uses:
  - `RESEND_API_KEY` — Resend API key (required for Resend provider when using env).
  - `FROM_EMAIL` — Default from address (used when stored config has none).
- Stored config (provider, SMTP host/port/credentials, invitation template, link base URL, token expiry) overrides env when a row exists and the corresponding fields are set. Sending uses Resend or SMTP according to `provider`.

## GET /admin/settings/mail

Returns the current mail configuration (single row). If no row exists, returns default/empty values. API key and SMTP password are never returned (masked as `********`).

**Response:** `200 OK`

```json
{
  "id": "uuid-or-null",
  "provider": "resend",
  "use_env_credentials": true,
  "from_email": "noreply@example.com",
  "resend_api_key": null,
  "smtp_host": null,
  "smtp_port": null,
  "smtp_use_tls": true,
  "smtp_username": null,
  "smtp_password": null,
  "invitation_subject": "Welcome to Nihao Carbon Trading Platform",
  "invitation_body_html": null,
  "invitation_link_base_url": "https://app.example.com",
  "invitation_token_expiry_days": 7,
  "verification_method": null,
  "auth_method": null,
  "created_at": "2026-01-29T12:00:00",
  "updated_at": "2026-01-29T12:00:00"
}
```

When credentials are stored, `resend_api_key` and `smtp_password` are returned as `"********"` (never the actual value).

## PUT /admin/settings/mail

Create or update the mail configuration (single row). All request body fields are optional; only provided fields are updated.

**Request body:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `provider` | string | `"resend"` \| `"smtp"` | Mail provider |
| `use_env_credentials` | boolean | - | Use API key / SMTP credentials from environment |
| `from_email` | string | max 255 | From address |
| `resend_api_key` | string | max 500 | Resend API key (omit or send `"********"` to keep current) |
| `smtp_host` | string | max 255 | SMTP host |
| `smtp_port` | integer | 1–65535 | SMTP port |
| `smtp_use_tls` | boolean | - | Use TLS for SMTP |
| `smtp_username` | string | max 255 | SMTP username |
| `smtp_password` | string | max 500 | SMTP password (omit or `"********"` to keep current) |
| `invitation_subject` | string | max 255 | Invitation email subject |
| `invitation_body_html` | string | - | Invitation email HTML body; placeholders `{{first_name}}`, `{{setup_url}}` |
| `invitation_link_base_url` | string | max 500, must start with `http://` or `https://` | Base URL for setup-password link (trailing slash stripped) |
| `invitation_token_expiry_days` | integer | 1–365 | Invitation token validity in days |
| `verification_method` | string | max 50 | Placeholder (e.g. `magic_link`, `password_only`) |
| `auth_method` | string | max 50 | Placeholder for auth options |

**Response:** `200 OK`

```json
{
  "message": "Mail settings updated",
  "success": true
}
```

**Validation rules:**

- `invitation_link_base_url` must start with `http://` or `https://`.
- `smtp_port` must be between 1 and 65535.
- `invitation_token_expiry_days` must be between 1 and 365.

Errors follow the standard API error format (see [ERROR_HANDLING.md](./ERROR_HANDLING.md)).

### Troubleshooting

- **Invitation emails not sent:** Ensure a mail config row exists or `RESEND_API_KEY` and `FROM_EMAIL` are set in the environment. For Resend, verify the API key and from-address domain. For SMTP, ensure host, port, TLS, and credentials are correct and the server is reachable.
- **PUT returns validation error:** Check `invitation_link_base_url` starts with `http://` or `https://`, `smtp_port` is 1–65535, and `invitation_token_expiry_days` is 1–365.
- **Secrets not updating:** Sending `"********"` or omitting `resend_api_key` / `smtp_password` leaves the current value unchanged; send the new value to update.
