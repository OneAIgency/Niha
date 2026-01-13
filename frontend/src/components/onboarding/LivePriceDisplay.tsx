import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';
import { colors } from './OnboardingLayout';
import { useOnboardingPrices } from '@/hooks/useOnboardingPrices';

interface LivePriceDisplayProps {
  type: 'eua' | 'cea';
  showChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LivePriceDisplay({
  type,
  showChange = true,
  size = 'md',
  className = '',
}: LivePriceDisplayProps) {
  const {
    euaPrice,
    ceaPrice,
    ceaPriceInEur,
    euaChangePercent,
    ceaChangePercent,
    isLoading,
    isCached,
  } = useOnboardingPrices();

  const price = type === 'eua' ? euaPrice : ceaPrice;
  const currency = type === 'eua' ? 'EUR' : 'CNY';
  const changePercent = type === 'eua' ? euaChangePercent : ceaChangePercent;
  const eurEquivalent = type === 'cea' ? ceaPriceInEur : null;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const colorStyle =
    type === 'eua' ? { color: colors.secondaryLight } : { color: colors.danger };

  // Loading state
  if (isLoading && !price) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-5 h-5" style={{ color: colors.textMuted }} />
        </motion.div>
        <span className="text-sm" style={{ color: colors.textMuted }}>
          Loading price...
        </span>
      </div>
    );
  }

  // Change indicator
  const ChangeIcon =
    changePercent > 0 ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;
  const changeColor =
    changePercent > 0
      ? colors.success
      : changePercent < 0
        ? colors.danger
        : colors.textMuted;

  return (
    <div className={className}>
      <div className={`font-extrabold ${sizeClasses[size]}`} style={colorStyle}>
        {currency} {price.toFixed(0)}/t
      </div>
      {eurEquivalent && (
        <div className="text-sm" style={{ color: colors.textSecondary }}>
          (~EUR {eurEquivalent.toFixed(0)})
        </div>
      )}
      {showChange && changePercent !== 0 && (
        <div
          className="flex items-center justify-center gap-1 text-xs mt-1"
          style={{ color: changeColor }}
        >
          <ChangeIcon className="w-3 h-3" />
          <span>
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        </div>
      )}
      {isCached && (
        <div
          className="flex items-center justify-center gap-1 text-xs mt-1"
          style={{ color: colors.accent }}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Cached</span>
        </div>
      )}
    </div>
  );
}

// Combined price comparison display
interface LivePriceComparisonProps {
  className?: string;
  showLabels?: boolean;
}

export function LivePriceComparison({
  className = '',
  showLabels = true,
}: LivePriceComparisonProps) {
  const { euaPrice, ceaPrice, ceaPriceInEur, priceRatio, isLoading, isCached } =
    useOnboardingPrices();

  const ratioLow = Math.floor(priceRatio);
  const ratioHigh = Math.ceil(priceRatio) + 1;

  return (
    <div className={`grid md:grid-cols-3 gap-6 ${className}`}>
      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        {isLoading && !euaPrice ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5" style={{ color: colors.textMuted }} />
            </motion.div>
          </div>
        ) : (
          <>
            <div
              className="text-3xl font-extrabold"
              style={{ color: colors.secondaryLight }}
            >
              EUR {euaPrice.toFixed(0)}/t
            </div>
            {isCached && (
              <div
                className="flex items-center justify-center gap-1 text-xs mt-1"
                style={{ color: colors.accent }}
              >
                <AlertCircle className="w-3 h-3" />
                <span>Cached</span>
              </div>
            )}
          </>
        )}
        {showLabels && (
          <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            EU EUA Current Price
          </div>
        )}
      </div>

      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        {isLoading && !ceaPrice ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5" style={{ color: colors.textMuted }} />
            </motion.div>
          </div>
        ) : (
          <>
            <div className="text-3xl font-extrabold" style={{ color: colors.danger }}>
              CNY {ceaPrice.toFixed(0)}/t
            </div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              (~EUR {ceaPriceInEur.toFixed(0)})
            </div>
            {isCached && (
              <div
                className="flex items-center justify-center gap-1 text-xs mt-1"
                style={{ color: colors.accent }}
              >
                <AlertCircle className="w-3 h-3" />
                <span>Cached</span>
              </div>
            )}
          </>
        )}
        {showLabels && (
          <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            China CEA Current Price
          </div>
        )}
      </div>

      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <div className="text-3xl font-extrabold" style={{ color: colors.success }}>
          {isLoading ? '...' : `${ratioLow}-${ratioHigh}x`}
        </div>
        {showLabels && (
          <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Price Differential
          </div>
        )}
      </div>
    </div>
  );
}

// Compact inline price display
interface InlinePriceProps {
  type: 'eua' | 'cea';
  showCurrency?: boolean;
}

export function InlinePrice({ type, showCurrency = true }: InlinePriceProps) {
  const { euaPrice, ceaPrice, isLoading } = useOnboardingPrices();

  const price = type === 'eua' ? euaPrice : ceaPrice;
  const currency = type === 'eua' ? 'EUR' : 'CNY';

  if (isLoading && !price) {
    return <span>...</span>;
  }

  return (
    <span>
      {showCurrency ? `${currency} ` : ''}
      {price.toFixed(0)}/t
    </span>
  );
}
