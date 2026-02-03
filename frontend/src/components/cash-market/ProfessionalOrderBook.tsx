import { useMemo } from 'react';
import { OrderBookRow } from './OrderBookRow';
import type { OrderBookLevel } from '../../types';

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

interface ProfessionalOrderBookProps {
  orderBook: OrderBookData;
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
  /** Show all orders with scrolling instead of limiting to 7 rows */
  showFullBook?: boolean;
}

export function ProfessionalOrderBook({ orderBook, onPriceClick, showFullBook = false }: ProfessionalOrderBookProps) {
  const maxQuantity = useMemo(() => {
    const bidMax = orderBook.bids.length > 0 ? Math.max(...orderBook.bids.map((b) => b.cumulativeQuantity)) : 0;
    const askMax = orderBook.asks.length > 0 ? Math.max(...orderBook.asks.map((a) => a.cumulativeQuantity)) : 0;
    return Math.max(bidMax, askMax);
  }, [orderBook]);

  return (
    <div className="content_wrapper_last p-0 text-[11px] flex flex-col h-full">
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-navy-200 dark:border-navy-700 flex-shrink-0">
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
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden">
        {/* Bids (Buy Orders) */}
        <div
          className="border-r border-navy-200 dark:border-navy-700 overflow-y-auto"
          style={showFullBook ? { height: '100%' } : undefined}
        >
          {(showFullBook ? orderBook.bids : orderBook.bids.slice(0, 7)).map((level, idx) => (
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
        <div
          className="hidden md:block overflow-y-auto"
          style={showFullBook ? { height: '100%' } : undefined}
        >
          {(showFullBook ? orderBook.asks : orderBook.asks.slice(0, 7)).map((level, idx) => (
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

      {/* Order Count Footer - shown when full book is enabled */}
      {showFullBook && (
        <div className="px-4 py-2 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/30 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] text-navy-500 dark:text-navy-400">
            <span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{orderBook.bids.length}</span> bid levels
            </span>
            <span>
              <span className="font-semibold text-red-600 dark:text-red-400">{orderBook.asks.length}</span> ask levels
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
