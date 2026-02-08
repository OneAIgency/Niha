import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, BarChart3, ShoppingCart, X, CheckCircle, FileText, TrendingUp } from 'lucide-react';
import {
  UnifiedOrderBook,
  MyOrders,
  RecentTrades,
  UserOrderEntryModal,
} from '../components/cash-market';
import { cashMarketApi } from '../services/api';
import { Subheader, Modal } from '../components/common';
import type {
  OrderBook as OrderBookType,
  Order,
} from '../types';

/** Shape of the result returned by executeMarketOrder */
interface OrderExecutionResult {
  success: boolean;
  order_id: string | null;
  message: string;
  total_quantity: number;
  total_cost_gross: number;
  platform_fee: number;
  total_cost_net: number;
  weighted_avg_price: number;
  eur_balance: number;
  certificate_balance: number;
}

export function CashMarketPage() {
  const certificateType = 'CEA'; // Hardcoded to CEA only
  const navigate = useNavigate();
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderExecutionResult | null>(null);
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

        // Show success modal with order details
        if (result.success) {
          setIsOrderPanelOpen(false);
          setOrderResult(result);
        }

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
                  // For market orders, panel is closed when result is captured
                  // For limit orders, close the panel
                  if (order.orderType === 'LIMIT') {
                    setIsOrderPanelOpen(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      <Modal
        isOpen={!!orderResult}
        onClose={() => {
          setOrderResult(null);
          navigate('/dashboard');
        }}
        size="sm"
        closeOnBackdrop={false}
        closeOnEscape={false}
      >
        <Modal.Header
          showClose={false}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tranzactie confirmata</h2>
              <p className="text-sm text-navy-400">Ordinul a fost executat cu succes</p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {orderResult && (
            <div className="space-y-4">
              {/* Order ID */}
              {orderResult.order_id && (
                <div className="flex items-center gap-2 px-3 py-2 bg-navy-900/50 rounded-lg border border-navy-700">
                  <FileText className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-navy-400">Order Ticket</p>
                    <p className="text-sm font-mono text-white">{orderResult.order_id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Key metrics */}
              <div className="space-y-2">
                {/* Volume CEA */}
                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Volum CEA cumparat</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {orderResult.total_quantity.toLocaleString()} CEA
                  </span>
                </div>

                {/* Avg Price */}
                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Pret mediu per CEA</span>
                  <span className="text-lg font-bold font-mono text-white">
                    €{orderResult.weighted_avg_price.toFixed(2)}
                  </span>
                </div>

                {/* Total cost */}
                <div className="flex justify-between items-center py-2 border-b border-navy-700/50">
                  <span className="text-sm text-navy-400">Cost total (cu comision)</span>
                  <span className="text-sm font-mono text-navy-300">
                    €{orderResult.total_cost_net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Platform fee */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-navy-400">Comision platforma</span>
                  <span className="text-sm font-mono text-navy-400">
                    €{orderResult.platform_fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Settlement note */}
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-300">
                  Certificatele CEA vor fi livrate in contul tau dupa finalizarea settlement-ului (T+3).
                </p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            onClick={() => {
              setOrderResult(null);
              navigate('/dashboard');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Inapoi la Dashboard
          </button>
        </Modal.Footer>
      </Modal>

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
