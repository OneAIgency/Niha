import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Activity,
  Clock,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Subheader } from '../components/common';
import { useCashMarket } from '../hooks/useCashMarket';
import { cashMarketApi } from '../services/api';
import type {
  OrderBookLevel,
  Order,
  OrderSide,
  CashMarketTrade,
} from '../types';

// =============================================================================
// PROFESSIONAL ORDER BOOK COMPONENT
// =============================================================================

interface ProfessionalOrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  onPriceClick?: (price: number) => void;
}

function ProfessionalOrderBook({
  bids,
  asks,
  spread,
  bestBid,
  bestAsk: _bestAsk,
  onPriceClick,
}: ProfessionalOrderBookProps) {
  const maxCumulative = useMemo(() => {
    const maxBid = Math.max(...bids.map(b => b.cumulative_quantity), 0);
    const maxAsk = Math.max(...asks.map(a => a.cumulative_quantity), 0);
    return Math.max(maxBid, maxAsk);
  }, [bids, asks]);

  const formatPrice = (price: number) => price.toFixed(3);
  const formatQuantity = (qty: number) => qty.toLocaleString();

  return (
    <Card className="h-full flex flex-col" padding="none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700 flex justify-between items-center">
        <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-500" />
          Order Book
        </h3>
        <div className="flex gap-2">
          {['0.001', '0.01', '0.1'].map((precision, i) => (
            <button
              key={precision}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                i === 1
                  ? 'bg-amber-500 text-white'
                  : 'text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700'
              }`}
            >
              {precision}
            </button>
          ))}
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 border-b border-navy-200 dark:border-navy-700">
        {/* Bids Header */}
        <div className="grid grid-cols-4 px-3 py-2 text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wider border-r border-navy-200 dark:border-navy-700">
          <span>Cnt</span>
          <span className="text-right">Total</span>
          <span className="text-right">Size</span>
          <span className="text-right">Bid</span>
        </div>
        {/* Asks Header */}
        <div className="grid grid-cols-4 px-3 py-2 text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wider">
          <span>Ask</span>
          <span>Size</span>
          <span>Total</span>
          <span className="text-right">Cnt</span>
        </div>
      </div>

      {/* Order Book Grid */}
      <div className="grid grid-cols-2 flex-1 overflow-hidden min-h-0">
        {/* Bids */}
        <div className="border-r border-navy-200 dark:border-navy-700 overflow-hidden flex flex-col">
          {bids.map((bid, idx) => {
            const depthPercent = maxCumulative > 0 ? (bid.cumulative_quantity / maxCumulative) * 100 : 0;
            return (
              <div
                key={`bid-${idx}`}
                onClick={() => onPriceClick?.(bid.price)}
                className="grid grid-cols-4 px-3 py-1.5 text-sm font-mono cursor-pointer relative hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
              >
                {/* Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="relative z-10 text-navy-500 dark:text-navy-400">{bid.order_count}</span>
                <span className="relative z-10 text-right text-navy-700 dark:text-navy-300">{formatQuantity(bid.cumulative_quantity)}</span>
                <span className="relative z-10 text-right text-navy-900 dark:text-white">{formatQuantity(bid.quantity)}</span>
                <span className="relative z-10 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(bid.price)}</span>
              </div>
            );
          })}
        </div>

        {/* Asks */}
        <div className="overflow-hidden flex flex-col">
          {asks.map((ask, idx) => {
            const depthPercent = maxCumulative > 0 ? (ask.cumulative_quantity / maxCumulative) * 100 : 0;
            return (
              <div
                key={`ask-${idx}`}
                onClick={() => onPriceClick?.(ask.price)}
                className="grid grid-cols-4 px-3 py-1.5 text-sm font-mono cursor-pointer relative hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                {/* Depth Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-500/10 dark:bg-red-500/20 transition-all"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="relative z-10 font-semibold text-red-600 dark:text-red-400">{formatPrice(ask.price)}</span>
                <span className="relative z-10 text-navy-900 dark:text-white">{formatQuantity(ask.quantity)}</span>
                <span className="relative z-10 text-navy-700 dark:text-navy-300">{formatQuantity(ask.cumulative_quantity)}</span>
                <span className="relative z-10 text-right text-navy-500 dark:text-navy-400">{ask.order_count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread Indicator */}
      <div className="px-4 py-3 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800/50 flex justify-center items-center gap-4">
        <span className="text-xs text-navy-500 dark:text-navy-400">Spread</span>
        <span className="font-mono font-semibold text-sm text-amber-600 dark:text-amber-400">
          €{spread?.toFixed(3) || '0.000'} ({spread && bestBid ? ((spread / bestBid) * 100).toFixed(3) : '0.000'}%)
        </span>
      </div>
    </Card>
  );
}

// =============================================================================
// TRADE PANEL COMPONENT
// =============================================================================

interface TradePanelProProps {
  bestBid: number | null;
  bestAsk: number | null;
  lastPrice: number | null;
  selectedPrice?: number;
  availableEur: number;
  availableCea: number;
}

function TradePanelPro({
  bestBid,
  bestAsk,
  lastPrice,
  selectedPrice,
  availableEur,
  availableCea,
}: TradePanelProProps) {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState(selectedPrice?.toString() || lastPrice?.toString() || '');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (selectedPrice) {
      setPrice(selectedPrice.toString());
    }
  }, [selectedPrice]);

  const priceNum = parseFloat(price) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const total = priceNum * quantityNum;
  const isBuy = side === 'BUY';

  const setMarketPrice = () => {
    if (side === 'BUY' && bestAsk) {
      setPrice(bestAsk.toString());
    } else if (side === 'SELL' && bestBid) {
      setPrice(bestBid.toString());
    }
  };

  const setQuickQuantity = (percent: number) => {
    if (side === 'BUY' && priceNum > 0) {
      const maxQty = Math.floor(availableEur / priceNum);
      setQuantity(Math.floor(maxQty * percent / 100).toString());
    } else if (side === 'SELL') {
      setQuantity(Math.floor(availableCea * percent / 100).toString());
    }
  };

  return (
    <Card className="h-full" padding="none">
      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => setSide('BUY')}
          className={`py-3.5 text-sm font-bold transition-colors ${
            side === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`py-3.5 text-sm font-bold transition-colors ${
            side === 'SELL'
              ? 'bg-red-500 text-white'
              : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          SELL
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Type */}
        <div className="flex gap-2">
          {(['LIMIT', 'MARKET'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                orderType === type
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500'
                  : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-400 border border-navy-200 dark:border-navy-600 hover:bg-navy-100 dark:hover:bg-navy-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Price Input */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-navy-600 dark:text-navy-400">Price (EUR)</label>
              <button
                type="button"
                onClick={setMarketPrice}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                {side === 'BUY' ? 'Best Ask' : 'Best Bid'}
              </button>
            </div>
            <input
              type="number"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.000"
              className="form-input font-mono"
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="text-xs text-navy-600 dark:text-navy-400 block mb-1.5">
            Quantity (CEA)
          </label>
          <input
            type="number"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="form-input font-mono"
          />
          {/* Quick Quantity Buttons */}
          <div className="flex gap-1.5 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setQuickQuantity(pct)}
                className="flex-1 py-1.5 rounded text-xs font-medium border border-navy-200 dark:border-navy-600 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-3 border-y border-navy-200 dark:border-navy-700">
          <span className="text-sm text-navy-600 dark:text-navy-400">Total</span>
          <span className="text-lg font-bold font-mono text-navy-900 dark:text-white">
            €{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={priceNum <= 0 || quantityNum <= 0}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isBuy
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'
          }`}
        >
          {side} CEA
        </motion.button>

        {/* Available Balance */}
        <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-800/50 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-navy-500 dark:text-navy-400">Available EUR</span>
            <span className="font-mono text-navy-900 dark:text-white">
              €{availableEur.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500 dark:text-navy-400">Available CEA</span>
            <span className="font-mono text-navy-900 dark:text-white">
              {availableCea.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// RECENT TRADES COMPONENT
// =============================================================================

interface RecentTradesProps {
  trades: CashMarketTrade[];
}

function RecentTrades({ trades }: RecentTradesProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          Recent Trades
        </h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-4 py-2 text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wider border-b border-navy-200 dark:border-navy-700">
        <span>Price (EUR)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {trades.map((trade) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-3 px-4 py-2 text-sm font-mono border-b border-navy-100 dark:border-navy-700/50 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors"
          >
            <span className={`font-medium ${
              trade.side === 'BUY'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {trade.price.toFixed(3)}
            </span>
            <span className="text-right text-navy-900 dark:text-white">{trade.quantity}</span>
            <span className="text-right text-navy-500 dark:text-navy-400 text-xs">
              {formatTime(trade.executed_at)}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// DEPTH CHART COMPONENT
// =============================================================================

interface DepthChartMiniProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

function DepthChartMini({ bids, asks }: DepthChartMiniProps) {
  const maxDepth = Math.max(
    ...bids.map(b => b.cumulative_quantity),
    ...asks.map(a => a.cumulative_quantity)
  );

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-amber-500" />
        Market Depth
      </h4>
      <div className="flex items-end gap-0.5 h-16">
        {/* Bids (reversed) */}
        {[...bids].reverse().map((bid, i) => (
          <div
            key={`bid-${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-500/10"
            style={{ height: `${(bid.cumulative_quantity / maxDepth) * 100}%` }}
          />
        ))}
        {/* Divider */}
        <div className="w-0.5 h-full bg-navy-300 dark:bg-navy-600" />
        {/* Asks */}
        {asks.map((ask, i) => (
          <div
            key={`ask-${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-red-500/40 to-red-500/10"
            style={{ height: `${(ask.cumulative_quantity / maxDepth) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-navy-500 dark:text-navy-400 font-mono">
        <span>€{bids[bids.length - 1]?.price.toFixed(2)}</span>
        <span className="text-amber-500">Spread</span>
        <span>€{asks[asks.length - 1]?.price.toFixed(2)}</span>
      </div>
    </Card>
  );
}

// =============================================================================
// MY ORDERS COMPONENT (Enhanced)
// =============================================================================

interface MyOrdersProProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
}

function MyOrdersPro({ orders, onCancelOrder }: MyOrdersProProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const openOrders = orders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
  const historicalOrders = orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED');
  const displayOrders = activeTab === 'open' ? openOrders : historicalOrders;

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      PARTIALLY_FILLED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      FILLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <Card className="h-full" padding="none">
      {/* Tabs */}
      <div className="flex border-b border-navy-200 dark:border-navy-700">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'open'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Open Orders ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          History ({historicalOrders.length})
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 px-4 py-2 text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wider border-b border-navy-200 dark:border-navy-700">
        <span>ID</span>
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Filled</span>
        <span className="text-center">Status</span>
        <span className="text-center">Action</span>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-navy-400 dark:text-navy-500">
            <span>No {activeTab === 'open' ? 'open' : 'historical'} orders</span>
          </div>
        ) : (
          displayOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-7 px-4 py-3 text-sm font-mono border-b border-navy-100 dark:border-navy-700/50 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors items-center"
            >
              <span className="text-navy-500 dark:text-navy-400 text-xs">{order.id}</span>
              <span className={`font-semibold ${
                order.side === 'BUY'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {order.side}
              </span>
              <span className="text-right text-navy-900 dark:text-white">€{order.price.toFixed(2)}</span>
              <span className="text-right text-navy-900 dark:text-white">{order.quantity}</span>
              <span className="text-right text-navy-600 dark:text-navy-300">
                {order.filled_quantity}/{order.quantity}
              </span>
              <span className="text-center">{getStatusBadge(order.status)}</span>
              <span className="text-center">
                {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="px-3 py-1 rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export function CashMarketProPage() {
  // Use real data from API with 5s polling
  const {
    orderBook,
    recentTrades,
    myOrders,
    balances,
    loading,
    error,
    refresh,
  } = useCashMarket('CEA', 5000);

  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real user balances from API
  const availableEur = balances.eur;
  const availableCea = balances.cea;

  // Handle order cancellation via API
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cashMarketApi.cancelOrder(orderId);
      await refresh(); // Refresh data after cancel
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  // Handle order placement via API
  const handlePlaceOrder = async (order: { side: OrderSide; price: number; quantity: number }) => {
    setIsSubmitting(true);
    try {
      await cashMarketApi.placeOrder({
        certificate_type: 'CEA',
        side: order.side,
        price: order.price,
        quantity: order.quantity,
      });
      await refresh(); // Refresh data after order
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format helpers
  const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  // Loading state
  if (loading && !orderBook) {
    return (
      <div className="h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-navy-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !orderBook) {
    return (
      <div className="h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Safe defaults for when orderBook is null but we're past loading
  const safeOrderBook = orderBook || {
    bids: [],
    asks: [],
    spread: null,
    best_bid: null,
    best_ask: null,
    last_price: null,
    volume_24h: 0,
    change_24h: 0,
    high_24h: null,
    low_24h: null,
  };

  return (
    <div className="h-screen bg-navy-950 flex flex-col overflow-hidden">
      {/* Subheader */}
      <Subheader
        icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
        title="CEA Cash Market Pro"
        description="Professional Trading Interface"
        iconBg="bg-amber-500/20"
      >
        <div className="flex items-center gap-6 text-[11px]">
          {/* Last Price */}
          <div className="flex items-center gap-2">
            <span className="text-navy-400">Last</span>
            <span className="font-bold font-mono text-white text-lg">
              €{formatNumber(safeOrderBook.last_price, 3)}
            </span>
          </div>

          {/* 24h Change */}
          <div className="flex items-center gap-1">
            <span className="text-navy-400">24h</span>
            <span className={`flex items-center font-semibold ${
              safeOrderBook.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {safeOrderBook.change_24h >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {safeOrderBook.change_24h >= 0 ? '+' : ''}{safeOrderBook.change_24h.toFixed(2)}%
            </span>
          </div>

          {/* High */}
          <div>
            <span className="text-navy-400 mr-1">High</span>
            <span className="font-mono text-emerald-400">€{formatNumber(safeOrderBook.high_24h, 2)}</span>
          </div>

          {/* Low */}
          <div>
            <span className="text-navy-400 mr-1">Low</span>
            <span className="font-mono text-red-400">€{formatNumber(safeOrderBook.low_24h, 2)}</span>
          </div>

          {/* Volume */}
          <div>
            <span className="text-navy-400 mr-1">Vol</span>
            <span className="font-semibold text-white font-mono">
              {formatVolume(safeOrderBook.volume_24h)}
            </span>
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-navy-700 text-navy-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </Subheader>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Column: Order Book (wider – prices + volumes need space) */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <ProfessionalOrderBook
                bids={safeOrderBook.bids}
                asks={safeOrderBook.asks}
                spread={safeOrderBook.spread}
                bestBid={safeOrderBook.best_bid}
                bestAsk={safeOrderBook.best_ask}
                onPriceClick={setSelectedPrice}
              />
            </div>
          </div>

          {/* Middle Column: Recent Trades + Depth Chart (narrower – PRICE/SIZE/TIME fit) */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col min-h-0 gap-2">
            <div className="flex-1 min-h-0">
              <RecentTrades trades={recentTrades} />
            </div>
            <DepthChartMini bids={safeOrderBook.bids} asks={safeOrderBook.asks} />
          </div>

          {/* Right Column: Trade Panel */}
          <div className="col-span-12 lg:col-span-3 flex flex-col min-h-0">
            <TradePanelPro
              bestBid={safeOrderBook.best_bid}
              bestAsk={safeOrderBook.best_ask}
              lastPrice={safeOrderBook.last_price}
              selectedPrice={selectedPrice}
              availableEur={availableEur}
              availableCea={availableCea}
            />
          </div>
        </div>

        {/* Bottom: My Orders */}
        <div className="mt-2 h-44 flex-shrink-0">
          <MyOrdersPro
            orders={myOrders}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>
    </div>
  );
}
