import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '../common';
import { getMarketMakers, getMarketMakerBalances } from '../../services/api';
import { formatCurrency, formatQuantity } from '../../utils';

interface MarketMaker {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  cea_balance: number;
  eua_balance: number;
}

interface MMOrderPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: {
    market_maker_id: string;
    certificate_type: 'CEA' | 'EUA';
    side: 'BID' | 'ASK';
    price: number;
    quantity: number;
  }) => Promise<void>;
  certificateType: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  prefilledPrice?: number;
}

export function MMOrderPlacementModal({
  isOpen,
  onClose,
  onSubmit,
  certificateType,
  side,
  prefilledPrice,
}: MMOrderPlacementModalProps) {
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [balances, setBalances] = useState<{ cea_balance: number; eua_balance: number } | null>(null);
  const [price, setPrice] = useState(prefilledPrice?.toString() || '');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load market makers on mount
  useEffect(() => {
    if (isOpen) {
      loadMarketMakers();
    }
  }, [isOpen]);

  // Update price when prefilled price changes
  useEffect(() => {
    if (prefilledPrice !== undefined) {
      setPrice(prefilledPrice.toString());
    }
  }, [prefilledPrice]);

  // Load balances when MM is selected
  useEffect(() => {
    if (selectedMM) {
      loadBalances(selectedMM);
    } else {
      setBalances(null);
    }
  }, [selectedMM]);

  const loadMarketMakers = async () => {
    try {
      const mms = await getMarketMakers({ is_active: true });
      setMarketMakers(mms);
    } catch (err) {
      console.error('Failed to load market makers:', err);
      setError('Failed to load market makers');
    }
  };

  const loadBalances = async (mmId: string) => {
    setLoadingBalances(true);
    try {
      const data = await getMarketMakerBalances(mmId);
      setBalances(data);
    } catch (err) {
      console.error('Failed to load balances:', err);
      setError('Failed to load balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMM) {
      setError('Please select a Market Maker');
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    // Validation
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // Balance validation for ASK orders
    if (side === 'ASK' && balances) {
      const availableBalance = certificateType === 'CEA' ? balances.cea_balance : balances.eua_balance;
      if (quantityNum > availableBalance) {
        setError(`Insufficient ${certificateType} balance. Available: ${formatQuantity(availableBalance)}`);
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        market_maker_id: selectedMM,
        certificate_type: certificateType,
        side,
        price: priceNum,
        quantity: quantityNum,
      });

      // Reset form and close
      setSelectedMM('');
      setPrice('');
      setQuantity('');
      setBalances(null);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedMM('');
      setPrice('');
      setQuantity('');
      setBalances(null);
      setError(null);
      onClose();
    }
  };

  const total = price && quantity ? parseFloat(price) * parseFloat(quantity) : 0;
  const selectedMMObj = marketMakers.find(mm => mm.id === selectedMM);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b border-navy-200 dark:border-navy-700 ${
              side === 'BID'
                ? 'bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-navy-800'
                : 'bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-navy-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {side === 'BID' ? (
                    <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                      Place {side} Order
                    </h2>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      {certificateType} • {side === 'BID' ? 'Buy' : 'Sell'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Market Maker Selection */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2">
                  Market Maker *
                </label>
                <select
                  value={selectedMM}
                  onChange={(e) => setSelectedMM(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={loading}
                >
                  <option value="">Select Market Maker</option>
                  {marketMakers.map((mm) => (
                    <option key={mm.id} value={mm.id}>
                      {mm.name} {!mm.is_active && '(Inactive)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance Display */}
              {selectedMM && (
                <div className="p-4 bg-navy-50 dark:bg-navy-900/50 rounded-lg border border-navy-200 dark:border-navy-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
                      Current Balances
                    </span>
                    {loadingBalances && (
                      <Loader2 className="w-4 h-4 text-navy-400 animate-spin" />
                    )}
                  </div>

                  {balances ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-navy-800 rounded-lg">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">CEA</div>
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatQuantity(balances.cea_balance)}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-navy-800 rounded-lg">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">EUA</div>
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatQuantity(balances.eua_balance)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-navy-500 dark:text-navy-400">
                      {selectedMMObj?.name}
                    </div>
                  )}
                </div>
              )}

              {/* Price Input */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2">
                  Price (EUR) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                  disabled={loading}
                />
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2">
                  Quantity ({certificateType}) *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                  disabled={loading}
                />
                {side === 'ASK' && balances && (
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    Available: {formatQuantity(certificateType === 'CEA' ? balances.cea_balance : balances.eua_balance)} {certificateType}
                  </p>
                )}
              </div>

              {/* Total Calculation */}
              {total > 0 && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
                      Total Cost
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    {formatQuantity(parseFloat(quantity))} {certificateType} × €{parseFloat(price).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className={`flex-1 ${
                    side === 'BID'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  loading={loading}
                  disabled={!selectedMM || !balances}
                >
                  {side === 'BID' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  Place {side} Order
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
