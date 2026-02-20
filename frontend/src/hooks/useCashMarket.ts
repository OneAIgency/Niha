import { useState, useEffect, useCallback, useRef } from 'react';
import { cashMarketApi } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
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

      // Deduplicate by trade ID (auto-trade can produce rapid duplicates)
      const seen = new Set<string>();
      const uniqueTrades = tradesData.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setRecentTrades(uniqueTrades);
      setMyOrders(ordersData);
      setBalances({
        eur: balancesData.eurBalance,
        cea: balancesData.ceaBalance,
        eua: balancesData.euaBalance,
      });
      setError(null);
    } catch (err: unknown) {
      if (isMountedRef.current) {
        console.error('Cash market fetch error:', err);
        setError(getApiErrorMessage(err));
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

    // Set up polling (fallback — WS is the primary update mechanism)
    const interval = setInterval(fetchData, pollingInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData, pollingInterval]);

  // Listen for WebSocket-driven order book and balance updates (same source for ticker + ACTIVITY)
  useEffect(() => {
    const handler = () => { fetchData(); };
    window.addEventListener('nihao:orderbookUpdated', handler);
    window.addEventListener('nihao:balanceUpdated', handler);
    return () => {
      window.removeEventListener('nihao:orderbookUpdated', handler);
      window.removeEventListener('nihao:balanceUpdated', handler);
    };
  }, [fetchData]);

  // Prepend new trade from WS so ticker and ACTIVITY update in sync (no delay vs refetch)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ trade: import('../types').CashMarketTrade }>).detail;
      if (!detail?.trade) return;
      setRecentTrades((prev) => {
        // Skip if already present (WS + poll race)
        if (prev.some((t) => t.id === detail.trade.id)) return prev;
        return [detail.trade, ...prev].slice(0, 20);
      });
    };
    window.addEventListener('nihao:tradeExecuted', handler);
    return () => window.removeEventListener('nihao:tradeExecuted', handler);
  }, []);

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
