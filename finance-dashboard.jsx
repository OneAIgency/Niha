import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Target, Calendar, Filter, Download, Bell, Search, ChevronDown, ArrowUpRight, ArrowDownRight, MoreHorizontal, RefreshCw, Settings, LogOut, User, CreditCard, FileText, BarChart2, PieChart as PieChartIcon, Activity, Briefcase, Globe, Building, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Realistic mock data
const revenueData = [
  { month: 'Jul', revenue: 2340000, target: 2200000, lastYear: 1980000 },
  { month: 'Aug', revenue: 2580000, target: 2400000, lastYear: 2150000 },
  { month: 'Sep', revenue: 2420000, target: 2500000, lastYear: 2280000 },
  { month: 'Oct', revenue: 2890000, target: 2600000, lastYear: 2420000 },
  { month: 'Nov', revenue: 3120000, target: 2800000, lastYear: 2650000 },
  { month: 'Dec', revenue: 3450000, target: 3000000, lastYear: 2890000 },
  { month: 'Jan', revenue: 2980000, target: 2900000, lastYear: 2540000 },
];

const salesByRegion = [
  { name: 'North America', value: 4250000, growth: 12.4 },
  { name: 'Europe', value: 2890000, growth: 8.2 },
  { name: 'Asia Pacific', value: 2150000, growth: 18.6 },
  { name: 'Latin America', value: 890000, growth: 15.3 },
  { name: 'Middle East', value: 420000, growth: 22.1 },
];

const productPerformance = [
  { product: 'Enterprise Suite', revenue: 3200000, units: 245, margin: 68 },
  { product: 'Professional Plan', revenue: 2100000, units: 1820, margin: 72 },
  { product: 'Starter Package', revenue: 890000, units: 4520, margin: 58 },
  { product: 'Add-on Services', revenue: 1450000, units: 3200, margin: 82 },
  { product: 'Custom Solutions', revenue: 2960000, units: 89, margin: 45 },
];

const recentTransactions = [
  { id: 'TXN-2024-8847', customer: 'Acme Corporation', amount: 125000, status: 'completed', date: '2024-01-18', type: 'Enterprise' },
  { id: 'TXN-2024-8846', customer: 'TechStart Inc.', amount: 45000, status: 'pending', date: '2024-01-18', type: 'Professional' },
  { id: 'TXN-2024-8845', customer: 'Global Dynamics', amount: 280000, status: 'completed', date: '2024-01-17', type: 'Enterprise' },
  { id: 'TXN-2024-8844', customer: 'Pinnacle Systems', amount: 18500, status: 'failed', date: '2024-01-17', type: 'Starter' },
  { id: 'TXN-2024-8843', customer: 'Nova Industries', amount: 92000, status: 'completed', date: '2024-01-16', type: 'Professional' },
  { id: 'TXN-2024-8842', customer: 'Horizon Labs', amount: 156000, status: 'pending', date: '2024-01-16', type: 'Enterprise' },
];

const salesTeam = [
  { name: 'Sarah Mitchell', role: 'Senior Account Executive', deals: 24, revenue: 1850000, quota: 85, avatar: 'SM' },
  { name: 'James Chen', role: 'Account Executive', deals: 31, revenue: 1420000, quota: 112, avatar: 'JC' },
  { name: 'Emily Rodriguez', role: 'Senior Account Executive', deals: 18, revenue: 2100000, quota: 95, avatar: 'ER' },
  { name: 'Michael Park', role: 'Account Executive', deals: 27, revenue: 980000, quota: 78, avatar: 'MP' },
  { name: 'Lisa Thompson', role: 'Sales Director', deals: 12, revenue: 3200000, quota: 106, avatar: 'LT' },
];

const forecastData = [
  { quarter: 'Q1 2024', actual: 8750000, forecast: 8500000, pipeline: 12400000 },
  { quarter: 'Q2 2024', actual: null, forecast: 9200000, pipeline: 14800000 },
  { quarter: 'Q3 2024', actual: null, forecast: 10100000, pipeline: 16200000 },
  { quarter: 'Q4 2024', actual: null, forecast: 11500000, pipeline: 18900000 },
];

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('This Quarter');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const notifications = [
    { id: 1, title: 'New deal closed', message: 'Acme Corp - $125,000', time: '2 min ago', unread: true },
    { id: 2, title: 'Quota achieved', message: 'James Chen hit 112% of quota', time: '1 hour ago', unread: true },
    { id: 3, title: 'Pipeline update', message: 'Q2 forecast revised to $9.2M', time: '3 hours ago', unread: false },
  ];

  const dateOptions = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom Range'];
  const regionOptions = ['All Regions', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];

  const kpis = [
    { title: 'Total Revenue', value: '$10.6M', change: '+12.5%', trend: 'up', icon: DollarSign, subtext: 'vs $9.4M last quarter' },
    { title: 'Active Deals', value: '147', change: '+8.3%', trend: 'up', icon: Briefcase, subtext: '23 closing this week' },
    { title: 'Win Rate', value: '34.2%', change: '+2.1%', trend: 'up', icon: Target, subtext: 'Above 30% benchmark' },
    { title: 'Avg Deal Size', value: '$72.4K', change: '-3.2%', trend: 'down', icon: ShoppingCart, subtext: 'vs $74.8K last quarter' },
  ];

  const renderKPICard = (kpi, index) => (
    <div key={index} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('analytics')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{kpi.value}</p>
          <p className="text-xs text-slate-400 mt-1">{kpi.subtext}</p>
        </div>
        <div className={`p-2 rounded-lg ${kpi.trend === 'up' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <kpi.icon className={`w-5 h-5 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="flex items-center mt-3">
        {kpi.trend === 'up' ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {kpi.change}
        </span>
        <span className="text-sm text-slate-400 ml-1">vs last period</span>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-60 bg-slate-900 min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">SalesForce Pro</span>
      </div>

      <nav className="flex-1 space-y-1">
        {[
          { id: 'overview', icon: BarChart2, label: 'Overview' },
          { id: 'analytics', icon: Activity, label: 'Analytics' },
          { id: 'transactions', icon: CreditCard, label: 'Transactions' },
          { id: 'team', icon: Users, label: 'Sales Team' },
          { id: 'forecast', icon: TrendingUp, label: 'Forecast' },
          { id: 'reports', icon: FileText, label: 'Reports' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-700 pt-4 mt-4">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'analytics' && 'Analytics & Insights'}
            {activeTab === 'transactions' && 'Transaction History'}
            {activeTab === 'team' && 'Sales Team Performance'}
            {activeTab === 'forecast' && 'Revenue Forecast'}
            {activeTab === 'reports' && 'Reports & Exports'}
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              {dateRange}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showDateDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                {dateOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setDateRange(option); setShowDateDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === option ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleRefresh}
            className={`p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${notif.unread ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-500">{notif.message}</p>
                        </div>
                        {notif.unread && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-1">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                JD
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showProfileDropdown && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-slate-200">
                  <p className="font-medium text-slate-900">John Davidson</p>
                  <p className="text-sm text-slate-500">VP of Sales</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <User className="w-4 h-4" /> Your Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, index) => renderKPICard(kpi, index))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Revenue Performance</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-600 rounded-full" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-300 rounded-full" /> Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-200 rounded-full" /> Last Year
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v/1000000}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" />
              <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="lastYear" stroke="#bfdbfe" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Sales by Region</h3>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={salesByRegion}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {salesByRegion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {salesByRegion.map((region, index) => (
              <div key={region.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-600">{region.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{formatCurrency(region.value)}</span>
                  <span className="text-emerald-600 text-xs">+{region.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <button onClick={() => setActiveTab('transactions')} className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                onClick={() => setSelectedTransaction(txn)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.status === 'completed' ? 'bg-emerald-100' : txn.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    {txn.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                     txn.status === 'pending' ? <Clock className="w-5 h-5 text-amber-600" /> :
                     <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{txn.customer}</p>
                    <p className="text-sm text-slate-500">{txn.id} · {txn.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(txn.amount)}</p>
                  <p className={`text-xs capitalize ${
                    txn.status === 'completed' ? 'text-emerald-600' : txn.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {txn.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Top Performers</h3>
            <button onClick={() => setActiveTab('team')} className="text-sm text-blue-600 hover:text-blue-700">
              View team →
            </button>
          </div>
          <div className="space-y-3">
            {salesTeam.slice(0, 5).map((member, index) => (
              <div key={member.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                      {member.avatar}
                    </div>
                    {index < 3 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.deals} deals closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(member.revenue)}</p>
                  <p className={`text-xs ${member.quota >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {member.quota}% of quota
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Product Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="product" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Margin Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="product" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Revenue by Product & Region Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Product</th>
                {salesByRegion.map((r) => (
                  <th key={r.name} className="text-right py-3 px-4 text-sm font-semibold text-slate-600">{r.name}</th>
                ))}
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {productPerformance.map((product) => (
                <tr key={product.product} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{product.product}</td>
                  {salesByRegion.map((r, i) => (
                    <td key={r.name} className="text-right py-3 px-4 text-sm text-slate-600">
                      {formatCurrency(Math.floor(product.revenue * (0.15 + i * 0.05 + Math.random() * 0.2)))}
                    </td>
                  ))}
                  <td className="text-right py-3 px-4 font-semibold text-slate-900">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Statuses</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
          </select>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Transaction ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Amount</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((txn) => (
              <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTransaction(txn)}>
                <td className="py-4 px-4 font-mono text-sm text-slate-600">{txn.id}</td>
                <td className="py-4 px-4 font-medium text-slate-900">{txn.customer}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{txn.type}</td>
                <td className="py-4 px-4 text-right font-semibold text-slate-900">{formatCurrency(txn.amount)}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    txn.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {txn.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                     txn.status === 'pending' ? <Clock className="w-3 h-3" /> :
                     <XCircle className="w-3 h-3" />}
                    {txn.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{txn.date}</td>
                <td className="py-4 px-4">
                  <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-sm text-slate-500">Team Revenue</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">$9.55M</p>
          <p className="text-sm text-emerald-600 mt-1">↑ 18.2% vs target</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-sm text-slate-500">Avg Quota Attainment</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">95.2%</p>
          <p className="text-sm text-slate-500 mt-1">3 reps above 100%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-sm text-slate-500">Total Deals Closed</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">112</p>
          <p className="text-sm text-emerald-600 mt-1">↑ 23 from last quarter</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Team Leaderboard</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Revenue</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Deals</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Quota %</th>
              <th className="py-3 px-4 text-sm font-semibold text-slate-600">Progress</th>
            </tr>
          </thead>
          <tbody>
            {salesTeam.sort((a, b) => b.revenue - a.revenue).map((member, index) => (
              <tr key={member.name} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-4 px-4">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-400 text-white' :
                    index === 1 ? 'bg-slate-300 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {member.avatar}
                    </div>
                    <span className="font-medium text-slate-900">{member.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{member.role}</td>
                <td className="py-4 px-4 text-right font-semibold text-slate-900">{formatCurrency(member.revenue)}</td>
                <td className="py-4 px-4 text-right text-slate-600">{member.deals}</td>
                <td className={`py-4 px-4 text-right font-semibold ${member.quota >= 100 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {member.quota}%
                </td>
                <td className="py-4 px-4 w-32">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${member.quota >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(member.quota, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderForecast = () => (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Quarterly Revenue Forecast</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="quarter" />
            <YAxis tickFormatter={(v) => `$${v/1000000}M`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="forecast" name="Forecast" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pipeline" name="Pipeline" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {forecastData.map((q) => (
          <div key={q.quarter} className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-slate-900">{q.quarter}</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Forecast</span>
                <span className="font-medium text-slate-900">{formatCurrency(q.forecast)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pipeline</span>
                <span className="font-medium text-slate-900">{formatCurrency(q.pipeline)}</span>
              </div>
              {q.actual && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Actual</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(q.actual)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'Revenue Report', description: 'Monthly breakdown of all revenue streams', icon: DollarSign },
          { title: 'Sales Pipeline', description: 'Current deal stages and conversion rates', icon: TrendingUp },
          { title: 'Team Performance', description: 'Individual and team quota attainment', icon: Users },
          { title: 'Product Analysis', description: 'Revenue by product line and margins', icon: PieChartIcon },
          { title: 'Regional Breakdown', description: 'Geographic sales distribution', icon: Globe },
          { title: 'Forecast Accuracy', description: 'Historical forecast vs actual comparison', icon: Target },
        ].map((report) => (
          <div
            key={report.title}
            className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowExportModal(true)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <report.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{report.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700">
                Schedule →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100" onClick={() => { setShowDateDropdown(false); setShowProfileDropdown(false); setShowNotifications(false); }}>
      {renderSidebar()}

      <div className="flex-1 flex flex-col">
        {renderHeader()}

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'forecast' && renderForecast()}
          {activeTab === 'reports' && renderReports()}
        </main>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTransaction(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-slate-900">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium text-slate-900">{selectedTransaction.customer}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className={`capitalize ${
                  selectedTransaction.status === 'completed' ? 'text-emerald-600' :
                  selectedTransaction.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                }`}>{selectedTransaction.status}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-900">{selectedTransaction.date}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Report</h3>
            <div className="space-y-3">
              {['PDF Report', 'Excel Spreadsheet', 'CSV Data', 'PowerPoint'].map((format) => (
                <button
                  key={format}
                  className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left"
                  onClick={() => setShowExportModal(false)}
                >
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-900">{format}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
