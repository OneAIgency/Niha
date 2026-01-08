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
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/common';
import { cn, formatRelativeTime } from '../utils';
import { adminApi } from '../services/api';
import type { User, UserRole } from '../types';

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

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await adminApi.deleteUser(userId);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_active: false } : u
      ));
    } catch (error) {
      console.error('Failed to deactivate user:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">User Management</h1>
            <p className="text-navy-600 dark:text-navy-300">
              Manage users, roles, and permissions ({pagination.total} total users)
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create User
          </Button>
        </div>

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
                    Last Login
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
                          {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
      </div>
    </div>
  );
}
