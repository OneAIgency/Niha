import { motion } from 'framer-motion';
import { X, Mail, Plus } from 'lucide-react';
import { Button, Input } from '../common';
import type { UserRole } from '../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  newUser: {
    email: string;
    first_name: string;
    last_name: string;
    position: string;
    password: string;
    role: UserRole;
  };
  setNewUser: (user: CreateUserModalProps['newUser']) => void;
  useInvitation: boolean;
  setUseInvitation: (value: boolean) => void;
  onSubmit: () => void;
  saving: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  useInvitation,
  setUseInvitation,
  onSubmit,
  saving,
}: CreateUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">Create New User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-navy-500" aria-hidden="true" />
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
              <option value="NDA">NDA</option>
              <option value="REJECTED">Rejected</option>
              <option value="KYC">KYC</option>
              <option value="APPROVED">Approved</option>
              <option value="FUNDING">Funding</option>
              <option value="AML">AML</option>
              <option value="CEA">CEA</option>
              <option value="CEA_SETTLE">CEA Settle</option>
              <option value="SWAP">Swap</option>
              <option value="EUA_SETTLE">EUA Settle</option>
              <option value="EUA">EUA</option>
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={saving}
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
  );
}
