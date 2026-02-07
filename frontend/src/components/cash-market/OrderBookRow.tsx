import { formatQuantity } from '../../utils';
import type { OrderBookLevel } from '../../types';

interface OrderBookRowProps {
  level: OrderBookLevel;
  side: 'bid' | 'ask';
  maxQuantity: number;
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
}

export function OrderBookRow({ level, side, maxQuantity, onPriceClick }: OrderBookRowProps) {
  const isBid = side === 'bid';
  const depthPercentage = maxQuantity > 0 ? (level.cumulativeQuantity / maxQuantity) * 100 : 0;

  // BID (buy) = red, ASK (sell) = green - standard trading convention
  const colorClasses = {
    hover: isBid ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10',
    depthFill: isBid ? 'fill-red-500/10 dark:fill-red-500/20' : 'fill-emerald-500/10 dark:fill-emerald-500/20',
    price: isBid ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
  };

  // Smooth curve for depth: path in 0–100 coordinate space, curved edge instead of vertical bar
  const curveAmount = 8;
  const p = Math.min(100, Math.max(0, depthPercentage));
  const depthPath =
    isBid
      ? `M ${100 - p},0 Q ${100 - p - curveAmount},50 ${100 - p},100 L 100,100 L 100,0 Z`
      : `M 0,0 L ${p},0 Q ${p + curveAmount},50 ${p},100 L 0,100 Z`;

  const priceAction = isBid ? 'BUY' : 'SELL';

  const handleClick = () => {
    onPriceClick?.(level.price, priceAction);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPriceClick?.(level.price, priceAction);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative px-4 py-1 ${colorClasses.hover} cursor-pointer transition-colors group`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${priceAction} order at price €${level.price.toFixed(2)}, quantity ${formatQuantity(level.quantity)}`}
    >
      {/* Depth: smooth curve (same semantics as before, curved edge instead of bar) */}
      <svg
        className="absolute inset-0 w-full h-full transition-all pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={depthPath} className={colorClasses.depthFill} />
      </svg>

      {/* Values */}
      <div className="relative grid grid-cols-3 md:grid-cols-4 gap-2">
        {isBid ? (
          <>
            <div className="text-right font-mono text-navy-600 dark:text-navy-400 hidden md:block">
              {formatQuantity(level.cumulativeQuantity)}
            </div>
            <div className="text-right font-mono text-navy-900 dark:text-white">
              {formatQuantity(level.quantity)}
            </div>
            <div className={`text-right font-mono font-semibold ${colorClasses.price}`}>
              {level.price.toFixed(2)}
            </div>
            <div className="text-center text-xs text-navy-500 dark:text-navy-500">
              {level.orderCount}
            </div>
          </>
        ) : (
          <>
            <div className="text-center text-xs text-navy-500 dark:text-navy-500">
              {level.orderCount}
            </div>
            <div className={`text-left font-mono font-semibold ${colorClasses.price}`}>
              {level.price.toFixed(2)}
            </div>
            <div className="text-left font-mono text-navy-900 dark:text-white">
              {formatQuantity(level.quantity)}
            </div>
            <div className="text-left font-mono text-navy-600 dark:text-navy-400 hidden md:block">
              {formatQuantity(level.cumulativeQuantity)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
