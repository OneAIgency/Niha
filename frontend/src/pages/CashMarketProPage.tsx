import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Subheader, Modal, Skeleton } from '../components/common';
import { useCashMarket } from '../hooks/useCashMarket';
import { cashMarketApi, usersApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';
import { formatCertificateQuantity, formatRelativeTime } from '../utils';
import { InlineOrderForm, calcMarketBuy } from '../components/cash-market/InlineOrderForm';
import { CEAPriceChart } from '../components/cash-market/CEAPriceChart';
import { NewsIntelligenceFeed } from '../components/cash-market/NewsIntelligenceFeed';
import { EnvironmentalImpact } from '../components/cash-market/EnvironmentalImpact';
import { MyOrders } from '../components/cash-market/MyOrders';
import type {
  OrderBookLevel,
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
  highlightAskCount?: number;
}

function ProfessionalOrderBook({
  bids,
  asks,
  spread: _spread,
  bestBid,
  bestAsk: _bestAsk,
  onPriceClick,
  highlightAskCount = 0,
}: ProfessionalOrderBookProps) {
  // Calculate total liquidity for BID and ASK sides
  const { totalBidEur, totalAskEur } = useMemo(() => {
    // For BID: value = sum of (quantity * price) for each level
    const bidEur = bids.reduce((sum, b) => sum + b.quantity * b.price, 0);
    // For ASK: value = sum of (quantity * price) for each level
    const askEur = asks.reduce((sum, a) => sum + a.quantity * a.price, 0);
    return { totalBidEur: bidEur, totalAskEur: askEur };
  }, [bids, asks]);

  // Cumulative value (EUR) and recalculated cumulative quantity per level
  // Liquidity bar: 100% only on last row, each row = (cumQty from row 0 to current) / (cumQty at last row)
  const bidsWithCumulativeValue = useMemo(() => {
    let cumValue = 0;
    let cumQty = 0;
    return bids.map(bid => {
      cumValue += bid.quantity * bid.price;
      cumQty += bid.quantity;
      return { ...bid, cumulativeValue: cumValue, cumQtyFromTop: cumQty };
    });
  }, [bids]);

  const asksWithCumulativeValue = useMemo(() => {
    let cumValue = 0;
    let cumQty = 0;
    return asks.map(ask => {
      cumValue += ask.quantity * ask.price;
      cumQty += ask.quantity;
      return { ...ask, cumulativeValue: cumValue, cumQtyFromTop: cumQty };
    });
  }, [asks]);

  const bidMaxCumQty = bidsWithCumulativeValue.length > 0
    ? bidsWithCumulativeValue[bidsWithCumulativeValue.length - 1].cumQtyFromTop
    : 0;
  const askMaxCumQty = asksWithCumulativeValue.length > 0
    ? asksWithCumulativeValue[asksWithCumulativeValue.length - 1].cumQtyFromTop
    : 0;

  const formatPrice = (price: number) => price.toFixed(1);
  const formatQuantity = (qty: number) => Math.round(qty).toLocaleString();
  const formatEur = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <>
      {/* Summary Row */}
      <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono tabular-nums border-b border-navy-700 whitespace-nowrap">
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          <div className="text-left text-emerald-400 shrink-0 truncate">
            €{totalBidEur.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="flex-1 flex justify-center text-emerald-400 truncate">
            {formatQuantity(bidMaxCumQty)} CEA
          </div>
          <div className="text-emerald-400 font-bold text-lg tabular-nums shrink-0" style={{ textShadow: '0 0 12px rgba(52,211,153,0.4)' }}>€{bestBid?.toFixed(1) || '—'}</div>
        </div>
        <div className="w-4 shrink-0" />
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          <div className="text-red-400 font-bold text-lg tabular-nums shrink-0" style={{ textShadow: '0 0 12px rgba(248,113,113,0.4)' }}>€{_bestAsk?.toFixed(1) || '—'}</div>
          <div className="flex-1 flex justify-center text-red-400 truncate">
            {formatQuantity(askMaxCumQty)} CEA
          </div>
          <div className="text-right text-red-400 shrink-0 truncate">
            €{totalAskEur.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex border-b border-navy-700 whitespace-nowrap">
        <div className="flex-1 flex gap-1 px-2 py-1 text-[10px] text-navy-500">
          <div className="flex-1 min-w-0 truncate">#</div>
          <div className="flex-1 min-w-0 truncate text-right">Value</div>
          <div className="flex-1 min-w-0 truncate text-right">CumVol</div>
          <div className="flex-1 min-w-0 truncate text-right">Vol</div>
          <div className="flex-1 min-w-0 truncate text-right">Bid</div>
        </div>
        <div className="w-px bg-navy-700 shrink-0" />
        <div className="flex-1 flex gap-1 px-2 py-1 text-[10px] text-navy-500">
          <div className="flex-1 min-w-0 truncate">Ask</div>
          <div className="flex-1 min-w-0 truncate text-right">Vol</div>
          <div className="flex-1 min-w-0 truncate text-right">CumVol</div>
          <div className="flex-1 min-w-0 truncate text-right">Value</div>
          <div className="flex-1 min-w-0 truncate text-right">#</div>
        </div>
      </div>

      {/* Order Book Rows — liquidity bar = cumulative from top; each step down adds this level's volume, so bar grows and steps reflect per-order volume */}
      <div className="flex">
        <div className="flex-1 flex flex-col">
          {bidsWithCumulativeValue.map((bid, idx) => {
            const depthPct = bidMaxCumQty > 0 ? (bid.cumQtyFromTop / bidMaxCumQty) * 100 : 0;
            const isEven = idx % 2 === 0;
            return (
              <div
                key={`bid-${idx}`}
                onClick={() => onPriceClick?.(bid.price)}
                className={`flex gap-1 px-2 py-1 text-[11px] font-mono tabular-nums cursor-pointer relative hover:bg-navy-700/50 whitespace-nowrap ${isEven ? 'bg-emerald-500/[0.125]' : 'bg-emerald-500/[0.075]'}`}
              >
                <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/20 transition-all" style={{ width: `${depthPct}%` }} />
                <div className="relative z-10 flex-1 min-w-0 truncate text-navy-400">{bid.orderCount}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-white/70">{formatEur(bid.cumulativeValue)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-white/70">{formatQuantity(bid.cumulativeQuantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-white">{formatQuantity(bid.quantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-emerald-400">{formatPrice(bid.price)}</div>
              </div>
            );
          })}
        </div>
        <div className="w-px bg-navy-700 shrink-0" />
        <div className="flex-1 flex flex-col">
          {asksWithCumulativeValue.map((ask, idx) => {
            const depthPct = askMaxCumQty > 0 ? (ask.cumQtyFromTop / askMaxCumQty) * 100 : 0;
            const isEven = idx % 2 === 0;
            const isHighlighted = highlightAskCount > 0 && idx < highlightAskCount;

            const rowBg = isHighlighted
              ? 'bg-yellow-400/50'
              : isEven ? 'bg-red-500/[0.05]' : 'bg-red-500/[0.10]';

            const depthBg = isHighlighted
              ? 'bg-yellow-500/10'
              : 'bg-red-500/15';

            return (
              <div
                key={`ask-${idx}`}
                onClick={() => onPriceClick?.(ask.price)}
                className={`flex gap-1 px-2 py-1 text-[11px] font-mono tabular-nums cursor-pointer relative hover:bg-navy-700/50 transition-colors whitespace-nowrap ${rowBg}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 ${depthBg} transition-all`} style={{ width: `${depthPct}%` }} />
                <div className={`relative z-10 flex-1 min-w-0 truncate ${isHighlighted ? 'text-yellow-300 font-semibold' : 'text-red-400'}`}>{formatPrice(ask.price)}</div>
                <div className={`relative z-10 flex-1 min-w-0 truncate text-right ${isHighlighted ? 'text-yellow-300 font-semibold' : 'text-white'}`}>{formatQuantity(ask.quantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-white/70">{formatQuantity(ask.cumulativeQuantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-white/70">{formatEur(ask.cumulativeValue)}</div>
                <div className="relative z-10 flex-1 min-w-0 truncate text-right text-navy-400">{ask.orderCount}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// RECENT TRADES TICKER (horizontal strip below grid, last 20 trades)
// =============================================================================

interface RecentTradesTickerProps {
  trades: CashMarketTrade[];
  bestBid: number | null;
  bestAsk: number | null;
}

function RecentTradesTicker({ trades, bestBid, bestAsk }: RecentTradesTickerProps) {
  /** Use backend side when available; otherwise infer from price vs mid (trade at ask = BUY, at bid = SELL). */
  const isBuy = useCallback((trade: CashMarketTrade) => {
    if (trade.side === 'BUY' || trade.side === 'SELL') return trade.side === 'BUY';
    if (bestBid != null && bestAsk != null) {
      const mid = (bestBid + bestAsk) / 2;
      return trade.price >= mid;
    }
    return true;
  }, [bestBid, bestAsk]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
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

  // Build HTML once per trade-set and inject via ref to avoid React re-renders
  // that reset the CSS animation. We update content only when trade IDs change.
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTradeIdsRef = useRef<string>('');

  useEffect(() => {
    if (!scrollRef.current || trades.length === 0) return;

    const tradeIds = trades.map((t) => t.id).join(',');
    if (tradeIds === prevTradeIdsRef.current) return;
    prevTradeIdsRef.current = tradeIds;

    // Build the inner HTML for one copy of the trades
    const buildCopy = () =>
      trades
        .map((trade) => {
          const buy = isBuy(trade);
          const bgClass = buy ? 'bg-emerald-500/[0.075]' : 'bg-red-500/[0.05]';
          const priceColor = buy ? 'text-emerald-400' : 'text-red-400';
          const time = trade.executedAt ? formatTime(trade.executedAt) : '-';
          return `<div class="flex items-center gap-3 px-3 py-1 rounded shrink-0 ${bgClass}">
            <span class="font-mono font-medium text-xs tabular-nums ${priceColor}">€${trade.price.toFixed(1)}</span>
            <span class="text-xs font-mono text-white tabular-nums">${Math.round(trade.quantity).toLocaleString()}</span>
            <span class="text-xs text-navy-500 tabular-nums">${time}</span>
          </div>`;
        })
        .join('');

    const copy = buildCopy();
    // Two copies for seamless loop
    scrollRef.current.innerHTML =
      `<div class="flex items-center gap-x-2 shrink-0 px-2">${copy}</div>` +
      `<div class="flex items-center gap-x-2 shrink-0 px-2">${copy}</div>`;
  }, [trades, isBuy]);

  if (trades.length === 0) {
    return (
      <div className="overflow-hidden">
        <div className="py-2 px-4 text-xs text-navy-500">No recent trades</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center min-w-max py-1.5 ticker-scroll"
      />
    </div>
  );
}

// =============================================================================
// ACTIVITY (vertical list, same source as ticker — BUY/SELL badge, total, relative time + full timestamp on hover)
// =============================================================================

interface RecentTradesActivityProps {
  trades: CashMarketTrade[];
  bestBid: number | null;
  bestAsk: number | null;
}

function formatFullTimestamp(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcDateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'UTC',
      hour12: true,
    }) + ' UTC';
  } catch {
    return '—';
  }
}

function RecentTradesActivity({ trades, bestBid, bestAsk }: RecentTradesActivityProps) {
  const isBuy = (trade: CashMarketTrade) => {
    if (trade.side === 'BUY' || trade.side === 'SELL') return trade.side === 'BUY';
    if (bestBid != null && bestAsk != null) {
      const mid = (bestBid + bestAsk) / 2;
      return trade.price >= mid;
    }
    return true;
  };

  return (
    <div className="bg-navy-900 rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 widget-accent-amber glow-amber">
      <div className="px-3 py-1.5 border-b border-navy-700 flex items-center gap-1.5 bg-navy-800/50 shrink-0">
        <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <h3 className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">Activity</h3>
        <span className="text-[10px] text-navy-500">(last 20)</span>
        <div className="live-dot bg-amber-400 ml-auto" title="Live" />
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5.5rem_4rem] gap-x-1 px-3 py-1 border-b border-navy-700 text-[10px] text-navy-500 uppercase tracking-wider shrink-0">
        <span>Side</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Price</span>
        <span className="text-right">Total</span>
        <span className="text-right">Time</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        {trades.length === 0 ? (
          <div className="py-3 px-4 text-xs text-navy-500">No recent trades</div>
        ) : (
          <div className="flex flex-col">
            {trades.map((trade, idx) => {
              const buy = isBuy(trade);
              const totalEur = trade.price * trade.quantity;
              return (
                <div
                  key={`${trade.id}-${idx}`}
                  className={`grid grid-cols-[3rem_1fr_5rem_5.5rem_4rem] gap-x-1 items-center px-3 py-1.5 border-b border-navy-700/30 ${
                    buy ? 'bg-emerald-500/[0.05]' : 'bg-red-500/[0.04]'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-center w-fit ${
                      buy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {buy ? 'BUY' : 'SELL'}
                  </span>
                  <span className="text-xs font-mono text-white tabular-nums text-right">
                    {Math.round(trade.quantity).toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-navy-300 tabular-nums text-right">
                    €{trade.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium tabular-nums text-right ${
                      buy ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    €{totalEur.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span
                    className="text-[10px] text-navy-500 tabular-nums text-right"
                    title={formatFullTimestamp(trade.executedAt)}
                  >
                    {trade.executedAt ? formatRelativeTime(trade.executedAt) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/** Shape of the result returned by executeMarketOrder (camelCase from axios transform) */
interface OrderExecutionResult {
  success: boolean;
  orderId: string | null;
  message: string;
  totalQuantity: number;
  totalCostGross: number;
  platformFee: number;
  totalCostNet: number;
  weightedAvgPrice: number;
  eurBalance: number;
  certificateBalance: number;
}

export function CashMarketProPage() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();

  // Use real data from API with 5s polling
  const {
    orderBook,
    recentTrades,
    myOrders,
    balances,
    loading,
    error,
    refresh,
  } = useCashMarket('CEA', 30000);

  // State for order success modal
  const [orderResult, setOrderResult] = useState<OrderExecutionResult | null>(null);

  // Real user balances from API (with safe defaults)
  const availableEur = balances?.eur ?? 0;

  // Handle market order submission (market only, full balance)
  const handleMarketOrderSubmit = async (order: { orderType: 'MARKET'; amountEur: number }) => {
    try {
      const result = await cashMarketApi.executeMarketOrder({
        certificate_type: 'CEA',
        side: 'BUY',
        amount_eur: order.amountEur,
      });

      if (result.success) {
        // Refetch user so auth store has updated role (e.g. CEA → CEA_SETTLE)
        if (token) {
          try {
            const updatedUser = await usersApi.getProfile();
            setAuth(updatedUser, token);
          } catch (refetchErr) {
            console.warn('Refetch user after order success failed; role may sync on next load.', refetchErr);
          }
        }
        // Normalize: API declares snake_case but axios interceptor returns camelCase
        const r = result as Record<string, unknown>;
        const normalized: OrderExecutionResult = {
          success: Boolean(r.success),
          orderId: (r.orderId ?? r.order_id) as string | null,
          message: String(r.message ?? ''),
          totalQuantity: Number(r.totalQuantity ?? r.total_quantity ?? 0),
          totalCostGross: Number(r.totalCostGross ?? r.total_cost_gross ?? 0),
          platformFee: Number(r.platformFee ?? r.platform_fee ?? 0),
          totalCostNet: Number(r.totalCostNet ?? r.total_cost_net ?? 0),
          weightedAvgPrice: Number(r.weightedAvgPrice ?? r.weighted_avg_price ?? 0),
          eurBalance: Number(r.eurBalance ?? r.eur_balance ?? 0),
          certificateBalance: Number(r.certificateBalance ?? r.certificate_balance ?? 0),
        };
        setOrderResult(normalized);
      }

      await refresh();
    } catch (err) {
      console.error('Failed to submit order:', err);
      throw err;
    }
  };

  /** Closes the order success modal and navigates to dashboard (single CTA; access to cash market is then restricted by role). */
  const handleModalClose = useCallback(() => {
    setOrderResult(null);
    navigate('/dashboard');
  }, [navigate]);

  const [cancellingOrder, setCancellingOrder] = useState(false);
  const handleCancelOrder = useCallback(async (orderId: string) => {
    setCancellingOrder(true);
    try {
      await cashMarketApi.cancelOrder(orderId);
      await refresh();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancellingOrder(false);
    }
  }, [refresh]);

  // Safe defaults - handle both null orderBook and undefined properties
  const safeOrderBook = {
    bids: orderBook?.bids ?? [],
    asks: orderBook?.asks ?? [],
    spread: orderBook?.spread ?? null,
    bestBid: orderBook?.bestBid ?? null,
    bestAsk: orderBook?.bestAsk ?? null,
    lastPrice: orderBook?.lastPrice ?? null,
    volume24h: orderBook?.volume24h ?? 0,
    change24h: orderBook?.change24h ?? 0,
    high24h: orderBook?.high24h ?? null,
    low24h: orderBook?.low24h ?? null,
  };

  // Track form expanded state + local orderbook calculation for highlighting
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const handleExpandChange = useCallback((expanded: boolean) => setIsFormExpanded(expanded), []);
  const pageCalc = useMemo(
    () => calcMarketBuy(safeOrderBook.asks, availableEur),
    [safeOrderBook.asks, availableEur],
  );
  const highlightAskCount = isFormExpanded && pageCalc ? pageCalc.levelsUsed : 0;

  const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* Subheader */}
      <Subheader
        icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
        title="CEA Cash"
        description="Trade China Emission Allowances"
        iconBg="bg-amber-500/20"
      >
        <div>
          <span className="text-navy-400 mr-2">Best Bid</span>
          <span className="font-bold font-mono text-emerald-400 text-lg">
            €{formatNumber(safeOrderBook.bestBid)}
          </span>
        </div>

        <div>
          <span className="text-navy-400 mr-2">Best Ask</span>
          <span className="font-bold font-mono text-red-400 text-lg">
            €{formatNumber(safeOrderBook.bestAsk)}
          </span>
        </div>

        <div>
          <span className="text-navy-400 mr-2">Spread</span>
          <span className="font-semibold font-mono text-navy-300">
            €{formatNumber(safeOrderBook.spread, 4)}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-navy-800 text-navy-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </Subheader>

      {/* Ticker — full width, edge-to-edge, no container */}
      {!loading && orderBook && (
        <RecentTradesTicker
          trades={recentTrades}
          bestBid={safeOrderBook.bestBid}
          bestAsk={safeOrderBook.bestAsk}
        />
      )}

      {/* Content — full page, flex to footer */}
      <div className="bg-navy-900 flex flex-col flex-1 min-h-0 px-4 py-4">
          {loading && !orderBook ? (
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              {/* Skeleton Row 1: Order Book | Chart | Order Form */}
              <div className="grid grid-cols-12 gap-2" style={{ flex: '5 1 0%', minHeight: 0 }}>
                <div className="col-span-5 rounded-lg border border-navy-700/50 bg-navy-800/30 p-3 space-y-2">
                  <Skeleton variant="text" width="40%" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={20} />
                  ))}
                </div>
                <div className="col-span-4 rounded-lg border border-navy-700/50 bg-navy-800/30 p-3">
                  <Skeleton variant="rectangular" height="100%" />
                </div>
                <div className="col-span-3 rounded-lg border border-navy-700/50 bg-navy-800/30 p-3 space-y-3">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={36} />
                  <Skeleton variant="rectangular" height={36} />
                  <Skeleton variant="rectangular" height={40} />
                </div>
              </div>
              {/* Skeleton Row 2: My Orders | Activity | News | Impact */}
              <div className="grid grid-cols-12 gap-2" style={{ flex: '3 1 0%', minHeight: 0 }}>
                {[3, 3, 3, 3].map((span, i) => (
                  <div key={i} className={`col-span-${span} rounded-lg border border-navy-700/50 bg-navy-800/30 p-3 space-y-2`}>
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="rectangular" height={20} />
                    <Skeleton variant="rectangular" height={20} />
                    <Skeleton variant="rectangular" height={20} />
                  </div>
                ))}
              </div>
            </div>
          ) : error && !orderBook ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              {/* Row 1: Order Book (5/12) | Chart (4/12) | Order Form (3/12) */}
              <div className="grid grid-cols-12 gap-2" style={{ flex: '5 1 0%', minHeight: 0 }}>
                <div className="col-span-5 min-h-0 flex flex-col">
                  <div className="rounded-lg border border-navy-700/50 bg-navy-800/30 flex-1 min-h-0 overflow-y-auto widget-accent-purple">
                    <ProfessionalOrderBook
                      bids={safeOrderBook.bids}
                      asks={safeOrderBook.asks}
                      spread={safeOrderBook.spread}
                      bestBid={safeOrderBook.bestBid}
                      bestAsk={safeOrderBook.bestAsk}
                      highlightAskCount={highlightAskCount}
                    />
                  </div>
                </div>
                <div className="col-span-4 min-h-0 flex flex-col">
                  <CEAPriceChart />
                </div>
                <div className="col-span-3 min-h-0 flex flex-col">
                  <InlineOrderForm
                    certificateType="CEA"
                    availableBalance={availableEur}
                    bestBid={safeOrderBook.bestBid}
                    bestAsk={safeOrderBook.bestAsk}
                    spread={safeOrderBook.spread}
                    asks={safeOrderBook.asks}
                    onOrderSubmit={handleMarketOrderSubmit}
                    onRefresh={refresh}
                    onExpandChange={handleExpandChange}
                  />
                </div>
              </div>

              {/* Row 2: My Orders (3/12) | Activity (3/12) | News (3/12) | Impact (3/12) */}
              <div className="grid grid-cols-12 gap-2" style={{ flex: '4 1 0%', minHeight: 0 }}>
                <div className="col-span-3 min-h-0 flex flex-col">
                  <MyOrders
                    orders={myOrders}
                    onCancelOrder={handleCancelOrder}
                    isLoading={cancellingOrder}
                  />
                </div>
                <div className="col-span-3 min-h-0 flex flex-col">
                  <RecentTradesActivity
                    trades={recentTrades}
                    bestBid={safeOrderBook.bestBid}
                    bestAsk={safeOrderBook.bestAsk}
                  />
                </div>
                <div className="col-span-3 min-h-0 flex flex-col">
                  <NewsIntelligenceFeed />
                </div>
                <div className="col-span-3 min-h-0 flex flex-col">
                  <EnvironmentalImpact />
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Order Success Modal */}
      <Modal
        isOpen={!!orderResult}
        onClose={handleModalClose}
        size="sm"
        closeOnBackdrop={false}
        closeOnEscape={false}
      >
        <Modal.Header showClose={false}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tranzactie confirmata</h2>
              <p className="text-sm text-navy-400">Ordinul a fost executat cu succes</p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {orderResult && (
            <div className="space-y-4">
              {/* Order ID / Ticket number (safe display if API returns number or null) */}
              {(() => {
                const ticket = String(orderResult.orderId ?? '').slice(0, 8).toUpperCase();
                return ticket ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-navy-900/50 rounded-lg border border-navy-700">
                    <FileText className="w-4 h-4 text-navy-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-navy-400">Order Ticket</p>
                      <p className="text-sm font-mono text-white">{ticket}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Key metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Volum CEA cumparat</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {formatCertificateQuantity(orderResult.totalQuantity)} CEA
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Pret mediu per CEA</span>
                  <span className="text-lg font-bold font-mono text-white">
                    €{orderResult.weightedAvgPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Cost total (cu comision)</span>
                  <span className="text-sm font-mono text-navy-300">
                    €{orderResult.totalCostNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-navy-400">Comision platforma</span>
                  <span className="text-sm font-mono text-navy-400">
                    €{orderResult.platformFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Settlement note */}
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-300">
                  Certificatele CEA vor fi livrate in contul tau dupa finalizarea settlement-ului (T+3).
                </p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            onClick={handleModalClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Inapoi la Dashboard
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
