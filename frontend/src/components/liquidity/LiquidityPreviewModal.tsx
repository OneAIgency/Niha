import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy-900 border border-navy-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Liquidity Preview - {certificateType}
              </h2>
              <p className="text-xs text-navy-400">
                Review before creating liquidity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-navy-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-navy-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {!preview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="ml-2 text-sm text-navy-400">Loading preview...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* BID Summary */}
                <div className="p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">BID Orders</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Total Value</span>
                      <span className="font-bold text-white">€{formatNumber(bidEur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Total Quantity</span>
                      <span className="font-bold text-white">{formatNumber(preview.total_bid_quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Price Range</span>
                      <span className="font-mono text-navy-300 text-[10px]">
                        €{formatNumber(preview.price_levels.bid_price_range.min)} - €{formatNumber(preview.price_levels.bid_price_range.max)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Price Levels</span>
                      <span className="font-bold text-emerald-400">{preview.price_levels.bid_price_range.count}</span>
                    </div>
                  </div>
                </div>

                {/* ASK Summary */}
                <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-red-300">ASK Orders</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Total Value</span>
                      <span className="font-bold text-white">€{formatNumber(askEur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Total Quantity</span>
                      <span className="font-bold text-white">{formatNumber(preview.total_ask_quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Price Range</span>
                      <span className="font-mono text-navy-300 text-[10px]">
                        €{formatNumber(preview.price_levels.ask_price_range.min)} - €{formatNumber(preview.price_levels.ask_price_range.max)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Price Levels</span>
                      <span className="font-bold text-red-400">{preview.price_levels.ask_price_range.count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Makers Allocation */}
              <div>
                <h3 className="text-xs font-semibold text-white mb-2">
                  Market Maker Allocations ({preview.market_makers_count})
                </h3>

                {preview.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {preview.allocations.map((allocation, index) => (
                      <div
                        key={allocation.market_maker_id}
                        className="p-3 bg-navy-800/50 border border-navy-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white">
                            {allocation.market_maker_name}
                          </span>
                          <span className="text-[10px] text-navy-500">MM #{index + 1}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-navy-400 block mb-1">BID Orders</span>
                            <div className="flex justify-between">
                              <span className="text-navy-500">Quantity:</span>
                              <span className="font-mono font-semibold text-emerald-400">
                                {formatNumber(allocation.bid_quantity)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-navy-500">Value:</span>
                              <span className="font-mono font-semibold text-navy-300">
                                €{formatNumber(allocation.bid_value_eur)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-navy-400 block mb-1">ASK Orders</span>
                            <div className="flex justify-between">
                              <span className="text-navy-500">Quantity:</span>
                              <span className="font-mono font-semibold text-red-400">
                                {formatNumber(allocation.ask_quantity)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-navy-500">Value:</span>
                              <span className="font-mono font-semibold text-navy-300">
                                €{formatNumber(allocation.ask_value_eur)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-amber-100">
                      No Market Makers with assets available
                    </p>
                    <p className="text-[10px] text-amber-300 mt-1">
                      Cannot create liquidity without active Market Makers
                    </p>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <div
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  preview.can_create
                    ? 'bg-emerald-900/20 border-emerald-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}
              >
                {preview.can_create ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-medium ${
                    preview.can_create ? 'text-emerald-100' : 'text-red-100'
                  }`}>
                    {preview.can_create ? 'Ready to Create' : 'Cannot Create'}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${
                    preview.can_create ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {preview.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-navy-800">
          <button
            onClick={onClose}
            disabled={isSubmitting || isCreating}
            className="px-4 py-2 text-xs font-medium text-navy-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={!preview?.can_create || isSubmitting || isCreating}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting || isCreating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Create Liquidity
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
