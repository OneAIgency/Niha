import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, XCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';

export function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<{
    email: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  const [error, setError] = useState('');

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isValidPassword = hasMinLength && hasUppercase && hasSpecialChar && passwordsMatch;

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const validateToken = async () => {
      try {
        const data = await authApi.validateInvitation(token);
        setTokenValid(true);
        setUserInfo(data);
      } catch (err: any) {
        setTokenValid(false);
        if (err.response?.status === 410) {
          setError('This invitation link has expired. Please contact the administrator for a new invitation.');
        } else {
          setError('This invitation link is invalid. Please contact the administrator.');
        }
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPassword || !token) return;

    setLoading(true);
    setError('');

    try {
      const { access_token, user } = await authApi.setupPassword(
        token,
        password,
        confirmPassword
      );

      // Store auth and redirect
      setAuth(user, access_token);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-navy-300">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Welcome, {userInfo?.first_name}!
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-2">
            Set up your password to activate your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={userInfo?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 text-navy-500 dark:text-navy-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3 space-y-1.5">
              <div className={`flex items-center gap-2 text-sm ${
                hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-navy-400'
              }`}>
                {hasMinLength ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                At least 8 characters
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-navy-400'
              }`}>
                {hasUppercase ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                At least 1 uppercase letter
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400' : 'text-navy-400'
              }`}>
                {hasSpecialChar ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                At least 1 special character (!@#$%^&*)
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <X className="w-4 h-4" />
                Passwords do not match
              </p>
            )}
            {passwordsMatch && (
              <p className="mt-1.5 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Passwords match
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValidPassword || loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up account...
              </>
            ) : (
              'Set Password & Continue'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
