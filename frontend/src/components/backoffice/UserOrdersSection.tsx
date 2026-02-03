import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Leaf,
  Wind,
  ArrowDownRight,
  ArrowUpRight,
  Edit,
  X,
  AlertCircle,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button, Badge, ConfirmationModal } from '../common';
import { backofficeApi } from '../../services/api';
import { cn, formatRelativeTime } from '../../utils';
import type { Order } from '../../types';

interface UserOrdersSectionProps {
  entityId: string;
  entityName: string;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order | null;
}

function EditOrderModal({ isOpen, onClose, onSuccess, order }: EditOrderModalProps) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      setPrice(order.price.toString());
      setQuantity(order.quantity.toString());
      setError(null);
    }
  }, [isOpen, order]);

  const handleSubmit = async () => {
    if (!order) return;

    const newPrice = parseFloat(price);
    const newQuantity = parseFloat(quantity);

    if (isNaN(newPrice) || newPrice <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (isNaN(newQuantity) || newQuantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (newQuantity < order.filledQuantity) {
      setError(`Quantity cannot be less than filled amount (${order.filledQuantity})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await backofficeApi.adminUpdateOrder(order.id, {
        price: newPrice,
        quantity: newQuantity,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className={cn('fixed inset-0 z-[60] flex items-center justify-center bg-black/50', !isOpen && 'hidden')}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-navy-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              order.side === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
            )}>
              {order.side === 'BUY' ? (
                <ArrowDownRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                Edit {order.side} Order
              </h2>
              <p className="text-sm text-navy-500">{order.certificateType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
          >
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Order Info */}
          <div className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
            <div className="text-xs text-navy-500 mb-2">Current Order</div>
            <div className="flex justify-between text-sm">
              <span className="text-navy-600 dark:text-navy-300">Quantity:</span>
              <span className="font-mono font-medium text-navy-900 dark:text-white">
                {order.quantity.toLocaleString()} ({order.filledQuantity.toLocaleString()} filled)
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-navy-600 dark:text-navy-300">Price:</span>
              <span className="font-mono font-medium text-navy-900 dark:text-white">
                €{order.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              New Price *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              New Quantity * <span className="text-navy-400">(min: {order.filledQuantity})</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="1"
              min={order.filledQuantity || 1}
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-navy-100 dark:border-navy-700">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function UserOrdersSection({ entityId }: UserOrdersSectionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'history'>('all');
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backofficeApi.getEntityOrders(entityId);
      setOrders(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to load orders:', err);
      setError(error.response?.data?.detail || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    setCancelling(true);
    try {
      await backofficeApi.adminCancelOrder(cancelOrder.id);
      loadOrders();
    } catch (err: unknown) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancelling(false);
      setCancelOrder(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'open') return o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED';
    if (filter === 'history') return o.status === 'FILLED' || o.status === 'CANCELLED';
    return true;
  });

  const openCount = orders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Open</Badge>;
      case 'PARTIALLY_FILLED':
        return <Badge variant="info">Partial</Badge>;
      case 'FILLED':
        return <Badge variant="success">Filled</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500">{error}</p>
        <Button variant="ghost" onClick={loadOrders} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-navy-900 dark:text-white">Orders</h3>
          {openCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
              {openCount} open
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-navy-100 dark:bg-navy-700 rounded-lg p-0.5">
            {(['all', 'open', 'history'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  filter === f
                    ? 'bg-white dark:bg-navy-600 text-navy-900 dark:text-white shadow-sm'
                    : 'text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                )}
              >
                {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'History'}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
          <p className="text-navy-500 dark:text-navy-400">
            {filter === 'open' ? 'No open orders' : filter === 'history' ? 'No order history' : 'No orders found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl border border-navy-100 dark:border-navy-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Side Icon */}
                  <div className={cn(
                    'p-2 rounded-lg',
                    order.side === 'BUY'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  )}>
                    {order.side === 'BUY' ? (
                      <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>

                  {/* Order Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold',
                        order.side === 'BUY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {order.side}
                      </span>
                      <span className="text-navy-900 dark:text-white font-medium">
                        {order.certificateType}
                      </span>
                      {order.certificateType === 'CEA' ? (
                        <Leaf className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Wind className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(order.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                {getStatusBadge(order.status)}
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Price</div>
                  <div className="font-mono font-semibold text-navy-900 dark:text-white">
                    €{order.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Quantity</div>
                  <div className="font-mono font-semibold text-navy-900 dark:text-white">
                    {order.quantity.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Filled</div>
                  <div className="font-mono font-semibold text-navy-900 dark:text-white">
                    {order.filledQuantity.toLocaleString()}
                    <span className="text-navy-400 text-xs ml-1">
                      ({((order.filledQuantity / order.quantity) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {order.filledQuantity > 0 && order.status !== 'CANCELLED' && (
                <div className="mb-3">
                  <div className="h-1.5 bg-navy-200 dark:bg-navy-600 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        order.status === 'FILLED' ? 'bg-emerald-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${(order.filledQuantity / order.quantity) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                <div className="flex justify-end gap-2 pt-2 border-t border-navy-100 dark:border-navy-600">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditOrder(order)}
                    className="text-navy-600 dark:text-navy-300"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelOrder(order)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Status Icons for completed orders */}
              {order.status === 'FILLED' && (
                <div className="flex items-center gap-2 pt-2 border-t border-navy-100 dark:border-navy-600 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Order fully filled</span>
                </div>
              )}
              {order.status === 'CANCELLED' && (
                <div className="flex items-center gap-2 pt-2 border-t border-navy-100 dark:border-navy-600 text-navy-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Order cancelled</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelOrder}
        onClose={() => setCancelOrder(null)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        variant="danger"
        details={cancelOrder ? [
          { label: 'Type', value: `${cancelOrder.side} ${cancelOrder.certificateType}` },
          { label: 'Price', value: `€${cancelOrder.price.toFixed(2)}` },
          { label: 'Quantity', value: cancelOrder.quantity.toLocaleString() },
          { label: 'Filled', value: cancelOrder.filledQuantity.toLocaleString() },
        ] : []}
        loading={cancelling}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!editOrder}
        onClose={() => setEditOrder(null)}
        onSuccess={loadOrders}
        order={editOrder}
      />
    </div>
  );
}
