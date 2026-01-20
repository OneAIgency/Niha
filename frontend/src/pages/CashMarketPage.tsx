import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import {
  ProfessionalOrderBook,
  RecentTrades,
  MyOrders,
  UserOrderEntryModal,
} from '../components/cash-market';
import { cashMarketApi } from '../services/api';
import type {
  CertificateType,
  OrderBook as OrderBookType,
  CashMarketTrade,
  Order,
} from '../types';

export function CashMarketPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('EUA');
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [recentTrades, setRecentTrades] = useState<CashMarketTrade[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalances, setUserBalances] = useState<{
    eur_balance: number;
    cea_balance: number;
    eua_balance: number;
  } | null>(null);

  // Fetch all market data
  const fetchData = useCallback(async () => {
    try {
      const [orderBookData, tradesData, ordersData, balancesData] = await Promise.all([
        cashMarketApi.getOrderBook(certificateType),
        cashMarketApi.getRecentTrades(certificateType, 50),
        cashMarketApi.getMyOrders({ certificate_type: certificateType }),
        cashMarketApi.getUserBalances(),
      ]);

      setOrderBook(orderBookData);
      setRecentTrades(tradesData);
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
    } catch (error: any) {
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

  // Handle price click from order book
  const handlePriceClick = (_price: number, _side: 'BUY' | 'SELL') => {
    // Future enhancement: Could pre-fill order entry modal with clicked price
  };

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
    <div className="min-h-screen bg-navy-50 dark:bg-navy-900">
      {/* Header */}
      <div className="bg-white dark:bg-navy-800 border-b border-navy-200 dark:border-navy-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Market Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                <h1 className="text-xl font-bold text-navy-900 dark:text-white">Cash Market</h1>
              </div>

              {/* Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600">
                {(['EUA', 'CEA'] as CertificateType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCertificateType(type)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      certificateType === type
                        ? type === 'EUA'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              {/* Last Price */}
              <div>
                <span className="text-navy-500 dark:text-navy-400 mr-2">Last</span>
                <span className="font-bold font-mono text-navy-900 dark:text-white text-lg">
                  ${formatNumber(orderBook?.last_price)}
                </span>
              </div>

              {/* 24h Change */}
              <div className="flex items-center gap-1">
                <span className="text-navy-500 dark:text-navy-400">24h</span>
                {orderBook && (
                  <span className={`flex items-center font-semibold ${
                    orderBook.change_24h >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {orderBook.change_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {orderBook.change_24h >= 0 ? '+' : ''}{orderBook.change_24h.toFixed(2)}%
                  </span>
                )}
              </div>

              {/* Volume */}
              <div>
                <span className="text-navy-500 dark:text-navy-400 mr-2">Vol</span>
                <span className="font-semibold text-navy-700 dark:text-navy-300 font-mono">
                  {orderBook ? formatVolume(orderBook.volume_24h) : '-'}
                </span>
              </div>

              {/* Refresh indicator */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchData}
                className="p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 text-navy-500"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* User Order Entry Modal - Fixed/Sticky at Top */}
      {userBalances && (
        <div className="sticky top-0 z-10 bg-white dark:bg-navy-800 border-b border-navy-200 dark:border-navy-700 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <UserOrderEntryModal
              certificateType={certificateType}
              availableBalance={userBalances.eur_balance}
              bestAskPrice={orderBook?.best_ask || null}
              onOrderSubmit={handleMarketOrderSubmit}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading && !orderBook ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Professional Order Book - Full Width, Prominent */}
            <div className="w-full">
              {orderBook && (
                <div className="h-[700px]">
                  <ProfessionalOrderBook
                    orderBook={{
                      bids: orderBook.bids,
                      asks: orderBook.asks,
                      spread: orderBook.spread,
                      best_bid: orderBook.best_bid,
                      best_ask: orderBook.best_ask,
                    }}
                    onPriceClick={handlePriceClick}
                  />
                </div>
              )}
            </div>

            {/* My Orders and Recent Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Orders - Left (Priority) */}
              <div className="h-[450px]">
                <MyOrders
                  orders={myOrders}
                  onCancelOrder={handleCancelOrder}
                />
              </div>

              {/* Recent Trades - Right */}
              <div className="h-[450px]">
                <RecentTrades trades={recentTrades} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
