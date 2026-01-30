import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, AlertCircle, CheckCircle, X } from 'lucide-react';
import { BackofficeLayout } from '../components/layout/BackofficeLayout';
import { LiquidityPreviewModal } from '../components/liquidity';
import { liquidityApi } from '../services/api';
import type { CertificateType } from '../types';
import type { LiquidityPreviewResponse, LiquidityCreationResponse } from '../types/liquidity';

export function CreateLiquidityPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');
  const [bidEur, setBidEur] = useState<string>('');
  const [askEur, setAskEur] = useState<string>('');
  const [preview, setPreview] = useState<LiquidityPreviewResponse | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<LiquidityCreationResponse | null>(null);

  const handlePreview = async () => {
    const bid = parseFloat(bidEur);
    const ask = parseFloat(askEur);

    if (isNaN(bid) || bid <= 0) {
      setError('Please enter a valid BID amount');
      return;
    }

    if (isNaN(ask) || ask <= 0) {
      setError('Please enter a valid ASK amount');
      return;
    }

    setError(null);
    setIsLoadingPreview(true);

    try {
      const previewData = await liquidityApi.previewLiquidity(certificateType, bid, ask);
      setPreview(previewData);
      setShowPreviewModal(true);
    } catch (err: unknown) {
      console.error('Preview error:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to preview liquidity. Please try again.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreate = async () => {
    const bid = parseFloat(bidEur);
    const ask = parseFloat(askEur);

    setIsCreating(true);
    setError(null);

    try {
      const result = await liquidityApi.createLiquidity({
        certificate_type: certificateType,
        bid_eur: bid,
        ask_eur: ask,
      });

      setSuccessMessage(result);
      // Reset form
      setBidEur('');
      setAskEur('');
      setPreview(null);
    } catch (err: unknown) {
      console.error('Creation error:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create liquidity. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <BackofficeLayout>
      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-100">
                  Liquidity Created Successfully!
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  {successMessage.message}
                </p>
                <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-emerald-400 block">Orders Created</span>
                    <span className="font-bold text-white">
                      {successMessage.orders_created}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block">Market Makers</span>
                    <span className="font-bold text-white">
                      {successMessage.market_makers_used}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block">Ticket ID</span>
                    <span className="font-mono font-bold text-white">
                      {successMessage.ticket_id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="p-1 hover:bg-emerald-800/50 rounded transition-colors"
              >
                <X className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-100">Error</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-800/50 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Form */}
        <div className="bg-navy-900 border border-navy-800 rounded-lg p-4">
          <div className="space-y-4">
            {/* Market Selector */}
            <div>
              <label className="block text-xs font-medium text-navy-400 mb-2">
                Market
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-navy-950 rounded-lg">
                {/* CEA Cash Market */}
                <button
                  onClick={() => setCertificateType('CEA')}
                  className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                    certificateType === 'CEA'
                      ? 'bg-amber-500 text-white'
                      : 'text-navy-400 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  CEA Cash
                </button>
                {/* Swap Market (uses EUA internally) */}
                <button
                  onClick={() => setCertificateType('EUA')}
                  className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                    certificateType === 'EUA'
                      ? 'bg-blue-500 text-white'
                      : 'text-navy-400 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  Swap
                </button>
              </div>
            </div>

            {/* Amount Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* BID EUR Amount */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-navy-400 mb-2">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  BID Total Value (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bidEur}
                  onChange={(e) => setBidEur(e.target.value)}
                  placeholder="Enter BID amount"
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-700/50 bg-navy-950 text-white text-sm font-mono placeholder-navy-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-navy-500 mt-1">
                  Total EUR for BUY orders
                </p>
              </div>

              {/* ASK EUR Amount */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-navy-400 mb-2">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  ASK Total Value (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={askEur}
                  onChange={(e) => setAskEur(e.target.value)}
                  placeholder="Enter ASK amount"
                  className="w-full px-3 py-2.5 rounded-lg border border-red-700/50 bg-navy-950 text-white text-sm font-mono placeholder-navy-600 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                />
                <p className="text-[10px] text-navy-500 mt-1">
                  Total EUR for SELL orders
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-xs text-blue-300 font-medium mb-1.5">
                How Liquidity Creation Works:
              </p>
              <ul className="text-[10px] text-blue-400 space-y-0.5 list-disc list-inside">
                <li>Distribute BID and ASK values across active Market Makers</li>
                <li>Create multiple price levels for realistic order book depth</li>
                <li>Match orders immediately if counterparty exists</li>
                <li>All actions are logged in the audit trail</li>
              </ul>
            </div>

            {/* Preview Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handlePreview}
              disabled={isLoadingPreview || isCreating}
              className="w-full py-3 rounded-lg font-bold text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2"
            >
              {isLoadingPreview ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Preview Liquidity
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <LiquidityPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        preview={preview}
        certificateType={certificateType}
        bidEur={parseFloat(bidEur) || 0}
        askEur={parseFloat(askEur) || 0}
        onConfirm={handleCreate}
        isCreating={isCreating}
      />
    </BackofficeLayout>
  );
}
