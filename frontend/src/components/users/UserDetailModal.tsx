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
} from 'lucide-react';
import { Button, Badge } from '../common';
import { UserOrdersSection } from '../backoffice';
import { cn, formatRelativeTime } from '../../utils';
import type { UserRole, AdminUserFull, Deposit, EntityBalance } from '../../types';

// Simple interface for entity assets display
interface EntityAssetsDisplay {
  entity_id: string;
  entity_name: string;
  eur_balance: number;
  cea_balance: number;
  eua_balance: number;
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
    case 'FUNDED':
      return 'success';
    case 'APPROVED':
      return 'info';
    case 'PENDING':
      return 'warning';
    default:
      return 'default';
  }
}

function formatCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', CNY: '¥', HKD: 'HK$' };
  return `${symbols[currency] || currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                    : user.role === 'FUNDED'
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : user.role === 'APPROVED'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600'
                )}>
                  {getInitials(user.first_name, user.last_name, user.email)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                    {user.first_name} {user.last_name}
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
                    if (tab.id === 'deposits' && user?.entity_id) {
                      onLoadDeposits(user.entity_id);
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
                <AuthHistoryTab authHistory={user.auth_history} />
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
                  onRetry={() => user.entity_id && onLoadDeposits(user.entity_id)}
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
          <Badge variant={user.is_active ? 'success' : 'danger'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Password</p>
          <Badge variant={user.password_set ? 'success' : 'warning'}>
            {user.password_set ? 'Set' : 'Not Set'}
          </Badge>
        </div>
        <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Logins</p>
          <p className="text-lg font-bold text-navy-900 dark:text-white">{user.login_count}</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-navy-900 dark:text-white">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Entity</span>
              <span className="text-navy-900 dark:text-white">{user.entity_name || 'None'}</span>
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
                {user.created_at ? formatRelativeTime(user.created_at) : 'Unknown'}
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
                {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 dark:text-navy-400">Last IP</span>
              <span className="text-navy-900 dark:text-white font-mono text-sm">
                {user.last_login_ip || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-navy-500 dark:text-navy-400">Failed (24h)</span>
              <Badge variant={user.failed_login_count_24h > 5 ? 'danger' : user.failed_login_count_24h > 0 ? 'warning' : 'success'}>
                {user.failed_login_count_24h}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-navy-500 dark:text-navy-400">Force Password Change</span>
              <Badge variant={user.must_change_password ? 'warning' : 'success'}>
                {user.must_change_password ? 'Yes' : 'No'}
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
              <p className="text-sm text-navy-500 dark:text-navy-400">Reset user's password</p>
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

function AuthHistoryTab({ authHistory }: { authHistory: AdminUserFull['auth_history'] }) {
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
                    {attempt.failure_reason && (
                      <span className="text-red-500 ml-2">({attempt.failure_reason})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                    <Badge variant="default" className="text-xs">{attempt.method}</Badge>
                    {attempt.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {attempt.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-navy-500 dark:text-navy-400">
                {formatRelativeTime(attempt.created_at)}
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
                    {session.ip_address || 'Unknown IP'}
                  </p>
                  <p className="text-xs text-navy-500 dark:text-navy-400 truncate max-w-md">
                    {session.user_agent || 'Unknown device'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={session.is_active ? 'success' : 'default'}>
                  {session.is_active ? 'Active' : 'Ended'}
                </Badge>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  {formatRelativeTime(session.started_at)}
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
  deposits,
  onRetry,
  onEditAsset,
}: {
  user: AdminUserFull;
  loadingDeposits: boolean;
  depositsError: string | null;
  entityBalance: EntityBalance | null;
  entityAssets: EntityAssetsDisplay | null;
  deposits: Deposit[];
  onRetry: () => void;
  onEditAsset: (asset: {
    entityId: string;
    entityName: string;
    assetType: 'EUR' | 'CEA' | 'EUA';
    currentBalance: number;
  }) => void;
}) {
  if (!user.entity_id) {
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
            {entityAssets?.entity_name || entityBalance?.entity_name || user.entity_name || 'Unknown Entity'}
          </p>
        </div>
      </div>

      {/* Asset Balances Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* EUR Balance */}
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entity_id!,
              entityName: entityAssets?.entity_name || user.entity_name || 'Unknown',
              assetType: 'EUR',
              currentBalance: entityAssets?.eur_balance ?? entityBalance?.balance_amount ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit EUR Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium text-emerald-100">EUR Cash</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {'\u20AC'}{(entityAssets?.eur_balance ?? entityBalance?.balance_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* CEA Balance */}
        <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entity_id!,
              entityName: entityAssets?.entity_name || user.entity_name || 'Unknown',
              assetType: 'CEA',
              currentBalance: entityAssets?.cea_balance ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit CEA Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5" />
            <span className="text-sm font-medium text-amber-100">CEA</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {(entityAssets?.cea_balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm font-normal ml-1">tCO{'\u2082'}</span>
          </p>
        </div>

        {/* EUA Balance */}
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white relative group">
          <button
            onClick={() => onEditAsset({
              entityId: user.entity_id!,
              entityName: entityAssets?.entity_name || user.entity_name || 'Unknown',
              assetType: 'EUA',
              currentBalance: entityAssets?.eua_balance ?? 0,
            })}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all"
            title="Edit EUA Balance"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5" />
            <span className="text-sm font-medium text-blue-100">EUA</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {(entityAssets?.eua_balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            {entityBalance ? formatCurrency(entityBalance.total_deposited, entityBalance.balance_currency || 'EUR') : '\u20AC 0.00'}
          </span>
        </div>
      </div>

      {/* Role Info */}
      {user.role === 'APPROVED' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-navy-900 dark:text-white">User is APPROVED but not yet FUNDED</p>
              <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                Confirm a deposit to upgrade this user to FUNDED status, allowing them to trade.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit History */}
      <div>
        <h3 className="font-semibold text-navy-900 dark:text-white mb-4">Deposit History</h3>
        {deposits.length === 0 ? (
          <div className="text-center py-8 text-navy-500 dark:text-navy-400">
            <BanknoteIcon className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
            <p>No deposits recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between p-4 rounded-lg bg-navy-50 dark:bg-navy-700/50 border border-navy-100 dark:border-navy-600"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    deposit.status === 'confirmed'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : deposit.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  )}>
                    <DollarSign className={cn(
                      'w-5 h-5',
                      deposit.status === 'confirmed'
                        ? 'text-emerald-600'
                        : deposit.status === 'rejected'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    )} />
                  </div>
                  <div>
                    {/* Show "—" when amount is missing to avoid masking invalid data */}
                    <p className="font-semibold text-navy-900 dark:text-white">
                      {deposit.amount != null
                        ? formatCurrency(deposit.amount, deposit.currency ?? 'EUR')
                        : '—'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                      {deposit.wire_reference && (
                        <span>Ref: {deposit.wire_reference}</span>
                      )}
                      <span>{formatRelativeTime(deposit.created_at)}</span>
                    </div>
                    {deposit.notes && (
                      <p className="text-xs text-navy-400 dark:text-navy-500 mt-1 italic">
                        {deposit.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={
                  deposit.status === 'confirmed' ? 'success' :
                  deposit.status === 'rejected' ? 'danger' : 'warning'
                }>
                  {deposit.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ user }: { user: AdminUserFull }) {
  if (!user.entity_id) {
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
      entityId={user.entity_id}
      entityName={user.entity_name || 'Unknown Entity'}
    />
  );
}
