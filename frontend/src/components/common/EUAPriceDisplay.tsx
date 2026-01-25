import { usePrices } from '../../hooks/usePrices';
import { formatCurrency } from '../../utils';
import { cn } from '../../utils';

interface EUAPriceDisplayProps {
  /** Optional additional className for the container */
  className?: string;
  /** Show loading state */
  showLoading?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label */
  showLabel?: boolean;
}

/**
 * EUAPriceDisplay Component
 * 
 * Displays the current EUA (EU Emissions Allowance) price in EUR
 * fetched from scraped sources. Designed to be used in Subheader or other locations.
 * 
 * @example
 * ```tsx
 * <EUAPriceDisplay size="md" showLabel />
 * ```
 */
export function EUAPriceDisplay({
  className,
  showLoading = true,
  size = 'md',
  showLabel = true,
}: EUAPriceDisplayProps) {
  const { prices, loading } = usePrices();

  const sizeStyles = {
    sm: {
      label: 'text-xs',
      price: 'text-sm font-mono font-semibold',
    },
    md: {
      label: 'text-sm',
      price: 'text-base font-mono font-bold',
    },
    lg: {
      label: 'text-base',
      price: 'text-lg font-mono font-bold',
    },
  };

  const styles = sizeStyles[size];

  if (loading && showLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className={cn(styles.label, 'text-slate-400 font-medium')}>EUA</span>
        )}
        <span className={cn(styles.price, 'text-slate-500')}>---</span>
      </div>
    );
  }

  if (!prices || !prices.eua) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className={cn(styles.label, 'text-slate-400 font-medium')}>EUA</span>
        )}
        <span className={cn(styles.price, 'text-slate-500')}>N/A</span>
      </div>
    );
  }

  // EUA price is already in EUR
  const euaPrice = prices.eua.price;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className={cn(styles.label, 'text-blue-600 dark:text-blue-400 font-medium')}>
          EUA
        </span>
      )}
      <span className={cn(styles.price, 'text-white')}>
        {formatCurrency(euaPrice, 'EUR')}
      </span>
    </div>
  );
}
