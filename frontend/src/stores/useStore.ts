import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Prices, ContactRequestResponse } from '../types';
import { TOKEN_KEY } from '../constants/auth';
import { logger } from '../utils/logger';

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & { _hasHydrated: boolean }>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, token) => {
        // Store token separately in sessionStorage for API interceptor
        // (Zustand persist will also save it, but API reads from TOKEN_KEY directly)
        try {
          sessionStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
          logger.error('[AuthStore] Failed to store token:', error);
        }

        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        logger.debug('[AuthStore] logout called');
        try {
          sessionStorage.removeItem(TOKEN_KEY);
          logger.debug('[AuthStore] Token removed from sessionStorage');
        } catch (error) {
          logger.error('[AuthStore] Failed to remove token', error);
        }
        set({ user: null, token: null, isAuthenticated: false });
        logger.debug('[AuthStore] Auth state cleared, isAuthenticated=false');
      },
    }),
    {
      name: 'auth-storage',
      // Use sessionStorage instead of localStorage for security
      // This ensures token and auth state are stored in the same place
      storage: createJSONStorage(() => sessionStorage),
      // Only persist essential state to prevent unnecessary re-renders
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Control rehydration to prevent navigation loops
      onRehydrateStorage: () => {
        logger.debug('[AuthStore] Starting rehydration...');
        
        // Clean up old localStorage data if exists (migration from old storage)
        try {
          if (localStorage.getItem('auth-storage')) {
            localStorage.removeItem('auth-storage');
          }
        } catch (e) {
          // Ignore errors
        }
        
        return (state) => {
          // CRITICAL: Restore token to sessionStorage for API interceptor
          // Zustand persist restores the state, but API reads token from TOKEN_KEY directly
          if (state?.token) {
            try {
              sessionStorage.setItem(TOKEN_KEY, state.token);
            } catch (error) {
              logger.error('[AuthStore] Failed to restore token:', error);
            }
          }
          
          // Mark as hydrated after a microtask to ensure state is fully updated
          setTimeout(() => {
            useAuthStore.setState({ _hasHydrated: true });
          }, 0);
        };
      },
    }
  )
);

// Prices Store
interface PricesState {
  prices: Prices | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  setPrices: (prices: Prices) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePricesStore = create<PricesState>((set) => ({
  prices: null,
  loading: true,
  error: null,
  lastUpdated: null,
  setPrices: (prices) =>
    set({ prices, loading: false, lastUpdated: new Date(), error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Theme token overrides: CSS variable name -> value (persisted, applied globally)
const THEME_TOKEN_OVERRIDES_KEY = 'theme-token-overrides';

interface ThemeTokenState {
  overrides: Record<string, string>;
  setOverride: (varName: string, value: string) => void;
  resetOverride: (varName: string) => void;
  resetElementOverrides: (varNames: string[]) => void;
  resetAllOverrides: () => void;
}

export const useThemeTokenStore = create<ThemeTokenState>()(
  persist(
    (set) => ({
      overrides: {},
      setOverride: (varName, value) =>
        set((state) => ({
          overrides: { ...state.overrides, [varName]: value },
        })),
      resetOverride: (varName) =>
        set((state) => {
          const next = { ...state.overrides };
          delete next[varName];
          return { overrides: next };
        }),
      resetElementOverrides: (varNames) =>
        set((state) => {
          const next = { ...state.overrides };
          varNames.forEach((name) => delete next[name]);
          return { overrides: next };
        }),
      resetAllOverrides: () => set({ overrides: {} }),
    }),
    { name: THEME_TOKEN_OVERRIDES_KEY }
  )
);

// UI Store
interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Get initial theme from localStorage or system preference
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

export const useUIStore = create<UIState>((set, get) => {
  const initialTheme = getInitialTheme();
  // Apply theme on initial load
  if (typeof window !== 'undefined') {
    applyTheme(initialTheme);
  }

  return {
    sidebarOpen: true,
    mobileMenuOpen: false,
    theme: initialTheme,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    toggleMobileMenu: () =>
      set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    setTheme: (theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
      set({ theme: newTheme });
    },
  };
});

// KYC Document type for backoffice
export interface KYCDocumentBackoffice {
  id: string;
  user_id: string;
  user_email?: string;
  document_type: string;
  file_name: string;
  mime_type?: string;
  status: string;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

// Backoffice Realtime Store
export type BackofficeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface BackofficeState {
  contactRequests: ContactRequestResponse[];
  kycDocuments: KYCDocumentBackoffice[];
  connectionStatus: BackofficeConnectionStatus;
  lastUpdated: Date | null;
  kycLastUpdated: Date | null;
  setContactRequests: (requests: ContactRequestResponse[]) => void;
  addContactRequest: (request: ContactRequestResponse) => void;
  updateContactRequest: (request: ContactRequestResponse) => void;
  removeContactRequest: (id: string) => void;
  setKYCDocuments: (documents: KYCDocumentBackoffice[]) => void;
  addKYCDocument: (document: KYCDocumentBackoffice) => void;
  updateKYCDocument: (document: Partial<KYCDocumentBackoffice> & { id: string }) => void;
  removeKYCDocument: (id: string) => void;
  setConnectionStatus: (status: BackofficeConnectionStatus) => void;
}

export const useBackofficeStore = create<BackofficeState>((set) => ({
  contactRequests: [],
  kycDocuments: [],
  connectionStatus: 'disconnected',
  lastUpdated: null,
  kycLastUpdated: null,
  setContactRequests: (requests) =>
    set({ contactRequests: requests, lastUpdated: new Date() }),
  addContactRequest: (request) =>
    set((state) => {
      const rest = state.contactRequests.filter((r) => r.id !== request.id);
      return {
        contactRequests: [request, ...rest],
        lastUpdated: new Date(),
      };
    }),
  updateContactRequest: (request) =>
    set((state) => ({
      contactRequests: state.contactRequests.map((r) =>
        r.id === request.id ? request : r
      ),
      lastUpdated: new Date(),
    })),
  removeContactRequest: (id) =>
    set((state) => ({
      contactRequests: state.contactRequests.filter((r) => r.id !== id),
      lastUpdated: new Date(),
    })),
  setKYCDocuments: (documents) =>
    set({ kycDocuments: documents, kycLastUpdated: new Date() }),
  addKYCDocument: (document) =>
    set((state) => ({
      kycDocuments: [document, ...state.kycDocuments],
      kycLastUpdated: new Date(),
    })),
  updateKYCDocument: (document) =>
    set((state) => ({
      kycDocuments: state.kycDocuments.map((d) =>
        d.id === document.id ? { ...d, ...document } : d
      ),
      kycLastUpdated: new Date(),
    })),
  removeKYCDocument: (id) =>
    set((state) => ({
      kycDocuments: state.kycDocuments.filter((d) => d.id !== id),
      kycLastUpdated: new Date(),
    })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
