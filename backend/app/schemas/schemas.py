from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


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
    MARKET_MAKER = "MARKET_MAKER"


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


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    """Order execution type"""

    MARKET = "MARKET"  # Execute immediately at best available price
    LIMIT = "LIMIT"  # Place in order book at specified price


class OrderStatus(str, Enum):
    OPEN = "OPEN"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


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
    contact_name: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=100)
    reference: Optional[str] = Field(None, max_length=255)
    request_type: str = Field(default="join")  # 'join' or 'nda'


class ContactRequestResponse(BaseModel):
    id: UUID
    entity_name: str
    contact_email: str
    contact_name: Optional[str]
    position: Optional[str]
    reference: Optional[str]
    request_type: str
    nda_file_name: Optional[str]
    submitter_ip: Optional[str] = None
    status: str
    notes: Optional[str] = None
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
    password: Optional[str] = Field(
        None, min_length=8
    )  # Optional - if not provided, send invitation
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
    scrape_library: Optional[str] = "HTTPX"
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


# Cash Market Order Schemas
class OrderCreate(BaseModel):
    certificate_type: CertificateType
    side: OrderSide
    price: float = Field(..., gt=0)
    quantity: float = Field(..., gt=0)


class OrderResponse(BaseModel):
    id: UUID
    entity_id: UUID
    certificate_type: str
    side: str
    price: float
    quantity: float
    filled_quantity: float
    remaining_quantity: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class OrderBookLevel(BaseModel):
    price: float
    quantity: float
    order_count: int
    cumulative_quantity: float


# =============================================================================
# Order Preview and Execution Schemas
# =============================================================================


class OrderFill(BaseModel):
    """Single fill from the order book"""

    seller_code: str
    price: float
    quantity: float
    cost: float


class OrderPreviewRequest(BaseModel):
    """Request to preview an order before execution"""

    certificate_type: CertificateType
    side: OrderSide
    amount_eur: Optional[float] = Field(
        None, gt=0, description="Amount in EUR to spend (for BUY)"
    )
    quantity: Optional[float] = Field(None, gt=0, description="Quantity to buy/sell")
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = Field(
        None, gt=0, description="Limit price (required for LIMIT orders)"
    )
    all_or_none: bool = Field(
        False, description="Only execute if entire order can be filled"
    )


class OrderPreviewResponse(BaseModel):
    """Response with preview of order execution"""

    certificate_type: str
    side: str
    order_type: str

    # Input parameters
    amount_eur: Optional[float] = None
    quantity_requested: Optional[float] = None
    limit_price: Optional[float] = None
    all_or_none: bool = False

    # Calculated fills
    fills: List[OrderFill] = []
    total_quantity: float
    total_cost_gross: float  # Before fees

    # Price analysis
    weighted_avg_price: float  # Average price per certificate
    best_price: Optional[float] = None  # Best price in order book
    worst_price: Optional[float] = None  # Worst price we'd pay

    # Fee breakdown (platform fee: 0.5%)
    platform_fee_rate: float = 0.005
    platform_fee_amount: float
    total_cost_net: float  # After fees (what user actually pays)
    net_price_per_unit: float  # Net price per certificate including fees

    # Balance info
    available_balance: float
    remaining_balance: float

    # Execution status
    can_execute: bool
    execution_message: str
    partial_fill: bool = False  # True if order would only partially fill


class MarketOrderRequest(BaseModel):
    """Request to execute a market order"""

    certificate_type: CertificateType
    side: OrderSide
    amount_eur: Optional[float] = Field(
        None, gt=0, description="Amount in EUR to spend (for BUY)"
    )
    quantity: Optional[float] = Field(None, gt=0, description="Quantity to buy/sell")
    all_or_none: bool = Field(
        False, description="Only execute if entire order can be filled"
    )


class LimitOrderRequest(BaseModel):
    """Request to place a limit order"""

    certificate_type: CertificateType
    side: OrderSide
    price: float = Field(..., gt=0, description="Limit price")
    quantity: float = Field(..., gt=0, description="Quantity to buy/sell")
    all_or_none: bool = Field(
        False, description="Only execute if entire order can be filled"
    )


class OrderExecutionResponse(BaseModel):
    """Response after order execution"""

    success: bool
    order_id: Optional[UUID] = None
    message: str

    # Execution details
    certificate_type: str
    side: str
    order_type: str

    # What was filled
    total_quantity: float
    total_cost_gross: float
    platform_fee: float
    total_cost_net: float
    weighted_avg_price: float

    # Trade breakdown
    trades: List[OrderFill] = []

    # Updated balances
    eur_balance: float
    certificate_balance: float


class OrderBookResponse(BaseModel):
    certificate_type: str
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]
    spread: Optional[float]
    best_bid: Optional[float]
    best_ask: Optional[float]
    last_price: Optional[float]
    volume_24h: float
    change_24h: float


class MarketDepthPoint(BaseModel):
    price: float
    cumulative_quantity: float


class MarketDepthResponse(BaseModel):
    certificate_type: str
    bids: List[MarketDepthPoint]
    asks: List[MarketDepthPoint]


class CashMarketTradeResponse(BaseModel):
    id: UUID
    certificate_type: str
    price: float
    quantity: float
    side: str  # BUY if taker was buyer, SELL if taker was seller
    executed_at: datetime

    class Config:
        from_attributes = True


class MarketStatsResponse(BaseModel):
    certificate_type: str
    last_price: float
    change_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    total_bids: int
    total_asks: int


# Authentication History Schemas
class AuthMethod(str, Enum):
    PASSWORD = "password"
    MAGIC_LINK = "magic_link"


class AuthenticationAttemptResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    email: str
    success: bool
    method: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Admin User Management Schemas
class AdminUserFullResponse(UserResponse):
    """Full user details for admin - includes auth history and stats"""

    entity_name: Optional[str] = None
    password_set: bool = (
        False  # Indicates if user has password (NOT the actual password)
    )
    login_count: int = 0
    last_login_ip: Optional[str] = None
    failed_login_count_24h: int = 0
    sessions: List[UserSessionResponse] = []
    auth_history: List[AuthenticationAttemptResponse] = []


class AdminUserUpdate(BaseModel):
    """Schema for admin to update any user field"""

    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    entity_id: Optional[UUID] = None


class AdminPasswordReset(BaseModel):
    """Admin can reset user password"""

    new_password: str = Field(..., min_length=8)
    force_change: bool = True  # Force user to change on next login


# Deposit Schemas
class DepositStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ON_HOLD = "on_hold"
    CLEARED = "cleared"
    REJECTED = "rejected"


class HoldType(str, Enum):
    """Types of AML hold periods"""

    FIRST_DEPOSIT = "FIRST_DEPOSIT"
    SUBSEQUENT = "SUBSEQUENT"
    LARGE_AMOUNT = "LARGE_AMOUNT"


class AMLStatus(str, Enum):
    """AML review status"""

    PENDING = "PENDING"
    ON_HOLD = "ON_HOLD"
    CLEARED = "CLEARED"
    REJECTED = "REJECTED"


class Currency(str, Enum):
    EUR = "EUR"
    USD = "USD"
    CNY = "CNY"
    HKD = "HKD"


class DepositCreate(BaseModel):
    """Backoffice creates deposit when confirming wire transfer"""

    entity_id: UUID
    amount: float = Field(..., gt=0)
    currency: Currency
    wire_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class UserDepositReport(BaseModel):
    """User reports a wire transfer they've made (APPROVED users only)"""

    amount: float = Field(..., gt=0, description="Amount sent in wire transfer")
    currency: Currency = Field(..., description="Currency of wire transfer")
    wire_reference: Optional[str] = Field(
        None, max_length=100, description="Bank wire reference number"
    )


class DepositConfirm(BaseModel):
    """Backoffice confirms a pending deposit with actual received amount"""

    amount: float = Field(..., gt=0, description="Actual amount received")
    currency: Currency = Field(..., description="Actual currency received")
    notes: Optional[str] = Field(None, description="Admin notes")


class DepositResponse(BaseModel):
    id: UUID
    entity_id: UUID
    reported_amount: Optional[float] = None
    reported_currency: Optional[str] = None
    amount: Optional[float] = None  # Confirmed amount
    currency: Optional[str] = None  # Confirmed currency
    wire_reference: Optional[str] = None
    bank_reference: Optional[str] = None
    status: str
    reported_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EntityBalanceResponse(BaseModel):
    """Entity balance info for dashboard/backoffice"""

    entity_id: UUID
    entity_name: str
    balance_amount: float
    balance_currency: Optional[str]
    total_deposited: float
    deposit_count: int


class DepositWithEntityResponse(DepositResponse):
    """Deposit with entity details for backoffice list"""

    entity_name: Optional[str] = None
    user_email: Optional[str] = None


# =============================================================================
# Enhanced Deposit Schemas for AML Hold Management
# =============================================================================


class DepositAnnouncementRequest(BaseModel):
    """Client announces incoming wire transfer"""

    amount: float = Field(..., gt=0, description="Amount being sent")
    currency: Currency = Field(..., description="Currency of wire transfer")
    source_bank: str = Field(
        ..., min_length=2, max_length=255, description="Name of sending bank"
    )
    source_iban: Optional[str] = Field(
        None, max_length=50, description="IBAN of source account"
    )
    source_swift: Optional[str] = Field(
        None, max_length=20, description="SWIFT/BIC of source bank"
    )
    wire_reference: Optional[str] = Field(
        None, max_length=100, description="Wire transfer reference"
    )
    notes: Optional[str] = Field(None, description="Additional notes from client")


class WireInstructions(BaseModel):
    """Bank wire instructions for deposit"""

    bank_name: str = "Nihao Group Bank Partner"
    account_name: str = "Nihao Carbon Trading Ltd"
    iban: str = "DE89370400440532013000"
    swift: str = "COBADEFFXXX"
    reference_prefix: str
    instructions: str = "Please include the reference in your wire transfer"


class DepositAnnouncementResponse(BaseModel):
    """Response after client announces deposit"""

    deposit_id: UUID
    wire_instructions: WireInstructions
    expected_hold_type: HoldType
    expected_hold_days: int
    message: str


class DepositConfirmRequest(BaseModel):
    """Admin confirms wire receipt"""

    actual_amount: float = Field(..., gt=0, description="Actual amount received")
    actual_currency: Currency = Field(..., description="Actual currency received")
    received_at: Optional[datetime] = Field(
        None, description="When wire was received (defaults to now)"
    )
    admin_notes: Optional[str] = Field(None, description="Admin notes")


class DepositApproveRequest(BaseModel):
    """Admin approves deposit after AML hold"""

    admin_notes: Optional[str] = Field(None, description="Approval notes")


class RejectionReason(str, Enum):
    """Standard rejection reasons"""

    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    INCOMPLETE_KYC = "INCOMPLETE_KYC"
    AML_COMPLIANCE_CONCERN = "AML_COMPLIANCE_CONCERN"
    SOURCE_OF_FUNDS_UNCLEAR = "SOURCE_OF_FUNDS_UNCLEAR"
    WIRE_NOT_RECEIVED = "WIRE_NOT_RECEIVED"
    AMOUNT_MISMATCH = "AMOUNT_MISMATCH"
    OTHER = "OTHER"


class DepositRejectRequest(BaseModel):
    """Admin rejects deposit"""

    reason: RejectionReason = Field(..., description="Rejection reason category")
    reason_details: str = Field(..., min_length=10, description="Detailed explanation")
    admin_notes: Optional[str] = Field(None, description="Internal admin notes")


class DepositDetailResponse(BaseModel):
    """Full deposit details for review"""

    id: UUID
    entity_id: UUID
    entity_name: str
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None

    # Reported by client
    reported_amount: Optional[float] = None
    reported_currency: Optional[str] = None
    source_bank: Optional[str] = None
    source_iban: Optional[str] = None
    source_swift: Optional[str] = None
    wire_reference: Optional[str] = None
    client_notes: Optional[str] = None

    # Confirmed by admin
    amount: Optional[float] = None
    currency: Optional[str] = None
    bank_reference: Optional[str] = None

    # Status
    status: DepositStatus
    aml_status: Optional[AMLStatus] = None
    hold_type: Optional[HoldType] = None
    hold_days_required: Optional[int] = None
    hold_expires_at: Optional[datetime] = None

    # Timestamps
    reported_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    cleared_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None

    # Admin info
    confirmed_by: Optional[UUID] = None
    confirmed_by_name: Optional[str] = None
    cleared_by_admin_id: Optional[UUID] = None
    cleared_by_name: Optional[str] = None
    rejected_by_admin_id: Optional[UUID] = None
    rejected_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DepositListFilters(BaseModel):
    """Filters for admin deposit list"""

    status: Optional[DepositStatus] = None
    aml_status: Optional[AMLStatus] = None
    entity_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    search: Optional[str] = Field(
        None, description="Search by entity name, email, wire ref"
    )


class MyDepositResponse(BaseModel):
    """Deposit info for client view"""

    id: UUID
    reported_amount: float
    reported_currency: str
    status: DepositStatus
    aml_status: Optional[str] = None
    hold_type: Optional[str] = None
    hold_expires_at: Optional[datetime] = None
    reported_at: datetime
    confirmed_at: Optional[datetime] = None
    cleared_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class HoldCalculationResult(BaseModel):
    """Result of hold period calculation"""

    hold_type: HoldType
    hold_days: int
    reason: str


# =============================================================================
# Asset Management Schemas (EUR, CEA, EUA)
# =============================================================================


class AssetTypeEnum(str, Enum):
    """Types of assets that can be held by entities"""

    EUR = "EUR"
    CEA = "CEA"
    EUA = "EUA"


class MarketMakerTypeEnum(str, Enum):
    """Types of market makers"""

    CEA_CASH_SELLER = "CEA_CASH_SELLER"
    CASH_BUYER = "CASH_BUYER"
    SWAP_MAKER = "SWAP_MAKER"


class TransactionTypeEnum(str, Enum):
    """Types of asset transactions"""

    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRADE_BUY = "trade_buy"
    TRADE_SELL = "trade_sell"
    ADJUSTMENT = "adjustment"


class AddAssetRequest(BaseModel):
    """Request to add assets to an entity"""

    asset_type: AssetTypeEnum
    amount: float = Field(..., gt=0, description="Amount to add (must be positive)")
    reference: Optional[str] = Field(
        None, max_length=100, description="External reference"
    )
    notes: Optional[str] = Field(None, description="Admin notes")


class EntityHoldingResponse(BaseModel):
    """Single asset holding for an entity"""

    entity_id: UUID
    asset_type: str
    quantity: float
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetTransactionResponse(BaseModel):
    """Asset transaction record for audit trail"""

    id: UUID
    entity_id: UUID
    asset_type: str
    transaction_type: str
    amount: float
    balance_before: float
    balance_after: float
    reference: Optional[str]
    notes: Optional[str]
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class EntityAssetsResponse(BaseModel):
    """Complete asset overview for an entity"""

    entity_id: UUID
    entity_name: str
    eur_balance: float = 0
    cea_balance: float = 0
    eua_balance: float = 0
    recent_transactions: List[AssetTransactionResponse] = []


# =============================================================================
# Market Maker Schemas
# =============================================================================


class MarketMakerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    description: Optional[str] = None
    mm_type: MarketMakerTypeEnum = MarketMakerTypeEnum.CEA_CASH_SELLER
    initial_balances: Optional[Dict[str, Decimal]] = None  # {CEA: 10000, EUA: 5000}
    initial_eur_balance: Optional[Decimal] = None


class MarketMakerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MarketMakerBalance(BaseModel):
    available: Decimal
    locked: Decimal
    total: Decimal


class MarketMakerResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    mm_type: MarketMakerTypeEnum
    is_active: bool
    current_balances: Dict[str, MarketMakerBalance]  # {CEA: {...}, EUA: {...}}
    eur_balance: Optional[Decimal] = None
    total_orders: int = 0
    total_trades: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Asset Transaction Schemas
class AssetTransactionCreate(BaseModel):
    certificate_type: str  # CEA, EUA
    transaction_type: str  # DEPOSIT, WITHDRAWAL
    amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class MarketMakerTransactionResponse(BaseModel):
    id: UUID
    ticket_id: str
    market_maker_id: UUID
    certificate_type: str
    transaction_type: str
    amount: Decimal
    balance_after: Decimal
    notes: Optional[str]
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Market Order (Admin) Schemas
class MarketOrderCreate(BaseModel):
    market_maker_id: UUID
    certificate_type: str  # CEA, EUA
    side: str = Field(..., pattern="^(BID|ASK)$")  # BID (buy) or ASK (sell)
    order_type: str = "LIMIT"
    price: Decimal = Field(..., gt=0)
    quantity: Decimal = Field(..., gt=0)


# Ticket Log Schemas
class TicketLogResponse(BaseModel):
    id: UUID
    ticket_id: str
    timestamp: datetime
    user_id: Optional[UUID]
    market_maker_id: Optional[UUID]
    action_type: str
    entity_type: str
    entity_id: Optional[UUID]
    status: str
    request_payload: Optional[Dict[str, Any]]
    response_data: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    before_state: Optional[Dict[str, Any]]
    after_state: Optional[Dict[str, Any]]
    related_ticket_ids: List[str]
    tags: List[str]

    class Config:
        from_attributes = True


class TicketLogStats(BaseModel):
    total_actions: int
    success_count: int
    failed_count: int
    by_action_type: Dict[str, int]
    by_user: List[Dict[str, Any]]
    actions_over_time: List[Dict[str, Any]]


# =============================================================================
# Liquidity Management Schemas
# =============================================================================


class LiquidityPreviewRequest(BaseModel):
    certificate_type: CertificateType
    bid_amount_eur: Decimal = Field(..., gt=0)
    ask_amount_eur: Decimal = Field(..., gt=0)


class MarketMakerAllocation(BaseModel):
    mm_id: UUID
    mm_name: str
    mm_type: MarketMakerTypeEnum
    allocation: Decimal = Field(..., gt=0)
    orders_count: int


class LiquidityPlan(BaseModel):
    mms: List[MarketMakerAllocation]
    total_amount: Decimal
    price_levels: List[Dict[str, Any]]


class MissingAssets(BaseModel):
    asset_type: str
    required: Decimal = Field(..., ge=0)
    available: Decimal = Field(..., ge=0)
    shortfall: Decimal = Field(..., ge=0)


class LiquidityPreviewResponse(BaseModel):
    can_execute: bool
    certificate_type: str
    bid_plan: LiquidityPlan
    ask_plan: LiquidityPlan
    missing_assets: Optional[MissingAssets] = None
    suggested_actions: List[str]
    total_orders_count: int
    estimated_spread: Decimal = Field(..., ge=0)


class LiquidityCreateRequest(BaseModel):
    certificate_type: CertificateType
    bid_amount_eur: Decimal = Field(..., gt=0)
    ask_amount_eur: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class LiquidityCreateResponse(BaseModel):
    success: bool
    liquidity_operation_id: UUID
    orders_created: int
    bid_liquidity_eur: Decimal = Field(..., gt=0)
    ask_liquidity_eur: Decimal = Field(..., gt=0)
    market_makers_used: List[Dict[str, Any]]


class ProvisionAction(str, Enum):
    """Actions for provisioning market makers"""

    CREATE_NEW = "create_new"
    FUND_EXISTING = "fund_existing"


class ProvisionRequest(BaseModel):
    action: ProvisionAction
    mm_type: MarketMakerTypeEnum
    amount: Decimal = Field(..., gt=0)
    mm_ids: Optional[List[UUID]] = None
    count: Optional[int] = None
