import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../common';
import { formatCurrency, formatQuantity } from '../../utils';
import type { CertificateType } from '../../types';

// Generic order interface that works with both MarketMakerOrder and AllOrder
interface EditableOrder {
  id: string;
  entityId?: string;
  entityName?: string;
  marketMakerId?: string;
  marketMakerName?: string;
  certificateType: CertificateType;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  ticketId?: string;
  orderType?: 'entity' | 'market_maker';
}

interface EditOrderModalProps {
  /** The order to edit */
  order: EditableOrder | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called to update order - returns promise */
  onUpdate: (orderId: string, update: { price?: number; quantity?: number }) => Promise<void>;
  /** Called to cancel order - returns promise */
  onCancel: (orderId: string) => Promise<void>;
  /** Called after successful update or cancel */
  onSuccess?: () => void;
}

/**
 * Modal for editing or cancelling a Market Maker order.
 * Allows modification of price and quantity, or full cancellation.
 */
export function EditOrderModal({
  order,
  isOpen,
  onClose,
  onUpdate,
  onCancel,
  onSuccess,
}: EditOrderModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const errorId = useId();
  const successId = useId();

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      setPrice(order.price?.toString() ?? '');
      setQuantity(order.remainingQuantity?.toString() ?? '');
      setError(null);
      setSuccess(null);
      setConfirmCancel(false);
    }
  }, [order]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !cancelling) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, cancelling, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(el.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((el) => !el.hasAttribute('disabled') && el.offsetParent != null);
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = Array.from(el.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent != null);
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      if (e.shiftKey) {
        if (i === 0) {
          e.preventDefault();
          list[list.length - 1]?.focus();
        }
      } else {
        if (i === list.length - 1) {
          e.preventDefault();
          list[0]?.focus();
        }
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!loading && !cancelling) {
      onClose();
    }
  }, [loading, cancelling, onClose]);

  const validateForm = (): string | null => {
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Price must be greater than 0';
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return 'Quantity must be greater than 0';
    }

    if (order && order.remainingQuantity != null && quantityNum > order.remainingQuantity) {
      return `Quantity cannot exceed remaining quantity (${formatQuantity(order.remainingQuantity)})`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    // Only send changed values
    const update: { price?: number; quantity?: number } = {};
    if (priceNum !== order.price) {
      update.price = priceNum;
    }
    if (order.remainingQuantity != null && quantityNum !== order.remainingQuantity) {
      update.quantity = quantityNum;
    }

    if (Object.keys(update).length === 0) {
      setError('No changes to save');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(order.id, update);
      setSuccess('Order updated successfully');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setError(null);
    setSuccess(null);
    setCancelling(true);

    try {
      await onCancel(order.id);
      setSuccess('Order cancelled successfully');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to cancel order');
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  if (!order) return null;

  const total = price && quantity ? parseFloat(price) * parseFloat(quantity) : 0;
  const sideColor = order.side === 'BUY' ? 'emerald' : 'red';
  const sideLabel = order.side === 'BUY' ? 'BID' : 'ASK';

  // Get display name for order owner (market maker or entity)
  const ownerName = order.marketMakerName || order.entityName || 'Unknown';
  const ownerType = order.orderType === 'market_maker' || order.marketMakerId ? 'Market Maker' : 'Entity';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
          aria-hidden="true"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-navy-200 dark:border-navy-700 bg-gradient-to-r from-navy-50 to-white dark:from-navy-900/20 dark:to-navy-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${sideColor}-500`} />
                  <div>
                    <h2 id="edit-order-title" className="text-xl font-bold text-navy-900 dark:text-white">
                      Edit {sideLabel} Order
                    </h2>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      {order.certificateType} • {ownerType}: {ownerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading || cancelling}
                  className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-navy-500" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Order Info */}
              <div className="p-4 bg-navy-50 dark:bg-navy-900/50 rounded-lg border border-navy-200 dark:border-navy-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Order ID</span>
                    <p className="font-mono text-navy-900 dark:text-white truncate" title={order.id ?? ''}>
                      {order.id?.slice(0, 8) ?? ''}...
                    </p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Status</span>
                    <p className="font-semibold text-navy-900 dark:text-white">{order.status}</p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Original Qty</span>
                    <p className="font-mono text-navy-900 dark:text-white">
                      {formatQuantity(order.quantity ?? 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Filled Qty</span>
                    <p className="font-mono text-navy-900 dark:text-white">
                      {formatQuantity(order.filledQuantity ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Price Input */}
                <div>
                  <label
                    htmlFor="edit-price-input"
                    className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2"
                  >
                    Price (EUR)
                  </label>
                  <input
                    id="edit-price-input"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                    disabled={loading || cancelling}
                  />
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    Original: {formatCurrency(order.price ?? 0)}
                  </p>
                </div>

                {/* Quantity Input */}
                <div>
                  <label
                    htmlFor="edit-quantity-input"
                    className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2"
                  >
                    Remaining Quantity ({order.certificateType})
                  </label>
                  <input
                    id="edit-quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    step="1"
                    min="1"
                    max={order.remainingQuantity ?? undefined}
                    className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                    disabled={loading || cancelling}
                  />
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    Max: {formatQuantity(order.remainingQuantity ?? 0)} (remaining)
                  </p>
                </div>

                {/* Total */}
                {total > 0 && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
                        Total Value
                      </span>
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      {formatQuantity(parseFloat(quantity) || 0)} {order.certificateType} × {formatCurrency(parseFloat(price) || 0)}
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div
                    id={errorId}
                    role="alert"
                    aria-live="assertive"
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Success Display */}
                {success && (
                  <div
                    id={successId}
                    role="status"
                    aria-live="polite"
                    className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">{success}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {/* Cancel Order Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelOrder}
                    disabled={loading || cancelling}
                    className={confirmCancel ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                    icon={cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  >
                    {cancelling ? 'Cancelling...' : confirmCancel ? 'Confirm Cancel' : 'Cancel Order'}
                  </Button>

                  {/* Save Changes Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    loading={loading}
                    disabled={loading || cancelling}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
