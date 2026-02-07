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

  const bidsSlice = showFullBook ? orderBook.bids : orderBook.bids.slice(0, 7);
  const asksSlice = showFullBook ? orderBook.asks : orderBook.asks.slice(0, 7);
  const lineCount = Math.max(bidsSlice.length, asksSlice.length);

  return (
    <div className="content_wrapper_last p-0 text-xs flex flex-col h-full">
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-navy-200 dark:border-navy-700 flex-shrink-0">
        {/* Bids Header */}
        <div className="px-4 py-1.5 border-r border-navy-200 dark:border-navy-700">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs font-medium text-navy-600 dark:text-navy-400">
            <div className="text-right hidden md:block">Total</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Price (€)</div>
            <div className="text-center">#</div>
          </div>
        </div>

        {/* Asks Header */}
        <div className="px-4 py-1.5 hidden md:block">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs font-medium text-navy-600 dark:text-navy-400">
            <div className="text-center">#</div>
            <div className="text-left">Price (€)</div>
            <div className="text-left">Quantity</div>
            <div className="text-left hidden md:block">Total</div>
          </div>
        </div>
      </div>

      {/* Order Book Content: one horizontal line per row, same background for bid+ask */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={showFullBook ? { height: '100%' } : undefined}
      >
        {Array.from({ length: lineCount }, (_, lineIdx) => {
          const bidLevel = bidsSlice[lineIdx];
          const askLevel = asksSlice[lineIdx];
          const lineBg =
            lineIdx % 2 === 1 ? 'bg-navy-300/20 dark:bg-navy-500/15' : '';
          return (
            <div
              key={lineIdx}
              className={`grid grid-cols-1 md:grid-cols-2 border-b border-navy-100 dark:border-navy-800/50 ${lineBg}`}
            >
              {/* Bid cell */}
              <div className="border-r border-navy-200 dark:border-navy-700 min-h-0">
                {bidLevel ? (
                  <OrderBookRow
                    key={`bid-${bidLevel.price}-${lineIdx}`}
                    level={bidLevel}
                    side="bid"
                    maxQuantity={maxQuantity}
                    onPriceClick={onPriceClick}
                  />
                ) : (
                  <div className="px-4 py-1 min-h-[1.75rem]" aria-hidden="true" />
                )}
              </div>
              {/* Ask cell */}
              <div className="hidden md:block min-h-0">
                {askLevel ? (
                  <OrderBookRow
                    key={`ask-${askLevel.price}-${lineIdx}`}
                    level={askLevel}
                    side="ask"
                    maxQuantity={maxQuantity}
                    onPriceClick={onPriceClick}
                  />
                ) : (
                  <div className="px-4 py-1 min-h-[1.75rem]" aria-hidden="true" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Count Footer - shown when full book is enabled */}
      {showFullBook && (
        <div className="px-4 py-2 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/30 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-navy-500 dark:text-navy-400">
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
