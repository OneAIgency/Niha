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
  Check,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import { Button, Card, Badge, Input, Subheader } from '../components/common';
import { useAuthStore } from '../stores/useStore';
import { usersApi } from '../services/api';
import { formatRelativeTime } from '../utils';
import type { Entity } from '../types';

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
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    position: user?.position || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  /**
   * Load profile and entity data on component mount.
   * Fetches fresh data from API to ensure up-to-date information.
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load fresh profile data from API
        const profile = await usersApi.getProfile();
        setFormData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
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
  }, []);

  // Update form data when user changes (from auth store)
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        position: user.position || '',
      });
    }
  }, [user]);

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
        first_name: formData.first_name,
        last_name: formData.last_name,
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
    const errors = validatePassword(passwordForm.new_password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Check password confirmation match
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }

    setIsSaving(true);
    try {
      await usersApi.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      setSuccessMessage('Password changed successfully');
      setShowPasswordForm(false);
      // Clear form on success
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
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

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
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
    <div className="min-h-screen bg-navy-950">
      <Subheader
        icon={<User className="w-5 h-5 text-emerald-500" />}
        title="My Profile"
        description="Manage your personal information and security settings"
        iconBg="bg-emerald-500/20"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
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
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Enter first name"
                      />
                      <Input
                        label="Last Name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
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
                      {entity.legal_name || entity.name}
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
                    <Badge variant={getKycBadgeVariant(entity.kyc_status)}>
                      {entity.kyc_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {entity.verified && (
                  <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">
                        Verified Entity
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Your entity has been verified and approved for trading
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
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
                        {user?.last_login
                          ? formatRelativeTime(user.last_login)
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
                          value={passwordForm.current_password}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, current_password: e.target.value })
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
                          value={passwordForm.new_password}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, new_password: e.target.value })
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
                          value={passwordForm.confirm_password}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
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
          </div>
        )}
      </div>
    </div>
  );
}
