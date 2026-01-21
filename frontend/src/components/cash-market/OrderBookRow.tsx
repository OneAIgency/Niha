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
  const depthPercentage = maxQuantity > 0 ? (level.cumulative_quantity / maxQuantity) * 100 : 0;

  const colorClasses = {
    hover: isBid ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10' : 'hover:bg-red-50 dark:hover:bg-red-900/10',
    depth: isBid ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20',
    price: isBid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
  };

  const depthPosition = isBid ? 'right-0' : 'left-0';
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
      {/* Depth Visualization */}
      <div
        className={`absolute ${depthPosition} top-0 bottom-0 ${colorClasses.depth} transition-all`}
        style={{ width: `${depthPercentage}%` }}
        aria-hidden="true"
      />

      {/* Values */}
      <div className="relative grid grid-cols-3 md:grid-cols-4 gap-2">
        {isBid ? (
          <>
            <div className="text-right font-mono text-navy-600 dark:text-navy-400 hidden md:block">
              {formatQuantity(level.cumulative_quantity)}
            </div>
            <div className="text-right font-mono text-navy-900 dark:text-white">
              {formatQuantity(level.quantity)}
            </div>
            <div className={`text-right font-mono font-semibold ${colorClasses.price}`}>
              {level.price.toFixed(2)}
            </div>
            <div className="text-center text-[10px] text-navy-500 dark:text-navy-500">
              {level.order_count}
            </div>
          </>
        ) : (
          <>
            <div className="text-center text-[10px] text-navy-500 dark:text-navy-500">
              {level.order_count}
            </div>
            <div className={`text-left font-mono font-semibold ${colorClasses.price}`}>
              {level.price.toFixed(2)}
            </div>
            <div className="text-left font-mono text-navy-900 dark:text-white">
              {formatQuantity(level.quantity)}
            </div>
            <div className="text-left font-mono text-navy-600 dark:text-navy-400 hidden md:block">
              {formatQuantity(level.cumulative_quantity)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
