import { InputHTMLAttributes, forwardRef, useState, useCallback, useEffect, useRef } from 'react';
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

/**
 * Format number as user types, preserving cursor position
 */
function formatWithCursor(
  value: string,
  cursorPos: number,
  locale: string = 'en-US'
): { formatted: string; newCursor: number } {
  // Get thousand separator for locale
  const thousandSeparator = new Intl.NumberFormat(locale).format(1000).charAt(1);

  // Remove existing separators
  const stripped = value.replace(new RegExp(`[${thousandSeparator}\\s]`, 'g'), '');

  // Count digits before cursor in original
  const beforeCursor = value.slice(0, cursorPos);
  const digitsBeforeCursor = beforeCursor.replace(/[^\d.-]/g, '').length;

  // Parse and format
  const numValue = parseFloat(stripped);
  if (isNaN(numValue) || stripped === '' || stripped === '-') {
    return { formatted: stripped, newCursor: cursorPos };
  }

  // Split into integer and decimal parts
  const parts = stripped.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const formatted = decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;

  // Find new cursor position
  let digitCount = 0;
  let newCursor = 0;
  for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
    newCursor = i + 1;
    if (/[\d.-]/.test(formatted[i])) {
      digitCount++;
    }
  }

  return { formatted, newCursor };
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
    onBlur,
    onFocus,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = (node: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    // Internal display value (always formatted)
    const [displayValue, setDisplayValue] = useState(() => {
      const raw = typeof value === 'number' ? value.toString() : value;
      return formatNumberWithSeparators(raw, locale, decimals);
    });

    // Pending cursor position
    const pendingCursor = useRef<number | null>(null);

    // Sync external value changes
    useEffect(() => {
      const raw = typeof value === 'number' ? value.toString() : value;
      // Only update if not currently focused to avoid interfering with typing
      if (document.activeElement !== inputRef.current) {
        setDisplayValue(formatNumberWithSeparators(raw, locale, decimals));
      }
    }, [value, locale, decimals]);

    // Restore cursor after formatting
    useEffect(() => {
      if (pendingCursor.current !== null && inputRef.current) {
        inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
        pendingCursor.current = null;
      }
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;

      // Parse out the raw number (removing separators)
      const cleaned = parseFormattedNumber(inputValue, locale);

      // Validate: allow empty, digits, single decimal point, leading minus
      const isValid = /^-?\d*\.?\d*$/.test(cleaned);

      if (!isValid) return;

      // Limit decimal places
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > decimals) {
        return; // Don't update if too many decimals
      }

      // Format with cursor tracking
      const { formatted, newCursor } = formatWithCursor(inputValue, cursorPosition, locale);

      pendingCursor.current = newCursor;
      setDisplayValue(formatted);
      onChange(cleaned);
    }, [onChange, locale, decimals]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Re-format on blur to ensure consistent formatting
      const raw = typeof value === 'number' ? value.toString() : value;
      setDisplayValue(formatNumberWithSeparators(raw, locale, decimals));
      onBlur?.(e);
    }, [value, locale, decimals, onBlur]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
    }, [onFocus]);

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
            ref={combinedRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-300',
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
