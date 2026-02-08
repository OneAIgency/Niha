import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/useStore';
import { clientRealtimeApi, usersApi, ClientWebSocketMessage } from '../services/api';
import { logger } from '../utils/logger';

const RECONNECT_DELAY = 5000;

/**
 * Client realtime hook: WebSocket for authenticated users.
 * On role_updated (e.g. AML→CEA after admin clear deposit), refetches GET /users/me
 * and updates auth store so UI updates without refresh.
 * Mount in Layout or App when user is authenticated.
 */
export function useClientRealtime() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const handleMessage = useCallback(
    (message: ClientWebSocketMessage) => {
      if (!mountedRef.current) return;

      if (message.type === 'role_updated') {
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) return;
        usersApi
          .getProfile()
          .then((user) => {
            if (mountedRef.current) {
              setAuth(user, currentToken);
              logger.debug('Client realtime: user updated after role_updated', { role: user.role });
            }
          })
          .catch((err) => {
            logger.error('Client realtime: failed to refetch profile after role_updated', err);
          });
      }

      if (message.type === 'balance_updated') {
        // Dispatch window event so dashboard (and any page) refreshes balances immediately
        window.dispatchEvent(
          new CustomEvent('nihao:balanceUpdated', {
            detail: message.data ?? { type: 'balance_updated', source: 'websocket' },
          }),
        );
        logger.debug('Client realtime: balance_updated received, dispatched nihao:balanceUpdated');
      }

      if (message.type === 'deposit_status_updated') {
        window.dispatchEvent(new CustomEvent('nihao:depositUpdated', { detail: message.data }));
        logger.debug('Client realtime: deposit_status_updated', message.data);
      }

      if (message.type === 'kyc_status_updated') {
        window.dispatchEvent(new CustomEvent('nihao:kycUpdated', { detail: message.data }));
        logger.debug('Client realtime: kyc_status_updated', message.data);
      }

      if (message.type === 'swap_updated') {
        window.dispatchEvent(new CustomEvent('nihao:swapUpdated', { detail: message.data }));
        logger.debug('Client realtime: swap_updated', message.data);
      }

      if (message.type === 'settlement_updated') {
        window.dispatchEvent(new CustomEvent('nihao:settlementUpdated', { detail: message.data }));
        logger.debug('Client realtime: settlement_updated', message.data);
      }

      if (message.type === 'orderbook_updated') {
        window.dispatchEvent(new CustomEvent('nihao:orderbookUpdated', { detail: message.data }));
        logger.debug('Client realtime: orderbook_updated', message.data);
      }

      if (message.type === 'user_deactivated') {
        logger.info('Client realtime: user_deactivated — forcing logout');
        useAuthStore.getState().logout();
      }

      if (message.type === 'notification') {
        window.dispatchEvent(new CustomEvent('nihao:notification', { detail: message.data }));
        logger.debug('Client realtime: notification', message.data);
      }
    },
    [setAuth]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !token) {
      return;
    }

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      wsRef.current = clientRealtimeApi.connectWebSocket(
        currentToken,
        handleMessage,
        () => {},
        () => {
          wsRef.current = null;
          if (mountedRef.current && useAuthStore.getState().isAuthenticated) {
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
          }
        }
      );
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          logger.error('Error closing client WebSocket', e);
        }
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, handleMessage]);
}
