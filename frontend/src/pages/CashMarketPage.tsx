import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, ShoppingCart, X } from 'lucide-react';
import {
  ProfessionalOrderBook,
  MyOrders,
  UserOrderEntryModal,
} from '../components/cash-market';
import { cashMarketApi } from '../services/api';
import { Subheader } from '../components/common';
import type {
  OrderBook as OrderBookType,
  Order,
} from '../types';

export function CashMarketPage() {
  const certificateType = 'CEA'; // Hardcoded to CEA only
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [userBalances, setUserBalances] = useState<{
    eur_balance: number;
    cea_balance: number;
    eua_balance: number;
  } | null>(null);

  // Fetch all market data
  const fetchData = useCallback(async () => {
    try {
      const [orderBookData, ordersData, balancesData] = await Promise.all([
        cashMarketApi.getRealOrderBook(certificateType),
        cashMarketApi.getMyOrders({ certificate_type: certificateType }),
        cashMarketApi.getUserBalances(),
      ]);

      setOrderBook(orderBookData);
      setMyOrders(ordersData);
      setUserBalances(balancesData);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [certificateType]);

  // Initial fetch and polling
  useEffect(() => {
    setIsLoading(true);
    fetchData();

    // Poll every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle market order submission from UserOrderEntryModal
  const handleMarketOrderSubmit = async (order: {
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    amountEur: number;
  }) => {
    try {
      if (order.orderType === 'MARKET') {
        // Execute market order
        const result = await cashMarketApi.executeMarketOrder({
          certificate_type: certificateType,
          side: 'BUY',
          amount_eur: order.amountEur,
        });

        console.log('Market order executed:', result);

        // Refresh all data after successful execution
        await fetchData();
      } else {
        // For limit orders, place a limit order
        // We need to calculate quantity from the preview
        const preview = await cashMarketApi.previewOrder({
          certificate_type: certificateType,
          side: 'BUY',
          amount_eur: order.amountEur,
          order_type: 'LIMIT',
          limit_price: order.limitPrice,
        });

        if (preview.can_execute && order.limitPrice) {
          await cashMarketApi.placeOrder({
            certificate_type: certificateType,
            side: 'BUY',
            price: order.limitPrice,
            quantity: preview.total_quantity,
          });

          // Refresh data after placing order
          await fetchData();
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting order:', error);
      // You could add a toast notification here
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cashMarketApi.cancelOrder(orderId);
      // Refresh orders after cancellation
      const ordersData = await cashMarketApi.getMyOrders({ certificate_type: certificateType });
      setMyOrders(ordersData);
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  // Handle price click from order book (future enhancement)
  // const handlePriceClick = (_price: number, _side: 'BUY' | 'SELL') => {
  //   // Future enhancement: Could pre-fill order entry modal with clicked price
  // };

  const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-[11px]">
      {/* Subheader */}
      <Subheader
        icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
        title="CEA Cash"
        description="Trade China Emission Allowances"
        iconBg="bg-amber-500/20"
      >
        <div className="flex items-center gap-4 text-[11px]">
          {/* Last Price */}
          <div>
            <span className="text-navy-400 mr-1 text-[10px]">Last</span>
            <span className="font-bold font-mono text-white text-sm">
              €{formatNumber(orderBook?.last_price)}
            </span>
          </div>

          {/* 24h Change */}
          <div className="flex items-center gap-1">
            <span className="text-navy-400 text-[10px]">24h</span>
            {orderBook && (
              <span className={`flex items-center font-semibold ${
                orderBook.change_24h >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}>
                {orderBook.change_24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {orderBook.change_24h >= 0 ? '+' : ''}{orderBook.change_24h.toFixed(2)}%
              </span>
            )}
          </div>

          {/* Volume */}
          <div>
            <span className="text-navy-400 mr-1 text-[10px]">Vol</span>
            <span className="font-semibold text-navy-300 font-mono">
              {orderBook ? formatVolume(orderBook.volume_24h) : '-'}
            </span>
          </div>

          {/* Refresh indicator */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={fetchData}
            className="p-1.5 rounded-lg hover:bg-navy-700 text-navy-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Place Order Button */}
          <button
            onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-[11px] transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Place Order
          </button>
        </div>
      </Subheader>

      {/* Order Entry Overlay */}
      {isOrderPanelOpen && userBalances && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70">
          <div className="relative w-full max-w-5xl mx-4 bg-white dark:bg-navy-800 rounded-lg shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setIsOrderPanelOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 text-navy-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <UserOrderEntryModal
                certificateType={certificateType}
                availableBalance={userBalances.eur_balance}
                bestAskPrice={orderBook?.best_ask || null}
                onOrderSubmit={async (order) => {
                  await handleMarketOrderSubmit(order);
                  setIsOrderPanelOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {isLoading && !orderBook ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order Book with Market Depth Visualization - Same style as backoffice */}
            {orderBook && (
              <ProfessionalOrderBook
                orderBook={{
                  bids: orderBook.bids,
                  asks: orderBook.asks,
                  spread: orderBook.spread,
                  best_bid: orderBook.best_bid,
                  best_ask: orderBook.best_ask,
                }}
                showFullBook={true}
                maxHeight="calc(100vh - 350px)"
              />
            )}

            {/* My Orders - Full Width */}
            <div className="w-full">
              <div className="h-[450px]">
                <MyOrders
                  orders={myOrders}
                  onCancelOrder={handleCancelOrder}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
