/**
 * Tests for data transformation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  transformKeysToCamelCase,
  transformKeysToSnakeCase,
} from '../dataTransform';

describe('transformKeysToCamelCase', () => {
  it('should transform snake_case to camelCase', () => {
    const input = {
      entity_id: '123',
      created_at: '2026-01-26',
      certificate_type: 'CEA',
    };
    const result = transformKeysToCamelCase(input);
    expect(result).toEqual({
      entityId: '123',
      createdAt: '2026-01-26',
      certificateType: 'CEA',
    });
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        first_name: 'John',
        last_name: 'Doe',
      },
    };
    const result = transformKeysToCamelCase(input);
    expect(result).toEqual({
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    });
  });

  it('should handle arrays', () => {
    const input = [
      { entity_id: '1', name: 'Test' },
      { entity_id: '2', name: 'Test2' },
    ];
    const result = transformKeysToCamelCase(input);
    expect(result).toEqual([
      { entityId: '1', name: 'Test' },
      { entityId: '2', name: 'Test2' },
    ]);
  });

  it('should handle null and undefined', () => {
    expect(transformKeysToCamelCase(null)).toBeNull();
    expect(transformKeysToCamelCase(undefined)).toBeUndefined();
  });

  it('should preserve all-uppercase keys in nested backend responses', () => {
    const input = {
      balances: {
        CEA: { total: 100, available: 50, locked: 50 },
        EUA: { total: 200, available: 100, locked: 100 },
        EUR: { total: 10000, available: 8000, locked: 2000 },
      },
    };
    const result = transformKeysToCamelCase<typeof input>(input);
    expect(result.balances).toHaveProperty('CEA');
    expect(result.balances).toHaveProperty('EUA');
    expect(result.balances).toHaveProperty('EUR');
    expect(result.balances.CEA.total).toBe(100);
  });

  it('should preserve market keys like CEA_BID, CEA_ASK, EUA_SWAP from backend', () => {
    const input = {
      CEA_BID: { enabled: true, target_liquidity: 500000 },
      CEA_ASK: { enabled: true, target_liquidity: 500000 },
      EUA_SWAP: { enabled: false, target_liquidity: 0 },
    };
    const result = transformKeysToCamelCase<Record<string, { enabled: boolean; targetLiquidity: number }>>(input);
    expect(result).toHaveProperty('CEA_BID');
    expect(result).toHaveProperty('CEA_ASK');
    expect(result).toHaveProperty('EUA_SWAP');
    expect(result.CEA_BID.targetLiquidity).toBe(500000);
  });
});

describe('transformKeysToSnakeCase', () => {
  it('should transform camelCase to snake_case', () => {
    const input = {
      entityId: '123',
      createdAt: '2026-01-26',
      certificateType: 'CEA',
    };
    const result = transformKeysToSnakeCase(input);
    expect(result).toEqual({
      entity_id: '123',
      created_at: '2026-01-26',
      certificate_type: 'CEA',
    });
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    const result = transformKeysToSnakeCase(input);
    expect(result).toEqual({
      user: {
        first_name: 'John',
        last_name: 'Doe',
      },
    });
  });

  it('should handle arrays', () => {
    const input = [
      { entityId: '1', name: 'Test' },
      { entityId: '2', name: 'Test2' },
    ];
    const result = transformKeysToSnakeCase(input);
    expect(result).toEqual([
      { entity_id: '1', name: 'Test' },
      { entity_id: '2', name: 'Test2' },
    ]);
  });

  it('should preserve all-uppercase dictionary keys (acronyms)', () => {
    const input = {
      initialBalances: { CEA: 104493207, EUA: 500000 },
      mmType: 'CEA_SELLER',
    };
    const result = transformKeysToSnakeCase(input);
    expect(result).toEqual({
      initial_balances: { CEA: 104493207, EUA: 500000 },
      mm_type: 'CEA_SELLER',
    });
  });

  it('should preserve keys like EUR, UUID, CEA_BUYER', () => {
    const input = { EUR: 100, UUID: 'abc', CEA_BUYER: true };
    const result = transformKeysToSnakeCase(input);
    expect(result).toEqual({ EUR: 100, UUID: 'abc', CEA_BUYER: true });
  });

  it('should normalize contact-request payload (camelCase from API/WS) to snake_case for backoffice', () => {
    const contactRequestCamelCase = {
      id: 'contact-1',
      entityName: 'Acme Corp',
      contactEmail: 'contact@acme.com',
      contactName: 'Jane Doe',
      position: 'Sustainability Director',
      ndaFileName: null,
      submitterIp: '192.168.1.1',
      userRole: 'new',
      notes: null,
      createdAt: '2026-01-29T12:00:00Z',
    };
    const result = transformKeysToSnakeCase(contactRequestCamelCase);
    expect(result).toEqual({
      id: 'contact-1',
      entity_name: 'Acme Corp',
      contact_email: 'contact@acme.com',
      contact_name: 'Jane Doe',
      position: 'Sustainability Director',
      nda_file_name: null,
      submitter_ip: '192.168.1.1',
      user_role: 'new',
      notes: null,
      created_at: '2026-01-29T12:00:00Z',
    });
  });
});
