import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Prices, MarketStats } from '../types';

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
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

// Market Stats Store
interface MarketState {
  stats: MarketStats | null;
  loading: boolean;
  setStats: (stats: MarketStats) => void;
  setLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  stats: null,
  loading: true,
  setStats: (stats) => set({ stats, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

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
