import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Leaf, Wind, Euro, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { AlertBanner, Button, NumberInput } from '../common';
import { createTransaction, depositEurToMarketMaker, withdrawEurFromMarketMaker } from '../../services/api';
import { cn, formatCertificateQuantity, formatCurrency } from '../../utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  marketMakerId: string;
  currentBalances: {
    ceaBalance: number;
    euaBalance: number;
    eurBalance?: number;
  };
  /** When true, form is in EUR mode (single EUR card, deposit/withdraw EUR). Used for CEA_BUYER. */
  useEur?: boolean;
  /** When false, CEA option is hidden and EUA is used (e.g. for EUA_OFFER / Swap market makers). Default true. */
  showCea?: boolean;
  /** When false, EUA option is hidden and CEA is used (e.g. for CEA_SELLER / CEA_BUYER market makers). Default true. */
  showEua?: boolean;
}

export function TransactionForm({
  isOpen,
  onClose,
  onSuccess,
  marketMakerId,
  currentBalances,
  useEur = false,
  showCea = true,
  showEua = true,
}: TransactionFormProps) {
  const [certificateType, setCertificateType] = useState<'CEA' | 'EUA'>(
    showCea && !showEua ? 'CEA' : showEua && !showCea ? 'EUA' : 'CEA'
  );
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCertificateType(showCea && !showEua ? 'CEA' : showEua && !showCea ? 'EUA' : 'CEA');
      setTransactionType('deposit');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, showCea, showEua]);

  const currentBalance = useEur
    ? (currentBalances.eurBalance ?? 0)
    : certificateType === 'CEA'
      ? (currentBalances.ceaBalance ?? 0)
      : (currentBalances.euaBalance ?? 0);
  const amountNum = parseFloat(amount) || 0;
  const isWithdrawal = transactionType === 'withdrawal';
  const insufficientBalance = isWithdrawal && amountNum > currentBalance;

  const handleSubmit = async () => {
    setError(null);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (insufficientBalance) {
      setError(
        useEur
          ? `Insufficient EUR balance. Available: ${formatCurrency(currentBalance, 'EUR')}`
          : `Insufficient ${certificateType} balance. Available: ${formatCertificateQuantity(currentBalance)}`
      );
      return;
    }

    setSubmitting(true);

    try {
      if (useEur) {
        if (isWithdrawal) {
          await withdrawEurFromMarketMaker(marketMakerId, amountNum, notes.trim() || undefined);
        } else {
          await depositEurToMarketMaker(marketMakerId, amountNum, notes.trim() || undefined);
        }
      } else {
        await createTransaction(marketMakerId, {
          certificate_type: certificateType,
          transaction_type: transactionType,
          amount: Math.floor(amountNum),
          notes: notes.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create transaction');
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
            {/* Currency / Certificate Type */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                {useEur ? 'Currency' : 'Certificate Type'} *
              </label>
              {useEur ? (
                <div className="flex">
                  <div className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-center w-full">
                    <Euro className="w-5 h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium">EUR</span>
                  </div>
                </div>
              ) : (
                <div className={cn('gap-3', showCea && showEua ? 'grid grid-cols-2' : 'flex')}>
                  {showCea && (
                    <button
                      onClick={() => setCertificateType('CEA')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-center',
                        !showEua && 'w-full',
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
                  )}
                  {showEua && (
                    <button
                      onClick={() => setCertificateType('EUA')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-center',
                        !showCea && 'w-full',
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
                  )}
                </div>
              )}
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
                <span className="text-navy-600 dark:text-navy-400">
                  Current {useEur ? 'EUR' : certificateType} Balance:
                </span>
                <span className="font-mono font-semibold text-navy-900 dark:text-white">
                  {useEur ? formatCurrency(currentBalance, 'EUR') : formatCertificateQuantity(currentBalance)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <NumberInput
                label="Amount *"
                value={amount}
                onChange={setAmount}
                placeholder={useEur ? '0.00' : '0'}
                suffix={useEur ? 'EUR' : certificateType}
                decimals={useEur ? 2 : 0}
                error={
                  insufficientBalance
                    ? `Insufficient balance. Maximum: ${useEur ? formatCurrency(currentBalance, 'EUR') : formatCertificateQuantity(currentBalance)}`
                    : undefined
                }
              />
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
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <AlertBanner variant="error" message={error} />
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
