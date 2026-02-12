import { motion } from 'framer-motion';
import {
  X,
  RefreshCw,
  Key,
  Shield,
  Monitor,
  CheckCircle2,
  XCircle,
  Globe,
  DollarSign,
  Wallet,
  BanknoteIcon,
  Leaf,
  Wind,
  BarChart3,
  Building2,
  AlertTriangle,
  Pencil,
  Minus,
} from 'lucide-react';
import { Button, Badge } from '../common';
import { UserOrdersSection } from '../backoffice';
import { cn, formatRelativeTime, formatCurrency } from '../../utils';
import type { UserRole, AdminUserFull, Deposit, EntityBalance, DepositHistoryItem } from '../../types';

// Simple interface for entity assets display
interface EntityAssetsDisplay {
  entityId: string;
  entityName: string;
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
}

interface UserDetailModalProps {
  user: AdminUserFull | null;
  loading: boolean;
  onClose: () => void;
  activeTab: 'info' | 'auth' | 'sessions' | 'deposits' | 'orders';
  setActiveTab: (tab: 'info' | 'auth' | 'sessions' | 'deposits' | 'orders') => void;
  onLoadDeposits: (entityId: string) => void;
  onShowPasswordReset: () => void;
  onEditAsset: (asset: {
    entityId: string;
    entityName: string;
    assetType: 'EUR' | 'CEA' | 'EUA';
    currentBalance: number;
  }) => void;
  // Deposit-related props
  loadingDeposits: boolean;
  depositsError: string | null;
  entityBalance: EntityBalance | null;
  entityAssets: EntityAssetsDisplay | null;
  deposits: Deposit[];
  depositAndWithdrawalHistory: DepositHistoryItem[];
}

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return email?.substring(0, 2).toUpperCase() || '??';
}

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'default';
    case 'MM':
      return 'info';
    case 'EUA':
      return 'success';
    case 'NDA':
    case 'KYC':
    case 'APPROVED':
    case 'FUNDING':
    case 'AML':
    case 'CEA':
    case 'CEA_SETTLE':
    case 'SWAP':
    case 'EUA_SETTLE':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    default:
      return 'default';
  }
}

export function UserDetailModal({
  user,
  loading,
  onClose,
  activeTab,
  setActiveTab,
  onLoadDeposits,
  onShowPasswordReset,
  onEditAsset,
  loadingDeposits,
  depositsError,
  entityBalance,
  entityAssets,
  deposits,
  depositAndWithdrawalHistory,
}: UserDetailModalProps) {
  if (!user && !loading) return null;

  const tabs = [
    { id: 'info' as const, label: 'User Info', icon: Shield },
    { id: 'deposits' as const, label: 'Assets', icon: Wallet },
    { id: 'orders' as const, label: 'Orders', icon: BarChart3 },
    { id: 'auth' as const, label: 'Auth History', icon: Key },
    { id: 'sessions' as const, label: 'Sessions', icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : user && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl',
              user.role === 'ADMIN'
                ? 'bg-gradient-to-br from-navy-500 to-navy-600'
                : user.role === 'MM'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600'
                )}>
                  {getInitials(user.firstName, user.lastName, user.email)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-navy-500 dark:text-navy-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
              >
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-navy-100 dark:border-navy-700">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'deposits' && user?.entityId) {
                      onLoadDeposits(user.entityId);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'info' && (
                <UserInfoTab
                  user={user}
                  onShowPasswordReset={onShowPasswordReset}
                />
              )}

              {activeTab === 'auth' && (
                <AuthHistoryTab authHistory={user.authHistory} />
              )}

              {activeTab === 'sessions' && (
                <SessionsTab sessions={user.sessions} />
              )}

              {activeTab === 'deposits' && (
                <DepositsTab
                  user={user}
                  loadingDeposits={loadingDeposits}
                  depositsError={depositsError}
                  entityBalance={entityBalance}
                  entityAssets={entityAssets}
                  deposits={deposits}
                  depositAndWithdrawalHistory={depositAndWithdrawalHistory}
                  onRetry={() => user.entityId && onLoadDeposits(user.entityId)}
                  onEditAsset={onEditAsset}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersTab user={user} />
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// Tab Components
function UserInfoTab({
  user,
  onShowPasswordReset,
}: {
  user: AdminUserFull;
  onShowPasswordReset: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Role</p>
          <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
            {user.role}
          </Badge>
        </div>
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Status</p>
          <Badge variant={user.isActive ? 'success' : 'danger'}>
            {user.isActive ? 'Active' : 'DISABLED'}
          </Badge>
        </div>
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Password</p>
          <Badge variant={user.passwordSet ? 'success' : 'warning'}>
            {user.passwordSet ? 'Set' : 'Not Set'}
          </Badge>
        </div>
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Logins</p>
          <p className="text-lg font-bold text-navy-900 dark:text-white">{user.loginCount}</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-navy-900 dark:text-white">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Full Name</span>
              <span className="text-navy-900 dark:text-white font-medium">
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Entity</span>
              <span className="text-navy-900 dark:text-white">{user.entityName || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Position</span>
              <span className="text-navy-900 dark:text-white">{user.position || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Phone</span>
              <span className="text-navy-900 dark:text-white">{user.phone || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Created</span>
              <span className="text-navy-900 dark:text-white">
                {user.createdAt ? formatRelativeTime(user.createdAt) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-navy-900 dark:text-white">Security</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Last Login</span>
              <span className="text-navy-900 dark:text-white">
                {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Last IP</span>
              <span className="text-navy-900 dark:text-white font-mono text-sm">
                {user.lastLoginIp || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-navy-500 dark:text-navy-400">Failed (24h)</span>
              <Badge variant={user.failedLoginCount24h > 5 ? 'danger' : user.failedLoginCount24h > 0 ? 'warning' : 'success'}>
                {user.failedLoginCount24h}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-navy-500 dark:text-navy-400">Force Password Change</span>
              <Badge variant={user.mustChangePassword ? 'warning' : 'success'}>
                {user.mustChangePassword ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Password Management</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">Reset user&apos;s password</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onShowPasswordReset}>
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthHistoryTab({ authHistory }: { authHistory: AdminUserFull['authHistory'] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-900 dark:text-white">Authentication History</h3>
        <p className="text-sm text-navy-500">Last 50 attempts</p>
      </div>
      {authHistory.length === 0 ? (
        <div className="text-center py-8 text-navy-500 dark:text-navy-400">
          No authentication attempts recorded
        </div>
      ) : (
        <div className="space-y-2">
          {authHistory.map((attempt) => (
            <div
              key={attempt.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                attempt.success
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              )}
            >
              <div className="flex items-center gap-3">
                {attempt.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-navy-900 dark:text-white">
                    {attempt.success ? 'Successful Login' : 'Failed Attempt'}
                    {attempt.failureReason && (
                      <span className="text-red-500 ml-2">({attempt.failureReason})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                    <Badge variant="default" className="text-xs">{attempt.method}</Badge>
                    {attempt.ipAddress && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {attempt.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-navy-500 dark:text-navy-400">
                {formatRelativeTime(attempt.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions }: { sessions: AdminUserFull['sessions'] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-navy-900 dark:text-white">Recent Sessions</h3>
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-navy-500 dark:text-navy-400">
          No sessions recorded
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg bg-navy-50 dark:bg-navy-700/50"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-navy-400" />
                <div>
                  <p className="text-sm font-medium text-navy-900 dark:text-white font-mono">
                    {session.ipAddress || 'Unknown IP'}
                  </p>
                  <p className="text-xs text-navy-500 dark:text-navy-400 truncate max-w-md">
                    {session.userAgent || 'Unknown device'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={session.isActive ? 'success' : 'default'}>
                  {session.isActive ? 'Active' : 'Ended'}
                </Badge>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  {formatRelativeTime(session.startedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepositsTab({
  user,
  loadingDeposits,
  depositsError,
  entityBalance,
  entityAssets,
  deposits: _deposits,
  depositAndWithdrawalHistory,
  onRetry,
  onEditAsset,
}: {
  user: AdminUserFull;
  loadingDeposits: boolean;
  depositsError: string | null;
  entityBalance: EntityBalance | null;
  entityAssets: EntityAssetsDisplay | null;
  deposits: Deposit[];
  depositAndWithdrawalHistory: DepositHistoryItem[];
  onRetry: () => void;
  onEditAsset: (asset: {
    entityId: string;
    entityName: string;
    assetType: 'EUR' | 'CEA' | 'EUA';
    currentBalance: number;
  }) => void;
}) {
  if (!user.entityId) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
        <p className="text-navy-500 dark:text-navy-400">
          User is not associated with any entity
        </p>
        <p className="text-sm text-navy-400 dark:text-navy-500 mt-2">
          Deposits can only be made for users with an entity
        </p>
      </div>
    );
  }

  if (depositsError) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">
          {depositsError}
        </p>
        <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
          Unable to load entity assets. This could be due to permissions, network issues, or server problems.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (loadingDeposits) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Entity Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-navy-500 dark:text-navy-400">Entity Holdings</p>
          <p className="font-bold text-navy-900 dark:text-white">
            {entityAssets?.entityName || entityBalance?.entityName || user.entityName || 'Unknown Entity'}
          </p>
        </div>
      </div>

      {/* Asset Balances Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* EUR Balance */}
        <div className="flex flex-col min-w-0 overflow-hidden p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entityId!,
              entityName: entityAssets?.entityName || user.entityName || 'Unknown',
              assetType: 'EUR',
              currentBalance: entityAssets?.eurBalance ?? entityBalance?.balanceAmount ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit EUR Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium text-emerald-100">EUR Cash</span>
          </div>
          <p className="text-base font-bold font-mono min-w-0">
            {'\u20AC'}{(entityAssets?.eurBalance ?? entityBalance?.balanceAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* CEA Balance */}
        <div className="flex flex-col min-w-0 overflow-hidden p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entityId!,
              entityName: entityAssets?.entityName || user.entityName || 'Unknown',
              assetType: 'CEA',
              currentBalance: entityAssets?.ceaBalance ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit CEA Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium text-amber-100">CEA</span>
          </div>
          <p className="text-base font-bold font-mono min-w-0">
            {(entityAssets?.ceaBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm font-normal ml-1">tCO{'\u2082'}</span>
          </p>
        </div>

        {/* EUA Balance */}
        <div className="flex flex-col min-w-0 overflow-hidden p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entityId!,
              entityName: entityAssets?.entityName || user.entityName || 'Unknown',
              assetType: 'EUA',
              currentBalance: entityAssets?.euaBalance ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit EUA Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium text-blue-100">EUA</span>
          </div>
          <p className="text-base font-bold font-mono min-w-0">
            {(entityAssets?.euaBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm font-normal ml-1">tCO{'\u2082'}</span>
          </p>
        </div>
      </div>

      {/* Deposit Summary */}
      <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl border border-navy-100 dark:border-navy-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BanknoteIcon className="w-5 h-5 text-navy-400" />
            <span className="text-sm text-navy-600 dark:text-navy-300">Total Deposited</span>
          </div>
          <span className="font-mono font-semibold text-navy-900 dark:text-white">
            {entityBalance ? formatCurrency(entityBalance.totalDeposited, entityBalance.balanceCurrency || 'EUR') : '\u20AC 0.00'}
          </span>
        </div>
      </div>

      {/* Role Info */}
      {(user.role === 'NDA' || user.role === 'KYC') && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-navy-900 dark:text-white">
                User has {user.role} status (under review)
              </p>
              <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                {user.role === 'NDA' ? 'Approve to create user (KYC).' : 'Approve KYC to grant funding access.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit & Withdrawal History */}
      <div>
        <h3 className="font-semibold text-navy-900 dark:text-white mb-4">Deposit & Withdrawal History</h3>
        {depositAndWithdrawalHistory.length === 0 ? (
          <div className="text-center py-8 text-navy-500 dark:text-navy-400">
            <BanknoteIcon className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
            <p>No deposits or withdrawals recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {depositAndWithdrawalHistory.map((item) => {
              if (item.type === 'wire_deposit') {
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-navy-50 dark:bg-navy-700/50 border border-navy-100 dark:border-navy-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        item.status === 'CONFIRMED' || item.status === 'CLEARED'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : item.status === 'REJECTED'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                      )}>
                        <DollarSign className={cn(
                          'w-5 h-5',
                          item.status === 'CONFIRMED' || item.status === 'CLEARED'
                            ? 'text-emerald-600'
                            : item.status === 'REJECTED'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-navy-900 dark:text-white">
                          {item.amount != null
                            ? formatCurrency(item.amount, item.currency ?? 'EUR')
                            : '—'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                          {item.wireReference && (
                            <span>Ref: {item.wireReference}</span>
                          )}
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-navy-400 dark:text-navy-500 mt-1 italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      item.status === 'CONFIRMED' || item.status === 'CLEARED' ? 'success' :
                      item.status === 'REJECTED' ? 'danger' : 'warning'
                    }>
                      {item.status}
                    </Badge>
                  </div>
                );
              }
              const isWithdrawal = item.transactionType === 'WITHDRAWAL';
              const amountLabel = item.assetType === 'EUR'
                ? formatCurrency(isWithdrawal ? -Math.abs(item.amount) : item.amount, 'EUR')
                : `${isWithdrawal ? '-' : ''}${Math.abs(item.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${item.assetType}`;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-navy-50 dark:bg-navy-700/50 border border-navy-100 dark:border-navy-600"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isWithdrawal
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                    )}>
                      {isWithdrawal ? (
                        <Minus className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        'font-semibold',
                        isWithdrawal ? 'text-red-600 dark:text-red-400' : 'text-navy-900 dark:text-white'
                      )}>
                        {amountLabel}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-navy-400 dark:text-navy-500 mt-1 italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={isWithdrawal ? 'danger' : 'success'}>
                    {item.transactionType}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ user }: { user: AdminUserFull }) {
  if (!user.entityId) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
        <p className="text-navy-500 dark:text-navy-400">
          User is not associated with any entity
        </p>
        <p className="text-sm text-navy-400 dark:text-navy-500 mt-2">
          Orders can only be viewed for users with an entity
        </p>
      </div>
    );
  }

  return (
    <UserOrdersSection
      entityId={user.entityId}
      entityName={user.entityName || 'Unknown Entity'}
    />
  );
}
