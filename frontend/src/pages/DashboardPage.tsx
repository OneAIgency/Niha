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
  Download,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/useStore';
import { getEffectiveRole } from '../utils/effectiveRole';
import { usePrices } from '../hooks/usePrices';
import { usersApi, cashMarketApi, swapsApi, settlementApi, backofficeApi } from '../services/api';
import type { Deposit } from '../types';
import {
  DataTable,
  Tabs,
  ProgressBar,
  Skeleton,
  Subheader,
  AlertBanner,
  type Column,
  type Tab,
} from '../components/common';
import { EuaScrapped, CeaScrapped } from '../components/dashboard';
import { SettlementTransactions } from '../components/dashboard/SettlementTransactions';
import { SettlementDetails } from '../components/dashboard/SettlementDetails';
import type { Order, SettlementBatch, SwapRequest } from '../types';

/**
 * Helper to safely get Order fields (handles both camelCase from Axios and snake_case from TypeScript types).
 * Axios interceptor transforms snake_case → camelCase, but TypeScript types still use snake_case.
 */
const getOrderField = (order: Order, field: 'createdAt' | 'certificateType' | 'filledQuantity' | 'remainingQuantity'): string | number => {
  const o = order as unknown as Record<string, unknown>;
  const snakeMap: Record<string, string> = {
    createdAt: 'created_at',
    certificateType: 'certificate_type',
    filledQuantity: 'filled_quantity',
    remainingQuantity: 'remaining_quantity',
  };
  return (o[field] ?? o[snakeMap[field]] ?? '') as string | number;
};

/**
 * Safely parse a date string, returning null if invalid
 */
const safeParseDate = (dateStr: unknown): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

interface EntityBalance {
  entityId: string;
  entityName: string;
  balanceAmount: number;
  balanceCurrency?: string | null;
  totalDeposited: number;
  depositCount: number;
}

interface EntityAssets {
  entityId: string;
  entityName: string;
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
}

interface Portfolio {
  cashAvailable: number;
  cashLocked: number;
  cashTotal: number;
  ceaAvailable: number;
  ceaLocked: number;
  ceaTotal: number;
  euaAvailable: number;
  euaPending: number;
  euaTotal: number;
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
  [key: string]: unknown;
}

// Transaction columns
const transactionColumns: Column<Transaction>[] = [
  {
    key: 'date',
    header: 'Date',
    width: '140px',
    cellClassName: 'text-navy-400 font-mono text-xs',
    render: (value) => String(value ?? ''),
  },
  {
    key: 'type',
    header: 'Type',
    width: '100px',
    render: (value) => {
      const colors: Record<string, string> = {
        SWAP: 'text-navy-400 bg-navy-500/20',
        BUY: 'text-emerald-400 bg-emerald-500/20',
        SELL: 'text-red-400 bg-red-500/20',
        DEPOSIT: 'text-blue-400 bg-blue-500/20',
        WITHDRAW: 'text-amber-400 bg-amber-500/20',
        SYSTEM: 'text-navy-400 dark:text-navy-400 bg-navy-500/20',
      };
      const typeKey = typeof value === 'string' ? value : '';
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[typeKey] || "text-navy-400 bg-navy-400/20"}`}>
          {String(value ?? '')}
        </span>
      );
    },
  },
  {
    key: 'description',
    header: 'Description',
    render: (value, row) => (
      <div>
        <div className="text-white font-medium">{String(value ?? '')}</div>
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
      if (value === null || value === undefined) return <span className="text-navy-500">—</span>;
      const numValue = typeof value === 'number' ? value : 0;
      const isPositive = numValue > 0;
      return (
        <span className={isPositive ? 'text-emerald-400' : 'text-white'}>
          {isPositive ? '+' : ''}€{Math.abs(numValue).toLocaleString()}
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
  const { user, simulatedRole } = useAuthStore();
  const effectiveRole = getEffectiveRole(user ?? null, simulatedRole);
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
  const [pendingCeaSettlements, setPendingCeaSettlements] = useState<SettlementBatch[]>([]);
  const [pendingEuaSettlements, setPendingEuaSettlements] = useState<SettlementBatch[]>([]);
  const lastLocationRef = useRef<string>('');
  const isRefreshingBalanceRef = useRef<boolean>(false);
  const isAmlUser = effectiveRole === 'AML';
  const [amlDeposit, setAmlDeposit] = useState<Deposit | null>(null);
  // AML modal: show on mount when AML; any click dismisses modal; blur stays while isAmlUser
  const [showAmlModal, setShowAmlModal] = useState(true);

  // Note: Balance update events follow the pattern { detail: { type: string, source?: string } }
  // Currently we just refresh on any balance update event

  // Derive portfolio from real data (prefer entityAssets over entityBalance for cash)
  const eurBalance = entityAssets?.eurBalance ?? entityBalance?.balanceAmount ?? 0;
  const portfolio: Portfolio = {
    cashAvailable: eurBalance,
    cashLocked: 0, // Would come from orders
    cashTotal: eurBalance,
    ceaAvailable: entityAssets?.ceaBalance ?? 0,
    ceaLocked: 0,
    ceaTotal: entityAssets?.ceaBalance ?? 0,
    euaAvailable: entityAssets?.euaBalance ?? 0,
    euaPending: 0,
    euaTotal: entityAssets?.euaBalance ?? 0,
  };

  // Calculate portfolio value
  const calculatePortfolioValue = useCallback(() => {
    const cashValue = portfolio.cashTotal;
    const ceaPrice = prices?.cea.price || 0;
    const euaPrice = prices?.eua.price || 0;

    const ceaValueEur = portfolio.ceaTotal * ceaPrice;
    const euaValueEur = portfolio.euaTotal * euaPrice;
    const pendingEuaValueEur = portfolio.euaPending * euaPrice;

    return {
      total: cashValue + ceaValueEur + euaValueEur,
      totalWithPending: cashValue + ceaValueEur + euaValueEur + pendingEuaValueEur,
      cash: cashValue,
      cea: ceaValueEur,
      eua: euaValueEur,
      pending: pendingEuaValueEur,
    };
  }, [portfolio.cashTotal, portfolio.ceaTotal, portfolio.euaTotal, portfolio.euaPending, prices]);

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
    // Allow balance fetch for all funded roles (CEA, EUA, SWAP, MM, ADMIN, etc.)
    // These roles have access to the /cash-market/user/balances endpoint
    const fundedRoles = ['ADMIN', 'MM', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA'];
    if (user?.role && fundedRoles.includes(user.role)) {
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
          entityId: balances.entityId || '',
          entityName: '',
          eurBalance: balances.eurBalance,
          ceaBalance: balances.ceaBalance,
          euaBalance: balances.euaBalance,
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

  /**
   * Fetches pending settlements for display in the Holdings cards.
   * Shows CEA amounts (T+3 settlement cycle) and EUA amounts (T+14 swap settlement).
   */
  const fetchSettlements = useCallback(async () => {
    try {
      const result = await settlementApi.getPendingSettlements();
      // Filter for CEA settlements that are not yet settled
      const ceaSettlements = result.data.filter(
        (s: SettlementBatch) => s.assetType === 'CEA' && s.status !== 'SETTLED' && s.status !== 'FAILED'
      );
      // Filter for EUA settlements from swaps that are not yet settled
      const euaSettlements = result.data.filter(
        (s: SettlementBatch) => s.assetType === 'EUA' && s.status !== 'SETTLED' && s.status !== 'FAILED'
      );
      setPendingCeaSettlements(ceaSettlements);
      setPendingEuaSettlements(euaSettlements);
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
      // Non-critical, don't block the UI
    }
  }, []);

  // Fetch AML deposit data
  useEffect(() => {
    if (!isAmlUser) return;
    const fetchAmlDeposit = async () => {
      try {
        const result = await backofficeApi.getMyDepositsAML({ limit: 1 });
        if (result.deposits.length > 0) {
          setAmlDeposit(result.deposits[0]);
        }
      } catch (err) {
        console.warn('Failed to fetch AML deposit:', err);
        // Try fallback endpoint
        try {
          const deposits = await usersApi.getMyDeposits();
          if (deposits.length > 0) {
            setAmlDeposit(deposits[0]);
          }
        } catch {
          // Non-critical
        }
      }
    };
    fetchAmlDeposit();
  }, [isAmlUser]);

  // When user is AML, show modal on enter; when role changes away from AML, reset so next AML visit shows modal again
  useEffect(() => {
    setShowAmlModal(isAmlUser);
  }, [isAmlUser]);

  // Initial fetch on mount
  useEffect(() => {
    const init = async () => {
      setLoadingBalance(true);
      setLoadingOrders(true);
      await Promise.all([fetchBalance(), fetchOrders(), fetchSwaps(), fetchSettlements()]);
      setLoadingBalance(false);
      setLoadingOrders(false);
    };
    init();
    lastLocationRef.current = location.pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBalance, fetchOrders, fetchSwaps, fetchSettlements]);

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
    await Promise.all([fetchBalance(), fetchOrders(), fetchSwaps(), fetchSettlements()]);
    setIsRefreshing(false);
  }, [fetchBalance, fetchOrders, fetchSwaps, fetchSettlements]);

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
    // Get fields safely (handles Axios camelCase transformation)
    const certType = getOrderField(order, 'certificateType') as string || 'CEA';
    const createdDate = safeParseDate(getOrderField(order, 'createdAt'));

    return {
      id: order.id,
      date: createdDate?.toLocaleString() || 'Unknown',
      type: isSwap ? 'SWAP' : order.side,
      description: isSwap
        ? `SWAP ${certType}`
        : `${order.side} ${certType}`,
      details: isSwap
        ? `${formatNumber(order.quantity)} ${certType} @ ratio ${order.price.toFixed(4)}`
        : `${formatNumber(order.quantity)} ${certType} @ €${order.price.toFixed(2)}`,
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
    const toQty = swap.equivalentQuantity || (swap.quantity * (swap.desiredRate || 0));
    const rate = swap.desiredRate || (toQty / fromQty);
    const s = swap as unknown as Record<string, unknown>; // Axios transforms to camelCase
    const createdDate = safeParseDate(s.createdAt ?? swap.createdAt);
    const fromType = (s.fromType as string) ?? swap.fromType ?? 'CEA';
    const toType = (s.toType as string) ?? swap.toType ?? 'EUA';

    return {
      id: swap.id,
      date: createdDate?.toLocaleString() || 'Unknown',
      type: 'SWAP',
      description: `SWAP ${fromType} → ${toType}`,
      details: `${formatNumber(fromQty)} ${fromType} → ${formatNumber(toQty)} ${toType} @ ${rate.toFixed(4)}`,
      amount: null, // Swaps don't have EUR amount
      status: swap.status === 'completed' || swap.status === 'matched' ? 'completed' : 'pending',
      ref: swap.anonymousCode || swap.id.substring(0, 16),
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
      available: portfolio.cashAvailable,
      locked: portfolio.cashLocked,
      pending: 0,
      total: portfolio.cashTotal,
      value: portfolio.cashTotal,
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
      available: portfolio.ceaAvailable,
      locked: portfolio.ceaLocked,
      pending: 0,
      total: portfolio.ceaTotal,
      value: portfolio.ceaTotal * (prices?.cea.price || 0),
      price: prices?.cea.price || 0,
      change: prices?.cea.change24h || 0,
    },
    {
      id: 'eua',
      asset: 'EUA',
      type: 'EU Emission Allowance',
      icon: Wind,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      available: portfolio.euaAvailable,
      locked: 0,
      pending: portfolio.euaPending,
      total: portfolio.euaTotal,
      value: portfolio.euaTotal * (prices?.eua.price || 0),
      price: prices?.eua.price || 0,
      change: prices?.eua.change24h || 0,
    },
  ];

  const isLoading = loadingBalance || loadingOrders;

  return (
    <div className="min-h-screen bg-navy-900 relative">
      {/* AML Blur Overlay */}
      {isAmlUser && (
        <div className="fixed inset-0 z-40" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="absolute inset-0 bg-navy-900/70" />
        </div>
      )}

      {/* AML Modal – click anywhere (including on modal) dismisses; blur stays via overlay above */}
      <AnimatePresence>
        {isAmlUser && showAmlModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setShowAmlModal(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAmlModal(false); }}
            aria-label="Dismiss AML review"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg"
            >
              {/* Modal card */}
              <div className="relative bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

                {/* Header */}
                <div className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white tracking-tight">AML Review</h2>
                      <p className="text-sm text-navy-400">Compliance verification in progress</p>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="px-8 pb-6">
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-2.5 h-2.5 rounded-full bg-amber-400"
                    />
                    <span className="text-sm font-semibold text-amber-400 tracking-wider uppercase">Under AML Approval</span>
                  </div>
                </div>

                {/* Deposit details */}
                <div className="px-8 pb-6">
                  <div className="space-y-4">
                    {/* Approved Amount */}
                    <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
                      <div className="text-xs text-navy-400 uppercase tracking-wider mb-2 font-medium">Approved Amount</div>
                      <div className="text-3xl font-mono font-bold text-white tracking-tight">
                        {amlDeposit?.amount
                          ? `€${amlDeposit.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : amlDeposit?.reportedAmount
                            ? `€${amlDeposit.reportedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '—'
                        }
                      </div>
                      <div className="text-xs text-navy-500 mt-1">{amlDeposit?.currency || 'EUR'}</div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUpRight className="w-3.5 h-3.5 text-navy-400" />
                          <span className="text-xs text-navy-400 uppercase tracking-wider font-medium">Reported</span>
                        </div>
                        <div className="text-sm font-mono text-white">
                          {amlDeposit?.reportedAt
                            ? new Date(amlDeposit.reportedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </div>
                        <div className="text-xs font-mono text-navy-500 mt-0.5">
                          {amlDeposit?.reportedAt
                            ? new Date(amlDeposit.reportedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            : ''
                          }
                        </div>
                      </div>

                      <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs text-navy-400 uppercase tracking-wider font-medium">Confirmed</span>
                        </div>
                        <div className="text-sm font-mono text-white">
                          {amlDeposit?.confirmedAt
                            ? new Date(amlDeposit.confirmedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </div>
                        <div className="text-xs font-mono text-navy-500 mt-0.5">
                          {amlDeposit?.confirmedAt
                            ? new Date(amlDeposit.confirmedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            : ''
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                  <div className="flex items-start gap-3 px-4 py-3 bg-navy-700/30 border border-navy-600/50 rounded-xl">
                    <Clock className="w-4 h-4 text-navy-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-navy-400 leading-relaxed">
                      Your deposit is under compliance review. Trading will be enabled once the review is complete. No action is required from your side.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="page-container py-6">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlertBanner variant="error" message={error} />
          </motion.div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 min-w-0">
          {/* Total Portfolio Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="portfolio-value-card dashboard-summary-card col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-5 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
              <span className="text-sm text-emerald-300/70 truncate">Total Portfolio Value</span>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton variant="textLg" width="60%" />
            ) : (
              <div className="flex flex-1 flex-col min-h-0 min-w-0">
                <div className="value-text-fluid text-white flex-1 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                  {formatCurrency(portfolioValue.total, 2)}
                </div>
                {portfolioValue.pending > 0 && (
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{formatCurrency(portfolioValue.pending)}
                    </span>
                    <span className="text-navy-400">pending</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Cash (EUR): for AML users, amber background and "UNDER AML APPROVAL" in secondary line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="content_wrapper dashboard-summary-card flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
              <span className="text-sm text-navy-400 truncate">Cash ({entityBalance?.balanceCurrency || 'EUR'})</span>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-navy-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-navy-300" />
              </div>
            </div>
            {loadingBalance ? (
              <Skeleton variant="textLg" width="50%" />
            ) : (
              <div className="flex flex-1 flex-col min-h-0 min-w-0">
                <div className="value-text-fluid text-white flex-1 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                  {formatCurrency(portfolio.cashAvailable, 2)}
                </div>
                {portfolio.cashLocked > 0 && (
                  <div className="flex items-center gap-2 text-xs shrink-0 min-w-0">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded truncate">
                      {formatCurrency(portfolio.cashLocked)} locked
                    </span>
                  </div>
                )}
                {!isAmlUser && entityBalance?.totalDeposited && entityBalance.totalDeposited > 0 && (
                  <div className="text-xs text-navy-500 mt-2 shrink-0 min-w-0 truncate">
                    Total deposited: {formatCurrency(entityBalance.totalDeposited, 2)}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* CEA Holdings */}
          {pendingCeaSettlements.length > 0 ? (
            // Settling state - clickable card with reduced opacity
            pendingCeaSettlements.map((settlement) => {
              const expectedDate = new Date(settlement.expectedSettlementDate);
              const createdDate = new Date(settlement.createdAt);
              const now = new Date();
              const totalDuration = expectedDate.getTime() - createdDate.getTime();
              const elapsed = now.getTime() - createdDate.getTime();
              const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

              return (
                <motion.div
                  key={settlement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    borderColor: ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.8)', 'rgba(245, 158, 11, 0.3)'],
                  }}
                  transition={{
                    delay: 0.1,
                    borderColor: {
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  }}
                  className="content_wrapper dashboard-summary-card relative cursor-pointer border-2 border-amber-500/30 hover:border-amber-500 flex flex-col min-h-0"
                  onClick={() => setSelectedSettlement(settlement)}
                >
                  {/* Progress bar as card background */}
                  <div
                    className="absolute inset-0 bg-amber-500/15"
                    style={{ width: `${progressPercent}%` }}
                  />

                  {/* Card content with reduced opacity */}
                  <div className="relative opacity-30 flex flex-col min-h-0 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
                      <span className="text-sm text-navy-400 truncate">CEA Holdings</span>
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                    <div className="value-text-fluid text-amber-400 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                      {formatNumber(settlement.quantity, 2)}
                      <span className="text-sm text-navy-500 ml-1">tCO₂</span>
                    </div>
                  </div>

                  {/* SETTLING badge and click hint */}
                  <div className="relative flex items-center justify-between gap-2 mt-2 shrink-0 min-w-0">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-semibold flex items-center gap-1.5 min-w-0 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      SETTLING
                    </span>
                    <span className="text-xs text-navy-400 hover:text-amber-400 transition-colors shrink-0">
                      Click for details →
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // Normal state - no pending settlements
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="content_wrapper dashboard-summary-card flex flex-col min-h-0"
            >
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
                <span className="text-sm text-navy-400 truncate">CEA Holdings</span>
                <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton variant="textLg" width="40%" />
              ) : (
                <div className="flex flex-1 flex-col min-h-0 min-w-0">
                  <div className="value-text-fluid text-amber-400 flex-1 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                    {formatNumber(portfolio.ceaTotal)}
                    <span className="text-sm text-navy-500 ml-1">tCO₂</span>
                  </div>
                  {portfolio.ceaLocked > 0 && (
                    <div className="flex items-center gap-2 text-xs shrink-0 min-w-0">
                      <span className="px-2 py-0.5 bg-navy-500/20 text-navy-400 rounded truncate flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3 shrink-0" />
                        {formatNumber(portfolio.ceaLocked)} in swap
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* EUA Holdings */}
          {pendingEuaSettlements.length > 0 ? (
            // Settling state - clickable card with reduced opacity (same as CEA)
            pendingEuaSettlements.map((settlement) => {
              const expectedDate = new Date(settlement.expectedSettlementDate);
              const createdDate = new Date(settlement.createdAt);
              const now = new Date();
              const totalDuration = expectedDate.getTime() - createdDate.getTime();
              const elapsed = now.getTime() - createdDate.getTime();
              const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

              return (
                <motion.div
                  key={settlement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    borderColor: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.3)'],
                  }}
                  transition={{
                    delay: 0.15,
                    borderColor: {
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  }}
                  className="content_wrapper dashboard-summary-card relative cursor-pointer border-2 border-blue-500/30 hover:border-blue-500 flex flex-col min-h-0"
                  onClick={() => setSelectedSettlement(settlement)}
                >
                  {/* Progress bar as card background */}
                  <div
                    className="absolute inset-0 bg-blue-500/15"
                    style={{ width: `${progressPercent}%` }}
                  />

                  {/* Card content with reduced opacity */}
                  <div className="relative opacity-30 flex flex-col min-h-0 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
                      <span className="text-sm text-navy-400 truncate">EUA Holdings</span>
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Wind className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <div className="value-text-fluid text-blue-400 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                      {formatNumber(settlement.quantity, 2)}
                      <span className="text-sm text-navy-500 ml-1">tCO₂</span>
                    </div>
                  </div>

                  {/* SETTLING badge and click hint */}
                  <div className="relative flex items-center justify-between gap-2 mt-2 shrink-0 min-w-0">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold flex items-center gap-1.5 min-w-0 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      SETTLING
                    </span>
                    <span className="text-xs text-navy-400 hover:text-blue-400 transition-colors shrink-0">
                      Click for details →
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // Normal state - no pending EUA settlements
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="content_wrapper dashboard-summary-card flex flex-col min-h-0"
            >
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0 min-w-0">
                <span className="text-sm text-navy-400 truncate">EUA Holdings</span>
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Wind className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton variant="textLg" width="40%" />
              ) : (
                <div className="flex flex-1 flex-col min-h-0 min-w-0">
                  <div className="value-text-fluid text-blue-400 flex-1 flex items-end min-h-0 min-w-0 overflow-hidden mb-1">
                    {formatNumber(portfolio.euaTotal)}
                    <span className="text-sm text-navy-500 ml-1">tCO₂</span>
                  </div>
                  {portfolio.euaPending > 0 && (
                    <div className="flex items-center gap-2 text-xs shrink-0 min-w-0">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded truncate flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        +{formatNumber(portfolio.euaPending)} pending
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Holdings Breakdown & Active Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Holdings Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="content_wrapper p-0 lg:col-span-2"
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
            className="content_wrapper p-0"
          >
            <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-navy-400" />
                <h2 className="font-semibold text-white">Active Orders</h2>
                {activeOrders.length > 0 && (
                  <span className="px-2 py-0.5 bg-navy-500/20 text-navy-400 text-xs rounded-full">
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
                              {order.side} {getOrderField(order, 'certificateType') || 'CEA'}
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
                              {(() => {
                                const filled = Number(getOrderField(order, 'filledQuantity')) || 0;
                                return filled > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                      <span className="text-navy-400">Filled</span>
                                      <span className="text-white font-mono">
                                        {formatNumber(filled)} / {formatNumber(order.quantity)}
                                      </span>
                                    </div>
                                    <ProgressBar
                                      value={(filled / order.quantity) * 100}
                                      variant="success"
                                      size="sm"
                                    />
                                  </div>
                                );
                              })()}

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
                                    {safeParseDate(getOrderField(order, 'createdAt'))?.toLocaleDateString() || 'Unknown'}
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
          className="content_wrapper p-0"
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
              emptyMessage="No orders found. Place your first order in CEA Cash."
              className="border-none rounded-none"
              getRowClassName={(row: Transaction) => {
                // Style swap transactions with navy accent to distinguish from regular BUY/SELL orders
                // Matches the SWAP badge color scheme used elsewhere in the application
                if (row.type === 'SWAP') {
                  return 'bg-navy-500/5 border-l-4 border-l-navy-500/50 hover:bg-navy-500/10';
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
