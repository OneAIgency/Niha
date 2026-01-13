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
        total: float
    ) -> bool:
        """Send trade confirmation email"""
        subject = f"Trade Confirmation - {trade_type.upper()} {quantity} {certificate_type}"
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
        self,
        to_email: str,
        from_type: str,
        to_type: str,
        quantity: float,
        rate: float
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

    async def send_invitation(self, to_email: str, first_name: str, invitation_token: str) -> bool:
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
                "html": html
            }

            resend.Emails.send(params)
            logger.info(f"Email sent successfully to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False


email_service = EmailService()
