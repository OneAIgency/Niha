import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Leaf, Wind, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '../common';
import { createTransaction } from '../../services/api';
import { cn } from '../../utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  marketMakerId: string;
  currentBalances: {
    cea_balance: number;
    eua_balance: number;
  };
}

export function TransactionForm({
  isOpen,
  onClose,
  onSuccess,
  marketMakerId,
  currentBalances,
}: TransactionFormProps) {
  const [certificateType, setCertificateType] = useState<'CEA' | 'EUA'>('CEA');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCertificateType('CEA');
      setTransactionType('deposit');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const currentBalance = certificateType === 'CEA' ? (currentBalances.cea_balance ?? 0) : (currentBalances.eua_balance ?? 0);
  const amountNum = parseFloat(amount) || 0;
  const isWithdrawal = transactionType === 'withdrawal';
  const insufficientBalance = isWithdrawal && amountNum > currentBalance;

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (insufficientBalance) {
      setError(`Insufficient ${certificateType} balance. Available: ${currentBalance}`);
      return;
    }

    setSubmitting(true);

    try {
      await createTransaction(marketMakerId, {
        certificate_type: certificateType,
        transaction_type: transactionType,
        amount: amountNum,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Add Transaction
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Certificate Type */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Certificate Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCertificateType('CEA')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    certificateType === 'CEA'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300'
                  )}
                >
                  <Leaf
                    className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      certificateType === 'CEA' ? 'text-amber-600' : 'text-navy-400'
                    )}
                  />
                  <span className="text-sm font-medium">CEA</span>
                </button>
                <button
                  onClick={() => setCertificateType('EUA')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    certificateType === 'EUA'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300'
                  )}
                >
                  <Wind
                    className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      certificateType === 'EUA' ? 'text-blue-600' : 'text-navy-400'
                    )}
                  />
                  <span className="text-sm font-medium">EUA</span>
                </button>
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTransactionType('deposit')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    transactionType === 'deposit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300'
                  )}
                >
                  <ArrowUpCircle
                    className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      transactionType === 'deposit' ? 'text-emerald-600' : 'text-navy-400'
                    )}
                  />
                  <span className="text-sm font-medium">Deposit</span>
                </button>
                <button
                  onClick={() => setTransactionType('withdrawal')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    transactionType === 'withdrawal'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300'
                  )}
                >
                  <ArrowDownCircle
                    className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      transactionType === 'withdrawal' ? 'text-red-600' : 'text-navy-400'
                    )}
                  />
                  <span className="text-sm font-medium">Withdrawal</span>
                </button>
              </div>
            </div>

            {/* Current Balance Info */}
            <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-900/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy-600 dark:text-navy-400">Current {certificateType} Balance:</span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  {currentBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 transition-all',
                  insufficientBalance
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-navy-200 dark:border-navy-700 focus:ring-purple-500'
                )}
                autoFocus
              />
              {insufficientBalance && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Insufficient balance. Maximum: {currentBalance}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Notes <span className="text-navy-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add transaction notes..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!amount || parseFloat(amount) <= 0 || insufficientBalance}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Transaction
            </Button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
