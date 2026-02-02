import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeftRight, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../common';
import { cashMarketApi, swapsApi, pricesApi } from '../../services/api';

type MarketType = 'cash' | 'swap';

interface LiquidityStatsProps {
  marketType: MarketType;
}

interface CashMarketStats {
  totalBidEur: number;
  totalAskEur: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
}

interface SwapMarketStats {
  totalSwapValueEur: number;
  bestRatio: number;
  scrappedRatio: number;
  openSwapsCount: number;
}

export function LiquidityStats({ marketType }: LiquidityStatsProps) {
  const [loading, setLoading] = useState(true);
  const [cashStats, setCashStats] = useState<CashMarketStats | null>(null);
  const [swapStats, setSwapStats] = useState<SwapMarketStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCashMarketStats = async () => {
    try {
      // Fetch order book for CEA (main cash market)
      const orderBook = await cashMarketApi.getRealOrderBook('CEA');

      // Calculate total EUR value on bid side (sum of price * quantity for all bids)
      const totalBidEur = orderBook.bids?.reduce((sum, level) => {
        return sum + (level.price * level.quantity);
      }, 0) || 0;

      // Calculate total EUR value on ask side
      const totalAskEur = orderBook.asks?.reduce((sum, level) => {
        return sum + (level.price * level.quantity);
      }, 0) || 0;

      setCashStats({
        totalBidEur,
        totalAskEur,
        bestBid: orderBook.best_bid || 0,
        bestAsk: orderBook.best_ask || 0,
        spread: orderBook.spread || 0,
      });
    } catch (error) {
      console.error('Failed to fetch cash market stats:', error);
    }
  };

  const fetchSwapMarketStats = async () => {
    try {
      // Fetch swap rate (from scrapped prices)
      const rateData = await swapsApi.getRate();

      // Fetch available swaps to calculate total value
      const swapsResponse = await swapsApi.getAvailable({ direction: 'all' });
      const swaps = swapsResponse.data || [];

      // Fetch current prices for EUR conversion
      const prices = await pricesApi.getCurrent();

      // Calculate total value in EUR from all open swaps
      let totalSwapValueEur = 0;
      let bestRatio = 0;

      swaps.forEach(swap => {
        // Convert swap quantity to EUR based on certificate type
        if (swap.from_type === 'EUA') {
          totalSwapValueEur += swap.quantity * (prices.eua?.price || 75);
          // Track best ratio (EUA to CEA)
          if (swap.desired_rate && swap.desired_rate > bestRatio) {
            bestRatio = swap.desired_rate;
          }
        } else {
          totalSwapValueEur += swap.quantity * (prices.cea?.price || 13);
          // Track best ratio (inverse for CEA to EUA)
          if (swap.desired_rate && (1 / swap.desired_rate) > bestRatio) {
            bestRatio = 1 / swap.desired_rate;
          }
        }
      });

      // Scrapped ratio is calculated from actual prices
      const scrappedRatio = rateData.eua_to_cea || (prices.eua?.price || 75) / (prices.cea?.price || 13);

      setSwapStats({
        totalSwapValueEur,
        bestRatio: bestRatio || scrappedRatio,
        scrappedRatio,
        openSwapsCount: swaps.length,
      });
    } catch (error) {
      console.error('Failed to fetch swap market stats:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    if (marketType === 'cash') {
      await fetchCashMarketStats();
    } else {
      await fetchSwapMarketStats();
    }
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [marketType]);

  const formatEur = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRatio = (value: number) => {
    return value.toFixed(4);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300 uppercase tracking-wide">
          {marketType === 'cash' ? 'Cash Market Liquidity' : 'Swap Market Liquidity'}
        </h3>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-1.5 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 transition-colors"
          title="Refresh stats"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {marketType === 'cash' ? (
        <CashMarketStatsContent stats={cashStats} loading={loading} formatEur={formatEur} formatPrice={formatPrice} />
      ) : (
        <SwapMarketStatsContent stats={swapStats} loading={loading} formatEur={formatEur} formatRatio={formatRatio} />
      )}

      {lastUpdated && (
        <p className="text-xs text-navy-400 dark:text-navy-500 mt-3 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}

function CashMarketStatsContent({
  stats,
  loading,
  formatEur,
  formatPrice
}: {
  stats: CashMarketStats | null;
  loading: boolean;
  formatEur: (v: number) => string;
  formatPrice: (v: number) => string;
}) {
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Bid Liquidity */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
            Bid Liquidity
          </span>
        </div>
        <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
          {formatEur(stats?.totalBidEur || 0)}
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          Best Bid: {formatPrice(stats?.bestBid || 0)}
        </p>
      </div>

      {/* Ask Liquidity */}
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg">
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">
            Ask Liquidity
          </span>
        </div>
        <p className="text-xl font-bold text-red-900 dark:text-red-100">
          {formatEur(stats?.totalAskEur || 0)}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Best Ask: {formatPrice(stats?.bestAsk || 0)}
        </p>
      </div>

      {/* Spread Info */}
      {stats && stats.bestBid > 0 && stats.bestAsk > 0 && (
        <div className="col-span-2 p-2 bg-navy-50 dark:bg-navy-800/50 rounded-lg text-center">
          <span className="text-xs text-navy-500 dark:text-navy-400">
            Spread: {formatPrice(stats.spread)} ({((stats.spread / stats.bestAsk) * 100).toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
}

function SwapMarketStatsContent({
  stats,
  loading,
  formatEur,
  formatRatio
}: {
  stats: SwapMarketStats | null;
  loading: boolean;
  formatEur: (v: number) => string;
  formatRatio: (v: number) => string;
}) {
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Swap Value */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
            Total Swap Orders Value
          </span>
        </div>
        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
          {formatEur(stats?.totalSwapValueEur || 0)}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          {stats?.openSwapsCount || 0} open swap requests
        </p>
      </div>

      {/* Ratios */}
      <div className="grid grid-cols-2 gap-3">
        {/* Best Ratio in Market */}
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide block mb-1">
            Best Market Ratio
          </span>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {formatRatio(stats?.bestRatio || 0)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            EUA → CEA
          </p>
        </div>

        {/* Scrapped Ratio */}
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wide block mb-1">
            Scrapped Ratio
          </span>
          <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
            {formatRatio(stats?.scrappedRatio || 0)}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            From live prices
          </p>
        </div>
      </div>

      {/* Ratio Comparison */}
      {stats && stats.bestRatio > 0 && stats.scrappedRatio > 0 && (
        <div className="p-2 bg-navy-50 dark:bg-navy-800/50 rounded-lg text-center">
          <span className="text-xs text-navy-500 dark:text-navy-400">
            {stats.bestRatio > stats.scrappedRatio ? (
              <>Market ratio is <span className="text-emerald-600 dark:text-emerald-400 font-medium">{((stats.bestRatio / stats.scrappedRatio - 1) * 100).toFixed(2)}% better</span> than scrapped</>
            ) : stats.bestRatio < stats.scrappedRatio ? (
              <>Market ratio is <span className="text-red-600 dark:text-red-400 font-medium">{((1 - stats.bestRatio / stats.scrappedRatio) * 100).toFixed(2)}% worse</span> than scrapped</>
            ) : (
              <>Market ratio matches scrapped ratio</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
