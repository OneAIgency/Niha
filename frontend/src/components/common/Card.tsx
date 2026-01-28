import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'hover';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    /* Section/card wrapper: .card_back (theme: --color-card-back-bg, --color-card-back-border, --radius-card-back). */
    const variants = {
      default: 'card_back',
      glass: 'bg-white/80 dark:bg-navy-800/80 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-navy-700/50 shadow-lg',
      hover: 'card_back transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
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
