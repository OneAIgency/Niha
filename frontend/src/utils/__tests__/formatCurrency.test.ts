/**
 * Tests for formatCurrency and related display edge cases.
 * Callers must pass a number; for missing amount, display "—" or N/A instead of formatCurrency(0).
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../index';

describe('formatCurrency', () => {
  it('formats zero as currency', () => {
    expect(formatCurrency(0, 'EUR')).toMatch(/0[,.]00/);
  });

  it('formats positive amount in EUR', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toMatch(/100[,.]00/);
  });

  it('formats negative amount', () => {
    const result = formatCurrency(-50.5, 'EUR');
    expect(result).toMatch(/-?50[,.]50/);
  });

  it('defaults to EUR when currency omitted', () => {
    const result = formatCurrency(1);
    expect(result).toMatch(/1[,.]00/);
  });

  it('uses provided currency', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toMatch(/99[,.]99/);
  });
});
