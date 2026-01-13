import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Leaf,
  ArrowRightLeft,
  Wallet,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../stores/useStore';
import { usePrices } from '../hooks/usePrices';

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
    avgPrice: null,
    value: 0,
    status: 'locked',
    statusText: 'Locked in order'
  },
  {
    asset: 'CEA',
    balance: 443014,
    locked: 0,
    avgPrice: 88.50,
    value: 4975000,
    status: 'available',
    statusText: 'Available'
  },
  {
    asset: 'EUA',
    balance: 0,
    locked: 0,
    pending: 39357,
    avgPrice: null,
    value: 0,
    status: 'pending',
    statusText: 'Pending delivery'
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

export function DashboardPage() {
  const { user } = useAuthStore();
  const { prices } = usePrices();
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

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

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
            </h1>
            <p className="text-slate-400 mt-1">
              Here's your carbon trading portfolio overview
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {prices && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <span className="text-blue-400">EUA</span>
                  <span className="text-white font-mono">€{prices.eua.price.toFixed(2)}</span>
                  <span className={prices.eua.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {prices.eua.change_24h >= 0 ? '+' : ''}{prices.eua.change_24h.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <span className="text-amber-400">CEA</span>
                  <span className="text-white font-mono">¥{prices.cea.price.toFixed(2)}</span>
                  <span className={prices.cea.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {prices.cea.change_24h >= 0 ? '+' : ''}{prices.cea.change_24h.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">EUR Balance</span>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {formatCurrency(MOCK_ACCOUNT.eur_balance)}
            </div>
            {MOCK_ACCOUNT.eur_locked > 0 && (
              <div className="text-xs text-amber-400 mt-1">
                {formatCurrency(MOCK_ACCOUNT.eur_locked)} locked
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">CEA Balance</span>
              <Leaf className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {formatNumber(MOCK_ACCOUNT.cea_balance)}
            </div>
            <div className="text-xs text-slate-500 mt-1">tonnes</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">EUA Balance</span>
              <span className="text-lg">🇪🇺</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 font-mono">
              {formatNumber(MOCK_ACCOUNT.eua_balance)}
            </div>
            {MOCK_ACCOUNT.eua_pending > 0 && (
              <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatNumber(MOCK_ACCOUNT.eua_pending)} pending
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 rounded-xl border border-slate-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Pending Orders</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {MOCK_ACCOUNT.pending_orders}
            </div>
            <div className="text-xs text-slate-500 mt-1">in progress</div>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Holdings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="font-semibold text-white">Holdings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left px-4 py-3 font-medium">Asset</th>
                      <th className="text-right px-4 py-3 font-medium">Balance</th>
                      <th className="text-right px-4 py-3 font-medium">Avg Price</th>
                      <th className="text-right px-4 py-3 font-medium">Value</th>
                      <th className="text-right px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_HOLDINGS.map((holding) => (
                      <tr key={holding.asset} className="border-b border-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {holding.asset === 'EUR' && <CreditCard className="w-4 h-4 text-slate-400" />}
                            {holding.asset === 'CEA' && <Leaf className="w-4 h-4 text-amber-500" />}
                            {holding.asset === 'EUA' && <span className="text-sm">🇪🇺</span>}
                            <span className="text-white font-medium">{holding.asset}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {holding.asset === 'EUR' ? (
                            <span className="text-slate-400">{formatCurrency(holding.balance)}</span>
                          ) : (
                            <span className={holding.asset === 'CEA' ? 'text-amber-400' : 'text-blue-400'}>
                              {formatNumber(holding.balance)} t
                            </span>
                          )}
                          {holding.pending && holding.pending > 0 && (
                            <div className="text-xs text-amber-400">
                              +{formatNumber(holding.pending)} pending
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {holding.avgPrice ? `¥${holding.avgPrice}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          {holding.value > 0 ? formatCurrency(holding.value) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {holding.status === 'available' && (
                            <span className="text-emerald-400 text-xs flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {holding.statusText}
                            </span>
                          )}
                          {holding.status === 'locked' && (
                            <span className="text-amber-400 text-xs flex items-center justify-end gap-1">
                              <Shield className="w-3 h-3" />
                              {holding.statusText}
                            </span>
                          )}
                          {holding.status === 'pending' && (
                            <span className="text-amber-400 text-xs flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              {holding.statusText}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/cash-market">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Buy CEA</h3>
                          <p className="text-sm text-slate-400">Cash Market</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                </Link>

                <Link to="/swap">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl hover:bg-violet-500/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <ArrowRightLeft className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Swap CEA → EUA</h3>
                          <p className="text-sm text-slate-400">Swap Market</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Orders */}
        {MOCK_PENDING_ORDERS.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-semibold text-white">Pending Orders</h2>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                  {MOCK_PENDING_ORDERS.length} active
                </span>
              </div>
              <div className="p-4 space-y-4">
                {MOCK_PENDING_ORDERS.map((order) => (
                  <div key={order.id} className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <ArrowRightLeft className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{order.typeLabel}</span>
                            <span className="text-xs text-slate-500">#{order.id}</span>
                          </div>
                          <p className="text-sm text-slate-400">{order.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.status === 'pending' ? 'Processing' : order.status}
                        </span>
                        <span className="text-xs text-slate-500">ETA: {order.eta}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{order.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${order.progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-amber-500 to-violet-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Registry transfer in progress...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Transaction History</h2>
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                <button
                  onClick={() => setActiveTab('open')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'open'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Open Orders
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  History
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Details</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRANSACTIONS
                    .filter(tx => activeTab === 'history' || tx.status === 'pending')
                    .map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-800/50">
                      <td className="px-4 py-3 text-slate-400">{tx.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tx.type === 'SWAP' && <ArrowRightLeft className="w-4 h-4 text-violet-400" />}
                          {tx.type === 'BUY CEA' && <Leaf className="w-4 h-4 text-amber-400" />}
                          {tx.type === 'DEPOSIT' && <Wallet className="w-4 h-4 text-emerald-400" />}
                          {tx.type === 'KYC' && <Shield className="w-4 h-4 text-blue-400" />}
                          {tx.type === 'NDA' && <FileText className="w-4 h-4 text-slate-400" />}
                          <span className="text-white">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.details}</td>
                      <td className="px-4 py-3">
                        {tx.status === 'done' ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{tx.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
