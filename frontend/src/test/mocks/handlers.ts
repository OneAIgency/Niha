/**
 * MSW Request Handlers
 * Defines mock API responses for testing
 */

import { http, HttpResponse } from 'msw';

// Base URL for API - matches the Vite proxy configuration
const API_BASE = '/api/v1';

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  status: 'approved',
  entity_id: 'entity-1',
  created_at: '2026-01-26T00:00:00Z',
};

const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
};

const mockTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'Bearer',
};

const mockOrderBook = {
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
};

const mockBalances = {
  EUR: 50000.00,
  CEA: 1000,
  EUA: 500,
};

export const handlers = [
  // ==================== AUTH HANDLERS ====================

  // Login with password
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Invalid credentials
    if (body.password === 'wrong-password') {
      return HttpResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Invalid email format
    if (!body.email.includes('@')) {
      return HttpResponse.json(
        { detail: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Admin login
    if (body.email === 'admin@example.com') {
      return HttpResponse.json({
        ...mockTokens,
        user: mockAdminUser,
      });
    }

    // Regular user login
    return HttpResponse.json({
      ...mockTokens,
      user: mockUser,
    });
  }),

  // Validate invitation token
  http.get(`${API_BASE}/auth/invitation/:token`, async ({ params }) => {
    const { token } = params;

    if (token === 'invalid-token') {
      return HttpResponse.json(
        { detail: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      email: 'invited@example.com',
      entity_name: 'Test Entity',
      role: 'user',
    });
  }),

  // Setup password
  http.post(`${API_BASE}/auth/setup-password`, async ({ request }) => {
    const body = await request.json() as {
      token: string;
      password: string;
      password_confirm: string;
    };

    if (body.password !== body.password_confirm) {
      return HttpResponse.json(
        { detail: 'Passwords do not match' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...mockTokens,
      user: mockUser,
    });
  }),

  // Logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Refresh token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refresh_token: string };

    if (!body.refresh_token || body.refresh_token === 'invalid-token') {
      return HttpResponse.json(
        { detail: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockTokens);
  }),

  // ==================== CASH MARKET HANDLERS ====================

  // Get order book
  http.get(`${API_BASE}/cash-market/order-book`, ({ request }) => {
    const url = new URL(request.url);
    const certificateType = url.searchParams.get('certificate_type') || 'CEA';

    return HttpResponse.json({
      ...mockOrderBook,
      certificate_type: certificateType,
    });
  }),

  // Place order
  http.post(`${API_BASE}/cash-market/orders`, async ({ request }) => {
    const body = await request.json() as {
      certificate_type: string;
      side: 'BID' | 'ASK';
      price: number;
      quantity: number;
    };

    // Validation
    if (body.price <= 0) {
      return HttpResponse.json(
        { detail: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.quantity <= 0) {
      return HttpResponse.json(
        { detail: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      id: `order-${Date.now()}`,
      ...body,
      status: 'OPEN',
      filled_quantity: 0,
      created_at: new Date().toISOString(),
    });
  }),

  // Get user's orders
  http.get(`${API_BASE}/cash-market/orders`, () => {
    return HttpResponse.json([
      {
        id: 'order-1',
        certificate_type: 'CEA',
        side: 'BID',
        price: 99.50,
        quantity: 100,
        filled_quantity: 0,
        status: 'OPEN',
        created_at: '2026-01-26T10:00:00Z',
      },
      {
        id: 'order-2',
        certificate_type: 'CEA',
        side: 'ASK',
        price: 100.50,
        quantity: 50,
        filled_quantity: 25,
        status: 'PARTIALLY_FILLED',
        created_at: '2026-01-26T09:30:00Z',
      },
    ]);
  }),

  // Cancel order
  http.delete(`${API_BASE}/cash-market/orders/:orderId`, ({ params }) => {
    const { orderId } = params;
    return HttpResponse.json({
      id: orderId,
      status: 'CANCELLED',
    });
  }),

  // Preview order
  http.post(`${API_BASE}/cash-market/orders/preview`, async ({ request }) => {
    const body = await request.json() as {
      certificate_type: string;
      side: 'BID' | 'ASK';
      quantity: number;
    };

    return HttpResponse.json({
      estimated_fills: [
        { price: 100.00, quantity: Math.min(body.quantity, 50) },
        { price: 100.50, quantity: Math.max(0, body.quantity - 50) },
      ],
      total_cost: body.quantity * 100.25,
      average_price: 100.25,
    });
  }),

  // Execute market order
  http.post(`${API_BASE}/cash-market/orders/market`, async ({ request }) => {
    const body = await request.json() as {
      certificate_type: string;
      side: 'BID' | 'ASK';
      quantity: number;
    };

    return HttpResponse.json({
      id: `market-order-${Date.now()}`,
      ...body,
      status: 'FILLED',
      filled_quantity: body.quantity,
      average_price: 100.25,
      created_at: new Date().toISOString(),
    });
  }),

  // Get user balances
  http.get(`${API_BASE}/entities/:entityId/balances`, () => {
    return HttpResponse.json(mockBalances);
  }),

  // ==================== BACKOFFICE HANDLERS ====================

  // Get pending users
  http.get(`${API_BASE}/admin/users/pending`, () => {
    return HttpResponse.json([
      {
        id: 'pending-user-1',
        email: 'pending@example.com',
        first_name: 'Pending',
        last_name: 'User',
        entity_name: 'Test Entity',
        status: 'pending_review',
        created_at: '2026-01-25T10:00:00Z',
      },
    ]);
  }),

  // Approve user
  http.post(`${API_BASE}/admin/users/:userId/approve`, ({ params }) => {
    const { userId } = params;
    return HttpResponse.json({
      id: userId,
      status: 'approved',
    });
  }),

  // Reject user
  http.post(`${API_BASE}/admin/users/:userId/reject`, async ({ params, request }) => {
    const { userId } = params;
    const body = await request.json() as { reason: string };

    return HttpResponse.json({
      id: userId,
      status: 'rejected',
      rejection_reason: body.reason,
    });
  }),

  // Get KYC documents
  http.get(`${API_BASE}/admin/kyc/documents`, () => {
    return HttpResponse.json([
      {
        id: 'doc-1',
        user_id: 'user-1',
        document_type: 'id_card',
        filename: 'id_card.pdf',
        status: 'pending_review',
        uploaded_at: '2026-01-25T10:00:00Z',
      },
    ]);
  }),

  // Review document
  http.post(`${API_BASE}/admin/kyc/documents/:docId/review`, async ({ params, request }) => {
    const { docId } = params;
    const body = await request.json() as {
      status: 'approved' | 'rejected';
      notes?: string;
    };

    return HttpResponse.json({
      id: docId,
      status: body.status,
      review_notes: body.notes,
    });
  }),

  // Get deposits
  http.get(`${API_BASE}/admin/deposits`, () => {
    return HttpResponse.json([
      {
        id: 'deposit-1',
        entity_id: 'entity-1',
        amount: 10000.00,
        currency: 'EUR',
        status: 'pending',
        created_at: '2026-01-25T10:00:00Z',
      },
    ]);
  }),

  // Confirm deposit
  http.post(`${API_BASE}/admin/deposits/:depositId/confirm`, async ({ params, request }) => {
    const { depositId } = params;
    const body = await request.json() as { amount: number };

    return HttpResponse.json({
      id: depositId,
      confirmed_amount: body.amount,
      status: 'confirmed',
    });
  }),

  // Reject deposit
  http.post(`${API_BASE}/admin/deposits/:depositId/reject`, ({ params }) => {
    const { depositId } = params;
    return HttpResponse.json({
      id: depositId,
      status: 'rejected',
    });
  }),

  // Add asset to entity
  http.post(`${API_BASE}/admin/entities/:entityId/assets`, async ({ params, request }) => {
    const { entityId } = params;
    const body = await request.json() as {
      asset_type: 'EUR' | 'CEA' | 'EUA';
      amount: number;
    };

    return HttpResponse.json({
      entity_id: entityId,
      asset_type: body.asset_type,
      new_balance: mockBalances[body.asset_type] + body.amount,
    });
  }),

  // Get entity assets
  http.get(`${API_BASE}/admin/entities/:entityId/assets`, () => {
    return HttpResponse.json(mockBalances);
  }),

  // Get entity orders
  http.get(`${API_BASE}/admin/entities/:entityId/orders`, () => {
    return HttpResponse.json([
      {
        id: 'order-1',
        certificate_type: 'CEA',
        side: 'BID',
        price: 99.50,
        quantity: 100,
        status: 'OPEN',
      },
    ]);
  }),

  // Admin cancel order
  http.delete(`${API_BASE}/admin/orders/:orderId`, ({ params }) => {
    const { orderId } = params;
    return HttpResponse.json({
      id: orderId,
      status: 'CANCELLED',
    });
  }),

  // Get contact requests (paginated; shape matches ContactRequestResponse)
  http.get(`${API_BASE}/admin/contact-requests`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'contact-1',
          entity_name: 'New Company',
          contact_email: 'newuser@example.com',
          contact_name: 'Jane Doe',
          position: 'Sustainability Director',
          request_type: 'join',
          status: 'new',
          created_at: '2026-01-25T10:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        per_page: 20,
        total: 1,
        total_pages: 1,
      },
    });
  }),

  // Create user from contact request
  http.post(`${API_BASE}/admin/contact-requests/:requestId/create-user`, ({ params }) => {
    const { requestId } = params;
    return HttpResponse.json({
      request_id: requestId,
      user: {
        id: 'new-user-1',
        email: 'newuser@example.com',
        status: 'invited',
      },
    });
  }),

  // ==================== SETTLEMENT HANDLERS ====================

  // Get pending settlements
  http.get(`${API_BASE}/settlement/pending`, () => {
    return HttpResponse.json([
      {
        id: 'settlement-1',
        batch_id: 'BATCH-2026-001',
        status: 'PENDING',
        total_trades: 5,
        total_volume: 500,
        created_at: '2026-01-25T16:00:00Z',
        expected_settlement: '2026-01-28T16:00:00Z',
      },
    ]);
  }),

  // Get settlement details
  http.get(`${API_BASE}/settlement/:settlementId`, ({ params }) => {
    const { settlementId } = params;

    return HttpResponse.json({
      id: settlementId,
      batch_id: 'BATCH-2026-001',
      status: 'IN_TRANSIT',
      timeline: [
        { status: 'PENDING', timestamp: '2026-01-25T16:00:00Z' },
        { status: 'TRANSFER_INITIATED', timestamp: '2026-01-26T09:00:00Z' },
        { status: 'IN_TRANSIT', timestamp: '2026-01-26T14:00:00Z' },
      ],
      trades: [
        {
          id: 'trade-1',
          buyer_entity_id: 'entity-1',
          seller_entity_id: 'entity-2',
          quantity: 100,
          price: 99.50,
        },
      ],
      expected_settlement: '2026-01-28T16:00:00Z',
    });
  }),
];

export { mockUser, mockAdminUser, mockTokens, mockOrderBook, mockBalances };
