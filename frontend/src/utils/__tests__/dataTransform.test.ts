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
