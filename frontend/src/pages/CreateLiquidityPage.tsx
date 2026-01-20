import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Card } from '../components/common';
import { LiquidityPreviewModal } from '../components/liquidity';
import { liquidityApi } from '../services/api';
import type { CertificateType } from '../types';
import type { LiquidityPreviewResponse, LiquidityCreationResponse } from '../types/liquidity';

export function CreateLiquidityPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('EUA');
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
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(err.response?.data?.detail || 'Failed to preview liquidity. Please try again.');
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
    } catch (err: any) {
      console.error('Creation error:', err);
      setError(err.response?.data?.detail || 'Failed to create liquidity. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Create Liquidity</h1>
          </div>
          <p className="text-navy-600 dark:text-navy-300">
            Add liquidity to the order book using Market Maker balances
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Liquidity Created Successfully!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                {successMessage.message}
              </p>
              <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 block">Orders Created</span>
                  <span className="font-bold text-emerald-900 dark:text-emerald-100">
                    {successMessage.orders_created}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 block">Market Makers Used</span>
                  <span className="font-bold text-emerald-900 dark:text-emerald-100">
                    {successMessage.market_makers_used}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 block">Ticket ID</span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-100">
                    {successMessage.ticket_id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-800/30 rounded transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </motion.div>
        )}

        {/* Main Form */}
        <Card padding="lg">
          <div className="space-y-6">
            {/* Certificate Type Selector */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-3">
                Certificate Type
              </label>
              <div className="flex rounded-lg overflow-hidden border-2 border-navy-200 dark:border-navy-600">
                {(['EUA', 'CEA'] as CertificateType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCertificateType(type)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      certificateType === type
                        ? type === 'EUA'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Inputs Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* BID EUR Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  BID Total Value (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bidEur}
                  onChange={(e) => setBidEur(e.target.value)}
                  placeholder="Enter BID amount in EUR"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-200 dark:border-green-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  Total EUR to allocate for BUY orders
                </p>
              </div>

              {/* ASK EUR Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ASK Total Value (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={askEur}
                  onChange={(e) => setAskEur(e.target.value)}
                  placeholder="Enter ASK amount in EUR"
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-200 dark:border-red-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  Total EUR to allocate for SELL orders
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                How Liquidity Creation Works:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Distribute BID and ASK values across active Market Makers</li>
                <li>Create multiple price levels for realistic order book depth</li>
                <li>Match orders immediately if counterparty exists</li>
                <li>All actions are logged in the audit trail</li>
              </ul>
            </div>

            {/* Preview Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handlePreview}
              loading={isLoadingPreview}
              disabled={isLoadingPreview || isCreating}
              className="w-full"
            >
              {isLoadingPreview ? (
                'Loading Preview...'
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Preview Liquidity
                </>
              )}
            </Button>
          </div>
        </Card>
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
    </div>
  );
}
