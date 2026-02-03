import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Leaf, Wind, Plus } from 'lucide-react';
import { Button, AlertBanner } from '../common';
import { backofficeApi } from '../../services/api';
import { cn } from '../../utils';
import type { AssetType } from '../../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityId: string;
  entityName: string;
}

interface EntityAssets {
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
}

const formatEUR = (v: number) => `€${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatQty = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });

const ASSET_CONFIG = {
  EUR: {
    label: 'EUR Cash',
    icon: DollarSign,
    color: 'emerald',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500',
    format: formatEUR,
  },
  CEA: {
    label: 'CEA Certificates',
    icon: Leaf,
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500',
    format: formatQty,
  },
  EUA: {
    label: 'EUA Certificates',
    icon: Wind,
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500',
    format: formatQty,
  },
} as const;

export function AddAssetModal({
  isOpen,
  onClose,
  onSuccess,
  entityId,
  entityName,
}: AddAssetModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('EUR');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<EntityAssets | null>(null);

  // Fetch current assets when modal opens
  useEffect(() => {
    if (isOpen && entityId) {
      fetchAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entityId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAsset('EUR');
      setAmount('');
      setReference('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const data = await backofficeApi.getEntityAssets(entityId);
      setAssets({
        eurBalance: data.eurBalance,
        ceaBalance: data.ceaBalance,
        euaBalance: data.euaBalance,
      });
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      // If new entity, show zeros
      setAssets({ eurBalance: 0, ceaBalance: 0, euaBalance: 0 });
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await backofficeApi.addAsset(entityId, {
        asset_type: selectedAsset,
        amount: amountNum,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBalance = (): number => {
    if (!assets) return 0;
    switch (selectedAsset) {
      case 'EUR': return assets.eurBalance;
      case 'CEA': return assets.ceaBalance;
      case 'EUA': return assets.euaBalance;
    }
  };

  const getNewBalance = (): number => {
    const current = getCurrentBalance();
    const amountNum = parseFloat(amount) || 0;
    return current + amountNum;
  };

  const config = ASSET_CONFIG[selectedAsset];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
                <div>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-500" />
                    Add Asset
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                    {entityName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Asset Type Tabs */}
              <div className="p-6 pb-0">
                <div className="flex gap-2 p-1 bg-navy-100 dark:bg-navy-800 rounded-xl">
                  {(['EUR', 'CEA', 'EUA'] as const).map((asset) => {
                    const cfg = ASSET_CONFIG[asset];
                    const Icon = cfg.icon;
                    const isSelected = selectedAsset === asset;
                    return (
                      <button
                        key={asset}
                        onClick={() => setSelectedAsset(asset)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all',
                          isSelected
                            ? `bg-white dark:bg-navy-700 shadow-sm ${cfg.textClass}`
                            : 'text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {asset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Current Balance */}
                <div className={cn('p-4 rounded-xl', config.bgClass)}>
                  <div className="text-xs uppercase tracking-wider text-navy-500 dark:text-navy-400 mb-1">
                    Current {config.label} Balance
                  </div>
                  <div className={cn('text-2xl font-bold font-mono', config.textClass)}>
                    {loadingAssets ? '...' : config.format(getCurrentBalance())}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Amount to Add *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={selectedAsset === 'EUR' ? '0.00' : '0'}
                    step={selectedAsset === 'EUR' ? '0.01' : '1'}
                    min="0"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono text-lg',
                      'placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
                      amount && parseFloat(amount) > 0
                        ? `${config.borderClass} focus:ring-${config.color}-500`
                        : 'border-navy-200 dark:border-navy-700 focus:ring-navy-500'
                    )}
                    autoFocus
                  />
                </div>

                {/* Reference (optional) */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Reference <span className="text-navy-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Wire reference, certificate ID..."
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>

                {/* Notes (optional) */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Admin Notes <span className="text-navy-400">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                  />
                </div>

                {/* New Balance Preview */}
                {amount && parseFloat(amount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-navy-50 dark:bg-navy-800/50 rounded-xl border border-navy-200 dark:border-navy-700"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-navy-500 dark:text-navy-400">
                        New Balance
                      </span>
                      <span className={cn('text-lg font-bold font-mono', config.textClass)}>
                        {config.format(getNewBalance())}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <AlertBanner variant="error" message={error} />
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedAsset}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
