import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireConfirmation?: string; // Text user must type to confirm
  details?: { label: string; value: string }[];
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireConfirmation,
  details,
  loading = false,
}: ConfirmationModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
      setIsConfirming(false);
    }
  }, [isOpen]);

  const isConfirmDisabled = requireConfirmation
    ? confirmationInput.toLowerCase() !== requireConfirmation.toLowerCase()
    : false;

  const handleConfirm = useCallback(async () => {
    if (isConfirmDisabled || isConfirming) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  }, [isConfirmDisabled, isConfirming, onConfirm, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isConfirmDisabled) {
      handleConfirm();
    }
  }, [onClose, isConfirmDisabled, handleConfirm]);

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200 dark:border-red-800',
    },
    warning: {
      icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      border: 'border-amber-200 dark:border-amber-800',
    },
    info: {
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200 dark:border-blue-800',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            <div
              className={cn(
                'bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border',
                styles.border
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-4 p-6 pb-4">
                <div className={cn('p-3 rounded-xl', styles.icon)}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details */}
              {details && details.length > 0 && (
                <div className="mx-6 p-4 bg-navy-50 dark:bg-navy-800/50 rounded-xl space-y-2">
                  {details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-navy-500 dark:text-navy-400">{detail.label}</span>
                      <span className="font-medium text-navy-900 dark:text-white">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmation Input */}
              {requireConfirmation && (
                <div className="px-6 pt-4">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Type <span className="font-bold text-red-600 dark:text-red-400">&quot;{requireConfirmation}&quot;</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={requireConfirmation}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
                      confirmationInput.toLowerCase() === requireConfirmation.toLowerCase()
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-navy-200 dark:border-navy-700 focus:ring-red-500'
                    )}
                    autoFocus
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-4">
                <button
                  onClick={onClose}
                  disabled={isConfirming || loading}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-navy-700 dark:text-navy-300 bg-navy-100 dark:bg-navy-800 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirmDisabled || isConfirming || loading}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    styles.button
                  )}
                >
                  {isConfirming || loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
