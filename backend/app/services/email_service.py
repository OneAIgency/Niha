import logging
from typing import Optional

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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
                .warning {{ background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 13px; color: #92400e; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Sign in to your account</h1>
                <p>Click the button below to securely sign in to the Nihao Carbon Trading Platform. This link will expire in 15 minutes.</p>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                .success {{ color: #10b981; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .total {{ font-size: 24px; color: #0f172a; font-weight: 700; text-align: center; margin-top: 20px; }}
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                .match-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; }}
                .swap-visual {{ display: flex; justify-content: center; align-items: center; gap: 20px; margin: 30px 0; }}
                .cert {{ background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; min-width: 120px; }}
                .cert-type {{ font-size: 24px; font-weight: 700; color: #0f172a; }}
                .cert-qty {{ color: #64748b; margin-top: 8px; }}
                .arrow {{ font-size: 32px; color: #10b981; }}
                .rate {{ text-align: center; color: #64748b; margin-top: 20px; }}
                .button {{ display: block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 200px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="match-icon">🎯</div>
                <h1>Swap Match Found!</h1>
                <div class="swap-visual">
                    <div class="cert">
                        <div class="cert-type">{from_type}</div>
                        <div class="cert-qty">{quantity:,.0f} units</div>
                    </div>
                    <div class="arrow">→</div>
                    <div class="cert">
                        <div class="cert-type">{to_type}</div>
                        <div class="cert-qty">{quantity * rate:,.0f} units</div>
                    </div>
                </div>
                <div class="rate">Exchange Rate: 1 {from_type} = {rate:.2f} {to_type}</div>
                <a href="http://localhost:5173/swap" class="button">View Swap</a>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def send_invitation(
        self, to_email: str, first_name: str, invitation_token: str
    ) -> bool:
        """Send invitation email to new user with password setup link"""
        name = first_name or "there"
        setup_url = f"http://localhost:5173/setup-password?token={invitation_token}"
        subject = "Welcome to Nihao Carbon Trading Platform"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .button {{ display: block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 250px; }}
                .highlight {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
                .warning {{ background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 13px; color: #92400e; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Welcome, {name}!</h1>
                <p>You've been invited to join the Nihao Carbon Trading Platform. Click the button below to set up your password and activate your account.</p>
                <a href="{setup_url}" class="button">Set Up Your Password</a>
                <div class="highlight">
                    <p><strong>What is Nihao Group?</strong></p>
                    <p>We're a professional OTC carbon credit trading platform enabling swap trading between EU ETS (EUA) and China ETS (CEA) emission certificates.</p>
                </div>
                <div class="warning">
                    This invitation link will expire in 7 days. If you didn't expect this invitation, please ignore this email.
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

    async def send_account_approved(self, to_email: str, first_name: str) -> bool:
        """Send email when user account is approved"""
        name = first_name or "there"
        subject = "Your account has been verified - Nihao Group"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .success-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                .highlight {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
                .button {{ display: block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 200px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">✅</div>
                <h1>Congratulations, {name}!</h1>
                <p>Your account has been verified and approved. You can now access the Nihao Carbon Trading Platform.</p>
                <div class="highlight">
                    <p><strong>What's next?</strong></p>
                    <p>To start trading, please fund your account. Contact our support team for funding instructions.</p>
                </div>
                <a href="http://localhost:5173/dashboard" class="button">Go to Dashboard</a>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .success-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                .features {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .feature {{ display: flex; align-items: center; padding: 10px 0; }}
                .feature-icon {{ font-size: 20px; margin-right: 12px; }}
                .feature-text {{ color: #0f172a; }}
                .button {{ display: block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 200px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="success-icon">🎉</div>
                <h1>Welcome to Trading, {name}!</h1>
                <p>Your account has been funded and you now have full access to our carbon trading platform.</p>
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
                <a href="http://localhost:5173/marketplace" class="button">Start Trading</a>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; }}
                p {{ color: #64748b; line-height: 1.6; }}
                .highlight {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .highlight p {{ color: #047857; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Thank you, {entity_name}!</h1>
                <p>We have received your inquiry about our carbon certificate trading platform. Our team will review your request and contact you within 24-48 hours.</p>
                <div class="highlight">
                    <p><strong>What happens next?</strong></p>
                    <p>One of our carbon trading specialists will reach out to discuss your needs and guide you through the onboarding process.</p>
                </div>
                <p>In the meantime, feel free to explore our platform to learn more about EUA-CEA swaps and OTC trading benefits.</p>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                h1 {{ color: #0f172a; font-size: 20px; margin-bottom: 16px; }}
                .status-badge {{ display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .timeline {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .timeline h3 {{ color: #047857; margin: 0 0 12px 0; font-size: 15px; }}
                .timeline p {{ color: #065f46; margin: 4px 0; font-size: 14px; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <h1>Settlement Created</h1>
                <div class="status-badge">⏱️ PENDING</div>
                <p style="color: #64748b; margin-bottom: 20px;">Hello {name}, your {certificate_type} purchase settlement has been initiated.</p>
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
                <p style="color: #64748b; font-size: 14px;">You will receive updates as your settlement progresses through each stage. Your {certificate_type} certificates will be available in your account on the expected delivery date.</p>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                .status-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; margin-bottom: 12px; }}
                .status-badge {{ display: inline-block; background: {config["bg"]}; color: {config["color"]}; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }}
                .progress {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .progress-label {{ color: #64748b; font-size: 13px; margin-bottom: 8px; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="status-icon">{config["emoji"]}</div>
                <h1>Settlement Status Updated</h1>
                <div style="text-align: center;">
                    <span class="status-badge">{config["label"].upper()}</span>
                </div>
                <p style="color: #64748b; text-align: center; margin-bottom: 24px;">Hello {name}, your settlement has progressed to the next stage.</p>
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
                        <span class="value">{old_status.replace("_", " ").title()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">New Status</span>
                        <span class="value" style="color: {config["color"]};">{config["label"]}</span>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                .success-icon {{ font-size: 64px; text-align: center; margin: 20px 0; }}
                h1 {{ color: #0f172a; font-size: 22px; text-align: center; margin-bottom: 12px; }}
                .success-badge {{ display: inline-block; background: #d1fae5; color: #047857; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }}
                .highlight {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }}
                .highlight .big-number {{ font-size: 36px; font-weight: 700; color: #047857; margin-bottom: 8px; }}
                .highlight .label {{ color: #065f46; font-size: 14px; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .button {{ display: block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 200px; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
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
                <p style="color: #64748b; text-align: center; margin-bottom: 24px;">Hello {name}, your certificates have been successfully delivered to your account.</p>
                <div class="highlight">
                    <div class="big-number">+{quantity:,.2f}</div>
                    <div class="label">{certificate_type} certificates added to your account</div>
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
                <a href="http://localhost:5173/dashboard" class="button">View Dashboard</a>
                <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 24px;">Your certificates are now available for trading or swapping.</p>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                .error-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                h1 {{ color: #0f172a; font-size: 20px; text-align: center; margin-bottom: 12px; }}
                .error-badge {{ display: inline-block; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .error-box {{ background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0; }}
                .error-box p {{ color: #991b1b; margin: 0; font-size: 14px; }}
                .support {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .support h3 {{ color: #1e40af; margin: 0 0 8px 0; font-size: 15px; }}
                .support p {{ color: #1e3a8a; margin: 0; font-size: 14px; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">NIHAO<span>GROUP</span></div>
                <div class="error-icon">⚠️</div>
                <h1>Settlement Failed</h1>
                <div style="text-align: center;">
                    <span class="error-badge">❌ FAILED</span>
                </div>
                <p style="color: #64748b; text-align: center; margin-bottom: 24px;">Hello {name}, we encountered an issue processing your settlement.</p>
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
                    <h3>🆘 What happens next?</h3>
                    <p>Our support team has been notified and will contact you within 24 hours to resolve this issue. Your funds remain safe in your account.</p>
                </div>
                <p style="color: #64748b; font-size: 13px; text-align: center;">If you have urgent questions, please contact support@nihaogroup.com</p>
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
                body {{ font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }}
                .logo span {{ color: #10b981; }}
                .alert-header {{ background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 24px; }}
                .alert-header h1 {{ color: #991b1b; font-size: 20px; margin: 0 0 8px 0; }}
                .alert-header p {{ color: #dc2626; margin: 0; font-size: 14px; }}
                .details {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #0f172a; font-weight: 600; }}
                .overdue {{ color: #ef4444; font-weight: 700; font-size: 18px; }}
                .actions {{ background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 20px; margin: 20px 0; }}
                .actions h3 {{ color: #92400e; margin: 0 0 12px 0; font-size: 15px; }}
                .actions ul {{ color: #78350f; margin: 0; padding-left: 20px; }}
                .actions li {{ margin: 6px 0; }}
                .button {{ display: block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px auto; text-align: center; max-width: 250px; }}
                .footer {{ margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }}
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
                        <span class="value">{current_status.replace("_", " ").title()}</span>
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
                <a href="http://localhost:5173/backoffice/settlements" class="button">Review in Backoffice</a>
                <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">This is an automated alert from the Settlement Processor</p>
                <div class="footer">
                    <p>Nihao Group Ltd - Carbon Certificate Trading</p>
                    <p>System Administration</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_content)

    async def _send_email(self, to: str, subject: str, html: str) -> bool:
        """Internal method to send email via Resend or log in dev mode"""
        if not self.enabled:
            logger.info(f"[DEV MODE] Email would be sent to {to}")
            logger.info(f"[DEV MODE] Subject: {subject}")
            return True

        try:
            import resend

            resend.api_key = self.api_key

            params = {
                "from": self.from_email,
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


email_service = EmailService()
