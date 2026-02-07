import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Activity,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Subheader } from '../components/common';
import { useCashMarket } from '../hooks/useCashMarket';
import { cashMarketApi } from '../services/api';
import { InlineOrderForm } from '../components/cash-market/InlineOrderForm';
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
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Summary Row — text-xs (initial size); CEA volumes centered; larger gap between Bid and Ask */}
      <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono tabular-nums border-b border-navy-700">
        {/* Left: Total Bid | Bid CEA vol (centered) | Bid price */}
        <div className="flex-1 flex items-center gap-1">
          <div className="text-left text-emerald-400 shrink-0">
            €{totalBidEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex-1 flex justify-center text-emerald-400">
            {formatQuantity(bidMaxCumQty)} CEA
          </div>
          <div className="text-emerald-400 font-bold text-xl tabular-nums shrink-0">€{bestBid?.toFixed(1) || '—'}</div>
        </div>
        {/* Center: larger margin between Bid and Ask */}
        <div className="w-6 shrink-0" />
        {/* Right: Ask price | Ask CEA vol (centered) | Total Ask */}
        <div className="flex-1 flex items-center gap-1">
          <div className="text-red-400 font-bold text-xl tabular-nums shrink-0">€{_bestAsk?.toFixed(1) || '—'}</div>
          <div className="flex-1 flex justify-center text-red-400">
            {formatQuantity(askMaxCumQty)} CEA
          </div>
          <div className="text-right text-red-400 shrink-0">
            €{totalAskEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Column Headers — uniformly spaced columns */}
      <div className="flex border-b border-navy-700">
        <div className="flex-1 flex gap-1 px-2 py-1 text-xs text-navy-500">
          <div className="flex-1 min-w-0">Cnt</div>
          <div className="flex-1 min-w-0 text-right">Tot.Value €</div>
          <div className="flex-1 min-w-0 text-right">Vol.Total</div>
          <div className="flex-1 min-w-0 text-right">Volume</div>
          <div className="flex-1 min-w-0 text-right">Bid</div>
        </div>
        <div className="w-px bg-navy-700 shrink-0" />
        <div className="flex-1 flex gap-1 px-2 py-1 text-xs text-navy-500">
          <div className="flex-1 min-w-0">Ask</div>
          <div className="flex-1 min-w-0 text-right">Volume</div>
          <div className="flex-1 min-w-0 text-right">Vol.Total</div>
          <div className="flex-1 min-w-0 text-right">Tot.Value €</div>
          <div className="flex-1 min-w-0 text-right">Cnt</div>
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
                className={`flex gap-1 px-2 py-1 text-xs font-mono tabular-nums cursor-pointer relative hover:bg-navy-700/50 ${isEven ? 'bg-emerald-500/[0.125]' : 'bg-emerald-500/[0.075]'}`}
              >
                <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/20 transition-all" style={{ width: `${depthPct}%` }} />
                <div className="relative z-10 flex-1 min-w-0 text-navy-400">{bid.orderCount}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white/70">{formatEur(bid.cumulativeValue)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white/70">{formatQuantity(bid.cumulativeQuantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white">{formatQuantity(bid.quantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-emerald-400">{formatPrice(bid.price)}</div>
              </div>
            );
          })}
        </div>
        <div className="w-px bg-navy-700 shrink-0" />
        <div className="flex-1 flex flex-col">
          {asksWithCumulativeValue.map((ask, idx) => {
            const depthPct = askMaxCumQty > 0 ? (ask.cumQtyFromTop / askMaxCumQty) * 100 : 0;
            const isEven = idx % 2 === 0;
            return (
              <div
                key={`ask-${idx}`}
                onClick={() => onPriceClick?.(ask.price)}
                className={`flex gap-1 px-2 py-1 text-xs font-mono tabular-nums cursor-pointer relative hover:bg-navy-700/50 ${isEven ? 'bg-red-500/[0.05]' : 'bg-red-500/[0.10]'}`}
              >
                <div className="absolute left-0 top-0 bottom-0 bg-red-500/15 transition-all" style={{ width: `${depthPct}%` }} />
                <div className="relative z-10 flex-1 min-w-0 text-red-400">{formatPrice(ask.price)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white">{formatQuantity(ask.quantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white/70">{formatQuantity(ask.cumulativeQuantity)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-white/70">{formatEur(ask.cumulativeValue)}</div>
                <div className="relative z-10 flex-1 min-w-0 text-right text-navy-400">{ask.orderCount}</div>
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
  /** Infer side from price: trade at bid = SELL (seller hit bid), trade at ask = BUY (buyer lifted ask).
   * Backend currently returns side="BUY" for all trades, so we infer from order book levels. */
  const inferIsBuy = (price: number) => {
    if (bestBid != null && bestAsk != null) {
      const mid = (bestBid + bestAsk) / 2;
      return price >= mid; // price closer to/at ask → BUY, closer to/at bid → SELL
    }
    return true; // fallback to BUY styling if no order book
  };
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

  return (
    <div className="bg-navy-900 rounded border border-navy-700 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-navy-700 flex items-center gap-1.5 bg-navy-800">
        <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <h3 className="text-xs font-semibold text-white">Recent Trades</h3>
        <span className="text-xs text-navy-500">(last 20)</span>
      </div>
      <div className="overflow-hidden">
        {trades.length === 0 ? (
          <div className="py-3 px-4 text-xs text-navy-500">No recent trades</div>
        ) : (
          <div className="flex items-center min-w-max py-1.5 ticker-scroll">
            {/* Duplicate content for seamless right-to-left loop */}
            {[1, 2].map((copy) => (
              <div key={copy} className="flex items-center gap-x-2 shrink-0 px-2">
                {trades.map((trade) => {
                  const isBuy = inferIsBuy(trade.price);
                  return (
                  <div
                    key={`${copy}-${trade.id}`}
                    className={`flex items-center gap-3 px-3 py-1 rounded transition-colors shrink-0 hover:bg-navy-700/50 ${
                      isBuy ? 'bg-emerald-500/[0.075]' : 'bg-red-500/[0.05]'
                    }`}
                  >
                    <span className={`font-mono font-medium text-xs tabular-nums ${
                      isBuy ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      €{trade.price.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-white tabular-nums">
                      {Math.round(trade.quantity).toLocaleString()}
                    </span>
                    <span className="text-xs text-navy-500 tabular-nums">
                      {trade.executedAt ? formatTime(trade.executedAt) : '-'}
                    </span>
                  </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
    balances,
    loading,
    error,
    refresh,
  } = useCashMarket('CEA', 5000);

  // Real user balances from API (with safe defaults)
  const availableEur = balances?.eur ?? 0;

  // Handle market order submission (market only, full balance)
  const handleMarketOrderSubmit = async (order: { orderType: 'MARKET'; amountEur: number }) => {
    try {
      await cashMarketApi.executeMarketOrder({
        certificate_type: 'CEA',
        side: 'BUY',
        amount_eur: order.amountEur,
      });
      await refresh();
    } catch (err) {
      console.error('Failed to submit order:', err);
      throw err;
    }
  };

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

  const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <>
      {/* Subheader */}
      <Subheader
        icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
        title="CEA Cash"
        description="Trade China Emission Allowances"
        iconBg="bg-amber-500/20"
      >
        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">Best Bid</span>
          <span className="font-bold font-mono text-emerald-400 text-lg">
            €{formatNumber(safeOrderBook.bestBid)}
          </span>
        </div>

        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">Best Ask</span>
          <span className="font-bold font-mono text-red-400 text-lg">
            €{formatNumber(safeOrderBook.bestAsk)}
          </span>
        </div>

        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">Spread</span>
          <span className="font-semibold font-mono text-navy-300">
            €{formatNumber(safeOrderBook.spread, 4)}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </Subheader>

      {/* Content under subheader — same page containers as CeaSwapMarketPage */}
      <div className="min-h-screen bg-navy-900">
        <div className="page-container py-6">
          {loading && !orderBook ? (
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
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
            <div className="space-y-6">
              {/* Recent Trades ticker — at top of page content */}
              <RecentTradesTicker
                trades={recentTrades}
                bestBid={safeOrderBook.bestBid}
                bestAsk={safeOrderBook.bestAsk}
              />

              {/* Inline Order Form — market only, full balance, single execute */}
              <InlineOrderForm
                certificateType="CEA"
                availableBalance={availableEur}
                bestBid={safeOrderBook.bestBid}
                bestAsk={safeOrderBook.bestAsk}
                spread={safeOrderBook.spread}
                onOrderSubmit={handleMarketOrderSubmit}
                onRefresh={refresh}
              />

              {/* Order Book */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                  <div className="content_wrapper_last">
                    <div className="p-2">
                      <ProfessionalOrderBook
                        bids={safeOrderBook.bids}
                        asks={safeOrderBook.asks}
                        spread={safeOrderBook.spread}
                        bestBid={safeOrderBook.bestBid}
                        bestAsk={safeOrderBook.bestAsk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
