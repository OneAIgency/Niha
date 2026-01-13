import { useEffect, useRef, useCallback } from 'react';
import { useBackofficeStore } from '../stores/useStore';
import { backofficeRealtimeApi, adminApi, BackofficeWebSocketMessage } from '../services/api';
import type { ContactRequestResponse } from '../types';

const RECONNECT_DELAY = 3000; // 3 seconds
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

export function useBackofficeRealtime() {
  const {
    contactRequests,
    connectionStatus,
    lastUpdated,
    setContactRequests,
    addContactRequest,
    updateContactRequest,
    setConnectionStatus,
  } = useBackofficeStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Fetch initial data
  const fetchContactRequests = useCallback(async () => {
    try {
      const response = await adminApi.getContactRequests({ per_page: 100 });
      if (mountedRef.current) {
        setContactRequests(response.data);
      }
    } catch (err) {
      console.error('[Backoffice] Failed to fetch contact requests:', err);
    }
  }, [setContactRequests]);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: BackofficeWebSocketMessage) => {
    if (!mountedRef.current) return;

    switch (message.type) {
      case 'connected':
        setConnectionStatus('connected');
        break;

      case 'heartbeat':
        // Connection is alive, nothing to do
        break;

      case 'new_request':
        if (message.data) {
          const newRequest: ContactRequestResponse = message.data;
          addContactRequest(newRequest);
        }
        break;

      case 'request_updated':
        if (message.data) {
          const updatedRequest: ContactRequestResponse = message.data;
          updateContactRequest(updatedRequest);
        }
        break;

      case 'request_removed':
        // Not implemented in backend yet, but ready for future use
        break;
    }
  }, [setConnectionStatus, addContactRequest, updateContactRequest]);

  // Connect WebSocket with reconnection logic
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');

    try {
      wsRef.current = backofficeRealtimeApi.connectWebSocket(
        handleMessage,
        () => {
          // onOpen
          if (mountedRef.current) {
            setConnectionStatus('connected');
            // Clear any reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          }
        },
        () => {
          // onClose
          if (mountedRef.current) {
            setConnectionStatus('disconnected');
            // Schedule reconnection
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
          }
        },
        () => {
          // onError
          if (mountedRef.current) {
            setConnectionStatus('error');
          }
        }
      );
    } catch (err) {
      console.error('[Backoffice WS] Connection failed:', err);
      setConnectionStatus('error');
      // Schedule reconnection
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, [handleMessage, setConnectionStatus]);

  // Initialize connection and polling fallback
  useEffect(() => {
    mountedRef.current = true;

    // Fetch initial data
    fetchContactRequests();

    // Connect WebSocket
    connect();

    // Set up polling as fallback (less frequent than prices)
    pollingIntervalRef.current = setInterval(fetchContactRequests, POLLING_INTERVAL);

    return () => {
      mountedRef.current = false;

      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clear timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [connect, fetchContactRequests]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchContactRequests();
  }, [fetchContactRequests]);

  return {
    contactRequests,
    connectionStatus,
    lastUpdated,
    refresh,
  };
}
