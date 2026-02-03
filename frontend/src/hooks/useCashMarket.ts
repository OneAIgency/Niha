import { useState, useEffect, useCallback, useRef } from 'react';
import { cashMarketApi } from '../services/api';
import type { OrderBook, Order, CashMarketTrade, CertificateType } from '../types';

interface Balances {
  eur: number;
  cea: number;
  eua: number;
}

interface CashMarketData {
  orderBook: OrderBook | null;
  recentTrades: CashMarketTrade[];
  myOrders: Order[];
  balances: Balances;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching real Cash Market data with polling
 *
 * @param certificateType - CEA or EUA
 * @param pollingInterval - Polling interval in ms (default 5000)
 */
export function useCashMarket(
  certificateType: CertificateType = 'CEA',
  pollingInterval = 5000
): CashMarketData {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [recentTrades, setRecentTrades] = useState<CashMarketTrade[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [balances, setBalances] = useState<Balances>({ eur: 0, cea: 0, eua: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const prevOrderBookRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel for performance
      const [obData, tradesData, ordersData, balancesData] = await Promise.all([
        cashMarketApi.getRealOrderBook(certificateType),
        cashMarketApi.getRecentTrades(certificateType, 20),
        cashMarketApi.getMyOrders({ certificate_type: certificateType }),
        cashMarketApi.getUserBalances(),
      ]);

      if (!isMountedRef.current) return;

      // Only update orderBook if data actually changed (prevent unnecessary re-renders)
      const obJson = JSON.stringify(obData);
      if (obJson !== prevOrderBookRef.current) {
        setOrderBook(obData);
        prevOrderBookRef.current = obJson;
      }

      setRecentTrades(tradesData);
      setMyOrders(ordersData);
      setBalances({
        eur: balancesData.eurBalance,
        cea: balancesData.ceaBalance,
        eua: balancesData.euaBalance,
      });
      setError(null);
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Cash market fetch error:', err);
        setError('Failed to fetch market data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [certificateType]);

  // Initial fetch + polling
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchData();

    // Set up polling
    const interval = setInterval(fetchData, pollingInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData, pollingInterval]);

  return {
    orderBook,
    recentTrades,
    myOrders,
    balances,
    loading,
    error,
    refresh: fetchData,
  };
}
