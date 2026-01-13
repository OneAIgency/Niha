import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercent } from '../../utils';

interface PriceDisplayProps {
  price: number;
  change?: number;
  currency?: 'USD' | 'EUR' | 'CNY';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    price: 'text-sm font-mono',
    change: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    price: 'text-lg font-mono font-semibold',
    change: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    price: 'text-2xl font-mono font-bold',
    change: 'text-base',
    icon: 'w-5 h-5',
  },
};

const currencySymbols = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

export function PriceDisplay({
  price,
  change,
  currency = 'EUR',
  showIcon = true,
  size = 'md',
  showCurrency = true,
  className,
}: PriceDisplayProps) {
  const styles = sizeStyles[size];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const getChangeColor = () => {
    if (isPositive) return 'price-positive';
    if (isNegative) return 'price-negative';
    return 'price-neutral';
  };

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(styles.price, 'text-navy-900 dark:text-white')}>
        {showCurrency && currencySymbols[currency]}
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {change !== undefined && (
        <span className={cn('flex items-center gap-0.5', styles.change, getChangeColor())}>
          {showIcon && <TrendIcon className={styles.icon} />}
          {formatPercent(change)}
        </span>
      )}
    </div>
  );
}
