/**
 * Test Data Factories
 * Functions to generate consistent mock data for tests
 */

// ==================== USER FACTORIES ====================

export interface MockUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'market_maker';
  status: 'pending' | 'approved' | 'rejected' | 'invited';
  entity_id?: string;
  created_at: string;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    status: 'approved',
    entity_id: 'entity-1',
    created_at: '2026-01-26T00:00:00Z',
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    id: 'admin-1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    ...overrides,
  });
}

// ==================== ORDER FACTORIES ====================

export interface MockOrder {
  id: string;
  entity_id: string;
  certificate_type: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
  filled_quantity: number;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
  created_at: string;
}

export function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return {
    id: 'order-1',
    entity_id: 'entity-1',
    certificate_type: 'CEA',
    side: 'BID',
    price: 100.50,
    quantity: 10,
    filled_quantity: 0,
    status: 'OPEN',
    created_at: '2026-01-26T10:00:00Z',
    ...overrides,
  };
}

export function createMockBidOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return createMockOrder({
    side: 'BID',
    ...overrides,
  });
}

export function createMockAskOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return createMockOrder({
    side: 'ASK',
    ...overrides,
  });
}

// ==================== ORDER BOOK FACTORIES ====================

export interface OrderBookLevel {
  price: number;
  quantity: number;
  order_count: number;
}

export interface MockOrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  last_trade_price: number;
  certificate_type: 'CEA' | 'EUA';
}

export function createMockOrderBook(overrides: Partial<MockOrderBook> = {}): MockOrderBook {
  return {
    bids: [
      { price: 99.50, quantity: 100, order_count: 3 },
      { price: 99.00, quantity: 250, order_count: 5 },
      { price: 98.50, quantity: 180, order_count: 2 },
    ],
    asks: [
      { price: 100.00, quantity: 150, order_count: 4 },
      { price: 100.50, quantity: 200, order_count: 3 },
      { price: 101.00, quantity: 120, order_count: 2 },
    ],
    spread: 0.50,
    last_trade_price: 99.75,
    certificate_type: 'CEA',
    ...overrides,
  };
}

// ==================== BALANCE FACTORIES ====================

export interface MockBalances {
  EUR: number;
  CEA: number;
  EUA: number;
}

export function createMockBalances(overrides: Partial<MockBalances> = {}): MockBalances {
  return {
    EUR: 50000.00,
    CEA: 1000,
    EUA: 500,
    ...overrides,
  };
}

// ==================== SETTLEMENT FACTORIES ====================

export type SettlementStatus =
  | 'PENDING'
  | 'TRANSFER_INITIATED'
  | 'IN_TRANSIT'
  | 'AT_CUSTODY'
  | 'SETTLED'
  | 'FAILED';

export interface TimelineEntry {
  status: SettlementStatus;
  timestamp: string;
}

export interface MockSettlement {
  id: string;
  batch_id: string;
  status: SettlementStatus;
  total_trades: number;
  total_volume: number;
  timeline: TimelineEntry[];
  created_at: string;
  expected_settlement: string;
}

export function createMockSettlement(overrides: Partial<MockSettlement> = {}): MockSettlement {
  return {
    id: 'settlement-1',
    batch_id: 'BATCH-2026-001',
    status: 'PENDING',
    total_trades: 5,
    total_volume: 500,
    timeline: [
      { status: 'PENDING', timestamp: '2026-01-25T16:00:00Z' },
    ],
    created_at: '2026-01-25T16:00:00Z',
    expected_settlement: '2026-01-28T16:00:00Z',
    ...overrides,
  };
}

export function createSettlementTimeline(
  currentStatus: SettlementStatus
): TimelineEntry[] {
  const statusOrder: SettlementStatus[] = [
    'PENDING',
    'TRANSFER_INITIATED',
    'IN_TRANSIT',
    'AT_CUSTODY',
    'SETTLED',
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) {
    return [{ status: currentStatus, timestamp: new Date().toISOString() }];
  }

  const baseDate = new Date('2026-01-25T16:00:00Z');
  const timeline: TimelineEntry[] = [];

  for (let i = 0; i <= currentIndex; i++) {
    const date = new Date(baseDate);
    date.setHours(date.getHours() + i * 8); // 8 hours between each status
    timeline.push({
      status: statusOrder[i],
      timestamp: date.toISOString(),
    });
  }

  return timeline;
}

// ==================== DEPOSIT FACTORIES ====================

export interface MockDeposit {
  id: string;
  entity_id: string;
  amount: number;
  currency: 'EUR';
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export function createMockDeposit(overrides: Partial<MockDeposit> = {}): MockDeposit {
  return {
    id: 'deposit-1',
    entity_id: 'entity-1',
    amount: 10000.00,
    currency: 'EUR',
    status: 'pending',
    created_at: '2026-01-25T10:00:00Z',
    ...overrides,
  };
}

// ==================== KYC DOCUMENT FACTORIES ====================

export interface MockKYCDocument {
  id: string;
  user_id: string;
  document_type: 'id_card' | 'proof_of_address' | 'business_registration';
  filename: string;
  status: 'pending_review' | 'approved' | 'rejected';
  uploaded_at: string;
  review_notes?: string;
}

export function createMockKYCDocument(
  overrides: Partial<MockKYCDocument> = {}
): MockKYCDocument {
  return {
    id: 'doc-1',
    user_id: 'user-1',
    document_type: 'id_card',
    filename: 'id_card.pdf',
    status: 'pending_review',
    uploaded_at: '2026-01-25T10:00:00Z',
    ...overrides,
  };
}

// ==================== CONTACT REQUEST FACTORIES ====================

export interface MockContactRequest {
  id: string;
  email: string;
  company_name: string;
  message: string;
  status: 'pending' | 'processed' | 'rejected';
  created_at: string;
}

export function createMockContactRequest(
  overrides: Partial<MockContactRequest> = {}
): MockContactRequest {
  return {
    id: 'contact-1',
    email: 'newuser@example.com',
    company_name: 'New Company',
    message: 'Interested in joining',
    status: 'pending',
    created_at: '2026-01-25T10:00:00Z',
    ...overrides,
  };
}

// ==================== AUTH TOKEN FACTORIES ====================

export interface MockTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export function createMockTokens(overrides: Partial<MockTokens> = {}): MockTokens {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    ...overrides,
  };
}
