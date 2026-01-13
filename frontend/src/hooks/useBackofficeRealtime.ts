import { useEffect, useRef, useCallback } from 'react';
import { useBackofficeStore, KYCDocumentBackoffice } from '../stores/useStore';
import { backofficeRealtimeApi, adminApi, backofficeApi, BackofficeWebSocketMessage } from '../services/api';
import type { ContactRequestResponse } from '../types';

const RECONNECT_DELAY = 3000; // 3 seconds
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

export function useBackofficeRealtime() {
  const {
    contactRequests,
    kycDocuments,
    connectionStatus,
    lastUpdated,
    kycLastUpdated,
    setContactRequests,
    addContactRequest,
    updateContactRequest,
    setKYCDocuments,
    addKYCDocument,
    updateKYCDocument,
    removeKYCDocument,
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

  // Fetch KYC documents
  const fetchKYCDocuments = useCallback(async () => {
    try {
      const documents = await backofficeApi.getKYCDocuments();
      if (mountedRef.current) {
        setKYCDocuments(documents);
      }
    } catch (err) {
      console.error('[Backoffice] Failed to fetch KYC documents:', err);
    }
  }, [setKYCDocuments]);

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

      // KYC Document Events
      case 'kyc_document_uploaded':
        if (message.data) {
          const newDoc: KYCDocumentBackoffice = {
            id: message.data.document_id,
            user_id: message.data.user_id,
            user_email: message.data.user_email,
            document_type: message.data.document_type,
            file_name: message.data.file_name,
            status: message.data.status,
            created_at: message.data.created_at,
          };
          addKYCDocument(newDoc);
        }
        break;

      case 'kyc_document_reviewed':
        if (message.data) {
          updateKYCDocument({
            id: message.data.document_id,
            status: message.data.status,
            notes: message.data.notes,
            reviewed_at: message.data.reviewed_at,
          });
        }
        break;

      case 'kyc_document_deleted':
        if (message.data) {
          removeKYCDocument(message.data.document_id);
        }
        break;
    }
  }, [setConnectionStatus, addContactRequest, updateContactRequest, addKYCDocument, updateKYCDocument, removeKYCDocument]);

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
    fetchKYCDocuments();

    // Connect WebSocket
    connect();

    // Set up polling as fallback (less frequent than prices)
    pollingIntervalRef.current = setInterval(() => {
      fetchContactRequests();
      fetchKYCDocuments();
    }, POLLING_INTERVAL);

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
  }, [connect, fetchContactRequests, fetchKYCDocuments]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchContactRequests();
    fetchKYCDocuments();
  }, [fetchContactRequests, fetchKYCDocuments]);

  return {
    contactRequests,
    kycDocuments,
    connectionStatus,
    lastUpdated,
    kycLastUpdated,
    refresh,
  };
}
