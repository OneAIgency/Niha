import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { Skeleton } from './Skeleton';

type LoadingVariant = 'spinner' | 'skeleton' | 'inline';
type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingStateProps {
  /** Loading display style */
  variant?: LoadingVariant;
  /** Optional loading text */
  text?: string;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton rows (only for skeleton variant) */
  skeletonRows?: number;
}

const sizeClasses: Record<LoadingSize, { spinner: string; text: string }> = {
  sm: { spinner: 'w-4 h-4', text: 'text-xs' },
  md: { spinner: 'w-6 h-6', text: 'text-sm' },
  lg: { spinner: 'w-8 h-8', text: 'text-base' },
};

/**
 * LoadingState Component
 *
 * A standardized loading indicator with multiple variants.
 *
 * @example
 * ```tsx
 * // Centered spinner with text
 * <LoadingState variant="spinner" text="Loading data..." />
 *
 * // Inline spinner (for buttons, etc.)
 * <LoadingState variant="inline" size="sm" />
 *
 * // Skeleton loading for tables/lists
 * <LoadingState variant="skeleton" skeletonRows={5} />
 * ```
 */
export function LoadingState({
  variant = 'spinner',
  text,
  size = 'md',
  className,
  skeletonRows = 3,
}: LoadingStateProps) {
  const sizes = sizeClasses[size];

  // Skeleton variant - shows placeholder rows
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Inline variant - just the spinner, no wrapper
  if (variant === 'inline') {
    return (
      <Loader2 className={cn('animate-spin text-emerald-500', sizes.spinner, className)} />
    );
  }

  // Default spinner variant - centered with optional text
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className={cn('animate-spin text-emerald-500', sizes.spinner)} />
      {text && (
        <p className={cn('mt-3 text-navy-400', sizes.text)}>{text}</p>
      )}
    </div>
  );
}

/**
 * PageLoadingState - Full page loading indicator
 *
 * Use this for initial page loads where the entire content area is loading.
 */
export function PageLoadingState({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <LoadingState variant="spinner" size="lg" text={text} />
    </div>
  );
}

/**
 * TableLoadingState - Loading indicator for tables
 *
 * Shows skeleton rows that match typical table row heights.
 */
export function TableLoadingState({ rows = 5 }: { rows?: number }) {
  return <LoadingState variant="skeleton" skeletonRows={rows} />;
}
