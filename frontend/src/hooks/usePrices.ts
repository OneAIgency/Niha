import { useEffect, useRef, useState } from 'react';
import { usePricesStore } from '../stores/useStore';
import { pricesApi } from '../services/api';

export function usePrices() {
  const { prices, loading, error, setPrices, setLoading, setError } = usePricesStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch initial prices
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const data = await pricesApi.getCurrent();
        setPrices(data);
      } catch (err) {
        setError('Failed to fetch prices');
        console.error('Price fetch error:', err);
      }
    };

    fetchPrices();

    // Set up WebSocket connection
    try {
      wsRef.current = pricesApi.connectWebSocket((newPrices) => {
        setPrices(newPrices);
      });

      wsRef.current.onerror = () => {
        console.warn('WebSocket error, falling back to polling');
      };
    } catch {
      // WebSocket not available
    }

    // Set up polling as fallback
    const interval = setInterval(fetchPrices, 30000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setPrices, setLoading, setError]);

  return { prices, loading, error };
}

export function usePriceHistory(hours: number = 24) {
  const [history, setHistory] = useState<{ eua: any[]; cea: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await pricesApi.getHistory(hours);
        setHistory(data);
      } catch (err) {
        console.error('Price history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [hours]);

  return { history, loading };
}
