import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../common/Card';
import type { CashMarketTrade } from '../../types';

interface RecentTradesProps {
  trades: CashMarketTrade[];
  maxRows?: number;
}

export function RecentTrades({ trades, maxRows = 15 }: RecentTradesProps) {
  const displayTrades = trades.slice(0, maxRows);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Determine price direction compared to previous trade
  const getPriceDirection = (idx: number): 'up' | 'down' | 'neutral' => {
    if (idx >= displayTrades.length - 1) return 'neutral';
    const currentPrice = displayTrades[idx].price;
    const prevPrice = displayTrades[idx + 1].price;
    if (currentPrice > prevPrice) return 'up';
    if (currentPrice < prevPrice) return 'down';
    return 'neutral';
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white">Recent Trades</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 text-xs text-navy-500 dark:text-navy-400 px-4 py-2 border-b border-navy-100 dark:border-navy-700/50">
        <span>Time</span>
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Side</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {displayTrades.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-navy-400 dark:text-navy-500">
            No trades yet
          </div>
        ) : (
          displayTrades.map((trade, idx) => {
            const direction = getPriceDirection(idx);
            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="grid grid-cols-4 text-sm px-4 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800/50"
              >
                <span className="text-navy-500 dark:text-navy-400 text-xs font-mono">
                  {formatTime(trade.executed_at)}
                </span>
                <span className={`font-mono flex items-center gap-1 ${
                  direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                  direction === 'down' ? 'text-red-600 dark:text-red-400' :
                  'text-navy-700 dark:text-navy-300'
                }`}>
                  {direction === 'up' && <ArrowUp className="w-3 h-3" />}
                  {direction === 'down' && <ArrowDown className="w-3 h-3" />}
                  {formatPrice(trade.price)}
                </span>
                <span className="text-right text-navy-700 dark:text-navy-300 font-mono">
                  {formatQuantity(trade.quantity)}
                </span>
                <span className={`text-right text-xs font-semibold ${
                  trade.side === 'BUY'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {trade.side}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}
