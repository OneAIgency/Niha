import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '../../utils';
import type { Prices } from '../../types';

interface PriceTickerProps {
  prices: Prices | null;
  variant?: 'compact' | 'full';
}

export function PriceTicker({ prices, variant = 'full' }: PriceTickerProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (prices) {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [prices?.updated_at]);

  if (!prices) {
    return (
      <div className="flex items-center gap-8">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-4 w-20 bg-navy-200 dark:bg-navy-700 rounded"></div>
          <div className="h-6 w-24 bg-navy-200 dark:bg-navy-700 rounded"></div>
        </div>
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-4 w-20 bg-navy-200 dark:bg-navy-700 rounded"></div>
          <div className="h-6 w-24 bg-navy-200 dark:bg-navy-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-500';
    if (change < 0) return 'text-red-500';
    return 'text-navy-400';
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">EUA</span>
          <span className={cn('font-mono font-bold text-navy-900 dark:text-white', animate && 'animate-pulse')}>
            {formatCurrency(prices.eua.price, 'EUR')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">CEA</span>
          <span className={cn('font-mono font-bold text-navy-900 dark:text-white', animate && 'animate-pulse')}>
            {formatCurrency(prices.cea.price_eur || prices.cea.price * 0.127, 'EUR')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      {/* EUA Price */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            EU Allowances
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
              EUA
            </span>
            <span
              className={cn(
                'font-mono text-xl font-bold text-navy-900 dark:text-white',
                animate && 'animate-pulse'
              )}
            >
              {formatCurrency(prices.eua.price, 'EUR')}
            </span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1', getChangeColor(prices.eua.change_24h))}>
          {getTrendIcon(prices.eua.change_24h)}
          <span className="text-sm font-medium">
            {formatPercent(prices.eua.change_24h)}
          </span>
        </div>
      </div>

      <div className="w-px h-10 bg-navy-200 dark:bg-navy-700" />

      {/* CEA Price */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            China Allowances
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded">
              CEA
            </span>
            <span
              className={cn(
                'font-mono text-xl font-bold text-navy-900 dark:text-white',
                animate && 'animate-pulse'
              )}
            >
              {formatCurrency(prices.cea.price_eur || prices.cea.price * 0.127, 'EUR')}
            </span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1', getChangeColor(prices.cea.change_24h))}>
          {getTrendIcon(prices.cea.change_24h)}
          <span className="text-sm font-medium">
            {formatPercent(prices.cea.change_24h)}
          </span>
        </div>
      </div>

      <div className="w-px h-10 bg-navy-200 dark:bg-navy-700" />

      {/* Swap Rate */}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
          Swap Rate
        </span>
        <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
          1 EUA = {prices.swap_rate.toFixed(2)} CEA
        </span>
      </div>
    </div>
  );
}
