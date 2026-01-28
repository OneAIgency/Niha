/**
 * Tests for formatRelativeTime, including null/undefined handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../index';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns em dash for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns em dash for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('—');
  });

  it('formats a recent date string as relative time', () => {
    const fiveMinsAgo = '2026-01-28T11:55:00.000Z';
    expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');
  });

  it('formats a Date instance', () => {
    const fiveMinsAgo = new Date('2026-01-28T11:55:00.000Z');
    expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');
  });
});
