import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Clock,
  Globe,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CheckCircle,
  FlaskConical,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge, Input, Subheader, NumberInput, formatNumberWithSeparators } from '../components/common';
import { useAuthStore } from '../stores/useStore';
import { usersApi, adminApi } from '../services/api';
import { formatRelativeTime } from '../utils';
import type { Entity, EntityBalances } from '../types';

export function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    position: user?.position || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Testing tools state (admin only)
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'ADMIN');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [creditAssetType, setCreditAssetType] = useState<'EUR' | 'CEA' | 'EUA'>('EUR');
  const [creditAmount, setCreditAmount] = useState('10000');
  const [isCrediting, setIsCrediting] = useState(false);
  const [balances, setBalances] = useState<EntityBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  /**
   * Load profile and entity data on component mount.
   * Fetches fresh data from API to ensure up-to-date information.
   */
  useEffect(() => {
    if (!user) return; // Skip if user not loaded yet

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load fresh profile data from API
        const profile = await usersApi.getProfile();
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          position: profile.position || '',
        });

        // Load entity data if user has an associated entity
        const entityData = await usersApi.getMyEntity();
        if (entityData) {
          setEntity(entityData);
        }
      } catch (err: unknown) {
        console.error('Failed to load profile data:', err);
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Update form data when user changes (from auth store)
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        position: user.position || '',
      });
    }
  }, [user]);

  // Early return if user is not loaded yet (after all hooks)
  if (!user) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  /**
   * Save profile changes to the backend.
   * Only accessible to admin users (enforced by UI conditional rendering).
   * Updates the auth store with new user data on success.
   */
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updatedUser = await usersApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        position: formData.position,
      });
      // Update auth store with new user data to keep UI in sync
      if (token) {
        setAuth(updatedUser, token);
      }
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Validate password strength according to backend requirements.
   * Must match backend validation exactly: !@#$%^&*()_+-=[]{}|;:,.<>?
   * 
   * @param password - Password to validate
   * @returns Array of error messages (empty if valid)
   */
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('At least one number');
    // Special characters must match backend: !@#$%^&*()_+-=[]{}|;:,.<>?
    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
      errors.push('At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
    return errors;
  };

  /**
   * Handle password change request.
   * Validates password strength and match before submitting to API.
   * Handles both validation errors (shown inline) and API errors (shown in error banner).
   */
  const handleChangePassword = async () => {
    setError(null);
    setPasswordErrors([]);
    setSuccessMessage(null);

    // Validate password strength (frontend validation)
    const errors = validatePassword(passwordForm.newPassword);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Check password confirmation match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }

    setIsSaving(true);
    try {
      await usersApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setSuccessMessage('Password changed successfully');
      setShowPasswordForm(false);
      // Clear form on success
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors([]);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to change password:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Failed to change password';
      // Show current password errors inline with password fields
      if (errorMessage.toLowerCase().includes('current password') || 
          errorMessage.toLowerCase().includes('incorrect')) {
        setPasswordErrors([errorMessage]);
      } else {
        // Show other errors in error banner
        setError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Available roles for testing
  const ALL_ROLES = [
    'ADMIN', 'MM', 'NDA', 'REJECTED', 'KYC', 'APPROVED',
    'FUNDING', 'AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA'
  ];

  /**
   * Load admin balances for testing tools
   */
  const loadBalances = async () => {
    if (!isAdmin) return;
    setIsLoadingBalances(true);
    try {
      const data = await adminApi.getMyBalances();
      setBalances(data);
    } catch (err) {
      console.error('Failed to load balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Load balances on mount for admin
  useEffect(() => {
    if (isAdmin && user?.entityId) {
      loadBalances();
    }
  }, [isAdmin, user?.entityId]);

  /**
   * Change admin role for testing
   */
  const handleChangeRole = async () => {
    setIsChangingRole(true);
    setError(null);
    try {
      const updatedUser = await adminApi.updateMyRole(selectedRole);
      if (token) {
        setAuth(updatedUser, token);
      }
      setSuccessMessage(`Role changed to ${selectedRole}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to change role:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to change role');
    } finally {
      setIsChangingRole(false);
    }
  };

  /**
   * Credit assets to admin entity
   */
  const handleCreditAssets = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsCrediting(true);
    setError(null);
    try {
      const newBalances = await adminApi.creditMyEntity(creditAssetType, amount);
      setBalances(newBalances);
      setSuccessMessage(`Credited ${formatNumberWithSeparators(amount)} ${creditAssetType}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to credit assets:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to credit assets');
    } finally {
      setIsCrediting(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || '??';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'MM':
        return 'info';
      case 'NDA':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const jurisdictionLabels: Record<string, string> = {
    EU: 'European Union',
    CN: 'China',
    HK: 'Hong Kong',
    OTHER: 'Other',
  };

  return (
    <div className="min-h-screen bg-navy-900">
      <Subheader
        icon={<User className="w-5 h-5 text-emerald-500" />}
        title="My Profile"
        description="Manage your personal information and security settings"
        iconBg="bg-emerald-500/20"
      />
      <div className="page-container py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
              aria-label="Dismiss success message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-6 bg-navy-200 dark:bg-navy-700 rounded w-1/3 mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/2" />
                    <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
          {/* Personal Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-500" />
                  Personal Information
                </h2>
                {isAdmin && (
                  !isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            firstName: user?.firstName || '',
                            lastName: user?.lastName || '',
                            phone: user?.phone || '',
                            position: user?.position || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveProfile}
                        loading={isSaving}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {getInitials()}
                  </div>
                  <Badge variant={getRoleBadgeVariant(user?.role || 'NDA')} className="mt-3">
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
                      />
                      <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                      <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                        icon={<Phone className="w-4 h-4" />}
                      />
                      <Input
                        label="Position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="e.g., Carbon Trading Manager"
                        icon={<Briefcase className="w-4 h-4" />}
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <p className="text-navy-900 dark:text-white font-medium">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                          Email Address
                        </label>
                        <p className="text-navy-900 dark:text-white font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-navy-400" />
                          {user?.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <p className="text-navy-900 dark:text-white font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-navy-400" />
                          {user?.phone || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                          Position
                        </label>
                        <p className="text-navy-900 dark:text-white font-medium flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-navy-400" />
                          {user?.position || 'Not set'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Entity Information Card */}
          {entity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Entity Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                      Entity Name
                    </label>
                    <p className="text-navy-900 dark:text-white font-medium">{entity.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                      Legal Name
                    </label>
                    <p className="text-navy-900 dark:text-white font-medium">
                      {entity.legalName || entity.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                      Jurisdiction
                    </label>
                    <p className="text-navy-900 dark:text-white font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4 text-navy-400" />
                      {jurisdictionLabels[entity.jurisdiction] || entity.jurisdiction}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-1">
                      KYC Status
                    </label>
                    <Badge variant={getKycBadgeVariant(entity.kycStatus || 'pending')}>
                      {(entity.kycStatus || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                </div>

              </Card>
            </motion.div>
          )}

          {/* Testing Tools Card - Admin only */}
          {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-dashed border-amber-500/30 bg-amber-500/5">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-500" />
                Testing Tools
                <Badge variant="warning" className="ml-2">Admin Only</Badge>
              </h2>

              <div className="space-y-6">
                {/* Role Changer */}
                <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                  <h3 className="font-medium text-navy-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    Change My Role
                  </h3>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mb-3">
                    Test the UI from different user perspectives. Note: ADMIN always has access to all features
                    regardless of displayed role - this only changes what role-specific UI elements are shown.
                  </p>
                  <div className="flex gap-3">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 rounded-lg text-navy-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role} {role === user?.role ? '(current)' : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      onClick={handleChangeRole}
                      loading={isChangingRole}
                      disabled={selectedRole === user?.role}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      Change Role
                    </Button>
                  </div>
                </div>

                {/* Asset Credit */}
                <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                  <h3 className="font-medium text-navy-900 dark:text-white mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-500" />
                    Credit Assets to My Entity
                  </h3>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mb-3">
                    Add funds or certificates for testing trading
                  </p>
                  <div className="flex gap-3 mb-4">
                    <select
                      value={creditAssetType}
                      onChange={(e) => setCreditAssetType(e.target.value as 'EUR' | 'CEA' | 'EUA')}
                      className="w-32 px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 rounded-lg text-navy-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="EUR">EUR</option>
                      <option value="CEA">CEA</option>
                      <option value="EUA">EUA</option>
                    </select>
                    <NumberInput
                      value={creditAmount}
                      onChange={setCreditAmount}
                      decimals={creditAssetType === 'EUR' ? 2 : 0}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      onClick={handleCreditAssets}
                      loading={isCrediting}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      Credit
                    </Button>
                  </div>

                  {/* Current Balances */}
                  <div className="flex items-center gap-4 pt-3 border-t border-navy-200 dark:border-navy-600">
                    <span className="text-sm text-navy-500 dark:text-navy-400">Current Balances:</span>
                    {isLoadingBalances ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-navy-400" />
                    ) : balances ? (
                      <div className="flex gap-4 text-sm">
                        <span className="text-emerald-500 font-medium">
                          €{formatNumberWithSeparators(balances.eur, 'en-US', 2)}
                        </span>
                        <span className="text-blue-500 font-medium">
                          {formatNumberWithSeparators(balances.cea, 'en-US', 0)} CEA
                        </span>
                        <span className="text-navy-500 font-medium">
                          {formatNumberWithSeparators(balances.eua, 'en-US', 0)} EUA
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-navy-400">No entity associated</span>
                    )}
                    <button
                      onClick={loadBalances}
                      className="ml-auto text-navy-400 hover:text-navy-600 dark:hover:text-navy-300"
                      title="Refresh balances"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
          )}

          {/* Security Card - Admin only */}
          {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-navy-500" />
                Security
              </h2>

              <div className="space-y-6">
                {/* Last Login */}
                <div className="flex items-center justify-between p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy-100 dark:bg-navy-600 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                    </div>
                    <div>
                      <p className="font-medium text-navy-900 dark:text-white">Last Login</p>
                      <p className="text-sm text-navy-500 dark:text-navy-400">
                        {user?.lastLogin
                          ? formatRelativeTime(user.lastLogin)
                          : 'First session'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                {!showPasswordForm ? (
                  <div className="flex items-center justify-between p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-100 dark:bg-navy-600 rounded-full flex items-center justify-center">
                        <Key className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 dark:text-white">Password</p>
                        <p className="text-sm text-navy-500 dark:text-navy-400">
                          Change your account password
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-navy-900 dark:text-white flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Change Password
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordErrors([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          label="Current Password"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                          }
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300"
                          aria-label={showPasswords.current ? 'Hide current password' : 'Show current password'}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="New Password"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                          }
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300"
                          aria-label={showPasswords.new ? 'Hide new password' : 'Show new password'}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="Confirm New Password"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                          }
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300"
                          aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="text-xs text-navy-500 dark:text-navy-400 space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>
                          At least one special character (!@#$%^&amp;*()_+-=[]{}|;:,.&lt;&gt;?)
                        </li>
                      </ul>
                    </div>

                    {passwordErrors.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Please fix the following:</span>
                        </div>
                        <ul className="mt-1 text-sm text-red-500 list-disc list-inside">
                          {passwordErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleChangePassword}
                      loading={isSaving}
                      className="w-full"
                    >
                      Update Password
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
