/**
 * Cash Market API Tests
 * Tests for trading operations including order placement, order book, and balance management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createMockOrder,
  createMockOrderBook,
  createMockBalances,
} from '../../test/factories';

const API_BASE = '/api/v1';

describe('Cash Market API', () => {
  describe('getOrderBook', () => {
    it('should return bids and asks', async () => {
      const response = await fetch(
        `${API_BASE}/cash-market/order-book?certificate_type=CEA`
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.bids).toBeDefined();
      expect(data.asks).toBeDefined();
      expect(Array.isArray(data.bids)).toBe(true);
      expect(Array.isArray(data.asks)).toBe(true);
    });

    it('should return spread and last trade price', async () => {
      const response = await fetch(
        `${API_BASE}/cash-market/order-book?certificate_type=CEA`
      );

      const data = await response.json();
      expect(data.spread).toBeDefined();
      expect(data.last_trade_price).toBeDefined();
    });

    it('should return correct certificate type', async () => {
      const response = await fetch(
        `${API_BASE}/cash-market/order-book?certificate_type=EUA`
      );

      const data = await response.json();
      expect(data.certificate_type).toBe('EUA');
    });
  });

  describe('placeOrder', () => {
    it('should place BID order with valid data', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        price: 99.50,
        quantity: 100,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.side).toBe('BID');
      expect(data.status).toBe('OPEN');
    });

    it('should place ASK order with valid data', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'ASK',
        price: 100.50,
        quantity: 50,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.side).toBe('ASK');
    });

    it('should validate price > 0', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        price: 0,
        quantity: 100,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.detail).toContain('Price');
    });

    it('should validate quantity > 0', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        price: 100,
        quantity: 0,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.detail).toContain('Quantity');
    });
  });

  describe('getMyOrders', () => {
    it("should return user's orders", async () => {
      const response = await fetch(`${API_BASE}/cash-market/orders`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].id).toBeDefined();
      expect(data[0].status).toBeDefined();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order by ID', async () => {
      const response = await fetch(`${API_BASE}/cash-market/orders/order-1`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('CANCELLED');
    });
  });

  describe('previewOrder', () => {
    it('should return fill preview', async () => {
      const preview = {
        certificate_type: 'CEA',
        side: 'BID',
        quantity: 100,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.estimated_fills).toBeDefined();
      expect(data.total_cost).toBeDefined();
      expect(data.average_price).toBeDefined();
    });
  });

  describe('executeMarketOrder', () => {
    it('should execute and return result', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        quantity: 100,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders/market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('FILLED');
      expect(data.filled_quantity).toBe(100);
      expect(data.average_price).toBeDefined();
    });
  });

  describe('getUserBalances', () => {
    it('should return entity balances', async () => {
      const response = await fetch(`${API_BASE}/entities/entity-1/balances`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.EUR).toBeDefined();
      expect(data.CEA).toBeDefined();
      expect(data.EUA).toBeDefined();
    });
  });

  describe('Order Validation', () => {
    it('should reject negative prices', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        price: -10,
        quantity: 100,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(false);
    });

    it('should reject zero quantity', async () => {
      const order = {
        certificate_type: 'CEA',
        side: 'BID',
        price: 100,
        quantity: 0,
      };

      const response = await fetch(`${API_BASE}/cash-market/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('Order Book Sorting', () => {
    it('should have bids sorted descending by price', async () => {
      const response = await fetch(
        `${API_BASE}/cash-market/order-book?certificate_type=CEA`
      );

      const data = await response.json();

      // Verify bids are sorted descending (highest price first)
      for (let i = 1; i < data.bids.length; i++) {
        expect(data.bids[i - 1].price).toBeGreaterThanOrEqual(data.bids[i].price);
      }
    });

    it('should have asks sorted ascending by price', async () => {
      const response = await fetch(
        `${API_BASE}/cash-market/order-book?certificate_type=CEA`
      );

      const data = await response.json();

      // Verify asks are sorted ascending (lowest price first)
      for (let i = 1; i < data.asks.length; i++) {
        expect(data.asks[i - 1].price).toBeLessThanOrEqual(data.asks[i].price);
      }
    });
  });
});

describe('Balance Checks', () => {
  it('BID requires EUR balance', async () => {
    // Verify balance endpoint returns EUR
    const balanceResponse = await fetch(`${API_BASE}/entities/entity-1/balances`);
    const balances = await balanceResponse.json();

    expect(balances.EUR).toBeDefined();
    expect(balances.EUR).toBeGreaterThan(0);
  });

  it('ASK requires certificate balance', async () => {
    // Verify balance endpoint returns certificate balances
    const balanceResponse = await fetch(`${API_BASE}/entities/entity-1/balances`);
    const balances = await balanceResponse.json();

    expect(balances.CEA).toBeDefined();
    expect(balances.CEA).toBeGreaterThan(0);
    expect(balances.EUA).toBeDefined();
    expect(balances.EUA).toBeGreaterThan(0);
  });
});
