import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service using Resend API.
    Falls back to logging in development mode.
    """

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.enabled = bool(self.api_key)

    async def send_magic_link(self, to_email: str, token: str) -> bool:
        """Send magic link authentication email"""
        magic_link_url = f"http://localhost:5173/auth/verify?token={token}"

        subject = "Sign in to Nihao Carbon Trading Platform"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .button {{ display: inline-block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: 600; margin: 24px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
                .warning {{ background: #fef3c7; border-radius: 8px;
                    padding: 12px; margin-top: 20px; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Sign in to your account</h1>
                <p>Click the button below to securely sign in to the Nihao
                Carbon Trading Platform. This link will expire in 15 minutes.</p>
                <a href="{magic_link_url}" class="button">Sign In to Platform</a>
                <div class="warning">
                    If you didn't request this email, you can safely ignore it.
                </div>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_trade_confirmation(
        self,
        to_email: str,
        trade_type: str,
        certificate_type: str,
        quantity: float,
        price: float,
        total: float,
    ) -> bool:
        """Send trade confirmation email"""
        subject = (
            f"Trade Confirmation - {trade_type.upper()} {quantity} {certificate_type}"
        )
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                .success {{ color: #10b981; }}
                .details {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .total {{ font-size: 24px; color: #0f172a; font-weight: 700;
                    text-align: center; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1 class="success">Trade Confirmed</h1>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Type</span>
                        <span class="value">{trade_type.upper()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificate</span>
                        <span class="value">{certificate_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Price</span>
                        <span class="value">${price:,.2f} / unit</span>
                    </div>
                </div>
                <div class="total">Total: ${total:,.2f}</div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_swap_match_notification(
        self, to_email: str, from_type: str, to_type: str, quantity: float, rate: float
    ) -> bool:
        """Send swap match notification"""
        subject = f"Swap Match Found - {from_type} to {to_type}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                .match-icon {{ font-size: 48px; text-align: center; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; }}
                .swap-visual {{ display: flex; justify-content: center;
                    align-items: center; gap: 20px; margin: 30px 0; }}
                .cert {{ background: #f8fafc; padding: 20px;
                    border-radius: 12px; text-align: center; }}
                .cert-type {{ font-size: 24px; font-weight: 700; }}
                .cert-qty {{ color: #64748b; margin-top: 8px; }}
                .arrow {{ font-size: 32px; color: #10b981; }}
                .rate {{ text-align: center; color: #64748b; }}
                .button {{ display: block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; margin: 24px auto; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="match-icon">Match Found</div>
                <h1>Swap Match Found!</h1>
                <div class="swap-visual">
                    <div class="cert">
                        <div class="cert-type">{from_type}</div>
                        <div class="cert-qty">{quantity:,.0f} units</div>
                    </div>
                    <div class="arrow">-&gt;</div>
                    <div class="cert">
                        <div class="cert-type">{to_type}</div>
                        <div class="cert-qty">{quantity * rate:,.0f} units</div>
                    </div>
                </div>
                <div class="rate">Exchange Rate: 1 {from_type} =
                    {rate:.2f} {to_type}</div>
                <a href="http://localhost:5173/swap" class="button">View Swap</a>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_invitation(
        self,
        to_email: str,
        first_name: str,
        invitation_token: str,
        mail_config: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send invitation email to new user with password setup link.

        When mail_config is provided (from DB), use its from_email, subject,
        body, link base URL. Otherwise use env and hardcoded template.
        """
        name = first_name or "there"
        if mail_config:
            base_url = (
                (mail_config.get("invitation_link_base_url") or "").rstrip("/")
                or "http://localhost:5173"
            )
            setup_url = f"{base_url}/setup-password?token={invitation_token}"
            subject = (
                mail_config.get("invitation_subject")
                or "Welcome to Nihao Carbon Trading Platform"
            )
            body_html = mail_config.get("invitation_body_html")
            if body_html:
                html_content = body_html.replace("{{setup_url}}", setup_url).replace(
                    "{{first_name}}", name
                )
            else:
                html_content = self._default_invitation_html(name, setup_url)
            from_email = mail_config.get("from_email") or settings.FROM_EMAIL
            return await self._send_email(
                to_email,
                subject,
                html_content,
                from_email=from_email,
                mail_config=mail_config,
            )
        setup_url = f"http://localhost:5173/setup-password?token={invitation_token}"
        subject = "Welcome to Nihao Carbon Trading Platform"
        html_content = self._default_invitation_html(name, setup_url)
        return await self._send_email(to_email, subject, html_content)

    def _default_invitation_html(self, name: str, setup_url: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .button {{ display: block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; margin: 24px auto; }}
                .highlight {{ background: #ecfdf5; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
                .warning {{ background: #fef3c7; border-radius: 8px;
                    padding: 12px; margin-top: 20px; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Welcome, {name}!</h1>
                <p>You've been invited to join the Nihao Carbon Trading
                Platform. Click the button below to set up your password
                and activate your account.</p>
                <a href="{setup_url}" class="button">Set Up Your Password</a>
                <div class="highlight">
                    <p><strong>What is Nihao Group?</strong></p>
                    <p>We're a professional OTC carbon credit trading platform
                    enabling swap trading between EU ETS (EUA) and China ETS
                    (CEA) emission certificates.</p>
                </div>
                <div class="warning">
                    This invitation link will expire in 7 days. If you didn't
                    expect this invitation, please ignore this email.
                </div>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

    async def send_account_approved(self, to_email: str, first_name: str) -> bool:
        """Send email when user account is approved"""
        name = first_name or "there"
        subject = "Your account has been verified - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .success-icon {{ font-size: 48px; text-align: center; }}
                .highlight {{ background: #ecfdf5; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
                .button {{ display: block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; margin: 24px auto; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">Verified</div>
                <h1>Congratulations, {name}!</h1>
                <p>Your account has been verified and approved. You can now
                access the Nihao Carbon Trading Platform.</p>
                <div class="highlight">
                    <p><strong>What's next?</strong></p>
                    <p>To start trading, please fund your account. Contact
                    our support team for funding instructions.</p>
                </div>
                <a href="http://localhost:5173/dashboard"
                    class="button">Go to Dashboard</a>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_kyc_rejected(
        self, to_email: str, first_name: str, reason: str = ""
    ) -> bool:
        """Notify user their KYC application was rejected."""
        name = first_name or "there"
        subject = "Account Verification Update - Nihao Group"
        reason_html = (
            f'<p style="color:#64748b;line-height:1.6;margin:8px 0 0 0;"><strong>Details:</strong> {reason}</p>'
            if reason
            else ""
        )
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .alert {{ background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 12px; padding: 16px; margin: 20px 0; }}
                .alert-title {{ color: #dc2626; font-weight: 600; margin: 0 0 4px 0; }}
                .button {{ display: inline-block; background: #0f172a;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: 600; margin: 24px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Verification Update</h1>
                <p>Hello {name},</p>
                <div class="alert">
                    <p class="alert-title">We were unable to verify your account at this time.</p>
                    {reason_html}
                </div>
                <p>If you believe this is an error or would like to provide additional documentation,
                please contact our compliance team.</p>
                <a href="mailto:info@nihaogroup.com" class="button">Contact Support</a>
                <div class="footer">
                    <p>Nihao Group Ltd | Professional Carbon Trading</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content)

    async def send_deposit_announced(
        self, to_email: str, first_name: str, amount: float, currency: str, reference: str
    ) -> bool:
        """Confirm deposit announcement receipt to user."""
        name = first_name or "there"
        subject = f"Deposit Received - {currency} {amount:,.2f} - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .details {{ background: #eff6ff; border: 1px solid #bfdbfe;
                    border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #dbeafe; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #3b82f6; font-weight: 500; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Deposit Announcement Received</h1>
                <p>Hello {name},</p>
                <p>We've received your deposit announcement. Our team will verify the wire transfer.</p>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Amount</span>
                        <span class="value">{currency} {amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Reference</span>
                        <span class="value">{reference or 'Pending'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status</span>
                        <span class="value">Awaiting Verification</span>
                    </div>
                </div>
                <p>Typical processing time: <strong>1-3 business days</strong>.
                You'll be notified once your funds are confirmed.</p>
                <div class="footer">
                    <p>Nihao Group Ltd | Professional Carbon Trading</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content)

    async def send_deposit_on_hold(
        self, to_email: str, first_name: str, amount: float, currency: str, hold_until: str
    ) -> bool:
        """Notify user their deposit is on AML compliance hold."""
        name = first_name or "there"
        subject = "Deposit Under Review - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .info {{ background: #fffbeb; border: 1px solid #fde68a;
                    border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .info-title {{ color: #d97706; font-weight: 600; margin: 0 0 8px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #fde68a; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #92400e; font-weight: 500; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Deposit Under Review</h1>
                <p>Hello {name},</p>
                <p>Your deposit has been received and is undergoing standard compliance review.</p>
                <div class="info">
                    <p class="info-title">Compliance Hold</p>
                    <div class="detail-row">
                        <span class="label">Amount</span>
                        <span class="value">{currency} {amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Expected Clearance</span>
                        <span class="value">{hold_until}</span>
                    </div>
                </div>
                <p>This is a standard regulatory procedure. You'll be notified as soon as your
                funds are cleared and available for trading.</p>
                <div class="footer">
                    <p>Nihao Group Ltd | Professional Carbon Trading</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content)

    async def send_deposit_cleared(
        self, to_email: str, first_name: str, amount: float, currency: str
    ) -> bool:
        """Notify user their deposit cleared AML and funds are available."""
        name = first_name or "there"
        subject = f"Funds Available - {currency} {amount:,.2f} Cleared - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                .success {{ color: #10b981; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .success-box {{ background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }}
                .amount {{ font-size: 28px; font-weight: 700; color: #0f172a; margin: 8px 0; }}
                .badge {{ display: inline-block; background: #10b981; color: white;
                    padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }}
                .button {{ display: inline-block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: 600; margin: 24px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1 class="success">Funds Available</h1>
                <p>Hello {name},</p>
                <p>Great news! Your deposit has cleared compliance review and funds are now available.</p>
                <div class="success-box">
                    <span class="badge">CLEARED</span>
                    <div class="amount">{currency} {amount:,.2f}</div>
                    <p style="color:#16a34a;margin:0;">Ready for trading</p>
                </div>
                <p>You can now buy CEA certificates on the Cash Market or execute CEA-to-EUA swaps.</p>
                <a href="http://localhost:5173/cash-market" class="button">Start Trading</a>
                <div class="footer">
                    <p>Nihao Group Ltd | Professional Carbon Trading</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content)

    async def send_deposit_rejected(
        self, to_email: str, first_name: str, amount: float, currency: str, reason: str
    ) -> bool:
        """Notify user their deposit was rejected."""
        name = first_name or "there"
        # Map internal reason codes to user-friendly messages
        reason_map = {
            "WIRE_NOT_RECEIVED": "Wire transfer not received within expected timeframe",
            "AMOUNT_MISMATCH": "Deposit amount does not match the announced amount",
            "SOURCE_VERIFICATION_FAILED": "Unable to verify the source of funds",
            "AML_FLAG": "Additional compliance documentation required",
            "SANCTIONS_HIT": "Unable to process due to regulatory restrictions",
            "SUSPICIOUS_ACTIVITY": "Additional verification required",
            "OTHER": "Please contact support for details",
        }
        display_reason = reason_map.get(reason, reason or "Please contact support for details")
        subject = "Deposit Update - Action Required - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white;
                    border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .alert {{ background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .alert-title {{ color: #dc2626; font-weight: 600; margin: 0 0 8px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #fecaca; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #991b1b; font-weight: 500; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .button {{ display: inline-block; background: #0f172a;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: 600; margin: 24px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Deposit Update</h1>
                <p>Hello {name},</p>
                <div class="alert">
                    <p class="alert-title">We were unable to process your deposit.</p>
                    <div class="detail-row">
                        <span class="label">Amount</span>
                        <span class="value">{currency} {amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Reason</span>
                        <span class="value">{display_reason}</span>
                    </div>
                </div>
                <p>If you have questions or would like to discuss next steps,
                please contact our compliance team.</p>
                <a href="mailto:info@nihaogroup.com" class="button">Contact Support</a>
                <div class="footer">
                    <p>Nihao Group Ltd | Professional Carbon Trading</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content)

    async def send_account_funded(self, to_email: str, first_name: str) -> bool:
        """Send email when user account is funded and ready for trading"""
        name = first_name or "there"
        subject = "Your account is now active - Start Trading!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .success-icon {{ font-size: 48px; text-align: center; }}
                .features {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .feature {{ display: flex; align-items: center; }}
                .feature-icon {{ font-size: 20px; margin-right: 12px; }}
                .feature-text {{ color: #0f172a; }}
                .button {{ display: block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; margin: 24px auto; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">Active</div>
                <h1>Welcome to Trading, {name}!</h1>
                <p>Your account has been funded and you now have full access
                to our carbon trading platform.</p>
                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">📊</span>
                        <span class="feature-text">Browse the CEA Marketplace</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🔄</span>
                        <span class="feature-text">Create EUA-CEA Swap Requests</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">💰</span>
                        <span class="feature-text">Execute OTC Trades</span>
                    </div>
                </div>
                <a href="http://localhost:5173/marketplace"
                    class="button">Start Trading</a>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_contact_followup(self, to_email: str, entity_name: str) -> bool:
        """Send follow-up email after contact request"""
        subject = "Thank you for your interest - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .highlight {{ background: #ecfdf5; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Thank you, {entity_name}!</h1>
                <p>We have received your inquiry about our carbon certificate
                trading platform. Our team will review your request and
                contact you within 24-48 hours.</p>
                <div class="highlight">
                    <p><strong>What happens next?</strong></p>
                    <p>One of our carbon trading specialists will reach out
                    to discuss your needs and guide you through the
                    onboarding process.</p>
                </div>
                <p>In the meantime, feel free to explore our platform to
                learn more about EUA-CEA swaps and OTC trading benefits.</p>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_settlement_created(
        self,
        to_email: str,
        first_name: str,
        batch_reference: str,
        certificate_type: str,
        quantity: float,
        expected_date: str,
    ) -> bool:
        """Send settlement created confirmation email"""
        name = first_name or "there"
        subject = f"Settlement Initiated - {batch_reference}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                .status-badge {{ display: inline-block; background: #fef3c7;
                    color: #92400e; padding: 6px 12px; border-radius: 6px;
                    font-size: 13px; margin-bottom: 20px; }}
                .details {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .timeline {{ background: #ecfdf5; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .timeline h3 {{ color: #047857; margin: 0 0 12px 0; }}
                .timeline p {{ color: #065f46; margin: 4px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Settlement Created</h1>
                <div class="status-badge">⏱️ PENDING</div>
                <p style="color: #64748b; margin-bottom: 20px;">Hello {name},
                your {certificate_type} purchase settlement has been
                initiated.</p>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Settlement ID</span>
                        <span class="value">{batch_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificate Type</span>
                        <span class="value">{certificate_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Expected Delivery</span>
                        <span class="value">{expected_date}</span>
                    </div>
                </div>
                <div class="timeline">
                    <h3>📅 Settlement Timeline (T+3)</h3>
                    <p><strong>T+1:</strong> Transfer Initiated</p>
                    <p><strong>T+2:</strong> In Transit</p>
                    <p><strong>T+3:</strong> At Custody & Settled</p>
                </div>
                <p style="color: #64748b; font-size: 14px;">You will receive
                updates as your settlement progresses through each stage.
                Your {certificate_type} certificates will be available in
                your account on the expected delivery date.</p>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_settlement_status_update(
        self,
        to_email: str,
        first_name: str,
        batch_reference: str,
        old_status: str,
        new_status: str,
        certificate_type: str,
        quantity: float,
    ) -> bool:
        """Send settlement status update email"""
        name = first_name or "there"

        # Status display configuration
        status_config = {
            "TRANSFER_INITIATED": {
                "emoji": "🚀",
                "color": "#3b82f6",
                "bg": "#dbeafe",
                "label": "Transfer Initiated",
            },
            "IN_TRANSIT": {
                "emoji": "🔄",
                "color": "#8b5cf6",
                "bg": "#ede9fe",
                "label": "In Transit",
            },
            "AT_CUSTODY": {
                "emoji": "🏦",
                "color": "#06b6d4",
                "bg": "#cffafe",
                "label": "At Custody",
            },
            "SETTLED": {
                "emoji": "✅",
                "color": "#10b981",
                "bg": "#d1fae5",
                "label": "Settled",
            },
            "FAILED": {
                "emoji": "❌",
                "color": "#ef4444",
                "bg": "#fee2e2",
                "label": "Failed",
            },
        }

        config = status_config.get(
            new_status,
            {"emoji": "⏱️", "color": "#f59e0b", "bg": "#fef3c7", "label": new_status},
        )

        subject = f"Settlement Update - {batch_reference} is now {config['label']}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                .status-icon {{ font-size: 48px; text-align: center; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; }}
                .status-badge {{ display: inline-block;
                    background: {config["bg"]}; color: {config["color"]};
                    padding: 8px 16px; border-radius: 8px; }}
                .progress {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .progress-label {{ color: #64748b; font-size: 13px; }}
                .details {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 8px 0; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="status-icon">{config["emoji"]}</div>
                <h1>Settlement Status Updated</h1>
                <div style="text-align: center;">
                    <span class="status-badge">
                        {config["label"].upper()}</span>
                </div>
                <p style="color: #64748b; text-align: center;">Hello {name},
                    your settlement has progressed to the next stage.</p>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Settlement ID</span>
                        <span class="value">{batch_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificate</span>
                        <span class="value">{certificate_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Previous Status</span>
                        <span class="value">
                            {old_status.replace("_", " ").title()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">New Status</span>
                        <span class="value" style="color: {config["color"]};">
                            {config["label"]}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_settlement_completed(
        self,
        to_email: str,
        first_name: str,
        batch_reference: str,
        certificate_type: str,
        quantity: float,
        new_balance: float,
    ) -> bool:
        """Send settlement completion email"""
        name = first_name or "there"
        subject = f"Settlement Complete - {quantity:,.2f} {certificate_type} Delivered"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                .success-icon {{ font-size: 64px; text-align: center; }}
                h1 {{ color: #0f172a; font-size: 22px; text-align: center; }}
                .success-badge {{ display: inline-block; background: #d1fae5;
                    color: #047857; padding: 8px 16px; border-radius: 8px; }}
                .highlight {{ background: #ecfdf5; border-radius: 12px;
                    padding: 24px; margin: 24px 0; text-align: center; }}
                .highlight .big-number {{ font-size: 36px; font-weight: 700;
                    color: #047857; margin-bottom: 8px; }}
                .highlight .label {{ color: #065f46; font-size: 14px; }}
                .details {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .button {{ display: block; background: #10b981;
                    color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; margin: 24px auto; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">🎉</div>
                <h1>Settlement Complete!</h1>
                <div style="text-align: center;">
                    <span class="success-badge">✅ SETTLED</span>
                </div>
                <p style="color: #64748b; text-align: center;">Hello {name},
                    your certificates have been successfully delivered to
                    your account.</p>
                <div class="highlight">
                    <div class="big-number">+{quantity:,.2f}</div>
                    <div class="label">{certificate_type} certificates added</div>
                </div>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Settlement ID</span>
                        <span class="value">{batch_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificates Delivered</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">New {certificate_type} Balance</span>
                        <span class="value">{new_balance:,.2f} tCO2e</span>
                    </div>
                </div>
                <a href="http://localhost:5173/dashboard"
                    class="button">View Dashboard</a>
                <p style="color: #64748b; font-size: 13px; text-align: center;">
                    Your certificates are now available for trading.</p>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_settlement_failed(
        self,
        to_email: str,
        first_name: str,
        batch_reference: str,
        certificate_type: str,
        quantity: float,
        reason: Optional[str] = None,
    ) -> bool:
        """Send settlement failure notification email"""
        name = first_name or "there"
        subject = f"Settlement Failed - {batch_reference}"
        failure_reason = reason or "Technical issue during settlement processing"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                .error-icon {{ font-size: 48px; text-align: center; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; }}
                .error-badge {{ display: inline-block; background: #fee2e2;
                    color: #991b1b; padding: 8px 16px; border-radius: 8px; }}
                .details {{ background: #f8fafc; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between;
                    padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .error-box {{ background: #fef2f2;
                    border-left: 4px solid #ef4444; border-radius: 8px;
                    padding: 16px; margin: 20px 0; }}
                .error-box p {{ color: #991b1b; margin: 0; }}
                .support {{ background: #dbeafe; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }}
                .support h3 {{ color: #1e40af; margin: 0 0 8px 0; }}
                .support p {{ color: #1e3a8a; margin: 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px;
                    border-top: 1px solid #e2e8f0; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="error-icon">Warning</div>
                <h1>Settlement Failed</h1>
                <div style="text-align: center;">
                    <span class="error-badge">FAILED</span>
                </div>
                <p style="color: #64748b; text-align: center;">Hello {name},
                    we encountered an issue processing your settlement.</p>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Settlement ID</span>
                        <span class="value">{batch_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificate Type</span>
                        <span class="value">{certificate_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                </div>
                <div class="error-box">
                    <p><strong>Failure Reason:</strong> {failure_reason}</p>
                </div>
                <div class="support">
                    <h3>What happens next?</h3>
                    <p>Our support team has been notified and will contact
                        you within 24 hours to resolve this issue. Your
                        funds remain safe in your account.</p>
                </div>
                <p style="color: #64748b; font-size: 13px; text-align: center;">
                    Contact: support@nihaogroup.com</p>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>Hong Kong | Italy</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_admin_overdue_settlement_alert(
        self,
        to_email: str,
        batch_reference: str,
        entity_name: str,
        certificate_type: str,
        quantity: float,
        expected_date: str,
        days_overdue: int,
        current_status: str,
    ) -> bool:
        """Send admin alert for overdue settlement"""
        subject = (
            f"⚠️ ALERT: Settlement {batch_reference} is {days_overdue} days overdue"
        )
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background: #f8fafc; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                .container {{ border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .logo span {{ color: #10b981; }}
                .alert-header {{ background: #fef2f2; padding: 20px; }}
                .alert-header {{ border-left: 4px solid #ef4444; }}
                .alert-header h1 {{ color: #991b1b; font-size: 20px; }}
                .alert-header p {{ color: #dc2626; font-size: 14px; }}
                .details {{ background: #f8fafc; padding: 20px; margin: 20px 0; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .overdue {{ color: #ef4444; font-weight: 700; font-size: 18px; }}
                .actions {{ background: #fef3c7; padding: 20px; margin: 20px 0; }}
                .actions h3 {{ color: #92400e; font-size: 15px; }}
                .actions ul {{ color: #78350f; padding-left: 20px; }}
                .actions li {{ margin: 6px 0; }}
                .button {{ display: block; background: #ef4444; color: white; }}
                .button {{ padding: 14px 32px; text-decoration: none; }}
                .footer {{ margin-top: 32px; padding-top: 24px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="alert-header">
                    <h1>⚠️ Overdue Settlement Alert</h1>
                    <p>Immediate action required for settlement {batch_reference}</p>
                </div>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Settlement ID</span>
                        <span class="value">{batch_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Entity</span>
                        <span class="value">{entity_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Certificate Type</span>
                        <span class="value">{certificate_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity</span>
                        <span class="value">{quantity:,.2f} tCO2e</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Expected Date</span>
                        <span class="value">{expected_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Current Status</span>
                        <span class="value">
                            {current_status.replace("_", " ").title()}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Days Overdue</span>
                        <span class="overdue">{days_overdue} DAYS</span>
                    </div>
                </div>
                <div class="actions">
                    <h3>📋 Required Actions:</h3>
                    <ul>
                        <li>Review settlement status with registry</li>
                        <li>Contact counterparty if applicable</li>
                        <li>Update client on delay</li>
                        <li>Determine root cause and resolution timeline</li>
                    </ul>
                </div>
                <a href="http://localhost:5173/backoffice/settlements"
                   class="button">Review in Backoffice</a>
                <p style="color: #64748b; font-size: 13px; text-align: center;">
                    This is an automated alert from the Settlement Processor
                </p>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>System Administration</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_test_email(
        self, to_email: str, mail_config: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send a test email to verify mail configuration."""
        subject = "Test Email - Nihao Group Mail Configuration"
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; }
                .container { max-width: 500px; margin: 0 auto;
                    background: white; border-radius: 16px; padding: 40px; }
                .logo { font-size: 24px; font-weight: 700; color: #0f172a; }
                .logo span { color: #10b981; }
                h1 { color: #0f172a; font-size: 20px; }
                p { color: #64748b; line-height: 1.6; }
                .success-icon { font-size: 48px; text-align: center; color: #10b981; }
                .highlight { background: #ecfdf5; border-radius: 12px;
                    padding: 20px; margin: 20px 0; }
                .highlight p { color: #047857; margin: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">&#10004;</div>
                <h1>Mail Configuration Working</h1>
                <p>This is a test email from the Nihao Group platform.
                If you received this, your mail delivery configuration
                is working correctly.</p>
                <div class="highlight">
                    <p><strong>Provider:</strong> """ + (mail_config.get("provider", "env") if mail_config else "env") + """</p>
                </div>
                <p style="color:#94a3b8; font-size:12px;">
                    Sent from Settings &rarr; Mail Settings &rarr; Test Email
                </p>
            </div>
        </body>
        </html>
        """
        return await self._send_email(to_email, subject, html_content, mail_config=mail_config)

    async def _send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None,
        mail_config: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send email via Resend, SMTP (from config), or log in dev mode."""
        from_addr = from_email or self.from_email

        if mail_config and mail_config.get("provider") == "smtp":
            return await self._send_via_smtp(to, subject, html, from_addr, mail_config)

        api_key = self.api_key
        if mail_config and mail_config.get("provider") == "resend":
            use_env = mail_config.get("use_env_credentials")
            has_key = mail_config.get("resend_api_key")
            if not use_env and has_key:
                api_key = mail_config["resend_api_key"]
            else:
                api_key = settings.RESEND_API_KEY

        if not api_key:
            logger.info(f"[DEV MODE] Email would be sent to {to}")
            return True

        try:
            import resend

            resend.api_key = api_key
            params = {
                "from": from_addr,
                "to": [to],
                "subject": subject,
                "html": html,
            }
            resend.Emails.send(params)
            logger.info(f"Email sent successfully to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def _send_via_smtp(
        self,
        to: str,
        subject: str,
        html: str,
        from_addr: str,
        mail_config: Dict[str, Any],
    ) -> bool:
        """Send email via SMTP using config. Runs sync smtplib in thread."""
        host = mail_config.get("smtp_host") or "localhost"
        port = mail_config.get("smtp_port") or 587
        use_tls = mail_config.get("smtp_use_tls", True)
        username = mail_config.get("smtp_username")
        password = mail_config.get("smtp_password")

        def _do_send() -> None:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_addr
            msg["To"] = to
            msg.attach(MIMEText(html, "html"))
            if use_tls:
                with smtplib.SMTP(host, port) as server:
                    server.starttls()
                    if username and password:
                        server.login(username, password)
                    server.sendmail(from_addr, [to], msg.as_string())
            else:
                with smtplib.SMTP(host, port) as server:
                    if username and password:
                        server.login(username, password)
                    server.sendmail(from_addr, [to], msg.as_string())

        try:
            await asyncio.to_thread(_do_send)
            logger.info(f"Email sent via SMTP to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            return False


email_service = EmailService()
