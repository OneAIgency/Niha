import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Leaf, Wind, AlertCircle, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button, DataTable, Badge, type Column } from '../common';
import { getMarketMakerBalances, getMarketMakerTransactions, createTransaction } from '../../services/api';
import { formatQuantity, formatRelativeTime } from '../../utils';
import { cn } from '../../utils';

interface MarketMakerTransactionsSectionProps {
  marketMakerId: string;
}

interface Balance {
  cea_balance: number;
  eua_balance: number;
}

interface Transaction {
  id: string;
  certificate_type: 'CEA' | 'EUA';
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  balance_after: number;
  notes?: string;
  created_at: string;
  created_by_email?: string;
  [key: string]: unknown;
}

export function MarketMakerTransactionsSection({ marketMakerId }: MarketMakerTransactionsSectionProps) {
  const [balances, setBalances] = useState<Balance>({ cea_balance: 0, eua_balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Transaction Modal State
  const [certificateType, setCertificateType] = useState<'CEA' | 'EUA'>('CEA');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketMakerId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balancesData, transactionsData] = await Promise.all([
        getMarketMakerBalances(marketMakerId),
        getMarketMakerTransactions(marketMakerId),
      ]);
      setBalances(balancesData);
      // Map API response to local Transaction type, filtering out any without certificate_type
      const mappedTransactions: Transaction[] = transactionsData
        .filter((t): t is typeof t & { certificate_type: 'CEA' | 'EUA' } =>
          t.certificate_type === 'CEA' || t.certificate_type === 'EUA'
        )
        .map(t => ({
          id: t.id,
          certificate_type: t.certificate_type,
          transaction_type: t.transaction_type as 'deposit' | 'withdrawal',
          amount: t.amount,
          balance_after: t.balance_after,
          notes: t.notes,
          created_at: t.created_at,
        }));
      setTransactions(mappedTransactions);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to load data:', err);
      setError(error.response?.data?.detail || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    setSubmitError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSubmitError('Please enter a valid amount greater than 0');
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

      // Reset form
      setAmount('');
      setNotes('');
      setShowAddModal(false);

      // Reload data
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSubmitError(error.response?.data?.detail || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const transactionColumns: Column<Transaction>[] = [
    {
      key: 'created_at',
      header: 'Date',
      width: '15%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300">
          {formatRelativeTime(typeof value === 'string' || value instanceof Date ? value : undefined)}
        </span>
      ),
    },
    {
      key: 'certificate_type',
      header: 'Certificate',
      width: '12%',
      align: 'center',
      render: (value) => (
        <Badge variant={value === 'CEA' ? 'warning' : 'info'}>
          {value === 'CEA' ? (
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              CEA
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              EUA
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Type',
      width: '12%',
      align: 'center',
      render: (value) => (
        <Badge variant={value === 'deposit' ? 'success' : 'danger'}>
          {value === 'deposit' ? (
            <span className="flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3" />
              Deposit
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ArrowDownCircle className="w-3 h-3" />
              Withdrawal
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '15%',
      align: 'right',
      render: (value, row) => (
        <span className={cn(
          'font-mono font-semibold',
          row.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'
        )}>
          {row.transaction_type === 'deposit' ? '+' : '-'}{formatQuantity(Number(value))}
        </span>
      ),
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      width: '15%',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-navy-900 dark:text-white">
          {formatQuantity(Number(value))}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      width: '25%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300 line-clamp-1">
          {value ? String(value) : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Balances Section */}
      <div>
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
          Current Balances
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Leaf className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">CEA Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {loading ? '...' : formatQuantity(balances.cea_balance)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Wind className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">EUA Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
              {loading ? '...' : formatQuantity(balances.eua_balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            Transaction History ({transactions.length})
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Transaction
            </Button>
          </div>
        </div>

        <DataTable
          columns={transactionColumns}
          data={transactions}
          loading={loading}
          loadingRows={5}
          emptyMessage="No transactions yet"
          rowKey="id"
        />
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                Add Transaction
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSubmitError(null);
                }}
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
                    <Leaf className={cn('w-5 h-5 mx-auto mb-1', certificateType === 'CEA' ? 'text-amber-600' : 'text-navy-400')} />
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
                    <Wind className={cn('w-5 h-5 mx-auto mb-1', certificateType === 'EUA' ? 'text-blue-600' : 'text-navy-400')} />
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
                    <ArrowUpCircle className={cn('w-5 h-5 mx-auto mb-1', transactionType === 'deposit' ? 'text-emerald-600' : 'text-navy-400')} />
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
                    <ArrowDownCircle className={cn('w-5 h-5 mx-auto mb-1', transactionType === 'withdrawal' ? 'text-red-600' : 'text-navy-400')} />
                    <span className="text-sm font-medium">Withdrawal</span>
                  </button>
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
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
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
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Error */}
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{submitError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setSubmitError(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddTransaction}
                loading={submitting}
                disabled={!amount || parseFloat(amount) <= 0}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Transaction
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
