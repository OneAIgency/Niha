import { TrendingUp, TrendingDown } from 'lucide-react';

interface OrderBookSpreadIndicatorProps {
  bestBid: number | null | undefined;
  bestAsk: number | null | undefined;
  spread: number | null | undefined;
}

export function OrderBookSpreadIndicator({ bestBid, bestAsk, spread }: OrderBookSpreadIndicatorProps) {
  // Handle null/undefined values
  const safeBid = bestBid ?? 0;
  const safeAsk = bestAsk ?? 0;
  const safeSpread = spread ?? 0;

  const midpoint = (safeBid + safeAsk) / 2;
  const spreadPercentage = midpoint > 0 ? ((safeSpread / midpoint) * 100).toFixed(2) : '0.00';

  return (
    <div className="border-y-2 border-navy-300 dark:border-navy-600 bg-gradient-to-r from-emerald-50 via-navy-50 to-red-50 dark:from-emerald-900/20 dark:via-navy-800 dark:to-red-900/20">
      <div className="grid grid-cols-2 px-4 py-3">
        {/* Best Bid (Left Side) */}
        <div className="flex items-center justify-start gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Best Bid
            </span>
            <span className="font-mono font-bold text-sm md:text-base text-emerald-600 dark:text-emerald-400">
              €{safeBid.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Best Ask (Right Side) */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">
              Best Ask
            </span>
            <span className="font-mono font-bold text-sm md:text-base text-red-600 dark:text-red-400">
              €{safeAsk.toFixed(2)}
            </span>
          </div>
          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
      </div>

      {/* Spread Info (Centered Below) */}
      <div className="px-4 pb-2 flex justify-center">
        <div className="text-[10px] text-navy-600 dark:text-navy-400">
          <span className="font-medium">Spread: </span>
          <span className="font-mono font-semibold text-navy-900 dark:text-white">
            €{safeSpread.toFixed(2)}
          </span>
          <span className="ml-1 text-navy-500 dark:text-navy-500">
            ({spreadPercentage}%)
          </span>
        </div>
      </div>
    </div>
  );
}
