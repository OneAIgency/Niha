import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { NumberInput } from '../common/NumberInput';
import { cashMarketApi } from '../../services/api';
import type { CertificateType } from '../../types';

interface UserOrderEntryModalProps {
  certificateType: CertificateType;
  availableBalance: number; // EUR balance
  bestAskPrice: number | null;
  onOrderSubmit: (order: {
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    amountEur: number;
  }) => Promise<void>;
}

interface OrderPreview {
  certificate_type: string;
  side: string;
  order_type: string;
  amount_eur: number | null;
  quantity_requested: number | null;
  limit_price: number | null;
  all_or_none: boolean;
  fills: Array<{
    seller_code: string;
    price: number;
    quantity: number;
    cost: number;
  }>;
  total_quantity: number;
  total_cost_gross: number;
  weighted_avg_price: number;
  best_price: number | null;
  worst_price: number | null;
  platform_fee_rate: number;
  platform_fee_amount: number;
  total_cost_net: number;
  net_price_per_unit: number;
  available_balance: number;
  remaining_balance: number;
  can_execute: boolean;
  execution_message: string;
  partial_fill: boolean;
}

export function UserOrderEntryModal({
  certificateType,
  availableBalance,
  bestAskPrice,
  onOrderSubmit,
}: UserOrderEntryModalProps) {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [amountEur, setAmountEur] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-set amount to full balance when market order type is selected
  useEffect(() => {
    if (orderType === 'MARKET' && availableBalance > 0) {
      setAmountEur(availableBalance.toFixed(2));
    }
  }, [orderType, availableBalance]);

  // Fetch preview when amount or price changes (debounced)
  const fetchPreview = useCallback(
    async (amount: number, price?: number) => {
      if (amount <= 0) {
        setPreview(null);
        setPreviewError(null);
        return;
      }

      setIsLoadingPreview(true);
      setPreviewError(null);

      try {
        const previewData = await cashMarketApi.previewOrder({
          certificate_type: certificateType,
          side: 'BUY',
          amount_eur: amount,
          order_type: orderType,
          limit_price: price,
        });

        setPreview(previewData);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        console.error('Preview error:', error);
        setPreviewError(
          err.response?.data?.detail || 'Failed to preview order. Please try again.'
        );
        setPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [certificateType, orderType]
  );

  // Debounce preview fetch
  useEffect(() => {
    const amount = parseFloat(amountEur);
    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined;

    if (amount > 0) {
      const timer = setTimeout(() => {
        fetchPreview(amount, price);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setPreview(null);
      setPreviewError(null);
    }
  }, [amountEur, limitPrice, orderType, fetchPreview]);

  const handleMaxClick = () => {
    setAmountEur(availableBalance.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!preview?.can_execute) {
      return;
    }

    const amount = parseFloat(amountEur);
    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined;

    if (amount <= 0) {
      return;
    }

    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onOrderSubmit({
        orderType,
        limitPrice: price,
        amountEur: amount,
      });

      // Reset form after successful submission
      setAmountEur('');
      setLimitPrice('');
      setPreview(null);
    } catch (error) {
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    !isLoadingPreview &&
    preview?.can_execute &&
    parseFloat(amountEur) > 0 &&
    (orderType === 'MARKET' || parseFloat(limitPrice) > 0);

  return (
    <Card
      className="w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700"
      padding="lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">
            Buy {certificateType} Certificates
          </h2>
          <p className="text-sm text-navy-600 dark:text-navy-400">
            Available: €{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type Toggle */}
        <div>
          <label className="text-sm font-medium text-navy-700 dark:text-navy-300 block mb-2">
            Order Type
          </label>
          <div className="flex rounded-lg overflow-hidden border-2 border-purple-300 dark:border-purple-600">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                orderType === 'MARKET'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              Market Order
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                orderType === 'LIMIT'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              Limit Order
            </button>
          </div>
          <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
            {orderType === 'MARKET'
              ? 'Execute immediately at best available price'
              : 'Execute only at specified price or better'}
          </p>
        </div>

        {/* Input Grid */}
        <div className={`grid ${orderType === 'LIMIT' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-navy-300 block mb-2">
              Amount (EUR)
            </label>
            <div className="relative">
              <NumberInput
                value={amountEur}
                onChange={setAmountEur}
                placeholder="0.00"
                suffix="EUR"
                decimals={2}
                error={parseFloat(amountEur) > availableBalance ? 'Insufficient balance' : undefined}
                className="pr-16"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors z-10"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Limit Price Input (only for LIMIT orders) */}
          {orderType === 'LIMIT' && (
            <div>
              <NumberInput
                label="Limit Price (EUR)"
                value={limitPrice}
                onChange={setLimitPrice}
                placeholder={bestAskPrice ? `${bestAskPrice.toFixed(1)}` : '0.0'}
                suffix="EUR"
                decimals={2}
              />
              {bestAskPrice && (
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  Best Ask: €{bestAskPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Estimated Quantity (read-only) */}
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-navy-300 block mb-2">
              Est. Quantity
            </label>
            <div className="px-3 py-2.5 rounded-lg border-2 border-purple-200 dark:border-purple-600 bg-navy-50 dark:bg-navy-900 text-navy-900 dark:text-white font-mono flex items-center justify-between">
              {isLoadingPreview ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              ) : preview ? (
                <span>{preview.total_quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              ) : (
                <span className="text-navy-400">-</span>
              )}
              <span className="text-xs text-navy-500 ml-2">{certificateType}</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {isLoadingPreview && (
          <div className="flex items-center justify-center py-6 bg-white dark:bg-navy-800 rounded-lg border-2 border-purple-200 dark:border-purple-600">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
            <span className="text-sm text-navy-600 dark:text-navy-400">Loading preview...</span>
          </div>
        )}

        {previewError && (
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Preview Error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {previewError}
              </p>
            </div>
          </div>
        )}

        {preview && !isLoadingPreview && (
          <div className="p-4 bg-white dark:bg-navy-800 rounded-lg border-2 border-purple-200 dark:border-purple-600 space-y-3">
            <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-2">
              Order Preview
            </h3>

            <div className="space-y-2 text-sm">
              {/* Quantity */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Quantity</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  {preview.total_quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {certificateType}
                </span>
              </div>

              {/* Weighted Average Price */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Avg Price</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  ${preview.weighted_avg_price.toFixed(2)}
                </span>
              </div>

              {/* Cost Before Fee */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Cost</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  €{preview.total_cost_gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Platform Fee */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">
                  Platform Fee ({(preview.platform_fee_rate * 100).toFixed(2)}%)
                </span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  €{preview.platform_fee_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-purple-200 dark:border-purple-600 pt-2 mt-2">
                {/* Total Cost */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-navy-900 dark:text-white">Total Cost</span>
                  <span className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400">
                    €{preview.total_cost_net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Remaining Balance */}
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-navy-600 dark:text-navy-400">Remaining Balance</span>
                  <span className="text-sm font-mono font-semibold text-navy-900 dark:text-white">
                    €{preview.remaining_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Message */}
            {!preview.can_execute && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  {preview.execution_message}
                </p>
              </div>
            )}

            {preview.can_execute && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-300 dark:border-emerald-700">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 dark:text-emerald-100">
                  {preview.execution_message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          whileHover={canSubmit ? { scale: 1.01 } : {}}
          whileTap={canSubmit ? { scale: 0.99 } : {}}
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3.5 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
            canSubmit
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
              : 'bg-navy-300 dark:bg-navy-700 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>Buy {certificateType}</span>
            </>
          )}
        </motion.button>
      </form>
    </Card>
  );
}
