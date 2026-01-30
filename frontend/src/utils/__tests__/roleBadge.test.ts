/**
 * Tests for roleBadge utilities (client status / user_role).
 */

import { describe, it, expect } from 'vitest';
import { clientStatusVariant } from '../roleBadge';

describe('clientStatusVariant', () => {
  it('returns default for undefined role', () => {
    expect(clientStatusVariant(undefined)).toBe('default');
  });

  it('returns default for empty string role', () => {
    expect(clientStatusVariant('')).toBe('default');
  });

  it('returns warning for FUNDING', () => {
    expect(clientStatusVariant('FUNDING')).toBe('warning');
  });

  it('returns info for APPROVED, AML and MM', () => {
    expect(clientStatusVariant('APPROVED')).toBe('info');
    expect(clientStatusVariant('AML')).toBe('info');
    expect(clientStatusVariant('MM')).toBe('info');
  });

  it('returns warning for KYC and NDA', () => {
    expect(clientStatusVariant('KYC')).toBe('warning');
    expect(clientStatusVariant('NDA')).toBe('warning');
  });

  it('returns success for EUA', () => {
    expect(clientStatusVariant('EUA')).toBe('success');
  });

  it('returns default for unknown roles', () => {
    expect(clientStatusVariant('ADMIN')).toBe('default');
    expect(clientStatusVariant('OTHER')).toBe('default');
  });
});
