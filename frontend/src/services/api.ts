import axios from 'axios';
import type {
  Prices,
  PriceHistory,
  Certificate,
  SwapRequest,
  SwapCalculation,
  MarketStats,
  ContactRequest,
  MessageResponse,
  PaginatedResponse,
  User,
  UserRole,
  ActivityLog,
  KYCDocument,
  ScrapingSource,
  ScrapeLibrary,
  UserSession,
  CertificateType,
  OrderSide,
  Order,
  OrderBook,
  MarketDepth,
  CashMarketTrade,
  CashMarketStats,
  AdminUserFull,
  AdminUserUpdate,
  AdminPasswordReset,
  AuthenticationAttempt,
  Deposit,
  DepositCreate,
  EntityBalance,
  MarketMaker,
  MarketMakerType,
  MarketMakerQueryParams,
  MarketMakerTransaction,
  SettlementBatch,
  Trade,
  TransactionType,
} from '../types';
import type { FundingInstructions } from '../types/funding';
import type { AdminDashboardStats } from '../types/admin';
import { MARKET_MAKER_TYPES } from '../types';
import type {
  LiquidityPreviewResponse,
  LiquidityCreationRequest,
  LiquidityCreationResponse,
} from '../types/liquidity';
import { logger } from '../utils/logger';
import { transformKeysToCamelCase, transformKeysToSnakeCase } from '../utils/dataTransform';
import { TOKEN_KEY } from '../constants/auth';
import { useAuthStore } from '../stores/useStore';

// Flag to prevent multiple redirects during auth failures
let isRedirectingToLogin = false;

// Secure token storage utility
// Note: For production, tokens should be stored in httpOnly cookies (requires backend changes)

function getToken(): string | null {
  try {
    // Use sessionStorage instead of localStorage for better security
    // Still vulnerable to XSS, but better than localStorage
    // TODO: Migrate to httpOnly cookies for production
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function removeToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    logger.error('Failed to remove token', error);
  }
}

// Dynamic API URL detection for LAN/remote access
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    logger.debug('Using VITE_API_URL', { url: import.meta.env.VITE_API_URL });
    return import.meta.env.VITE_API_URL;
  }

  const { protocol, hostname, port } = window.location;
  logger.debug('Detecting API URL', { protocol, hostname, port });

  // If running on Vite dev server (port 5173), use relative URLs
  // Vite proxy handles forwarding /api requests to the backend
  if (port === '5173') {
    logger.debug('Using relative URLs (Vite dev server proxy)');
    return '';
  }

  // Guard against empty hostname
  if (!hostname) {
    logger.warn('Empty hostname detected, falling back to relative URLs');
    return '';
  }

  // For production/other access, construct URL from current hostname
  // Assume backend runs on port 8000
  const apiUrl = `${protocol}//${hostname}:8000`;
  logger.debug('Constructed API URL', { url: apiUrl });
  return apiUrl;
};

const API_BASE = getApiBaseUrl();
logger.debug('API base URL initialized', { base: API_BASE });

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests and handle FormData
api.interceptors.request.use((config) => {
  const token = getToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove Content-Type for FormData to let browser set it with correct boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor: Transform response data and handle errors
api.interceptors.response.use(
  (response) => {
    // Transform response data from snake_case to camelCase (frontend expects camelCase)
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeysToCamelCase(response.data);
    }
    return response;
  },
  async (error) => {
    // Standardize error response format
    const standardizedError = {
      message: error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };

    // 401 = invalid/expired token
    if (error.response?.status === 401) {
      // Check if we're on the login page - don't redirect if already there
      if (window.location.pathname === '/login') {
        logger.debug('[API] 401 on login page, not redirecting');
        return Promise.reject(standardizedError);
      }
      
      // Prevent multiple redirects and logout the user properly
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        logger.warn('[API] 401 Unauthorized - logging out and redirecting to login');
        
        // Clear token from storage
        removeToken();
        
        // Clear Zustand auth state - this is CRITICAL to prevent loops
        // The store's logout() also removes token, but we do both for safety
        useAuthStore.getState().logout();
        
        // Small delay to allow state to update before redirect
        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = '/login';
        }, 100);
      }
      return Promise.reject(standardizedError);
    }

    // 403 with "Not authenticated" = missing token (HTTPBearer)
    if (error.response?.status === 403) {
      let detail = error.response?.data?.detail;

      // Handle blob responses (e.g., file downloads)
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          detail = json.detail;
        } catch {
          // Not JSON, ignore
        }
      }

      if (detail === 'Not authenticated' && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        logger.warn('[API] 403 Not authenticated - logging out and redirecting to login');
        removeToken();
        useAuthStore.getState().logout();
        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = '/login';
        }, 100);
      }
    }

    // Log error for debugging
    logger.error('API request failed', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: standardizedError.message,
    });

    return Promise.reject(standardizedError);
  }
);

// Auth API
export const authApi = {
  requestMagicLink: async (email: string): Promise<MessageResponse> => {
    const { data } = await api.post('/auth/magic-link', { email });
    return data;
  },

  verifyMagicLink: async (token: string): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post('/auth/verify', { token });
    return data;
  },

  loginWithPassword: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    removeToken();
  },

  // Validate invitation token
  validateInvitation: async (token: string): Promise<{
    valid: boolean;
    email: string;
    first_name: string;
    last_name: string;
  }> => {
    const { data } = await api.get(`/auth/validate-invitation/${token}`);
    return data;
  },

  // Setup password from invitation
  setupPassword: async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post('/auth/setup-password', null, {
      params: { token, password, confirm_password: confirmPassword }
    });
    return data;
  },
};

// Contact API
export const contactApi = {
  submitRequest: async (request: ContactRequest): Promise<MessageResponse> => {
    const { data } = await api.post('/contact/request', request);
    return data;
  },

  submitNDARequest: async (request: {
    entity_name: string;
    contact_email: string;
    contact_name: string;
    position: string;
    nda_file: File;
  }): Promise<MessageResponse> => {
    const formData = new FormData();
    formData.append('entity_name', request.entity_name);
    formData.append('contact_email', request.contact_email);
    formData.append('contact_name', request.contact_name);
    formData.append('position', request.position);
    formData.append('file', request.nda_file);

    const { data } = await api.post('/contact/nda-request', formData);
    return data;
  },
};

// Prices API
export const pricesApi = {
  getCurrent: async (): Promise<Prices> => {
    const { data } = await api.get('/prices/current');
    return data;
  },

  getHistory: async (hours: number = 24): Promise<PriceHistory> => {
    const { data } = await api.get(`/prices/history?hours=${hours}`);
    return data;
  },

  // WebSocket connection for live prices
  connectWebSocket: (onMessage: (prices: Prices) => void): WebSocket => {
    const getWsUrl = (): string => {
      // If VITE_WS_URL is explicitly set, use it
      if (import.meta.env.VITE_WS_URL) {
        logger.debug('Using VITE_WS_URL for WebSocket', { url: import.meta.env.VITE_WS_URL });
        return `${import.meta.env.VITE_WS_URL}/api/v1/prices/ws`;
      }

      const { protocol, hostname, port } = window.location;
      logger.debug('Detecting WebSocket URL', { protocol, hostname, port });

      // If running on Vite dev server (port 5173), use relative WebSocket URL
      // Vite proxy handles forwarding /api requests (including WebSocket) to the backend
      if (port === '5173') {
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${hostname}:${port}/api/v1/prices/ws`;
        logger.debug('Using Vite proxy WebSocket URL', { url: wsUrl });
        return wsUrl;
      }

      // For production/other access, construct URL from current hostname
      // Assume backend runs on port 8000
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${hostname}:8000/api/v1/prices/ws`;
      logger.debug('Using direct WebSocket URL', { url: wsUrl });
      return wsUrl;
    };

    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Transform data from snake_case to camelCase
        const transformedData = transformKeysToCamelCase<Prices>(data);
        onMessage(transformedData);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', error);
      }
    };

    ws.onerror = (error) => {
      logger.error('WebSocket error', error);
    };

    return ws;
  },
};

// Backoffice Realtime Types
export interface BackofficeWebSocketMessage {
  type: 'connected' | 'heartbeat' | 'new_request' | 'request_updated' | 'request_removed' | 'kyc_document_uploaded' | 'kyc_document_reviewed' | 'kyc_document_deleted';
  data?: any;
  message?: string;
  timestamp: string;
}

// Backoffice Realtime API
export const backofficeRealtimeApi = {
  connectWebSocket: (
    onMessage: (message: BackofficeWebSocketMessage) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (error: Event) => void
  ): WebSocket => {
    const getWsUrl = (): string => {
      // If VITE_WS_URL is explicitly set, use it
      if (import.meta.env.VITE_WS_URL) {
        return `${import.meta.env.VITE_WS_URL}/api/v1/backoffice/ws`;
      }

      const { protocol, hostname, port } = window.location;

      // If running on Vite dev server (port 5173), use relative WebSocket URL
      if (port === '5173') {
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProtocol}//${hostname}:${port}/api/v1/backoffice/ws`;
      }

      // For production/other access, construct URL from current hostname
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${hostname}:8000/api/v1/backoffice/ws`;
    };

    const wsUrl = getWsUrl();
    logger.debug('Connecting to backoffice WebSocket', { url: wsUrl });
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      logger.debug('Backoffice WebSocket connected');
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BackofficeWebSocketMessage;
        // Transform data from snake_case to camelCase
        const transformedData = transformKeysToCamelCase<BackofficeWebSocketMessage>(data);
        logger.debug('Backoffice WebSocket message received', { type: transformedData.type });
        onMessage(transformedData);
      } catch (err) {
        logger.error('Failed to parse backoffice WebSocket message', err);
      }
    };

    ws.onclose = () => {
      logger.debug('Backoffice WebSocket disconnected');
      onClose?.();
    };

    ws.onerror = (error) => {
      logger.error('Backoffice WebSocket error', error);
      onError?.(error);
    };

    return ws;
  },
};

// Marketplace API
export const marketplaceApi = {
  getCEAListings: async (params?: {
    sort_by?: string;
    min_quantity?: number;
    max_quantity?: number;
    min_price?: number;
    max_price?: number;
    vintage_year?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Certificate>> => {
    const { data } = await api.get('/marketplace/cea', { params });
    return data;
  },

  getEUAListings: async (params?: {
    sort_by?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Certificate>> => {
    const { data } = await api.get('/marketplace/eua', { params });
    return data;
  },

  getStats: async (): Promise<MarketStats & { current_prices: Prices }> => {
    const { data } = await api.get('/marketplace/stats');
    return data;
  },

  getListing: async (code: string): Promise<Certificate> => {
    const { data } = await api.get(`/marketplace/listing/${code}`);
    return data;
  },
};

// Swaps API
export const swapsApi = {
  getAvailable: async (params?: {
    direction?: 'eua_to_cea' | 'cea_to_eua' | 'all';
    min_quantity?: number;
    max_quantity?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<SwapRequest>> => {
    const { data } = await api.get('/swaps/available', { params });
    return data;
  },

  getRate: async (): Promise<{
    eua_to_cea: number;
    cea_to_eua: number;
    eua_price_usd: number;
    cea_price_usd: number;
    explanation: string;
    platform_fee_pct: number;
    effective_rate: number;
    rate_change_24h?: number;
    eua_change_24h?: number;
    cea_change_24h?: number;
  }> => {
    const { data } = await api.get('/swaps/rate');
    return data;
  },

  calculate: async (from_type: string, quantity: number): Promise<SwapCalculation> => {
    const { data } = await api.get('/swaps/calculator', {
      params: { from_type, quantity },
    });
    return data;
  },

  getStats: async (): Promise<{
    open_swaps: number;
    matched_today: number;
    eua_to_cea_requests: number;
    cea_to_eua_requests: number;
    total_eua_volume: number;
    total_cea_volume: number;
    current_rate: number;
    avg_requested_rate: number;
  }> => {
    const { data } = await api.get('/swaps/stats');
    return data;
  },

  createSwapRequest: async (request: {
    from_type: 'CEA' | 'EUA';
    to_type: 'CEA' | 'EUA';
    quantity: number;
    desired_rate?: number;
  }): Promise<SwapRequest> => {
    const { data } = await api.post('/swaps', request);
    return data;
  },

  executeSwap: async (swapId: string): Promise<{
    success: boolean;
    message: string;
    swap_id: string;
    swap_reference: string;
    from_quantity: number;
    to_quantity: number;
    rate: number;
    from_balance_after: number;
    to_balance_after: number;
  }> => {
    const { data } = await api.post(`/swaps/${swapId}/execute`);
    return data;
  },

  getMySwaps: async (status?: string): Promise<{ data: SwapRequest[] }> => {
    const { data } = await api.get('/swaps/my', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  getSwapOffers: async (): Promise<{
    offers: Array<{
      market_maker_id: string;
      market_maker_name: string;
      direction: 'CEA_TO_EUA' | 'EUA_TO_CEA';
      ratio: number;
      eua_available?: number;
      cea_available?: number;
      rate: number;
    }>;
    count: number;
  }> => {
    const { data } = await api.get('/swaps/offers');
    return data;
  },
};

// Users API (Profile management)
export const usersApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/users/me');
    return data;
  },

  updateProfile: async (update: Partial<User>): Promise<User> => {
    const { data } = await api.put('/users/me', update);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<MessageResponse> => {
    const { data } = await api.put('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  },

  getActivity: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<ActivityLog>> => {
    const { data } = await api.get('/users/me/activity', { params });
    return data;
  },

  getSessions: async (): Promise<UserSession[]> => {
    const { data } = await api.get('/users/me/sessions');
    return data;
  },

  // Deposit reporting (APPROVED users)
  reportDeposit: async (amount: number, currency: string, wire_reference?: string): Promise<MessageResponse> => {
    const { data } = await api.post('/users/me/deposits/report', {
      amount,
      currency,
      wire_reference,
    });
    return data;
  },

  getMyDeposits: async (): Promise<Deposit[]> => {
    const { data } = await api.get('/users/me/deposits');
    return data;
  },

  getMyEntity: async (): Promise<Entity | null> => {
    const { data } = await api.get('/users/me/entity');
    return data || null;
  },

  getMyEntityBalance: async (): Promise<EntityBalance> => {
    const { data } = await api.get('/users/me/entity/balance');
    return data;
  },

  getMyEntityAssets: async (): Promise<{
    entity_id: string;
    entity_name: string;
    eur_balance: number;
    cea_balance: number;
    eua_balance: number;
  }> => {
    const { data } = await api.get('/users/me/entity/assets');
    return data;
  },

  getMyHoldings: async (): Promise<{
    eur: number;
    cea: number;
    eua: number;
  }> => {
    const { data } = await api.get('/users/me/entity/assets');
    return {
      eur: data.eur_balance || 0,
      cea: data.cea_balance || 0,
      eua: data.eua_balance || 0,
    };
  },

  getFundingInstructions: async (): Promise<FundingInstructions> => {
    const { data } = await api.get('/users/me/funding-instructions');
    return data;
  },
};

// Admin API
export const adminApi = {
  // Contact Requests
  getContactRequests: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<any>> => {
    const { data } = await api.get('/admin/contact-requests', { params });
    return data;
  },

  updateContactRequest: async (id: string, update: any): Promise<MessageResponse> => {
    const { data } = await api.put(`/admin/contact-requests/${id}`, update);
    return data;
  },

  // Delete contact request
  deleteContactRequest: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/admin/contact-requests/${id}`);
    return data;
  },

  // Create user from contact request (approve & invite)
  createUserFromRequest: async (
    requestId: string,
    userData: {
      email: string;
      first_name: string;
      last_name: string;
      mode: 'manual' | 'invitation';
      password?: string;
      position?: string;
    }
  ): Promise<{
    message: string;
    success: boolean;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      entity_id: string;
      creation_method: string;
    };
  }> => {
    const { data } = await api.post('/admin/users/create-from-request', null, {
      params: {
        request_id: requestId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        mode: userData.mode,
        password: userData.password,
        position: userData.position,
      }
    });
    return data;
  },

  // Download NDA file (programmatic download with auth)
  downloadNDA: async (requestId: string, fileName: string): Promise<void> => {
    const response = await api.get(`/admin/contact-requests/${requestId}/nda`, {
      responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'nda.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // IP WHOIS Lookup
  lookupIP: async (ipAddress: string): Promise<{
    ip: string;
    country: string;
    country_code: string;
    region: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
  }> => {
    const { data } = await api.get(`/admin/ip-lookup/${ipAddress}`);
    return data;
  },

  getDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  // User Management
  getUsers: async (params?: {
    role?: UserRole;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  createUser: async (userData: {
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    password?: string;
    entity_id?: string;
  }): Promise<User> => {
    const { data } = await api.post('/admin/users', userData);
    return data;
  },

  getUser: async (id: string): Promise<User> => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  updateUser: async (id: string, update: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/admin/users/${id}`, update);
    return data;
  },

  changeUserRole: async (id: string, role: UserRole): Promise<User> => {
    const { data } = await api.put(`/admin/users/${id}/role`, { role });
    return data;
  },

  deleteUser: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  // Full User Details (with auth history, sessions, stats)
  getUserFull: async (id: string): Promise<AdminUserFull> => {
    const { data } = await api.get(`/admin/users/${id}/full`);
    return data;
  },

  // Update any user field
  updateUserFull: async (id: string, update: AdminUserUpdate): Promise<User> => {
    const { data } = await api.put(`/admin/users/${id}`, update);
    return data;
  },

  // Reset user password
  resetUserPassword: async (id: string, reset: AdminPasswordReset): Promise<MessageResponse> => {
    const { data } = await api.post(`/admin/users/${id}/reset-password`, reset);
    return data;
  },

  // Get user auth history
  getUserAuthHistory: async (
    id: string,
    params?: { page?: number; per_page?: number }
  ): Promise<PaginatedResponse<AuthenticationAttempt>> => {
    const { data } = await api.get(`/admin/users/${id}/auth-history`, { params });
    return data;
  },

  // Activity Logs
  getActivityLogs: async (params?: {
    user_id?: string;
    action?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<ActivityLog>> => {
    const { data } = await api.get('/admin/activity-logs', { params });
    return data;
  },

  getActivityStats: async (): Promise<{
    total_users: number;
    users_by_role: Record<UserRole, number>;
    active_sessions: number;
    logins_today: number;
    avg_session_duration: number;
  }> => {
    const { data } = await api.get('/admin/activity-logs/stats');
    return data;
  },

  // Scraping Sources
  getScrapingSources: async (): Promise<ScrapingSource[]> => {
    const { data } = await api.get('/admin/scraping-sources');
    return data;
  },

  updateScrapingSource: async (id: string, update: Partial<ScrapingSource>): Promise<ScrapingSource> => {
    const { data } = await api.put(`/admin/scraping-sources/${id}`, update);
    return data;
  },

  testScrapingSource: async (id: string): Promise<{ success: boolean; message: string; price?: number }> => {
    const { data } = await api.post(`/admin/scraping-sources/${id}/test`);
    return data;
  },

  refreshScrapingSource: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.post(`/admin/scraping-sources/${id}/refresh`);
    return data;
  },

  deleteScrapingSource: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/admin/scraping-sources/${id}`);
    return data;
  },

  createScrapingSource: async (source: {
    name: string;
    url: string;
    certificate_type: 'EUA' | 'CEA';
    scrape_library?: ScrapeLibrary;
    scrape_interval_minutes: number;
  }): Promise<ScrapingSource> => {
    const { data } = await api.post('/admin/scraping-sources', source);
    return data;
  },

  // Market Overview
  getMarketOverview: async (): Promise<{
    top_20_cea_value_usd: number;
    top_20_swap_value_usd: number;
  }> => {
    const { data } = await api.get('/admin/market-overview');
    return data;
  },
};

// Backoffice API (KYC review, user approvals)
export const backofficeApi = {
  // Pending Users/Access Requests
  getPendingUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/backoffice/pending-users');
    return data;
  },

  approveUser: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/users/${id}/approve`);
    return data;
  },

  rejectUser: async (id: string, reason: string): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/users/${id}/reject`, { reason });
    return data;
  },

  // KYC Documents
  getKYCDocuments: async (userId?: string): Promise<KYCDocument[]> => {
    const { data } = await api.get('/backoffice/kyc-documents', {
      params: userId ? { user_id: userId } : undefined,
    });
    return data;
  },

  reviewDocument: async (
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/kyc-documents/${id}/review`, {
      status,
      notes,
    });
    return data;
  },

  // Get document content as blob for preview
  getDocumentContent: async (documentId: string): Promise<Blob> => {
    const response = await api.get(`/backoffice/kyc-documents/${documentId}/content`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // User Details
  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    const { data } = await api.get(`/backoffice/users/${userId}/sessions`);
    return data;
  },

  getUserTrades: async (userId: string): Promise<Trade[]> => {
    const { data } = await api.get(`/backoffice/users/${userId}/trades`);
    return data;
  },

  getUserDeposits: async (userId: string): Promise<Deposit[]> => {
    const { data } = await api.get(`/backoffice/users/${userId}/deposits`);
    return data;
  },

  // Deposit Management
  getDeposits: async (params?: {
    status?: string;
    entity_id?: string;
  }): Promise<Deposit[]> => {
    const { data } = await api.get('/backoffice/deposits', { params });
    return data;
  },

  createDeposit: async (deposit: DepositCreate): Promise<MessageResponse> => {
    const { data } = await api.post('/backoffice/deposits', deposit);
    return data;
  },

  getDeposit: async (depositId: string): Promise<Deposit> => {
    const { data } = await api.get(`/backoffice/deposits/${depositId}`);
    return data;
  },

  getEntityBalance: async (entityId: string): Promise<EntityBalance> => {
    const { data } = await api.get(`/backoffice/entities/${entityId}/balance`);
    return data;
  },

  // Confirm pending deposit with actual received amount
  confirmDeposit: async (
    depositId: string,
    amount: number,
    currency: string,
    notes?: string
  ): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/deposits/${depositId}/confirm`, {
      amount,
      currency,
      notes,
    });
    return data;
  },

  // Reject pending deposit
  rejectDeposit: async (depositId: string): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/deposits/${depositId}/reject`);
    return data;
  },

  // Get all pending deposits
  getPendingDeposits: async (): Promise<Deposit[]> => {
    const { data } = await api.get('/backoffice/deposits', {
      params: { status: 'pending' },
    });
    return data;
  },

  // Asset Management
  addAsset: async (entityId: string, request: {
    asset_type: 'EUR' | 'CEA' | 'EUA';
    amount: number;
    reference?: string;
    notes?: string;
  }): Promise<MessageResponse> => {
    const { data } = await api.post(`/backoffice/entities/${entityId}/add-asset`, request);
    return data;
  },

  getEntityAssets: async (entityId: string): Promise<{
    entity_id: string;
    entity_name: string;
    eur_balance: number;
    cea_balance: number;
    eua_balance: number;
    recent_transactions: Array<{
      id: string;
      entity_id: string;
      asset_type: string;
      transaction_type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference?: string;
      notes?: string;
      created_by: string;
      created_at: string;
    }>;
  }> => {
    const { data } = await api.get(`/backoffice/entities/${entityId}/assets`);
    return data;
  },

  getEntityTransactions: async (entityId: string, assetType?: 'EUR' | 'CEA' | 'EUA'): Promise<Array<{
    id: string;
    entity_id: string;
    asset_type: string;
    transaction_type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference?: string;
    notes?: string;
    created_by: string;
    created_at: string;
  }>> => {
    const { data } = await api.get(`/backoffice/entities/${entityId}/transactions`, {
      params: assetType ? { asset_type: assetType } : undefined,
    });
    return data;
  },

  // Update asset balance (admin edit)
  updateAssetBalance: async (entityId: string, assetType: 'EUR' | 'CEA' | 'EUA', request: {
    new_balance: number;
    notes?: string;
    reference?: string;
  }): Promise<MessageResponse> => {
    const { data } = await api.put(`/backoffice/entities/${entityId}/assets/${assetType}`, request);
    return data;
  },

  // Get entity orders (admin)
  getEntityOrders: async (entityId: string, params?: {
    status?: string;
    certificate_type?: string;
    limit?: number;
  }): Promise<Order[]> => {
    const { data } = await api.get(`/backoffice/entities/${entityId}/orders`, { params });
    return data;
  },

  // Admin cancel order
  adminCancelOrder: async (orderId: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/backoffice/orders/${orderId}`);
    return data;
  },

  // Admin update order
  adminUpdateOrder: async (orderId: string, update: {
    price?: number;
    quantity?: number;
  }): Promise<Order & { message: string }> => {
    const { data } = await api.put(`/backoffice/orders/${orderId}`, update);
    return data;
  },
};

// Onboarding API (KYC document upload for pending users)
export const onboardingApi = {
  getStatus: async (): Promise<{
    documents_uploaded: number;
    documents_required: number;
    documents: KYCDocument[];
    can_submit: boolean;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
  }> => {
    const { data } = await api.get('/onboarding/status');
    return data;
  },

  uploadDocument: async (
    type: string,
    file: File
  ): Promise<KYCDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);

    // Don't set Content-Type manually - axios will set it with correct boundary for FormData
    const { data } = await api.post('/onboarding/documents', formData);
    return data;
  },

  getDocuments: async (): Promise<KYCDocument[]> => {
    const { data } = await api.get('/onboarding/documents');
    return data;
  },

  deleteDocument: async (id: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/onboarding/documents/${id}`);
    return data;
  },

  submit: async (): Promise<MessageResponse> => {
    const { data } = await api.post('/onboarding/submit');
    return data;
  },
};

// Cash Market API
export const cashMarketApi = {
  getOrderBook: async (certificateType: CertificateType): Promise<OrderBook> => {
    const { data } = await api.get(`/cash-market/orderbook/${certificateType}`);
    return data;
  },

  getMarketDepth: async (certificateType: CertificateType): Promise<MarketDepth> => {
    const { data } = await api.get(`/cash-market/depth/${certificateType}`);
    return data;
  },

  getRecentTrades: async (
    certificateType: CertificateType,
    limit: number = 50
  ): Promise<CashMarketTrade[]> => {
    const { data } = await api.get(`/cash-market/trades/${certificateType}`, {
      params: { limit },
    });
    return data;
  },

  getMarketStats: async (certificateType: CertificateType): Promise<CashMarketStats> => {
    const { data } = await api.get(`/cash-market/stats/${certificateType}`);
    return data;
  },

  placeOrder: async (order: {
    certificate_type: CertificateType;
    side: OrderSide;
    price: number;
    quantity: number;
  }): Promise<MessageResponse> => {
    const { data } = await api.post('/cash-market/orders', order);
    return data;
  },

  getMyOrders: async (params?: {
    status?: string;
    certificate_type?: CertificateType;
  }): Promise<Order[]> => {
    const { data } = await api.get('/cash-market/orders/my', { params });
    return data;
  },

  cancelOrder: async (orderId: string): Promise<MessageResponse> => {
    const { data } = await api.delete(`/cash-market/orders/${orderId}`);
    return data;
  },

  // NEW REAL TRADING ENDPOINTS

  getUserBalances: async (): Promise<{
    entity_id: string | null;
    eur_balance: number;
    cea_balance: number;
    eua_balance: number;
  }> => {
    const { data } = await api.get('/cash-market/user/balances');
    return data;
  },

  getRealOrderBook: async (certificateType: CertificateType): Promise<OrderBook> => {
    const { data } = await api.get(`/cash-market/real/orderbook/${certificateType}`);
    return data;
  },

  previewOrder: async (request: {
    certificate_type: CertificateType;
    side: OrderSide;
    amount_eur?: number;
    quantity?: number;
    order_type?: 'MARKET' | 'LIMIT';
    limit_price?: number;
    all_or_none?: boolean;
  }): Promise<{
    certificate_type: string;
    side: string;
    order_type: string;
    amount_eur: number | null;
    quantity_requested: number | null;
    limit_price: number | null;
    all_or_none: boolean;
    fills: Array<{
      seller_code: string;
      price: number;
      quantity: number;
      cost: number;
    }>;
    total_quantity: number;
    total_cost_gross: number;
    weighted_avg_price: number;
    best_price: number | null;
    worst_price: number | null;
    platform_fee_rate: number;
    platform_fee_amount: number;
    total_cost_net: number;
    net_price_per_unit: number;
    available_balance: number;
    remaining_balance: number;
    can_execute: boolean;
    execution_message: string;
    partial_fill: boolean;
  }> => {
    const { data } = await api.post('/cash-market/order/preview', request);
    return data;
  },

  executeMarketOrder: async (request: {
    certificate_type: CertificateType;
    side: OrderSide;
    amount_eur?: number;
    quantity?: number;
    all_or_none?: boolean;
  }): Promise<{
    success: boolean;
    order_id: string | null;
    message: string;
    certificate_type: string;
    side: string;
    order_type: string;
    total_quantity: number;
    total_cost_gross: number;
    platform_fee: number;
    total_cost_net: number;
    weighted_avg_price: number;
    trades: Array<{
      seller_code: string;
      price: number;
      quantity: number;
      cost: number;
    }>;
    eur_balance: number;
    certificate_balance: number;
  }> => {
    const { data } = await api.post('/cash-market/order/market', request);
    return data;
  },
};

// Market Makers API
export const getMarketMakers = async (params?: MarketMakerQueryParams): Promise<MarketMaker[]> => {
  const { data } = await api.get('/admin/market-makers', { params });

  // Transform backend response to match frontend expectations
  return data.map((mm: {
    id: string;
    name: string;
    description?: string;
    mm_type: MarketMakerType;
    is_active: boolean;
    eur_balance?: number;
    current_balances?: { CEA?: { total: number }; EUA?: { total: number } };
    total_orders?: number;
    created_at: string;
    ticket_id?: string;
  }): MarketMaker => ({
    id: mm.id,
    name: mm.name,
    description: mm.description,
    mm_type: mm.mm_type || 'CEA_CASH_SELLER',
    market: MARKET_MAKER_TYPES[mm.mm_type as MarketMakerType]?.market || 'CEA_CASH',
    is_active: mm.is_active,
    eur_balance: mm.eur_balance ?? 0,
    cea_balance: mm.current_balances?.CEA?.total ?? 0,
    eua_balance: mm.current_balances?.EUA?.total ?? 0,
    total_orders: mm.total_orders || 0,
    created_at: mm.created_at,
    ticket_id: mm.ticket_id,
  }));
};

export interface CreateMarketMakerRequest {
  name: string;
  email: string;
  description?: string;
  mm_type?: MarketMakerType;
  initial_eur_balance?: number;
  cea_balance?: number;
  eua_balance?: number;
}

export const createMarketMaker = async (data: CreateMarketMakerRequest): Promise<MarketMaker> => {
  // Transform frontend format to backend expected format
  // Backend expects: name, email, mm_type, initial_eur_balance, initial_balances: {CEA: number, EUA: number}
  // Frontend sends: name, email, mm_type, initial_eur_balance, cea_balance, eua_balance
  const payload: {
    name: string;
    email: string;
    description?: string;
    mm_type: MarketMakerType;
    initial_eur_balance?: number;
    initial_balances?: { CEA?: number; EUA?: number };
  } = {
    name: data.name,
    email: data.email,
    description: data.description,
    mm_type: data.mm_type || 'CEA_CASH_SELLER',
  };

  // Add EUR balance for CASH_BUYER
  if (data.initial_eur_balance !== undefined) {
    payload.initial_eur_balance = data.initial_eur_balance;
  }

  // Build initial_balances dict if any balance provided for CEA_CASH_SELLER or SWAP_MAKER
  // Use !== undefined to properly handle zero values
  if (data.cea_balance !== undefined || data.eua_balance !== undefined) {
    payload.initial_balances = {};
    if (data.cea_balance !== undefined) payload.initial_balances.CEA = data.cea_balance;
    if (data.eua_balance !== undefined) payload.initial_balances.EUA = data.eua_balance;
  }

  const { data: response } = await api.post('/admin/market-makers', payload);
  return response;
};

export const updateMarketMaker = async (id: string, data: {
  name?: string;
  description?: string;
  is_active?: boolean;
}): Promise<MarketMaker> => {
  const { data: response } = await api.put(`/admin/market-makers/${id}`, data);
  return response;
};

export const deleteMarketMaker = async (id: string): Promise<MessageResponse> => {
  const { data } = await api.delete(`/admin/market-makers/${id}`);
  return data;
};

export interface MarketMakerTransactionQueryParams {
  page?: number;
  per_page?: number;
  asset_type?: 'EUR' | 'CEA' | 'EUA';
  transaction_type?: string;
}

export const getMarketMakerTransactions = async (
  id: string,
  params?: MarketMakerTransactionQueryParams
): Promise<MarketMakerTransaction[]> => {
  const { data } = await api.get(`/admin/market-makers/${id}/transactions`, { params });

  // Transform backend response to match frontend expectations
  // Backend returns: transaction_type as "DEPOSIT", "WITHDRAWAL", "TRADE_DEBIT", etc. (uppercase)
  // Frontend expects: lowercase with underscores (deposit, withdrawal, trade_debit, trade_credit, etc.)
  return data.map((transaction: {
    id: string;
    entity_id: string;
    asset_type: 'EUR' | 'CEA' | 'EUA';
    transaction_type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference?: string;
    notes?: string;
    created_by: string;
    created_at: string;
  }): MarketMakerTransaction => ({
    ...transaction,
    market_maker_id: id,
    transaction_type: (transaction.transaction_type?.toLowerCase() || 'deposit') as TransactionType,
    amount: Math.abs(transaction.amount), // Store absolute value for display
  }));
};

export const createTransaction = async (id: string, data: {
  certificate_type: CertificateType;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  notes?: string;
}): Promise<MarketMakerTransaction> => {
  // Transform to backend format (uppercase transaction_type)
  const backendPayload = {
    ...data,
    transaction_type: data.transaction_type.toUpperCase(),
  };

  const { data: response } = await api.post(`/admin/market-makers/${id}/transactions`, backendPayload);
  return response;
};

export const getMarketMakerBalances = async (id: string): Promise<{
  cea_balance: number;
  eua_balance: number;
  cea_available: number;
  eua_available: number;
  cea_locked: number;
  eua_locked: number;
}> => {
  const { data } = await api.get(`/admin/market-makers/${id}/balances`);

  // Transform nested backend structure to flat frontend structure
  // Backend returns: {CEA: {available, locked, total}, EUA: {available, locked, total}}
  // Frontend expects: flat structure with total, available, and locked for each
  return {
    cea_balance: data.CEA?.total ?? 0,
    eua_balance: data.EUA?.total ?? 0,
    cea_available: data.CEA?.available ?? 0,
    eua_available: data.EUA?.available ?? 0,
    cea_locked: data.CEA?.locked ?? 0,
    eua_locked: data.EUA?.locked ?? 0,
  };
};

// Market Orders API (Admin)
export const getAdminOrderBook = (certificateType: string) =>
  api.get(`/admin/market-orders/orderbook/${certificateType}`);

export const placeMarketMakerOrder = (data: {
  market_maker_id: string;
  certificate_type: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
}) => api.post('/admin/market-orders', data);

// Alias for consistency
export const placeAdminMarketOrder = placeMarketMakerOrder;

export const getMarketMakerOrders = (params?: {
  market_maker_id?: string;
  status?: string;
  certificate_type?: string;
}) => api.get('/admin/market-orders', { params });

export const cancelMarketMakerOrder = (orderId: string) =>
  api.delete(`/admin/market-orders/${orderId}`);

// Logging/Audit API
export const getTickets = (params?: {
  date_from?: string;
  date_to?: string;
  action_type?: string[];
  user_id?: string;
  market_maker_id?: string;
  status?: string;
  entity_type?: string;
  entity_id?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) => api.get('/admin/logging/tickets', { params });

export const getTicket = (ticketId: string) =>
  api.get(`/admin/logging/tickets/${ticketId}`);

export const getLoggingStats = (params?: {
  date_from?: string;
  date_to?: string;
}) => api.get('/admin/logging/stats', { params });

export const getMarketMakerActions = (params?: {
  limit?: number;
  offset?: number;
}) => api.get('/admin/logging/market-maker-actions', { params });

export const getFailedActions = (params?: {
  limit?: number;
  offset?: number;
}) => api.get('/admin/logging/failed-actions', { params });

// Liquidity API
export const liquidityApi = {
  previewLiquidity: async (
    certificateType: CertificateType,
    bidEur: number,
    askEur: number
  ): Promise<LiquidityPreviewResponse> => {
    const { data } = await api.post('/admin/liquidity/preview', {
      certificate_type: certificateType,
      bid_eur: bidEur,
      ask_eur: askEur,
    });
    return data;
  },

  createLiquidity: async (request: LiquidityCreationRequest): Promise<LiquidityCreationResponse> => {
    const { data } = await api.post('/admin/liquidity/create', request);
    return data;
  },
};

export const settlementApi = {
  getPendingSettlements: async (): Promise<{ data: SettlementBatch[]; count: number }> => {
    const { data } = await api.get<{ data: SettlementBatch[]; count: number }>('/settlement/pending');
    return data;
  },
};

export default api;
