import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Card } from '../common/Card';
import { getAdminOrderBook } from '../../services/api';
import type { OrderBookLevel, CertificateType } from '../../types';

interface AdminOrderBookSectionProps {
  certificateType: CertificateType;
}

interface OrderBookData {
  certificate_type: CertificateType;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  best_bid: number | null;
  best_ask: number | null;
}

export function AdminOrderBookSection({ certificateType }: AdminOrderBookSectionProps) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderBook = useCallback(async () => {
    try {
      const { data } = await getAdminOrderBook(certificateType);
      setOrderBook(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch order book:', err);
      setError(err.response?.data?.detail || 'Failed to load order book');
    } finally {
      setLoading(false);
    }
  }, [certificateType]);

  useEffect(() => {
    setLoading(true);
    fetchOrderBook();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Get max cumulative quantity for depth bar scaling
  const maxBidCumulative = orderBook?.bids.length
    ? Math.max(...orderBook.bids.map(b => b.cumulative_quantity))
    : 1;
  const maxAskCumulative = orderBook?.asks.length
    ? Math.max(...orderBook.asks.map(a => a.cumulative_quantity))
    : 1;
  const maxCumulative = Math.max(maxBidCumulative, maxAskCumulative);

  // Reverse asks so lowest price is at bottom (closest to spread)
  const displayAsks = orderBook ? [...orderBook.asks].slice(0, 10).reverse() : [];
  const displayBids = orderBook ? orderBook.bids.slice(0, 10) : [];

  if (loading && !orderBook) {
    return (
      <Card className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchOrderBook}
            className="text-emerald-600 hover:text-emerald-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700 flex items-center justify-between">
        <h3 className="font-semibold text-navy-900 dark:text-white">Order Book</h3>
        <RefreshCw
          className={`w-4 h-4 text-navy-400 ${loading ? 'animate-spin' : ''}`}
        />
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 text-xs text-navy-500 dark:text-navy-400 px-4 py-2 border-b border-navy-100 dark:border-navy-700/50">
        <span>Price (EUR)</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - Red */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {displayAsks.length === 0 ? (
            <div className="px-4 py-2 text-sm text-navy-400 text-center">No sell orders</div>
          ) : (
            displayAsks.map((ask, idx) => (
              <motion.div
                key={`ask-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative grid grid-cols-3 text-sm px-4 py-1.5"
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
            ))
          )}
        </div>

        {/* Spread Indicator */}
        <div className="px-4 py-2 bg-navy-50 dark:bg-navy-800/50 border-y border-navy-100 dark:border-navy-700/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-navy-500 dark:text-navy-400">Spread</span>
            <span className="font-mono font-semibold text-navy-700 dark:text-navy-300">
              {orderBook?.spread !== null ? `€${formatNumber(orderBook.spread, 4)}` : '-'}
            </span>
            {orderBook?.spread !== null && orderBook?.best_bid !== null && (
              <span className="text-navy-400 dark:text-navy-500 text-xs">
                ({((orderBook.spread / orderBook.best_bid) * 100).toFixed(3)}%)
              </span>
            )}
          </div>
        </div>

        {/* Bids (Buys) - Green */}
        <div className="relative">
          {displayBids.length === 0 ? (
            <div className="px-4 py-2 text-sm text-navy-400 text-center">No buy orders</div>
          ) : (
            displayBids.map((bid, idx) => (
              <motion.div
                key={`bid-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative grid grid-cols-3 text-sm px-4 py-1.5"
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
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
