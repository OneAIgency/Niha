import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Check, Ticket } from 'lucide-react';
import { Button } from '../common';
import { updateMarketMaker, getMarketMakerBalances } from '../../services/api';
import { BalanceCards } from './BalanceCards';
import type { MarketMaker } from '../../types';

interface MarketMakerDetailsTabProps {
  marketMaker: MarketMaker;
  onUpdateSuccess: () => void;
}

export function MarketMakerDetailsTab({ marketMaker, onUpdateSuccess }: MarketMakerDetailsTabProps) {
  const [name, setName] = useState(marketMaker.name);
  const [description, setDescription] = useState(marketMaker.description || '');
  const [isActive, setIsActive] = useState(marketMaker.is_active);
  const [balances, setBalances] = useState({
    eur_balance: marketMaker.eur_balance,
    cea_balance: marketMaker.cea_balance,
    eua_balance: marketMaker.eua_balance,
  });
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(marketMaker.ticket_id);

  // Fetch latest balances on mount and when props change
  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketMaker.id, marketMaker.eur_balance, marketMaker.cea_balance, marketMaker.eua_balance]);

  const fetchBalances = async () => {
    setLoadingBalances(true);
    try {
      const data = await getMarketMakerBalances(marketMaker.id);
      setBalances({
        eur_balance: marketMaker.eur_balance, // EUR is direct field from props, updated when parent refreshes
        cea_balance: data.cea_balance,
        eua_balance: data.eua_balance,
      });
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      // Use existing balances as fallback
      setBalances({
        eur_balance: marketMaker.eur_balance,
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
        setSuccess(false);
        onUpdateSuccess();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update market maker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Current Balances */}
      <div>
        <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-3">
          Current Balances
        </h3>
        <BalanceCards balances={balances} loading={loadingBalances} variant="simple" />
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

      {/* Save Button */}
      <div className="flex items-center justify-end pt-4">
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
    </div>
  );
}
