import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Activity,
  Clock,
  AlertCircle,
  X,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCashMarket } from '../hooks/useCashMarket';
import { cashMarketApi } from '../services/api';
import { UserOrderEntryModal } from '../components/cash-market/UserOrderEntryModal';
import { Card } from '../components/common';
import type {
  OrderBookLevel,
  Order,
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
  const { totalBidEur, totalAskEur } = useMemo(() => {
    // For BID: value = sum of (quantity * price) for each level
    const bidEur = bids.reduce((sum, b) => sum + b.quantity * b.price, 0);
    // For ASK: value = sum of (quantity * price) for each level
    const askEur = asks.reduce((sum, a) => sum + a.quantity * a.price, 0);
    return { totalBidEur: bidEur, totalAskEur: askEur };
  }, [bids, asks]);

  // Calculate cumulative values for each level
  const bidsWithCumulativeValue = useMemo(() => {
    let cumValue = 0;
    return bids.map(bid => {
      cumValue += bid.quantity * bid.price;
      return { ...bid, cumulativeValue: cumValue };
    });
  }, [bids]);

  const asksWithCumulativeValue = useMemo(() => {
    let cumValue = 0;
    return asks.map(ask => {
      cumValue += ask.quantity * ask.price;
      return { ...ask, cumulativeValue: cumValue };
    });
  }, [asks]);

  // Calculate max cumulative quantity for depth visualization
  const maxCumulativeQty = useMemo(() => {
    const bidMax = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative_quantity)) : 0;
    const askMax = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative_quantity)) : 0;
    return Math.max(bidMax, askMax);
  }, [bids, asks]);

  const formatPrice = (price: number) => price.toFixed(1);
  const formatQuantity = (qty: number) => Math.round(qty).toLocaleString();
  const formatValue = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="h-full flex flex-col bg-navy-900 rounded border border-navy-800">

      {/* Summary Row - Liquidity, Best Bid, Spread, Best Ask, Liquidity */}
      <div className="flex items-center px-3 py-2 border-b border-navy-700 bg-navy-700/50">
        {/* Left: Bid Liquidity */}
        <div className="flex-1 text-left">
          <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums tracking-tight">
            €{totalBidEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Center: Best Bid | Spread | Best Ask */}
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-base text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded tabular-nums tracking-tight">
            €{bestBid?.toFixed(1) || '—'}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-navy-800/80 rounded border border-navy-700">
            <span className="text-[9px] text-navy-400 uppercase tracking-wider">Spread</span>
            <span className="font-mono font-semibold text-xs text-amber-400 tabular-nums">
              €{spread?.toFixed(1) || '0.0'}
            </span>
            <span className="text-[9px] text-navy-500 tabular-nums">
              ({spread && bestBid ? ((spread / bestBid) * 100).toFixed(1) : '0.0'}%)
            </span>
          </div>
          <span className="font-mono font-bold text-base text-red-400 bg-red-500/20 px-2.5 py-1 rounded tabular-nums tracking-tight">
            €{_bestAsk?.toFixed(1) || '—'}
          </span>
        </div>

        {/* Right: Ask Liquidity */}
        <div className="flex-1 text-right">
          <span className="font-mono font-bold text-sm text-red-400 tabular-nums tracking-tight">
            €{totalAskEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex border-b border-navy-800">
        {/* Bids Header */}
        <div className="flex-1 grid grid-cols-6 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider">
          <span>Cnt</span>
          <span className="text-right">Val.Total</span>
          <span className="text-right">Value</span>
          <span className="text-right">Vol.Total</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Bid</span>
        </div>
        {/* Separator */}
        <div className="w-px bg-navy-700/50" />
        {/* Asks Header */}
        <div className="flex-1 grid grid-cols-6 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider">
          <span>Ask</span>
          <span>Volume</span>
          <span>Vol.Total</span>
          <span>Value</span>
          <span>Val.Total</span>
          <span className="text-right">Cnt</span>
        </div>
      </div>

      {/* Order Book Grid */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Bids */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {bidsWithCumulativeValue.map((bid, idx) => {
            const depthPct = maxCumulativeQty > 0 ? (bid.cumulative_quantity / maxCumulativeQty) * 100 : 0;
            return (
              <div
                key={`bid-${idx}`}
                onClick={() => onPriceClick?.(bid.price)}
                className="grid grid-cols-6 px-2 py-[2px] text-[11px] font-mono tabular-nums cursor-pointer relative hover:bg-emerald-500/25 transition-colors"
                style={{ height: '20px', minHeight: '20px' }}
              >
                {/* Depth bar - grows from right */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/20 transition-all"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="relative z-10 text-navy-500">{bid.order_count}</span>
                <span className="relative z-10 text-right text-navy-400">{formatValue(bid.cumulativeValue)}</span>
                <span className="relative z-10 text-right text-navy-300">{formatValue(bid.quantity * bid.price)}</span>
                <span className="relative z-10 text-right text-navy-400">{formatQuantity(bid.cumulative_quantity)}</span>
                <span className="relative z-10 text-right text-white font-medium">{formatQuantity(bid.quantity)}</span>
                <span className="relative z-10 text-right font-semibold text-emerald-400 tracking-tight">{formatPrice(bid.price)}</span>
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px bg-navy-700/50" />

        {/* Asks */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {asksWithCumulativeValue.map((ask, idx) => {
            const depthPct = maxCumulativeQty > 0 ? (ask.cumulative_quantity / maxCumulativeQty) * 100 : 0;
            return (
              <div
                key={`ask-${idx}`}
                onClick={() => onPriceClick?.(ask.price)}
                className="grid grid-cols-6 px-2 py-[2px] text-[11px] font-mono tabular-nums cursor-pointer relative hover:bg-red-500/25 transition-colors"
                style={{ height: '20px', minHeight: '20px' }}
              >
                {/* Depth bar - grows from left */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-500/20 transition-all"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="relative z-10 font-semibold text-red-400 tracking-tight">{formatPrice(ask.price)}</span>
                <span className="relative z-10 text-white font-medium">{formatQuantity(ask.quantity)}</span>
                <span className="relative z-10 text-navy-400">{formatQuantity(ask.cumulative_quantity)}</span>
                <span className="relative z-10 text-navy-300">{formatValue(ask.quantity * ask.price)}</span>
                <span className="relative z-10 text-navy-400">{formatValue(ask.cumulativeValue)}</span>
                <span className="relative z-10 text-right text-navy-500">{ask.order_count}</span>
              </div>
            );
          })}
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
    if (!dateStr) return '-';
    try {
      // Backend returns UTC time without 'Z' suffix, so we add it to ensure proper timezone conversion
      const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
      const date = new Date(utcDateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '-';
    }
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
      <div className="grid grid-cols-4 px-2 py-1 text-[9px] text-navy-500 uppercase tracking-wider border-b border-navy-800">
        <span>Price</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Value</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] text-navy-500">
            No recent trades
          </div>
        ) : (
          trades.map((trade) => {
            const tradeValue = trade.price * trade.quantity;
            return (
              <div
                key={trade.id}
                className="grid grid-cols-4 px-2 py-[2px] text-[11px] font-mono border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
                style={{ height: '20px', minHeight: '20px' }}
              >
                <span className={`font-medium ${
                  trade.side === 'BUY'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}>
                  {trade.price.toFixed(1)}
                </span>
                <span className="text-right text-white">{Math.round(trade.quantity).toLocaleString()}</span>
                <span className="text-right text-navy-400 text-[10px]">
                  {tradeValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-right text-navy-500 text-[10px]">
                  {trade.executedAt ? formatTime(trade.executedAt) : '-'}
                </span>
              </div>
            );
          })
        )}
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
              <span className="text-right text-white">€{order.price.toFixed(1)}</span>
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
  onPlaceOrder: () => void;
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
  onPlaceOrder,
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

      {/* Place Order Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlaceOrder}
        className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Place Order</span>
      </motion.button>

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

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Real user balances from API (with safe defaults)
  const availableEur = balances?.eur ?? 0;

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

  // Handle market order submission from modal
  const handleMarketOrderSubmit = async (order: {
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    amountEur: number;
  }) => {
    console.log('handleMarketOrderSubmit called with:', order);
    try {
      if (order.orderType === 'MARKET') {
        console.log('Executing MARKET order...');
        await cashMarketApi.executeMarketOrder({
          certificate_type: 'CEA',
          side: 'BUY',
          amount_eur: order.amountEur,
        });
      } else if (order.limitPrice) {
        // For LIMIT orders, calculate quantity from amount and price
        // quantity = amount / (price * (1 + fee_rate))
        // Using 0.5% fee rate
        const feeRate = 0.005;
        const quantity = order.amountEur / (order.limitPrice * (1 + feeRate));
        console.log('Placing LIMIT order:', { price: order.limitPrice, quantity: Math.floor(quantity) });

        const result = await cashMarketApi.placeOrder({
          certificate_type: 'CEA',
          side: 'BUY',
          price: order.limitPrice,
          quantity: Math.floor(quantity), // Integer quantity for certificates
        });
        console.log('LIMIT order placed successfully:', result);
      }
      console.log('Order completed, refreshing...');
      await refresh();
      setIsOrderModalOpen(false);
    } catch (err) {
      console.error('Failed to submit order:', err);
      throw err;
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
        onPlaceOrder={() => setIsOrderModalOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
          {/* Order Book - Takes 9 columns */}
          <div className="col-span-12 lg:col-span-9 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <ProfessionalOrderBook
                bids={safeOrderBook.bids}
                asks={safeOrderBook.asks}
                spread={safeOrderBook.spread}
                bestBid={safeOrderBook.best_bid}
                bestAsk={safeOrderBook.best_ask}
              />
            </div>
          </div>

          {/* Right Column: Recent Trades + My Orders */}
          <div className="col-span-12 lg:col-span-3 flex flex-col min-h-0 gap-2">
            <div className="flex-1 min-h-0">
              <RecentTrades trades={recentTrades} />
            </div>
            <div className="h-40 flex-shrink-0">
              <MyOrdersPro
                orders={myOrders}
                onCancelOrder={handleCancelOrder}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOrderModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card
                className="max-w-2xl w-full"
                padding="none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                      Place Order
                    </h3>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      Buy CEA certificates
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className="p-2 rounded-lg text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <UserOrderEntryModal
                    certificateType="CEA"
                    availableBalance={availableEur}
                    bestAskPrice={safeOrderBook.best_ask}
                    onOrderSubmit={handleMarketOrderSubmit}
                  />
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
