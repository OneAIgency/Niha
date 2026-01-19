import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Check, Leaf, Wind, Ticket } from 'lucide-react';
import { Button, Badge } from '../common';
import { updateMarketMaker, getMarketMakerBalances } from '../../services/api';
import { formatQuantity } from '../../utils';

interface MarketMaker {
  id: string;
  name: string;
  email: string;
  description?: string;
  is_active: boolean;
  cea_balance: number;
  eua_balance: number;
  total_orders: number;
  created_at: string;
  ticket_id?: string;
}

interface EditMarketMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  marketMaker: MarketMaker;
}

interface Balances {
  cea_balance: number;
  eua_balance: number;
}

export function EditMarketMakerModal({ isOpen, onClose, onSuccess, marketMaker }: EditMarketMakerModalProps) {
  const [name, setName] = useState(marketMaker.name);
  const [description, setDescription] = useState(marketMaker.description || '');
  const [isActive, setIsActive] = useState(marketMaker.is_active);
  const [balances, setBalances] = useState<Balances>({
    cea_balance: marketMaker.cea_balance,
    eua_balance: marketMaker.eua_balance,
  });
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(marketMaker.ticket_id);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setName(marketMaker.name);
      setDescription(marketMaker.description || '');
      setIsActive(marketMaker.is_active);
      setError(null);
      setSuccess(false);
      setTicketId(marketMaker.ticket_id);
      // Fetch latest balances
      fetchBalances();
    }
  }, [isOpen, marketMaker]);

  const fetchBalances = async () => {
    setLoadingBalances(true);
    try {
      const data = await getMarketMakerBalances(marketMaker.id);
      setBalances({
        cea_balance: data.cea_balance,
        eua_balance: data.eua_balance,
      });
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      // Use existing balances as fallback
      setBalances({
        cea_balance: marketMaker.cea_balance,
        eua_balance: marketMaker.eua_balance,
      });
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);

    try {
      const response = await updateMarketMaker(marketMaker.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
      });

      // Update ticket_id if returned
      if (response.ticket_id) {
        setTicketId(response.ticket_id);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update market maker');
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
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
            <div>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                Edit Market Maker
              </h2>
              <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                {marketMaker.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Balances - Read Only */}
            <div>
              <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-3">
                Current Balances
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                    <Leaf className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">CEA Balance</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                    {loadingBalances ? '...' : formatQuantity(balances.cea_balance)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">EUA Balance</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
                    {loadingBalances ? '...' : formatQuantity(balances.eua_balance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Email - Read Only */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={marketMaker.email}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/50 text-navy-500 dark:text-navy-400 cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy-50 dark:bg-navy-900/50">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300">
                  Active Status
                </label>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  When inactive, the market maker will not execute trades
                </p>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-emerald-500' : 'bg-navy-300 dark:bg-navy-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Ticket ID Display */}
            {ticketId && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm font-medium">Ticket ID:</span>
                  <code className="text-xs bg-white dark:bg-navy-900 px-2 py-1 rounded font-mono">
                    {ticketId}
                  </code>
                </div>
              </div>
            )}

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
                <span className="text-sm font-medium">Market maker updated successfully!</span>
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
              disabled={!name.trim()}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
