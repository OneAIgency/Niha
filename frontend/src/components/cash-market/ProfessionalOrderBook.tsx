import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatQuantity } from '../../utils';
import type { OrderBookLevel } from '../../types';

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  best_bid: number | null;
  best_ask: number | null;
}

interface ProfessionalOrderBookProps {
  orderBook: OrderBookData;
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
}

export function ProfessionalOrderBook({ orderBook, onPriceClick }: ProfessionalOrderBookProps) {
  const maxQuantity = useMemo(() => {
    const bidMax = orderBook.bids.length > 0 ? Math.max(...orderBook.bids.map((b) => b.cumulative_quantity)) : 0;
    const askMax = orderBook.asks.length > 0 ? Math.max(...orderBook.asks.map((a) => a.cumulative_quantity)) : 0;
    return Math.max(bidMax, askMax);
  }, [orderBook]);

  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-700 overflow-hidden text-[11px]">
      {/* Header */}
      <div className="px-4 py-2 border-b border-navy-200 dark:border-navy-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900 dark:text-white">Order Book</h2>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 border-b border-navy-200 dark:border-navy-700">
        {/* Bids Header */}
        <div className="px-4 py-1.5 border-r border-navy-200 dark:border-navy-700">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-navy-600 dark:text-navy-400">
            <div className="text-right">Total</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Price (€)</div>
            <div className="text-center">#</div>
          </div>
        </div>

        {/* Asks Header */}
        <div className="px-4 py-1.5">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-navy-600 dark:text-navy-400">
            <div className="text-center">#</div>
            <div className="text-left">Price (€)</div>
            <div className="text-left">Quantity</div>
            <div className="text-left">Total</div>
          </div>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="grid grid-cols-2">
        {/* Bids (Buy Orders) */}
        <div className="border-r border-navy-200 dark:border-navy-700">
          {orderBook.bids.slice(0, 7).map((level, idx) => {
            const depthPercentage = maxQuantity > 0 ? (level.cumulative_quantity / maxQuantity) * 100 : 0;
            return (
              <div
                key={`bid-${level.price}-${idx}`}
                className="relative px-4 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors group"
                onClick={() => onPriceClick?.(level.price, 'BUY')}
              >
                {/* Depth Visualization */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all"
                  style={{ width: `${depthPercentage}%` }}
                />

                {/* Values */}
                <div className="relative grid grid-cols-4 gap-2">
                  <div className="text-right font-mono text-navy-600 dark:text-navy-400">
                    {formatQuantity(level.cumulative_quantity)}
                  </div>
                  <div className="text-right font-mono text-navy-900 dark:text-white">
                    {formatQuantity(level.quantity)}
                  </div>
                  <div className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="text-center text-[10px] text-navy-500 dark:text-navy-500">
                    {level.order_count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          {orderBook.asks.slice(0, 7).map((level, idx) => {
            const depthPercentage = maxQuantity > 0 ? (level.cumulative_quantity / maxQuantity) * 100 : 0;
            return (
              <div
                key={`ask-${level.price}-${idx}`}
                className="relative px-4 py-1 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors group"
                onClick={() => onPriceClick?.(level.price, 'SELL')}
              >
                {/* Depth Visualization */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-500/10 dark:bg-red-500/20 transition-all"
                  style={{ width: `${depthPercentage}%` }}
                />

                {/* Values */}
                <div className="relative grid grid-cols-4 gap-2">
                  <div className="text-center text-[10px] text-navy-500 dark:text-navy-500">
                    {level.order_count}
                  </div>
                  <div className="text-left font-mono font-semibold text-red-600 dark:text-red-400">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="text-left font-mono text-navy-900 dark:text-white">
                    {formatQuantity(level.quantity)}
                  </div>
                  <div className="text-left font-mono text-navy-600 dark:text-navy-400">
                    {formatQuantity(level.cumulative_quantity)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Spread Line - Professional Trading Platform Style */}
      {orderBook.best_bid !== null && orderBook.best_ask !== null && (
        <div className="border-y-2 border-navy-300 dark:border-navy-600 bg-gradient-to-r from-emerald-50 via-navy-50 to-red-50 dark:from-emerald-900/20 dark:via-navy-800 dark:to-red-900/20">
          <div className="grid grid-cols-2 px-4 py-3">
            {/* Best Bid (Left Side) */}
            <div className="flex items-center justify-start gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Best Bid
                </span>
                <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                  €{orderBook.best_bid.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Best Ask (Right Side) */}
            <div className="flex items-center justify-end gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">
                  Best Ask
                </span>
                <span className="font-mono font-bold text-base text-red-600 dark:text-red-400">
                  €{orderBook.best_ask.toFixed(2)}
                </span>
              </div>
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Spread Info (Centered Below) */}
          <div className="px-4 pb-2 flex justify-center">
            <div className="text-[10px] text-navy-600 dark:text-navy-400">
              <span className="font-medium">Spread: </span>
              <span className="font-mono font-semibold text-navy-900 dark:text-white">
                €{orderBook.spread !== null ? orderBook.spread.toFixed(2) : '-'}
              </span>
              {orderBook.spread !== null && orderBook.best_bid !== null && orderBook.best_ask !== null && (
                <span className="ml-1 text-navy-500 dark:text-navy-500">
                  ({((orderBook.spread / ((orderBook.best_bid + orderBook.best_ask) / 2)) * 100).toFixed(2)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
