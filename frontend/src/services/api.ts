import axios from 'axios';
import type {
  Prices,
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
} from '../types';

// Dynamic API URL detection for LAN/remote access
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    console.log('[API] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  const { protocol, hostname, port } = window.location;
  console.log('[API] Detecting URL - protocol:', protocol, 'hostname:', hostname, 'port:', port);

  // If running on Vite dev server (port 5173), use relative URLs
  // Vite proxy handles forwarding /api requests to the backend
  if (port === '5173') {
    console.log('[API] Using relative URLs (Vite dev server proxy)');
    return '';
  }

  // Guard against empty hostname
  if (!hostname) {
    console.warn('[API] Empty hostname detected, falling back to relative URLs');
    return '';
  }

  // For production/other access, construct URL from current hostname
  // Assume backend runs on port 8000
  const apiUrl = `${protocol}//${hostname}:8000`;
  console.log('[API] Constructed API URL:', apiUrl);
  return apiUrl;
};

const API_BASE = getApiBaseUrl();
console.log('[API] Final API_BASE:', API_BASE);

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests and handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove Content-Type for FormData to let browser set it with correct boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 = invalid/expired token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
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

      if (detail === 'Not authenticated') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
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
    localStorage.removeItem('token');
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

  getHistory: async (hours: number = 24): Promise<{ eua: any[]; cea: any[] }> => {
    const { data } = await api.get(`/prices/history?hours=${hours}`);
    return data;
  },

  // WebSocket connection for live prices
  connectWebSocket: (onMessage: (prices: Prices) => void): WebSocket => {
    const getWsUrl = (): string => {
      // If VITE_WS_URL is explicitly set, use it
      if (import.meta.env.VITE_WS_URL) {
        console.log('[WS] Using VITE_WS_URL:', import.meta.env.VITE_WS_URL);
        return `${import.meta.env.VITE_WS_URL}/api/v1/prices/ws`;
      }

      const { protocol, hostname, port } = window.location;
      console.log('[WS] Detecting URL - protocol:', protocol, 'hostname:', hostname, 'port:', port);

      // If running on Vite dev server (port 5173), use relative WebSocket URL
      // Vite proxy handles forwarding /api requests (including WebSocket) to the backend
      if (port === '5173') {
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${hostname}:${port}/api/v1/prices/ws`;
        console.log('[WS] Using Vite proxy WebSocket URL:', wsUrl);
        return wsUrl;
      }

      // For production/other access, construct URL from current hostname
      // Assume backend runs on port 8000
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${hostname}:8000/api/v1/prices/ws`;
      console.log('[WS] Using direct WebSocket URL:', wsUrl);
      return wsUrl;
    };

    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    return ws;
  },
};

// Backoffice Realtime Types
export interface BackofficeWebSocketMessage {
  type: 'connected' | 'heartbeat' | 'new_request' | 'request_updated' | 'request_removed';
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
    console.log('[Backoffice WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[Backoffice WS] Connected');
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BackofficeWebSocketMessage;
        console.log('[Backoffice WS] Message:', data.type);
        onMessage(data);
      } catch (err) {
        console.error('[Backoffice WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[Backoffice WS] Disconnected');
      onClose?.();
    };

    ws.onerror = (error) => {
      console.error('[Backoffice WS] Error:', error);
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

  getDashboard: async (): Promise<any> => {
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

  // User Details
  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    const { data } = await api.get(`/backoffice/users/${userId}/sessions`);
    return data;
  },

  getUserTrades: async (userId: string): Promise<any[]> => {
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
};

export default api;
