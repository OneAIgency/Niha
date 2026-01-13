import { useState, useEffect, useCallback } from 'react';
import {
  fetchCarbonPrices,
  ScrapedPrices,
  FALLBACK_PRICES,
  getCachedPrices,
  CNY_TO_EUR_RATE,
} from '../services/carbonPriceScraper';

export interface OnboardingPrices {
  euaPrice: number;
  euaCurrency: string;
  euaChange: number;
  euaChangePercent: number;
  ceaPrice: number;
  ceaCurrency: string;
  ceaChange: number;
  ceaChangePercent: number;
  ceaPriceInEur: number;
  priceRatio: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isCached: boolean;
  refetch: () => Promise<void>;
}

export function useOnboardingPrices(): OnboardingPrices {
  const [scrapedPrices, setScrapedPrices] = useState<ScrapedPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prices = await fetchCarbonPrices();
      setScrapedPrices(prices);
      setIsCached(!!prices.error);
      if (prices.error) {
        setError(prices.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      setIsCached(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for cached prices immediately for fast initial render
    const cached = getCachedPrices();
    if (cached) {
      setScrapedPrices(cached);
      setIsLoading(false);
      setIsCached(true);
    }

    // Fetch fresh prices
    fetchPrices();

    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Use scraped prices or fallback
  const euaPrice = scrapedPrices?.eua?.price ?? FALLBACK_PRICES.eua!.price;
  const ceaPrice = scrapedPrices?.cea?.price ?? FALLBACK_PRICES.cea!.price;
  const euaChange = scrapedPrices?.eua?.change ?? 0;
  const euaChangePercent = scrapedPrices?.eua?.changePercent ?? 0;
  const ceaChange = scrapedPrices?.cea?.change ?? 0;
  const ceaChangePercent = scrapedPrices?.cea?.changePercent ?? 0;

  const ceaPriceInEur = ceaPrice * CNY_TO_EUR_RATE;
  const priceRatio = ceaPriceInEur > 0 ? euaPrice / ceaPriceInEur : 0;

  return {
    euaPrice,
    euaCurrency: 'EUR',
    euaChange,
    euaChangePercent,
    ceaPrice,
    ceaCurrency: 'CNY',
    ceaChange,
    ceaChangePercent,
    ceaPriceInEur,
    priceRatio,
    isLoading,
    error,
    lastUpdated: scrapedPrices?.fetchedAt ?? null,
    isCached,
    refetch: fetchPrices,
  };
}
