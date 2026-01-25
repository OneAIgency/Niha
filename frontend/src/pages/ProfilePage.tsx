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
} from 'lucide-react';
import { Button, Card, Badge, Input, Subheader } from '../components/common';
import { useAuthStore } from '../stores/useStore';
import { formatRelativeTime } from '../utils';
import type { Entity } from '../types';

// Mock entity data (will come from API)
const mockEntity: Entity = {
  id: '1',
  name: 'Acme Carbon Trading Ltd',
  legal_name: 'Acme Carbon Trading Limited',
  jurisdiction: 'EU',
  verified: true,
  kyc_status: 'approved',
};

export function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [entity] = useState<Entity | null>(mockEntity);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Call API to update profile
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const handleChangePassword = async () => {
    const errors = validatePassword(passwordForm.new_password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }

    setIsSaving(true);
    // TODO: Call API to change password
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setShowPasswordForm(false);
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    setPasswordErrors([]);
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
    <div className="min-h-screen bg-slate-950">
      <Subheader
        icon={<User className="w-5 h-5 text-emerald-500" />}
        title="My Profile"
        description="Manage your personal information and security settings"
        iconBg="bg-emerald-500/20"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                {!isEditing ? (
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
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {getInitials()}
                  </div>
                  <Badge variant={getRoleBadgeVariant(user?.role || 'PENDING')} className="mt-3">
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
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600"
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
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600"
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
                          className="absolute right-3 top-9 text-navy-400 hover:text-navy-600"
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
                        <li>At least one special character (!@#$%^&*...)</li>
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
      </div>
    </div>
  );
}
