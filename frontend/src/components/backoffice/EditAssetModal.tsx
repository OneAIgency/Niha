import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Leaf, Wind, Save, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../common';
import { backofficeApi } from '../../services/api';
import { cn } from '../../utils';
import type { AssetType } from '../../types';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityId: string;
  entityName: string;
  assetType: AssetType;
  currentBalance: number;
}

const formatEUR = (v: number) => `€${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatQty = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });

const ASSET_CONFIG = {
  EUR: {
    label: 'EUR Cash',
    icon: DollarSign,
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500',
    ringClass: 'focus:ring-emerald-500',
    format: formatEUR,
  },
  CEA: {
    label: 'CEA Certificates',
    icon: Leaf,
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500',
    ringClass: 'focus:ring-amber-500',
    format: formatQty,
  },
  EUA: {
    label: 'EUA Certificates',
    icon: Wind,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500',
    ringClass: 'focus:ring-blue-500',
    format: formatQty,
  },
} as const;

export function EditAssetModal({
  isOpen,
  onClose,
  onSuccess,
  entityId,
  entityName,
  assetType,
  currentBalance,
}: EditAssetModalProps) {
  const [newBalance, setNewBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewBalance(currentBalance.toString());
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentBalance]);

  const handleSubmit = async () => {
    const newBalanceNum = parseFloat(newBalance);
    if (isNaN(newBalanceNum) || newBalanceNum < 0) {
      setError('Please enter a valid balance (0 or greater)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await backofficeApi.updateAssetBalance(entityId, assetType, {
        new_balance: newBalanceNum,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update balance');
    } finally {
      setLoading(false);
    }
  };

  const config = ASSET_CONFIG[assetType];
  const Icon = config.icon;

  const newBalanceNum = parseFloat(newBalance) || 0;
  const delta = newBalanceNum - currentBalance;
  const isIncrease = delta > 0;
  const isDecrease = delta < 0;
  const isUnchanged = delta === 0;

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
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2.5 rounded-xl', config.bgClass)}>
                    <Icon className={cn('w-5 h-5', config.textClass)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Edit {config.label}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {entityName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Current Balance */}
                <div className={cn('p-4 rounded-xl', config.bgClass)}>
                  <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Current Balance
                  </div>
                  <div className={cn('text-2xl font-bold font-mono', config.textClass)}>
                    {config.format(currentBalance)}
                  </div>
                </div>

                {/* New Balance Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Balance *
                  </label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder={assetType === 'EUR' ? '0.00' : '0'}
                    step={assetType === 'EUR' ? '0.01' : '1'}
                    min="0"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-lg',
                      'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
                      config.borderClass, config.ringClass
                    )}
                    autoFocus
                  />
                </div>

                {/* Notes (optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Notes <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for adjustment..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                  />
                </div>

                {/* Change Preview */}
                {newBalance && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-4 rounded-xl border',
                      isIncrease && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
                      isDecrease && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      isUnchanged && 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isIncrease && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                        {isDecrease && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {isUnchanged && <Minus className="w-4 h-4 text-slate-400" />}
                        <span className={cn(
                          'text-sm font-medium',
                          isIncrease && 'text-emerald-600 dark:text-emerald-400',
                          isDecrease && 'text-red-600 dark:text-red-400',
                          isUnchanged && 'text-slate-500'
                        )}>
                          {isIncrease && `+${config.format(delta)}`}
                          {isDecrease && config.format(delta)}
                          {isUnchanged && 'No change'}
                        </span>
                      </div>
                      <span className={cn('text-lg font-bold font-mono', config.textClass)}>
                        {config.format(newBalanceNum)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
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
                  disabled={!newBalance || parseFloat(newBalance) < 0}
                  className="flex-1"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
