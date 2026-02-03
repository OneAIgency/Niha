import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Check } from 'lucide-react';
import { AlertBanner, Button } from '../common';
import { createMarketMaker, getMarketMakers } from '../../services/api';
import { usePrices } from '../../hooks/usePrices';
import { MarketType, MarketMakerType, MARKET_MAKER_TYPES } from '../../types';

interface CreateMarketMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentMMCount: number;
}

export function CreateMarketMakerModal({ isOpen, onClose, onSuccess, currentMMCount }: CreateMarketMakerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [market, setMarket] = useState<MarketType>('CEA_CASH');
  const [mmType, setMmType] = useState<MarketMakerType>('CEA_BUYER');
  const [eurBalance, setEurBalance] = useState('');
  const [ceaBalance, setCeaBalance] = useState('');
  const [euaBalance, setEuaBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get current prices for EUR calculation
  const { prices } = usePrices();

  // Helper function to generate email from name
  const generateEmailFromName = (name: string): string => {
    if (!name.trim()) return '';

    // Sanitize: lowercase, replace spaces and special characters with hyphens
    const sanitized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens

    return `${sanitized}@marketmaker.niha.internal`;
  };

  // Auto-generate email when name changes
  useEffect(() => {
    if (name.trim()) {
      setEmail(generateEmailFromName(name));
    } else {
      setEmail('');
    }
  }, [name]);

  // Auto-populate name when modal opens
  // Fetch latest count to avoid race conditions
  useEffect(() => {
    const fetchLatestCount = async () => {
      if (isOpen) {
        try {
          const mms = await getMarketMakers();
          const nextNumber = mms.length + 1;
          setName(`mm${nextNumber}`);
        } catch (err) {
          console.error('Failed to fetch MM count:', err);
          // Fallback to prop-based count
          const nextNumber = currentMMCount + 1;
          setName(`mm${nextNumber}`);
        }
      }
    };

    fetchLatestCount();
  }, [isOpen, currentMMCount]);

  // Calculate EUR value for balance inputs
  const calculateEurValue = (balance: string, certificateType: 'CEA' | 'EUA'): number | null => {
    if (!prices) return null;

    const amount = parseFloat(balance) || 0;
    if (amount === 0) return null;

    if (certificateType === 'CEA') {
      // Use backend-provided EUR price for CEA
      const ceaPriceEur = prices.cea?.priceEur || 0;
      if (ceaPriceEur === 0) return null;
      return amount * ceaPriceEur;
    } else {
      // EUA price is already in EUR
      const euaPriceEur = prices.eua?.price || 0;
      if (euaPriceEur === 0) return null;
      return amount * euaPriceEur;
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Type-specific validation
    if (mmType === 'CEA_BUYER') {
      if (!eurBalance || parseFloat(eurBalance) <= 0 || isNaN(parseFloat(eurBalance))) {
        setError('Cash Buyer must have a positive EUR balance');
        return;
      }
      // Ensure CEA_BUYER doesn't have CEA/EUA (business rule enforcement)
      if ((ceaBalance && parseFloat(ceaBalance) > 0) || (euaBalance && parseFloat(euaBalance) > 0)) {
        setError('Cash Buyer cannot have CEA/EUA balances');
        return;
      }
    } else if (mmType === 'CEA_SELLER') {
      if (!ceaBalance || parseFloat(ceaBalance) <= 0 || isNaN(parseFloat(ceaBalance))) {
        setError('CEA Cash Seller must have a positive CEA balance');
        return;
      }
      // Ensure CEA_SELLER doesn't have EUR or EUA (business rule enforcement)
      if ((eurBalance && parseFloat(eurBalance) > 0) || (euaBalance && parseFloat(euaBalance) > 0)) {
        setError('CEA Cash Seller cannot have EUR or EUA balances');
        return;
      }
    } else if (mmType === 'EUA_OFFER') {
      if (!ceaBalance && !euaBalance) {
        setError('Swap Maker must have at least one certificate balance (CEA or EUA)');
        return;
      }
      // Ensure EUA_OFFER doesn't have EUR (business rule enforcement)
      if (eurBalance && parseFloat(eurBalance) > 0) {
        setError('Swap Maker cannot have EUR balance');
        return;
      }
    }

    setLoading(true);

    try {
      await createMarketMaker({
        name: name.trim(),
        email: email.trim(),
        description: description.trim() || undefined,
        mm_type: mmType,
        initial_eur_balance: mmType === 'CEA_BUYER' && eurBalance ? parseFloat(eurBalance) : undefined,
        cea_balance: (mmType === 'CEA_SELLER' || mmType === 'EUA_OFFER') && ceaBalance ? parseFloat(ceaBalance) : undefined,
        eua_balance: mmType === 'EUA_OFFER' && euaBalance ? parseFloat(euaBalance) : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setDescription('');
        setMarket('CEA_CASH');
        setMmType('CEA_BUYER');
        setEurBalance('');
        setCeaBalance('');
        setEuaBalance('');
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create market maker');
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
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="market-maker@marketmaker.niha.internal"
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                Auto-generated from name. You can edit if needed.
              </p>
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
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Market Selection */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Market *
              </label>
              <select
                value={market}
                onChange={(e) => {
                  const newMarket = e.target.value as MarketType;
                  setMarket(newMarket);
                  // Auto-select first available type for market
                  if (newMarket === 'CEA_CASH') {
                    setMmType('CEA_BUYER');
                  } else {
                    setMmType('EUA_OFFER');
                  }
                  // Clear all balances
                  setEurBalance('');
                  setCeaBalance('');
                  setEuaBalance('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CEA_CASH">CEA Cash (Trade CEA with EUR)</option>
                <option value="SWAP">Swap (Exchange CEA↔EUA)</option>
              </select>
            </div>

            {/* Market Maker Role */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Market Maker Role *
              </label>
              <select
                value={mmType}
                onChange={(e) => {
                  const newType = e.target.value as MarketMakerType;
                  setMmType(newType);
                  // Clear balances
                  setEurBalance('');
                  setCeaBalance('');
                  setEuaBalance('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {market === 'CEA_CASH' ? (
                  <>
                    <option value="CEA_BUYER">CEA Buyer (Buys CEA with EUR)</option>
                    <option value="CEA_SELLER">CEA Seller (Sells CEA for EUR)</option>
                  </>
                ) : (
                  <option value="EUA_OFFER">EUA Offer (Offers EUA for swaps)</option>
                )}
              </select>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                {MARKET_MAKER_TYPES[mmType].description}
              </p>
            </div>

            {/* Conditional Balance Inputs */}
            {mmType === 'CEA_BUYER' ? (
              // EUR Balance for Cash Buyer
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Initial EUR Balance *
                </label>
                <input
                  type="number"
                  value={eurBalance}
                  onChange={(e) => setEurBalance(e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                  EUR balance for placing buy orders
                </p>
              </div>
            ) : mmType === 'CEA_SELLER' ? (
              // CEA Balance only for CEA Cash Seller
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Initial CEA Balance *
                </label>
                <input
                  type="number"
                  value={ceaBalance}
                  onChange={(e) => setCeaBalance(e.target.value)}
                  placeholder="1000"
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {ceaBalance && calculateEurValue(ceaBalance, 'CEA') !== null && (
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    ≈ €{calculateEurValue(ceaBalance, 'CEA')!.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} EUR
                  </p>
                )}
              </div>
            ) : (
              // CEA/EUA Balances for Swap Maker
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
                  {ceaBalance && calculateEurValue(ceaBalance, 'CEA') !== null && (
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      ≈ €{calculateEurValue(ceaBalance, 'CEA')!.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} EUR
                    </p>
                  )}
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
                  {euaBalance && calculateEurValue(euaBalance, 'EUA') !== null && (
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      ≈ €{calculateEurValue(euaBalance, 'EUA')!.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} EUR
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <AlertBanner variant="error" message={error} />
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
              disabled={!name.trim()}
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
