import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
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
import { swapsApi } from '../services/api';
import { Subheader } from '../components/common';

// Mock user balance - in production this would come from API
const MOCK_USER_BALANCE = {
  eur: 0,
  cea: 443014,  // User has bought CEA and now wants to swap
  eua: 0,
};

// Mock swap offers from AI agents
const MOCK_SWAP_OFFERS = [
  { ratio: 11.2, euaAvailable: 50000 },
  { ratio: 11.3, euaAvailable: 80000 },
  { ratio: 11.4, euaAvailable: 120000 },
  { ratio: 11.5, euaAvailable: 200000 },
  { ratio: 11.6, euaAvailable: 150000 },
];

export function CeaSwapMarketPage() {
  const [swapOffers] = useState(MOCK_SWAP_OFFERS);
  const [swapRate, setSwapRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance] = useState(MOCK_USER_BALANCE);
  const [rateChange24h] = useState(0.8);

  // Confirmation dialog states
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isPlacingSwap, setIsPlacingSwap] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [swapReference, setSwapReference] = useState('');

  // Fetch swap rate
  const fetchData = useCallback(async () => {
    try {
      const rateData = await swapsApi.getRate();
      // cea_to_eua is the ratio of CEA per EUA (e.g., 11.2 CEA = 1 EUA)
      setSwapRate(rateData.cea_to_eua || 11.2);
    } catch (error) {
      console.error('Error fetching swap rate:', error);
      // Use mock rate if API fails
      setSwapRate(11.2);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Best available ratio (lowest is better for user)
  const bestRatio = swapOffers.length > 0 ? swapOffers[0].ratio : (swapRate || 11.2);

  // Calculate swap details
  const ceaToSwap = userBalance.cea;
  const estimatedEua = ceaToSwap > 0 ? Math.floor(ceaToSwap / bestRatio) : 0;
  const platformFeeEua = Math.floor(estimatedEua * 0.005); // 0.5% fee in EUA
  const netEua = estimatedEua - platformFeeEua;
  const euaValueEur = netEua * 80; // Approximate EUR value at €80/EUA

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

  // Handle swap flow
  const handleSwapClick = () => {
    if (userBalance.cea <= 0) return;
    setShowPreviewDialog(true);
  };

  const handleContinueToFinal = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(true);
    setTermsAccepted(false);
  };

  const handleConfirmSwap = async () => {
    setIsPlacingSwap(true);
    try {
      // In production, this would call the actual swap API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate swap reference
      const ref = `SWAP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      setSwapReference(ref);

      setShowFinalDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error placing swap:', error);
    } finally {
      setIsPlacingSwap(false);
    }
  };

  const closeAllDialogs = () => {
    setShowPreviewDialog(false);
    setShowFinalDialog(false);
    setShowSuccessDialog(false);
    setTermsAccepted(false);
  };

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Subheader */}
      <Subheader
        icon={<ArrowRightLeft className="w-5 h-5 text-violet-500" />}
        title="Swap"
        description="Exchange CEA for EU Allowances"
        iconBg="bg-violet-500/20"
      >
        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">Best Ratio</span>
          <span className="font-bold font-mono text-white text-lg">
            1:{formatNumber(bestRatio, 1)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-navy-600 dark:text-navy-400">24h</span>
          <span className={`flex items-center font-semibold ${
            rateChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {rateChange24h >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {rateChange24h >= 0 ? '+' : ''}{rateChange24h.toFixed(2)}%
          </span>
        </div>

        <div>
          <span className="text-navy-600 dark:text-navy-400 mr-2">24h Swaps</span>
          <span className="font-semibold text-navy-300 dark:text-navy-300 font-mono">12</span>
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
            <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
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
                    {formatNumber(ceaToSwap, 0)}
                  </div>
                  <div className="text-navy-600 dark:text-navy-400 text-sm">CEA (You give)</div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="w-12 h-12 text-violet-500" />
                  </motion.div>
                  <div className="text-navy-500 dark:text-navy-500 text-sm mt-2">1 EUA = {bestRatio} CEA</div>
                </div>

                {/* EUA Side */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🇪🇺</span>
                  </div>
                  <div className="text-blue-400 font-bold font-mono text-2xl">
                    {formatNumber(netEua, 0)}
                  </div>
                  <div className="text-navy-600 dark:text-navy-400 text-sm">EUA (You get)</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Swap Offers */}
              <div className="col-span-12 lg:col-span-5">
                <div className="content_wrapper_last">
                  <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
                    <h2 className="font-semibold text-white">Available Swap Offers</h2>
                    <p className="text-xs text-navy-500 dark:text-navy-500">AI Agent Providers</p>
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-navy-600 dark:text-navy-600 grid grid-cols-3 px-2 mb-2">
                      <span>Ratio</span>
                      <span className="text-center">EUA Available</span>
                      <span className="text-right">Depth</span>
                    </div>

                    <div className="space-y-1">
                      {swapOffers.map((offer, idx) => {
                        const maxEua = Math.max(...swapOffers.map(o => o.euaAvailable));
                        const depthPercent = (offer.euaAvailable / maxEua) * 100;
                        const isBest = idx === 0;

                        return (
                          <div
                            key={idx}
                            className={`relative grid grid-cols-3 px-2 py-2.5 rounded text-sm ${
                              isBest ? 'bg-violet-500/10 border border-violet-500/30' : ''
                            }`}
                          >
                            {/* Depth bar */}
                            <div
                              className="absolute inset-y-0 right-0 bg-blue-500/10 rounded"
                              style={{ width: `${depthPercent}%` }}
                            />
                            <span className={`relative font-mono ${isBest ? 'text-violet-400 font-bold' : 'text-navy-300 dark:text-navy-300'}`}>
                              1:{offer.ratio}
                              {isBest && <span className="ml-2 text-xs text-violet-400">BEST</span>}
                            </span>
                            <span className="relative text-center text-navy-300 dark:text-navy-300 font-mono">
                              {formatNumber(offer.euaAvailable, 0)}
                            </span>
                            <span className="relative text-right text-navy-500 dark:text-navy-500">
                              {'█'.repeat(Math.ceil(depthPercent / 20))}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-navy-200 dark:border-navy-700 text-xs text-navy-500 dark:text-navy-500">
                      Lower ratio = better for you (less CEA per EUA)
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Panel */}
              <div className="col-span-12 lg:col-span-7">
                <div className="content_wrapper_last">
                  <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
                    <h2 className="font-semibold text-white">Your Swap</h2>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* CEA Balance */}
                    <div className="bg-navy-100 dark:bg-navy-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-navy-600 dark:text-navy-400">Your CEA Balance</span>
                        <Leaf className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-3xl font-bold text-amber-400 font-mono">
                        {formatNumber(userBalance.cea, 0)} tonnes
                      </div>
                    </div>

                    {/* Swap Preview */}
                    <div className="bg-navy-100 dark:bg-navy-800/50 rounded-lg p-4 space-y-3">
                      <h3 className="font-medium text-white mb-3">Swap Preview</h3>

                      <div className="flex justify-between text-sm">
                        <span className="text-navy-600 dark:text-navy-400">You give</span>
                        <span className="text-amber-400 font-mono font-bold">{formatNumber(ceaToSwap, 0)} CEA</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-navy-600 dark:text-navy-400">Ratio (best available)</span>
                        <span className="text-white font-mono">1:{bestRatio}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-navy-600 dark:text-navy-400">You receive</span>
                        <span className="text-white font-mono">{formatNumber(estimatedEua, 0)} EUA</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-navy-600 dark:text-navy-400">Platform Fee (0.5%)</span>
                        <span className="text-violet-400 font-mono">{formatNumber(platformFeeEua, 0)} EUA</span>
                      </div>

                      <div className="border-t border-navy-200 dark:border-navy-700 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-navy-300 dark:text-navy-300 font-medium">Net EUA</span>
                          <span className="text-xl font-bold text-blue-400 font-mono">
                            {formatNumber(netEua, 0)} EUA
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-navy-500 dark:text-navy-500">Estimated Value</span>
                          <span className="text-navy-600 dark:text-navy-400 font-mono">~{formatCurrency(euaValueEur)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSwapClick}
                      disabled={userBalance.cea <= 0}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        userBalance.cea > 0
                          ? 'bg-gradient-to-r from-amber-500 to-blue-500 hover:from-amber-400 hover:to-blue-400 text-white'
                          : 'bg-navy-200 dark:bg-navy-700 text-navy-500 dark:text-navy-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <ArrowRightLeft className="w-5 h-5" />
                        <span>SWAP CEA → EUA - FULL BALANCE</span>
                      </div>
                      <div className="text-sm font-normal mt-1 opacity-80">
                        {formatNumber(ceaToSwap, 0)} CEA → {formatNumber(netEua, 0)} EUA
                      </div>
                    </motion.button>

                    {/* Info Note */}
                    <div className="flex items-start gap-3 text-xs text-navy-500 dark:text-navy-500">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Your CEA will be transferred immediately. EUA delivery: 10-14 business days
                        via EU ETS registry. This swap cannot be reversed once confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Swaps */}
            <div className="content_wrapper_last">
              <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
                <h2 className="font-semibold text-white">Recent Swaps</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-navy-500 dark:text-navy-500 border-b border-navy-200 dark:border-navy-700">
                      <th className="text-left px-4 py-2 font-medium">Time</th>
                      <th className="text-right px-4 py-2 font-medium">CEA Given</th>
                      <th className="text-right px-4 py-2 font-medium">EUA Received</th>
                      <th className="text-right px-4 py-2 font-medium">Ratio</th>
                      <th className="text-right px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { time: '14:32:05', cea: 500000, eua: 44642, ratio: 11.2, status: 'complete' },
                      { time: '13:15:22', cea: 250000, eua: 22123, ratio: 11.3, status: 'complete' },
                      { time: '12:45:10', cea: 1000000, eua: 88495, ratio: 11.3, status: 'pending' },
                      { time: '11:20:45', cea: 750000, eua: 66964, ratio: 11.2, status: 'complete' },
                    ].map((swap, idx) => (
                      <tr key={idx} className="border-b border-navy-200 dark:border-navy-700/50">
                        <td className="px-4 py-3 text-navy-600 dark:text-navy-400">{swap.time}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400">
                          {formatNumber(swap.cea, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">
                          {formatNumber(swap.eua, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-navy-300 dark:text-navy-300">
                          1:{swap.ratio}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {swap.status === 'complete' ? (
                            <span className="text-emerald-400 text-xs">✓ Complete</span>
                          ) : (
                            <span className="text-amber-400 text-xs flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <div className="text-amber-400 font-bold font-mono">{formatNumber(ceaToSwap, 0)}</div>
                    <div className="text-xs text-navy-500 dark:text-navy-500">CEA</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-violet-500" />
                  <div className="text-center">
                    <div className="text-3xl mb-1">🇪🇺</div>
                    <div className="text-blue-400 font-bold font-mono">{formatNumber(netEua, 0)}</div>
                    <div className="text-xs text-navy-500 dark:text-navy-500">EUA</div>
                  </div>
                </div>
                <div className="text-center text-sm text-navy-500 dark:text-navy-500 mt-4">
                  Ratio: 1 EUA = {bestRatio} CEA
                </div>
              </div>

              <div className="bg-navy-100 dark:bg-navy-800 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">You give</span>
                  <span className="text-amber-400 font-mono">{formatNumber(ceaToSwap, 0)} CEA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">You receive</span>
                  <span className="text-white font-mono">{formatNumber(estimatedEua, 0)} EUA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Platform fee</span>
                  <span className="text-violet-400 font-mono">{formatNumber(platformFeeEua, 0)} EUA</span>
                </div>
                <div className="border-t border-navy-200 dark:border-navy-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Net EUA</span>
                    <span className="text-blue-400 font-bold font-mono">{formatNumber(netEua, 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-navy-500 dark:text-navy-500">Value</span>
                    <span className="text-navy-600 dark:text-navy-400">~{formatCurrency(euaValueEur)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-violet-200">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-violet-200/80">
                      <li>• CEA transferred immediately to counterparty</li>
                      <li>• EUA delivery: 10-14 business days</li>
                      <li>• EUA delivered to your EU ETS registry account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeAllDialogs}
                  className="flex-1 py-3 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-300 dark:text-navy-300 hover:bg-navy-100 dark:bg-navy-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToFinal}
                  className="flex-1 py-3 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-400 transition-colors flex items-center justify-center gap-2"
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
                    <div className="text-amber-400 font-bold font-mono text-xl">{formatNumber(ceaToSwap, 0)}</div>
                    <div className="text-navy-500 dark:text-navy-500 text-sm">CEA (China ETS)</div>
                  </div>
                  <div className="text-violet-500">
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
                  className="mt-1 w-4 h-4 rounded border-navy-200 dark:border-navy-600 bg-navy-100 dark:bg-navy-800 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-sm text-navy-600 dark:text-navy-400">
                  I understand that my full CEA balance will be transferred, EUA delivery takes 10-14 business days,
                  this swap cannot be reversed once confirmed, and EUA will be used for EU ETS compliance.
                </span>
              </label>

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
                  <span className="text-amber-400 font-mono">{formatNumber(ceaToSwap, 0)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">EUA to Receive</span>
                  <span className="text-blue-400 font-mono">{formatNumber(netEua, 0)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Ratio</span>
                  <span className="text-white font-mono">1:{bestRatio}</span>
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
                  onClick={closeAllDialogs}
                  className="flex-1 py-3 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-300 dark:text-navy-300 hover:bg-navy-100 dark:bg-navy-800 transition-colors"
                >
                  View Swap
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 py-3 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-400 transition-colors"
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
