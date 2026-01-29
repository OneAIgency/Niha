import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  ArrowRightLeft,
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
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
import { usersApi, cashMarketApi, swapsApi } from '../services/api';
import {
  DataTable,
  Tabs,
  ProgressBar,
  Skeleton,
  Subheader,
  type Column,
  type Tab,
} from '../components/common';
import { EuaScrapped, CeaScrapped } from '../components/dashboard';
import { SettlementTransactions } from '../components/dashboard/SettlementTransactions';
import { SettlementDetails } from '../components/dashboard/SettlementDetails';
import type { Order, SettlementBatch, SwapRequest } from '../types';

interface EntityBalance {
  entity_id: string;
  entity_name: string;
  balance_amount: number;
  balance_currency?: string | null;
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
    cellClassName: 'text-navy-400 font-mono text-xs',
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
        SYSTEM: 'text-navy-400 dark:text-navy-400 bg-navy-500/20',
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[value] || "text-navy-400 bg-navy-400/20"}`}>
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
        <div className="text-navy-500 text-xs">{row.details}</div>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cellClassName: 'font-mono',
    render: (value) => {
      if (value === null) return <span className="text-navy-500">—</span>;
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
        value === 'cancelled' ? 'text-navy-400' : 'text-amber-400'
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
    cellClassName: 'text-navy-500 font-mono text-xs',
  },
];

// History tabs
const historyTabs: Tab[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'settlements', label: 'Settlements' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { prices } = usePrices();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [entityBalance, setEntityBalance] = useState<EntityBalance | null>(null);
  const [entityAssets, setEntityAssets] = useState<EntityAssets | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementBatch | null>(null);
  const lastLocationRef = useRef<string>('');
  const isRefreshingBalanceRef = useRef<boolean>(false);

  // Note: Balance update events follow the pattern { detail: { type: string, source?: string } }
  // Currently we just refresh on any balance update event

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

  /**
   * Fetches balance and assets data from the cash market API endpoint.
   * 
   * Uses the same endpoint as the cash market page (`cashMarketApi.getUserBalances()`)
   * to ensure data consistency across the application. This endpoint queries the
   * EntityHolding table directly, providing accurate real-time balance data.
   * 
   * Features:
   * - Prevents overlapping calls using ref-based flag (race condition prevention)
   * - Maps API response to EntityAssets format for compatibility
   * - Fetches entity balance separately for deposit count (non-blocking)
   * - Returns boolean indicating success/failure for event dispatch logic
   * 
   * @returns Promise<boolean> - true if fetch succeeded, false otherwise
   */
  const fetchBalance = useCallback(async (): Promise<boolean> => {
    if (user?.role === 'FUNDED' || user?.role === 'ADMIN') {
      // Prevent overlapping calls using ref to avoid dependency issues
      if (isRefreshingBalanceRef.current) {
        return false;
      }

      isRefreshingBalanceRef.current = true;
      try {
        // Use cash market balances endpoint for accurate, real-time balance data
        // This ensures consistency with the cash market page
        const balances = await cashMarketApi.getUserBalances();
        
        // Map to entityAssets format for compatibility
        setEntityAssets({
          entity_id: balances.entity_id || '',
          entity_name: '',
          eur_balance: balances.eur_balance,
          cea_balance: balances.cea_balance,
          eua_balance: balances.eua_balance,
        });
        
        // Also fetch entity balance for deposit count if needed
        try {
          const balance = await usersApi.getMyEntityBalance();
          setEntityBalance(balance);
        } catch (err) {
          // If this fails, continue with assets data only
          console.warn('Failed to fetch entity balance:', err);
        }
        
        setError(null);
        return true; // Success
      } catch (err) {
        console.error('Failed to fetch balance/assets:', err);
        setError('Failed to load balance');
        return false; // Failure
      } finally {
        isRefreshingBalanceRef.current = false;
      }
    }
    return false;
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

  /**
   * Fetches completed swap transactions for display in transaction history.
   * Only includes swaps with status 'completed' or 'matched'.
   * 
   * Note: Errors are logged but not displayed to users as swap transactions
   * are supplementary data and failures should not interrupt the main dashboard experience.
   */
  const fetchSwaps = useCallback(async () => {
    try {
      const swapsData = await swapsApi.getMySwaps();
      // Filter for completed/matched swaps
      const completedSwaps = swapsData.data.filter(
        swap => swap.status === 'completed' || swap.status === 'matched'
      );
      setSwaps(completedSwaps);
    } catch (err) {
      console.error('Failed to fetch swaps:', err);
      // Note: We don't set error state here to avoid overwriting more critical errors
      // Swap transactions are supplementary data, so failure is non-critical
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const init = async () => {
      setLoadingBalance(true);
      setLoadingOrders(true);
      await Promise.all([fetchBalance(), fetchOrders(), fetchSwaps()]);
      setLoadingBalance(false);
      setLoadingOrders(false);
    };
    init();
    lastLocationRef.current = location.pathname;
  }, [fetchBalance, fetchOrders, fetchSwaps]);

  /**
   * Listens for balance update events triggered after trade execution.
   * 
   * Provides immediate balance refresh when trades are executed on other pages
   * (e.g., cash market page). Uses namespaced event name `nihao:balanceUpdated`
   * to avoid conflicts with other features.
   * 
   * Event payload structure:
   * - detail.type: 'trade_executed'
   * - detail.source: 'cash_market' (or other source)
   * 
   * The event listener is properly cleaned up on component unmount to prevent memory leaks.
   */
  useEffect(() => {
    const handleBalanceUpdate = (_event: Event) => {
      // Note: _event could be cast to BalanceUpdatedEvent if we need detail.type or detail.source for filtering
      // Immediately refresh balance when trade is executed
      fetchBalance();
    };

    window.addEventListener('nihao:balanceUpdated', handleBalanceUpdate as EventListener);
    return () => {
      window.removeEventListener('nihao:balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [fetchBalance]);

  /**
   * Continuous polling for balance updates (streaming-like behavior).
   * 
   * Refreshes balance every 5 seconds when the dashboard page is active to keep
   * balance data up-to-date. Uses ref-based flag check to prevent race conditions
   * from overlapping API calls.
   * 
   * Polling only occurs when:
   * - User is on the dashboard page (`location.pathname === '/dashboard'`)
   * - No balance refresh is currently in progress (`!isRefreshingBalanceRef.current`)
   * 
   * The polling interval is automatically cleaned up when:
   * - Component unmounts
   * - User navigates away from dashboard
   */
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;

    const interval = setInterval(() => {
      // Only poll if not already refreshing to prevent race conditions
      if (!isRefreshingBalanceRef.current) {
        fetchBalance();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [fetchBalance, location.pathname]);

  /**
   * Refreshes balance when navigating back to dashboard from other pages.
   * 
   * Ensures balance is updated after executing orders on the cash market page
   * or other pages that modify balance. Only triggers on actual navigation
   * (not on initial mount) by tracking previous location in a ref.
   */
  useEffect(() => {
    if (location.pathname === '/dashboard' && lastLocationRef.current !== location.pathname && lastLocationRef.current !== '') {
      // User navigated back to dashboard, refresh balance to show updated amounts
      fetchBalance();
    }
    lastLocationRef.current = location.pathname;
  }, [location.pathname, fetchBalance]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBalance(), fetchOrders(), fetchSwaps()]);
    setIsRefreshing(false);
  }, [fetchBalance, fetchOrders, fetchSwaps]);

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

  /**
   * Converts order records to transaction display format.
   * Handles both regular market orders (BUY/SELL) and swap orders.
   * Swap orders are identified by order.market === 'SWAP' and formatted differently.
   */
  const orderTransactions: Transaction[] = orders.map(order => {
    // Check if this is a swap order (SWAP market orders use price field for ratio)
    const isSwap = order.market === 'SWAP';
    
    return {
      id: order.id,
      date: new Date(order.created_at).toLocaleString(),
      type: isSwap ? 'SWAP' : order.side,
      description: isSwap 
        ? `SWAP ${order.certificate_type}` 
        : `${order.side} ${order.certificate_type}`,
      details: isSwap
        ? `${formatNumber(order.quantity)} ${order.certificate_type} @ ratio ${order.price.toFixed(4)}`
        : `${formatNumber(order.quantity)} ${order.certificate_type} @ €${order.price.toFixed(2)}`,
      amount: isSwap ? null : (order.side === 'BUY' ? -(order.quantity * order.price) : (order.quantity * order.price)),
      status: order.status === 'FILLED' ? 'completed' : order.status === 'CANCELLED' ? 'cancelled' : 'pending',
      ref: order.id.substring(0, 16),
    };
  });

  /**
   * Converts swap request records to transaction display format.
   * Calculates equivalent quantities and rates for display.
   */
  const swapTransactions: Transaction[] = swaps.map(swap => {
    const fromQty = swap.quantity;
    const toQty = swap.equivalent_quantity || (swap.quantity * (swap.desired_rate || 0));
    const rate = swap.desired_rate || (toQty / fromQty);
    
    return {
      id: swap.id,
      date: new Date(swap.created_at).toLocaleString(),
      type: 'SWAP',
      description: `SWAP ${swap.from_type} → ${swap.to_type}`,
      details: `${formatNumber(fromQty)} ${swap.from_type} → ${formatNumber(toQty)} ${swap.to_type} @ ${rate.toFixed(4)}`,
      amount: null, // Swaps don't have EUR amount
      status: swap.status === 'completed' || swap.status === 'matched' ? 'completed' : 'pending',
      ref: swap.anonymous_code || swap.id.substring(0, 16),
    };
  });

  // Combine and sort by date (most recent first)
  const transactions: Transaction[] = [...orderTransactions, ...swapTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'settlements') return false; // Settlements shown separately
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
    <div className="min-h-screen bg-navy-900">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Subheader
          icon={<LayoutDashboard className="w-5 h-5 text-emerald-500" />}
          title="Portfolio Dashboard"
          description="Nihao Group"
        >
          {prices && (
            <>
              <EuaScrapped priceData={prices.eua} />
              <CeaScrapped priceData={prices.cea} />
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-navy-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </Subheader>
      </motion.div>

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
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-5 contained"
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
                <div className="text-value-contained text-white mb-1">
                  {formatCurrency(portfolioValue.total, 2)}
                </div>
                {portfolioValue.pending > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{formatCurrency(portfolioValue.pending)}
                    </span>
                    <span className="text-navy-400">pending</span>
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
            className="bg-navy-800 rounded-xl border border-navy-700 p-5 contained"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-navy-400">Cash ({entityBalance?.balance_currency || 'EUR'})</span>
              <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-navy-300" />
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
                  <div className="text-xs text-navy-500 mt-2">
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
            className="bg-navy-800 rounded-xl border border-navy-700 p-5 contained"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-navy-400">CEA Holdings</span>
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
                  <span className="text-sm text-navy-500 ml-1">tCO₂</span>
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
            className="bg-navy-800 rounded-xl border border-navy-700 p-5 contained"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-navy-400">EUA Holdings</span>
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
                  <span className="text-sm text-navy-500 ml-1">tCO₂</span>
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
            className="lg:col-span-2 bg-navy-800 rounded-xl border border-navy-700 contained"
          >
            <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-navy-400" />
                <h2 className="font-semibold text-white">Holdings Breakdown</h2>
              </div>
              <button className="text-xs text-navy-400 hover:text-white flex items-center gap-1 transition-colors">
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
            <div className="divide-y divide-navy-700">
              {holdingsData.map((holding) => {
                const Icon = holding.icon;
                return (
                  <div key={holding.id} className="px-5 py-4 hover:bg-navy-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${holding.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${holding.iconColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{holding.asset}</span>
                            <span className="text-xs text-navy-500">{holding.type}</span>
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
                              <span className="text-navy-500">No holdings</span>
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
                            <span className="text-navy-500">
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
            className="bg-navy-800 rounded-xl border border-navy-700 contained"
          >
            <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-navy-400" />
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
                <div className="text-center py-8 text-navy-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active orders</p>
                  <p className="text-xs mt-1">Your orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-navy-700/50 rounded-lg overflow-hidden"
                    >
                      {/* Order Header */}
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-navy-700/70 transition-colors"
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
                            <div className="text-xs text-navy-500">
                              {formatNumber(order.quantity)} @ €{order.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            order.status === 'OPEN' ? 'bg-amber-500/20 text-amber-400' :
                            order.status === 'PARTIALLY_FILLED' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-navy-400/20 text-navy-400'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-navy-400 transition-transform ${
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
                                    <span className="text-navy-400">Filled</span>
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
                                <div className="bg-navy-800/50 rounded-lg p-3">
                                  <div className="text-navy-500 mb-1">Total Value</div>
                                  <div className="font-mono text-white">
                                    {formatCurrency(order.quantity * order.price, 2)}
                                  </div>
                                </div>
                                <div className="bg-navy-800/50 rounded-lg p-3">
                                  <div className="text-navy-500 mb-1">Created</div>
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

        {/* Pending Settlements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy-800 rounded-xl border border-navy-700 contained"
        >
          <div className="px-5 py-4 border-b border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-navy-400" />
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
              <button className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          {activeTab === 'settlements' ? (
            <div className="p-6">
              <SettlementTransactions
                onSettlementClick={setSelectedSettlement}
              />
            </div>
          ) : loadingOrders ? (
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
              getRowClassName={(row: Transaction) => {
                // Style swap transactions with violet accent to distinguish from regular BUY/SELL orders
                // Matches the SWAP badge color scheme used elsewhere in the application
                if (row.type === 'SWAP') {
                  return 'bg-violet-500/5 border-l-4 border-l-violet-500/50 hover:bg-violet-500/10';
                }
                return '';
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Settlement Details Modal */}
      {selectedSettlement && (
        <SettlementDetails
          settlementId={selectedSettlement.id}
          onClose={() => setSelectedSettlement(null)}
        />
      )}
    </div>
  );
}
