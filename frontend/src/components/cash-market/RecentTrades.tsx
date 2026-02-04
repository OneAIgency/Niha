import { TrendingUp } from 'lucide-react';
import type { OrderBook } from '../../types';

interface RecentTradesProps {
  orderBook: OrderBook | null;
}

export function RecentTrades({ orderBook }: RecentTradesProps) {
  // Mock recent trades based on best prices
  const trades = orderBook ? [
    { price: orderBook.lastPrice || 9.7, volume: 4348, value: 42176, time: new Date() },
    { price: orderBook.lastPrice || 9.7, volume: 21973, value: 213138, time: new Date(Date.now() - 60000) },
    { price: (orderBook.lastPrice || 9.7) - 0.1, volume: 34918, value: 338705, time: new Date(Date.now() - 300000) },
  ] : [];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="content_wrapper_last">
      <div className="px-4 py-3 border-b border-navy-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Recent Trades
        </h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-navy-500 border-b border-navy-700">
        <div>Price</div>
        <div className="text-right">Volume</div>
        <div className="text-right">Value</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trades */}
      <div className="max-h-64 overflow-y-auto">
        {trades.map((trade, idx) => (
          <div
            key={idx}
            className="grid grid-cols-4 gap-2 px-4 py-2 text-xs hover:bg-navy-700/50"
          >
            <div className="text-emerald-400 font-mono">{trade.price.toFixed(1)}</div>
            <div className="text-right text-white font-mono">
              {trade.volume.toLocaleString()}
            </div>
            <div className="text-right text-navy-300 font-mono">
              {trade.value.toLocaleString()}
            </div>
            <div className="text-right text-navy-400">
              {formatTime(trade.time)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
