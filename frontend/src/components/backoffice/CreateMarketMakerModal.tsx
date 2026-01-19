import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, AlertCircle, Check } from 'lucide-react';
import { Button } from '../common';
import { createMarketMaker } from '../../services/api';

interface CreateMarketMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMarketMakerModal({ isOpen, onClose, onSuccess }: CreateMarketMakerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [ceaBalance, setCeaBalance] = useState('');
  const [euaBalance, setEuaBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      await createMarketMaker({
        name: name.trim(),
        email: email.trim(),
        description: description.trim() || undefined,
        cea_balance: ceaBalance ? parseFloat(ceaBalance) : undefined,
        eua_balance: euaBalance ? parseFloat(euaBalance) : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setDescription('');
        setCeaBalance('');
        setEuaBalance('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create market maker');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                Create Market Maker
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., MM-Alpha"
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., mm-alpha@nihao.trade"
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Description <span className="text-navy-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the market maker strategy..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Initial Balances */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Initial CEA Balance <span className="text-navy-400">(optional)</span>
                </label>
                <input
                  type="number"
                  value={ceaBalance}
                  onChange={(e) => setCeaBalance(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Initial EUA Balance <span className="text-navy-400">(optional)</span>
                </label>
                <input
                  type="number"
                  value={euaBalance}
                  onChange={(e) => setEuaBalance(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
              >
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Market maker created successfully!</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!name.trim() || !email.trim()}
              icon={<Bot className="w-4 h-4" />}
            >
              Create Market Maker
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
