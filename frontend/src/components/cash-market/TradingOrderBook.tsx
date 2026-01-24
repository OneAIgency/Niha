import { useMemo, KeyboardEvent } from 'react';
import { Card } from '../common/Card';
import type { OrderBookLevel } from '../../types';
import { DepthChart } from './DepthChart';

/**
 * Props for the TradingOrderBook component
 */
interface TradingOrderBookProps {
  /** Array of bid order levels */
  bids: OrderBookLevel[];
  /** Array of ask order levels */
  asks: OrderBookLevel[];
  /** Current spread between best bid and ask */
  spread: number | null;
  /** Best bid price */
  bestBid: number | null;
  /** Best ask price */
  bestAsk: number | null;
  /** Whether the order book is currently loading */
  isLoading?: boolean;
  /** Callback function invoked when a price level is clicked */
  onPriceClick?: (price: number) => void;
}

/**
 * Validates and filters order book levels to ensure data integrity.
 * Checks that all required fields are present, positive, and finite.
 * 
 * @param level - The order book level to validate
 * @returns true if the level is valid, false otherwise
 */
const validateOrderBookLevel = (level: OrderBookLevel | null | undefined): boolean => {
  return !!(
    level &&
    typeof level.price === 'number' &&
    typeof level.quantity === 'number' &&
    typeof level.cumulative_quantity === 'number' &&
    typeof level.order_count === 'number' &&
    level.price > 0 &&
    level.quantity > 0 &&
    level.cumulative_quantity >= 0 &&
    level.order_count >= 0 &&
    isFinite(level.price) &&
    isFinite(level.quantity) &&
    isFinite(level.cumulative_quantity) &&
    isFinite(level.order_count)
  );
};

/**
 * TradingOrderBook Component
 * 
 * Displays a comprehensive order book with bid and ask levels, including:
 * - Total Value (EUR) and Total Volume columns
 * - Individual order Value (EUR) and Volume
 * - Price levels with best bid/ask highlighting
 * - Cumulative values for depth analysis
 * - Totals summary showing total liquidity
 * - Integrated depth chart visualization
 * 
 * Features:
 * - Monospace font for all numeric values for better readability
 * - Keyboard navigation support (Enter/Space to select price)
 * - Accessible with ARIA labels and semantic HTML
 * - Responsive grid layout
 * - Loading and empty states
 * - Dark mode support
 * 
 * @param props - Component props
 * @returns The rendered TradingOrderBook component
 * 
 * @example
 * ```tsx
 * <TradingOrderBook
 *   bids={orderBook.bids}
 *   asks={orderBook.asks}
 *   spread={orderBook.spread}
 *   bestBid={orderBook.best_bid}
 *   bestAsk={orderBook.best_ask}
 *   isLoading={false}
 *   onPriceClick={(price) => setSelectedPrice(price)}
 * />
 * ```
 */
export function TradingOrderBook({ 
  bids, 
  asks, 
  spread, 
  bestBid, 
  bestAsk,
  isLoading = false,
  onPriceClick,
}: TradingOrderBookProps) {
  // Validate and filter data
  const safeBids = useMemo(() => {
    return bids.filter(validateOrderBookLevel);
  }, [bids]);

  const safeAsks = useMemo(() => {
    return asks.filter(validateOrderBookLevel);
  }, [asks]);

  // Calculate liquidity totals for bid and ask sections
  const bidLiquidity = useMemo(() => {
    const totalVolume = safeBids.reduce((sum, level) => sum + level.quantity, 0);
    const totalValue = safeBids.reduce((sum, level) => sum + (level.quantity * level.price), 0);
    return { volume: Math.round(totalVolume), value: totalValue };
  }, [safeBids]);

  const askLiquidity = useMemo(() => {
    const totalVolume = safeAsks.reduce((sum, level) => sum + level.quantity, 0);
    const totalValue = safeAsks.reduce((sum, level) => sum + (level.quantity * level.price), 0);
    return { volume: Math.round(totalVolume), value: totalValue };
  }, [safeAsks]);

  // Calculate cumulative EUR values for bids
  const bidsWithCumulativeValues = useMemo(() => {
    let cumulativeValue = 0;
    return safeBids.map((level) => {
      const orderValue = level.quantity * level.price;
      cumulativeValue += orderValue;
      return {
        ...level,
        orderValue,
        cumulativeValue,
      };
    });
  }, [safeBids]);

  // Calculate cumulative EUR values for asks
  const asksWithCumulativeValues = useMemo(() => {
    let cumulativeValue = 0;
    return safeAsks.map((level) => {
      const orderValue = level.quantity * level.price;
      cumulativeValue += orderValue;
      return {
        ...level,
        orderValue,
        cumulativeValue,
      };
    });
  }, [safeAsks]);

  /**
   * Formats a number without currency symbol.
   * Uses locale-specific formatting with appropriate decimal places.
   * 
   * @param num - The number to format
   * @returns Formatted string (e.g., "1,234.567" or "5,000")
   */
  const formatNumber = (num: number) => {
    if (!isFinite(num) || num < 0) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: num >= 1000 ? 0 : 3,
    });
  };

  /**
   * Formats a price with exactly 3 decimal places.
   * 
   * @param price - The price to format
   * @returns Formatted price string (e.g., "81.500")
   */
  const formatPrice = (price: number) => {
    if (!isFinite(price) || price <= 0) return '0.000';
    return price.toFixed(3);
  };

  /**
   * Formats a EUR currency value with exactly 2 decimal places.
   * 
   * @param value - The EUR value to format
   * @returns Formatted EUR string (e.g., "1,234.56")
   */
  const formatEurValue = (value: number) => {
    if (!isFinite(value) || value < 0) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Take top 5 levels for each side (merged layout)
  const displayBids = bidsWithCumulativeValues.slice(0, 5);
  const displayAsks = asksWithCumulativeValues.slice(0, 5);

  // Extract best bid/ask for center row
  const bestBidData = displayBids[0] || null;
  const bestAskData = displayAsks[0] || null;

  /**
   * Checks if a price matches the best bid price.
   * Uses relative epsilon comparison for floating-point precision across different price ranges.
   * 
   * @param price - The price to check
   * @returns true if the price matches the best bid, false otherwise
   */
  const isBestBid = (price: number): boolean => {
    if (bestBid === null || !isFinite(price) || !isFinite(bestBid)) return false;
    // Use relative epsilon for better precision across different price ranges
    const epsilon = Math.max(Math.abs(bestBid) * 1e-10, 1e-6);
    return Math.abs(price - bestBid) < epsilon;
  };

  /**
   * Checks if a price matches the best ask price.
   * Uses relative epsilon comparison for floating-point precision across different price ranges.
   * 
   * @param price - The price to check
   * @returns true if the price matches the best ask, false otherwise
   */
  const isBestAsk = (price: number): boolean => {
    if (bestAsk === null || !isFinite(price) || !isFinite(bestAsk)) return false;
    // Use relative epsilon for better precision across different price ranges
    const epsilon = Math.max(Math.abs(bestAsk) * 1e-10, 1e-6);
    return Math.abs(price - bestAsk) < epsilon;
  };

  /**
   * Handles keyboard navigation for order book rows.
   * Allows users to select a price level using Enter or Space key.
   * 
   * @param event - Keyboard event
   * @param price - The price associated with the row
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, price: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPriceClick?.(price);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col" padding="none">
        <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white tracking-tight">
            Order book
          </h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-navy-500 dark:text-navy-400">Loading order book...</div>
        </div>
      </Card>
    );
  }

  // Empty state
  if (displayBids.length === 0 && displayAsks.length === 0) {
    return (
      <Card className="h-full flex flex-col" padding="none">
        <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white tracking-tight">
            Order book
          </h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-navy-500 dark:text-navy-400">No orders available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col rounded-3xl" padding="none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h2 className="text-lg font-semibold text-navy-900 dark:text-white tracking-tight">
          Order book
        </h2>
      </div>

      {/* Order Book Table */}
      <div className="px-4 py-4">
        {/* Column Headers - Single row for merged layout */}
        <div className="grid grid-cols-3 gap-4 pb-2 mb-2 border-b border-navy-200 dark:border-navy-700">
          <div className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider text-left">
            Price
          </div>
          <div className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider text-right">
            Volume
          </div>
          <div className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider text-right">
            Total (EUR)
          </div>
        </div>

        {/* Orders Container - Single column merged layout */}
        <div className="space-y-0">
          {/* Ask Orders (rendered first - at top) */}
          {displayAsks.map((level, idx) => (
              <div
                key={`ask-${level.price}-${idx}`}
                role="row"
                tabIndex={0}
                aria-label={`Ask order at price ${formatPrice(level.price)}, quantity ${formatNumber(level.quantity)}, total value ${formatEurValue(level.orderValue)} EUR`}
                className="grid grid-cols-5 gap-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                onClick={() => onPriceClick?.(level.price)}
                onKeyDown={(e) => handleKeyDown(e, level.price)}
              >
                <div className={`text-xs text-left font-mono tabular-nums ${
                  isBestAsk(level.price)
                    ? 'text-red-700 dark:text-red-300 font-bold text-sm'
                    : 'text-red-600 dark:text-red-400 font-semibold'
                }`}>
                  {formatPrice(level.price)}
                </div>
                <div className="text-xs text-navy-900 dark:text-white font-mono font-medium text-right tabular-nums">
                  {formatNumber(level.quantity)}
                </div>
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatEurValue(level.orderValue)}
                </div>
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatNumber(level.cumulative_quantity)}
                </div>
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatEurValue(level.cumulativeValue)}
                </div>
              </div>
            ))}

          {/* Center Highlight Row - Best Bid and Best Ask */}
          <div
            className="grid grid-cols-3 gap-4 py-3 px-4 my-2 bg-gradient-to-r from-emerald-50 via-navy-50 to-red-50 dark:from-emerald-900/20 dark:via-navy-800 dark:to-red-900/20 border-y-2 border-navy-300 dark:border-navy-600"
            role="status"
            aria-label={`Best bid ${bestBidData ? formatPrice(bestBidData.price) : 'none'}, best ask ${bestAskData ? formatPrice(bestAskData.price) : 'none'}, spread ${spread !== null && isFinite(spread) ? formatPrice(spread) : 'none'}`}
          >
            {/* Left: Best Bid */}
            <div className="flex flex-col items-start">
              {bestBidData ? (
                <>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    BID
                  </span>
                  <span className="text-base text-emerald-700 dark:text-emerald-300 font-bold font-mono tabular-nums">
                    {formatPrice(bestBidData.price)}
                  </span>
                </>
              ) : (
                <span className="text-base text-navy-500 dark:text-navy-400 font-bold">
                  --
                </span>
              )}
            </div>

            {/* Center: Spread */}
            <div className="flex items-center justify-center">
              {spread !== null && isFinite(spread) ? (
                <div className="bg-white dark:bg-navy-700 rounded-full px-3 py-1 border border-navy-200 dark:border-navy-600">
                  <span className="text-xs text-navy-600 dark:text-navy-400 font-medium tabular-nums">
                    Spread: {formatPrice(spread)}
                  </span>
                </div>
              ) : (
                <div className="bg-white dark:bg-navy-700 rounded-full px-3 py-1 border border-dashed border-navy-300 dark:border-navy-600">
                  <span className="text-xs text-navy-500 dark:text-navy-400 font-medium">
                    No Spread
                  </span>
                </div>
              )}
            </div>

            {/* Right: Best Ask */}
            <div className="flex flex-col items-end">
              {bestAskData ? (
                <>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                    ASK
                  </span>
                  <span className="text-base text-red-700 dark:text-red-300 font-bold font-mono tabular-nums">
                    {formatPrice(bestAskData.price)}
                  </span>
                </>
              ) : (
                <span className="text-base text-navy-500 dark:text-navy-400 font-bold">
                  --
                </span>
              )}
            </div>
          </div>

          {/* Bid Orders (rendered second - at bottom) */}
          {displayBids.map((level, idx) => (
              <div
                key={`bid-${level.price}-${idx}`}
                role="row"
                tabIndex={0}
                aria-label={`Bid order at price ${formatPrice(level.price)}, quantity ${formatNumber(level.quantity)}, total value ${formatEurValue(level.orderValue)} EUR`}
                className="grid grid-cols-5 gap-2 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                onClick={() => onPriceClick?.(level.price)}
                onKeyDown={(e) => handleKeyDown(e, level.price)}
              >
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatEurValue(level.cumulativeValue)}
                </div>
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatNumber(level.cumulative_quantity)}
                </div>
                <div className="text-xs text-navy-700 dark:text-navy-300 font-mono font-medium text-right tabular-nums">
                  {formatEurValue(level.orderValue)}
                </div>
                <div className="text-xs text-navy-900 dark:text-white font-mono font-medium text-right tabular-nums">
                  {formatNumber(level.quantity)}
                </div>
                <div className={`text-xs text-right font-mono tabular-nums ${
                  isBestBid(level.price)
                    ? 'text-emerald-700 dark:text-emerald-300 font-bold text-sm'
                    : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                }`}>
                  {formatPrice(level.price)}
                </div>
              </div>
            ))}
        </div>

        {/* Totals Row - Below orders container */}
        {/* Show totals if either side has data, handling partial data scenarios gracefully */}
        {(displayBids.length > 0 || displayAsks.length > 0) && (
          <div className="mt-4 pt-3 border-t border-navy-200 dark:border-navy-700">
            <div className="grid grid-cols-2 gap-8">
              {/* Bid Totals */}
              {displayBids.length > 0 ? (
                <div className="flex items-center justify-between gap-4 border-r border-navy-200 dark:border-navy-700 pr-4">
                  <div className="text-sm font-mono font-bold text-navy-900 dark:text-white tabular-nums">
                    {formatEurValue(bidLiquidity.value)} EUR
                  </div>
                  <div className="text-sm font-mono font-bold text-navy-900 dark:text-white tabular-nums">
                    {formatNumber(bidLiquidity.volume)} cert.
                  </div>
                </div>
              ) : (
                <div className="border-r border-navy-200 dark:border-navy-700 pr-4"></div>
              )}

              {/* Ask Totals */}
              {displayAsks.length > 0 ? (
                <div className="flex items-center justify-between gap-4 pl-4">
                  <div className="text-sm font-mono font-bold text-navy-900 dark:text-white tabular-nums">
                    {formatNumber(askLiquidity.volume)} cert.
                  </div>
                  <div className="text-sm font-mono font-bold text-navy-900 dark:text-white tabular-nums">
                    {formatEurValue(askLiquidity.value)} EUR
                  </div>
                </div>
              ) : (
                <div className="pl-4"></div>
              )}
            </div>
          </div>
        )}

        {/* Depth Chart */}
        <div className="mt-8">
          <DepthChart bids={safeBids} asks={safeAsks} />
        </div>
      </div>
    </Card>
  );
}
