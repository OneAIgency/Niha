import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  Shield,
  Leaf
} from 'lucide-react';
import { swapsApi, cashMarketApi, usersApi } from '../services/api';
import { Subheader, AlertBanner } from '../components/common';
import { useAuthStore } from '../stores/useStore';
import { getEffectiveRole } from '../utils/effectiveRole';
import type { SwapCalculation } from '../types';

interface SwapRate {
  ceaToEua: number;
  euaPriceEur: number;
  ceaPriceEur: number;
  platformFeePct: number;
  effectiveRate: number;
}

interface UserBalances {
  entityId: string | null;
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
}

interface OrderbookLevel {
  ratio: number;
  // Support both camelCase (from api.ts transform) and snake_case (raw API)
  euaQuantity?: number;
  eua_quantity?: number;
  ordersCount?: number;
  orders_count?: number;
  cumulativeEua?: number;
  cumulative_eua?: number;
  depthPct?: number;
  depth_pct?: number;
}

export function CeaSwapMarketPage() {
  const { user, simulatedRole } = useAuthStore();
  const effectiveRole = getEffectiveRole(user ?? null, simulatedRole);
  const isCeaPreview = effectiveRole === 'CEA' || effectiveRole === 'CEA_SETTLE';
  const canSwap = !isCeaPreview;

  const [swapRate, setSwapRate] = useState<SwapRate | null>(null);
  const [userBalances, setUserBalances] = useState<UserBalances | null>(null);
  const [swapCalculation, setSwapCalculation] = useState<SwapCalculation | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookLevel[]>([]);
  const [totalEuaAvailable, setTotalEuaAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // Confirmation dialog states
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isPlacingSwap, setIsPlacingSwap] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [swapReference, setSwapReference] = useState('');
  const [swapError, setSwapError] = useState<string | null>(null);

  // Fetch swap rate, user balances, and orderbook
  const fetchData = useCallback(async () => {
    try {
      setSwapError(null);

      // Always fetch orderbook (doesn't require auth)
      const orderbookData = await swapsApi.getOrderbook();
      setOrderbook(orderbookData.asks);
      setTotalEuaAvailable(orderbookData.totalEuaAvailable);

      // Try to fetch rate and balances (requires auth)
      try {
        const [rateData, balancesData] = await Promise.all([
          swapsApi.getRate(),
          cashMarketApi.getUserBalances(),
        ]);

        // Transform snake_case API response to camelCase interface
        setSwapRate({
          ceaToEua: rateData.cea_to_eua,
          euaPriceEur: rateData.eua_price_eur,
          ceaPriceEur: rateData.cea_price_eur,
          platformFeePct: rateData.platform_fee_pct,
          effectiveRate: rateData.effective_rate,
        });
        setUserBalances(balancesData);
      } catch (authError) {
        console.warn('Could not fetch rate/balances (auth required):', authError);
        // Still show orderbook even if not authenticated
      }
    } catch (error) {
      console.error('Error fetching swap data:', error);
      setSwapError('Failed to load swap data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate swap when CEA balance changes
  const calculateSwap = useCallback(async (ceaAmount: number) => {
    if (ceaAmount <= 0) {
      setSwapCalculation(null);
      return;
    }

    setIsCalculating(true);
    try {
      const calculation = await swapsApi.calculate('CEA', ceaAmount);
      setSwapCalculation(calculation);
    } catch (error) {
      console.error('Error calculating swap:', error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh swap data when swap status changes via WebSocket
  useEffect(() => {
    const handleSwapUpdate = () => { fetchData(); };
    window.addEventListener('nihao:swapUpdated', handleSwapUpdate);
    window.addEventListener('nihao:balanceUpdated', handleSwapUpdate);
    return () => {
      window.removeEventListener('nihao:swapUpdated', handleSwapUpdate);
      window.removeEventListener('nihao:balanceUpdated', handleSwapUpdate);
    };
  }, [fetchData]);

  // Calculate swap when balance is loaded
  useEffect(() => {
    if (userBalances?.ceaBalance && userBalances.ceaBalance > 0) {
      calculateSwap(userBalances.ceaBalance);
    }
  }, [userBalances?.ceaBalance, calculateSwap]);

  // Derived values
  const ceaBalance = userBalances?.ceaBalance ?? 0;

  // Get ratio from swapRate or fallback to best orderbook ratio
  const bestOrderbookRatio = orderbook.length > 0 ? orderbook[0].ratio : 0;
  const ceaToEuaRate = swapRate?.ceaToEua ?? bestOrderbookRatio;
  const platformFeePct = swapRate?.platformFeePct ?? 0.5;

  // Calculate weighted average ratio from orderbook for the user's CEA amount
  // Orderbook ratio = CEA/EUA (e.g., 0.1182 means 1 CEA gets you 0.1182 EUA, or 1 EUA = 8.46 CEA)
  const calculateWeightedRatio = (ceaAmount: number): { avgRatio: number; totalEua: number } => {
    if (orderbook.length === 0 || ceaAmount <= 0) {
      return { avgRatio: ceaToEuaRate, totalEua: 0 };
    }

    let remainingCea = ceaAmount;
    let totalEuaReceived = 0;
    let weightedRatioSum = 0; // sum of (ratio * euaFromThisLevel)

    // Traverse orderbook from best ratio (highest CEA/EUA = best for user) to worst
    // Note: orderbook is sorted with best offers first (highest ratio)
    for (const level of orderbook) {
      if (remainingCea <= 0) break;

      // Handle both camelCase and snake_case
      const euaQty = level.euaQuantity ?? level.eua_quantity ?? 0;

      // CEA needed for this level's EUA = EUA / ratio (since ratio = CEA/EUA)
      const ceaNeededForLevel = level.ratio > 0 ? euaQty / level.ratio : 0;

      if (remainingCea >= ceaNeededForLevel) {
        // Take all EUA from this level
        totalEuaReceived += euaQty;
        weightedRatioSum += level.ratio * euaQty;
        remainingCea -= ceaNeededForLevel;
      } else {
        // Partial fill - take only what we can afford
        // EUA we can buy = remainingCea * ratio (since ratio = CEA/EUA)
        const euaWeCanBuy = remainingCea * level.ratio;
        totalEuaReceived += euaWeCanBuy;
        weightedRatioSum += level.ratio * euaWeCanBuy;
        remainingCea = 0;
      }
    }

    // Calculate weighted average ratio (CEA/EUA) - weighted by EUA received at each level
    const avgRatio = totalEuaReceived > 0 ? weightedRatioSum / totalEuaReceived : ceaToEuaRate;

    return { avgRatio, totalEua: totalEuaReceived };
  };

  const { avgRatio: weightedAvgRatio, totalEua: estimatedEuaFromOrderbook } = calculateWeightedRatio(ceaBalance);

  // Use orderbook-based calculation for more accurate estimates
  const estimatedEuaGross = ceaBalance > 0 && orderbook.length > 0
    ? estimatedEuaFromOrderbook
    : (swapCalculation?.output.quantity ?? (ceaBalance * ceaToEuaRate));
  const platformFeeEua = estimatedEuaGross * platformFeePct / 100;
  const netEua = estimatedEuaGross - platformFeeEua;
  const euaPriceEur = swapRate?.euaPriceEur ?? 80;
  const euaValueEur = swapCalculation?.output.valueEur ?? (netEua * euaPriceEur);
  const platformFeeEur = platformFeeEua * euaPriceEur;

  // Format helpers
  const formatNumber = (num: number | undefined | null, decimals = 2) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number | undefined | null, currency = '€') => {
    return `${currency}${formatNumber(amount)}`;
  };

  const handleContinueToFinal = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(true);
    setTermsAccepted(false);
  };

  const handleConfirmSwap = async () => {
    setIsPlacingSwap(true);
    setSwapError(null);

    try {
      // Create swap request (backend expects quantity as integer)
      const swapRequest = await swapsApi.createSwapRequest({
        from_type: 'CEA',
        to_type: 'EUA',
        quantity: Math.floor(ceaBalance),
        desired_rate: ceaToEuaRate,
      });

      // Execute the swap
      const result = await swapsApi.executeSwap(swapRequest.id);

      setSwapReference(result.swap_reference);
      setShowFinalDialog(false);
      setShowSuccessDialog(true);

      // NOTE: Do NOT refresh user role here — it would change to EUA_SETTLE
      // and trigger a route guard redirect, closing the success dialog.
      // Role will be refreshed when user navigates away (dashboard button or close).
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: unknown } } };
      const detail = err.response?.data?.detail;
      console.error('Error placing swap:', { error, status: err.response?.status, detail });
      let message = 'Failed to execute swap. Please try again.';
      if (typeof detail === 'string') {
        message = detail;
      } else if (detail && typeof detail === 'object' && !Array.isArray(detail) && typeof (detail as { message?: string }).message === 'string') {
        message = (detail as { message: string }).message;
      } else if (Array.isArray(detail) && detail.length > 0 && typeof detail[0] === 'object' && detail[0] !== null && 'msg' in detail[0]) {
        message = String((detail[0] as { msg: string }).msg);
      }
      setSwapError(message);
    } finally {
      setIsPlacingSwap(false);
    }
  };

  const closeAllDialogs = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(false);
    setShowSuccessDialog(false);
    setTermsAccepted(false);
    setSwapError(null);
  };

  return (
    <div className="min-h-screen bg-navy-900 relative">
      {/* CEA Preview: Blur Overlay */}
      {isCeaPreview && (
        <div className="fixed inset-0 z-40" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="absolute inset-0 bg-navy-900/70" />
        </div>
      )}

      {/* CEA Preview: Info Modal */}
      <AnimatePresence>
        {isCeaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md pointer-events-auto"
            >
              {/* Modal card */}
              <div className="relative bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-400 to-emerald-500" />

                {/* Header */}
                <div className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white tracking-tight">Swap Market</h2>
                      <p className="text-sm text-navy-400">CEA to EUA exchange</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="px-8 pb-6">
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Available after CEA purchase</span>
                  </div>
                </div>

                {/* Visual swap preview */}
                <div className="px-8 pb-6">
                  <div className="flex items-center justify-center gap-4 py-6 bg-navy-700/50 border border-navy-600 rounded-xl">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
                        <Leaf className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="text-sm font-semibold text-amber-400">CEA</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-navy-400" />
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                        <span className="text-lg">🇪🇺</span>
                      </div>
                      <div className="text-sm font-semibold text-blue-400">EUA</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                  <div className="flex items-start gap-3 px-4 py-3 bg-navy-700/30 border border-navy-600/50 rounded-xl">
                    <Shield className="w-4 h-4 text-navy-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-navy-400 leading-relaxed">
                      The Swap Market allows you to exchange your CEA certificates for EU Emission Allowances (EUA). This feature will be unlocked once you complete a CEA purchase on the Cash Market.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subheader */}
      <Subheader
        icon={<ArrowRightLeft className="w-5 h-5 text-emerald-500" />}
        title="Swap"
        description="Exchange CEA for EU Allowances"
        iconBg="bg-emerald-500/20"
      >
        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">CEA/EUA Ratio</span>
          <span className="font-bold font-mono text-white text-lg">
            {ceaToEuaRate > 0 ? formatNumber(ceaToEuaRate, 4) : '...'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-navy-600 dark:text-navy-400">EUA</span>
          <span className="flex items-center font-semibold text-blue-400">
            {swapRate ? formatCurrency(swapRate.euaPriceEur) : '...'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-navy-600 dark:text-navy-400">CEA</span>
          <span className="flex items-center font-semibold text-amber-400">
            {swapRate ? formatCurrency(swapRate.ceaPriceEur) : '...'}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </motion.button>
      </Subheader>

      {/* Main Content */}
      <div className="page-container py-6">
        {isLoading && !swapRate ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : swapError && !swapRate ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-400 mb-4">{swapError}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Swap Visualization */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-navy-200 dark:border-navy-700 p-8">
              <div className="flex items-center justify-center gap-8">
                {/* CEA Side */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-12 h-12 text-amber-500" />
                  </div>
                  <div className="text-amber-400 font-bold font-mono text-2xl">
                    {formatNumber(ceaBalance, 0)}
                  </div>
                  <div className="text-navy-600 dark:text-navy-400 text-sm">CEA (You give)</div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <div className="text-navy-400 dark:text-navy-400 text-sm mb-2">
                    1 CEA = {formatNumber(ceaBalance > 0 ? weightedAvgRatio : ceaToEuaRate, 4)} EUA
                  </div>
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <button
                    onClick={() => setShowPreviewDialog(true)}
                    disabled={ceaBalance <= 0 || isPlacingSwap || orderbook.length === 0}
                    className="mt-3 px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-navy-600 disabled:to-navy-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200"
                  >
                    SWAP
                  </button>
                </div>

                {/* EUA Side */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🇪🇺</span>
                  </div>
                  <div className="text-blue-400 font-bold font-mono text-2xl">
                    {isCalculating ? '...' : formatNumber(netEua, 0)}
                  </div>
                  <div className="text-navy-600 dark:text-navy-400 text-sm">EUA (You get)</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Order Book - 100% width */}
              <div className="col-span-12">
                <div className="content_wrapper_last">
                  <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-white">Order Book</h2>
                        <p className="text-xs text-navy-500 dark:text-navy-500">EUA Offers (Asks)</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-navy-500">Total Available</div>
                        <div className="text-blue-400 font-mono font-bold">
                          {formatNumber(totalEuaAvailable, 0)} EUA
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {/* Order Book Header — same structure as Cash (flex border-b border-navy-700) */}
                    <div className="flex border-b border-navy-700">
                      <div className="flex-1 grid grid-cols-8 gap-1 px-2 py-1 text-xs text-navy-500">
                        <div>Ratio</div>
                        <div className="text-right">EUA</div>
                        <div className="text-right">Σ EUA</div>
                        <div className="text-right">CEA</div>
                        <div className="text-right">Σ CEA</div>
                        <div className="text-right">Val €</div>
                        <div className="text-right">Σ Val €</div>
                        <div className="text-right">#</div>
                      </div>
                    </div>

                    {/* Order Book Rows */}
                    <div className="flex flex-col">
                      {orderbook.length === 0 ? (
                        <div className="text-center py-8 text-navy-500">
                          <p>No orders available</p>
                        </div>
                      ) : (
                        (() => {
                          let cumulativeCea = 0;
                          let cumulativeEua = 0;
                          let cumulativeEur = 0;
                          const euaPrice = swapRate?.euaPriceEur ?? 83.72; // Fallback to ~current EUA price

                          return orderbook.map((level, index) => {
                            // CEA needed = EUA / ratio (since ratio = CEA/EUA)
                            // Handle both camelCase (transformed) and snake_case (raw) responses
                            const euaQty = level.euaQuantity ?? level.eua_quantity ?? 0;
                            const ceaNeeded = level.ratio > 0 ? euaQty / level.ratio : 0;
                            const eurValue = euaQty * euaPrice;
                            const prevCumulativeCea = cumulativeCea;
                            cumulativeEua += euaQty;
                            cumulativeCea += ceaNeeded;
                            cumulativeEur += eurValue;

                            // Also get ordersCount with fallback
                            const ordersCount = level.ordersCount ?? level.orders_count ?? 0;
                            const depthPct = level.depthPct ?? level.depth_pct ?? 0;

                            // Determine if this level will be filled by user's CEA
                            // Full fill: cumulative CEA <= user's CEA balance
                            // Partial fill: previous cumulative < user's CEA < current cumulative
                            const isFullyFilled = ceaBalance > 0 && cumulativeCea <= ceaBalance;
                            const isPartiallyFilled = ceaBalance > 0 && prevCumulativeCea < ceaBalance && cumulativeCea > ceaBalance;
                            const isFilled = isFullyFilled || isPartiallyFilled;

                            return (
                              <div
                                key={index}
                                className={`grid grid-cols-8 gap-1 px-2 py-1 text-xs hover:bg-navy-700/50 relative ${
                                  canSwap && isFilled
                                    ? 'bg-amber-400/30'
                                    : isFilled
                                      ? 'bg-red-500/10'
                                      : 'bg-red-500/5'
                                }`}
                              >
                                {/* Row background + darker liquidity bar (same theme as Cash Market ask) */}
                                <div
                                  className="absolute inset-0 bg-red-500/15"
                                  style={{ width: `${depthPct}%` }}
                                />
                                <div className="relative text-blue-400 font-mono">
                                  {level.ratio.toFixed(4)}
                                </div>
                                <div className="relative text-right text-white font-mono">
                                  {formatNumber(euaQty, 0)}
                                </div>
                                <div className="relative text-right text-white/70 font-mono">
                                  {formatNumber(cumulativeEua, 0)}
                                </div>
                                <div className="relative text-right text-amber-400 font-mono">
                                  {formatNumber(ceaNeeded, 0)}
                                </div>
                                <div className="relative text-right text-amber-300/70 font-mono">
                                  {formatNumber(cumulativeCea, 0)}
                                </div>
                                <div className="relative text-right text-emerald-400 font-mono">
                                  {formatNumber(eurValue / 1000, 0)}k
                                </div>
                                <div className="relative text-right text-emerald-300/70 font-mono">
                                  {formatNumber(cumulativeEur / 1000000, 1)}M
                                </div>
                                <div className="relative text-right text-navy-400">
                                  {ordersCount}
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        {/* Preview Dialog */}
        {showPreviewDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={closeAllDialogs}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-2xl border border-navy-200 dark:border-navy-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Swap Preview</h3>
                <button onClick={closeAllDialogs} className="text-navy-600 dark:text-navy-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-navy-600 dark:text-navy-400 mb-4">You are about to swap CEA for EUA:</p>

              {/* Visual swap */}
              <div className="bg-navy-100 dark:bg-navy-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🌱</div>
                    <div className="text-amber-400 font-bold font-mono">{formatNumber(ceaBalance, 0)}</div>
                    <div className="text-xs text-navy-500 dark:text-navy-500">CEA</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-emerald-500" />
                  <div className="text-center">
                    <div className="text-3xl mb-1">🇪🇺</div>
                    <div className="text-blue-400 font-bold font-mono">{formatNumber(netEua, 0)}</div>
                    <div className="text-xs text-navy-500 dark:text-navy-500">EUA</div>
                  </div>
                </div>
                <div className="text-center text-blue-400 font-bold font-mono mt-4 bg-blue-400/30 rounded-lg py-2">
                  Average Ratio: {formatNumber(ceaBalance > 0 && orderbook.length > 0 ? weightedAvgRatio : ceaToEuaRate, 4)} EUA
                </div>
              </div>

              <div className="bg-navy-100 dark:bg-navy-800 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">You give</span>
                  <span className="text-amber-400 font-mono">{formatNumber(ceaBalance, 0)} CEA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">You receive</span>
                  <span className="text-white font-mono">{formatNumber(estimatedEuaGross, 0)} EUA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Platform fee</span>
                  <span className="text-emerald-400 font-mono">~{formatCurrency(platformFeeEur)}</span>
                </div>
                <div className="border-t border-navy-200 dark:border-navy-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Net EUA</span>
                    <span className="text-blue-400 font-bold font-mono">{formatNumber(netEua, 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-emerald-200">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-emerald-200/80">
                      <li>• CEA transferred immediately to counterparty</li>
                      <li>• EUA delivery: 10-14 business days</li>
                      <li>• EUA delivered to your EU ETS registry account</li>
                    </ul>
                  </div>
                </div>
              </div>

              {swapError && (
                <AlertBanner variant="error" message={swapError} className="mb-6" />
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeAllDialogs}
                  className="flex-1 py-3 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-300 dark:text-navy-300 hover:bg-navy-100 dark:bg-navy-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToFinal}
                  className="flex-1 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Final Confirmation Dialog */}
        {showFinalDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={closeAllDialogs}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-2xl border border-navy-200 dark:border-navy-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Confirm Swap</h3>
                <button onClick={closeAllDialogs} className="text-navy-600 dark:text-navy-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-navy-600 dark:text-navy-400 mb-4">Please confirm your swap:</p>

              {/* Visual representation */}
              <div className="bg-navy-100 dark:bg-navy-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌱</div>
                    <div className="text-amber-400 font-bold font-mono text-xl">{formatNumber(ceaBalance, 0)}</div>
                    <div className="text-navy-500 dark:text-navy-500 text-sm">CEA (China ETS)</div>
                  </div>
                  <div className="text-emerald-500">
                    <ArrowRight className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🇪🇺</div>
                    <div className="text-blue-400 font-bold font-mono text-xl">{formatNumber(netEua, 0)}</div>
                    <div className="text-navy-500 dark:text-navy-500 text-sm">EUA (EU ETS)</div>
                  </div>
                </div>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-navy-200 dark:border-navy-600 bg-navy-100 dark:bg-navy-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-navy-600 dark:text-navy-400">
                  I understand that my full CEA balance will be transferred, EUA delivery takes 10-14 business days,
                  this swap cannot be reversed once confirmed, and EUA will be used for EU ETS compliance.
                </span>
              </label>

              {swapError && (
                <AlertBanner variant="error" message={swapError} className="mb-6" />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFinalDialog(false);
                    setShowPreviewDialog(true);
                  }}
                  className="flex-1 py-3 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-300 dark:text-navy-300 hover:bg-navy-100 dark:bg-navy-800 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmSwap}
                  disabled={!termsAccepted || isPlacingSwap}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    termsAccepted && !isPlacingSwap
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                      : 'bg-navy-200 dark:bg-navy-700 text-navy-500 dark:text-navy-500 cursor-not-allowed'
                  }`}
                >
                  {isPlacingSwap ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm Swap
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Success Dialog */}
        {showSuccessDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={closeAllDialogs}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-2xl border border-navy-200 dark:border-navy-700 max-w-md w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Swap Initiated!</h3>
              <p className="text-navy-600 dark:text-navy-400 mb-6">Your CEA → EUA swap has been initiated.</p>

              <div className="bg-navy-100 dark:bg-navy-800 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Swap Reference</span>
                  <span className="text-white font-mono">#{swapReference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">CEA Transferred</span>
                  <span className="text-amber-400 font-mono">{formatNumber(ceaBalance, 0)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">EUA to Receive</span>
                  <span className="text-blue-400 font-mono">{formatNumber(netEua, 0)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Ratio (CEA/EUA)</span>
                  <span className="text-white font-mono">{formatNumber(ceaToEuaRate, 4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Status</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Processing
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Expected Delivery</span>
                  <span className="text-white">10-14 business days</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-500 justify-center mb-6">
                <Shield className="w-4 h-4" />
                <span>Confirmation email sent to your address</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    // Refresh user role before navigating away
                    try {
                      const updatedUser = await usersApi.getProfile();
                      const token = sessionStorage.getItem('auth_token');
                      if (token) useAuthStore.getState().setAuth(updatedUser, token);
                    } catch { /* will refresh on next load */ }
                    closeAllDialogs();
                  }}
                  className="flex-1 py-3 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-300 dark:text-navy-300 hover:bg-navy-100 dark:bg-navy-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    // Refresh user role then navigate to dashboard
                    try {
                      const updatedUser = await usersApi.getProfile();
                      const token = sessionStorage.getItem('auth_token');
                      if (token) useAuthStore.getState().setAuth(updatedUser, token);
                    } catch { /* will refresh on next load */ }
                    window.location.href = '/dashboard';
                  }}
                  className="flex-1 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
