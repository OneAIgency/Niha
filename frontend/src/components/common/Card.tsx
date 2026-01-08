import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'hover';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-navy-800 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-700',
      glass: 'bg-white/80 dark:bg-navy-800/80 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-navy-700/50 shadow-lg',
      hover: 'bg-white dark:bg-navy-800 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
