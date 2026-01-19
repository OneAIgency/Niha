import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Integer, Text, Enum as SQLEnum, JSON, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class Jurisdiction(str, enum.Enum):
    EU = "EU"
    CN = "CN"
    HK = "HK"
    OTHER = "OTHER"


class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    FUNDED = "FUNDED"
    MARKET_MAKER = "MARKET_MAKER"


class DocumentType(str, enum.Enum):
    # Company Documents
    REGISTRATION = "REGISTRATION"          # Business Registration Certificate
    TAX_CERTIFICATE = "TAX_CERTIFICATE"    # Tax Registration Certificate
    ARTICLES = "ARTICLES"                  # Articles of Association
    FINANCIAL_STATEMENTS = "FINANCIAL_STATEMENTS"  # Latest Financial Statements
    GHG_PERMIT = "GHG_PERMIT"              # Greenhouse Gas Emissions Permit (optional)
    # Representative Documents
    ID = "ID"                              # Government-Issued ID
    PROOF_AUTHORITY = "PROOF_AUTHORITY"    # Proof of Authority / Power of Attorney
    CONTACT_INFO = "CONTACT_INFO"          # Representative Contact Information


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScrapeStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"


class ScrapeLibrary(str, enum.Enum):
    HTTPX = "HTTPX"
    BEAUTIFULSOUP = "BEAUTIFULSOUP"
    SELENIUM = "SELENIUM"
    PLAYWRIGHT = "PLAYWRIGHT"


class ContactStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    ENROLLED = "enrolled"
    REJECTED = "rejected"


class CertificateType(str, enum.Enum):
    EUA = "EUA"
    CEA = "CEA"


class CertificateStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"


class TradeType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"
    SWAP = "swap"


class TradeStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SwapStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AuthMethod(str, enum.Enum):
    PASSWORD = "password"
    MAGIC_LINK = "magic_link"


class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


class DepositStatus(str, enum.Enum):
    PENDING = "pending"          # User claims they sent wire
    CONFIRMED = "confirmed"      # Backoffice confirmed receipt
    REJECTED = "rejected"        # Wire not received or invalid


class Currency(str, enum.Enum):
    EUR = "EUR"
    USD = "USD"
    CNY = "CNY"
    HKD = "HKD"


class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255))
    jurisdiction = Column(SQLEnum(Jurisdiction), nullable=False)
    registration_number = Column(String(100))
    verified = Column(Boolean, default=False)
    kyc_status = Column(SQLEnum(KYCStatus), default=KYCStatus.PENDING)
    kyc_submitted_at = Column(DateTime, nullable=True)
    kyc_approved_at = Column(DateTime, nullable=True)
    kyc_approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # Balance fields - set by backoffice when confirming deposits
    balance_amount = Column(Numeric(18, 2), default=0)
    balance_currency = Column(SQLEnum(Currency), nullable=True)
    total_deposited = Column(Numeric(18, 2), default=0)  # Lifetime total deposits
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="entity", foreign_keys="User.entity_id")
    certificates = relationship("Certificate", back_populates="entity")
    buy_trades = relationship("Trade", foreign_keys="Trade.buyer_entity_id", back_populates="buyer")
    sell_trades = relationship("Trade", foreign_keys="Trade.seller_entity_id", back_populates="seller")
    swap_requests = relationship("SwapRequest", back_populates="entity")
    kyc_documents = relationship("KYCDocument", back_populates="entity")
    deposits = relationship("Deposit", back_populates="entity")
    holdings = relationship("EntityHolding", back_populates="entity")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Optional for magic link users
    first_name = Column(String(100))
    last_name = Column(String(100))
    position = Column(String(100))
    phone = Column(String(50), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.PENDING)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)
    invitation_token = Column(String(100), nullable=True)
    invitation_sent_at = Column(DateTime, nullable=True)
    invitation_expires_at = Column(DateTime, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    creation_method = Column(String(20), nullable=True)  # 'manual' or 'invitation'
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="users", foreign_keys=[entity_id])
    activity_logs = relationship("ActivityLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    kyc_documents = relationship("KYCDocument", back_populates="user", foreign_keys="KYCDocument.user_id")
    auth_attempts = relationship("AuthenticationAttempt", back_populates="user")
    market_maker_client = relationship("MarketMakerClient", foreign_keys="MarketMakerClient.user_id", back_populates="user", uselist=False)
    created_market_maker_clients = relationship("MarketMakerClient", foreign_keys="MarketMakerClient.created_by", back_populates="creator")


class MarketMakerClient(Base):
    """Market Maker client managed by admin"""
    __tablename__ = "market_maker_clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Display name like "MM-Alpha"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="market_maker_client")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_market_maker_clients")
    transactions = relationship("AssetTransaction", back_populates="market_maker")
    orders = relationship("Order", back_populates="market_maker")


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)  # Person's name
    position = Column(String(100))
    reference = Column(String(255))
    request_type = Column(String(50), default="join")  # 'join' or 'nda'
    nda_file_path = Column(String(500), nullable=True)  # Deprecated - kept for migration
    nda_file_name = Column(String(255), nullable=True)
    nda_file_data = Column(LargeBinary, nullable=True)  # Store PDF binary in database
    nda_file_mime_type = Column(String(100), nullable=True, default="application/pdf")
    submitter_ip = Column(String(45), nullable=True)  # IPv6 max length
    status = Column(SQLEnum(ContactStatus), default=ContactStatus.NEW)
    notes = Column(Text)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    unit_price = Column(Numeric(18, 4), nullable=False)
    vintage_year = Column(Integer)
    status = Column(SQLEnum(CertificateStatus), default=CertificateStatus.AVAILABLE)
    anonymous_code = Column(String(10), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="certificates")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trade_type = Column(SQLEnum(TradeType), nullable=False)
    buyer_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"))
    seller_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"))
    certificate_id = Column(UUID(as_uuid=True), ForeignKey("certificates.id"))
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    price_per_unit = Column(Numeric(18, 4), nullable=False)
    total_value = Column(Numeric(18, 4), nullable=False)
    status = Column(SQLEnum(TradeStatus), default=TradeStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    buyer = relationship("Entity", foreign_keys=[buyer_entity_id], back_populates="buy_trades")
    seller = relationship("Entity", foreign_keys=[seller_entity_id], back_populates="sell_trades")


class SwapRequest(Base):
    __tablename__ = "swap_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    from_type = Column(SQLEnum(CertificateType), nullable=False)
    to_type = Column(SQLEnum(CertificateType), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    desired_rate = Column(Numeric(10, 6))
    status = Column(SQLEnum(SwapStatus), default=SwapStatus.OPEN)
    matched_with = Column(UUID(as_uuid=True), ForeignKey("swap_requests.id"), nullable=True)
    anonymous_code = Column(String(10), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="swap_requests")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    currency = Column(String(3), nullable=False)
    source = Column(String(100))
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)


class ActivityLog(Base):
    """Track user activity for audit and analytics"""
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # login, logout, view_page, trade, etc.
    details = Column(JSON, nullable=True)  # {page: "marketplace", ip: "x.x.x.x", ...}
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    session_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="activity_logs")


class KYCDocument(Base):
    """KYC documents uploaded by users/entities"""
    __tablename__ = "kyc_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=True, index=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="kyc_documents", foreign_keys=[user_id])
    entity = relationship("Entity", back_populates="kyc_documents")


class ScrapingSource(Base):
    """Configuration for price scraping sources"""
    __tablename__ = "scraping_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    scrape_library = Column(SQLEnum(ScrapeLibrary), default=ScrapeLibrary.HTTPX)
    is_active = Column(Boolean, default=True)
    scrape_interval_minutes = Column(Integer, default=5)
    last_scrape_at = Column(DateTime, nullable=True)
    last_scrape_status = Column(SQLEnum(ScrapeStatus), nullable=True)
    last_price = Column(Numeric(18, 4), nullable=True)
    config = Column(JSON, nullable=True)  # Additional scraper configuration (CSS selectors, etc.)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSession(Base):
    """Track user sessions for security and analytics"""
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    device_info = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="sessions")


class Order(Base):
    """Cash market orders for EUA/CEA trading"""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=True, index=True)  # Buyer entity (for BUY orders)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True, index=True)  # Seller (for SELL orders)
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)  # Market maker (for MM orders)
    ticket_id = Column(String(30), nullable=True, index=True)  # Link to audit log
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    filled_quantity = Column(Numeric(18, 2), default=0)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity")
    seller = relationship("Seller", back_populates="orders")
    market_maker = relationship("MarketMakerClient", back_populates="orders")
    buy_trades = relationship("CashMarketTrade", foreign_keys="CashMarketTrade.buy_order_id", back_populates="buy_order")
    sell_trades = relationship("CashMarketTrade", foreign_keys="CashMarketTrade.sell_order_id", back_populates="sell_order")


class CashMarketTrade(Base):
    """Executed trades from the cash market matching engine"""
    __tablename__ = "cash_market_trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buy_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    sell_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow, index=True)

    buy_order = relationship("Order", foreign_keys=[buy_order_id], back_populates="buy_trades")
    sell_order = relationship("Order", foreign_keys=[sell_order_id], back_populates="sell_trades")


class AuthenticationAttempt(Base):
    """Track all authentication attempts for security and audit"""
    __tablename__ = "authentication_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)  # Store email even if user doesn't exist
    success = Column(Boolean, nullable=False)
    method = Column(SQLEnum(AuthMethod), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    failure_reason = Column(String(255), nullable=True)  # 'invalid_password', 'user_not_found', 'account_disabled', etc.
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="auth_attempts")


class Seller(Base):
    """CEA sellers with unique client codes for the Cash Market"""
    __tablename__ = "sellers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_code = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "CEA-001", "CEA-002"
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    jurisdiction = Column(SQLEnum(Jurisdiction), default=Jurisdiction.CN)
    cea_balance = Column(Numeric(18, 2), default=0)  # Available CEA for sale
    cea_sold = Column(Numeric(18, 2), default=0)  # Total CEA sold
    total_transactions = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to orders
    orders = relationship("Order", back_populates="seller")


class Deposit(Base):
    """Track wire transfer deposits from entities"""
    __tablename__ = "deposits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    # User-reported deposit details (what user says they sent)
    reported_amount = Column(Numeric(18, 2), nullable=True)
    reported_currency = Column(SQLEnum(Currency), nullable=True)
    # Confirmed deposit details (what backoffice actually received)
    amount = Column(Numeric(18, 2), nullable=True)  # Actual confirmed amount
    currency = Column(SQLEnum(Currency), nullable=True)  # Actual confirmed currency
    wire_reference = Column(String(100), nullable=True)  # Bank wire reference
    bank_reference = Column(String(100), nullable=True)  # Our internal reference
    # Status tracking
    status = Column(SQLEnum(DepositStatus), default=DepositStatus.PENDING)
    # Timestamps
    reported_at = Column(DateTime, default=datetime.utcnow)  # When user reported the wire
    confirmed_at = Column(DateTime, nullable=True)  # When backoffice confirmed
    # Backoffice tracking
    confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)  # Admin notes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="deposits")
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])


class AssetType(str, enum.Enum):
    """Types of assets that can be held by entities"""
    EUR = "EUR"       # Cash in EUR
    CEA = "CEA"       # China Emission Allowances
    EUA = "EUA"       # EU Allowances


class TransactionType(str, enum.Enum):
    """Types of asset transactions for audit trail"""
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRADE_DEBIT = "TRADE_DEBIT"      # Locks assets when order placed
    TRADE_CREDIT = "TRADE_CREDIT"    # Releases assets when order cancelled/filled
    TRADE_BUY = "TRADE_BUY"          # Asset purchase transaction
    TRADE_SELL = "TRADE_SELL"        # Asset sale transaction
    ADJUSTMENT = "ADJUSTMENT"        # Admin balance adjustment


class TicketStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class EntityHolding(Base):
    """Track entity holdings of various asset types (EUR, CEA, EUA)"""
    __tablename__ = "entity_holdings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    asset_type = Column(SQLEnum(AssetType), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="holdings")

    __table_args__ = (
        # One record per entity per asset type
        {'sqlite_autoincrement': True},
    )


class AssetTransaction(Base):
    """Audit trail for all asset movements"""
    __tablename__ = "asset_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Existing fields (for backward compatibility with Entity-based transactions)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=True, index=True)
    asset_type = Column(String(10), nullable=True)  # EUR, CEA, EUA (for Entity transactions)
    balance_before = Column(Numeric(18, 2), nullable=True)
    reference = Column(String(255), nullable=True)

    # New fields (for Market Makers system)
    ticket_id = Column(String(30), nullable=True, index=True)  # Links to TicketLog
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=True)

    # Common fields (used by both Entity and Market Maker transactions)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)  # Positive for deposits/credits, negative for debits/withdrawals
    balance_after = Column(Numeric(18, 2), nullable=False)  # Running balance
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    entity = relationship("Entity", foreign_keys=[entity_id])
    market_maker = relationship("MarketMakerClient", back_populates="transactions")
    creator = relationship("User", foreign_keys=[created_by])


class TicketLog(Base):
    """Comprehensive audit trail for all system actions"""
    __tablename__ = "ticket_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(30), unique=True, nullable=False, index=True)  # TKT-2026-001234
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
    action_type = Column(String(100), nullable=False, index=True)  # ORDER_PLACED, MM_CREATED, etc.
    entity_type = Column(String(50), nullable=False, index=True)  # Order, MarketMaker, User, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(SQLEnum(TicketStatus), nullable=False, index=True)
    request_payload = Column(JSONB, nullable=True)
    response_data = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("user_sessions.id"), nullable=True)
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    related_ticket_ids = Column(ARRAY(String(30)), nullable=True)
    tags = Column(ARRAY(String(50)), nullable=True, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    market_maker = relationship("MarketMakerClient", foreign_keys=[market_maker_id])
    session = relationship("UserSession", foreign_keys=[session_id])
