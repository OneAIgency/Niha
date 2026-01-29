import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Input } from '../common';
import { cn } from '../../utils';
import type { UserRole } from '../../types';

interface UserWithEntity {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  role: UserRole;
  is_active?: boolean;
  entity_name?: string;
}

interface EditUserModalProps {
  user: UserWithEntity | null;
  onClose: () => void;
  editForm: {
    first_name: string;
    last_name: string;
    position: string;
    role: UserRole;
    is_active: boolean;
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
                : 'bg-gradient-to-br from-amber-500 to-amber-600'
            )}>
              {getInitials(user.first_name, user.last_name, user.email)}
            </div>
            <div>
              <p className="font-semibold text-navy-900 dark:text-white">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-navy-500 dark:text-navy-400">{user.email}</p>
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
