import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../common';
import { ProfessionalOrderBook } from '../cash-market/ProfessionalOrderBook';
import { MMOrderPlacementModal } from './MMOrderPlacementModal';
import { getAdminOrderBook, placeMarketMakerOrder } from '../../services/api';
import type { OrderBook as OrderBookType, CertificateType } from '../../types';

interface AdminOrderBookSectionProps {
  certificateType: CertificateType;
}

export function AdminOrderBookSection({ certificateType }: AdminOrderBookSectionProps) {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    side: 'BID' | 'ASK';
    prefilledPrice?: number;
  }>({
    side: 'BID',
  });

  // Fetch order book data
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

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchOrderBook();
  }, [fetchOrderBook]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchOrderBook();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrderBook();
  };

  // Open modal to place BID order
  const handlePlaceBid = () => {
    setModalConfig({ side: 'BID' });
    setModalOpen(true);
  };

  // Open modal to place ASK order
  const handlePlaceAsk = () => {
    setModalConfig({ side: 'ASK' });
    setModalOpen(true);
  };

  // Handle price click from order book
  // Clicking on a bid (buy order) -> suggest placing ASK (sell into it)
  // Clicking on an ask (sell order) -> suggest placing BID (buy from it)
  const handlePriceClick = (price: number, side: 'BUY' | 'SELL') => {
    if (side === 'BUY') {
      // User clicked on a bid (buy order), suggest selling
      setModalConfig({ side: 'ASK', prefilledPrice: price });
    } else {
      // User clicked on an ask (sell order), suggest buying
      setModalConfig({ side: 'BID', prefilledPrice: price });
    }
    setModalOpen(true);
  };

  // Submit order
  const handleOrderSubmit = async (order: {
    market_maker_id: string;
    certificate_type: 'CEA' | 'EUA';
    side: 'BID' | 'ASK';
    price: number;
    quantity: number;
  }) => {
    await placeMarketMakerOrder(order);
    // Refresh order book after placing order
    await fetchOrderBook();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handlePlaceBid}
              className="bg-emerald-500 hover:bg-emerald-600"
              icon={<TrendingUp className="w-4 h-4" />}
            >
              Place BID
            </Button>
            <Button
              variant="primary"
              onClick={handlePlaceAsk}
              className="bg-red-500 hover:bg-red-600"
              icon={<TrendingDown className="w-4 h-4" />}
            >
              Place ASK
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        {/* Order Book */}
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

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center text-xs text-navy-500 dark:text-navy-400">
          <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Auto-refreshing every 5 seconds
        </div>
      </div>

      {/* Order Placement Modal */}
      <MMOrderPlacementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleOrderSubmit}
        certificateType={certificateType}
        side={modalConfig.side}
        prefilledPrice={modalConfig.prefilledPrice}
      />
    </>
  );
}
