import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingDown, TrendingUp, X, List } from 'lucide-react';
import { Button } from '../components/common';
import { AdminOrderBookSection, type OrderBookData } from '../components/backoffice/AdminOrderBookSection';
import { PlaceOrder } from '../components/backoffice/PlaceOrder';
import { EditOrderModal } from '../components/backoffice/EditOrderModal';
import { IndividualOrdersTable } from '../components/backoffice/IndividualOrdersTable';
import { BackofficeLayout } from '../components/layout';
import { placeMarketMakerOrder, cancelMarketMakerOrder, backofficeApi } from '../services/api';
import type { CertificateType } from '../types';

// Extended order type that includes both entity and market maker orders
interface AllOrder {
  id: string;
  entity_id?: string;
  entity_name?: string;
  market_maker_id?: string;
  market_maker_name?: string;
  certificate_type: CertificateType;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  filled_quantity: number;
  remaining_quantity: number;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
  ticket_id?: string;
  order_type: 'entity' | 'market_maker';
}
import { cn } from '../utils';

const REFRESH_TIMEOUT_MS = 500;
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type MarketOrder = {
  market_maker_id: string;
  certificate_type: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent != null
  );
}

export function MarketOrdersPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidPrefilledPrice, setBidPrefilledPrice] = useState<number | undefined>(undefined);
  const [askPrefilledPrice, setAskPrefilledPrice] = useState<number | undefined>(undefined);
  const [bidPrefilledQuantity, setBidPrefilledQuantity] = useState<number | undefined>(undefined);
  const [askPrefilledQuantity, setAskPrefilledQuantity] = useState<number | undefined>(undefined);
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'aggregated' | 'individual'>('aggregated');
  const [editingOrder, setEditingOrder] = useState<AllOrder | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const askDialogRef = useRef<HTMLDivElement>(null);
  const bidDialogRef = useRef<HTMLDivElement>(null);

  const handleOrderPlaced = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setRefreshing(false), REFRESH_TIMEOUT_MS);
  };

  const closeAsk = useCallback(() => {
    setAskModalOpen(false);
    setAskPrefilledPrice(undefined);
    setAskPrefilledQuantity(undefined);
  }, []);

  const closeBid = useCallback(() => {
    setBidModalOpen(false);
    setBidPrefilledPrice(undefined);
    setBidPrefilledQuantity(undefined);
  }, []);

  /**
   * Open ASK modal with best ask price and quantity auto-filled
   */
  const handlePlaceAsk = () => {
    // Auto-fill with best ask price and quantity from orderbook
    if (orderBookData?.best_ask) {
      setAskPrefilledPrice(orderBookData.best_ask);
      setAskPrefilledQuantity(orderBookData.ask_quantity_at_best);
    } else {
      setAskPrefilledPrice(undefined);
      setAskPrefilledQuantity(undefined);
    }
    setAskModalOpen(true);
  };

  /**
   * Open BID modal with best bid price and quantity auto-filled
   */
  const handlePlaceBid = () => {
    // Auto-fill with best bid price and quantity from orderbook
    if (orderBookData?.best_bid) {
      setBidPrefilledPrice(orderBookData.best_bid);
      setBidPrefilledQuantity(orderBookData.bid_quantity_at_best);
    } else {
      setBidPrefilledPrice(undefined);
      setBidPrefilledQuantity(undefined);
    }
    setBidModalOpen(true);
  };

  /**
   * Order book price click: bid row (BUY) → place ASK (sell into it); ask row (SELL) → place BID (buy from it).
   * Prefilled price is set so the modal opens with the clicked price.
   * Quantity is NOT auto-filled when clicking a specific price (user clicked intentionally).
   */
  const handlePriceClick = (price: number, side: 'BUY' | 'SELL') => {
    if (side === 'BUY') {
      setAskPrefilledPrice(price);
      setAskPrefilledQuantity(undefined); // Don't auto-fill quantity on price click
      setAskModalOpen(true);
    } else {
      setBidPrefilledPrice(price);
      setBidPrefilledQuantity(undefined); // Don't auto-fill quantity on price click
      setBidModalOpen(true);
    }
  };

  /**
   * Callback to receive orderbook data for auto-fill
   */
  const handleOrderBookData = useCallback((data: OrderBookData) => {
    setOrderBookData(data);
  }, []);

  /** API-only submit. PlaceOrder handles errors; onSuccess handles refresh + close. */
  const handleOrderSubmit = async (order: MarketOrder) => {
    setSubmitting(true);
    try {
      await placeMarketMakerOrder(order);
    } catch (e) {
      console.error('Failed to place order:', e);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  /** Single path: refresh order book and close modal. Called by PlaceOrder onSuccess only. */
  const handleSuccessAndCloseAsk = () => {
    handleOrderPlaced();
    closeAsk();
  };

  const handleSuccessAndCloseBid = () => {
    handleOrderPlaced();
    closeBid();
  };

  /**
   * Handle clicking on an individual order to edit it
   */
  const handleEditOrder = (order: AllOrder) => {
    setEditingOrder(order);
    setEditModalOpen(true);
  };

  /**
   * Close edit modal
   */
  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingOrder(null);
  }, []);

  /**
   * Update order via API
   */
  const handleUpdateOrder = async (orderId: string, update: { price?: number; quantity?: number }) => {
    await backofficeApi.adminUpdateOrder(orderId, update);
  };

  /**
   * Cancel order via API
   */
  const handleCancelOrder = async (orderId: string) => {
    await cancelMarketMakerOrder(orderId);
  };

  /**
   * Called after successful edit/cancel
   */
  const handleEditSuccess = () => {
    handleOrderPlaced(); // Refresh both views
  };

  // Escape key: close whichever modal is open
  useEffect(() => {
    if (!askModalOpen && !bidModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (askModalOpen) closeAsk();
      else closeBid();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [askModalOpen, bidModalOpen, closeAsk, closeBid]);

  // Focus first focusable when modal opens; focus trap (Tab wrap)
  useEffect(() => {
    if (!askModalOpen) return;
    const el = askDialogRef.current;
    if (!el) return;
    const focusables = getFocusableElements(el);
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusableElements(el);
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
  }, [askModalOpen]);

  useEffect(() => {
    if (!bidModalOpen) return;
    const el = bidDialogRef.current;
    if (!el) return;
    const focusables = getFocusableElements(el);
    focusables[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusableElements(el);
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
  }, [bidModalOpen]);

  return (
    <BackofficeLayout
      subSubHeaderLeft={
        <div className="inline-flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800">
          {([
            { type: 'CEA' as CertificateType, label: 'CEA Cash' },
            { type: 'EUA' as CertificateType, label: 'Swap' }
          ]).map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setCertificateType(type)}
              className={cn(
                'px-6 py-2 text-sm font-semibold transition-colors',
                certificateType === type
                  ? 'bg-navy-600 text-white'
                  : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
      subSubHeader={
        <>
          {/* View Toggle */}
          <div className="inline-flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 mr-2">
            <button
              onClick={() => setViewMode('aggregated')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'aggregated'
                  ? 'bg-navy-600 text-white'
                  : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              )}
              title="Aggregated order book view"
            >
              Aggregated
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                viewMode === 'individual'
                  ? 'bg-navy-600 text-white'
                  : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              )}
              title="Individual orders view - click to edit"
            >
              <List className="w-3.5 h-3.5" />
              Orders
            </button>
          </div>
          {certificateType === 'CEA' && (
            <Button
              variant="primary"
              onClick={handlePlaceBid}
              disabled={bidModalOpen || submitting}
              className="bg-navy-600 hover:bg-navy-700 text-white"
              icon={<TrendingUp className="w-4 h-4" />}
            >
              Place BID
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handlePlaceAsk}
            disabled={askModalOpen || submitting}
            className="bg-navy-600 hover:bg-navy-700 text-white"
            icon={<TrendingDown className="w-4 h-4" />}
          >
            Place ASK
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={<RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </>
      }
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Order book section */}
        <motion.div
          key={`${certificateType}-${viewMode}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'aggregated' ? (
            /* Aggregated Order Book - Full book with scroll for CEA Cash */
            <div className="min-h-[400px]">
              <AdminOrderBookSection
                key={`orderbook-${refreshKey}`}
                certificateType={certificateType}
                onPriceClick={handlePriceClick}
                onOrderBookData={handleOrderBookData}
                showFullBook={certificateType === 'CEA'}
              />
            </div>
          ) : (
            /* Individual Orders Table */
            <IndividualOrdersTable
              key={`orders-${refreshKey}`}
              certificateType={certificateType}
              onEditOrder={handleEditOrder}
              refreshKey={refreshKey}
            />
          )}
        </motion.div>
      </div>

      {/* Place Sell Order Modal */}
      <AnimatePresence>
        {askModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !submitting && closeAsk()}
            aria-hidden="true"
          >
            <motion.div
              ref={askDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ask-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-navy-200 dark:border-navy-700 bg-gradient-to-r from-navy-50 to-white dark:from-navy-900/20 dark:to-navy-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-6 h-6 text-navy-600 dark:text-navy-400" aria-hidden="true" />
                    <div>
                      <h2 id="ask-modal-title" className="text-xl font-bold text-navy-900 dark:text-white">
                        Place SELL Order
                      </h2>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        {certificateType} • Sell
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeAsk}
                    disabled={submitting}
                    className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close Place SELL Order modal"
                  >
                    <X className="w-5 h-5 text-navy-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                <PlaceOrder
                  certificateType={certificateType}
                  side="ASK"
                  onSubmit={handleOrderSubmit}
                  onSuccess={handleSuccessAndCloseAsk}
                  prefilledPrice={askPrefilledPrice}
                  prefilledQuantity={askPrefilledQuantity}
                  compact
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Place BID Order Modal */}
      <AnimatePresence>
        {bidModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !submitting && closeBid()}
            aria-hidden="true"
          >
            <motion.div
              ref={bidDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bid-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-navy-200 dark:border-navy-700 bg-gradient-to-r from-navy-50 to-white dark:from-navy-900/20 dark:to-navy-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-navy-600 dark:text-navy-400" aria-hidden="true" />
                    <div>
                      <h2 id="bid-modal-title" className="text-xl font-bold text-navy-900 dark:text-white">
                        Place BUY Order
                      </h2>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        {certificateType} • Buy
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeBid}
                    disabled={submitting}
                    className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close Place BUY Order modal"
                  >
                    <X className="w-5 h-5 text-navy-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                <PlaceOrder
                  certificateType={certificateType}
                  side="BID"
                  onSubmit={handleOrderSubmit}
                  onSuccess={handleSuccessAndCloseBid}
                  prefilledPrice={bidPrefilledPrice}
                  prefilledQuantity={bidPrefilledQuantity}
                  compact
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={editModalOpen}
        onClose={closeEditModal}
        onUpdate={handleUpdateOrder}
        onCancel={handleCancelOrder}
        onSuccess={handleEditSuccess}
      />
    </BackofficeLayout>
  );
}
