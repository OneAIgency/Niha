/**
 * Tests for API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformKeysToCamelCase, transformKeysToSnakeCase } from '../../utils/dataTransform';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

describe('Data Transformation', () => {
  it('should transform snake_case to camelCase in responses', () => {
    const response = {
      entity_id: '123',
      created_at: '2026-01-26',
      certificate_type: 'CEA',
    };
    const transformed = transformKeysToCamelCase(response);
    expect(transformed).toEqual({
      entityId: '123',
      createdAt: '2026-01-26',
      certificateType: 'CEA',
    });
  });

  it('should transform camelCase to snake_case in requests', () => {
    const request = {
      entityId: '123',
      createdAt: '2026-01-26',
      certificateType: 'CEA',
    };
    const transformed = transformKeysToSnakeCase(request);
    expect(transformed).toEqual({
      entity_id: '123',
      created_at: '2026-01-26',
      certificate_type: 'CEA',
    });
  });
});
