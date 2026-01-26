import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, X, Leaf, Wind, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button, DataTable, Badge, type Column } from '../common';
import { getMarketMakerBalances, getMarketMakerTransactions } from '../../services/api';
import { formatQuantity, formatRelativeTime } from '../../utils';
import { cn } from '../../utils';
import { BalanceCards } from './BalanceCards';
import { TransactionForm } from './TransactionForm';

interface MarketMakerTransactionsTabProps {
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
}

export function MarketMakerTransactionsTab({ marketMakerId }: MarketMakerTransactionsTabProps) {
  const [balances, setBalances] = useState<Balance>({ cea_balance: 0, eua_balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
      setTransactions(transactionsData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to load data:', err);
      setError(error.response?.data?.detail || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    loadData();
  };

  const transactionColumns: Column<Transaction>[] = [
    {
      key: 'created_at',
      header: 'Date',
      width: '15%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300">
          {formatRelativeTime(value)}
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
        <span
          className={cn(
            'font-mono font-semibold',
            row.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {row.transaction_type === 'deposit' ? '+' : '-'}
          {formatQuantity(value)}
        </span>
      ),
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      width: '15%',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-navy-900 dark:text-white">{formatQuantity(value)}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      width: '25%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300 line-clamp-1">{value || '-'}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
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
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Current Balances</h3>
        <BalanceCards balances={balances} loading={loading} variant="simple" />
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
              icon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
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
      <TransactionForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        marketMakerId={marketMakerId}
        currentBalances={balances}
      />
    </div>
  );
}
