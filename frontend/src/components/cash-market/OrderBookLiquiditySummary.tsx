import { FileText, Euro } from 'lucide-react';
import { Card } from '../common/Card';
import { DepthChart } from './DepthChart';
import type { OrderBookLevel } from '../../types';

interface OrderBookLiquiditySummaryProps {
  /** Pre-calculated bid liquidity */
  bidLiquidity: {
    volume: number;
    value: number;
  };
  /** Pre-calculated ask liquidity */
  askLiquidity: {
    volume: number;
    value: number;
  };
  /** Bid levels for depth chart */
  bids: OrderBookLevel[];
  /** Ask levels for depth chart */
  asks: OrderBookLevel[];
  /** Whether to show depth chart below summary */
  showDepthChart?: boolean;
}

/**
 * Displays order book liquidity summary with optional depth chart.
 * Shows total bid and ask liquidity in a modern, icon-based card format.
 *
 * Features:
 * - Two separate styled cards for bids (emerald) and asks (red)
 * - Icon-based display: FileText icon for certificates, Euro icon for EUR values
 * - Gradient backgrounds with colored borders for visual distinction
 * - Responsive layout: stacks vertically on mobile, horizontal on desktop
 * - Full accessibility support with ARIA labels and semantic HTML
 * - Dark mode support with theme-aware colors
 * - Optional integrated depth chart
 *
 * @example
 * ```tsx
 * <OrderBookLiquiditySummary
 *   bidLiquidity={{ volume: 850000, value: 7505000.00 }}
 *   askLiquidity={{ volume: 4599996, value: 43949961.60 }}
 *   bids={orderBook.bids}
 *   asks={orderBook.asks}
 *   showDepthChart={false}
 * />
 * ```
 */
export function OrderBookLiquiditySummary({
  bidLiquidity,
  askLiquidity,
  bids,
  asks,
  showDepthChart = true,
}: OrderBookLiquiditySummaryProps) {
  /**
   * Formats a number with appropriate decimal places.
   * Numbers >= 1000 are displayed with 0 decimals, smaller numbers with up to 3 decimals.
   * Handles edge cases: non-finite numbers and negative values return '0'.
   */
  const formatNumber = (num: number) => {
    if (!isFinite(num) || num < 0) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: num >= 1000 ? 0 : 3,
    });
  };

  /**
   * Formats EUR values with exactly 2 decimal places.
   * Handles edge cases: non-finite numbers and negative values return '0.00'.
   */
  const formatEurValue = (value: number) => {
    if (!isFinite(value) || value < 0) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const bidVolumeFormatted = formatNumber(bidLiquidity.volume);
  const bidValueFormatted = formatEurValue(bidLiquidity.value);
  const askVolumeFormatted = formatNumber(askLiquidity.volume);
  const askValueFormatted = formatEurValue(askLiquidity.value);

  return (
    <>
      {/* Bid Totals - Modern styled card */}
      <div 
        className="flex-1 flex flex-col gap-3 px-4 py-3 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent rounded-xl border border-emerald-100 dark:border-emerald-900/30"
        aria-label={`Total bids: ${bidVolumeFormatted} certificates, ${bidValueFormatted} euros`}
        role="region"
      >
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">
          TOTAL BIDS
        </span>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2" aria-label={`${bidVolumeFormatted} certificates`}>
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-lg font-mono font-bold text-navy-900 dark:text-white tabular-nums">
              {bidVolumeFormatted}
            </span>
          </div>
          <div className="flex items-center gap-2" aria-label={`${bidValueFormatted} euros`}>
            <Euro className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-base font-mono font-semibold text-navy-700 dark:text-navy-300 tabular-nums">
              {bidValueFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Ask Totals - Modern styled card */}
      <div 
        className="flex-1 flex flex-col gap-3 px-4 py-3 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl border border-red-100 dark:border-red-900/30"
        aria-label={`Total asks: ${askVolumeFormatted} certificates, ${askValueFormatted} euros`}
        role="region"
      >
        <span className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide">
          TOTAL ASKS
        </span>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2" aria-label={`${askVolumeFormatted} certificates`}>
            <FileText className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-lg font-mono font-bold text-navy-900 dark:text-white tabular-nums">
              {askVolumeFormatted}
            </span>
          </div>
          <div className="flex items-center gap-2" aria-label={`${askValueFormatted} euros`}>
            <Euro className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-base font-mono font-semibold text-navy-700 dark:text-navy-300 tabular-nums">
              {askValueFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Depth Chart */}
      {showDepthChart && bids.length > 0 && asks.length > 0 && (
        <Card className="rounded-2xl" padding="none">
          <div className="px-4 pb-3 border-t border-navy-200 dark:border-navy-700 pt-3">
            <DepthChart bids={bids} asks={asks} />
          </div>
        </Card>
      )}
    </>
  );
}
