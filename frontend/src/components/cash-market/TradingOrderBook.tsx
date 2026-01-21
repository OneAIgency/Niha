import { useMemo } from 'react';
import { ChevronUp } from 'lucide-react';
import type { OrderBookLevel } from '../../types';
import { DepthChart } from './DepthChart';

interface TradingOrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

export function TradingOrderBook({ bids, asks }: TradingOrderBookProps) {
  // Calculate totals for center indicator
  const bidTotals = useMemo(() => {
    const totalOrders = bids.reduce((sum, level) => sum + level.order_count, 0);
    const totalVolume = bids.reduce((sum, level) => sum + level.quantity, 0);
    return { orders: totalOrders, volume: Math.round(totalVolume) };
  }, [bids]);

  const askTotals = useMemo(() => {
    const totalOrders = asks.reduce((sum, level) => sum + level.order_count, 0);
    const totalVolume = asks.reduce((sum, level) => sum + level.quantity, 0);
    return { orders: totalOrders, volume: Math.round(totalVolume) };
  }, [asks]);

  // Calculate cumulative EUR values for bids
  const bidsWithCumulativeValues = useMemo(() => {
    let cumulativeValue = 0;
    return bids.map((level) => {
      const orderValue = level.quantity * level.price;
      cumulativeValue += orderValue;
      return {
        ...level,
        orderValue,
        cumulativeValue,
      };
    });
  }, [bids]);

  // Calculate cumulative EUR values for asks
  const asksWithCumulativeValues = useMemo(() => {
    let cumulativeValue = 0;
    return asks.map((level) => {
      const orderValue = level.quantity * level.price;
      cumulativeValue += orderValue;
      return {
        ...level,
        orderValue,
        cumulativeValue,
      };
    });
  }, [asks]);

  // Format number without currency symbol
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: num >= 1000 ? 0 : 3,
    });
  };

  // Format price with fixed decimals
  const formatPrice = (price: number) => {
    return price.toFixed(3);
  };

  // Format EUR currency value
  const formatEurValue = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Take top 10 levels for display
  const displayBids = bidsWithCumulativeValues.slice(0, 10);
  const displayAsks = asksWithCumulativeValues.slice(0, 10);

  return (
    <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-xl border border-gray-100 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 dark:border-navy-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Order book
        </h2>
      </div>

      {/* Order Book Table */}
      <div className="px-8 py-6">
        {/* Column Headers */}
        <div className="grid grid-cols-2 gap-12 mb-3">
          {/* Bids Headers */}
          <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="text-left">Order</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Value (EUR)</div>
            <div className="text-right">Cum. Qty</div>
            <div className="text-right">Cum. Value (EUR)</div>
            <div className="text-right">Buy</div>
          </div>

          {/* Asks Headers */}
          <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="text-left">Sell</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Value (EUR)</div>
            <div className="text-right">Cum. Qty</div>
            <div className="text-right">Cum. Value (EUR)</div>
            <div className="text-right">Order</div>
          </div>
        </div>

        {/* Order Rows */}
        <div className="grid grid-cols-2 gap-12">
          {/* Bids Column */}
          <div className="space-y-1.5">
            {displayBids.map((level, idx) => (
              <div
                key={`bid-${idx}`}
                className="grid grid-cols-6 gap-4 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors cursor-pointer group"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium tabular-nums">
                  {level.order_count}
                </div>
                <div className="text-sm text-gray-900 dark:text-white font-medium text-right tabular-nums">
                  {formatNumber(level.quantity)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatEurValue(level.orderValue)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatNumber(level.cumulative_quantity)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatEurValue(level.cumulativeValue)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-semibold text-right tabular-nums">
                  {formatPrice(level.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Asks Column */}
          <div className="space-y-1.5">
            {displayAsks.map((level, idx) => (
              <div
                key={`ask-${idx}`}
                className="grid grid-cols-6 gap-4 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer group"
              >
                <div className="text-sm text-red-600 dark:text-red-400 font-semibold tabular-nums">
                  {formatPrice(level.price)}
                </div>
                <div className="text-sm text-gray-900 dark:text-white font-medium text-right tabular-nums">
                  {formatNumber(level.quantity)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatEurValue(level.orderValue)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatNumber(level.cumulative_quantity)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right tabular-nums">
                  {formatEurValue(level.cumulativeValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium text-right tabular-nums">
                  {level.order_count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Spread Indicator */}
        <div className="mt-6 mb-6 relative">
          {/* Divider Lines */}
          <div className="absolute inset-x-0 top-1/2 flex items-center">
            <div className="flex-1 h-1 bg-green-500 dark:bg-green-400 rounded-l-full"></div>
            <div className="flex-1 h-1 bg-red-500 dark:bg-red-400 rounded-r-full"></div>
          </div>

          {/* Center Content */}
          <div className="relative grid grid-cols-2 gap-12 py-4">
            {/* Bid Totals */}
            <div className="flex items-center justify-start gap-3">
              <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {bidTotals.orders}
              </span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                {formatNumber(bidTotals.volume)}
              </span>
            </div>

            {/* Center Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white dark:bg-navy-800 border-4 border-gray-900 dark:border-white rounded-full p-1.5 shadow-lg">
                <ChevronUp className="w-5 h-5 text-gray-900 dark:text-white" strokeWidth={3} />
              </div>
            </div>

            {/* Ask Totals */}
            <div className="flex items-center justify-end gap-3">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                {formatNumber(askTotals.volume)}
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {askTotals.orders}
              </span>
            </div>
          </div>
        </div>

        {/* Depth Chart */}
        <div className="mt-8">
          <DepthChart bids={bids} asks={asks} />
        </div>
      </div>
    </div>
  );
}
