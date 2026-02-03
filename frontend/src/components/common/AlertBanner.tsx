import { type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  /** Alert style variant */
  variant: AlertVariant;
  /** Optional title for the alert */
  title?: string;
  /** Main message content */
  message: ReactNode;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Info,
  },
};

/**
 * AlertBanner Component
 *
 * A standardized alert/notification banner with variants for different message types.
 *
 * @example
 * ```tsx
 * // Success message with dismiss
 * <AlertBanner
 *   variant="success"
 *   message="Settings saved successfully!"
 *   onDismiss={() => setSuccess(null)}
 * />
 *
 * // Error with title
 * <AlertBanner
 *   variant="error"
 *   title="Error"
 *   message="Failed to load data. Please try again."
 * />
 * ```
 */
export function AlertBanner({ variant, title, message, onDismiss, className }: AlertBannerProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        styles.bg,
        styles.border,
        className
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.text)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-medium mb-1', styles.text)}>{title}</p>
        )}
        <p className="text-sm text-navy-300">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4 text-navy-400" />
        </button>
      )}
    </div>
  );
}
