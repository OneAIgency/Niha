import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Edit,
  Building2,
  Clock,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button, Card, Badge, ConfirmationModal } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import { AddAssetModal, EditAssetModal } from '../components/backoffice';
import {
  CreateUserModal,
  EditUserModal,
  PasswordResetModal,
  UserDetailModal,
} from '../components/users';
import { cn, formatRelativeTime } from '../utils';
import { buildDepositAndWithdrawalHistory } from '../utils/depositHistory';
import { adminApi, backofficeApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';
import type { User, UserRole, AdminUserFull, Deposit, EntityBalance, DepositHistoryItem } from '../types';

/** Order for admin "advance role" click (flow roles only). */
const ROLE_ADVANCE_ORDER: UserRole[] = [
  'NDA', 'KYC', 'APPROVED', 'FUNDING', 'AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA',
];

function getNextRole(current: UserRole): UserRole | null {
  const i = ROLE_ADVANCE_ORDER.indexOf(current);
  if (i < 0 || i >= ROLE_ADVANCE_ORDER.length - 1) return null;
  return ROLE_ADVANCE_ORDER[i + 1];
}

// Simple interface for entity assets display (subset of full EntityAssets)
interface EntityAssetsDisplay {
  entityId: string;
  entityName: string;
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
}

interface UserWithEntity extends User {
  entityName?: string;
  isActive?: boolean;
  createdAt?: string;
}

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserWithEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancingUserId, setAdvancingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all' | 'DISABLED'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithEntity | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [savingUser, setSavingUser] = useState(false);

  // Create user form state
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    password: '',
    role: 'NDA' as UserRole,
  });
  const [useInvitation, setUseInvitation] = useState(false);

  // Edit user form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    role: 'NDA' as UserRole,
    isActive: true,
  });

  // User Detail Modal state
  const [detailUser, setDetailUser] = useState<AdminUserFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'auth' | 'sessions' | 'deposits' | 'orders'>('info');

  // Edit Asset modal state
  const [editingAsset, setEditingAsset] = useState<{
    entityId: string;
    entityName: string;
    assetType: 'EUR' | 'CEA' | 'EUA';
    currentBalance: number;
  } | null>(null);

  // Password Reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Deactivation confirmation modal state
  const [deactivateUser, setDeactivateUser] = useState<UserWithEntity | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Add Asset modal state
  const [addAssetUser, setAddAssetUser] = useState<{ id: string; entityId: string; entityName: string } | null>(null);

  // Deposit state (view only - deposit creation is in backoffice)
  const [entityBalance, setEntityBalance] = useState<EntityBalance | null>(null);
  const [entityAssets, setEntityAssets] = useState<EntityAssetsDisplay | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositAndWithdrawalHistory, setDepositAndWithdrawalHistory] = useState<DepositHistoryItem[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depositsError, setDepositsError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: { role?: UserRole | 'DISABLED'; search?: string; page: number; per_page: number } = {
        page: pagination.page,
        per_page: 20,
      };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminApi.getUsers(params);
      setUsers(response.data);
      setPagination({
        page: response.pagination.page,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, pagination.page, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadUsers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) return;
    if (!useInvitation && !newUser.password) return;

    setSavingUser(true);
    try {
      const userData: {
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        password?: string;
        position?: string;
      } = {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      };

      if (!useInvitation && newUser.password) {
        userData.password = newUser.password;
      }
      if (newUser.position?.trim()) {
        userData.position = newUser.position.trim();
      }

      const created = await adminApi.createUser(userData);
      setUsers([created, ...users]);
      setShowCreateModal(false);
      setNewUser({ email: '', firstName: '', lastName: '', position: '', password: '', role: 'NDA' });
      setUseInvitation(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setSavingUser(true);
    try {
      const payload: import('../types').AdminUserUpdate = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        position: editForm.position,
        isActive: editForm.isActive,
      };
      // MM users: admin can change role; backend allows role update when current or new role is MM
      if (editingUser.role === 'MM' || editForm.role === 'MM') {
        payload.role = editForm.role;
      }
      const updated = await adminApi.updateUserFull(editingUser.id, payload);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeactivateUser = (user: UserWithEntity) => {
    setDeactivateUser(user);
  };

  const handleCreateEntityForUser = async (user: UserWithEntity) => {
    try {
      const result = await adminApi.createEntityForUser(user.id);
      alert(result.message);
      // Refresh user list to show entity_id
      loadUsers();
    } catch (error) {
      console.error('Failed to create entity:', error);
      alert('Failed to create entity for user');
    }
  };

  const confirmDeactivateUser = async () => {
    if (!deactivateUser) return;

    setDeactivating(true);
    try {
      await adminApi.deleteUser(deactivateUser.id);
      setUsers(users.filter(u => u.id !== deactivateUser.id));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      if (detailUser?.id === deactivateUser.id) {
        setDetailUser(null);
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    } finally {
      setDeactivating(false);
      setDeactivateUser(null);
    }
  };

  const openEditModal = (user: UserWithEntity) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      position: user.position || '',
      role: user.role,
      isActive: user.isActive !== false,
    });
  };

  const handleAdvanceRole = async (user: UserWithEntity, nextRole: UserRole) => {
    if (advancingUserId) return;
    setAdvancingUserId(user.id);
    try {
      await adminApi.changeUserRole(user.id, nextRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
      if (detailUser?.id === user.id) {
        setDetailUser(prev => prev ? { ...prev, role: nextRole } : null);
      }
      if (editingUser?.id === user.id) {
        setEditForm(prev => ({ ...prev, role: nextRole }));
        setEditingUser(prev => prev ? { ...prev, role: nextRole } : null);
      }
    } catch (err) {
      console.error('Failed to advance role', err);
    } finally {
      setAdvancingUserId(null);
    }
  };

  const openDetailModal = async (userId: string) => {
    setLoadingDetail(true);
    setDetailTab('info');
    try {
      const fullUser = await adminApi.getUserFull(userId);
      setDetailUser(fullUser);
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!detailUser || newPassword.length < 8) return;

    setResettingPassword(true);
    try {
      await adminApi.resetUserPassword(detailUser.id, {
        newPassword: newPassword,
        forceChange: forceChange,
      });
      setShowPasswordReset(false);
      setNewPassword('');
      const updated = await adminApi.getUserFull(detailUser.id);
      setDetailUser(updated);
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setResettingPassword(false);
    }
  };

  const loadDeposits = async (entityId: string) => {
    if (!entityId || entityId.trim() === '') {
      console.error('loadDeposits called with invalid entityId:', entityId);
      setDepositsError('Invalid entity ID');
      return;
    }

    setLoadingDeposits(true);
    setDepositsError(null);

    try {
      const [balance, assetsResponse, depositList] = await Promise.all([
        backofficeApi.getEntityBalance(entityId),
        backofficeApi.getEntityAssets(entityId),
        backofficeApi.getDeposits({ entity_id: entityId }),
      ]);

      if (!assetsResponse || typeof assetsResponse !== 'object') {
        throw new Error('Invalid assets response from server');
      }

      setEntityBalance(balance);
      setEntityAssets({
        entityId: assetsResponse.entityId || entityId,
        entityName: assetsResponse.entityName || 'Unknown Entity',
        eurBalance: assetsResponse.eurBalance ?? 0,
        ceaBalance: assetsResponse.ceaBalance ?? 0,
        euaBalance: assetsResponse.euaBalance ?? 0,
      });
      setDeposits(Array.isArray(depositList) ? depositList : []);

      const wireItems: DepositHistoryItem[] = (Array.isArray(depositList) ? depositList : []).map((d) => ({
        type: 'wire_deposit',
        id: d.id,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        createdAt: d.createdAt,
        wireReference: d.wireReference,
        notes: d.notes,
      }));
      const recentTxs = assetsResponse.recentTransactions ?? [];
      const assetItems: DepositHistoryItem[] = recentTxs.map((t: { id: string; transactionType: string; amount: number; assetType: string; createdAt: string; notes?: string }) => ({
        type: 'asset_tx',
        id: t.id,
        transactionType: t.transactionType === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT',
        amount: t.amount,
        assetType: t.assetType,
        createdAt: t.createdAt,
        notes: t.notes,
      }));
      const merged = buildDepositAndWithdrawalHistory(wireItems, assetItems);
      setDepositAndWithdrawalHistory(merged);
    } catch (error: unknown) {
      console.error('Failed to load deposits:', error);
      let errorMessage = 'Failed to load entity assets';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 403) {
          errorMessage = 'Access denied - insufficient permissions';
        } else if (response?.status === 404) {
          errorMessage = 'Entity not found';
        }
      } else if (error instanceof Error && error.message?.includes('Network Error')) {
        errorMessage = 'Network error - please check your connection';
      }
      setDepositsError(errorMessage);
      setEntityBalance(null);
      setEntityAssets(null);
      setDeposits([]);
      setDepositAndWithdrawalHistory([]);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole | 'DISABLED') => {
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
      case 'DISABLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || '??';
  };

  if (loading && users.length === 0) {
    return (
      <BackofficeLayout>
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout
      subSubHeader={
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search by name, email, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all' | 'DISABLED')}
              className="form-select"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MM">MM (Market Maker)</option>
              <option value="NDA">NDA</option>
              <option value="KYC">KYC</option>
              <option value="APPROVED">Approved</option>
              <option value="FUNDING">Funding</option>
              <option value="AML">AML</option>
              <option value="REJECTED">Rejected</option>
              <option value="CEA">CEA</option>
              <option value="CEA_SETTLE">CEA Settle</option>
              <option value="SWAP">Swap</option>
              <option value="EUA_SETTLE">EUA Settle</option>
              <option value="EUA">EUA</option>
              <option value="DISABLED">Disabled</option>
            </select>
            <Button variant="ghost" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-700">
                <th className="text-left py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Entity
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="text-right py-4 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-navy-50 dark:hover:bg-navy-800/50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                          user.role === 'ADMIN'
                            ? 'bg-gradient-to-br from-navy-500 to-navy-600'
                            : user.role === 'MM'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-amber-500 to-amber-600'
                        )}
                      >
                        {getInitials(user.firstName, user.lastName, user.email)}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 dark:text-white">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'Name not set'}
                        </p>
                        <p className="text-sm text-navy-500 dark:text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-navy-400" />
                      <span className="text-sm text-navy-600 dark:text-navy-300">
                        {user.entityName || 'No entity'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative">
                      {user.isActive === false ? (
                        <Badge variant={getRoleBadgeVariant('DISABLED')}>
                          DISABLED
                        </Badge>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {(user.role ?? (user as unknown as Record<string, unknown>).role as string)?.toUpperCase() ?? '—'}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={user.isActive !== false ? 'success' : 'danger'}>
                      {user.isActive !== false ? 'Active' : 'DISABLED'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-navy-400" />
                      <span className="text-sm text-navy-600 dark:text-navy-300">
                        {user.lastLogin
                            ? formatRelativeTime(user.lastLogin)
                            : 'Never'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(user.id)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.entityId ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddAssetUser({
                              id: user.id,
                              entityId: user.entityId!,
                              entityName: user.entityName || 'Unknown Entity'
                            })}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Add Asset"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateEntityForUser(user)}
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          title="Create Entity (required for deposits)"
                        >
                          <Building2 className="w-4 h-4" />
                        </Button>
                      )}
                      {user.isActive !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateUser(user)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
            <p className="text-navy-500 dark:text-navy-400">No users found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-navy-100 dark:border-navy-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-navy-600 dark:text-navy-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        useInvitation={useInvitation}
        setUseInvitation={setUseInvitation}
        onSubmit={handleCreateUser}
        saving={savingUser}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleUpdateUser}
        saving={savingUser}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        user={detailUser}
        loading={loadingDetail}
        onClose={() => setDetailUser(null)}
        activeTab={detailTab}
        setActiveTab={setDetailTab}
        onLoadDeposits={loadDeposits}
        onShowPasswordReset={() => setShowPasswordReset(true)}
        onEditAsset={setEditingAsset}
        loadingDeposits={loadingDeposits}
        depositsError={depositsError}
        entityBalance={entityBalance}
        entityAssets={entityAssets}
        deposits={deposits}
        depositAndWithdrawalHistory={depositAndWithdrawalHistory}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={showPasswordReset && !!detailUser}
        onClose={() => setShowPasswordReset(false)}
        userEmail={detailUser?.email || ''}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        forceChange={forceChange}
        setForceChange={setForceChange}
        onSubmit={handlePasswordReset}
        resetting={resettingPassword}
      />

      {/* Deactivate User Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onConfirm={confirmDeactivateUser}
        title="Deactivate User"
        message="This will deactivate the user account. The user will no longer be able to log in. This action can be reversed by reactivating the account."
        confirmText="Deactivate User"
        cancelText="Cancel"
        variant="warning"
        requireConfirmation={deactivateUser?.email?.split('@')[0]}
        details={deactivateUser ? [
          { label: 'Email', value: deactivateUser.email },
          { label: 'Name', value: `${deactivateUser.firstName || ''} ${deactivateUser.lastName || ''}`.trim() || 'N/A' },
          { label: 'Role', value: deactivateUser.role },
          { label: 'Company', value: deactivateUser.entityName || 'N/A' },
        ] : []}
        loading={deactivating}
      />

      {/* Add Asset Modal */}
      {addAssetUser && (
        <AddAssetModal
          isOpen={!!addAssetUser}
          onClose={() => setAddAssetUser(null)}
          onSuccess={() => {
            if (detailUser?.entityId === addAssetUser.entityId) {
              loadDeposits(addAssetUser.entityId);
            }
            loadUsers();
          }}
          entityId={addAssetUser.entityId}
          entityName={addAssetUser.entityName}
        />
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={() => {
            if (detailUser?.entityId) {
              loadDeposits(detailUser.entityId);
            }
          }}
          entityId={editingAsset.entityId}
          entityName={editingAsset.entityName}
          assetType={editingAsset.assetType}
          currentBalance={editingAsset.currentBalance}
        />
      )}
    </BackofficeLayout>
  );
}
