import type { DepositHistoryItem } from '../types';

/** Max items in unified deposit & withdrawal history (aligned with backend recent_transactions limit). */
export const DEPOSIT_HISTORY_CAP = 50;

/**
 * Merge wire deposits and asset transactions into a single list sorted by date descending, capped.
 * Used by User Detail (Assets tab) for Deposit & Withdrawal History.
 */
export function buildDepositAndWithdrawalHistory(
  wireItems: DepositHistoryItem[],
  assetItems: DepositHistoryItem[]
): DepositHistoryItem[] {
  return [...wireItems, ...assetItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, DEPOSIT_HISTORY_CAP);
}
