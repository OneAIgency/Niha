import { type ReactNode } from 'react';
import { cn } from '../../utils';

export interface ToggleOption {
  value: string;
  label: string;
  icon?: ReactNode;
  colorScheme?: 'default' | 'eua' | 'cea' | 'buy' | 'sell';
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const colorSchemes = {
  default: {
    active: 'bg-navy-800 text-white',
    inactive: 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700',
  },
  eua: {
    active: 'tab-toggle-item-active-eua',
    inactive: 'tab-toggle-item-inactive',
  },
  cea: {
    active: 'tab-toggle-item-active-cea',
    inactive: 'tab-toggle-item-inactive',
  },
  buy: {
    active: 'trade-tab-buy-active',
    inactive: 'trade-tab-buy-inactive',
  },
  sell: {
    active: 'trade-tab-sell-active',
    inactive: 'trade-tab-sell-inactive',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function ToggleGroup({
  options,
  value,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}: ToggleGroupProps) {
  return (
    <div
      className={cn(
        'flex rounded-lg overflow-hidden',
        variant === 'default' && 'border border-navy-200 dark:border-navy-600',
        fullWidth && 'w-full',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const scheme = colorSchemes[option.colorScheme || 'default'];

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'font-semibold transition-colors flex items-center justify-center gap-2',
              sizeStyles[size],
              fullWidth && 'flex-1',
              isActive ? scheme.active : scheme.inactive
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
