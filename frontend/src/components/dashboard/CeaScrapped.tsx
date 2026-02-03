import { TrendingUp, TrendingDown, Leaf } from 'lucide-react';
import type { PriceData } from '../../types';

interface CeaScrappedProps {
  /** CEA price data */
  priceData: PriceData | null;
  /** Optional className for styling */
  className?: string;
}

/**
 * CeaScrapped Component
 * 
 * Displays CEA (China Emission Allowance) price information in a compact card format.
 * Shows the current price and 24h change percentage with appropriate color coding.
 * 
 * @param props - Component props
 * @param props.priceData - CEA price data containing price and change24h
 * @param props.className - Optional additional CSS classes
 */
export function CeaScrapped({ priceData, className = '' }: CeaScrappedProps) {
  if (!priceData || priceData.price === undefined || priceData.change24h === undefined) {
    return null;
  }

  const isPositive = priceData.change24h >= 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-navy-700/50 rounded-lg ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
        <Leaf className="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div className="text-xs text-navy-400">CEA Price</div>
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
