import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { Button } from '../common';
import type { CertificateType } from '../../types';
import type { LiquidityPreviewResponse } from '../../types/liquidity';

interface LiquidityPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: LiquidityPreviewResponse | null;
  certificateType: CertificateType;
  bidEur: number;
  askEur: number;
  onConfirm: () => Promise<void>;
  isCreating: boolean;
}

export function LiquidityPreviewModal({
  isOpen,
  onClose,
  preview,
  certificateType,
  bidEur,
  askEur,
  onConfirm,
  isCreating,
}: LiquidityPreviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to create liquidity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                Liquidity Preview - {certificateType}
              </h2>
              <p className="text-sm text-navy-600 dark:text-navy-400">
                Review before creating liquidity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!preview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <span className="ml-3 text-navy-600 dark:text-navy-400">Loading preview...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* BID Summary */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">BID Orders</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Total Value</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">€{formatNumber(bidEur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Total Quantity</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{formatNumber(preview.total_bid_quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Price Range</span>
                      <span className="text-xs font-mono text-navy-700 dark:text-navy-300">
                        €{formatNumber(preview.price_levels.bid_price_range.min)} - €{formatNumber(preview.price_levels.bid_price_range.max)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Price Levels</span>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">{preview.price_levels.bid_price_range.count}</span>
                    </div>
                  </div>
                </div>

                {/* ASK Summary */}
                <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">ASK Orders</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Total Value</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">€{formatNumber(askEur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Total Quantity</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{formatNumber(preview.total_ask_quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Price Range</span>
                      <span className="text-xs font-mono text-navy-700 dark:text-navy-300">
                        €{formatNumber(preview.price_levels.ask_price_range.min)} - €{formatNumber(preview.price_levels.ask_price_range.max)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-navy-600 dark:text-navy-400">Price Levels</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">{preview.price_levels.ask_price_range.count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Makers Allocation */}
              <div>
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-3">
                  Market Maker Allocations ({preview.market_makers_count})
                </h3>

                {preview.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {preview.allocations.map((allocation, index) => (
                      <div
                        key={allocation.market_maker_id}
                        className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-navy-900 dark:text-white">
                            {allocation.market_maker_name}
                          </span>
                          <span className="text-xs text-navy-500">MM #{index + 1}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-navy-600 dark:text-navy-400 block mb-1">BID Orders</span>
                            <div className="flex justify-between">
                              <span className="text-xs text-navy-500">Quantity:</span>
                              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                {formatNumber(allocation.bid_quantity)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-navy-500">Value:</span>
                              <span className="font-mono font-semibold text-navy-700 dark:text-navy-300">
                                €{formatNumber(allocation.bid_value_eur)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-navy-600 dark:text-navy-400 block mb-1">ASK Orders</span>
                            <div className="flex justify-between">
                              <span className="text-xs text-navy-500">Quantity:</span>
                              <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                                {formatNumber(allocation.ask_quantity)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-navy-500">Value:</span>
                              <span className="font-mono font-semibold text-navy-700 dark:text-navy-300">
                                €{formatNumber(allocation.ask_value_eur)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      No Market Makers with assets available
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Cannot create liquidity without active Market Makers
                    </p>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <div
                className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  preview.can_create
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}
              >
                {preview.can_create ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    preview.can_create
                      ? 'text-emerald-900 dark:text-emerald-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {preview.can_create ? 'Ready to Create' : 'Cannot Create'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    preview.can_create
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {preview.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting || isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!preview?.can_create || isSubmitting || isCreating}
            loading={isSubmitting || isCreating}
          >
            {isSubmitting || isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Liquidity...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Create Liquidity
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
