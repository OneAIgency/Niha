import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import type { OrderBookLevel } from '../../types';

interface OrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  onPriceClick?: (price: number) => void;
  maxRows?: number;
}

export function OrderBook({
  bids,
  asks,
  spread,
  bestBid,
  onPriceClick,
  maxRows = 10,
}: OrderBookProps) {
  // Get max cumulative quantity for depth bar scaling
  const maxBidCumulative = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative_quantity)) : 1;
  const maxAskCumulative = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative_quantity)) : 1;
  const maxCumulative = Math.max(maxBidCumulative, maxAskCumulative);

  // Reverse asks so lowest price is at bottom (closest to spread)
  const displayAsks = [...asks].slice(0, maxRows).reverse();
  const displayBids = bids.slice(0, maxRows);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white">Order Book</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 text-xs text-navy-500 dark:text-navy-400 px-4 py-2 border-b border-navy-100 dark:border-navy-700/50">
        <span>Price (USD)</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - Red */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {displayAsks.map((ask, idx) => (
            <motion.div
              key={`ask-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative grid grid-cols-3 text-sm px-4 py-1.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={() => onPriceClick?.(ask.price)}
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-500/10 dark:bg-red-500/20"
                style={{ width: `${(ask.cumulative_quantity / maxCumulative) * 100}%` }}
              />
              <span className="relative text-red-600 dark:text-red-400 font-mono">
                {formatNumber(ask.price)}
              </span>
              <span className="relative text-right text-navy-700 dark:text-navy-300 font-mono">
                {formatNumber(ask.quantity, 0)}
              </span>
              <span className="relative text-right text-navy-500 dark:text-navy-400 font-mono">
                {formatNumber(ask.cumulative_quantity, 0)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Spread Indicator */}
        <div className="px-4 py-2 bg-navy-50 dark:bg-navy-800/50 border-y border-navy-100 dark:border-navy-700/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-navy-500 dark:text-navy-400">Spread</span>
            <span className="font-mono font-semibold text-navy-700 dark:text-navy-300">
              {spread !== null ? `$${formatNumber(spread, 4)}` : '-'}
            </span>
            {spread !== null && bestBid !== null && (
              <span className="text-navy-400 dark:text-navy-500 text-xs">
                ({((spread / bestBid) * 100).toFixed(3)}%)
              </span>
            )}
          </div>
        </div>

        {/* Bids (Buys) - Green */}
        <div className="relative">
          {displayBids.map((bid, idx) => (
            <motion.div
              key={`bid-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative grid grid-cols-3 text-sm px-4 py-1.5 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
              onClick={() => onPriceClick?.(bid.price)}
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20"
                style={{ width: `${(bid.cumulative_quantity / maxCumulative) * 100}%` }}
              />
              <span className="relative text-emerald-600 dark:text-emerald-400 font-mono">
                {formatNumber(bid.price)}
              </span>
              <span className="relative text-right text-navy-700 dark:text-navy-300 font-mono">
                {formatNumber(bid.quantity, 0)}
              </span>
              <span className="relative text-right text-navy-500 dark:text-navy-400 font-mono">
                {formatNumber(bid.cumulative_quantity, 0)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
