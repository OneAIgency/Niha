import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { ProfessionalOrderBook } from '../cash-market/ProfessionalOrderBook';
import { getAdminOrderBook } from '../../services/api';
import type { OrderBook as OrderBookType, CertificateType } from '../../types';

export interface OrderBookData {
  bestBid: number | null;
  bestAsk: number | null;
  bidQuantityAtBest: number;  // Volume at best bid price
  askQuantityAtBest: number;  // Volume at best ask price
}

interface AdminOrderBookSectionProps {
  certificateType: CertificateType;
  /** Called when user clicks a price in the order book (e.g. to open placement modal) */
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
  /** Called when orderbook data is updated - provides best prices and volumes for auto-fill */
  onOrderBookData?: (data: OrderBookData) => void;
  /** Show all orders with scrolling instead of limiting to 7 rows */
  showFullBook?: boolean;
}

export function AdminOrderBookSection({ certificateType, onPriceClick, onOrderBookData, showFullBook = false }: AdminOrderBookSectionProps) {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrderBook = useCallback(async () => {
    try {
      const response = await getAdminOrderBook(certificateType);
      const data = response.data;
      setOrderBook(data);

      // Notify parent with best prices and quantities for auto-fill
      if (onOrderBookData) {
        const bidQuantityAtBest = data.bids.length > 0 ? data.bids[0].quantity : 0;
        const askQuantityAtBest = data.asks.length > 0 ? data.asks[0].quantity : 0;
        onOrderBookData({
          bestBid: data.bestBid,
          bestAsk: data.bestAsk,
          bidQuantityAtBest: bidQuantityAtBest,
          askQuantityAtBest: askQuantityAtBest,
        });
      }
    } catch (error) {
      console.error('Error fetching order book:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [certificateType, onOrderBookData]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrderBook();
  }, [fetchOrderBook]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchOrderBook();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  const handlePriceClick = (price: number, side: 'BUY' | 'SELL') => {
    onPriceClick?.(price, side);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderBook && (
        <ProfessionalOrderBook
          orderBook={{
            bids: orderBook.bids,
            asks: orderBook.asks,
            spread: orderBook.spread,
            bestBid: orderBook.bestBid,
            bestAsk: orderBook.bestAsk,
          }}
          onPriceClick={onPriceClick != null ? handlePriceClick : undefined}
          showFullBook={showFullBook}
        />
      )}
      <div className="flex items-center justify-center text-xs text-navy-500 dark:text-navy-400">
        <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
}
