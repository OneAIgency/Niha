import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import {
  ProfessionalOrderBook,
  TradePanel,
  MarketDepthChart,
  RecentTrades,
  MyOrders,
} from '../components/cash-market';
import { cashMarketApi } from '../services/api';
import type {
  CertificateType,
  OrderBook as OrderBookType,
  MarketDepth,
  CashMarketTrade,
  Order,
} from '../types';

export function CashMarketPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('EUA');
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [marketDepth, setMarketDepth] = useState<MarketDepth | null>(null);
  const [recentTrades, setRecentTrades] = useState<CashMarketTrade[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch all market data
  const fetchData = useCallback(async () => {
    try {
      const [orderBookData, depthData, tradesData, ordersData] = await Promise.all([
        cashMarketApi.getOrderBook(certificateType),
        cashMarketApi.getMarketDepth(certificateType),
        cashMarketApi.getRecentTrades(certificateType, 50),
        cashMarketApi.getMyOrders({ certificate_type: certificateType }),
      ]);

      setOrderBook(orderBookData);
      setMarketDepth(depthData);
      setRecentTrades(tradesData);
      setMyOrders(ordersData);
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

  // Handle order placement
  const handlePlaceOrder = async (order: {
    side: 'BUY' | 'SELL';
    price: number;
    quantity: number;
  }) => {
    setIsPlacingOrder(true);
    try {
      await cashMarketApi.placeOrder({
        certificate_type: certificateType,
        ...order,
      });
      // Refresh data after placing order
      fetchData();
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsPlacingOrder(false);
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
  const handlePriceClick = (price: number, _side: 'BUY' | 'SELL') => {
    setSelectedPrice(price);
    // Optional: You can also pre-fill the order side based on the clicked side
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

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading && !orderBook ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Professional Order Book - Full Width */}
            <div className="w-full">
              {orderBook && (
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
              )}
            </div>

            {/* Trading Panel and Market Depth */}
            <div className="grid grid-cols-12 gap-6">
              {/* Trade Panel - Left */}
              <div className="col-span-12 lg:col-span-6 h-[500px]">
                <TradePanel
                  certificateType={certificateType}
                  lastPrice={orderBook?.last_price || null}
                  bestBid={orderBook?.best_bid || null}
                  bestAsk={orderBook?.best_ask || null}
                  selectedPrice={selectedPrice}
                  onPlaceOrder={handlePlaceOrder}
                  isLoading={isPlacingOrder}
                />
              </div>

              {/* Market Depth - Right */}
              <div className="col-span-12 lg:col-span-6 h-[500px]">
                <MarketDepthChart
                  bids={marketDepth?.bids || []}
                  asks={marketDepth?.asks || []}
                  midPrice={orderBook?.last_price ?? undefined}
                />
              </div>
            </div>

            {/* Recent Trades and My Orders */}
            <div className="grid grid-cols-12 gap-6">
              {/* Recent Trades - Left */}
              <div className="col-span-12 lg:col-span-6 h-[400px]">
                <RecentTrades trades={recentTrades} />
              </div>

              {/* My Orders - Right */}
              <div className="col-span-12 lg:col-span-6 h-[400px]">
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
