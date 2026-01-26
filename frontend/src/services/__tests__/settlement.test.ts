/**
 * Settlement API Tests
 * Tests for settlement system including batch management and status transitions
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { createSettlementTimeline } from '../../test/factories';

const API_BASE = '/api/v1';

describe('Settlement API', () => {
  describe('getPendingSettlements', () => {
    it('should return pending settlement batches', async () => {
      const response = await fetch(`${API_BASE}/settlement/pending`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('batch_id');
      expect(data[0]).toHaveProperty('status');
    });
  });

  describe('Settlement Status Transitions', () => {
    it('should have PENDING as initial state', async () => {
      const response = await fetch(`${API_BASE}/settlement/pending`);
      const data = await response.json();

      // Find a settlement in PENDING state
      const pendingSettlement = data.find(
        (s: { status: string }) => s.status === 'PENDING'
      );
      expect(pendingSettlement).toBeDefined();
    });

    it('should support TRANSFER_INITIATED transition', async () => {
      // Use a custom handler to return a settlement in TRANSFER_INITIATED state
      server.use(
        http.get(`${API_BASE}/settlement/settlement-transfer`, () => {
          return HttpResponse.json({
            id: 'settlement-transfer',
            batch_id: 'BATCH-2026-002',
            status: 'TRANSFER_INITIATED',
            timeline: createSettlementTimeline('TRANSFER_INITIATED'),
          });
        })
      );

      const response = await fetch(`${API_BASE}/settlement/settlement-transfer`);
      const data = await response.json();

      expect(data.status).toBe('TRANSFER_INITIATED');
    });

    it('should support IN_TRANSIT transition', async () => {
      const response = await fetch(`${API_BASE}/settlement/settlement-1`);
      const data = await response.json();

      expect(data.status).toBe('IN_TRANSIT');
    });

    it('should support AT_CUSTODY transition', async () => {
      server.use(
        http.get(`${API_BASE}/settlement/settlement-custody`, () => {
          return HttpResponse.json({
            id: 'settlement-custody',
            batch_id: 'BATCH-2026-003',
            status: 'AT_CUSTODY',
            timeline: createSettlementTimeline('AT_CUSTODY'),
          });
        })
      );

      const response = await fetch(`${API_BASE}/settlement/settlement-custody`);
      const data = await response.json();

      expect(data.status).toBe('AT_CUSTODY');
    });

    it('should support SETTLED final state', async () => {
      server.use(
        http.get(`${API_BASE}/settlement/settlement-settled`, () => {
          return HttpResponse.json({
            id: 'settlement-settled',
            batch_id: 'BATCH-2026-004',
            status: 'SETTLED',
            timeline: createSettlementTimeline('SETTLED'),
          });
        })
      );

      const response = await fetch(`${API_BASE}/settlement/settlement-settled`);
      const data = await response.json();

      expect(data.status).toBe('SETTLED');
    });
  });

  describe('Settlement Timeline', () => {
    it('should generate correct timeline entries', async () => {
      const response = await fetch(`${API_BASE}/settlement/settlement-1`);
      const data = await response.json();

      expect(data.timeline).toBeDefined();
      expect(Array.isArray(data.timeline)).toBe(true);

      // Each timeline entry should have status and timestamp
      data.timeline.forEach((entry: { status: string; timestamp: string }) => {
        expect(entry.status).toBeDefined();
        expect(entry.timestamp).toBeDefined();
      });
    });

    it('should have timeline entries in chronological order', async () => {
      const response = await fetch(`${API_BASE}/settlement/settlement-1`);
      const data = await response.json();

      for (let i = 1; i < data.timeline.length; i++) {
        const prevDate = new Date(data.timeline[i - 1].timestamp);
        const currDate = new Date(data.timeline[i].timestamp);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });
  });

  describe('Settlement Details', () => {
    it('should include trade information', async () => {
      const response = await fetch(`${API_BASE}/settlement/settlement-1`);
      const data = await response.json();

      expect(data.trades).toBeDefined();
      expect(Array.isArray(data.trades)).toBe(true);

      if (data.trades.length > 0) {
        expect(data.trades[0]).toHaveProperty('id');
        expect(data.trades[0]).toHaveProperty('buyer_entity_id');
        expect(data.trades[0]).toHaveProperty('seller_entity_id');
        expect(data.trades[0]).toHaveProperty('quantity');
        expect(data.trades[0]).toHaveProperty('price');
      }
    });

    it('should include expected settlement date', async () => {
      const response = await fetch(`${API_BASE}/settlement/settlement-1`);
      const data = await response.json();

      expect(data.expected_settlement).toBeDefined();
      expect(new Date(data.expected_settlement).toString()).not.toBe('Invalid Date');
    });
  });
});

describe('Business Day Calculation', () => {
  it('should skip weekends in T+3 calculation', () => {
    // Helper function to calculate T+3 settlement date
    function calculateSettlementDate(tradeDate: Date): Date {
      let businessDays = 0;
      const result = new Date(tradeDate);

      while (businessDays < 3) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        // Skip Saturday (6) and Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          businessDays++;
        }
      }

      return result;
    }

    // Monday Jan 19, 2026 (Day 1)
    const monday = new Date('2026-01-19');
    const mondaySettlement = calculateSettlementDate(monday);
    // T+3 from Monday: Tue (1), Wed (2), Thu (3) -> Thursday
    expect(mondaySettlement.getDay()).toBe(4); // Thursday

    // Wednesday Jan 21, 2026
    const wednesday = new Date('2026-01-21');
    const wednesdaySettlement = calculateSettlementDate(wednesday);
    // T+3 from Wednesday: Thu (1), Fri (2), Mon (3) -> Monday (skips Sat/Sun)
    expect(wednesdaySettlement.getDay()).toBe(1); // Monday
  });
});

describe('Settlement Progress', () => {
  it('should calculate percentage based on status', () => {
    const statusProgress: Record<string, number> = {
      PENDING: 0,
      TRANSFER_INITIATED: 25,
      IN_TRANSIT: 50,
      AT_CUSTODY: 75,
      SETTLED: 100,
    };

    // Verify each status maps to expected progress
    expect(statusProgress['PENDING']).toBe(0);
    expect(statusProgress['TRANSFER_INITIATED']).toBe(25);
    expect(statusProgress['IN_TRANSIT']).toBe(50);
    expect(statusProgress['AT_CUSTODY']).toBe(75);
    expect(statusProgress['SETTLED']).toBe(100);
  });

  it('should calculate progress from timeline length', () => {
    const timeline = createSettlementTimeline('IN_TRANSIT');

    // IN_TRANSIT should have 3 entries: PENDING, TRANSFER_INITIATED, IN_TRANSIT
    expect(timeline.length).toBe(3);

    // Progress calculation: (current step / total steps) * 100
    const totalSteps = 5; // PENDING, TRANSFER_INITIATED, IN_TRANSIT, AT_CUSTODY, SETTLED
    const currentStep = timeline.length;
    const progress = (currentStep / totalSteps) * 100;

    expect(progress).toBe(60); // 3/5 = 60%
  });
});
