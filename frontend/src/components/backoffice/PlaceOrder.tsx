import { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../common';
import { getMarketMakers, getMarketMakerBalances } from '../../services/api';
import { formatCurrency, formatQuantity } from '../../utils';
import type { CertificateType } from '../../types';

// Constants
const SUCCESS_MESSAGE_TIMEOUT = 5000; // 5 seconds

interface MarketMaker {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  cea_balance: number;
  eua_balance: number;
  mm_type?: string;
}

/**
 * Props for the PlaceOrder component
 */
interface PlaceOrderProps {
  /** Certificate type for the order (CEA or EUA) */
  certificateType: CertificateType;
  /** Order side - BID (buy) or ASK (sell) */
  side: 'BID' | 'ASK';
  /** 
   * Callback function called when order is submitted.
   * Receives order data and should handle API call.
   * Must return a Promise that resolves on success or rejects on error.
   */
  onSubmit: (order: {
    market_maker_id: string;
    certificate_type: 'CEA' | 'EUA';
    side: 'BID' | 'ASK';
    price: number;
    quantity: number;
  }) => Promise<void>;
  /** 
   * Optional callback called after successful order submission.
   * Used for UI updates like closing modals or refreshing data.
   */
  onSuccess?: () => void;
  /** Optional pre-filled price value (e.g., from order book click) */
  prefilledPrice?: number;
  /** 
   * Compact mode for modal display.
   * When true, uses tighter spacing and padding optimized for modals.
   * Default: false
   */
  compact?: boolean;
}

/**
 * PlaceOrder Component
 * 
 * A unified, reusable component for placing BID (buy) and ASK (sell) orders.
 * Adapts its behavior and UI based on the order side and context.
 * 
 * Features:
 * - Context-aware market maker filtering (CEA cash sellers for ASK, all for BID)
 * - Dynamic balance display based on order side
 * - Form validation with client-side checks
 * - Balance validation for ASK orders
 * - Accessible form with ARIA attributes
 * - Loading states for async operations
 * - Error and success message handling
 * 
 * @param props - PlaceOrderProps configuration
 * @returns JSX form element for order placement
 * 
 * @example
 * ```tsx
 * <PlaceOrder
 *   certificateType="CEA"
 *   side="ASK"
 *   onSubmit={async (order) => {
 *     await placeMarketMakerOrder(order);
 *   }}
 *   onSuccess={() => {
 *     handleOrderPlaced();
 *     closeModal();
 *   }}
 *   compact={true}
 * />
 * ```
 */
export function PlaceOrder({
  certificateType,
  side,
  onSubmit,
  onSuccess,
  prefilledPrice,
  compact = false,
}: PlaceOrderProps) {
  // Generate unique IDs for accessibility
  const errorId = useId();
  const successId = useId();
  const priceErrorId = useId();
  const quantityErrorId = useId();
  const mmErrorId = useId();

  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [balances, setBalances] = useState<{ cea_balance: number; eua_balance: number } | null>(null);
  const [price, setPrice] = useState(prefilledPrice?.toString() || '');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMMs, setLoadingMMs] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Load market makers on component mount and when side changes.
   * Filters market makers based on order side:
   * - ASK: Only CEA cash sellers with available CEA balance
   * - BID: All active market makers
   */
  useEffect(() => {
    const loadMMs = async () => {
      setLoadingMMs(true);
      try {
        const data = await getMarketMakers({ is_active: true });
        
        // Filter market makers based on side
        let filteredMMs: MarketMaker[] = [];
        if (side === 'ASK') {
          // For ASK orders, only show CEA cash sellers with available CEA balance
          filteredMMs = data.filter((mm: MarketMaker) => 
            mm.mm_type === 'CEA_CASH_SELLER' && mm.cea_balance > 0
          );
        } else {
          // For BID orders, show all active market makers
          filteredMMs = data;
        }
        
        setMarketMakers(filteredMMs);
      } catch (err) {
        console.error('Failed to load market makers:', err);
        setError('Failed to load market makers');
      } finally {
        setLoadingMMs(false);
      }
    };
    loadMMs();
  }, [side]);

  /**
   * Update price input when prefilledPrice prop changes.
   * Used when user clicks on order book price.
   */
  useEffect(() => {
    if (prefilledPrice !== undefined) {
      setPrice(prefilledPrice.toString());
    }
  }, [prefilledPrice]);

  /**
   * Load market maker balances when a market maker is selected.
   * Balances are used for validation (ASK orders) and display.
   */
  useEffect(() => {
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

    if (selectedMM) {
      loadBalances(selectedMM);
    } else {
      setBalances(null);
    }
  }, [selectedMM]);

  /**
   * Validates form inputs before submission.
   * 
   * @returns Error message string if validation fails, null if valid
   */
  const validateForm = (): string | null => {
    if (!selectedMM) {
      return 'Please select a Market Maker';
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Price must be greater than 0';
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return 'Quantity must be greater than 0';
    }

    // Balance validation for ASK orders
    if (side === 'ASK' && balances) {
      const availableBalance = certificateType === 'CEA' ? balances.cea_balance : balances.eua_balance;
      if (quantityNum > availableBalance) {
        return `Insufficient ${certificateType} balance. Available: ${formatQuantity(availableBalance)}`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    setLoading(true);
    try {
      await onSubmit({
        market_maker_id: selectedMM,
        certificate_type: certificateType,
        side,
        price: priceNum,
        quantity: quantityNum,
      });

      // Reset form
      setSelectedMM('');
      setPrice('');
      setQuantity('');
      setBalances(null);
      setSuccess('Order placed successfully!');

      // Notify parent and clear success message
      if (onSuccess) {
        onSuccess();
        // Clear success immediately when onSuccess is called to avoid conflicts
        setSuccess(null);
      } else {
        // Only show success message if no onSuccess callback
        setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_TIMEOUT);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const total = price && quantity ? parseFloat(price) * parseFloat(quantity) : 0;
  const selectedMMObj = marketMakers.find(mm => mm.id === selectedMM);
  const availableBalance = balances
    ? certificateType === 'CEA'
      ? balances.cea_balance
      : balances.eua_balance
    : 0;

  /**
   * Generates display text for market maker dropdown options.
   * Format differs based on order side:
   * - ASK: Shows name and CEA balance available
   * - BID: Shows name only (with inactive indicator if applicable)
   * 
   * @param mm - Market maker object
   * @returns Formatted display string
   */
  const getMMDisplayText = (mm: MarketMaker) => {
    if (side === 'ASK') {
      // For ASK, show CEA balance
      return `${mm.name} - ${Number(mm.cea_balance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CEA available`;
    }
    // For BID, just show name
    return `${mm.name}${!mm.is_active ? ' (Inactive)' : ''}`;
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'p-6 space-y-5' : 'space-y-4'} aria-label={`Place ${side} order form`}>
      {/* Market Maker Selection */}
      <div>
        <label 
          htmlFor="market-maker-select"
          className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 mb-2`}
        >
          Market Maker *
        </label>
        {loadingMMs ? (
          <div className="flex items-center gap-2 text-navy-500" role="status" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Loading market makers...</span>
          </div>
        ) : (
          <select
            id="market-maker-select"
            value={selectedMM}
            onChange={(e) => setSelectedMM(e.target.value)}
            className={`w-full ${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 ${compact ? 'bg-white dark:bg-navy-900' : 'bg-white dark:bg-navy-800'} text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
            disabled={loading}
            aria-required="true"
            aria-invalid={error?.includes('Market Maker') ? 'true' : 'false'}
            aria-describedby={error?.includes('Market Maker') ? mmErrorId : undefined}
            aria-busy={loadingMMs}
          >
            <option value="">{side === 'ASK' ? 'Select a market maker' : 'Select Market Maker'}</option>
            {marketMakers.map((mm) => (
              <option key={mm.id} value={mm.id}>
                {getMMDisplayText(mm)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Balance Display */}
      {selectedMM && (
        <div 
          className={`${compact ? 'p-4' : 'p-4'} bg-navy-50 dark:bg-navy-900/50 rounded-lg border border-navy-200 dark:border-navy-700`}
          aria-live="polite"
          aria-busy={loadingBalances}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
              Current Balances
            </span>
            {loadingBalances && (
              <Loader2 className="w-4 h-4 text-navy-400 animate-spin" aria-label="Loading balances" />
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

      {/* Available Balance for ASK orders */}
      {side === 'ASK' && selectedMMObj && balances && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${compact ? 'p-2.5' : 'p-4'} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Available {certificateType} Balance
            </span>
            <span className={`${compact ? 'text-base' : 'text-lg'} font-bold font-mono text-emerald-900 dark:text-emerald-100`}>
              {availableBalance.toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}

      {/* Certificate Type (Read-only) */}
      <div>
        <label 
          htmlFor="certificate-type-display"
          className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 mb-2`}
        >
          Certificate Type
        </label>
        <div 
          id="certificate-type-display"
          role="textbox"
          aria-readonly="true"
          className={`${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 bg-navy-50 dark:bg-navy-700/50 text-navy-900 dark:text-white font-semibold`}
        >
          {certificateType}
        </div>
      </div>

      {/* Price Input */}
      <div>
        <label 
          htmlFor="price-input"
          className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 mb-2`}
        >
          Price (EUR) *
        </label>
        <input
          id="price-input"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className={`w-full ${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 ${compact ? 'bg-white dark:bg-navy-900' : 'bg-white dark:bg-navy-800'} text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono`}
          required
          disabled={loading}
          aria-required="true"
          aria-invalid={error?.includes('Price') ? 'true' : 'false'}
          aria-describedby={error?.includes('Price') ? priceErrorId : undefined}
          aria-busy={loading}
        />
      </div>

      {/* Quantity Input */}
      <div>
        <label 
          htmlFor="quantity-input"
          className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 mb-2`}
        >
          Quantity ({certificateType}) *
        </label>
        <input
          id="quantity-input"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          step="1"
          min="0"
          className={`w-full ${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 ${compact ? 'bg-white dark:bg-navy-900' : 'bg-white dark:bg-navy-800'} text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono`}
          required
          disabled={loading}
          aria-required="true"
          aria-invalid={error && (error.includes('Quantity') || error.includes('balance')) ? 'true' : 'false'}
          aria-describedby={error && (error.includes('Quantity') || error.includes('balance')) ? quantityErrorId : undefined}
          aria-busy={loading}
        />
        {side === 'ASK' && balances && (
          <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
            Available: {formatQuantity(certificateType === 'CEA' ? balances.cea_balance : balances.eua_balance)} {certificateType}
          </p>
        )}
      </div>

      {/* Total Calculation */}
      {total > 0 && (
        <div className={`${compact ? 'p-4' : 'p-4'} bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800`}>
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
        <div 
          id={errorId}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className={`${compact ? 'p-4' : 'p-3'} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2`}
        >
          <AlertCircle className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5`} aria-hidden="true" />
          <p className={`${compact ? 'text-sm' : 'text-sm'} text-red-700 dark:text-red-400`}>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div 
          id={successId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`${compact ? 'p-4' : 'p-3'} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400`}
        >
          <CheckCircle className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} aria-hidden="true" />
          <span className={`${compact ? 'text-sm' : 'text-sm'}`}>{success}</span>
        </div>
      )}

      {/* Action Buttons */}
      {compact && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => {
              setSelectedMM('');
              setPrice('');
              setQuantity('');
              setBalances(null);
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            aria-label="Cancel order placement"
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
            aria-busy={loading}
            aria-describedby={error ? errorId : undefined}
          >
            Place {side} Order
          </Button>
        </div>
      )}

      {!compact && (
        <Button
          type="submit"
          variant="primary"
          className={`w-full ${
            side === 'BID'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-red-500 hover:bg-red-600'
          }`}
          loading={loading}
          disabled={!selectedMM || loading}
          aria-busy={loading}
          aria-describedby={error ? errorId : undefined}
        >
          Place {side === 'BID' ? 'Buy' : 'Sell'} Order
        </Button>
      )}
    </form>
  );
}
