import { useEffect, useRef, useState } from 'react';
import { usePricesStore } from '../stores/useStore';
import { pricesApi } from '../services/api';
import { logger } from '../utils/logger';
import type { PriceHistory } from '../types';

export function usePrices() {
  const { prices, loading, error, setPrices, setLoading, setError } = usePricesStore();
  const wsRef = useRef<WebSocket | null>(null);
  const wsAttempted = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial prices
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const data = await pricesApi.getCurrent();
        if (isMounted) {
          setPrices(data);
        }
        return true; // Success
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch prices');
        }
        console.error('Price fetch error:', err);
        return false; // Failed
      }
    };

    // Initial fetch, then try WebSocket
    const init = async () => {
      const success = await fetchPrices();

      // Only attempt WebSocket once and only if initial fetch succeeded
      if (success && !wsAttempted.current && isMounted) {
        wsAttempted.current = true;

        // Delay WebSocket connection to let the backend be ready
        setTimeout(() => {
          if (!isMounted) return;

          try {
            wsRef.current = pricesApi.connectWebSocket((newPrices) => {
              if (isMounted) {
                setPrices(newPrices);
              }
            });

            // Silent error handling - polling is the fallback
            wsRef.current.onerror = () => {
              // WebSocket failed, polling will handle updates
            };

            wsRef.current.onclose = () => {
              // Connection closed, polling continues
            };
          } catch {
            // WebSocket not available, polling continues
          }
        }, 1000); // 1 second delay
      }
    };

    init();

    // Set up polling as primary/fallback mechanism
    const interval = setInterval(fetchPrices, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      // Properly cleanup WebSocket connection
      if (wsRef.current) {
        try {
          wsRef.current.onerror = null;
          wsRef.current.onclose = null;
          wsRef.current.onmessage = null;
          if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close();
          }
          wsRef.current = null;
        } catch (error) {
          logger.error('Error closing WebSocket', error);
        }
      }
    };
  }, [setPrices, setLoading, setError]);

  return { prices, loading, error };
}

export function usePriceHistory(hours: number = 24) {
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await pricesApi.getHistory(hours);
        setHistory(data);
      } catch (err) {
        logger.error('Price history error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [hours]);

  return { history, loading };
}
