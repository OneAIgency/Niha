import { useMemo } from 'react';
import { OrderBookRow } from './OrderBookRow';
import { OrderBookSpreadIndicator } from './OrderBookSpreadIndicator';
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
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-navy-200 dark:border-navy-700">
        {/* Bids Header */}
        <div className="px-4 py-1.5 border-r border-navy-200 dark:border-navy-700">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-[10px] font-medium text-navy-600 dark:text-navy-400">
            <div className="text-right hidden md:block">Total</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Price (€)</div>
            <div className="text-center">#</div>
          </div>
        </div>

        {/* Asks Header */}
        <div className="px-4 py-1.5 hidden md:block">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-[10px] font-medium text-navy-600 dark:text-navy-400">
            <div className="text-center">#</div>
            <div className="text-left">Price (€)</div>
            <div className="text-left">Quantity</div>
            <div className="text-left hidden md:block">Total</div>
          </div>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Bids (Buy Orders) */}
        <div className="border-r border-navy-200 dark:border-navy-700">
          {orderBook.bids.slice(0, 7).map((level, idx) => (
            <OrderBookRow
              key={`bid-${level.price}-${idx}`}
              level={level}
              side="bid"
              maxQuantity={maxQuantity}
              onPriceClick={onPriceClick}
            />
          ))}
        </div>

        {/* Asks (Sell Orders) */}
        <div className="hidden md:block">
          {orderBook.asks.slice(0, 7).map((level, idx) => (
            <OrderBookRow
              key={`ask-${level.price}-${idx}`}
              level={level}
              side="ask"
              maxQuantity={maxQuantity}
              onPriceClick={onPriceClick}
            />
          ))}
        </div>
      </div>

      {/* Center Spread Line - Professional Trading Platform Style */}
      {orderBook.best_bid !== null && orderBook.best_ask !== null && orderBook.spread !== null && (
        <OrderBookSpreadIndicator
          bestBid={orderBook.best_bid}
          bestAsk={orderBook.best_ask}
          spread={orderBook.spread}
        />
      )}
    </div>
  );
}
