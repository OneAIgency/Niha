import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, UserPlus, Copy, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/api';
import type { ContactRequestResponse } from '../../types';

interface ApproveInviteModalProps {
  contactRequest: ContactRequestResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CreateMode = 'invitation' | 'manual';

function initialFromRequest(r: ContactRequestResponse) {
  const name = (r.contact_name ?? '').trim();
  const parts = name ? name.split(/\s+/) : [];
  return {
    email: r.contact_email ?? '',
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') ?? '',
    position: r.position ?? '',
  };
}

export function ApproveInviteModal({
  contactRequest,
  isOpen,
  onClose,
  onSuccess
}: ApproveInviteModalProps) {
  const init = initialFromRequest(contactRequest);
  const [mode, setMode] = useState<CreateMode>('invitation');
  const [email, setEmail] = useState(init.email);
  const [firstName, setFirstName] = useState(init.firstName);
  const [lastName, setLastName] = useState(init.lastName);
  const [position, setPosition] = useState(init.position);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const next = initialFromRequest(contactRequest);
    setEmail(next.email);
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setPosition(next.position);
    setPassword('');
    setGeneratedPassword(null);
    setError('');
    setSuccess(false);
  }, [contactRequest.id, contactRequest.contact_email, contactRequest.contact_name, contactRequest.position]);

  // Generate a strong random password
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%^&*';

    let pwd = '';
    // Ensure at least one of each required type
    pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += special.charAt(Math.floor(Math.random() * special.length));

    // Fill the rest randomly
    const all = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 8; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }

    // Shuffle the password
    pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');

    setPassword(pwd);
    setGeneratedPassword(pwd);
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await adminApi.createUserFromRequest(contactRequest.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        mode,
        password: mode === 'manual' ? password : undefined,
        position: position || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const e = err as {
        message?: unknown;
        data?: {
          detail?:
            | string
            | Array<{ msg?: string }>
            | { error?: string; details?: { hint?: string } };
        };
      };
      let msg = 'Failed to create user';
      let hint: string | undefined;
      if (typeof e.message === 'string') msg = e.message;
      else if (typeof e.data?.detail === 'string') msg = e.data.detail;
      else if (Array.isArray(e.data?.detail) && e.data.detail.length) {
        const first = e.data.detail[0];
        msg = (first?.msg ?? String(first)) ?? msg;
      } else if (
        e.data?.detail &&
        typeof e.data.detail === 'object' &&
        !Array.isArray(e.data.detail) &&
        'error' in e.data.detail
      ) {
        const d = e.data.detail as { error?: string; details?: { hint?: string } };
        msg = d.error ?? msg;
        hint = d.details?.hint;
      }
      if (hint && !msg.includes(hint)) {
        const h = hint.length > 150 ? `${hint.slice(0, 150)}…` : hint;
        msg = `${msg} — ${h}`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="presentation"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700">
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
              Approve & Create User
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Entity Info */}
            <div className="p-3 bg-navy-50 dark:bg-navy-900/50 rounded-lg">
              <p className="text-sm text-navy-500 dark:text-navy-400">Creating user for:</p>
              <p className="font-semibold text-navy-900 dark:text-white">
                {contactRequest.entity_name ?? '—'}
              </p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('invitation')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  mode === 'invitation'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-navy-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600'
                }`}
              >
                <Mail className={`w-6 h-6 mb-2 ${
                  mode === 'invitation' ? 'text-emerald-600' : 'text-navy-400'
                }`} />
                <h3 className={`font-semibold text-sm ${
                  mode === 'invitation' ? 'text-emerald-700 dark:text-emerald-400' : 'text-navy-700 dark:text-navy-300'
                }`}>
                  Send Invitation
                </h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  User sets their own password
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  mode === 'manual'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-navy-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600'
                }`}
              >
                <UserPlus className={`w-6 h-6 mb-2 ${
                  mode === 'manual' ? 'text-blue-600' : 'text-navy-400'
                }`} />
                <h3 className={`font-semibold text-sm ${
                  mode === 'manual' ? 'text-blue-700 dark:text-blue-400' : 'text-navy-700 dark:text-navy-300'
                }`}>
                  Manual Creation
                </h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  You set the password
                </p>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Password field for manual mode */}
              {mode === 'manual' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                    Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setGeneratedPassword(null);
                      }}
                      placeholder="Enter or generate password"
                      className="flex-1 px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-3 py-2 bg-navy-100 dark:bg-navy-700 hover:bg-navy-200 dark:hover:bg-navy-600 rounded-lg text-navy-700 dark:text-navy-300 text-sm font-medium transition-colors"
                    >
                      Generate
                    </button>
                  </div>

                  {generatedPassword && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                            Save this password - it will only be shown once!
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 px-2 py-1 bg-white dark:bg-navy-900 rounded font-mono text-sm text-navy-900 dark:text-white">
                              {generatedPassword}
                            </code>
                            <button
                              type="button"
                              onClick={copyPassword}
                              className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-800 rounded transition-colors"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    User created successfully!
                    {mode === 'invitation' && ' Invitation email sent.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-navy-200 dark:border-navy-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!loading && email && firstName && lastName && (mode !== 'manual' || password)) {
                  handleSubmit();
                }
              }}
              disabled={loading || !email || !firstName || !lastName || (mode === 'manual' && !password)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {mode === 'invitation' ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invitation
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
