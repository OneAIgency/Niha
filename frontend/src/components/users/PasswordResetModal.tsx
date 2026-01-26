import { motion } from 'framer-motion';
import { X, Key, AlertTriangle } from 'lucide-react';
import { Button, Input } from '../common';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  newPassword: string;
  setNewPassword: (value: string) => void;
  forceChange: boolean;
  setForceChange: (value: boolean) => void;
  onSubmit: () => void;
  resetting: boolean;
}

export function PasswordResetModal({
  isOpen,
  onClose,
  userEmail,
  newPassword,
  setNewPassword,
  forceChange,
  setForceChange,
  onSubmit,
  resetting,
}: PasswordResetModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setNewPassword('');
  };

  return (
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
            onClick={handleClose}
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
                <p className="text-sm text-navy-600 dark:text-navy-300">{userEmail}</p>
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
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={resetting}
            disabled={newPassword.length < 8}
          >
            <Key className="w-4 h-4" />
            Reset Password
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
