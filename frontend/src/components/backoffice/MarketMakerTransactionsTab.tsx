import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Leaf, Wind, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button, DataTable, Badge, AlertBanner, type Column } from '../common';
import { getMarketMakerBalances, getMarketMakerTransactions } from '../../services/api';
import { formatCertificateQuantity, formatRelativeTime } from '../../utils';
import { cn } from '../../utils';
import { BalanceCards } from './BalanceCards';
import { TransactionForm } from './TransactionForm';

type MarketMakerType = 'CEA_BUYER' | 'CEA_SELLER' | 'EUA_OFFER';

interface MarketMakerTransactionsTabProps {
  marketMakerId: string;
  mmType?: MarketMakerType;
  /** When false, CEA balance card is hidden. True only for CEA_SELLER. */
  showCea?: boolean;
  /** When false, EUA balance card is hidden. True only for EUA_OFFER. */
  showEua?: boolean;
  /** When false, CEA option is hidden in Add Transaction form. True for CEA_SELLER and CEA_BUYER. */
  showCeaOption?: boolean;
  /** When false, EUA option is hidden in Add Transaction form. True only for EUA_OFFER. */
  showEuaOption?: boolean;
}

/** Matches getMarketMakerBalances API response for use with BalanceCards detailed variant */
interface Balance {
  ceaBalance: number;
  euaBalance: number;
  eurBalance: number;
  ceaAvailable: number;
  euaAvailable: number;
  eurAvailable: number;
  ceaLocked: number;
  euaLocked: number;
  eurLocked: number;
}

interface Transaction {
  id: string;
  certificateType: 'CEA' | 'EUA';
  transactionType: 'deposit' | 'withdrawal';
  amount: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
  createdByEmail?: string;
  [key: string]: unknown;
}

export function MarketMakerTransactionsTab({
  marketMakerId,
  mmType,
  showCea = true,
  showEua = true,
  showCeaOption = true,
  showEuaOption = true,
}: MarketMakerTransactionsTabProps) {
  const [balances, setBalances] = useState<Balance>({
    ceaBalance: 0,
    euaBalance: 0,
    eurBalance: 0,
    ceaAvailable: 0,
    euaAvailable: 0,
    eurAvailable: 0,
    ceaLocked: 0,
    euaLocked: 0,
    eurLocked: 0,
  });
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
      // Map API response to local Transaction type, filtering out any without certificateType
      const mappedTransactions: Transaction[] = transactionsData
        .filter((t): t is typeof t & { certificateType: 'CEA' | 'EUA' } =>
          t.certificateType === 'CEA' || t.certificateType === 'EUA'
        )
        .map(t => ({
          id: t.id,
          certificateType: t.certificateType,
          transactionType: t.transactionType as 'deposit' | 'withdrawal',
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          notes: t.notes,
          createdAt: t.createdAt,
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

  const handleAddSuccess = () => {
    loadData();
  };

  const transactionColumns: Column<Transaction>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      width: '15%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300">
          {formatRelativeTime(String(value))}
        </span>
      ),
    },
    {
      key: 'certificateType',
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
      key: 'transactionType',
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
            row.transactionType === 'deposit' ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {row.transactionType === 'deposit' ? '+' : '-'}
          {formatCertificateQuantity(Number(value))}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      width: '15%',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-navy-900 dark:text-white">{formatCertificateQuantity(Number(value))}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      width: '25%',
      align: 'right',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300 line-clamp-1">{value ? String(value) : '-'}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {/* Balances Section - detailed variant shows EUR/CEA/EUA AVAILABLE, Initial Balance, Locked in Orders */}
      <div>
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">Current Balances</h3>
        <BalanceCards
          balances={{
            EUR: (mmType === 'CEA_BUYER' || balances.eurBalance > 0)
              ? {
                  available: balances.eurAvailable ?? 0,
                  locked: balances.eurLocked ?? 0,
                  total: balances.eurBalance ?? 0,
                }
              : undefined,
            CEA: { available: balances.ceaAvailable, locked: balances.ceaLocked, total: balances.ceaBalance },
            EUA: { available: balances.euaAvailable, locked: balances.euaLocked, total: balances.euaBalance },
          }}
          loading={loading}
          variant="detailed"
          showCea={showCea}
          showEua={showEua}
          forceShowEur={mmType === 'CEA_BUYER'}
        />
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
        currentBalances={{
          ceaBalance: balances.ceaBalance,
          euaBalance: balances.euaBalance,
          eurBalance: balances.eurBalance,
        }}
        useEur={mmType === 'CEA_BUYER'}
        showCea={showCeaOption}
        showEua={showEuaOption}
      />
    </div>
  );
}
