import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';

/**
 * Shared button component. Variants: primary | secondary | outline | ghost | danger.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500',
      secondary:
        'bg-navy-900 dark:bg-navy-700 text-white hover:bg-navy-800 dark:hover:bg-navy-600 focus:ring-navy-500',
      outline:
        'border-2 border-navy-200 dark:border-navy-600 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-700 focus:ring-navy-500',
      ghost: 'text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-700 focus:ring-navy-500',
      danger:
        'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
