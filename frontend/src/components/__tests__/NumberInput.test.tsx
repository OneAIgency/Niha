/**
 * NumberInput component and number formatting tests.
 * Covers parseFormattedNumber, formatNumberWithSeparators, and NumberInput behaviour.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import {
  NumberInput,
  parseFormattedNumber,
  formatNumberWithSeparators,
} from '../common/NumberInput';

describe('parseFormattedNumber', () => {
  it('returns empty string for empty input', () => {
    expect(parseFormattedNumber('')).toBe('');
    expect(parseFormattedNumber('   ')).toBe('');
  });

  it('removes comma thousands separator (en-US)', () => {
    expect(parseFormattedNumber('1,000')).toBe('1000');
    expect(parseFormattedNumber('1,000,000.50')).toBe('1000000.50');
  });

  it('removes spaces used as thousands separator in some locales', () => {
    expect(parseFormattedNumber('1 000', 'en-US')).toBe('1000');
  });

  it('normalizes decimal separator for locale that uses comma', () => {
    const result = parseFormattedNumber('1.234,56', 'de-DE');
    expect(result).toBe('1234.56');
  });

  it('strips non-numeric characters except dot and minus', () => {
    expect(parseFormattedNumber('1,000.50')).toBe('1000.50');
    expect(parseFormattedNumber('-42')).toBe('-42');
  });
});

describe('formatNumberWithSeparators', () => {
  it('returns empty string for empty/null/undefined', () => {
    expect(formatNumberWithSeparators('')).toBe('');
    expect(formatNumberWithSeparators(null as unknown as string)).toBe('');
    expect(formatNumberWithSeparators(undefined as unknown as string)).toBe('');
  });

  it('formats with comma thousands (en-US)', () => {
    expect(formatNumberWithSeparators(1000)).toBe('1,000');
    expect(formatNumberWithSeparators(1000000.5)).toBe('1,000,000.5');
  });

  it('respects decimals option', () => {
    expect(formatNumberWithSeparators(99.456, 'en-US', 2)).toBe('99.46');
    expect(formatNumberWithSeparators(99.4, 'en-US', 2)).toBe('99.4');
    expect(formatNumberWithSeparators(1000, 'en-US', 0)).toBe('1,000');
  });

  it('accepts string value', () => {
    expect(formatNumberWithSeparators('1234.5')).toBe('1,234.5');
  });
});

describe('NumberInput', () => {
  it('renders with value displayed with thousands separator', () => {
    render(<NumberInput value={1000} onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('1,000');
  });

  it('calls onChange with raw string (no commas) when user types', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1,000.50' } });
    expect(onChange).toHaveBeenCalledWith('1000.50');
  });

  it('does not call onChange when user enters more than decimals decimal places', () => {
    const onChange = vi.fn();
    render(<NumberInput value="99.99" onChange={onChange} decimals={2} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '99.999' } });
    expect(onChange).not.toHaveBeenCalledWith('99.999');
  });

  it('shows error state', () => {
    render(<NumberInput value="0" onChange={() => {}} error="Invalid amount" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid amount');
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-500');
  });

  it('renders with label when provided', () => {
    render(<NumberInput label="Amount" value="" onChange={() => {}} />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(
      <NumberInput value="" onChange={() => {}} placeholder="Enter amount" />
    );
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<NumberInput value="0" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('uses inputMode decimal for better mobile keyboard', () => {
    render(<NumberInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'inputmode',
      'decimal'
    );
  });

  it('applies custom className', () => {
    render(
      <NumberInput value="" onChange={() => {}} className="custom-class" />
    );
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});

describe('NumberInput integration', () => {
  it('form flow: typing and blur formats value and parent receives raw value', () => {
    const TestForm = () => {
      const [amount, setAmount] = React.useState('');
      return (
        <div>
          <NumberInput
            label="Amount"
            value={amount}
            onChange={setAmount}
            decimals={2}
            placeholder="0.00"
          />
          <span data-testid="raw-value">{amount || '(empty)'}</span>
        </div>
      );
    };
    render(<TestForm />);
    const input = screen.getByPlaceholderText('0.00');

    // Type a value with comma (as user would see when editing)
    fireEvent.change(input, { target: { value: '1,234.56' } });
    expect(screen.getByTestId('raw-value')).toHaveTextContent('1234.56');

    // Blur: display should remain formatted
    fireEvent.blur(input);
    expect(input).toHaveValue('1,234.56');
  });
});
