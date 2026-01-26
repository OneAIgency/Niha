/**
 * Backoffice API Tests
 * Tests for admin operations including user management, KYC, and deposits
 */

import { describe, it, expect } from 'vitest';

const API_BASE = '/api/v1';

describe('Backoffice API', () => {
  describe('User Management', () => {
    it('should get pending users list', async () => {
      const response = await fetch(`${API_BASE}/admin/users/pending`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('status');
      expect(data[0].status).toBe('pending_review');
    });

    it('should approve user by ID', async () => {
      const response = await fetch(`${API_BASE}/admin/users/user-1/approve`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('approved');
    });

    it('should reject user with reason', async () => {
      const response = await fetch(`${API_BASE}/admin/users/user-1/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Incomplete documentation' }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('rejected');
      expect(data.rejection_reason).toBe('Incomplete documentation');
    });
  });

  describe('KYC Document Management', () => {
    it('should get KYC documents list', async () => {
      const response = await fetch(`${API_BASE}/admin/kyc/documents`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('document_type');
      expect(data[0]).toHaveProperty('status');
    });

    it('should approve document', async () => {
      const response = await fetch(`${API_BASE}/admin/kyc/documents/doc-1/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('approved');
    });

    it('should reject document with notes', async () => {
      const response = await fetch(`${API_BASE}/admin/kyc/documents/doc-1/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          notes: 'Document is not legible',
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('rejected');
      expect(data.review_notes).toBe('Document is not legible');
    });
  });

  describe('Deposit Management', () => {
    it('should get deposits list', async () => {
      const response = await fetch(`${API_BASE}/admin/deposits`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('amount');
      expect(data[0]).toHaveProperty('status');
    });

    it('should confirm deposit with amount', async () => {
      const response = await fetch(`${API_BASE}/admin/deposits/deposit-1/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10000.0 }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('confirmed');
      expect(data.confirmed_amount).toBe(10000.0);
    });

    it('should reject deposit', async () => {
      const response = await fetch(`${API_BASE}/admin/deposits/deposit-1/reject`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('rejected');
    });
  });

  describe('Asset Management', () => {
    it('should add EUR/CEA/EUA to entity', async () => {
      const assets = ['EUR', 'CEA', 'EUA'];

      for (const assetType of assets) {
        const response = await fetch(`${API_BASE}/admin/entities/entity-1/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_type: assetType, amount: 1000 }),
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.entity_id).toBe('entity-1');
        expect(data.asset_type).toBe(assetType);
        expect(data.new_balance).toBeDefined();
      }
    });

    it('should get entity assets/balances', async () => {
      const response = await fetch(`${API_BASE}/admin/entities/entity-1/assets`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.EUR).toBeDefined();
      expect(data.CEA).toBeDefined();
      expect(data.EUA).toBeDefined();
    });
  });

  describe('Order Management', () => {
    it('should get entity orders', async () => {
      const response = await fetch(`${API_BASE}/admin/entities/entity-1/orders`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('status');
    });

    it('should admin cancel order', async () => {
      const response = await fetch(`${API_BASE}/admin/orders/order-1`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('CANCELLED');
    });
  });

  describe('Contact Request Management', () => {
    it('should get contact requests', async () => {
      const response = await fetch(`${API_BASE}/admin/contact-requests`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('email');
      expect(data[0]).toHaveProperty('company_name');
    });

    it('should create user from contact request', async () => {
      const response = await fetch(
        `${API_BASE}/admin/contact-requests/contact-1/create-user`,
        {
          method: 'POST',
        }
      );

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.status).toBe('invited');
    });
  });
});
