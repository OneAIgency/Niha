"""Tests for email_service send_invitation with mail_config."""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.email_service import EmailService


@pytest.mark.asyncio
async def test_send_invitation_uses_mail_config_from_email_and_base_url():
    """When mail_config is provided, send_invitation uses from_email and invitation_link_base_url."""
    service = EmailService()
    mail_config = {
        "from_email": "invites@custom.example.com",
        "invitation_link_base_url": "https://app.example.com",
        "invitation_subject": "You are invited",
    }
    with patch.object(service, "_send_email", new_callable=AsyncMock, return_value=True) as mock_send:
        result = await service.send_invitation(
            "user@test.com",
            "Jane",
            "token123",
            mail_config=mail_config,
        )
    assert result is True
    mock_send.assert_called_once()
    call_args, call_kw = mock_send.call_args
    to_email, subject, html = call_args[0], call_args[1], call_args[2]
    assert to_email == "user@test.com"
    assert subject == "You are invited"
    assert call_kw["from_email"] == "invites@custom.example.com"
    assert call_kw["mail_config"] == mail_config
    assert "https://app.example.com/setup-password?token=token123" in html
    assert "Jane" in html


@pytest.mark.asyncio
async def test_send_invitation_with_custom_body_template():
    """When mail_config has invitation_body_html, placeholders are replaced."""
    service = EmailService()
    mail_config = {
        "from_email": "noreply@test.com",
        "invitation_body_html": "Hi {{first_name}}, click {{setup_url}} to continue.",
    }
    with patch.object(service, "_send_email", new_callable=AsyncMock, return_value=True) as mock_send:
        await service.send_invitation(
            "u@test.com",
            "Bob",
            "tok",
            mail_config=mail_config,
        )
    call_args = mock_send.call_args[0]
    html = call_args[2]
    assert "Bob" in html
    assert "/setup-password?token=tok" in html


@pytest.mark.asyncio
async def test_send_invitation_without_mail_config_uses_defaults():
    """When mail_config is None, send_invitation uses default subject and env from_email."""
    service = EmailService()
    with patch.object(service, "_send_email", new_callable=AsyncMock, return_value=True) as mock_send:
        await service.send_invitation("u@test.com", "Alice", "token456", mail_config=None)
    mock_send.assert_called_once()
    call_args = mock_send.call_args
    assert call_args[1].get("from_email") is None
    assert call_args[1].get("mail_config") is None
    assert call_args[0][1] == "Welcome to Nihao Carbon Trading Platform"
    assert "http://localhost:5173/setup-password?token=token456" in call_args[0][2]
