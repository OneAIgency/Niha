import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { getMarketMakerOrders } from '../../services/api';
import { formatCurrency, formatQuantity, cn } from '../../utils';
import type { CertificateType, MarketMakerOrder } from '../../types';

interface IndividualOrdersTableProps {
  certificateType: CertificateType;
  /** Called when user clicks edit on an order */
  onEditOrder?: (order: MarketMakerOrder) => void;
  /** Refresh trigger - increment to force refresh */
  refreshKey?: number;
}

/**
 * Displays individual Market Maker orders (not aggregated price levels).
 * Shows BID orders on the left, ASK orders on the right.
 */
export function IndividualOrdersTable({
  certificateType,
  onEditOrder,
  refreshKey = 0,
}: IndividualOrdersTableProps) {
  const [orders, setOrders] = useState<MarketMakerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await getMarketMakerOrders({
        certificate_type: certificateType,
        status: 'OPEN',
      });
      // Transform backend response to frontend types
      const ordersData = response.data || [];
      const transformedOrders: MarketMakerOrder[] = ordersData.map((order: {
        id: string;
        market_maker_id: string;
        market_maker_name: string;
        certificate_type: string;
        side: string;
        price: number;
        quantity: number;
        filled_quantity: number;
        remaining_quantity: number;
        status: string;
        created_at: string;
        updated_at?: string;
        ticket_id?: string;
      }) => ({
        id: order.id,
        market_maker_id: order.market_maker_id,
        market_maker_name: order.market_maker_name,
        certificate_type: order.certificate_type as CertificateType,
        side: order.side as 'BUY' | 'SELL',
        price: order.price,
        quantity: order.quantity,
        filled_quantity: order.filled_quantity,
        remaining_quantity: order.remaining_quantity,
        status: order.status as 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED',
        created_at: order.created_at,
        updated_at: order.updated_at,
        ticket_id: order.ticket_id,
      }));
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [certificateType]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Split orders into bids (BUY) and asks (SELL)
  const bidOrders = orders
    .filter((o) => o.side === 'BUY')
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); // Highest price first
  const askOrders = orders
    .filter((o) => o.side === 'SELL')
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); // Lowest price first

  if (isLoading) {
    return (
      <div className="content_wrapper_last p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const OrderRow = ({ order, isBid }: { order: MarketMakerOrder; isBid: boolean }) => (
    <div
      className={cn(
        'grid gap-2 px-3 py-2 text-[11px] font-mono cursor-pointer relative transition-colors',
        isBid
          ? 'grid-cols-[1fr_auto_auto_auto_auto] bg-emerald-500/15 hover:bg-emerald-500/25'
          : 'grid-cols-[auto_auto_auto_auto_1fr] bg-red-500/15 hover:bg-red-500/25'
      )}
      onClick={() => onEditOrder?.(order)}
      title={`Click to edit order ${order.id}`}
    >
      {isBid ? (
        <>
          <div className="text-left text-navy-600 dark:text-navy-400 truncate">
            {order.market_maker_name}
          </div>
          <div className="text-right text-navy-800 dark:text-navy-200 w-16">
            {formatQuantity(order.remaining_quantity)}
          </div>
          <div className="text-right font-semibold text-emerald-600 dark:text-emerald-400 w-20">
            {formatCurrency(order.price ?? 0)}
          </div>
          <div className="text-center text-navy-500 dark:text-navy-400 w-8">
            {order.status === 'PARTIALLY_FILLED' ? 'P' : ''}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditOrder?.(order);
            }}
            className="p-1 hover:bg-emerald-500/30 rounded transition-colors"
            title="Edit order"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditOrder?.(order);
            }}
            className="p-1 hover:bg-red-500/30 rounded transition-colors"
            title="Edit order"
          >
            <Edit2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </button>
          <div className="text-center text-navy-500 dark:text-navy-400 w-8">
            {order.status === 'PARTIALLY_FILLED' ? 'P' : ''}
          </div>
          <div className="text-left font-semibold text-red-600 dark:text-red-400 w-20">
            {formatCurrency(order.price ?? 0)}
          </div>
          <div className="text-left text-navy-800 dark:text-navy-200 w-16">
            {formatQuantity(order.remaining_quantity)}
          </div>
          <div className="text-right text-navy-600 dark:text-navy-400 truncate">
            {order.market_maker_name}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="content_wrapper_last p-0 text-[11px]">
      {/* Header */}
      <div className="px-4 py-2 border-b border-navy-200 dark:border-navy-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900 dark:text-white">
            Individual Orders
          </h2>
          <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
            <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
            <span>{bidOrders.length + askOrders.length} orders</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex border-b border-navy-200 dark:border-navy-700">
        {/* Bids Header */}
        <div className="flex-1 px-3 py-1.5 border-r border-navy-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              BID Orders (BUY)
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 mt-1 text-[10px] text-navy-500 dark:text-navy-400">
            <div className="text-left">Market Maker</div>
            <div className="text-right w-16">Qty</div>
            <div className="text-right w-20">Price</div>
            <div className="w-8"></div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px bg-navy-200 dark:bg-navy-700" />

        {/* Asks Header */}
        <div className="flex-1 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
              ASK Orders (SELL)
            </span>
          </div>
          <div className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-2 mt-1 text-[10px] text-navy-500 dark:text-navy-400">
            <div className="w-6"></div>
            <div className="w-8"></div>
            <div className="text-left w-20">Price</div>
            <div className="text-left w-16">Qty</div>
            <div className="text-right">Market Maker</div>
          </div>
        </div>
      </div>

      {/* Orders Content */}
      <div className="flex">
        {/* Bids Column */}
        <div className="flex-1 border-r border-navy-200 dark:border-navy-700">
          {bidOrders.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-navy-500 dark:text-navy-400">
              No BID orders
            </div>
          ) : (
            bidOrders.map((order) => (
              <OrderRow key={order.id} order={order} isBid={true} />
            ))
          )}
        </div>

        {/* Separator */}
        <div className="w-px bg-navy-200 dark:bg-navy-700" />

        {/* Asks Column */}
        <div className="flex-1">
          {askOrders.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-navy-500 dark:text-navy-400">
              No ASK orders
            </div>
          ) : (
            askOrders.map((order) => (
              <OrderRow key={order.id} order={order} isBid={false} />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-navy-200 dark:border-navy-700 text-center text-xs text-navy-500 dark:text-navy-400">
        Click any order to edit • P = Partially Filled
      </div>
    </div>
  );
}
