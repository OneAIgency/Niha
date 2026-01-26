import { usePrices } from '../../hooks/usePrices';
import { formatCurrency } from '../../utils';
import { cn } from '../../utils';

interface CEAPriceDisplayProps {
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
 * CEAPriceDisplay Component
 * 
 * Displays the current CEA (China Emissions Allowance) price in EUR
 * fetched from scraped sources. Designed to be used in Subheader or other locations.
 * 
 * @example
 * ```tsx
 * <CEAPriceDisplay size="md" showLabel />
 * ```
 */
export function CEAPriceDisplay({
  className,
  showLoading = true,
  size = 'md',
  showLabel = true,
}: CEAPriceDisplayProps) {
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
          <span className={cn(styles.label, 'text-navy-400 font-medium')}>CEA</span>
        )}
        <span className={cn(styles.price, 'text-navy-500')}>---</span>
      </div>
    );
  }

  if (!prices || !prices.cea) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className={cn(styles.label, 'text-navy-400 font-medium')}>CEA</span>
        )}
        <span className={cn(styles.price, 'text-navy-500')}>N/A</span>
      </div>
    );
  }

  // Use price_eur if available, otherwise use price (which should already be in EUR)
  const ceaPrice = prices.cea.price_eur ?? prices.cea.price;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className={cn(styles.label, 'text-amber-600 dark:text-amber-400 font-medium')}>
          CEA
        </span>
      )}
      <span className={cn(styles.price, 'text-white')}>
        {formatCurrency(ceaPrice, 'EUR')}
      </span>
    </div>
  );
}
