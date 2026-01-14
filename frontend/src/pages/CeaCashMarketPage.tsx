import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Shield
} from 'lucide-react';
import { cashMarketApi } from '../services/api';
import type { OrderBook, CashMarketTrade } from '../types';

// Conversion rate CNY to EUR (approximate)
const CNY_TO_EUR = 0.127;

// Convert CNY price to EUR for display
const toEur = (cnyPrice: number) => cnyPrice * CNY_TO_EUR;

// Types for order preview
interface OrderPreview {
  fills: Array<{
    seller_code: string;
    price: number;
    quantity: number;
    cost: number;
  }>;
  total_quantity: number;
  total_cost_gross: number;
  weighted_avg_price: number;
  best_price: number | null;
  worst_price: number | null;
  platform_fee_rate: number;
  platform_fee_amount: number;
  total_cost_net: number;
  net_price_per_unit: number;
  available_balance: number;
  remaining_balance: number;
  can_execute: boolean;
  execution_message: string;
  partial_fill: boolean;
}

interface UserBalances {
  entity_id: string | null;
  eur_balance: number;
  cea_balance: number;
  eua_balance: number;
}

export function CeaCashMarketPage() {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [recentTrades, setRecentTrades] = useState<CashMarketTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real user balances from API
  const [userBalance, setUserBalance] = useState<UserBalances>({
    entity_id: null,
    eur_balance: 0,
    cea_balance: 0,
    eua_balance: 0,
  });

  // Order preview from API
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Confirmation dialog states
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [executionResult, setExecutionResult] = useState<{
    total_quantity: number;
    total_cost_net: number;
    trades: Array<{ seller_code: string; quantity: number; price: number }>;
  } | null>(null);

  // Fetch market data and user balances
  const fetchData = useCallback(async () => {
    try {
      const [orderBookData, tradesData, balances] = await Promise.all([
        cashMarketApi.getRealOrderBook('CEA'),
        cashMarketApi.getRecentTrades('CEA', 20),
        cashMarketApi.getUserBalances(),
      ]);
      setOrderBook(orderBookData);
      setRecentTrades(tradesData);
      setUserBalance(balances);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch order preview when balance changes
  const fetchPreview = useCallback(async () => {
    if (userBalance.eur_balance <= 0) {
      setOrderPreview(null);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const preview = await cashMarketApi.previewOrder({
        certificate_type: 'CEA',
        side: 'BUY',
        amount_eur: userBalance.eur_balance,
        order_type: 'MARKET',
        all_or_none: false,
      });
      setOrderPreview(preview);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setOrderPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [userBalance.eur_balance]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch preview when balance changes
  useEffect(() => {
    if (userBalance.eur_balance > 0) {
      fetchPreview();
    }
  }, [userBalance.eur_balance, fetchPreview]);

  // Format helpers
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number, currency = '€') => {
    return `${currency}${formatNumber(amount)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  // Handle buy flow
  const handleBuyClick = async () => {
    if (userBalance.eur_balance <= 0 || !orderPreview?.can_execute) return;

    // Refresh preview before showing dialog
    await fetchPreview();
    setShowPreviewDialog(true);
  };

  const handleContinueToFinal = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(true);
    setTermsAccepted(false);
  };

  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const result = await cashMarketApi.executeMarketOrder({
        certificate_type: 'CEA',
        side: 'BUY',
        amount_eur: userBalance.eur_balance,
        all_or_none: false,
      });

      if (result.success) {
        // Store execution result for success dialog
        setExecutionResult({
          total_quantity: result.total_quantity,
          total_cost_net: result.total_cost_net,
          trades: result.trades,
        });

        // Generate order reference
        const ref = result.order_id
          ? `CEA-${result.order_id.slice(0, 8).toUpperCase()}`
          : `CEA-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        setOrderReference(ref);

        // Update local balances
        setUserBalance({
          ...userBalance,
          eur_balance: result.eur_balance,
          cea_balance: result.certificate_balance,
        });

        setShowFinalDialog(false);
        setShowSuccessDialog(true);

        // Refresh data to update order book
        fetchData();
      } else {
        console.error('Order failed:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to execute order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const closeAllDialogs = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(false);
    setShowSuccessDialog(false);
    setTermsAccepted(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CEA Cash Market</h1>
                <p className="text-sm text-slate-400">China Emission Allowances</p>
              </div>
            </div>

            {/* Stats - All prices displayed in EUR */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-400 mr-2">Last</span>
                <span className="font-bold font-mono text-white text-lg">
                  €{formatNumber(toEur(orderBook?.last_price || 0))}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400">24h</span>
                {orderBook && (
                  <span className={`flex items-center font-semibold ${
                    orderBook.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {orderBook.change_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {orderBook.change_24h >= 0 ? '+' : ''}{orderBook.change_24h.toFixed(2)}%
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 mr-2">Vol</span>
                <span className="font-semibold text-slate-300 font-mono">
                  {orderBook ? formatVolume(orderBook.volume_24h) : '-'}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchData}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {isLoading && !orderBook ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Order Book */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h2 className="font-semibold text-white">Order Book</h2>
                </div>

                <div className="p-4">
                  {/* Column Headers */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center text-sm font-medium text-slate-500">
                      BID (Buyers)
                    </div>
                    <div className="text-center text-sm font-medium text-slate-500">
                      ASK (Sellers)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Bids Column - Empty for users */}
                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 grid grid-cols-2 px-2 mb-2">
                        <span>Qty</span>
                        <span className="text-right">Price</span>
                      </div>
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-slate-600 text-sm text-center">
                          No bids<br />
                          <span className="text-xs">(Users can only buy)</span>
                        </p>
                      </div>
                    </div>

                    {/* Asks Column - AI Sellers */}
                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 grid grid-cols-2 px-2 mb-2">
                        <span>Price</span>
                        <span className="text-right">Qty</span>
                      </div>
                      <div className="space-y-1 h-64 overflow-y-auto">
                        {orderBook?.asks.slice(0, 10).map((ask, idx) => {
                          const maxQty = Math.max(...(orderBook?.asks.map(a => a.quantity) || [1]));
                          const depthPercent = (ask.quantity / maxQty) * 100;

                          return (
                            <div
                              key={idx}
                              className="relative grid grid-cols-2 px-2 py-1.5 rounded text-sm"
                            >
                              {/* Depth bar */}
                              <div
                                className="absolute inset-y-0 right-0 bg-red-500/10 rounded"
                                style={{ width: `${depthPercent}%` }}
                              />
                              <span className="relative font-mono text-red-400">
                                €{formatNumber(toEur(ask.price))}
                              </span>
                              <span className="relative text-right text-slate-300 font-mono">
                                {formatNumber(ask.quantity, 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Spread */}
                  <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                    <span className="text-slate-500 text-sm">Spread: </span>
                    <span className="text-white font-mono">
                      €{formatNumber(toEur(orderBook?.spread || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Panel */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h2 className="font-semibold text-white">Buy CEA</h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Available Balances */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Available Balance</span>
                      <span className="text-xs text-slate-500">EUR</span>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                      {formatCurrency(userBalance.eur_balance)}
                    </div>
                    {userBalance.cea_balance > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-sm">
                        <span className="text-slate-400">CEA Holdings</span>
                        <span className="text-amber-400 font-mono">{formatNumber(userBalance.cea_balance, 0)} tonnes</span>
                      </div>
                    )}
                  </div>

                  {/* Order Preview */}
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">Order Preview</h3>
                      {isLoadingPreview && (
                        <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                      )}
                    </div>

                    {orderPreview ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Avg Price</span>
                          <span className="text-white font-mono">€{formatNumber(orderPreview.weighted_avg_price, 4)}/t</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Amount</span>
                          <span className="text-white font-mono">{formatCurrency(userBalance.eur_balance)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">CEA Quantity</span>
                          <span className="text-white font-mono">{formatNumber(orderPreview.total_quantity, 2)} CEA</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Platform Fee (0.5%)</span>
                          <span className="text-amber-400 font-mono">{formatCurrency(orderPreview.platform_fee_amount)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Total Cost</span>
                          <span className="text-white font-mono">{formatCurrency(orderPreview.total_cost_net)}</span>
                        </div>

                        {orderPreview.fills.length > 1 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Sellers</span>
                            <span className="text-slate-300">{orderPreview.fills.length} sellers</span>
                          </div>
                        )}

                        <div className="border-t border-slate-700 pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-300 font-medium">Net Price/CEA</span>
                            <span className="text-xl font-bold text-amber-400 font-mono">
                              €{formatNumber(orderPreview.net_price_per_unit, 4)}
                            </span>
                          </div>
                        </div>

                        {!orderPreview.can_execute && (
                          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-xs flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              {orderPreview.execution_message}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500 text-sm">
                        {userBalance.eur_balance > 0 ? 'Loading preview...' : 'No balance available'}
                      </div>
                    )}
                  </div>

                  {/* Buy Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBuyClick}
                    disabled={userBalance.eur_balance <= 0 || !orderPreview?.can_execute}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      userBalance.eur_balance > 0 && orderPreview?.can_execute
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Leaf className="w-5 h-5" />
                      <span>BUY CEA - FULL BALANCE</span>
                    </div>
                    {orderPreview && orderPreview.can_execute && (
                      <div className="text-sm font-normal mt-1 opacity-80">
                        {formatCurrency(userBalance.eur_balance)} → {formatNumber(orderPreview.total_quantity, 2)} CEA
                      </div>
                    )}
                  </motion.button>

                  {/* Info Note */}
                  <div className="flex items-start gap-3 text-xs text-slate-500">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      100% payment upfront. Funds secured in Nihao client account with HSBC.
                      CEA delivery: 10-30 business days via China ETS registry.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h2 className="font-semibold text-white">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left px-4 py-2 font-medium">Time</th>
                        <th className="text-left px-4 py-2 font-medium">Type</th>
                        <th className="text-right px-4 py-2 font-medium">Quantity</th>
                        <th className="text-right px-4 py-2 font-medium">Price</th>
                        <th className="text-right px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.slice(0, 5).map((trade) => (
                        <tr key={trade.id} className="border-b border-slate-800/50">
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(trade.executed_at).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-400">BUY</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-white">
                            {formatNumber(trade.quantity, 0)} CEA
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">
                            €{formatNumber(toEur(trade.price))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-emerald-400 text-xs">✓ Done</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Order Preview</h3>
                <button onClick={closeAllDialogs} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-400 mb-4">You are about to purchase CEA certificates:</p>

              {orderPreview && (
                <div className="bg-slate-800 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white font-mono font-bold">{formatCurrency(userBalance.eur_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Price per tonne</span>
                    <span className="text-white font-mono">€{formatNumber(orderPreview.weighted_avg_price, 4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CEA Quantity</span>
                    <span className="text-white font-mono">{formatNumber(orderPreview.total_quantity, 2)} CEA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform fee (0.5%)</span>
                    <span className="text-amber-400 font-mono">{formatCurrency(orderPreview.platform_fee_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Cost</span>
                    <span className="text-white font-mono">{formatCurrency(orderPreview.total_cost_net)}</span>
                  </div>

                  {/* Seller breakdown */}
                  {orderPreview.fills.length > 0 && (
                    <div className="border-t border-slate-700 pt-3 mt-3">
                      <div className="text-xs text-slate-500 mb-2">Seller Breakdown ({orderPreview.fills.length} sellers)</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {orderPreview.fills.map((fill, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-400">{fill.seller_code}</span>
                            <span className="text-slate-300 font-mono">
                              {formatNumber(fill.quantity, 2)} @ €{formatNumber(fill.price, 4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">Net Price/CEA</span>
                      <span className="text-amber-400 font-bold font-mono">€{formatNumber(orderPreview.net_price_per_unit, 4)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-amber-200/80">
                      <li>• 100% payment upfront - funds locked in client account</li>
                      <li>• Estimated delivery: 10-30 business days</li>
                      <li>• CEA delivered to your China ETS custody account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeAllDialogs}
                  className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToFinal}
                  className="flex-1 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
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
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Confirm Order</h3>
                <button onClick={closeAllDialogs} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-400 mb-4">Please confirm your order:</p>

              {/* Visual representation */}
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">💶</div>
                    <div className="text-white font-bold font-mono">{formatCurrency(orderPreview?.total_cost_net || 0)}</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-amber-500" />
                  <div className="text-center">
                    <div className="text-3xl mb-1">🌱</div>
                    <div className="text-amber-400 font-bold font-mono">{formatNumber(orderPreview?.total_quantity || 0, 2)} CEA</div>
                  </div>
                </div>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-400">
                  I understand that my full balance will be locked, delivery takes 10-30 business days,
                  and this order cannot be cancelled once confirmed.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFinalDialog(false);
                    setShowPreviewDialog(true);
                  }}
                  className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={!termsAccepted || isPlacingOrder}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    termsAccepted && !isPlacingOrder
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isPlacingOrder ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm Order
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
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Order Executed!</h3>
              <p className="text-slate-400 mb-6">Your CEA purchase has been completed.</p>

              <div className="bg-slate-800 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Order Reference</span>
                  <span className="text-white font-mono">#{orderReference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="text-white font-mono">{formatCurrency(executionResult?.total_cost_net || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">CEA Purchased</span>
                  <span className="text-amber-400 font-mono">{formatNumber(executionResult?.total_quantity || 0, 2)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sellers</span>
                  <span className="text-white">{executionResult?.trades.length || 0} sellers matched</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">New CEA Balance</span>
                  <span className="text-amber-400 font-mono">{formatNumber(userBalance.cea_balance, 2)} tonnes</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 justify-center mb-6">
                <Shield className="w-4 h-4" />
                <span>Confirmation email sent to your address</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeAllDialogs}
                  className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  View Order
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
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
