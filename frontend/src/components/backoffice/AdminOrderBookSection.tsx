import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { ProfessionalOrderBook } from '../cash-market/ProfessionalOrderBook';
import { getAdminOrderBook } from '../../services/api';
import type { OrderBook as OrderBookType, CertificateType } from '../../types';

interface AdminOrderBookSectionProps {
  certificateType: CertificateType;
  /** Called when user clicks a price in the order book (e.g. to open placement modal) */
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
}

export function AdminOrderBookSection({ certificateType, onPriceClick }: AdminOrderBookSectionProps) {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrderBook = useCallback(async () => {
    try {
      const response = await getAdminOrderBook(certificateType);
      setOrderBook(response.data);
    } catch (error) {
      console.error('Error fetching order book:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [certificateType]);

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
            best_bid: orderBook.best_bid,
            best_ask: orderBook.best_ask,
          }}
          onPriceClick={onPriceClick != null ? handlePriceClick : undefined}
        />
      )}
      <div className="flex items-center justify-center text-xs text-navy-500 dark:text-navy-400">
        <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
}
