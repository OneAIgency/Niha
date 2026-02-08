/**
 * useClientRealtime hook tests.
 * Verifies that role_updated WebSocket message triggers getProfile + setAuth.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClientRealtime } from '../useClientRealtime';

let capturedOnMessage: ((msg: { type: string }) => void) | null = null;
const setAuthMock = vi.fn();

const mockState = {
  token: 'mock-jwt',
  isAuthenticated: true,
  setAuth: setAuthMock,
};

vi.mock('../../stores/useStore', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(mockState)),
    { getState: () => mockState }
  ),
}));

vi.mock('../../services/api', () => ({
  clientRealtimeApi: {
    connectWebSocket: vi.fn(
      (
        _token: string,
        onMessage: (msg: { type: string }) => void,
        _onOpen?: () => void,
        _onClose?: () => void
      ) => {
        capturedOnMessage = onMessage;
        return { close: vi.fn() } as unknown as WebSocket;
      }
    ),
  },
  usersApi: {
    getProfile: vi.fn().mockResolvedValue({ id: 'u1', email: 'u@test.com', role: 'CEA' }),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));

const { clientRealtimeApi, usersApi } = await import('../../services/api');

describe('useClientRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnMessage = null;
    vi.mocked(usersApi.getProfile).mockResolvedValue({
      id: 'u1',
      email: 'u@test.com',
      role: 'CEA',
    });
  });

  it('connects when authenticated', async () => {
    renderHook(() => useClientRealtime());
    await waitFor(() => {
      expect(clientRealtimeApi.connectWebSocket).toHaveBeenCalledWith(
        'mock-jwt',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('on role_updated calls getProfile and setAuth', async () => {
    renderHook(() => useClientRealtime());

    await waitFor(() => expect(capturedOnMessage).not.toBeNull());

    capturedOnMessage!({ type: 'role_updated', timestamp: new Date().toISOString() });

    await waitFor(() => {
      expect(usersApi.getProfile).toHaveBeenCalled();
      expect(setAuthMock).toHaveBeenCalledWith(
        { id: 'u1', email: 'u@test.com', role: 'CEA' },
        'mock-jwt'
      );
    });
  });

  it('ignores non-role_updated messages', async () => {
    renderHook(() => useClientRealtime());

    await waitFor(() => expect(capturedOnMessage).not.toBeNull());

    capturedOnMessage!({ type: 'heartbeat', timestamp: new Date().toISOString() });
    capturedOnMessage!({ type: 'connected', timestamp: new Date().toISOString() });

    await new Promise((r) => setTimeout(r, 50));
    expect(usersApi.getProfile).not.toHaveBeenCalled();
  });
});
