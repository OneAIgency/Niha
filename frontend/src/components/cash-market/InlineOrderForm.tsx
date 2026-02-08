import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cashMarketApi } from '../../services/api';
import type { CertificateType, OrderBookLevel } from '../../types';
import { TradeConfirmationModal } from './TradeConfirmationModal';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface OrderPreview {
  certificateType: string;
  side: string;
  orderType: string;
  amountEur: number | null;
  quantityRequested: number | null;
  limitPrice: number | null;
  allOrNone: boolean;
  fills: Array<{
    sellerCode: string;
    price: number;
    quantity: number;
    cost: number;
  }>;
  totalQuantity?: number;
  totalCostGross?: number;
  weightedAvgPrice?: number;
  bestPrice: number | null;
  worstPrice: number | null;
  platformFeeRate?: number;
  platformFeeAmount?: number;
  totalCostNet?: number;
  netPricePerUnit?: number;
  availableBalance?: number;
  remainingBalance?: number;
  canExecute: boolean;
  executionMessage: string;
  partialFill: boolean;
  willBePlacedInBook?: boolean;
}

interface InlineOrderFormProps {
  certificateType: CertificateType;
  availableBalance: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  asks: OrderBookLevel[];
  onOrderSubmit: (order: { orderType: 'MARKET'; amountEur: number }) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExpandChange?: (expanded: boolean) => void;
}

// ─────────────────────────────────────────────────
// Local orderbook-based calculation
// ─────────────────────────────────────────────────

export interface MarketCalc {
  totalQty: number;
  totalCost: number;
  avgPrice: number;
  levelsUsed: number;
}

export function calcMarketBuy(asks: OrderBookLevel[], budgetEur: number): MarketCalc | null {
  if (!asks.length || budgetEur <= 0) return null;

  let remaining = budgetEur;
  let totalQty = 0;
  let totalCost = 0;
  let levelsUsed = 0;

  for (const level of asks) {
    if (remaining <= 0) break;
    const costForLevel = level.price * level.quantity;

    if (remaining >= costForLevel) {
      // Buy entire level
      totalQty += level.quantity;
      totalCost += costForLevel;
      remaining -= costForLevel;
      levelsUsed++;
    } else {
      // Partial: buy as many whole units as remaining EUR allows
      const units = Math.floor(remaining / level.price);
      if (units > 0) {
        totalQty += units;
        totalCost += units * level.price;
        remaining -= units * level.price;
        levelsUsed++;
      }
    }
  }

  if (totalQty <= 0) return null;
  return { totalQty, totalCost, avgPrice: totalCost / totalQty, levelsUsed };
}

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

export function InlineOrderForm({
  certificateType,
  availableBalance,
  bestBid,
  bestAsk,
  spread,
  asks,
  onOrderSubmit,
  onRefresh,
  onExpandChange,
}: InlineOrderFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Local calculation from ASK orderbook — instant, no API call
  const calc = useMemo(
    () => calcMarketBuy(asks, availableBalance),
    [asks, availableBalance],
  );

  // Fetch backend preview for submit validation (canExecute, fees, etc.)
  const fetchPreview = useCallback(async () => {
    if (availableBalance <= 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const previewData = await cashMarketApi.previewOrder({
        certificate_type: certificateType,
        side: 'BUY',
        amount_eur: availableBalance,
        order_type: 'MARKET',
      });
      setPreview(previewData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setPreviewError(err.response?.data?.detail || 'Failed to preview order.');
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [certificateType, availableBalance]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview?.canExecute || availableBalance <= 0) return;
    setShowConfirmation(true);
  };

  const handleConfirmExecute = async () => {
    setIsSubmitting(true);
    try {
      await onOrderSubmit({ orderType: 'MARKET', amountEur: availableBalance });
      setShowConfirmation(false);
      setPreview(null);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      await onRefresh();
    } catch (error) {
      console.error('Order submission error:', error);
      // Re-throw so the modal catches and displays the error inline
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    !isLoadingPreview &&
    preview?.canExecute &&
    availableBalance > 0;

  const formatNumber = (num: number | null | undefined, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
      {!isExpanded ? (
        /* ── Contracted: button + expand icon ── */
        <button
          type="button"
          onClick={() => { setIsExpanded(true); onExpandChange?.(true); }}
          className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-navy-700/30 transition-colors text-left"
        >
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white transition-all duration-200 opacity-80 ${
              canSubmit
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                : 'bg-navy-700 text-navy-500'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy {certificateType} at Market</span>
          </div>
          <ChevronDown className="w-5 h-5 text-navy-400 shrink-0" aria-hidden />
        </button>
      ) : (
        <>
      {/* ── Header row: Market context ── */}
      <div className="px-5 py-3 border-b border-navy-700/50 flex items-center justify-between">
        <div className="flex items-center justify-between flex-1">
          {/* Left: Best Bid */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">Best Bid</div>
              <div className="font-mono font-bold text-emerald-400 text-xl tabular-nums">
                €{formatNumber(bestBid)}
              </div>
            </div>
          </div>

          {/* Center: Spread indicator */}
          <div className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">Spread</div>
            <div className="font-mono font-semibold text-amber-400 text-sm tabular-nums">
              €{formatNumber(spread, 4)}
            </div>
          </div>

          {/* Right: Best Ask */}
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-navy-500 mb-0.5">Best Ask</div>
            <div className="font-mono font-bold text-red-400 text-xl tabular-nums">
              €{formatNumber(bestAsk)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setIsExpanded(false); onExpandChange?.(false); }}
          className="p-1.5 rounded-lg hover:bg-navy-700/50 text-navy-400 hover:text-white transition-colors shrink-0"
          aria-label="Collapse order form"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      {/* ── Order Form ── market only, full balance, single execute */}
      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid gap-3 mb-3 grid-cols-3">
          {/* Amount EUR — read-only, full balance */}
          <div>
            <label className="text-xs font-medium text-navy-400 uppercase tracking-wider block mb-1">
              Amount (EUR)
            </label>
            <div className="h-[38px] px-3 rounded-lg border border-navy-600 bg-navy-900/50 text-sm font-mono text-white flex items-center justify-between">
              <span className="tabular-nums">€{formatNumber(availableBalance)}</span>
            </div>
            <div className="text-xs text-navy-500 mt-0.5">Full balance</div>
          </div>

          {/* Estimated Quantity — from local orderbook calc */}
          <div>
            <label className="text-xs font-medium text-navy-400 uppercase tracking-wider block mb-1">
              Est. Quantity
            </label>
            <div className="h-[38px] px-3 rounded-lg border border-navy-600 bg-navy-900/50 text-sm font-mono text-white flex items-center justify-between">
              {calc ? (
                <span className="tabular-nums">{formatNumber(calc.totalQty, 0)}</span>
              ) : (
                <span className="text-navy-500">—</span>
              )}
              <span className="text-xs text-navy-500 ml-1">{certificateType}</span>
            </div>
          </div>

          {/* Avg. Price — weighted average from ASK levels */}
          <div>
            <label className="text-xs font-medium text-navy-400 uppercase tracking-wider block mb-1">
              Avg. Price
            </label>
            <div className="h-[38px] px-3 rounded-lg border border-navy-600 bg-navy-900/50 text-sm font-mono text-white flex items-center justify-between">
              {calc ? (
                <span className="tabular-nums text-amber-400">€{formatNumber(calc.avgPrice)}</span>
              ) : (
                <span className="text-navy-500">—</span>
              )}
              <span className="text-xs text-navy-500 ml-1">/ {certificateType}</span>
            </div>
          </div>
        </div>

        {/* ── Preview Section ── */}
        <AnimatePresence>
          {(calc || previewError || isLoadingPreview) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {isLoadingPreview && !calc && (
                <div className="flex items-center justify-center py-3 rounded-lg bg-navy-900/50 border border-navy-700 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
                  <span className="text-xs text-navy-400">Calculating...</span>
                </div>
              )}

              {previewError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-900/15 border border-red-800/30 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{previewError}</p>
                </div>
              )}

              {calc && (
                <div className="rounded-lg bg-navy-900/50 border border-navy-700 mb-3 px-3 py-2.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Quantity</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {formatNumber(calc.totalQty, 0)} {certificateType}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Total Cost</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      €{formatNumber(calc.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Avg. Price</span>
                    <span className="font-mono font-semibold text-amber-400 tabular-nums">
                      €{formatNumber(calc.avgPrice)} / {certificateType}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Price Levels</span>
                    <span className="font-mono text-navy-300 tabular-nums">
                      {calc.levelsUsed} level{calc.levelsUsed !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {preview?.platformFeeAmount != null && preview.platformFeeAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-400">Platform Fee</span>
                      <span className="font-mono text-navy-300 tabular-nums">
                        €{formatNumber(preview.platformFeeAmount)}
                        {preview.platformFeeRate != null && (
                          <span className="text-navy-500 ml-1">
                            ({(preview.platformFeeRate * 100).toFixed(2)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {!preview?.canExecute && preview && (
                    <div className="flex items-start gap-1.5 p-2 rounded bg-red-900/20 border border-red-800/30 mt-2">
                      <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{preview.executionMessage}</p>
                    </div>
                  )}
                  {preview?.canExecute && (
                    <div className="flex items-start gap-1.5 p-2 rounded bg-emerald-900/20 border border-emerald-800/30 mt-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-300">Ready to execute at market</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit Button ── */}
        <motion.button
          whileHover={canSubmit ? { scale: 1.005 } : {}}
          whileTap={canSubmit ? { scale: 0.995 } : {}}
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            canSubmit
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-500/20'
              : 'bg-navy-700 text-navy-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Buy {certificateType} at Market</span>
            </>
          )}
        </motion.button>

        {/* Success feedback */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Order placed successfully</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
        </>
      )}

      {/* ── Trade Confirmation Modal ── */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmExecute}
        trade={
          calc && preview
            ? {
                certificateType,
                side: 'BUY',
                amountEur: availableBalance,
                estimatedQuantity: calc.totalQty,
                avgPrice: calc.avgPrice,
                levelsUsed: calc.levelsUsed,
                bestPrice: preview.bestPrice,
                worstPrice: preview.worstPrice,
                platformFeeRate: preview.platformFeeRate ?? null,
                platformFeeAmount: preview.platformFeeAmount ?? null,
                totalCostGross: preview.totalCostGross ?? null,
                totalCostNet: preview.totalCostNet ?? null,
                remainingBalance: preview.remainingBalance ?? null,
                partialFill: preview.partialFill,
              }
            : null
        }
      />
    </div>
  );
}
