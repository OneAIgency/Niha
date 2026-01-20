import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import type { Order, OrderStatus } from '../../types';

interface MyOrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
  isLoading?: boolean;
}

export function MyOrders({ orders, onCancelOrder, isLoading }: MyOrdersProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const openOrders = orders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
  const historicalOrders = orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED');

  const displayOrders = activeTab === 'open' ? openOrders : historicalOrders;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      PARTIALLY_FILLED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      FILLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white">My Orders</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-200 dark:border-navy-700">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'open'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          Open ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          History ({historicalOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-navy-400 dark:text-navy-500">
            <span>No {activeTab === 'open' ? 'open' : 'historical'} orders</span>
          </div>
        ) : (
          <div className="divide-y divide-navy-100 dark:divide-navy-700/50">
            {displayOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-navy-50 dark:hover:bg-navy-800/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${
                      order.side === 'BUY'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {order.side}
                    </span>
                    <span className="text-sm text-navy-700 dark:text-navy-300">
                      {order.certificate_type}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Price</span>
                    <p className="font-mono text-navy-900 dark:text-white">
                      €{order.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Quantity</span>
                    <p className="font-mono text-navy-900 dark:text-white">
                      {order.remaining_quantity.toLocaleString()} / {order.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Total</span>
                    <p className="font-mono text-navy-900 dark:text-white">
                      €{(order.price * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-navy-500 dark:text-navy-400">Time</span>
                    <p className="text-navy-700 dark:text-navy-300">
                      {formatTime(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Cancel button for open orders */}
                {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCancelOrder(order.id)}
                    disabled={isLoading}
                    className="mt-3 w-full py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    Cancel Order
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
