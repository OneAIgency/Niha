import { InputHTMLAttributes, forwardRef, useState, useCallback } from 'react';
import { cn } from '../../utils';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: string;
  value: string | number;
  onChange: (value: string) => void;
  /** Number of decimal places to allow (default: 2) */
  decimals?: number;
  /** Locale for formatting (default: en-US) */
  locale?: string;
}

/**
 * Parse a formatted number string back to a raw number string
 * Removes thousand separators and normalizes decimal separator
 */
export function parseFormattedNumber(value: string, locale: string = 'en-US'): string {
  if (!value) return '';

  // Determine decimal separator for locale
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.1).charAt(1);
  const thousandSeparator = new Intl.NumberFormat(locale).format(1000).charAt(1);

  // Remove thousand separators and spaces
  let cleaned = value.replace(new RegExp(`[${thousandSeparator}\\s]`, 'g'), '');

  // Normalize decimal separator to dot
  if (decimalSeparator !== '.') {
    cleaned = cleaned.replace(decimalSeparator, '.');
  }

  // Allow only digits, dot, and minus
  cleaned = cleaned.replace(/[^\d.-]/g, '');

  return cleaned;
}

/**
 * Format a number string with thousand separators
 */
export function formatNumberWithSeparators(
  value: string | number,
  locale: string = 'en-US',
  decimals?: number
): string {
  if (value === '' || value === null || value === undefined) return '';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '';

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals ?? 10,
  };

  return new Intl.NumberFormat(locale, options).format(numValue);
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({
    className,
    label,
    error,
    icon,
    suffix,
    value,
    onChange,
    decimals = 2,
    locale = 'en-US',
    placeholder,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // Convert value to string for display
    const rawValue = typeof value === 'number' ? value.toString() : value;

    // Format value for display (only when not focused)
    const displayValue = isFocused
      ? rawValue
      : formatNumberWithSeparators(rawValue, locale, decimals);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // When focused, allow raw input but filter invalid characters
      const cleaned = parseFormattedNumber(inputValue, locale);

      // Validate: allow empty, digits, single decimal point, leading minus
      const isValid = /^-?\d*\.?\d*$/.test(cleaned);

      if (isValid) {
        // Limit decimal places
        const parts = cleaned.split('.');
        if (parts[1] && parts[1].length > decimals) {
          return; // Don't update if too many decimals
        }
        onChange(cleaned);
      }
    }, [onChange, locale, decimals]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    }, [props]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    }, [props]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 dark:text-navy-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200',
              icon && 'pl-12',
              suffix && 'pr-16',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id || 'input'}-error` : undefined}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-500 dark:text-navy-400 font-medium pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p id={`${props.id || 'input'}-error`} className="mt-1 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
