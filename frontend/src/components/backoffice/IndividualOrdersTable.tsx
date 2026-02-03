import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Edit2, TrendingUp, TrendingDown, Building2, Landmark } from 'lucide-react';
import { getAllOrders } from '../../services/api';
import { formatCurrency, formatQuantity, cn } from '../../utils';
import type { CertificateType } from '../../types';

// Extended order type that includes both entity and market maker orders
interface AllOrder {
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
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
  ticketId?: string;
  orderType: 'entity' | 'market_maker';
}

interface IndividualOrdersTableProps {
  certificateType: CertificateType;
  /** Called when user clicks edit on an order */
  onEditOrder?: (order: AllOrder) => void;
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
  const [orders, setOrders] = useState<AllOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      // Fetch both OPEN and PARTIALLY_FILLED orders to match aggregated view
      const [openResponse, partiallyFilledResponse] = await Promise.all([
        getAllOrders({
          certificate_type: certificateType,
          status: 'OPEN',
          per_page: 500,
        }),
        getAllOrders({
          certificate_type: certificateType,
          status: 'PARTIALLY_FILLED',
          per_page: 500,
        }),
      ]);

      // Combine both responses
      const openOrders = openResponse.data || [];
      const partiallyFilledOrders = partiallyFilledResponse.data || [];
      const allOrdersData = [...openOrders, ...partiallyFilledOrders];

      // Deduplicate by order ID (in case any order appears in both)
      const orderMap = new Map();
      allOrdersData.forEach(order => orderMap.set(order.id, order));
      const response = { data: Array.from(orderMap.values()) };
      // Transform backend response to frontend types
      const ordersData = response.data;
      const transformedOrders: AllOrder[] = ordersData.map((order: {
        id: string;
        entityId?: string;
        entityName?: string;
        marketMakerId?: string;
        marketMakerName?: string;
        certificateType: string;
        side: string;
        price: number;
        quantity: number;
        filledQuantity: number;
        remainingQuantity: number;
        status: string;
        createdAt: string;
        updatedAt?: string;
        ticketId?: string;
        orderType: string;
      }) => ({
        id: order.id,
        entityId: order.entityId,
        entityName: order.entityName,
        marketMakerId: order.marketMakerId,
        marketMakerName: order.marketMakerName,
        certificateType: order.certificateType as CertificateType,
        // Normalize side: backend may return BID/ASK or BUY/SELL
        side: (order.side === 'BID' ? 'BUY' : order.side === 'ASK' ? 'SELL' : order.side) as 'BUY' | 'SELL',
        price: order.price,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
        remainingQuantity: order.remainingQuantity,
        status: order.status as 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        ticketId: order.ticketId,
        orderType: order.orderType as 'entity' | 'market_maker',
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
  // Note: side is normalized from BID/ASK to BUY/SELL during transformation
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

  // Helper to get display name and icon for an order
  const getOrderOwnerDisplay = (order: AllOrder) => {
    if (order.orderType === 'market_maker' && order.marketMakerName) {
      return {
        name: order.marketMakerName,
        icon: <Landmark className="w-3 h-3 inline mr-1 text-purple-500" />,
        title: `Market Maker: ${order.marketMakerName}`,
      };
    } else if (order.entityName) {
      return {
        name: order.entityName,
        icon: <Building2 className="w-3 h-3 inline mr-1 text-blue-500" />,
        title: `Entity: ${order.entityName}`,
      };
    }
    return {
      name: 'Unknown',
      icon: null,
      title: 'Unknown owner',
    };
  };

  const OrderRow = ({ order, isBid }: { order: AllOrder; isBid: boolean }) => {
    const ownerDisplay = getOrderOwnerDisplay(order);

    return (
      <div
        className={cn(
          'grid gap-2 px-3 py-2 text-[11px] font-mono cursor-pointer relative transition-colors',
          isBid
            ? 'grid-cols-[1fr_auto_auto_auto_auto] bg-emerald-500/15 hover:bg-emerald-500/25'
            : 'grid-cols-[auto_auto_auto_auto_1fr] bg-red-500/15 hover:bg-red-500/25'
        )}
        onClick={() => onEditOrder?.(order)}
        title={ownerDisplay.title}
      >
        {isBid ? (
          <>
            <div className="text-left text-navy-600 dark:text-navy-400 truncate flex items-center">
              {ownerDisplay.icon}
              <span className="truncate">{ownerDisplay.name}</span>
            </div>
            <div className="text-right text-navy-800 dark:text-navy-200 w-16">
              {formatQuantity(order.remainingQuantity)}
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
              {formatQuantity(order.remainingQuantity)}
            </div>
            <div className="text-right text-navy-600 dark:text-navy-400 truncate flex items-center justify-end">
              <span className="truncate">{ownerDisplay.name}</span>
              {ownerDisplay.icon}
            </div>
          </>
        )}
      </div>
    );
  };

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
            <div className="text-left">Owner</div>
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
            <div className="text-right">Owner</div>
          </div>
        </div>
      </div>

      {/* Orders Content - Scrollable with synced columns */}
      <div
        className="flex"
        style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '200px' }}
      >
        {/* Bids Column */}
        <div className="flex-1 border-r border-navy-200 dark:border-navy-700 overflow-y-auto">
          {bidOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-emerald-300 dark:text-emerald-700 mx-auto mb-2" />
                <p className="text-sm text-navy-500 dark:text-navy-400">No BID orders</p>
                <p className="text-xs text-navy-400 dark:text-navy-500 mt-1">
                  Create orders from Liquidity page
                </p>
              </div>
            </div>
          ) : (
            bidOrders.map((order) => (
              <OrderRow key={order.id} order={order} isBid={true} />
            ))
          )}
        </div>

        {/* Separator */}
        <div className="w-px bg-navy-200 dark:bg-navy-700 flex-shrink-0" />

        {/* Asks Column */}
        <div className="flex-1 overflow-y-auto">
          {askOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-8">
                <TrendingDown className="w-8 h-8 text-red-300 dark:text-red-700 mx-auto mb-2" />
                <p className="text-sm text-navy-500 dark:text-navy-400">No ASK orders</p>
                <p className="text-xs text-navy-400 dark:text-navy-500 mt-1">
                  Create orders from Liquidity page
                </p>
              </div>
            </div>
          ) : (
            askOrders.map((order) => (
              <OrderRow key={order.id} order={order} isBid={false} />
            ))
          )}
        </div>
      </div>

      {/* Footer - always visible */}
      <div className="px-4 py-2 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/30">
        <div className="flex items-center justify-between text-[10px] text-navy-500 dark:text-navy-400">
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{bidOrders.length}</span> bids
            {' • '}
            <span className="font-semibold text-red-600 dark:text-red-400">{askOrders.length}</span> asks
            {' • '}
            <Building2 className="w-3 h-3 inline text-blue-500" />
            <span className="ml-0.5">{orders.filter(o => o.orderType === 'entity').length}</span>
            {' '}
            <Landmark className="w-3 h-3 inline text-purple-500" />
            <span className="ml-0.5">{orders.filter(o => o.orderType === 'market_maker').length}</span>
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
            Auto-refreshing every 5s
          </span>
        </div>
      </div>
    </div>
  );
}
