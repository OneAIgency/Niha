from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Nihao Carbon Trading Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://niha_user:niha_secure_pass_2024@localhost:5432/niha_carbon"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MAGIC_LINK_EXPIRE_MINUTES: int = 15

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://platonos.mooo.com,https://platonos.mooo.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Email (Resend)
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@nihaogroup.com"

    # Price Scraping
    PRICE_UPDATE_INTERVAL_SECONDS: int = 300  # 5 minutes

    # Market Defaults (based on research)
    DEFAULT_EUA_PRICE_EUR: float = 75.0
    DEFAULT_CEA_PRICE_CNY: float = 100.0
    EUR_TO_USD: float = 1.08
    CNY_TO_USD: float = 0.14

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
