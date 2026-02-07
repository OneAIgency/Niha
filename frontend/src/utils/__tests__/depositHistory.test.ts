/**
 * Tests for buildDepositAndWithdrawalHistory: merge, sort by date desc, cap at 50.
 */

import { describe, it, expect } from 'vitest';
import { buildDepositAndWithdrawalHistory, DEPOSIT_HISTORY_CAP } from '../depositHistory';
import type { DepositHistoryItem } from '../../types';

function wireItem(id: string, createdAt: string, amount = 100): DepositHistoryItem {
  return {
    type: 'wire_deposit',
    id,
    amount,
    currency: 'EUR',
    status: 'confirmed',
    createdAt,
  };
}

function assetItem(
  id: string,
  createdAt: string,
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' = 'DEPOSIT',
  amount = 50
): DepositHistoryItem {
  return {
    type: 'asset_tx',
    id,
    transactionType,
    amount,
    assetType: 'EUR',
    createdAt,
  };
}

describe('buildDepositAndWithdrawalHistory', () => {
  it('merges wire deposits and asset transactions', () => {
    const wire = [wireItem('w1', '2025-01-01T12:00:00Z')];
    const asset = [assetItem('a1', '2025-01-02T12:00:00Z')];
    const result = buildDepositAndWithdrawalHistory(wire, asset);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a1');
    expect(result[1].id).toBe('w1');
  });

  it('sorts by createdAt descending (newest first)', () => {
    const wire = [
      wireItem('w1', '2025-01-01T10:00:00Z'),
      wireItem('w2', '2025-01-03T10:00:00Z'),
    ];
    const asset = [
      assetItem('a1', '2025-01-02T10:00:00Z'),
      assetItem('a2', '2025-01-04T10:00:00Z'),
    ];
    const result = buildDepositAndWithdrawalHistory(wire, asset);
    expect(result.map((r) => r.id)).toEqual(['a2', 'w2', 'a1', 'w1']);
  });

  it('caps result at DEPOSIT_HISTORY_CAP (50)', () => {
    const wire = Array.from({ length: 30 }, (_, i) =>
      wireItem(`w-${i}`, new Date(Date.now() - i * 1000).toISOString())
    );
    const asset = Array.from({ length: 30 }, (_, i) =>
      assetItem(`a-${i}`, new Date(Date.now() - (30 + i) * 1000).toISOString())
    );
    const result = buildDepositAndWithdrawalHistory(wire, asset);
    expect(result).toHaveLength(DEPOSIT_HISTORY_CAP);
    expect(DEPOSIT_HISTORY_CAP).toBe(50);
  });

  it('handles empty wire list', () => {
    const asset = [assetItem('a1', '2025-01-01T12:00:00Z')];
    const result = buildDepositAndWithdrawalHistory([], asset);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('asset_tx');
  });

  it('handles empty asset list', () => {
    const wire = [wireItem('w1', '2025-01-01T12:00:00Z')];
    const result = buildDepositAndWithdrawalHistory(wire, []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('wire_deposit');
  });

  it('handles both lists empty', () => {
    const result = buildDepositAndWithdrawalHistory([], []);
    expect(result).toHaveLength(0);
  });
});
