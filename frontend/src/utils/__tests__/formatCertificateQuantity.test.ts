/**
 * Tests for formatCertificateQuantity (CEA/EUA whole numbers only).
 * Output must have no decimal part (maximumFractionDigits: 0).
 */

import { describe, it, expect } from 'vitest';
import { formatCertificateQuantity } from '../index';

describe('formatCertificateQuantity', () => {
  it('formats integer with no decimal part', () => {
    expect(formatCertificateQuantity(1000)).toBe('1,000');
    expect(formatCertificateQuantity(0)).toBe('0');
  });

  it('rounds fractional value and shows no decimals', () => {
    const result = formatCertificateQuantity(100.7);
    expect(result).toBe('101');
    expect(result).not.toMatch(/\.[0-9]/);
  });

  it('handles null and undefined as zero', () => {
    expect(formatCertificateQuantity(null)).toBe('0');
    expect(formatCertificateQuantity(undefined)).toBe('0');
  });

  it('handles NaN as zero', () => {
    expect(formatCertificateQuantity(NaN)).toBe('0');
  });

  it('output never contains decimal point for CEA/EUA', () => {
    [1, 100, 1000, 100.4, 100.9].forEach((value) => {
      const formatted = formatCertificateQuantity(value);
      expect(formatted).not.toMatch(/\.[0-9]/);
    });
  });
});
