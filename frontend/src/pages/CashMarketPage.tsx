import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BarChart3, ShoppingCart, X } from 'lucide-react';
import {
  UnifiedOrderBook,
  MyOrders,
  RecentTrades,
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
    eurBalance: number;
    ceaBalance: number;
    euaBalance: number;
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

        if (preview.canExecute && order.limitPrice) {
          await cashMarketApi.placeOrder({
            certificate_type: certificateType,
            side: 'BUY',
            price: order.limitPrice,
            quantity: preview.totalQuantity,
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


  return (
    <div className="min-h-screen bg-navy-900">
      {/* Subheader */}
      <Subheader
        icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
        title="CEA Cash"
        description="Trade China Emission Allowances"
        iconBg="bg-amber-500/20"
      >
        <div className="flex items-center gap-6">
          {/* Best Bid */}
          <div>
            <span className="text-navy-600 dark:text-navy-400 mr-2">Best Bid</span>
            <span className="font-bold font-mono text-emerald-400 text-lg">
              €{formatNumber(orderBook?.bestBid)}
            </span>
          </div>

          {/* Best Ask */}
          <div>
            <span className="text-navy-600 dark:text-navy-400 mr-2">Best Ask</span>
            <span className="font-bold font-mono text-red-400 text-lg">
              €{formatNumber(orderBook?.bestAsk)}
            </span>
          </div>

          {/* Spread */}
          <div>
            <span className="text-navy-600 dark:text-navy-400 mr-2">Spread</span>
            <span className="font-semibold font-mono text-navy-300">
              €{formatNumber(orderBook?.spread, 4)}
            </span>
          </div>

          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-navy-700 text-navy-400"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Place Order Button */}
          <button
            onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
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
                availableBalance={userBalances.eurBalance}
                bestAskPrice={orderBook?.bestAsk || null}
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
      <div className="page-container py-6">
        {isLoading && !orderBook ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Book - Full Width like Swap */}
            {orderBook && (
              <UnifiedOrderBook
                bids={orderBook.bids}
                asks={orderBook.asks}
                bestBid={orderBook.bestBid}
                bestAsk={orderBook.bestAsk}
                spread={orderBook.spread}
                totalBidVolume={orderBook.bids.reduce((sum, b) => sum + b.price * b.quantity, 0)}
                totalAskVolume={orderBook.asks.reduce((sum, a) => sum + a.price * a.quantity, 0)}
              />
            )}

            {/* My Orders and Recent Trades */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <MyOrders
                  orders={myOrders}
                  onCancelOrder={handleCancelOrder}
                />
              </div>

              {/* Recent Trades panel */}
              <div className="col-span-12 lg:col-span-4">
                <RecentTrades orderBook={orderBook} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
