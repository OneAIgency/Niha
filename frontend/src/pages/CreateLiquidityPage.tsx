import { useState, useEffect, useCallback } from 'react';
import { Banknote, ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw, Loader2, Zap, AlertCircle } from 'lucide-react';
import { BackofficeLayout } from '../components/layout/BackofficeLayout';
import { Button, NumberInput } from '../components/common';
import { cn } from '../utils';
import { cashMarketApi, getMarketMakers, getMarketMakerBalances, pricesApi, placeMarketMakerOrder } from '../services/api';
import type { MarketMaker } from '../types';

type LiquidityMarket = 'cash' | 'swap';

const LIQUIDITY_MARKETS: { id: LiquidityMarket; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash Market', icon: Banknote },
  { id: 'swap', label: 'Swap Market', icon: ArrowLeftRight },
];

interface CashMarketStats {
  totalBidEur: number;
  totalAskEur: number;
  bestBid: number;
  bestAsk: number;
}

interface MarketMakerWithAvailable extends MarketMaker {
  eur_available: number;
  cea_available: number;
}

interface GeneratedOrder {
  market_maker_id: string;
  market_maker_name: string;
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
  total_eur: number;
}

interface LiquidityPreview {
  orders: GeneratedOrder[];
  totalEur: number;
  side: 'BID' | 'ASK';
}

export function CreateLiquidityPage() {
  const [activeMarket, setActiveMarket] = useState<LiquidityMarket>('cash');
  const [loading, setLoading] = useState(true);
  const [cashStats, setCashStats] = useState<CashMarketStats | null>(null);

  // Create Liquidity State
  const [bidTargetEur, setBidTargetEur] = useState<string>('');
  const [bidMinOrder, setBidMinOrder] = useState<string>('100000');
  const [bidMaxOrder, setBidMaxOrder] = useState<string>('10000000');
  const [bidPricePercent, setBidPricePercent] = useState<string>('15');
  const [bidOrderCount, setBidOrderCount] = useState<string>('100');
  const [bidDiversity, setBidDiversity] = useState<string>('5');

  const [askTargetEur, setAskTargetEur] = useState<string>('');
  const [askMinOrder, setAskMinOrder] = useState<string>('100000');
  const [askMaxOrder, setAskMaxOrder] = useState<string>('10000000');
  const [askPricePercent, setAskPricePercent] = useState<string>('15');
  const [askOrderCount, setAskOrderCount] = useState<string>('100');
  const [askDiversity, setAskDiversity] = useState<string>('5');

  const [ceaBuyers, setCeaBuyers] = useState<MarketMakerWithAvailable[]>([]);
  const [ceaSellers, setCeaSellers] = useState<MarketMakerWithAvailable[]>([]);
  const [loadingMMs, setLoadingMMs] = useState(false);

  const [previewBid, setPreviewBid] = useState<LiquidityPreview | null>(null);
  const [previewAsk, setPreviewAsk] = useState<LiquidityPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<'bid' | 'ask' | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [creatingOrders, setCreatingOrders] = useState(false);
  const [creationProgress, setCreationProgress] = useState<{ current: number; total: number; logs: string[] }>({ current: 0, total: 0, logs: [] });
  const [error, setError] = useState<string | null>(null);

  const fetchCashMarketStats = async () => {
    setLoading(true);
    try {
      // Fetch both order book and scrapped prices in parallel
      const [orderBook, prices] = await Promise.all([
        cashMarketApi.getRealOrderBook('CEA'),
        pricesApi.getCurrent(),
      ]);

      // Get scrapped CEA price (fallback to 13 EUR if not available)
      const ceaPrice = prices.cea?.price || 13;

      const totalBidEur = orderBook.bids?.reduce((sum, level) => {
        return sum + (level.price * level.quantity);
      }, 0) || 0;

      const totalAskEur = orderBook.asks?.reduce((sum, level) => {
        return sum + (level.price * level.quantity);
      }, 0) || 0;

      // Use scrapped price as fallback when no orders exist
      // Best bid = scrapped - 0.1 (rounded DOWN to nearest 0.10)
      // Best ask = scrapped + 0.1 (rounded UP to nearest 0.10)
      // Example: scrapped = 9.56 → bid = 9.40 (floor), ask = 9.70 (ceil)
      const fallbackBid = Math.floor((ceaPrice - 0.1) * 10) / 10;
      const fallbackAsk = Math.ceil((ceaPrice + 0.1) * 10) / 10;
      const bestBid = orderBook.best_bid || fallbackBid;
      const bestAsk = orderBook.best_ask || fallbackAsk;

      setCashStats({
        totalBidEur,
        totalAskEur,
        bestBid,
        bestAsk,
      });
    } catch (error) {
      console.error('Failed to fetch cash market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketMakers = useCallback(async () => {
    setLoadingMMs(true);
    try {
      const mms = await getMarketMakers({ is_active: true });

      // Fetch balances for each MM
      const buyersWithBalances: MarketMakerWithAvailable[] = [];
      const sellersWithBalances: MarketMakerWithAvailable[] = [];

      for (const mm of mms) {
        try {
          const balances = await getMarketMakerBalances(mm.id);
          const mmWithBalances = {
            ...mm,
            eur_available: Number(balances.eur_available) || 0,
            cea_available: Number(balances.cea_available) || 0,
          };

          if (mm.mm_type === 'CEA_BUYER') {
            buyersWithBalances.push(mmWithBalances);
          } else if (mm.mm_type === 'CEA_SELLER') {
            sellersWithBalances.push(mmWithBalances);
          }
        } catch (err) {
          console.error(`Failed to fetch balances for MM ${mm.id}:`, err);
        }
      }

      setCeaBuyers(buyersWithBalances);
      setCeaSellers(sellersWithBalances);
    } catch (error) {
      console.error('Failed to fetch market makers:', error);
    } finally {
      setLoadingMMs(false);
    }
  }, []);

  useEffect(() => {
    if (activeMarket === 'cash') {
      fetchCashMarketStats();
      fetchMarketMakers();
      const interval = setInterval(fetchCashMarketStats, 30000);
      return () => clearInterval(interval);
    }
  }, [activeMarket, fetchMarketMakers]);

  const formatEur = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate additional liquidity needed
  const currentBidEur = cashStats?.totalBidEur || 0;
  const currentAskEur = cashStats?.totalAskEur || 0;
  const targetBidEur = parseFloat(bidTargetEur.replace(/,/g, '')) || 0;
  const targetAskEur = parseFloat(askTargetEur.replace(/,/g, '')) || 0;
  const additionalBidNeeded = Math.max(0, targetBidEur - currentBidEur);
  const additionalAskNeeded = Math.max(0, targetAskEur - currentAskEur);

  // Calculate available balances
  const totalEurAvailable = ceaBuyers.reduce((sum, mm) => sum + mm.eur_available, 0);
  const totalCeaAvailable = ceaSellers.reduce((sum, mm) => sum + mm.cea_available, 0);

  // Calculate worst bid/ask based on price percent
  const bidPercent = parseFloat(bidPricePercent) || 0;
  const askPercent = parseFloat(askPricePercent) || 0;
  const worstBid = cashStats?.bestBid ? cashStats.bestBid * (1 - bidPercent / 100) : 0;
  const worstAsk = cashStats?.bestAsk ? cashStats.bestAsk * (1 + askPercent / 100) : 0;

  const generateRandomOrders = (
    side: 'BID' | 'ASK',
    totalEurNeeded: number,
    minOrder: number,
    maxOrder: number,
    pricePercent: number,
    basePrice: number,
    marketMakers: MarketMakerWithAvailable[],
    targetOrderCount: number,
    diversity: number // 1-10, how much order sizes can vary
  ): GeneratedOrder[] => {
    if (totalEurNeeded <= 0 || marketMakers.length === 0 || targetOrderCount <= 0) return [];

    const TICK_SIZE = 0.1; // Price tick size in EUR

    // Calculate price range based on percentage
    const worstPrice = side === 'BID'
      ? basePrice * (1 - pricePercent / 100)
      : basePrice * (1 + pricePercent / 100);

    // Round base and worst prices to tick size
    const roundedBasePrice = Math.round(basePrice / TICK_SIZE) * TICK_SIZE;
    const roundedWorstPrice = side === 'BID'
      ? Math.floor(worstPrice / TICK_SIZE) * TICK_SIZE
      : Math.ceil(worstPrice / TICK_SIZE) * TICK_SIZE;

    // Generate all price levels in the range (every 0.1 step)
    const priceLevels: number[] = [];
    if (side === 'BID') {
      // For bids: from best (high) to worst (low)
      for (let p = roundedBasePrice; p >= roundedWorstPrice; p -= TICK_SIZE) {
        priceLevels.push(Math.round(p * 10) / 10); // Fix floating point precision
      }
    } else {
      // For asks: from best (low) to worst (high)
      for (let p = roundedBasePrice; p <= roundedWorstPrice; p += TICK_SIZE) {
        priceLevels.push(Math.round(p * 10) / 10); // Fix floating point precision
      }
    }

    if (priceLevels.length === 0) return [];

    const orders: GeneratedOrder[] = [];

    // Calculate average order size based on target count
    const avgOrderSize = totalEurNeeded / targetOrderCount;

    // Diversity controls variation: 1 = 5% variation, 10 = 90% variation
    const variationPercent = 0.05 + (diversity - 1) * 0.094;

    // Adjust min/max to allow reaching target order count
    const effectiveMin = Math.min(minOrder, avgOrderSize * (1 - variationPercent));
    const effectiveMax = Math.max(maxOrder, avgOrderSize * (1 + variationPercent));

    // Shuffle market makers to distribute randomly
    const shuffledMMs = [...marketMakers].sort(() => Math.random() - 0.5);
    let mmIndex = 0;

    // Create diversified order distribution per price level (1-5 orders per level)
    // First, assign random weights to each price level
    const levelWeights = priceLevels.map(() => 1 + Math.floor(Math.random() * 5)); // 1-5 orders per level
    const totalWeightedOrders = levelWeights.reduce((sum, w) => sum + w, 0);

    // Scale weights to match target order count while keeping diversity
    const scaleFactor = targetOrderCount / totalWeightedOrders;
    const ordersPerLevel = levelWeights.map(w => {
      const scaled = Math.round(w * scaleFactor);
      // Ensure at least 1 order per level, max 5 for natural look
      return Math.max(1, Math.min(5, scaled));
    });

    // Adjust to hit exact target count (with iteration limits to prevent infinite loops)
    let currentTotal = ordersPerLevel.reduce((sum, o) => sum + o, 0);
    let iterations = 0;
    const maxIterations = targetOrderCount * 2;

    while (currentTotal < targetOrderCount && iterations < maxIterations) {
      iterations++;
      // Add orders to random levels (prefer levels with fewer orders)
      const idx = Math.floor(Math.random() * priceLevels.length);
      if (ordersPerLevel[idx] < 8) { // Allow up to 8 for more flexibility
        ordersPerLevel[idx]++;
        currentTotal++;
      }
    }
    iterations = 0;
    while (currentTotal > targetOrderCount && iterations < maxIterations) {
      iterations++;
      // Remove orders from levels with more than 1
      const idx = Math.floor(Math.random() * priceLevels.length);
      if (ordersPerLevel[idx] > 1) {
        ordersPerLevel[idx]--;
        currentTotal--;
      }
    }

    // Calculate EUR per level based on order count distribution
    const totalOrdersPlanned = ordersPerLevel.reduce((sum, o) => sum + o, 0);
    let remainingEur = totalEurNeeded;

    // Generate orders for each price level
    for (let levelIdx = 0; levelIdx < priceLevels.length; levelIdx++) {
      const price = priceLevels[levelIdx];
      const ordersAtThisLevel = ordersPerLevel[levelIdx];
      const eurForThisLevel = (totalEurNeeded * ordersAtThisLevel) / totalOrdersPlanned;

      for (let i = 0; i < ordersAtThisLevel && remainingEur > effectiveMin; i++) {
        const mm = shuffledMMs[mmIndex % shuffledMMs.length];
        mmIndex++;

        // Check available balance
        const available = side === 'BID' ? mm.eur_available : mm.cea_available * price;
        if (available < effectiveMin) continue;

        // Calculate target for this order
        const targetForThis = eurForThisLevel / ordersAtThisLevel;

        // Apply diversity-based variation around the target
        const minForThis = Math.max(effectiveMin, targetForThis * (1 - variationPercent));
        const maxForThis = Math.min(effectiveMax, remainingEur, available, targetForThis * (1 + variationPercent));

        if (maxForThis < minForThis) continue;

        const orderEur = minForThis + Math.random() * (maxForThis - minForThis);
        const quantity = orderEur / price;

        orders.push({
          market_maker_id: mm.id,
          market_maker_name: mm.name,
          side,
          price: Math.round(price * 10) / 10, // Round to tick size (0.1)
          quantity: Math.round(quantity * 100) / 100,
          total_eur: Math.round(orderEur * 100) / 100,
        });

        remainingEur -= orderEur;

        // Prevent infinite loops
        if (orders.length > 200) break;
      }
      if (orders.length > 200) break;
    }

    // Sort orders by price (bids: high to low, asks: low to high)
    orders.sort((a, b) => side === 'BID' ? b.price - a.price : a.price - b.price);

    return orders;
  };

  const handleGeneratePreview = (side: 'BID' | 'ASK') => {
    setError(null);
    setGeneratingPreview(true);

    try {
      if (side === 'BID') {
        if (additionalBidNeeded <= 0) {
          setError('Target bid value must be higher than current value');
          setGeneratingPreview(false);
          return;
        }

        if (additionalBidNeeded > totalEurAvailable) {
          setError(`Insufficient EUR balance. Need ${formatEur(additionalBidNeeded)}, available ${formatEur(totalEurAvailable)}`);
          setGeneratingPreview(false);
          return;
        }

        const orders = generateRandomOrders(
          'BID',
          additionalBidNeeded,
          parseFloat(bidMinOrder.replace(/,/g, '')) || 100000,
          parseFloat(bidMaxOrder.replace(/,/g, '')) || 10000000,
          parseFloat(bidPricePercent) || 15,
          cashStats?.bestBid || 13,
          ceaBuyers,
          parseInt(bidOrderCount.replace(/,/g, '')) || 100,
          Math.min(10, Math.max(1, parseInt(bidDiversity) || 5))
        );

        // Sort BID orders by price descending (highest price first)
        const sortedOrders = [...orders].sort((a, b) => b.price - a.price);

        setPreviewBid({
          orders: sortedOrders,
          totalEur: sortedOrders.reduce((sum, o) => sum + o.total_eur, 0),
          side: 'BID',
        });
        setShowPreviewModal('bid');
      } else {
        if (additionalAskNeeded <= 0) {
          setError('Target ask value must be higher than current value');
          setGeneratingPreview(false);
          return;
        }

        const ceaValueInEur = totalCeaAvailable * (cashStats?.bestAsk || 13);
        if (additionalAskNeeded > ceaValueInEur) {
          setError(`Insufficient CEA balance. Need ${formatEur(additionalAskNeeded)} worth, available ${formatEur(ceaValueInEur)}`);
          setGeneratingPreview(false);
          return;
        }

        const orders = generateRandomOrders(
          'ASK',
          additionalAskNeeded,
          parseFloat(askMinOrder.replace(/,/g, '')) || 100000,
          parseFloat(askMaxOrder.replace(/,/g, '')) || 10000000,
          parseFloat(askPricePercent) || 15,
          cashStats?.bestAsk || 13,
          ceaSellers,
          parseInt(askOrderCount.replace(/,/g, '')) || 100,
          Math.min(10, Math.max(1, parseInt(askDiversity) || 5))
        );

        // Sort ASK orders by price ascending (lowest price first)
        const sortedOrders = [...orders].sort((a, b) => a.price - b.price);

        setPreviewAsk({
          orders: sortedOrders,
          totalEur: sortedOrders.reduce((sum, o) => sum + o.total_eur, 0),
          side: 'ASK',
        });
        setShowPreviewModal('ask');
      }
    } catch (err) {
      setError('Failed to generate preview');
      console.error(err);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleCreateOrders = async (preview: LiquidityPreview) => {
    if (!preview || preview.orders.length === 0) return;

    setCreatingOrders(true);
    setCreationProgress({ current: 0, total: preview.orders.length, logs: [] });

    const logs: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < preview.orders.length; i++) {
      const order = preview.orders[i];
      const orderNum = i + 1;

      try {
        const response = await placeMarketMakerOrder({
          market_maker_id: order.market_maker_id,
          certificate_type: 'CEA',
          side: order.side,
          price: order.price,
          quantity: order.quantity,
        });

        // Extract ticket_id from response if available
        const ticketId = (response?.data as { ticket_id?: string })?.ticket_id || `ORD-${Date.now()}-${orderNum}`;

        const logEntry = `✓ #${orderNum} | ${order.market_maker_name} | ${order.side} | ${order.quantity.toFixed(2)} CEA @ €${order.price.toFixed(2)} | Ticket: ${ticketId}`;
        logs.push(logEntry);
        successCount++;

        // Log to console for debugging
        console.log(`[Liquidity] Order created:`, { order, ticketId, response });

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        const logEntry = `✗ #${orderNum} | ${order.market_maker_name} | ${order.side} | FAILED: ${errorMsg}`;
        logs.push(logEntry);
        failCount++;
        console.error(`[Liquidity] Order failed:`, { order, error: err });
      }

      setCreationProgress({ current: i + 1, total: preview.orders.length, logs: [...logs] });

      // Small delay between orders to avoid overwhelming the server
      if (i < preview.orders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final summary
    const summary = `\n━━━ Summary ━━━\nCreated: ${successCount} | Failed: ${failCount} | Total: ${preview.orders.length}`;
    logs.push(summary);
    setCreationProgress(prev => ({ ...prev, logs: [...logs] }));

    // Refresh market data after creating orders
    await fetchCashMarketStats();
    await fetchMarketMakers();

    // Keep modal open to show results, user can close manually
    setCreatingOrders(false);
  };

  // SubSubHeader left content - market tabs
  const subSubHeaderLeft = (
    <nav className="flex items-center gap-2" aria-label="Liquidity markets">
      {LIQUIDITY_MARKETS.map(({ id, label, icon: Icon }) => {
        const isActive = activeMarket === id;
        return (
          <button
            key={id}
            onClick={() => setActiveMarket(id)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            title={label}
            className={cn(
              'group subsubheader-nav-btn flex items-center gap-2',
              isActive ? 'subsubheader-nav-btn-active' : 'subsubheader-nav-btn-inactive'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );

  // SubSubHeader right content - refresh button
  const subSubHeaderRight = activeMarket === 'cash' ? (
    <button
      onClick={() => { fetchCashMarketStats(); fetchMarketMakers(); }}
      disabled={loading || loadingMMs}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-navy-400 hover:text-navy-300 transition-colors"
      title="Refresh"
    >
      {(loading || loadingMMs) ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      <span>Refresh</span>
    </button>
  ) : null;

  return (
    <BackofficeLayout
      subSubHeaderLeft={subSubHeaderLeft}
      subSubHeader={subSubHeaderRight}
    >
      {/* Cash Market Content */}
      {activeMarket === 'cash' && (
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">×</button>
            </div>
          )}

          {/* Cash Market Analysis - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BID Side */}
            <div className="content_wrapper_last p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
                    Bid Side
                  </h3>
                  <p className="text-xs text-navy-400 dark:text-navy-500">Buy Orders</p>
                </div>
              </div>

              {loading && !cashStats ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatEur(cashStats?.totalBidEur || 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-navy-200 dark:border-navy-700">
                    <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">
                      Best Bid
                      {cashStats?.totalBidEur === 0 && (
                        <span className="ml-1 text-amber-500">(from scrapped)</span>
                      )}
                    </p>
                    <p className="text-lg font-semibold text-navy-900 dark:text-white">
                      {formatPrice(cashStats?.bestBid || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ASK Side */}
            <div className="content_wrapper_last p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
                    Ask Side
                  </h3>
                  <p className="text-xs text-navy-400 dark:text-navy-500">Sell Orders</p>
                </div>
              </div>

              {loading && !cashStats ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatEur(cashStats?.totalAskEur || 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-navy-200 dark:border-navy-700">
                    <p className="text-xs text-navy-500 dark:text-navy-400 mb-1">
                      Best Ask
                      {cashStats?.totalAskEur === 0 && (
                        <span className="ml-1 text-amber-500">(from scrapped)</span>
                      )}
                    </p>
                    <p className="text-lg font-semibold text-navy-900 dark:text-white">
                      {formatPrice(cashStats?.bestAsk || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Liquidity Section */}
          <div className="content_wrapper_last p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
                  Create Liquidity
                </h3>
                <p className="text-xs text-navy-400 dark:text-navy-500">Generate orders to increase market depth</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BID Creation */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  BID Side (CEA Buyers)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                      Target Total Value
                    </label>
                    <NumberInput
                      value={bidTargetEur}
                      onChange={setBidTargetEur}
                      placeholder={formatEur(currentBidEur)}
                      suffix="EUR"
                      decimals={0}
                    />
                    {targetBidEur > currentBidEur && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        +{formatEur(additionalBidNeeded)} to add
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Min Order
                      </label>
                      <NumberInput
                        value={bidMinOrder}
                        onChange={setBidMinOrder}
                        suffix="EUR"
                        decimals={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Max Order
                      </label>
                      <NumberInput
                        value={bidMaxOrder}
                        onChange={setBidMaxOrder}
                        suffix="EUR"
                        decimals={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Price Range (%)
                      </label>
                      <NumberInput
                        value={bidPricePercent}
                        onChange={setBidPricePercent}
                        suffix="%"
                        decimals={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Orders
                      </label>
                      <NumberInput
                        value={bidOrderCount}
                        onChange={setBidOrderCount}
                        decimals={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Diversity (1-10)
                      </label>
                      <NumberInput
                        value={bidDiversity}
                        onChange={(v) => {
                          const num = parseInt(v) || 1;
                          setBidDiversity(String(Math.min(10, Math.max(1, num))));
                        }}
                        decimals={0}
                      />
                    </div>
                  </div>

                  {/* Worst Bid Display */}
                  {worstBid > 0 && (
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <p className="text-xs text-navy-500 dark:text-navy-400">
                        Price range: <span className="font-medium text-emerald-700 dark:text-emerald-300">{formatPrice(cashStats?.bestBid || 0)}</span>
                        {' → '}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatPrice(worstBid)}</span>
                        <span className="text-navy-400 dark:text-navy-500"> (worst bid)</span>
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      Available: <span className="font-medium text-emerald-600">{formatEur(totalEurAvailable)}</span>
                      <span className="text-navy-400 dark:text-navy-500"> ({ceaBuyers.length} buyers)</span>
                    </p>
                  </div>

                  {/* Warning when no buyers or no EUR balance */}
                  {ceaBuyers.length === 0 && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No CEA_BUYER market makers found
                      </p>
                    </div>
                  )}
                  {ceaBuyers.length > 0 && totalEurAvailable <= 0 && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        CEA Buyers have no EUR balance
                      </p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleGeneratePreview('BID')}
                    disabled={generatingPreview || additionalBidNeeded <= 0 || ceaBuyers.length === 0 || totalEurAvailable <= 0}
                    loading={generatingPreview && showPreviewModal === 'bid'}
                  >
                    Generate BID Orders
                  </Button>
                </div>
              </div>

              {/* ASK Creation */}
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50">
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  ASK Side (CEA Sellers)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                      Target Total Value
                    </label>
                    <NumberInput
                      value={askTargetEur}
                      onChange={setAskTargetEur}
                      placeholder={formatEur(currentAskEur)}
                      suffix="EUR"
                      decimals={0}
                    />
                    {targetAskEur > currentAskEur && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        +{formatEur(additionalAskNeeded)} to add
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Min Order
                      </label>
                      <NumberInput
                        value={askMinOrder}
                        onChange={setAskMinOrder}
                        suffix="EUR"
                        decimals={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Max Order
                      </label>
                      <NumberInput
                        value={askMaxOrder}
                        onChange={setAskMaxOrder}
                        suffix="EUR"
                        decimals={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Price Range (%)
                      </label>
                      <NumberInput
                        value={askPricePercent}
                        onChange={setAskPricePercent}
                        suffix="%"
                        decimals={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Orders
                      </label>
                      <NumberInput
                        value={askOrderCount}
                        onChange={setAskOrderCount}
                        decimals={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-500 dark:text-navy-400 mb-1">
                        Diversity (1-10)
                      </label>
                      <NumberInput
                        value={askDiversity}
                        onChange={(v) => {
                          const num = parseInt(v) || 1;
                          setAskDiversity(String(Math.min(10, Math.max(1, num))));
                        }}
                        decimals={0}
                      />
                    </div>
                  </div>

                  {/* Worst Ask Display */}
                  {worstAsk > 0 && (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <p className="text-xs text-navy-500 dark:text-navy-400">
                        Price range: <span className="font-medium text-red-700 dark:text-red-300">{formatPrice(cashStats?.bestAsk || 0)}</span>
                        {' → '}
                        <span className="font-medium text-red-600 dark:text-red-400">{formatPrice(worstAsk)}</span>
                        <span className="text-navy-400 dark:text-navy-500"> (worst ask)</span>
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-red-200 dark:border-red-800/50">
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      Available: <span className="font-medium text-red-600">{formatEur(totalCeaAvailable * (cashStats?.bestAsk || 13))}</span>
                      <span className="text-navy-400 dark:text-navy-500"> ({ceaSellers.length} sellers)</span>
                    </p>
                  </div>

                  {/* Warning when no sellers or no CEA balance */}
                  {ceaSellers.length === 0 && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No CEA_SELLER market makers found
                      </p>
                    </div>
                  )}
                  {ceaSellers.length > 0 && totalCeaAvailable <= 0 && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-300 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        CEA Sellers have no CEA balance
                      </p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => handleGeneratePreview('ASK')}
                    disabled={generatingPreview || additionalAskNeeded <= 0 || ceaSellers.length === 0 || totalCeaAvailable <= 0}
                    loading={generatingPreview && showPreviewModal === 'ask'}
                  >
                    Generate ASK Orders
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Market Content */}
      {activeMarket === 'swap' && (
        <div>
          {/* TODO: Swap Market content will be added here */}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (previewBid || previewAsk) && (
        <LiquidityPreviewModal
          preview={showPreviewModal === 'bid' ? previewBid : previewAsk}
          onClose={() => {
            setShowPreviewModal(null);
            setCreationProgress({ current: 0, total: 0, logs: [] });
          }}
          onConfirm={() => {
            const preview = showPreviewModal === 'bid' ? previewBid : previewAsk;
            if (preview) {
              handleCreateOrders(preview);
            }
          }}
          isCreating={creatingOrders}
          progress={creationProgress}
        />
      )}
    </BackofficeLayout>
  );
}

// Preview Modal Component
function LiquidityPreviewModal({
  preview,
  onClose,
  onConfirm,
  isCreating,
  progress,
}: {
  preview: LiquidityPreview | null;
  onClose: () => void;
  onConfirm: () => void;
  isCreating?: boolean;
  progress?: { current: number; total: number; logs: string[] };
}) {
  if (!preview) return null;

  const isBid = preview.side === 'BID';
  const hasLogs = progress && progress.logs.length > 0;
  const isComplete = progress && progress.current === progress.total && progress.total > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={cn(
          'px-6 py-4 border-b',
          isBid
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        )}>
          <h2 className={cn(
            'text-lg font-semibold',
            isBid ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'
          )}>
            {hasLogs ? (isComplete ? 'Orders Created' : 'Creating Orders...') : `${isBid ? 'BID' : 'ASK'} Orders Preview`}
          </h2>
          <p className="text-sm text-navy-500 dark:text-navy-400">
            {hasLogs
              ? `${progress.current} / ${progress.total} orders processed`
              : `${preview.orders.length} orders totaling €${preview.totalEur.toLocaleString()}`
            }
          </p>
          {/* Progress bar */}
          {isCreating && progress && progress.total > 0 && (
            <div className="mt-2 w-full bg-navy-200 dark:bg-navy-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  isBid ? 'bg-emerald-500' : 'bg-red-500'
                )}
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Content: Orders Table or Logs */}
        {hasLogs ? (
          /* Logs View */
          <div className="overflow-auto max-h-96 p-4 bg-navy-900 dark:bg-navy-950">
            <pre className="text-xs font-mono text-navy-100 whitespace-pre-wrap">
              {progress.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'py-1',
                    log.startsWith('✓') && 'text-emerald-400',
                    log.startsWith('✗') && 'text-red-400',
                    log.includes('━━━') && 'text-amber-400 font-bold mt-2'
                  )}
                >
                  {log}
                </div>
              ))}
              {isCreating && <span className="animate-pulse">▌</span>}
            </pre>
          </div>
        ) : (
          /* Orders Table */
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 dark:bg-navy-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-navy-500 dark:text-navy-400 uppercase">
                    Market Maker
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-navy-500 dark:text-navy-400 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-navy-500 dark:text-navy-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-navy-500 dark:text-navy-400 uppercase">
                    Total EUR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                {preview.orders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-navy-50 dark:hover:bg-navy-800/50">
                    <td className="px-4 py-2 text-navy-900 dark:text-white">
                      {order.market_maker_name}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-navy-700 dark:text-navy-300">
                      €{order.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-navy-700 dark:text-navy-300">
                      {order.quantity.toFixed(2)}
                    </td>
                    <td className={cn(
                      'px-4 py-2 text-right font-mono font-medium',
                      isBid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      €{order.total_eur.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-50 dark:bg-navy-900/50 border-t border-navy-200 dark:border-navy-700 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            {isComplete ? 'Close' : 'Cancel'}
          </Button>
          {!hasLogs && (
            <Button
              variant="primary"
              className={isBid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={onConfirm}
              disabled={isCreating}
              loading={isCreating}
            >
              Create {preview.orders.length} Orders
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
