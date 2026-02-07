import { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Info } from 'lucide-react';
import { Button, NumberInput, AlertBanner } from '../common';
import { getMarketMakers, getMarketMakerBalances, feesApi } from '../../services/api';
import { formatCurrency, formatQuantity } from '../../utils';
import type { CertificateType } from '../../types';

// Default fee rate if not configured (0.5%)
const DEFAULT_FEE_RATE = 0.005;

// Constants
const SUCCESS_MESSAGE_TIMEOUT = 5000; // 5 seconds

interface MarketMaker {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  eurBalance: number;
  ceaBalance: number;
  euaBalance: number;
  mmType?: string;
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
  /** Optional pre-filled price value (e.g., from order book click or best price) */
  prefilledPrice?: number;
  /** Optional pre-filled quantity value (e.g., volume at best price) */
  prefilledQuantity?: number;
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
  prefilledQuantity,
  compact = false,
}: PlaceOrderProps) {
  // Generate unique IDs for accessibility
  const errorId = useId();
  const successId = useId();
  const mmErrorId = useId();

  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [balances, setBalances] = useState<{
    ceaBalance: number;
    euaBalance: number;
    eurBalance: number;
    ceaAvailable: number;
    euaAvailable: number;
    eurAvailable: number;
  } | null>(null);
  const [price, setPrice] = useState(prefilledPrice?.toString() || '');
  const [quantity, setQuantity] = useState(prefilledQuantity?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [loadingMMs, setLoadingMMs] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeRate, setFeeRate] = useState<number>(DEFAULT_FEE_RATE);
  const [loadingFee, setLoadingFee] = useState(false);

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
        
        // Filter market makers based on certificate type and order side
        // CEA Cash market:
        //   - ASK (sell CEA): only CEA_SELLER (they have CEA to sell)
        //   - BID (buy CEA): only CEA_BUYER (they have EUR to buy)
        // Swap market (EUA):
        //   - ASK (sell EUA): only EUA_OFFER (they have EUA)
        //   - BID (buy EUA): only EUA_OFFER (they have CEA to exchange)
        let filteredMMs: MarketMaker[] = [];
        if (certificateType === 'CEA') {
          // CEA Cash market
          if (side === 'ASK') {
            // Selling CEA - need CEA_SELLER with CEA balance
            filteredMMs = data.filter((mm: MarketMaker) =>
              mm.mmType === 'CEA_SELLER' && mm.ceaBalance > 0
            );
          } else {
            // Buying CEA - need CEA_BUYER with EUR balance
            filteredMMs = data.filter((mm: MarketMaker) =>
              mm.mmType === 'CEA_BUYER' && mm.eurBalance > 0
            );
          }
        } else {
          // Swap market (EUA)
          // Only EUA_OFFER can trade EUA
          if (side === 'ASK') {
            // Selling EUA - need EUA_OFFER with EUA balance
            filteredMMs = data.filter((mm: MarketMaker) =>
              mm.mmType === 'EUA_OFFER' && mm.euaBalance > 0
            );
          } else {
            // Buying EUA - need EUA_OFFER with CEA to exchange
            filteredMMs = data.filter((mm: MarketMaker) =>
              mm.mmType === 'EUA_OFFER' && mm.ceaBalance > 0
            );
          }
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
  }, [side, certificateType]);

  /**
   * Update price input when prefilledPrice prop changes.
   * Used when user clicks on order book price or when modal opens with best price.
   */
  useEffect(() => {
    if (prefilledPrice !== undefined) {
      setPrice(prefilledPrice.toString());
    }
  }, [prefilledPrice]);

  /**
   * Update quantity input when prefilledQuantity prop changes.
   * Used when modal opens with best quantity from orderbook.
   */
  useEffect(() => {
    if (prefilledQuantity !== undefined) {
      setQuantity(prefilledQuantity.toString());
    }
  }, [prefilledQuantity]);

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
   * Load effective fee rate for the current market and side.
   * Fee rates can be configured per market (CEA_CASH or SWAP).
   */
  useEffect(() => {
    const loadFeeRate = async () => {
      setLoadingFee(true);
      try {
        // Determine market type based on certificate type
        const market = certificateType === 'CEA' ? 'CEA_CASH' : 'SWAP';
        const response = await feesApi.getEffectiveFee(market, side);
        // Ensure feeRate is a valid number, otherwise use default
        const rate = typeof response.feeRate === 'number' && !isNaN(response.feeRate)
          ? response.feeRate
          : DEFAULT_FEE_RATE;
        setFeeRate(rate);
      } catch (err) {
        console.error('Failed to load fee rate:', err);
        // Use default fee rate if API call fails
        setFeeRate(DEFAULT_FEE_RATE);
      } finally {
        setLoadingFee(false);
      }
    };

    loadFeeRate();
  }, [certificateType, side]);

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

    // Balance validation for ASK orders (selling certificates)
    // Use available balance (total - locked by pending orders)
    if (side === 'ASK' && balances) {
      const availableBalance = certificateType === 'CEA' ? balances.ceaAvailable : balances.euaAvailable;
      if (quantityNum > availableBalance) {
        return `Insufficient ${certificateType} balance. Available: ${formatQuantity(availableBalance)}`;
      }
    }

    // Balance validation for BID orders (buying - need EUR)
    // Use available EUR (total - locked by pending BID orders)
    if (side === 'BID' && balances) {
      const totalCost = priceNum * quantityNum;
      if (totalCost > balances.eurAvailable) {
        return `Insufficient EUR balance. Need: ${formatCurrency(totalCost)}, Available: ${formatCurrency(balances.eurAvailable)}`;
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
  // Use available balance (not total) for display
  const availableBalance = balances
    ? certificateType === 'CEA'
      ? balances.ceaAvailable
      : balances.euaAvailable
    : 0;

  /**
   * Generates display text for market maker dropdown options.
   * Shows MM name only - detailed balances shown after selection.
   * Note: We don't show EUR balance in dropdown because it shows total,
   * not available (which requires a separate API call after selection).
   *
   * @param mm - Market maker object
   * @returns Formatted display string
   */
  const getMMDisplayText = (mm: MarketMaker) => {
    // Just show the name - available balances are shown in Current Balances section after selection
    return mm.name;
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
            className="w-full form-select"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-white dark:bg-navy-800 rounded-lg min-w-0 overflow-hidden">
                <div className="text-[10px] text-navy-500 dark:text-navy-400 mb-1 truncate">EUR (Available)</div>
                <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 truncate">
                  {formatCurrency(balances.eurAvailable)}
                </div>
                {balances.eurBalance !== balances.eurAvailable && (
                  <div className="text-[9px] text-navy-400 mt-0.5 truncate">
                    Total: {formatCurrency(balances.eurBalance)}
                  </div>
                )}
              </div>
              <div className="p-2 bg-white dark:bg-navy-800 rounded-lg min-w-0 overflow-hidden">
                <div className="text-[10px] text-navy-500 dark:text-navy-400 mb-1 truncate">CEA (Available)</div>
                <div className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 truncate">
                  {formatQuantity(balances.ceaAvailable)}
                </div>
                {balances.ceaBalance !== balances.ceaAvailable && (
                  <div className="text-[9px] text-navy-400 mt-0.5 truncate">
                    Total: {formatQuantity(balances.ceaBalance)}
                  </div>
                )}
              </div>
              <div className="p-2 bg-white dark:bg-navy-800 rounded-lg min-w-0 overflow-hidden">
                <div className="text-[10px] text-navy-500 dark:text-navy-400 mb-1 truncate">EUA (Available)</div>
                <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 truncate">
                  {formatQuantity(balances.euaAvailable)}
                </div>
                {balances.euaBalance !== balances.euaAvailable && (
                  <div className="text-[9px] text-navy-400 mt-0.5 truncate">
                    Total: {formatQuantity(balances.euaBalance)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-navy-500 dark:text-navy-400">
              {selectedMMObj?.name}
            </div>
          )}
        </div>
      )}

      {/* Available Balance for ASK orders (selling certificates) */}
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

      {/* Available EUR for BID orders (buying - need cash) */}
      {side === 'BID' && selectedMMObj && balances && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${compact ? 'p-2.5' : 'p-4'} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Available EUR Balance
            </span>
            <span className={`${compact ? 'text-base' : 'text-lg'} font-bold font-mono text-emerald-900 dark:text-emerald-100`}>
              {formatCurrency(balances.eurAvailable)}
            </span>
          </div>
          {balances.eurBalance !== balances.eurAvailable && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(balances.eurBalance - balances.eurAvailable)} locked in pending orders
            </div>
          )}
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
        <NumberInput
          id="price-input"
          label="Price (EUR) *"
          value={price}
          onChange={setPrice}
          placeholder="0.0"
          suffix="EUR"
          decimals={2}
          disabled={loading}
          error={error?.includes('Price') ? error : undefined}
        />
      </div>

      {/* Quantity Input */}
      <div>
        <NumberInput
          id="quantity-input"
          label={`Quantity (${certificateType}) *`}
          value={quantity}
          onChange={setQuantity}
          placeholder="0"
          suffix={certificateType}
          decimals={0}
          disabled={loading}
          error={error && (error.includes('Quantity') || error.includes('balance')) ? error : undefined}
        />
        {side === 'ASK' && balances && (
          <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
            Available: {formatQuantity(certificateType === 'CEA' ? balances.ceaAvailable : balances.euaAvailable)} {certificateType}
          </p>
        )}
      </div>

      {/* Total Calculation with Fee */}
      {total > 0 && (
        <div className={`${compact ? 'p-4' : 'p-4'} bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3`}>
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600 dark:text-navy-400">
              Subtotal
            </span>
            <span className="font-mono text-navy-700 dark:text-navy-300">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Fee */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600 dark:text-navy-400 flex items-center gap-1">
              Platform Fee
              <span className="text-xs text-navy-400">({(feeRate * 100).toFixed(2)}%)</span>
              {loadingFee && <Loader2 className="w-3 h-3 animate-spin" />}
            </span>
            <span className="font-mono text-navy-700 dark:text-navy-300">
              {formatCurrency(total * feeRate)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-emerald-300 dark:border-emerald-700" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
              Total {side === 'BID' ? 'Cost' : 'Proceeds'}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(side === 'BID' ? total * (1 + feeRate) : total * (1 - feeRate))}
            </span>
          </div>

          {/* Breakdown */}
          <p className="text-xs text-navy-500 dark:text-navy-400">
            {formatQuantity(parseFloat(quantity))} {certificateType} × €{parseFloat(price).toFixed(2)}
          </p>

          {/* Fee Info */}
          <div className="flex items-start gap-1.5 text-xs text-navy-500 dark:text-navy-400">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {side === 'BID'
                ? 'Buyer pays the platform fee on purchase'
                : 'Seller pays the platform fee, deducted from proceeds'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <AlertBanner variant="error" message={error} />
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
