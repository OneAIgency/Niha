import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Loader2, AlertCircle, Clock } from 'lucide-react';
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
  certificateType: string;
  side: string;
  orderType: string;
  amountEur: number | null;
  quantityRequested: number | null;
  limitPrice: number | null;
  allOrNone: boolean;
  fills: Array<{
    sellerCode: string;
    price: number;
    quantity: number;
    cost: number;
  }>;
  totalQuantity?: number;
  totalCostGross?: number;
  weightedAvgPrice?: number;
  bestPrice: number | null;
  worstPrice: number | null;
  platformFeeRate?: number;
  platformFeeAmount?: number;
  totalCostNet?: number;
  netPricePerUnit?: number;
  availableBalance?: number;
  remainingBalance?: number;
  canExecute: boolean;
  executionMessage: string;
  partialFill: boolean;
  willBePlacedInBook?: boolean;  // True for LIMIT orders waiting in order book
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

  // Track the last orderType to detect changes
  const prevOrderTypeRef = useRef(orderType);

  // Auto-set amount to full balance when:
  // 1. Component mounts with MARKET order type
  // 2. User switches TO MARKET order type
  // Don't re-run when availableBalance changes due to polling (which would reset user edits)
  useEffect(() => {
    const isOrderTypeChange = prevOrderTypeRef.current !== orderType;
    prevOrderTypeRef.current = orderType;

    // Only set amount if switching to MARKET or on initial mount
    if (orderType === 'MARKET' && availableBalance > 0) {
      // On initial mount or when switching to MARKET, set to full balance
      if (isOrderTypeChange || amountEur === '') {
        setAmountEur(availableBalance.toFixed(2));
      }
    }
  }, [orderType, availableBalance, amountEur]);

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
    console.log('handleSubmit called, preview:', preview);
    console.log('canExecute:', preview?.canExecute, 'amountEur:', amountEur, 'orderType:', orderType);

    if (!preview?.canExecute) {
      console.log('Returning early: preview.canExecute is false');
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
    console.log('Calling onOrderSubmit with:', { orderType, limitPrice: price, amountEur: amount });
    try {
      await onOrderSubmit({
        orderType,
        limitPrice: price,
        amountEur: amount,
      });
      console.log('onOrderSubmit completed successfully');

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
    preview?.canExecute &&
    parseFloat(amountEur) > 0 &&
    (orderType === 'MARKET' || parseFloat(limitPrice) > 0);

  return (
    <Card
      className="w-full"
      padding="md"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-500 rounded-md">
          <ShoppingCart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-navy-900 dark:text-white leading-tight">
            Buy {certificateType} Certificates
          </h2>
          <p className="text-xs text-navy-600 dark:text-navy-400">
            Available: €{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Order Type Toggle */}
        <div>
          <label className="text-xs font-medium text-navy-700 dark:text-navy-300 block mb-1">
            Order Type
          </label>
          <div className="flex rounded-md overflow-hidden border border-navy-200 dark:border-navy-600">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                orderType === 'MARKET'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              }`}
            >
              Market Order
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                orderType === 'LIMIT'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              }`}
            >
              Limit Order
            </button>
          </div>
          <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
            {orderType === 'MARKET'
              ? 'Execute immediately at best available price'
              : 'Execute only at specified price or better'}
          </p>
        </div>

        {/* Input Grid */}
        <div className={`grid ${orderType === 'LIMIT' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {/* Amount Input */}
          <div>
            <label className="text-xs font-medium text-navy-700 dark:text-navy-300 block mb-1">
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
                className="pr-16 text-sm py-1.5"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-12 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors z-10"
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
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                  Best Ask: €{bestAskPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Estimated Quantity (read-only) */}
          <div>
            <label className="text-xs font-medium text-navy-700 dark:text-navy-300 block mb-1">
              Est. Quantity
            </label>
            <div className="px-2 py-1.5 rounded-md border border-navy-200 dark:border-navy-600 bg-navy-50 dark:bg-navy-900 text-navy-900 dark:text-white font-mono text-sm flex items-center justify-between">
              {isLoadingPreview ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
              ) : preview && preview.totalQuantity != null ? (
                <span>{preview.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              ) : (
                <span className="text-navy-400">-</span>
              )}
              <span className="text-xs text-navy-500 ml-1">{certificateType}</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {isLoadingPreview && (
          <div className="flex items-center justify-center py-3 bg-white dark:bg-navy-800 rounded-md border border-navy-200 dark:border-navy-600">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mr-1.5" />
            <span className="text-xs text-navy-600 dark:text-navy-400">Loading preview...</span>
          </div>
        )}

        {previewError && (
          <div className="flex items-start gap-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-300 dark:border-red-700">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-900 dark:text-red-100">
                Preview Error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {previewError}
              </p>
            </div>
          </div>
        )}

        {preview && !isLoadingPreview && (
          <div className="p-2 bg-white dark:bg-navy-800 rounded-md border border-navy-200 dark:border-navy-600 space-y-1.5">
            <h3 className="text-xs font-semibold text-navy-900 dark:text-white">
              Order Preview
            </h3>

            <div className="space-y-1 text-xs">
              {/* Quantity */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Quantity</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  {(preview.totalQuantity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {certificateType}
                </span>
              </div>

              {/* Weighted Average Price */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Avg Price</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  ${(preview.weightedAvgPrice ?? 0).toFixed(2)}
                </span>
              </div>

              {/* Cost Before Fee */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">Cost</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  €{(preview.totalCostGross ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Platform Fee */}
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-navy-400">
                  Platform Fee ({((preview.platformFeeRate ?? 0) * 100).toFixed(2)}%)
                </span>
                <span className="font-mono font-semibold text-navy-600 dark:text-navy-400">
                  €{(preview.platformFeeAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-navy-200 dark:border-navy-600 pt-1 mt-1">
                {/* Total Cost */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-navy-900 dark:text-white">Total Cost</span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    €{(preview.totalCostNet ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Remaining Balance */}
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-navy-600 dark:text-navy-400">Remaining Balance</span>
                  <span className="text-xs font-mono font-semibold text-navy-900 dark:text-white">
                    €{(preview.remainingBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Message */}
            {!preview.canExecute && (
              <div className="flex items-start gap-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-300 dark:border-red-700">
                <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-900 dark:text-red-100">
                  {preview.executionMessage}
                </p>
              </div>
            )}

            {/* Limit order will be placed in book (no immediate liquidity) */}
            {preview.canExecute && preview.willBePlacedInBook && (
              <div className="flex items-start gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-blue-900 dark:text-blue-100 font-medium">
                    {preview.executionMessage}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                    Your order will wait until a seller matches your price
                  </p>
                </div>
              </div>
            )}

            {/* Immediate execution available */}
            {preview.canExecute && !preview.willBePlacedInBook && (
              <div className="flex items-start gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-300 dark:border-emerald-700">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 dark:text-emerald-100">
                  {preview.executionMessage}
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
          className={`w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-colors flex items-center justify-center gap-1.5 ${
            canSubmit
              ? preview?.willBePlacedInBook
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/25'
              : 'bg-navy-300 dark:bg-navy-700 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Placing Order...</span>
            </>
          ) : preview?.willBePlacedInBook ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Place Limit Order</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              <span>Buy {certificateType}</span>
            </>
          )}
        </motion.button>
      </form>
    </Card>
  );
}
