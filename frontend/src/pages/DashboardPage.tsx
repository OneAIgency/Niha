import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ArrowRight,
  RefreshCw,
  ShoppingCart,
  ArrowRightLeft,
  Wallet,
  Activity,
  Bell,
  ExternalLink,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Button, Card, Badge, PriceTicker } from '../components/common';
import { usePrices, usePriceHistory } from '../hooks/usePrices';
import { useAuthStore } from '../stores/useStore';
import { marketplaceApi } from '../services/api';
import { cn, formatCurrency, formatQuantity, formatRelativeTime } from '../utils';

// Mock portfolio data (would come from API in production)
const mockPortfolio = {
  eua_holdings: 5000,
  cea_holdings: 15000,
  pending_swaps: 2,
  completed_trades: 12,
};

const mockRecentTrades = [
  { id: 1, type: 'buy', cert: 'CEA', quantity: 2500, price: 14.2, date: new Date(Date.now() - 3600000) },
  { id: 2, type: 'swap', cert: 'EUA→CEA', quantity: 1000, price: 5.8, date: new Date(Date.now() - 86400000) },
  { id: 3, type: 'buy', cert: 'CEA', quantity: 5000, price: 13.95, date: new Date(Date.now() - 172800000) },
];

const mockNotifications = [
  { id: 1, message: 'New CEA listing matches your criteria', time: '2h ago', type: 'info' },
  { id: 2, message: 'Your swap request has been matched!', time: '1d ago', type: 'success' },
  { id: 3, message: 'Price alert: EUA dropped below €74', time: '2d ago', type: 'warning' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { prices } = usePrices();
  const { history } = usePriceHistory(365 * 24); // 1 year in hours
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Stats fetched for future use in dashboard
        await marketplaceApi.getStats();
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Calculate portfolio value
  const portfolioValue =
    prices
      ? mockPortfolio.eua_holdings * prices.eua.price_usd +
        mockPortfolio.cea_holdings * prices.cea.price_usd
      : 0;

  // Format chart data - show every Nth point to avoid overcrowding
  const chartData = history?.eua?.filter((_: any, i: number) => i % Math.max(1, Math.floor((history?.eua?.length || 1) / 60)) === 0)
    .map((item: any, index: number) => {
      const filteredCea = history.cea?.filter((_: any, i: number) => i % Math.max(1, Math.floor((history?.cea?.length || 1) / 60)) === 0);
      return {
        time: new Date(item.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        eua: item.price,
        cea: filteredCea?.[index]?.price || 0,
      };
    }) || [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
            </h1>
            <p className="text-navy-600 dark:text-navy-300 mt-1">
              Here's what's happening with your carbon portfolio
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <PriceTicker prices={prices} variant="compact" />
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Portfolio Value</p>
                  <p className="text-3xl font-bold mt-1 font-mono">
                    {formatCurrency(portfolioValue, 'USD')}
                  </p>
                  <p className="text-emerald-200 text-sm mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +2.4% today
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-emerald-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-navy-500 dark:text-navy-400 text-sm">EUA Holdings</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white mt-1">
                    {formatQuantity(mockPortfolio.eua_holdings)}
                  </p>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mt-2">
                    ≈ {formatCurrency(mockPortfolio.eua_holdings * (prices?.eua.price_usd || 0), 'USD')}
                  </p>
                </div>
                <Badge variant="eua">EUA</Badge>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-navy-500 dark:text-navy-400 text-sm">CEA Holdings</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white mt-1">
                    {formatQuantity(mockPortfolio.cea_holdings)}
                  </p>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mt-2">
                    ≈ {formatCurrency(mockPortfolio.cea_holdings * (prices?.cea.price_usd || 0), 'USD')}
                  </p>
                </div>
                <Badge variant="cea">CEA</Badge>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-navy-500 dark:text-navy-400 text-sm">Active Swaps</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white mt-1">
                    {mockPortfolio.pending_swaps}
                  </p>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mt-2">
                    {mockPortfolio.completed_trades} completed
                  </p>
                </div>
                <RefreshCw className="w-6 h-6 text-purple-500" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Price Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">Price Chart (1 year) — EUR/tCO2</h2>
                <div className="flex items-center gap-4 text-sm text-navy-600 dark:text-navy-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full" />
                    EUA (€)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-amber-500 rounded-full" />
                    CEA (€)
                  </span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="euaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ceaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="eua"
                      stroke="#3b82f6"
                      fill="url(#euaGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="cea"
                      stroke="#f59e0b"
                      fill="url(#ceaGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">Notifications</h2>
                <Bell className="w-5 h-5 text-navy-400" />
              </div>

              <div className="space-y-4">
                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-navy-50 dark:bg-navy-900/50 rounded-lg"
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-2',
                        notification.type === 'success' && 'bg-emerald-500',
                        notification.type === 'info' && 'bg-blue-500',
                        notification.type === 'warning' && 'bg-amber-500'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-navy-900 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-navy-400 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Recent Trades */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6">Quick Actions</h2>

              <div className="grid grid-cols-2 gap-4">
                <Link to="/marketplace">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer group">
                    <ShoppingCart className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-3" />
                    <h3 className="font-semibold text-navy-900 dark:text-white">Buy CEA</h3>
                    <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                      Browse marketplace listings
                    </p>
                    <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>

                <Link to="/swap">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer group">
                    <ArrowRightLeft className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                    <h3 className="font-semibold text-navy-900 dark:text-white">Create Swap</h3>
                    <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                      Exchange EUA ↔ CEA
                    </p>
                    <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-navy-900 dark:text-white">Set Alert</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">Price notifications</p>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer group">
                  <ExternalLink className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-navy-900 dark:text-white">Export Report</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">Download portfolio PDF</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">Recent Trades</h2>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {mockRecentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 bg-navy-50 dark:bg-navy-900/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          trade.type === 'buy' && 'bg-emerald-100 dark:bg-emerald-900/30',
                          trade.type === 'swap' && 'bg-purple-100 dark:bg-purple-900/30'
                        )}
                      >
                        {trade.type === 'buy' ? (
                          <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowRightLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-navy-900 dark:text-white">
                          {trade.type === 'buy' ? 'Purchased' : 'Swapped'} {trade.cert}
                        </p>
                        <p className="text-sm text-navy-500 dark:text-navy-400">
                          {formatQuantity(trade.quantity)} units @ ${trade.price}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-navy-400">
                      {formatRelativeTime(trade.date.toISOString())}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
