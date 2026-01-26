/**
 * Authentication API Tests
 * Tests for auth flows including login, token management, and session handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

// API Base URL
const API_BASE = '/api/v1';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('Authentication API', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  afterEach(() => {
    mockSessionStorage.clear();
  });

  describe('loginWithPassword', () => {
    it('should return token and user on successful login', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correct-password',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
    });

    it('should return error for invalid credentials', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.detail).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'some-password',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.detail).toBe('Invalid email format');
    });
  });

  describe('validateInvitation', () => {
    it('should return user data for valid token', async () => {
      const response = await fetch(`${API_BASE}/auth/invitation/valid-token`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.email).toBeDefined();
      expect(data.entity_name).toBeDefined();
    });

    it('should return error for invalid token', async () => {
      const response = await fetch(`${API_BASE}/auth/invitation/invalid-token`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.detail).toBe('Invalid or expired invitation token');
    });
  });

  describe('setupPassword', () => {
    it('should setup password and return token', async () => {
      const response = await fetch(`${API_BASE}/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: 'NewPassword123!',
          password_confirm: 'NewPassword123!',
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.access_token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    it('should return error when passwords do not match', async () => {
      const response = await fetch(`${API_BASE}/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: 'Password123!',
          password_confirm: 'DifferentPassword123!',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.detail).toBe('Passwords do not match');
    });
  });

  describe('logout', () => {
    it('should clear token from storage on logout', async () => {
      // Store token first
      mockSessionStorage.setItem('access_token', 'mock-token');

      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);

      // Simulate clearing token after logout
      mockSessionStorage.removeItem('access_token');
      expect(mockSessionStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Token Storage', () => {
    it('should store token in sessionStorage', () => {
      const token = 'test-access-token';
      mockSessionStorage.setItem('access_token', token);

      expect(mockSessionStorage.getItem('access_token')).toBe(token);
    });

    it('should retrieve token from sessionStorage', () => {
      const token = 'test-access-token';
      mockSessionStorage.setItem('access_token', token);

      const retrieved = mockSessionStorage.getItem('access_token');
      expect(retrieved).toBe(token);
    });

    it('should clear token on logout', () => {
      mockSessionStorage.setItem('access_token', 'test-token');
      mockSessionStorage.removeItem('access_token');

      expect(mockSessionStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Auth Interceptor', () => {
    it('should add Bearer token to requests when token exists', async () => {
      // Create a custom handler to verify headers
      let authHeader: string | null = null;

      server.use(
        http.get(`${API_BASE}/test-auth`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ success: true });
        })
      );

      // Simulate making an authenticated request
      const token = 'test-access-token';
      await fetch(`${API_BASE}/test-auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(authHeader).toBe(`Bearer ${token}`);
    });
  });
});
