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
  X,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCashMarket } from '../hooks/useCashMarket';
import { cashMarketApi } from '../services/api';
import type {
  OrderBookLevel,
  Order,
  OrderSide,
  CashMarketTrade,
} from '../types';

// =============================================================================
// PROFESSIONAL ORDER BOOK COMPONENT (COMPACT)
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
  // Calculate total liquidity for BID and ASK sides
  const { totalBidQty, totalBidEur, totalAskQty, totalAskEur } = useMemo(() => {
    const bidQty = bids.reduce((sum, b) => sum + b.quantity, 0);
    const askQty = asks.reduce((sum, a) => sum + a.quantity, 0);
    // For BID: value = sum of (quantity * price) for each level
    const bidEur = bids.reduce((sum, b) => sum + b.quantity * b.price, 0);
    // For ASK: value = sum of (quantity * price) for each level
    const askEur = asks.reduce((sum, a) => sum + a.quantity * a.price, 0);
    return { totalBidQty: bidQty, totalBidEur: bidEur, totalAskQty: askQty, totalAskEur: askEur };
  }, [bids, asks]);

  const formatPrice = (price: number) => price.toFixed(3);
  const formatQuantity = (qty: number) => qty.toLocaleString();

  return (
    <div className="h-full flex flex-col bg-navy-900 rounded border border-navy-800">
      {/* Header */}
      <div className="px-2 py-1 border-b border-navy-800 flex justify-between items-center">
        <h3 className="text-[11px] font-semibold text-white flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-amber-500" />
          Order Book
        </h3>
        <div className="flex gap-1">
          {['0.001', '0.01', '0.1'].map((precision, i) => (
            <button
              key={precision}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
                i === 1
                  ? 'bg-amber-500 text-white'
                  : 'text-navy-400 hover:bg-navy-800'
              }`}
            >
              {precision}
            </button>
          ))}
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex border-b border-navy-800">
        {/* Bids Header */}
        <div className="flex-1 grid grid-cols-4 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider">
          <span>Cnt</span>
          <span className="text-right">Total</span>
          <span className="text-right">Size</span>
          <span className="text-right">Bid</span>
        </div>
        {/* Separator */}
        <div className="w-px bg-navy-700/50" />
        {/* Asks Header */}
        <div className="flex-1 grid grid-cols-4 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider">
          <span>Ask</span>
          <span>Size</span>
          <span>Total</span>
          <span className="text-right">Cnt</span>
        </div>
      </div>

      {/* Order Book Grid */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Bids */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {bids.map((bid, idx) => {
            return (
              <div
                key={`bid-${idx}`}
                onClick={() => onPriceClick?.(bid.price)}
                className="grid grid-cols-4 px-2 py-[2px] text-[11px] font-mono cursor-pointer relative bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors"
                style={{ height: '20px', minHeight: '20px' }}
              >
                <span className="relative z-10 text-navy-500">{bid.order_count}</span>
                <span className="relative z-10 text-right text-navy-400">{formatQuantity(bid.cumulative_quantity)}</span>
                <span className="relative z-10 text-right text-white">{formatQuantity(bid.quantity)}</span>
                <span className="relative z-10 text-right font-medium text-emerald-400">{formatPrice(bid.price)}</span>
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px bg-navy-700/50" />

        {/* Asks */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {asks.map((ask, idx) => {
            return (
              <div
                key={`ask-${idx}`}
                onClick={() => onPriceClick?.(ask.price)}
                className="grid grid-cols-4 px-2 py-[2px] text-[11px] font-mono cursor-pointer relative bg-red-500/15 hover:bg-red-500/25 transition-colors"
                style={{ height: '20px', minHeight: '20px' }}
              >
                <span className="relative z-10 font-medium text-red-400">{formatPrice(ask.price)}</span>
                <span className="relative z-10 text-white">{formatQuantity(ask.quantity)}</span>
                <span className="relative z-10 text-navy-400">{formatQuantity(ask.cumulative_quantity)}</span>
                <span className="relative z-10 text-right text-navy-500">{ask.order_count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread Indicator */}
      <div className="px-2 py-1 border-t border-navy-800 bg-navy-800/50 flex justify-center items-center gap-3">
        <span className="text-[9px] text-navy-500">Spread</span>
        <span className="font-mono font-medium text-[11px] text-amber-400">
          €{spread?.toFixed(3) || '0.000'} ({spread && bestBid ? ((spread / bestBid) * 100).toFixed(3) : '0.000'}%)
        </span>
      </div>

      {/* Full Liquidity Summary */}
      <div className="flex border-t border-navy-800 bg-navy-800/50">
        {/* BID Liquidity */}
        <div className="flex-1 px-2 py-1.5">
          <div className="text-[9px] text-navy-500 uppercase tracking-wider mb-0.5">Total BID Liquidity</div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] text-emerald-400 font-medium">
              {totalBidQty.toLocaleString()} <span className="text-navy-500 text-[9px]">CEA</span>
            </span>
            <span className="font-mono text-[10px] text-navy-400">
              €{totalBidEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        {/* Separator */}
        <div className="w-px bg-navy-700/50" />
        {/* ASK Liquidity */}
        <div className="flex-1 px-2 py-1.5">
          <div className="text-[9px] text-navy-500 uppercase tracking-wider mb-0.5">Total ASK Liquidity</div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] text-red-400 font-medium">
              {totalAskQty.toLocaleString()} <span className="text-navy-500 text-[9px]">CEA</span>
            </span>
            <span className="font-mono text-[10px] text-navy-400">
              €{totalAskEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TRADE PANEL COMPONENT (COMPACT)
// =============================================================================

interface TradePanelProProps {
  bestBid: number | null;
  bestAsk: number | null;
  lastPrice: number | null;
  selectedPrice?: number;
  availableEur: number;
  availableCea: number;
  onPlaceOrder?: (order: { side: OrderSide; price: number; quantity: number }) => Promise<void>;
}

function TradePanelPro({
  bestBid,
  bestAsk,
  lastPrice,
  selectedPrice,
  availableEur,
  availableCea,
  onPlaceOrder,
}: TradePanelProProps) {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState(selectedPrice?.toString() || lastPrice?.toString() || '');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const maxQty = Math.floor((availableEur ?? 0) / priceNum);
      setQuantity(Math.floor(maxQty * percent / 100).toString());
    } else if (side === 'SELL') {
      setQuantity(Math.floor((availableCea ?? 0) * percent / 100).toString());
    }
  };

  const handleSubmit = async () => {
    if (!onPlaceOrder || priceNum <= 0 || quantityNum <= 0) return;
    setIsSubmitting(true);
    try {
      await onPlaceOrder({ side, price: priceNum, quantity: quantityNum });
      setQuantity('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-navy-900 rounded border border-navy-800 flex flex-col">
      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => setSide('BUY')}
          className={`py-2 text-[11px] font-bold transition-colors ${
            side === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-navy-800 text-navy-400 hover:bg-emerald-900/30'
          }`}
        >
          BUY
        </button>
        <button
          disabled
          className="py-2 text-[11px] font-bold bg-navy-800/50 text-navy-600 cursor-not-allowed"
          title="Selling is not available"
        >
          SELL
        </button>
      </div>

      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {/* Order Type */}
        <div className="flex gap-1">
          {(['LIMIT', 'MARKET'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                orderType === type
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-navy-800 text-navy-400 border border-navy-700 hover:bg-navy-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Price Input */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[10px] text-navy-400">Price (EUR)</label>
              <button
                type="button"
                onClick={setMarketPrice}
                className="text-[9px] text-amber-400 hover:underline font-medium"
              >
                {side === 'BUY' ? 'Best Ask' : 'Best Bid'}
              </button>
            </div>
            <input
              type="number"
              step="0.1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.000"
              className="w-full h-7 px-2 text-[11px] font-mono bg-navy-950 border border-navy-700 rounded text-white placeholder-navy-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="text-[10px] text-navy-400 block mb-0.5">
            Quantity (CEA)
          </label>
          <input
            type="number"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full h-7 px-2 text-[11px] font-mono bg-navy-950 border border-navy-700 rounded text-white placeholder-navy-600 focus:border-amber-500 focus:outline-none"
          />
          {/* Quick Quantity Buttons */}
          <div className="flex gap-1 mt-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setQuickQuantity(pct)}
                className="flex-1 py-1 rounded text-[9px] font-medium border border-navy-700 text-navy-400 hover:bg-navy-800 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-1.5 border-y border-navy-700">
          <span className="text-[10px] text-navy-400">Total</span>
          <span className="text-[13px] font-bold font-mono text-white">
            €{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={priceNum <= 0 || quantityNum <= 0 || isSubmitting}
          onClick={handleSubmit}
          className={`w-full py-2 rounded font-bold text-[11px] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isBuy
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
          }`}
        >
          {isSubmitting ? 'Processing...' : `${side} CEA`}
        </motion.button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Available Balance */}
        <div className="p-1.5 rounded bg-navy-800/50 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-navy-500">Available EUR</span>
            <span className="font-mono text-white">
              €{(availableEur ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Available CEA</span>
            <span className="font-mono text-white">
              {(availableCea ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RECENT TRADES COMPONENT (COMPACT)
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
    <div className="h-full flex flex-col bg-navy-900 rounded border border-navy-800">
      <div className="px-2 py-1 border-b border-navy-800">
        <h3 className="text-[11px] font-semibold text-white flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-amber-500" />
          Recent Trades
        </h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider border-b border-navy-800">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] text-navy-500">
            No recent trades
          </div>
        ) : (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-3 px-2 py-[2px] text-[11px] font-mono border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
              style={{ height: '20px', minHeight: '20px' }}
            >
              <span className={`font-medium ${
                trade.side === 'BUY'
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}>
                {trade.price.toFixed(3)}
              </span>
              <span className="text-right text-white">{trade.quantity}</span>
              <span className="text-right text-navy-500 text-[10px]">
                {formatTime(trade.executed_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// DEPTH CHART COMPONENT (COMPACT)
// =============================================================================

interface DepthChartMiniProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

function DepthChartMini({ bids, asks }: DepthChartMiniProps) {
  const maxDepth = Math.max(
    ...bids.map(b => b.cumulative_quantity),
    ...asks.map(a => a.cumulative_quantity),
    1
  );

  return (
    <div className="bg-navy-900 rounded border border-navy-800 p-2">
      <h4 className="text-[10px] font-semibold text-white mb-1 flex items-center gap-1">
        <ArrowUpDown className="w-3 h-3 text-amber-500" />
        Market Depth
      </h4>
      <div className="flex items-end gap-[1px] h-10">
        {/* Bids (reversed) */}
        {[...bids].reverse().map((bid, i) => (
          <div
            key={`bid-${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-500/10"
            style={{ height: `${(bid.cumulative_quantity / maxDepth) * 100}%` }}
          />
        ))}
        {/* Divider */}
        <div className="w-[1px] h-full bg-navy-600" />
        {/* Asks */}
        {asks.map((ask, i) => (
          <div
            key={`ask-${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-red-500/40 to-red-500/10"
            style={{ height: `${(ask.cumulative_quantity / maxDepth) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-navy-500 font-mono">
        <span>€{bids[bids.length - 1]?.price.toFixed(2) || '-'}</span>
        <span className="text-amber-500">Spread</span>
        <span>€{asks[asks.length - 1]?.price.toFixed(2) || '-'}</span>
      </div>
    </div>
  );
}

// =============================================================================
// MY ORDERS COMPONENT (COMPACT)
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
      OPEN: 'bg-amber-900/30 text-amber-400',
      PARTIALLY_FILLED: 'bg-blue-900/30 text-blue-400',
      FILLED: 'bg-emerald-900/30 text-emerald-400',
      CANCELLED: 'bg-red-900/30 text-red-400',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="h-full bg-navy-900 rounded border border-navy-800 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-navy-800">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'open'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-navy-500 hover:text-navy-300'
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          Open ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-amber-400 border-b-2 border-amber-500'
              : 'text-navy-500 hover:text-navy-300'
          }`}
        >
          History ({historicalOrders.length})
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider border-b border-navy-800">
        <span>ID</span>
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Filled</span>
        <span className="text-center">Status</span>
        <span className="text-center">Action</span>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] text-navy-500">
            No {activeTab === 'open' ? 'open' : 'historical'} orders
          </div>
        ) : (
          displayOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-7 px-2 py-1 text-[10px] font-mono border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors items-center"
              style={{ height: '24px', minHeight: '24px' }}
            >
              <span className="text-navy-500 text-[9px] truncate">{order.id}</span>
              <span className={`font-semibold ${
                order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {order.side}
              </span>
              <span className="text-right text-white">€{order.price.toFixed(2)}</span>
              <span className="text-right text-white">{order.quantity}</span>
              <span className="text-right text-navy-400">
                {order.filled_quantity}/{order.quantity}
              </span>
              <span className="text-center">{getStatusBadge(order.status)}</span>
              <span className="text-center">
                {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="p-0.5 rounded border border-red-700 text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MARKET STATS BAR (COMPACT)
// =============================================================================

interface MarketStatsBarProps {
  lastPrice: number | null;
  change24h: number;
  high24h: number | null;
  low24h: number | null;
  volume24h: number;
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

function MarketStatsBar({
  lastPrice,
  change24h,
  high24h,
  low24h,
  volume24h,
  loading,
  onRefresh,
  onBack,
}: MarketStatsBarProps) {
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

  return (
    <div className="bg-navy-900 border-b border-navy-800 px-3 py-1.5 flex items-center gap-3">
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="w-8 h-8 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-navy-300 hover:text-white transition-colors"
        title="Back to Dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
      </motion.button>

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-[12px] font-bold text-white">CEA Cash</h1>
          <p className="text-[9px] text-navy-500">Professional Trading</p>
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-navy-700" />

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px]">
        {/* Last Price */}
        <div className="flex items-center gap-1.5">
          <span className="text-navy-500">Last</span>
          <span className="font-bold font-mono text-white text-[13px]">
            €{formatNumber(lastPrice, 3)}
          </span>
        </div>

        {/* 24h Change */}
        <div className="flex items-center gap-1">
          <span className="text-navy-500">24h</span>
          <span className={`flex items-center font-semibold ${
            change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change24h >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-0.5" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-0.5" />
            )}
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>

        {/* High */}
        <div>
          <span className="text-navy-500 mr-1">H</span>
          <span className="font-mono text-emerald-400">€{formatNumber(high24h, 2)}</span>
        </div>

        {/* Low */}
        <div>
          <span className="text-navy-500 mr-1">L</span>
          <span className="font-mono text-red-400">€{formatNumber(low24h, 2)}</span>
        </div>

        {/* Volume */}
        <div>
          <span className="text-navy-500 mr-1">Vol</span>
          <span className="font-semibold text-white font-mono">
            {formatVolume(volume24h)}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Refresh Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRefresh}
        className="p-1.5 rounded hover:bg-navy-800 text-navy-400"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </motion.button>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export function CashMarketProPage() {
  const navigate = useNavigate();

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

  // Real user balances from API (with safe defaults)
  const availableEur = balances?.eur ?? 0;
  const availableCea = balances?.cea ?? 0;

  // Navigate back to dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Handle order cancellation via API
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cashMarketApi.cancelOrder(orderId);
      await refresh();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  // Handle order placement via API
  const handlePlaceOrder = async (order: { side: OrderSide; price: number; quantity: number }) => {
    try {
      await cashMarketApi.placeOrder({
        certificate_type: 'CEA',
        side: order.side,
        price: order.price,
        quantity: order.quantity,
      });
      await refresh();
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  // Loading state
  if (loading && !orderBook) {
    return (
      <div className="h-screen bg-navy-950 flex items-center justify-center trading-terminal">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-[11px] text-navy-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !orderBook) {
    return (
      <div className="h-screen bg-navy-950 flex items-center justify-center trading-terminal">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-3" />
          <p className="text-[11px] text-red-400 mb-3">{error}</p>
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-[11px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Safe defaults
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
    <div className="h-screen bg-navy-950 flex flex-col overflow-hidden trading-terminal">
      {/* Market Stats Bar */}
      <MarketStatsBar
        lastPrice={safeOrderBook.last_price}
        change24h={safeOrderBook.change_24h}
        high24h={safeOrderBook.high_24h}
        low24h={safeOrderBook.low_24h}
        volume24h={safeOrderBook.volume_24h}
        loading={loading}
        onRefresh={refresh}
        onBack={handleBack}
      />

      {/* Main Content */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
          {/* Left Column: Order Book */}
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

          {/* Middle Column: Recent Trades + Depth Chart */}
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
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>

        {/* Bottom: My Orders */}
        <div className="mt-2 h-32 flex-shrink-0">
          <MyOrdersPro
            orders={myOrders}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>
    </div>
  );
}
