// Certificate Types
export type CertificateType = 'EUA' | 'CEA';

export interface Certificate {
  id: string;
  anonymous_code: string;
  certificate_type: CertificateType;
  quantity: number;
  unit_price: number;
  total_value: number;
  vintage_year?: number;
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
  jurisdiction?: string;
  views?: number;
  inquiries?: number;
}

// Price Types
export interface PriceData {
  price: number;
  currency: string;
  price_usd: number;
  price_eur?: number;  // EUR equivalent (for CEA)
  change_24h: number;
}

export interface Prices {
  eua: PriceData;
  cea: PriceData;
  swap_rate: number;
  updated_at: string;
}

// Swap Types
export interface SwapRequest {
  id: string;
  anonymous_code: string;
  from_type: CertificateType;
  to_type: CertificateType;
  quantity: number;
  desired_rate: number;
  equivalent_quantity: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  created_at: string;
  expires_at?: string;
}

export interface SwapCalculation {
  input: {
    type: CertificateType;
    quantity: number;
    value_usd: number;
  };
  output: {
    type: CertificateType;
    quantity: number;
    value_usd: number;
  };
  rate: number;
  fee_pct: number;
  fee_usd: number;
}

// User Types
export type UserRole = 'ADMIN' | 'PENDING' | 'APPROVED' | 'FUNDED';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  phone?: string;
  role: UserRole;
  entity_id?: string;
  must_change_password?: boolean;
  last_login?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
}

// KYC Document
export type KYCDocumentType =
  | 'REGISTRATION'          // Business Registration Certificate
  | 'TAX_CERTIFICATE'       // Tax Registration Certificate
  | 'ARTICLES'              // Articles of Association
  | 'FINANCIAL_STATEMENTS'  // Latest Financial Statements
  | 'GHG_PERMIT'            // Greenhouse Gas Emissions Permit (optional)
  | 'ID'                    // Government-Issued ID
  | 'PROOF_AUTHORITY'       // Proof of Authority / Power of Attorney
  | 'CONTACT_INFO';         // Representative Contact Information

export interface KYCDocument {
  id: string;
  user_id: string;
  entity_id?: string;
  document_type: KYCDocumentType;
  file_name: string;
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
}

// Scraping Source
export type ScrapeLibrary = 'HTTPX' | 'BEAUTIFULSOUP' | 'SELENIUM' | 'PLAYWRIGHT';

export interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  certificate_type: CertificateType;
  scrape_library?: ScrapeLibrary;
  is_active: boolean;
  scrape_interval_minutes: number;
  last_scrape_at?: string;
  last_scrape_status?: 'success' | 'failed' | 'timeout';
  last_price?: number;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// User Session
export interface UserSession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface Entity {
  id: string;
  name: string;
  legal_name?: string;
  jurisdiction: 'EU' | 'CN' | 'HK' | 'OTHER';
  verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
}

// Contact Request
export interface ContactRequest {
  entity_name: string;
  contact_email: string;
  position?: string;
  reference?: string;
}

// Market Stats
export interface MarketStats {
  cea_listings: number;
  eua_listings: number;
  active_swaps: number;
  total_cea_volume: number;
  total_eua_volume: number;
  total_market_value_usd: number;
  avg_cea_price: number;
  avg_eua_price: number;
  jurisdictions_served: string[];
  trades_24h: number;
  volume_24h_usd: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// Trade Types
export interface Trade {
  id: string;
  trade_type: 'buy' | 'sell' | 'swap';
  certificate_type: CertificateType;
  quantity: number;
  price_per_unit: number;
  total_value: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

// Portfolio Summary
export interface PortfolioSummary {
  total_eua: number;
  total_cea: number;
  total_value_usd: number;
  pending_swaps: number;
  completed_trades: number;
}

// Cash Market Types
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  entity_id: string;
  certificate_type: CertificateType;
  side: OrderSide;
  price: number;
  quantity: number;
  filled_quantity: number;
  remaining_quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  order_count: number;
  cumulative_quantity: number;
}

export interface OrderBook {
  certificate_type: CertificateType;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  best_bid: number | null;
  best_ask: number | null;
  last_price: number | null;
  volume_24h: number;
  change_24h: number;
}

export interface MarketDepthPoint {
  price: number;
  cumulative_quantity: number;
}

export interface MarketDepth {
  certificate_type: CertificateType;
  bids: MarketDepthPoint[];
  asks: MarketDepthPoint[];
}

export interface CashMarketTrade {
  id: string;
  certificate_type: CertificateType;
  price: number;
  quantity: number;
  side: OrderSide;
  executed_at: string;
}

export interface CashMarketStats {
  certificate_type: CertificateType;
  last_price: number;
  change_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  total_bids: number;
  total_asks: number;
}
