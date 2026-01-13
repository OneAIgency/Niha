import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Loader2,
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuthStore } from '../stores/useStore';
import { usePrices } from '../hooks/usePrices';
import { usersApi } from '../services/api';
import {
  StatCard,
  DataTable,
  Tabs,
  ProgressBar,
  type Column,
  type Tab,
} from '../components/common';

interface EntityBalance {
  entity_id: string;
  entity_name: string;
  balance_amount: number;
  balance_currency: string | null;
  total_deposited: number;
  deposit_count: number;
}

// Mock user account data - in production this would come from API
const MOCK_ACCOUNT = {
  eur_balance: 0,
  eur_locked: 5000000,
  cea_balance: 443014,
  cea_pending: 0,
  eua_balance: 0,
  eua_pending: 39357,
  pending_orders: 1,
};

// Mock holdings data
const MOCK_HOLDINGS = [
  {
    asset: 'EUR',
    balance: 0,
    locked: 5000000,
    avgPrice: null as number | null,
    value: 0,
    status: 'locked',
    statusText: 'Locked in order',
    pending: 0,
  },
  {
    asset: 'CEA',
    balance: 443014,
    locked: 0,
    avgPrice: 88.50,
    value: 4975000,
    status: 'available',
    statusText: 'Available',
    pending: 0,
  },
  {
    asset: 'EUA',
    balance: 0,
    locked: 0,
    pending: 39357,
    avgPrice: null as number | null,
    value: 0,
    status: 'pending',
    statusText: 'Pending delivery',
  },
];

// Mock pending orders
const MOCK_PENDING_ORDERS = [
  {
    id: 'SWAP-20260113-0015',
    date: '2026-01-13',
    type: 'SWAP',
    typeLabel: 'CEA → EUA',
    details: '443,014 CEA → 39,357 EUA',
    ratio: '1:11.2',
    status: 'pending',
    progress: 40,
    eta: '10 days',
  },
];

// Mock transaction history
const MOCK_TRANSACTIONS = [
  { id: 'SW001', date: '2026-01-13', type: 'SWAP', details: '443,014 CEA → 39,357 EUA', status: 'pending', ref: 'SWAP-20260113-0015' },
  { id: 'TX001', date: '2026-01-10', type: 'BUY CEA', details: '€5,000,000 → 443,014 CEA', status: 'done', ref: 'CEA-20260110-0042' },
  { id: 'DP001', date: '2026-01-08', type: 'DEPOSIT', details: '€5,000,000', status: 'done', ref: 'DEP-20260108-001' },
  { id: 'KYC01', date: '2026-01-05', type: 'KYC', details: 'Account approved', status: 'done', ref: '-' },
  { id: 'NDA01', date: '2026-01-02', type: 'NDA', details: 'NDA approved', status: 'done', ref: '-' },
];

// Holdings table columns
const holdingsColumns: Column<typeof MOCK_HOLDINGS[0]>[] = [
  {
    key: 'asset',
    header: 'Asset',
    render: (value) => <span className="text-white">{value}</span>,
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    cellClassName: 'font-mono',
    render: (value, row) => (
      <>
        {row.asset === 'EUR' ? (
          <span className="text-slate-400">€{value.toLocaleString()}</span>
        ) : (
          <span className={row.asset === 'CEA' ? 'text-amber-400' : 'text-blue-400'}>
            {value.toLocaleString()}
          </span>
        )}
        {row.pending && row.pending > 0 && (
          <div className="status-pending">+{row.pending.toLocaleString()} pending</div>
        )}
      </>
    ),
  },
  {
    key: 'avgPrice',
    header: 'Avg Price',
    align: 'right',
    cellClassName: 'font-mono text-slate-500',
    render: (value) => value ? `€${(value * 0.127).toFixed(2)}` : '—',
  },
  {
    key: 'value',
    header: 'Value',
    align: 'right',
    cellClassName: 'font-mono text-white',
    render: (value) => value > 0 ? `€${value.toLocaleString()}` : '—',
  },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    render: (_, row) => (
      <span className={
        row.status === 'available' ? 'status-available' :
        row.status === 'locked' ? 'status-pending' : 'status-pending'
      }>
        {row.statusText}
      </span>
    ),
  },
];

// Transaction table columns
const transactionColumns: Column<typeof MOCK_TRANSACTIONS[0]>[] = [
  {
    key: 'date',
    header: 'Date',
    cellClassName: 'text-slate-500 font-mono text-xs',
  },
  {
    key: 'type',
    header: 'Type',
    render: (value) => <span className="text-white">{value}</span>,
  },
  {
    key: 'details',
    header: 'Details',
    cellClassName: 'text-slate-400',
  },
  {
    key: 'status',
    header: 'Status',
    render: (value) => (
      <span className={value === 'done' ? 'status-available' : 'status-pending'}>
        {value === 'done' ? 'Complete' : 'Pending'}
      </span>
    ),
  },
];

// History tabs
const historyTabs: Tab[] = [
  { id: 'open', label: 'Open' },
  { id: 'history', label: 'All' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { prices } = usePrices();
  const [activeTab, setActiveTab] = useState<string>('open');
  const [entityBalance, setEntityBalance] = useState<EntityBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch balance data
  const fetchBalance = useCallback(async () => {
    if (user?.role === 'FUNDED' || user?.role === 'ADMIN') {
      try {
        const balance = await usersApi.getMyEntityBalance();
        setEntityBalance(balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    }
  }, [user?.role]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoadingBalance(true);
      await fetchBalance();
      setLoadingBalance(false);
    };
    init();
  }, [fetchBalance]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBalance();
    setIsRefreshing(false);
  }, [fetchBalance]);

  // Format helpers
  const formatNumber = (num: number, decimals = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number, currency = '€') => {
    return `${currency}${formatNumber(amount)}`;
  };

  // Get cash display value
  const getCashValue = () => {
    if (loadingBalance) return '';
    if (entityBalance) {
      const symbol = entityBalance.balance_currency === 'EUR' ? '€' : entityBalance.balance_currency || '€';
      return `${symbol}${formatNumber(entityBalance.balance_amount, 2)}`;
    }
    return formatCurrency(MOCK_ACCOUNT.eur_balance);
  };

  // Get cash subtitle
  const getCashSubtitle = () => {
    if (entityBalance) return 'Available';
    if (MOCK_ACCOUNT.eur_locked > 0) return `${formatCurrency(MOCK_ACCOUNT.eur_locked)} locked`;
    return 'Available';
  };

  // Filter transactions based on active tab
  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    tx => activeTab === 'history' || tx.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Bar - Matching Market Pages */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Portfolio Overview</h1>
                <p className="text-sm text-slate-400">Your account summary</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              {prices && (
                <>
                  <div>
                    <span className="text-slate-400 mr-2">EUA</span>
                    <span className="font-bold font-mono text-white">
                      €{prices.eua.price.toFixed(2)}
                    </span>
                    <span className={`ml-2 flex items-center gap-0.5 inline-flex ${
                      prices.eua.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {prices.eua.change_24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {prices.eua.change_24h >= 0 ? '+' : ''}{prices.eua.change_24h.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 mr-2">CEA</span>
                    <span className="font-bold font-mono text-white">
                      €{(prices.cea.price_eur || prices.cea.price * 0.127).toFixed(2)}
                    </span>
                    <span className={`ml-2 flex items-center gap-0.5 inline-flex ${
                      prices.cea.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {prices.cea.change_24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {prices.cea.change_24h >= 0 ? '+' : ''}{prices.cea.change_24h.toFixed(2)}%
                    </span>
                  </div>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Account Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loadingBalance ? (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div className="text-slate-500 text-xs uppercase tracking-wider mb-3">Cash</div>
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            ) : (
              <StatCard
                title="Cash"
                value={getCashValue()}
                subtitle={getCashSubtitle()}
                subtitleVariant={MOCK_ACCOUNT.eur_locked > 0 && !entityBalance ? 'warning' : 'default'}
                variant="minimal"
                className="border border-slate-800"
              />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <StatCard
              title="CEA"
              value={formatNumber(MOCK_ACCOUNT.cea_balance)}
              valueColor="amber"
              subtitle="tonnes CO₂"
              variant="minimal"
              className="border border-slate-800"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <StatCard
              title="EUA"
              value={formatNumber(MOCK_ACCOUNT.eua_balance)}
              valueColor="blue"
              subtitle={MOCK_ACCOUNT.eua_pending > 0 ? `+${formatNumber(MOCK_ACCOUNT.eua_pending)} pending` : 'tonnes CO₂'}
              subtitleVariant={MOCK_ACCOUNT.eua_pending > 0 ? 'warning' : 'default'}
              variant="minimal"
              className="border border-slate-800"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <StatCard
              title="Orders"
              value={MOCK_ACCOUNT.pending_orders}
              subtitle="in progress"
              variant="minimal"
              className="border border-slate-800"
            />
          </motion.div>
        </div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="font-semibold text-white">Holdings</h2>
            </div>
            <DataTable
              columns={holdingsColumns}
              data={MOCK_HOLDINGS}
              variant="dark"
              rowKey="asset"
              className="border-none rounded-none"
            />
          </div>
        </motion.div>

        {/* Pending Orders */}
        {MOCK_PENDING_ORDERS.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="font-semibold text-white">Active Orders</h2>
              </div>
              <div className="p-4 space-y-3">
                {MOCK_PENDING_ORDERS.map((order) => (
                  <div key={order.id} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="text-white font-medium">{order.typeLabel}</span>
                          <span className="text-slate-600 text-sm ml-3">{order.details}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="status-pending">ETA {order.eta}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar
                        value={order.progress}
                        variant="success"
                        size="sm"
                        animated
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-500 font-mono w-10">{order.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">History</h2>
              <Tabs
                tabs={historyTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
                size="sm"
              />
            </div>
            <DataTable
              columns={transactionColumns}
              data={filteredTransactions}
              variant="dark"
              rowKey="id"
              emptyMessage="No transactions"
              className="border-none rounded-none"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
