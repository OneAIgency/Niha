import { type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const fillVariants = {
  default: 'progress-fill',
  gradient: 'progress-fill-gradient',
  success: 'h-full bg-emerald-500 rounded-full',
  warning: 'h-full bg-amber-500 rounded-full',
  danger: 'h-full bg-red-500 rounded-full',
};

const sizeStyles = {
  sm: 'h-0.5',
  md: 'h-1',
  lg: 'h-2',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-navy-500 mb-1">
          <span>{label || 'Progress'}</span>
          <span className="font-mono">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('progress-track-light', sizeStyles[size])}>
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={fillVariants[variant]}
          />
        ) : (
          <div
            className={fillVariants[variant]}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
