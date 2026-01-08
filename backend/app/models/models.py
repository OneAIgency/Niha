import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Integer, Text, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="entity", foreign_keys="User.entity_id")
    certificates = relationship("Certificate", back_populates="entity")
    buy_trades = relationship("Trade", foreign_keys="Trade.buyer_entity_id", back_populates="buyer")
    sell_trades = relationship("Trade", foreign_keys="Trade.seller_entity_id", back_populates="seller")
    swap_requests = relationship("SwapRequest", back_populates="entity")
    kyc_documents = relationship("KYCDocument", back_populates="entity")


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
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="users", foreign_keys=[entity_id])
    activity_logs = relationship("ActivityLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    kyc_documents = relationship("KYCDocument", back_populates="user", foreign_keys="KYCDocument.user_id")


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    position = Column(String(100))
    reference = Column(String(255))
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
