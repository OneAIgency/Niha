import { useState } from 'react';
import { Clock, X } from 'lucide-react';
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

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      OPEN: 'bg-amber-500/20 text-amber-400',
      PARTIALLY_FILLED: 'bg-blue-500/20 text-blue-400',
      FILLED: 'bg-emerald-500/20 text-emerald-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="content_wrapper_last h-full flex flex-col">
      <div className="px-4 py-3 border-b border-navy-700 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          My Orders
        </h3>

        {/* Tab buttons styled like Swap */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'open'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-navy-400 hover:bg-navy-700'
            }`}
          >
            Open ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-navy-400 hover:bg-navy-700'
            }`}
          >
            History ({historicalOrders.length})
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 gap-2 px-4 py-2 text-xs text-navy-500 border-b border-navy-700">
        <div>ID</div>
        <div>Side</div>
        <div className="text-right">Price</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Filled</div>
        <div>Status</div>
        <div className="text-right">Action</div>
      </div>

      {/* Orders List - Table style */}
      <div className="flex-1 overflow-y-auto">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-navy-500">
            No {activeTab === 'open' ? 'open' : 'historical'} orders
          </div>
        ) : (
          displayOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-7 gap-2 px-4 py-2 text-xs hover:bg-navy-700/50 items-center"
            >
              <div className="text-navy-400 font-mono truncate">
                {order.id.slice(0, 8)}
              </div>
              <div className={order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>
                {order.side}
              </div>
              <div className="text-right text-white font-mono">
                €{order.price.toFixed(2)}
              </div>
              <div className="text-right text-white font-mono">
                {order.quantity.toLocaleString()}
              </div>
              <div className="text-right text-navy-300 font-mono">
                {(order.quantity - order.remainingQuantity).toLocaleString()}
              </div>
              <div>{getStatusBadge(order.status)}</div>
              <div className="text-right">
                {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    disabled={isLoading}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
