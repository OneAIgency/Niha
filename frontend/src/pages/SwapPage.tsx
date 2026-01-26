import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  ArrowRightLeft,
  Calculator,
  TrendingUp,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button, Card, Badge, Input, Subheader } from '../components/common';
import { BlurOverlay } from '../components/common/BlurOverlay';
import { swapsApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';
import { cn, formatCurrency, formatQuantity, formatRelativeTime } from '../utils';
import type { SwapRequest, SwapCalculation } from '../types';

export function SwapPage() {
  const { user } = useAuthStore();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapStats, setSwapStats] = useState<any>(null);
  const [swapRate, setSwapRate] = useState<any>(null);

  // Calculator state
  const [calcFromType, setCalcFromType] = useState<'EUA' | 'CEA'>('EUA');
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcResult, setCalcResult] = useState<SwapCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  const isBlurred = user?.role === 'APPROVED';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [swapsRes, statsRes, rateRes] = await Promise.all([
          swapsApi.getAvailable({ per_page: 10 }),
          swapsApi.getStats(),
          swapsApi.getRate(),
        ]);
        setSwaps(swapsRes.data);
        setSwapStats(statsRes);
        setSwapRate(rateRes);
      } catch (err) {
        console.error('Failed to fetch swap data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCalculate = async () => {
    if (!calcAmount || parseFloat(calcAmount) <= 0) return;

    setCalculating(true);
    try {
      const result = await swapsApi.calculate(calcFromType, parseFloat(calcAmount));
      setCalcResult(result);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  const toggleCalcType = () => {
    setCalcFromType(calcFromType === 'EUA' ? 'CEA' : 'EUA');
    setCalcResult(null);
  };

  return (
    <div className="min-h-screen bg-navy-950 relative">
      {/* Blur Overlay for Approved (unfunded) users */}
      <BlurOverlay
        show={isBlurred}
        title="Account Not Funded"
        message="Fund your account to access the Swap Center and exchange certificates. Contact our support team to complete your account setup."
      />

      <Subheader
        icon={<ArrowRightLeft className="w-5 h-5 text-violet-500" />}
        title="Swap Center"
        description="Exchange EUA and CEA certificates at competitive OTC rates"
        iconBg="bg-violet-500/20"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card padding="sm" className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-900 dark:text-white">
                  {swapStats?.open_swaps || '--'}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Open Swaps</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold font-mono text-navy-900 dark:text-white">
                  {swapRate?.eua_to_cea?.toFixed(2) || '--'}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">1 EUA = CEA</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-900 dark:text-white">
                  {swapStats?.matched_today || '--'}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Matched Today</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-900 dark:text-white">0.5%</p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Platform Fee</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-500" />
                Swap Calculator
              </h2>

              <div className="space-y-6">
                {/* From */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    You Send
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1"
                    />
                    <button
                      onClick={toggleCalcType}
                      className={cn(
                        'px-4 py-2 rounded-xl font-bold text-sm transition-colors',
                        calcFromType === 'EUA'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      )}
                    >
                      {calcFromType}
                    </button>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <button
                    onClick={toggleCalcType}
                    className="p-3 bg-navy-100 dark:bg-navy-700 rounded-full hover:bg-navy-200 dark:hover:bg-navy-600 transition-colors"
                  >
                    <ArrowRightLeft className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                  </button>
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    You Receive
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-navy-50 dark:bg-navy-700 rounded-xl font-mono font-semibold text-lg text-navy-900 dark:text-white">
                      {calcResult
                        ? formatQuantity(calcResult.output.quantity)
                        : '---'}
                    </div>
                    <div
                      className={cn(
                        'px-4 py-2 rounded-xl font-bold text-sm flex items-center',
                        calcFromType === 'CEA'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      )}
                    >
                      {calcFromType === 'EUA' ? 'CEA' : 'EUA'}
                    </div>
                  </div>
                </div>

                {/* Rate Info */}
                {calcResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm space-y-2"
                  >
                    <div className="flex justify-between">
                      <span className="text-navy-600 dark:text-navy-300">Exchange Rate</span>
                      <span className="font-mono font-semibold text-navy-900 dark:text-white">
                        1 {calcFromType} = {calcResult.rate.toFixed(4)}{' '}
                        {calcFromType === 'EUA' ? 'CEA' : 'EUA'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-600 dark:text-navy-300">Platform Fee</span>
                      <span className="font-mono text-navy-900 dark:text-white">
                        {formatCurrency(calcResult.fee_usd * 0.93, 'EUR')} (0.5%)
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="font-medium text-navy-900 dark:text-white">You'll Receive</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatQuantity(calcResult.output.quantity)}{' '}
                        {calcFromType === 'EUA' ? 'CEA' : 'EUA'}
                      </span>
                    </div>
                  </motion.div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleCalculate}
                  loading={calculating}
                >
                  Calculate Swap
                </Button>

                <p className="text-xs text-navy-500 dark:text-navy-400 text-center flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" />
                  Rates update in real-time
                </p>
              </div>
            </Card>
          </div>

          {/* Active Swaps */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                  Active Swap Requests
                </h2>
                <div className="flex gap-2">
                  <Badge variant="info">EUA → CEA: {swapStats?.eua_to_cea_requests || 0}</Badge>
                  <Badge variant="warning">CEA → EUA: {swapStats?.cea_to_eua_requests || 0}</Badge>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4 p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                      <div className="w-16 h-16 bg-navy-100 dark:bg-navy-600 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/4" />
                        <div className="h-6 bg-navy-100 dark:bg-navy-600 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {swaps.map((swap, index) => (
                    <motion.div
                      key={swap.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors cursor-pointer group"
                    >
                      {/* Swap Visual */}
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold',
                            swap.from_type === 'EUA'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {swap.from_type}
                        </div>
                        <ChevronRight className="w-4 h-4 text-navy-400" />
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold',
                            swap.to_type === 'EUA'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {swap.to_type}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <p className="font-mono text-sm text-navy-500 dark:text-navy-400">
                          {swap.anonymous_code}
                        </p>
                        <p className="font-semibold text-navy-900 dark:text-white">
                          {formatQuantity(swap.quantity)} {swap.from_type} →{' '}
                          {formatQuantity(swap.equivalent_quantity)} {swap.to_type}
                        </p>
                      </div>

                      {/* Rate & Time */}
                      <div className="text-right">
                        <p className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                          Rate: {swap.desired_rate.toFixed(4)}
                        </p>
                        <p className="text-xs text-navy-400 dark:text-navy-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(swap.created_at)}
                        </p>
                      </div>

                      {/* Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Match
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create Swap CTA */}
              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-1">
                      Create a Swap Request
                    </h3>
                    <p className="text-sm text-navy-600 dark:text-navy-300">
                      List your certificates and get matched with counterparties
                    </p>
                  </div>
                  <Button variant="primary">
                    Create Swap
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
