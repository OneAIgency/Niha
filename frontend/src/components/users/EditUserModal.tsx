import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Input } from '../common';
import { cn } from '../../utils';
import type { UserRole } from '../../types';

interface UserWithEntity {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  role: UserRole;
  isActive?: boolean;
  entityName?: string;
}

interface EditUserModalProps {
  user: UserWithEntity | null;
  onClose: () => void;
  editForm: {
    firstName: string;
    lastName: string;
    position: string;
    role: UserRole;
    isActive: boolean;
  };
  setEditForm: (form: EditUserModalProps['editForm']) => void;
  onSubmit: () => void;
  saving: boolean;
}

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return email?.substring(0, 2).toUpperCase() || '??';
}

export function EditUserModal({
  user,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
  saving,
}: EditUserModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
          >
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl',
              user.role === 'ADMIN'
                ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                : user.role === 'MM'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600'
            )}>
              {getInitials(user.firstName, user.lastName, user.email)}
            </div>
            <div>
              <p className="font-semibold text-navy-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-navy-500 dark:text-navy-400">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
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
            {user.role === 'MM' ? (
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
              >
                <option value="MM">MM (Market Maker)</option>
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
            ) : (
              <>
                <p className="px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-navy-50 dark:bg-navy-800/50 text-navy-700 dark:text-navy-300 text-sm">
                  {user.role}
                </p>
                <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                  Role changes only via platform flows (see docs/ROLE_TRANSITIONS.md).
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-navy-100 dark:border-navy-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={saving}>
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
