from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class Jurisdiction(str, Enum):
    EU = "EU"
    CN = "CN"
    HK = "HK"
    OTHER = "OTHER"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    FUNDED = "FUNDED"


class CertificateType(str, Enum):
    EUA = "EUA"
    CEA = "CEA"


class CertificateStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"


class SwapStatus(str, Enum):
    OPEN = "open"
    MATCHED = "matched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TradeStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DocumentType(str, Enum):
    REGISTRATION = "REGISTRATION"
    ID = "ID"
    PROOF_ADDRESS = "PROOF_ADDRESS"
    BANK_STATEMENT = "BANK_STATEMENT"
    ARTICLES = "ARTICLES"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScrapeLibrary(str, Enum):
    HTTPX = "HTTPX"
    BEAUTIFULSOUP = "BEAUTIFULSOUP"
    SELENIUM = "SELENIUM"
    PLAYWRIGHT = "PLAYWRIGHT"


# Contact Request Schemas
class ContactRequestCreate(BaseModel):
    entity_name: str = Field(..., min_length=2, max_length=255)
    contact_email: EmailStr
    position: Optional[str] = Field(None, max_length=100)
    reference: Optional[str] = Field(None, max_length=255)


class ContactRequestResponse(BaseModel):
    id: UUID
    entity_name: str
    contact_email: str
    position: Optional[str]
    reference: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# User Schemas (defined first for forward reference)
class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    position: Optional[str]
    phone: Optional[str]
    role: str
    entity_id: Optional[UUID]
    is_active: bool = True
    must_change_password: bool = False
    last_login: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """Extended user info for admin views"""
    entity_name: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=8)  # Optional - if not provided, send invitation
    role: UserRole = UserRole.PENDING
    entity_id: Optional[UUID] = None
    position: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class UserRoleUpdate(BaseModel):
    role: UserRole


# Auth Schemas
class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerify(BaseModel):
    token: str


class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None


# Entity Schemas
class EntityResponse(BaseModel):
    id: UUID
    name: str
    legal_name: Optional[str]
    jurisdiction: str
    verified: bool
    kyc_status: str

    class Config:
        from_attributes = True


# Certificate Schemas
class CertificateCreate(BaseModel):
    certificate_type: CertificateType
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    vintage_year: Optional[int] = Field(None, ge=2020, le=2030)


class CertificateResponse(BaseModel):
    id: UUID
    anonymous_code: str
    certificate_type: str
    quantity: float
    unit_price: float
    vintage_year: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MarketplaceListing(BaseModel):
    anonymous_code: str
    certificate_type: str
    quantity: float
    unit_price: float
    vintage_year: Optional[int]
    created_at: datetime


# Trade Schemas
class TradeCreate(BaseModel):
    certificate_id: UUID
    quantity: float = Field(..., gt=0)


class TradeResponse(BaseModel):
    id: UUID
    trade_type: str
    certificate_type: str
    quantity: float
    price_per_unit: float
    total_value: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Swap Schemas
class SwapCreate(BaseModel):
    from_type: CertificateType
    to_type: CertificateType
    quantity: float = Field(..., gt=0)
    desired_rate: Optional[float] = Field(None, gt=0)


class SwapResponse(BaseModel):
    id: UUID
    anonymous_code: str
    from_type: str
    to_type: str
    quantity: float
    desired_rate: Optional[float]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Price Schemas
class PriceData(BaseModel):
    certificate_type: str
    price: float
    currency: str
    change_24h: Optional[float] = None
    source: str
    updated_at: datetime


class PriceResponse(BaseModel):
    eua: PriceData
    cea: PriceData
    swap_rate: float  # CEA per EUA


class PriceHistoryItem(BaseModel):
    price: float
    recorded_at: datetime


class PriceHistoryResponse(BaseModel):
    certificate_type: str
    currency: str
    data: List[PriceHistoryItem]


# Dashboard Schemas
class PortfolioSummary(BaseModel):
    total_eua: float
    total_cea: float
    total_value_usd: float
    pending_swaps: int
    completed_trades: int


class DashboardStats(BaseModel):
    portfolio: PortfolioSummary
    recent_trades: List[TradeResponse]
    active_swaps: List[SwapResponse]
    market_prices: PriceResponse


# Admin Schemas
class ContactRequestUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    agent_id: Optional[UUID] = None


class EntityKYCUpdate(BaseModel):
    kyc_status: str
    notes: Optional[str] = None


# Generic Response
class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Activity Log Schemas
class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityStatsResponse(BaseModel):
    total_users: int
    users_by_role: Dict[str, int]
    active_sessions: int
    logins_today: int
    avg_session_duration: float


# KYC Document Schemas
class KYCDocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    entity_id: Optional[UUID]
    document_type: str
    file_name: str
    status: str
    reviewed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class KYCDocumentReview(BaseModel):
    status: DocumentStatus
    notes: Optional[str] = None


# Scraping Source Schemas
class ScrapingSourceResponse(BaseModel):
    id: UUID
    name: str
    url: str
    certificate_type: str
    scrape_library: Optional[str] = "httpx"
    is_active: bool
    scrape_interval_minutes: int
    last_scrape_at: Optional[datetime]
    last_scrape_status: Optional[str]
    last_price: Optional[float]
    config: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScrapingSourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    scrape_library: Optional[ScrapeLibrary] = None
    is_active: Optional[bool] = None
    scrape_interval_minutes: Optional[int] = None
    config: Optional[Dict[str, Any]] = None


class ScrapingSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1, max_length=500)
    certificate_type: CertificateType
    scrape_library: ScrapeLibrary = ScrapeLibrary.HTTPX
    scrape_interval_minutes: int = Field(5, ge=1, le=60)
    config: Optional[Dict[str, Any]] = None


# User Session Schemas
class UserSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    ip_address: Optional[str]
    user_agent: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


# Onboarding Schemas
class OnboardingStatusResponse(BaseModel):
    documents_uploaded: int
    documents_required: int
    documents: List[KYCDocumentResponse]
    can_submit: bool
    status: str  # pending, submitted, approved, rejected


# Backoffice Schemas
class UserApprovalRequest(BaseModel):
    reason: Optional[str] = None


class PendingUserResponse(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    entity_name: Optional[str]
    documents_count: int
    submitted_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Paginated Response
class PaginatedResponse(BaseModel):
    data: List[Any]
    pagination: Dict[str, int]
