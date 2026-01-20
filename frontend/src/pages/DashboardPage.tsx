import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Leaf,
  Wind,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/useStore';
import { usePrices } from '../hooks/usePrices';
import { usersApi, cashMarketApi } from '../services/api';
import {
  DataTable,
  Tabs,
  ProgressBar,
  Skeleton,
  type Column,
  type Tab,
} from '../components/common';
import type { Order } from '../types';

interface EntityBalance {
  entity_id: string;
  entity_name: string;
  balance_amount: number;
  balance_currency: string | null;
  total_deposited: number;
  deposit_count: number;
}

interface EntityAssets {
  entity_id: string;
  entity_name: string;
  eur_balance: number;
  cea_balance: number;
  eua_balance: number;
}

interface Portfolio {
  cash_available: number;
  cash_locked: number;
  cash_total: number;
  cea_available: number;
  cea_locked: number;
  cea_total: number;
  eua_available: number;
  eua_pending: number;
  eua_total: number;
}

// Transaction type for display
interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  details: string;
  amount: number | null;
  status: 'pending' | 'completed' | 'cancelled';
  ref: string;
}

// Transaction columns
const transactionColumns: Column<Transaction>[] = [
  {
    key: 'date',
    header: 'Date',
    width: '140px',
    cellClassName: 'text-slate-400 font-mono text-xs',
    render: (value) => value,
  },
  {
    key: 'type',
    header: 'Type',
    width: '100px',
    render: (value) => {
      const colors: Record<string, string> = {
        SWAP: 'text-violet-400 bg-violet-500/20',
        BUY: 'text-emerald-400 bg-emerald-500/20',
        SELL: 'text-red-400 bg-red-500/20',
        DEPOSIT: 'text-blue-400 bg-blue-500/20',
        WITHDRAW: 'text-orange-400 bg-orange-500/20',
        SYSTEM: 'text-slate-400 bg-slate-500/20',
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[value] || colors.SYSTEM}`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'description',
    header: 'Description',
    render: (value, row) => (
      <div>
        <div className="text-white font-medium">{value}</div>
        <div className="text-slate-500 text-xs">{row.details}</div>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cellClassName: 'font-mono',
    render: (value) => {
      if (value === null) return <span className="text-slate-500">—</span>;
      const isPositive = value > 0;
      return (
        <span className={isPositive ? 'text-emerald-400' : 'text-white'}>
          {isPositive ? '+' : ''}€{Math.abs(value).toLocaleString()}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    render: (value) => (
      <span className={`flex items-center justify-end gap-1 text-xs ${
        value === 'completed' ? 'text-emerald-400' :
        value === 'cancelled' ? 'text-slate-400' : 'text-amber-400'
      }`}>
        {value === 'completed' ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : value === 'cancelled' ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {value === 'completed' ? 'Complete' : value === 'cancelled' ? 'Cancelled' : 'Pending'}
      </span>
    ),
  },
  {
    key: 'ref',
    header: 'Reference',
    align: 'right',
    cellClassName: 'text-slate-500 font-mono text-xs',
  },
];

// History tabs
const historyTabs: Tab[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { prices } = usePrices();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [entityBalance, setEntityBalance] = useState<EntityBalance | null>(null);
  const [entityAssets, setEntityAssets] = useState<EntityAssets | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive portfolio from real data (prefer entityAssets over entityBalance for cash)
  const eurBalance = entityAssets?.eur_balance ?? entityBalance?.balance_amount ?? 0;
  const portfolio: Portfolio = {
    cash_available: eurBalance,
    cash_locked: 0, // Would come from orders
    cash_total: eurBalance,
    cea_available: entityAssets?.cea_balance ?? 0,
    cea_locked: 0,
    cea_total: entityAssets?.cea_balance ?? 0,
    eua_available: entityAssets?.eua_balance ?? 0,
    eua_pending: 0,
    eua_total: entityAssets?.eua_balance ?? 0,
  };

  // Calculate portfolio value
  const calculatePortfolioValue = useCallback(() => {
    const cashValue = portfolio.cash_total;
    const ceaPrice = prices?.cea.price || 0;
    const euaPrice = prices?.eua.price || 0;

    const ceaValueEur = portfolio.cea_total * ceaPrice;
    const euaValueEur = portfolio.eua_total * euaPrice;
    const pendingEuaValueEur = portfolio.eua_pending * euaPrice;

    return {
      total: cashValue + ceaValueEur + euaValueEur,
      totalWithPending: cashValue + ceaValueEur + euaValueEur + pendingEuaValueEur,
      cash: cashValue,
      cea: ceaValueEur,
      eua: euaValueEur,
      pending: pendingEuaValueEur,
    };
  }, [portfolio, prices]);

  const portfolioValue = calculatePortfolioValue();

  // Fetch balance and assets data
  const fetchBalance = useCallback(async () => {
    if (user?.role === 'FUNDED' || user?.role === 'ADMIN') {
      try {
        // Fetch both balance and assets in parallel
        const [balance, assets] = await Promise.all([
          usersApi.getMyEntityBalance(),
          usersApi.getMyEntityAssets(),
        ]);
        setEntityBalance(balance);
        setEntityAssets(assets);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch balance/assets:', err);
        setError('Failed to load balance');
      }
    }
  }, [user?.role]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const myOrders = await cashMarketApi.getMyOrders();
      setOrders(myOrders);
      if (myOrders.length > 0 && !expandedOrder) {
        setExpandedOrder(myOrders[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [expandedOrder]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoadingBalance(true);
      setLoadingOrders(true);
      await Promise.all([fetchBalance(), fetchOrders()]);
      setLoadingBalance(false);
      setLoadingOrders(false);
    };
    init();
  }, [fetchBalance, fetchOrders]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBalance(), fetchOrders()]);
    setIsRefreshing(false);
  }, [fetchBalance, fetchOrders]);

  // Format helpers
  const formatNumber = (num: number, decimals = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (amount: number, decimals = 0) => {
    return `€${formatNumber(amount, decimals)}`;
  };

  // Convert orders to transactions for display
  const transactions: Transaction[] = orders.map(order => ({
    id: order.id,
    date: new Date(order.created_at).toLocaleString(),
    type: order.side,
    description: `${order.side} ${order.certificate_type}`,
    details: `${formatNumber(order.quantity)} ${order.certificate_type} @ €${order.price.toFixed(2)}`,
    amount: order.side === 'BUY' ? -(order.quantity * order.price) : (order.quantity * order.price),
    status: order.status === 'FILLED' ? 'completed' : order.status === 'CANCELLED' ? 'cancelled' : 'pending',
    ref: order.id.substring(0, 16),
  }));

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return tx.status === 'pending';
    if (activeTab === 'completed') return tx.status === 'completed';
    return true;
  });

  // Active (pending) orders for display
  const activeOrders = orders.filter(o => o.status !== 'FILLED' && o.status !== 'CANCELLED');

  // Holdings breakdown
  const holdingsData = [
    {
      id: 'cash',
      asset: 'EUR',
      type: 'Cash',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      available: portfolio.cash_available,
      locked: portfolio.cash_locked,
      pending: 0,
      total: portfolio.cash_total,
      value: portfolio.cash_total,
      price: null as number | null,
      change: null as number | null,
    },
    {
      id: 'cea',
      asset: 'CEA',
      type: 'China Emission Allowance',
      icon: Leaf,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      available: portfolio.cea_available,
      locked: portfolio.cea_locked,
      pending: 0,
      total: portfolio.cea_total,
      value: portfolio.cea_total * (prices?.cea.price || 0),
      price: prices?.cea.price || 0,
      change: prices?.cea.change_24h || 0,
    },
    {
      id: 'eua',
      asset: 'EUA',
      type: 'EU Emission Allowance',
      icon: Wind,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      available: portfolio.eua_available,
      locked: 0,
      pending: portfolio.eua_pending,
      total: portfolio.eua_total,
      value: portfolio.eua_total * (prices?.eua.price || 0),
      price: prices?.eua.price || 0,
      change: prices?.eua.change_24h || 0,
    },
  ];

  const isLoading = loadingBalance || loadingOrders;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Portfolio Dashboard</h1>
                <p className="text-sm text-slate-400">
                  {entityBalance?.entity_name || 'Real-time portfolio overview'}
                </p>
              </div>
            </div>

            {/* Market Prices */}
            <div className="flex items-center gap-6 text-sm">
              {prices && (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Wind className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">EUA Price</div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-white">
                          €{prices.eua.price.toFixed(2)}
                        </span>
                        <span className={`flex items-center gap-0.5 text-xs ${
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
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">CEA Price</div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-white">
                          €{prices.cea.price.toFixed(2)}
                        </span>
                        <span className={`flex items-center gap-0.5 text-xs ${
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
                    </div>
                  </div>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </motion.div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Portfolio Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-emerald-300/70">Total Portfolio Value</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton variant="textLg" width="60%" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white font-mono mb-1">
                  {formatCurrency(portfolioValue.total, 2)}
                </div>
                {portfolioValue.pending > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{formatCurrency(portfolioValue.pending)}
                    </span>
                    <span className="text-slate-400">pending</span>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Cash */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Cash ({entityBalance?.balance_currency || 'EUR'})</span>
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-slate-300" />
              </div>
            </div>
            {loadingBalance ? (
              <Skeleton variant="textLg" width="50%" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white font-mono mb-2">
                  {formatCurrency(portfolio.cash_available, 2)}
                </div>
                {portfolio.cash_locked > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                      {formatCurrency(portfolio.cash_locked)} locked
                    </span>
                  </div>
                )}
                {entityBalance?.total_deposited && entityBalance.total_deposited > 0 && (
                  <div className="text-xs text-slate-500 mt-2">
                    Total deposited: {formatCurrency(entityBalance.total_deposited, 2)}
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* CEA Holdings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">CEA Holdings</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton variant="textLg" width="40%" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-400 font-mono mb-2">
                  {formatNumber(portfolio.cea_total)}
                  <span className="text-sm text-slate-500 ml-1">tCO₂</span>
                </div>
                {portfolio.cea_locked > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3" />
                      {formatNumber(portfolio.cea_locked)} in swap
                    </span>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* EUA Holdings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">EUA Holdings</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Wind className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton variant="textLg" width="40%" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400 font-mono mb-2">
                  {formatNumber(portfolio.eua_total)}
                  <span className="text-sm text-slate-500 ml-1">tCO₂</span>
                </div>
                {portfolio.eua_pending > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      +{formatNumber(portfolio.eua_pending)} pending
                    </span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>

        {/* Holdings Breakdown & Active Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Holdings Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-white">Holdings Breakdown</h2>
              </div>
              <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {holdingsData.map((holding) => {
                const Icon = holding.icon;
                return (
                  <div key={holding.id} className="px-5 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${holding.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${holding.iconColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{holding.asset}</span>
                            <span className="text-xs text-slate-500">{holding.type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            {holding.available > 0 && (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {holding.asset === 'EUR' ? formatCurrency(holding.available, 2) : formatNumber(holding.available)} available
                              </span>
                            )}
                            {holding.locked > 0 && (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {holding.asset === 'EUR' ? formatCurrency(holding.locked) : formatNumber(holding.locked)} locked
                              </span>
                            )}
                            {holding.pending > 0 && (
                              <span className="text-blue-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                +{formatNumber(holding.pending)} pending
                              </span>
                            )}
                            {holding.available === 0 && holding.locked === 0 && holding.pending === 0 && (
                              <span className="text-slate-500">No holdings</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-white">
                          {formatCurrency(holding.value, 2)}
                        </div>
                        {holding.price !== null && holding.price > 0 && (
                          <div className="flex items-center justify-end gap-2 mt-1 text-xs">
                            <span className="text-slate-500">
                              €{holding.price.toFixed(2)}/t
                            </span>
                            {holding.change !== null && (
                              <span className={`flex items-center gap-0.5 ${
                                holding.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {holding.change >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {Math.abs(holding.change).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Active Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-white">Active Orders</h2>
                {activeOrders.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                    {activeOrders.length}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              {loadingOrders ? (
                <div className="space-y-3">
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active orders</p>
                  <p className="text-xs mt-1">Your orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-800/50 rounded-lg overflow-hidden"
                    >
                      {/* Order Header */}
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            order.side === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          }`}>
                            {order.side === 'BUY' ? (
                              <ArrowDownRight className={`w-4 h-4 text-emerald-400`} />
                            ) : (
                              <ArrowUpRight className={`w-4 h-4 text-red-400`} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-white text-sm">
                              {order.side} {order.certificate_type}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatNumber(order.quantity)} @ €{order.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            order.status === 'OPEN' ? 'bg-amber-500/20 text-amber-400' :
                            order.status === 'PARTIALLY_FILLED' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedOrder === order.id ? 'rotate-90' : ''
                          }`} />
                        </div>
                      </button>

                      {/* Order Details */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {/* Progress */}
                              {order.filled_quantity > 0 && (
                                <div>
                                  <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-slate-400">Filled</span>
                                    <span className="text-white font-mono">
                                      {formatNumber(order.filled_quantity)} / {formatNumber(order.quantity)}
                                    </span>
                                  </div>
                                  <ProgressBar
                                    value={(order.filled_quantity / order.quantity) * 100}
                                    variant="success"
                                    size="sm"
                                  />
                                </div>
                              )}

                              {/* Details */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="text-slate-500 mb-1">Total Value</div>
                                  <div className="font-mono text-white">
                                    {formatCurrency(order.quantity * order.price, 2)}
                                  </div>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="text-slate-500 mb-1">Created</div>
                                  <div className="font-mono text-white">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-white">Order History</h2>
            </div>
            <div className="flex items-center gap-3">
              <Tabs
                tabs={historyTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
                size="sm"
              />
              <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          {loadingOrders ? (
            <div className="p-6 space-y-3">
              <Skeleton variant="rectangular" height={50} />
              <Skeleton variant="rectangular" height={50} />
              <Skeleton variant="rectangular" height={50} />
            </div>
          ) : (
            <DataTable
              columns={transactionColumns}
              data={filteredTransactions}
              variant="dark"
              rowKey="id"
              emptyMessage="No orders found. Place your first order in the Cash Market."
              className="border-none rounded-none"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
