// Service to fetch and parse carbon prices from carboncredits.com
// Uses a backend proxy to avoid CORS issues

export interface ScrapedCarbonPrice {
  market: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export interface ScrapedPrices {
  eua: ScrapedCarbonPrice | null;
  cea: ScrapedCarbonPrice | null;
  fetchedAt: Date;
  error?: string;
}

// Fallback values if scraping fails
export const FALLBACK_PRICES: ScrapedPrices = {
  eua: {
    market: 'EU ETS',
    price: 88,
    currency: 'EUR',
    change: 0,
    changePercent: 0,
    lastUpdated: new Date(),
  },
  cea: {
    market: 'China ETS',
    price: 63,
    currency: 'CNY',
    change: 0,
    changePercent: 0,
    lastUpdated: new Date(),
  },
  fetchedAt: new Date(),
};

// Cache configuration
const CACHE_KEY = 'carbon_prices_cache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  prices: ScrapedPrices;
  timestamp: number;
}

// Get cached prices from localStorage
export function getCachedPrices(): ScrapedPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - data.timestamp < CACHE_DURATION_MS) {
      // Restore Date objects
      return {
        ...data.prices,
        fetchedAt: new Date(data.prices.fetchedAt),
        eua: data.prices.eua ? {
          ...data.prices.eua,
          lastUpdated: new Date(data.prices.eua.lastUpdated),
        } : null,
        cea: data.prices.cea ? {
          ...data.prices.cea,
          lastUpdated: new Date(data.prices.cea.lastUpdated),
        } : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Set cached prices
function setCachedPrices(prices: ScrapedPrices): void {
  try {
    const data: CachedData = {
      prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

// Main fetch function
export async function fetchCarbonPrices(): Promise<ScrapedPrices> {
  // Check cache first
  const cached = getCachedPrices();
  if (cached) {
    return cached;
  }

  try {
    // Try to fetch from our backend API first
    const response = await fetch('/api/v1/prices/current');

    if (response.ok) {
      const data = await response.json();

      const prices: ScrapedPrices = {
        eua: data.eua ? {
          market: 'EU ETS',
          price: data.eua.price || FALLBACK_PRICES.eua!.price,
          currency: 'EUR',
          change: data.eua.change_24h || 0,
          changePercent: data.eua.change_percent || 0,
          lastUpdated: new Date(data.eua.updated_at || Date.now()),
        } : FALLBACK_PRICES.eua,
        cea: data.cea ? {
          market: 'China ETS',
          price: data.cea.price || FALLBACK_PRICES.cea!.price,
          currency: 'CNY',
          change: data.cea.change_24h || 0,
          changePercent: data.cea.change_percent || 0,
          lastUpdated: new Date(data.cea.updated_at || Date.now()),
        } : FALLBACK_PRICES.cea,
        fetchedAt: new Date(),
      };

      setCachedPrices(prices);
      return prices;
    }

    throw new Error(`HTTP error: ${response.status}`);
  } catch (error) {
    console.warn('Failed to fetch from API, using fallback:', error);

    // Return fallback prices with error flag
    const fallbackWithError: ScrapedPrices = {
      ...FALLBACK_PRICES,
      fetchedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    // Still cache the fallback to prevent repeated failed requests
    setCachedPrices(fallbackWithError);

    return fallbackWithError;
  }
}

// Exchange rate approximation (CNY to EUR)
export const CNY_TO_EUR_RATE = 0.127; // ~1 CNY = 0.127 EUR

// Helper to convert CEA price to EUR
export function ceaToEur(ceaPrice: number): number {
  return ceaPrice * CNY_TO_EUR_RATE;
}

// Helper to calculate price ratio
export function calculatePriceRatio(euaPrice: number, ceaPrice: number): number {
  const ceaInEur = ceaToEur(ceaPrice);
  return ceaInEur > 0 ? euaPrice / ceaInEur : 0;
}
