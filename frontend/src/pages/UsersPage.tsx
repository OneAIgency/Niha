import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Edit,
  Mail,
  Building2,
  Clock,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  Trash2,
  Eye,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Monitor,
  DollarSign,
  Wallet,
  BanknoteIcon,
  Leaf,
  Wind,
  BarChart3,
  Pencil,
} from 'lucide-react';
import { Button, Card, Badge, Input, ConfirmationModal } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import { AddAssetModal, EditAssetModal, UserOrdersSection } from '../components/backoffice';
import { cn, formatRelativeTime } from '../utils';
import { adminApi, backofficeApi } from '../services/api';
import type { User, UserRole, AdminUserFull, Deposit, EntityBalance } from '../types';

// Simple interface for entity assets display (subset of full EntityAssets)
interface EntityAssetsDisplay {
  entity_id: string;
  entity_name: string;
  eur_balance: number;
  cea_balance: number;
  eua_balance: number;
}

interface UserWithEntity extends User {
  entity_name?: string;
  is_active?: boolean;
  created_at?: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserWithEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithEntity | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 0 });
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Create user form state
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    position: '',
    password: '',
    role: 'PENDING' as UserRole,
  });
  const [useInvitation, setUseInvitation] = useState(false);

  // Edit user form state
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
    role: 'PENDING' as UserRole,
    is_active: true,
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
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depositsError, setDepositsError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: { role?: UserRole; search?: string; page: number; per_page: number } = {
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
        total_pages: response.pagination.total_pages,
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [searchQuery]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSavingRole(userId);
    try {
      await adminApi.changeUserRole(userId, newRole);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setShowRoleDropdown(null);
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setSavingRole(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name) return;
    if (!useInvitation && !newUser.password) return; // Password required unless using invitation

    setSavingUser(true);
    try {
      const userData: {
        email: string;
        first_name: string;
        last_name: string;
        role: UserRole;
        password?: string;
      } = {
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      };

      // Only include password if not using invitation
      if (!useInvitation && newUser.password) {
        userData.password = newUser.password;
      }

      const created = await adminApi.createUser(userData);
      setUsers([created, ...users]);
      setShowCreateModal(false);
      setNewUser({ email: '', first_name: '', last_name: '', position: '', password: '', role: 'PENDING' });
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
      const updated = await adminApi.updateUser(editingUser.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        position: editForm.position,
        role: editForm.role,
      });
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

  const confirmDeactivateUser = async () => {
    if (!deactivateUser) return;

    setDeactivating(true);
    try {
      await adminApi.deleteUser(deactivateUser.id);
      setUsers(users.map(u =>
        u.id === deactivateUser.id ? { ...u, is_active: false } : u
      ));
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
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      position: user.position || '',
      role: user.role,
      is_active: user.is_active !== false,
    });
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
        new_password: newPassword,
        force_change: forceChange,
      });
      setShowPasswordReset(false);
      setNewPassword('');
      // Refresh user details
      const updated = await adminApi.getUserFull(detailUser.id);
      setDetailUser(updated);
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setResettingPassword(false);
    }
  };

  const loadDeposits = async (entityId: string) => {
    // Validate entityId
    if (!entityId || entityId.trim() === '') {
      console.error('loadDeposits called with invalid entityId:', entityId);
      setDepositsError('Invalid entity ID');
      return;
    }

    setLoadingDeposits(true);
    setDepositsError(null); // Clear previous errors

    try {
      console.log('Loading deposits for entity:', entityId);

      const [balance, assetsResponse, depositList] = await Promise.all([
        backofficeApi.getEntityBalance(entityId),
        backofficeApi.getEntityAssets(entityId),
        backofficeApi.getDeposits({ entity_id: entityId }),
      ]);

      console.log('Deposits loaded successfully:', {
        balance,
        assetsResponse,
        depositCount: depositList.length,
      });

      // Validate response data
      if (!assetsResponse || typeof assetsResponse !== 'object') {
        throw new Error('Invalid assets response from server');
      }

      setEntityBalance(balance);

      // Extract only the fields we need from the assets response with defensive checks
      setEntityAssets({
        entity_id: assetsResponse.entity_id || entityId,
        entity_name: assetsResponse.entity_name || 'Unknown Entity',
        eur_balance: assetsResponse.eur_balance ?? 0,
        cea_balance: assetsResponse.cea_balance ?? 0,
        eua_balance: assetsResponse.eua_balance ?? 0,
      });

      setDeposits(Array.isArray(depositList) ? depositList : []);
    } catch (error: any) {
      console.error('Failed to load deposits:', error);

      // Determine user-friendly error message
      let errorMessage = 'Failed to load entity assets';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied - insufficient permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'Entity not found';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error - please check your connection';
      }

      setDepositsError(errorMessage);
      setEntityBalance(null);
      setEntityAssets(null);
      setDeposits([]);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { EUR: '€', USD: '$', CNY: '¥', HKD: 'HK$' };
    return `${symbols[currency] || currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRoleBadgeVariant = (role: UserRole) => {
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
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="FUNDED">Funded</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
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
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                              : user.role === 'FUNDED'
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                              : user.role === 'APPROVED'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-amber-500 to-amber-600'
                          )}
                        >
                          {getInitials(user.first_name, user.last_name, user.email)}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900 dark:text-white">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
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
                          {user.entity_name || 'No entity'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowRoleDropdown(showRoleDropdown === user.id ? null : user.id)}
                          className="flex items-center gap-1"
                          disabled={savingRole === user.id}
                        >
                          {savingRole === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                          ) : (
                            <>
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role.toUpperCase()}
                              </Badge>
                              <ChevronDown className="w-3 h-3 text-navy-400" />
                            </>
                          )}
                        </button>
                        {showRoleDropdown === user.id && (
                          <div className="absolute z-10 mt-1 w-36 bg-white dark:bg-navy-800 rounded-lg shadow-xl border border-navy-100 dark:border-navy-700 overflow-hidden">
                            {(['ADMIN', 'FUNDED', 'APPROVED', 'PENDING'] as UserRole[]).map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(user.id, role)}
                                className={cn(
                                  'w-full px-3 py-2 text-left text-sm hover:bg-navy-50 dark:hover:bg-navy-700 flex items-center justify-between',
                                  user.role === role && 'bg-navy-50 dark:bg-navy-700'
                                )}
                              >
                                <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
                                  {role.toUpperCase()}
                                </Badge>
                                {user.role === role && <Check className="w-3 h-3 text-emerald-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={user.is_active !== false ? 'success' : 'danger'}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-navy-400" />
                        <span className="text-sm text-navy-600 dark:text-navy-300">
                          {(user.role === 'APPROVED' || user.role === 'FUNDED') && (user as any).kyc_approved_at
                            ? formatRelativeTime((user as any).kyc_approved_at)
                            : user.last_login
                              ? formatRelativeTime(user.last_login)
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
                        {user.entity_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddAssetUser({
                              id: user.id,
                              entityId: user.entity_id!,
                              entityName: user.entity_name || 'Unknown Entity'
                            })}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Add Asset"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateUser(user)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          {pagination.total_pages > 1 && (
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
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">Create New User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Smith"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
                <Input
                  label="Position"
                  placeholder="e.g., Carbon Trading Manager"
                  value={newUser.position}
                  onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-2">
                    Initial Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="FUNDED">Funded</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Password or Invitation Toggle */}
                <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useInvitation"
                      checked={useInvitation}
                      onChange={(e) => setUseInvitation(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded"
                    />
                    <label htmlFor="useInvitation" className="text-sm text-navy-700 dark:text-navy-200">
                      Send invitation email instead of setting password
                    </label>
                  </div>

                  {!useInvitation && (
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  )}

                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {useInvitation
                      ? 'An invitation email will be sent to the user to set up their password.'
                      : 'The user will be able to login immediately with this password.'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-navy-100 dark:border-navy-700">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  loading={savingUser}
                  disabled={!newUser.email || !newUser.first_name || !newUser.last_name || (!useInvitation && newUser.password.length < 8)}
                >
                  {useInvitation ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invitation
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">Edit User</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl',
                    editingUser.role === 'ADMIN'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                      : editingUser.role === 'FUNDED'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                      : editingUser.role === 'APPROVED'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-amber-500 to-amber-600'
                  )}>
                    {getInitials(editingUser.first_name, editingUser.last_name, editingUser.email)}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 dark:text-white">
                      {editingUser.first_name} {editingUser.last_name}
                    </p>
                    <p className="text-sm text-navy-500 dark:text-navy-400">{editingUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
                <Input
                  label="Position"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-2">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="FUNDED">Funded</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-navy-700 dark:text-navy-200">
                    Account is active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-navy-100 dark:border-navy-700">
                <Button variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUpdateUser} loading={savingUser}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Detail Modal */}
        {(detailUser || loadingDetail) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
              {loadingDetail ? (
                <div className="flex items-center justify-center p-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : detailUser && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl',
                        detailUser.role === 'ADMIN'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : detailUser.role === 'FUNDED'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : detailUser.role === 'APPROVED'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-amber-500 to-amber-600'
                      )}>
                        {getInitials(detailUser.first_name, detailUser.last_name, detailUser.email)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                          {detailUser.first_name} {detailUser.last_name}
                        </h2>
                        <p className="text-navy-500 dark:text-navy-400">{detailUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailUser(null)}
                      className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                    >
                      <X className="w-5 h-5 text-navy-500" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-navy-100 dark:border-navy-700">
                    {[
                      { id: 'info', label: 'User Info', icon: Shield },
                      { id: 'deposits', label: 'Assets', icon: Wallet },
                      { id: 'orders', label: 'Orders', icon: BarChart3 },
                      { id: 'auth', label: 'Auth History', icon: Key },
                      { id: 'sessions', label: 'Sessions', icon: Monitor },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setDetailTab(tab.id as 'info' | 'auth' | 'sessions' | 'deposits' | 'orders');
                          // Load deposits/assets when switching to deposits tab
                          if (tab.id === 'deposits' && detailUser?.entity_id) {
                            loadDeposits(detailUser.entity_id);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                          detailTab === tab.id
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
                    {detailTab === 'info' && (
                      <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                            <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Role</p>
                            <Badge variant={getRoleBadgeVariant(detailUser.role as UserRole)}>
                              {detailUser.role}
                            </Badge>
                          </div>
                          <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                            <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Status</p>
                            <Badge variant={detailUser.is_active ? 'success' : 'danger'}>
                              {detailUser.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                            <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Password</p>
                            <Badge variant={detailUser.password_set ? 'success' : 'warning'}>
                              {detailUser.password_set ? 'Set' : 'Not Set'}
                            </Badge>
                          </div>
                          <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                            <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Logins</p>
                            <p className="text-lg font-bold text-navy-900 dark:text-white">{detailUser.login_count}</p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-navy-900 dark:text-white">Account Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-navy-500 dark:text-navy-400">Entity</span>
                                <span className="text-navy-900 dark:text-white">{detailUser.entity_name || 'None'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy-500 dark:text-navy-400">Position</span>
                                <span className="text-navy-900 dark:text-white">{detailUser.position || 'Not set'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy-500 dark:text-navy-400">Phone</span>
                                <span className="text-navy-900 dark:text-white">{detailUser.phone || 'Not set'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy-500 dark:text-navy-400">Created</span>
                                <span className="text-navy-900 dark:text-white">
                                  {detailUser.created_at ? formatRelativeTime(detailUser.created_at) : 'Unknown'}
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
                                  {detailUser.last_login ? formatRelativeTime(detailUser.last_login) : 'Never'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy-500 dark:text-navy-400">Last IP</span>
                                <span className="text-navy-900 dark:text-white font-mono text-sm">
                                  {detailUser.last_login_ip || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-navy-500 dark:text-navy-400">Failed (24h)</span>
                                <Badge variant={detailUser.failed_login_count_24h > 5 ? 'danger' : detailUser.failed_login_count_24h > 0 ? 'warning' : 'success'}>
                                  {detailUser.failed_login_count_24h}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-navy-500 dark:text-navy-400">Force Password Change</span>
                                <Badge variant={detailUser.must_change_password ? 'warning' : 'success'}>
                                  {detailUser.must_change_password ? 'Yes' : 'No'}
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
                            <Button variant="secondary" size="sm" onClick={() => setShowPasswordReset(true)}>
                              Reset Password
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailTab === 'auth' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-navy-900 dark:text-white">Authentication History</h3>
                          <p className="text-sm text-navy-500">Last 50 attempts</p>
                        </div>
                        {detailUser.auth_history.length === 0 ? (
                          <div className="text-center py-8 text-navy-500 dark:text-navy-400">
                            No authentication attempts recorded
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {detailUser.auth_history.map((attempt) => (
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
                    )}

                    {detailTab === 'sessions' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-navy-900 dark:text-white">Recent Sessions</h3>
                        {detailUser.sessions.length === 0 ? (
                          <div className="text-center py-8 text-navy-500 dark:text-navy-400">
                            No sessions recorded
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {detailUser.sessions.map((session) => (
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
                    )}

                    {detailTab === 'deposits' && (
                      <div className="space-y-6">
                        {!detailUser.entity_id ? (
                          <div className="text-center py-8">
                            <Building2 className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
                            <p className="text-navy-500 dark:text-navy-400">
                              User is not associated with any entity
                            </p>
                            <p className="text-sm text-navy-400 dark:text-navy-500 mt-2">
                              Deposits can only be made for users with an entity
                            </p>
                          </div>
                        ) : depositsError ? (
                          <div className="text-center py-8">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                              {depositsError}
                            </p>
                            <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
                              Unable to load entity assets. This could be due to permissions, network issues, or server problems.
                            </p>
                            <Button
                              variant="secondary"
                              onClick={() => detailUser.entity_id && loadDeposits(detailUser.entity_id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                              Retry
                            </Button>
                          </div>
                        ) : loadingDeposits ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                          </div>
                        ) : (
                          <>
                            {/* Entity Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-sm text-navy-500 dark:text-navy-400">Entity Holdings</p>
                                <p className="font-bold text-navy-900 dark:text-white">
                                  {entityAssets?.entity_name || entityBalance?.entity_name || detailUser.entity_name || 'Unknown Entity'}
                                </p>
                              </div>
                            </div>

                            {/* Asset Balances Grid */}
                            <div className="grid grid-cols-3 gap-4">
                              {/* EUR Balance */}
                              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white relative group">
                                <button
                                  onClick={() => setEditingAsset({
                                    entityId: detailUser.entity_id!,
                                    entityName: entityAssets?.entity_name || detailUser.entity_name || 'Unknown',
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
                                  €{(entityAssets?.eur_balance ?? entityBalance?.balance_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>

                              {/* CEA Balance */}
                              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white relative group">
                                <button
                                  onClick={() => setEditingAsset({
                                    entityId: detailUser.entity_id!,
                                    entityName: entityAssets?.entity_name || detailUser.entity_name || 'Unknown',
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
                                  <span className="text-sm font-normal ml-1">tCO₂</span>
                                </p>
                              </div>

                              {/* EUA Balance */}
                              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white relative group">
                                <button
                                  onClick={() => setEditingAsset({
                                    entityId: detailUser.entity_id!,
                                    entityName: entityAssets?.entity_name || detailUser.entity_name || 'Unknown',
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
                                  <span className="text-sm font-normal ml-1">tCO₂</span>
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
                                  {entityBalance ? formatCurrency(entityBalance.total_deposited, entityBalance.balance_currency || 'EUR') : '€ 0.00'}
                                </span>
                              </div>
                            </div>

                            {/* Role Info */}
                            {detailUser.role === 'APPROVED' && (
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
                                          <p className="font-semibold text-navy-900 dark:text-white">
                                            {formatCurrency(deposit.amount, deposit.currency)}
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
                          </>
                        )}
                      </div>
                    )}

                    {detailTab === 'orders' && (
                      <div className="space-y-4">
                        {!detailUser.entity_id ? (
                          <div className="text-center py-8">
                            <BarChart3 className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
                            <p className="text-navy-500 dark:text-navy-400">
                              User is not associated with any entity
                            </p>
                            <p className="text-sm text-navy-400 dark:text-navy-500 mt-2">
                              Orders can only be viewed for users with an entity
                            </p>
                          </div>
                        ) : (
                          <UserOrdersSection
                            entityId={detailUser.entity_id}
                            entityName={detailUser.entity_name || 'Unknown Entity'}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordReset && detailUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Key className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white">Reset Password</h2>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setNewPassword('');
                  }}
                  className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-navy-900 dark:text-white">Resetting password for:</p>
                      <p className="text-sm text-navy-600 dark:text-navy-300">{detailUser.email}</p>
                    </div>
                  </div>
                </div>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="flex items-center gap-3 p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="forceChange"
                    checked={forceChange}
                    onChange={(e) => setForceChange(e.target.checked)}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <label htmlFor="forceChange" className="text-sm text-navy-700 dark:text-navy-200">
                    Force user to change password on next login
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-navy-100 dark:border-navy-700">
                <Button variant="ghost" onClick={() => {
                  setShowPasswordReset(false);
                  setNewPassword('');
                }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePasswordReset}
                  loading={resettingPassword}
                  disabled={newPassword.length < 8}
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </Button>
              </div>
            </motion.div>
          </div>
        )}

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
            { label: 'Name', value: `${deactivateUser.first_name || ''} ${deactivateUser.last_name || ''}`.trim() || 'N/A' },
            { label: 'Role', value: deactivateUser.role },
            { label: 'Company', value: deactivateUser.entity_name || 'N/A' },
          ] : []}
          loading={deactivating}
        />

        {/* Add Asset Modal */}
        {addAssetUser && (
          <AddAssetModal
            isOpen={!!addAssetUser}
            onClose={() => setAddAssetUser(null)}
            onSuccess={() => {
              // Refresh the user detail if viewing same user
              if (detailUser?.entity_id === addAssetUser.entityId) {
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
              // Refresh the asset balances
              if (detailUser?.entity_id) {
                loadDeposits(detailUser.entity_id);
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
