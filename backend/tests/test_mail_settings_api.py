"""Tests for admin mail settings API (GET/PUT /admin/settings/mail)."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.main import app
from app.models.models import MailConfig, MailProvider


@pytest_asyncio.fixture
def override_admin_and_db(test_admin_user, db_session):
    """Override get_current_user and get_db so admin endpoints see test admin and session."""

    async def mock_get_current_user():
        return test_admin_user

    async def mock_get_db():
        yield db_session

    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[get_db] = mock_get_db
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
def admin_headers(test_admin_user, override_admin_and_db):
    """Auth headers for admin user."""
    token = create_access_token(data={"sub": str(test_admin_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_mail_settings_no_row_returns_defaults(admin_headers, override_admin_and_db):
    """GET /admin/settings/mail with no row returns default/empty structure."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/admin/settings/mail",
            headers=admin_headers,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is None
    assert data["provider"] == "resend"
    assert data["use_env_credentials"] is True
    assert data["from_email"] == ""
    assert data["resend_api_key"] is None
    assert data["smtp_password"] is None
    assert data["invitation_token_expiry_days"] == 7


@pytest.mark.asyncio
async def test_get_mail_settings_requires_admin():
    """GET /admin/settings/mail without admin auth returns 401 or 403."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/admin/settings/mail")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_put_mail_settings_creates_row(db_session, admin_headers, override_admin_and_db):
    """PUT /admin/settings/mail with no existing row creates one."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.put(
            "/api/v1/admin/settings/mail",
            json={
                "provider": "resend",
                "use_env_credentials": False,
                "from_email": "noreply@test.example.com",
                "invitation_link_base_url": "https://app.example.com",
                "invitation_token_expiry_days": 14,
            },
            headers=admin_headers,
        )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "updated" in data.get("message", "").lower()

    get_resp = await client.get("/api/v1/admin/settings/mail", headers=admin_headers)
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["id"] is not None
    assert get_data["from_email"] == "noreply@test.example.com"
    assert get_data["invitation_link_base_url"] == "https://app.example.com"
    assert get_data["invitation_token_expiry_days"] == 14


@pytest.mark.asyncio
async def test_put_mail_settings_masks_secrets_on_get(db_session, admin_headers, override_admin_and_db):
    """After PUT with resend_api_key, GET returns masked value (********)."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.put(
            "/api/v1/admin/settings/mail",
            json={
                "from_email": "noreply@test.com",
                "resend_api_key": "re_secret_123",
            },
            headers=admin_headers,
        )
        get_resp = await client.get("/api/v1/admin/settings/mail", headers=admin_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["resend_api_key"] == "********"
    assert "re_secret" not in str(data)


@pytest.mark.asyncio
async def test_put_mail_settings_ignores_placeholder_password(db_session, admin_headers, override_admin_and_db):
    """PUT with password '********' does not overwrite existing password."""
    from sqlalchemy import select

    # Create row with password
    row = MailConfig(
        provider=MailProvider.SMTP,
        use_env_credentials=False,
        from_email="noreply@test.com",
        smtp_host="smtp.test.com",
        smtp_password="actual_secret",
    )
    db_session.add(row)
    await db_session.commit()
    await db_session.refresh(row)
    row_id = row.id

    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.put(
            "/api/v1/admin/settings/mail",
            json={"smtp_password": "********"},
            headers=admin_headers,
        )

    await db_session.expire_all()
    result = await db_session.execute(select(MailConfig).where(MailConfig.id == row_id))
    updated = result.scalar_one()
    assert updated.smtp_password == "actual_secret"


@pytest.mark.asyncio
async def test_put_mail_settings_validates_invitation_link_base_url(db_session, admin_headers, override_admin_and_db):
    """PUT rejects invitation_link_base_url that does not start with http(s)."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.put(
            "/api/v1/admin/settings/mail",
            json={
                "from_email": "noreply@test.com",
                "invitation_link_base_url": "ftp://invalid.example.com",
            },
            headers=admin_headers,
        )
    assert response.status_code == 422
