import { TrendingUp, TrendingDown, Wind } from 'lucide-react';
import type { PriceData } from '../../types';

interface EuaScrappedProps {
  /** EUA price data */
  priceData: PriceData | null;
  /** Optional className for styling */
  className?: string;
}

/**
 * EuaScrapped Component
 * 
 * Displays EUA (EU Emission Allowance) price information in a compact card format.
 * Shows the current price and 24h change percentage with appropriate color coding.
 * 
 * @param props - Component props
 * @param props.priceData - EUA price data containing price and change24h
 * @param props.className - Optional additional CSS classes
 */
export function EuaScrapped({ priceData, className = '' }: EuaScrappedProps) {
  if (!priceData || priceData.price === undefined || priceData.change24h === undefined) {
    return null;
  }

  const isPositive = priceData.change24h >= 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-navy-700/50 rounded-lg ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <Wind className="w-4 h-4 text-blue-400" />
      </div>
      <div>
        <div className="text-xs text-navy-400">EUA Price</div>
        <div className="flex items-center gap-2">
          <span className="font-bold font-mono text-white">
            €{priceData.price.toFixed(2)}
          </span>
          <span className={`flex items-center gap-0.5 text-xs ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
