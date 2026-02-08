import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  RefreshCw,
  Zap,
  Play,
  Square,
} from 'lucide-react';
import { Card, Button, formatNumberWithSeparators, AlertBanner } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import { adminApi } from '../services/api';
import { useAutoOrdersStore, startAutoOrders, stopAutoOrders } from '../stores/useAutoOrdersStore';
import type { AutoTradeMarketSettings } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REFRESH_INTERVAL_MS = 10_000;

interface MarketConfig {
  title: string;
  subtitle: string;
  color: 'emerald' | 'red' | 'blue';
  icon: typeof TrendingUp;
  accentBorder: string;
}

const MARKET_CONFIG: Record<string, MarketConfig> = {
  CEA_BID: {
    title: 'CEA Buyer',
    subtitle: 'Buy Orders · BID',
    color: 'emerald',
    icon: TrendingUp,
    accentBorder: 'border-l-emerald-500',
  },
  CEA_ASK: {
    title: 'CEA Seller',
    subtitle: 'Sell Orders · ASK',
    color: 'red',
    icon: TrendingDown,
    accentBorder: 'border-l-red-500',
  },
  EUA_SWAP: {
    title: 'Swap EUA',
    subtitle: 'CEA → EUA Swap',
    color: 'blue',
    icon: ArrowLeftRight,
    accentBorder: 'border-l-blue-500',
  },
};

const COLOR_MAP = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500', toggle: 'bg-emerald-500' },
  red: { text: 'text-red-400', bg: 'bg-red-500/20', bar: 'bg-red-500', toggle: 'bg-red-500' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/20', bar: 'bg-blue-500', toggle: 'bg-blue-500' },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined) return '€0';
  return `€${formatNumberWithSeparators(value, 'en-US', 0)}`;
}

function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string | { msg?: string }[]; message?: string } } }).response;
    const d = res?.data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    const m = res?.data?.message;
    if (typeof m === 'string') return m;
  }
  return (err as Error)?.message ?? 'Something went wrong.';
}

// ============================================================================
// SMALL COMPONENTS
// ============================================================================

function ToggleSwitch({ checked, onChange, disabled, color = 'emerald' }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  color?: 'emerald' | 'red' | 'blue';
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? COLOR_MAP[color].toggle : 'bg-navy-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function LiquidityBar({ current, target, color }: {
  current: number | null;
  target: number | null;
  color: 'emerald' | 'red' | 'blue';
}) {
  const pct = target && target > 0 ? ((current || 0) / target) * 100 : 0;
  const clamped = Math.min(pct, 150);
  const w = (clamped / 150) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-navy-400">Liquidity</span>
        <span className="text-white font-medium">
          {formatEuro(current)} <span className="text-navy-500">/ {formatEuro(target)}</span>
        </span>
      </div>
      <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${COLOR_MAP[color].bar} rounded-full transition-all duration-500`}
          style={{ width: `${w}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-navy-600">
        <span>0%</span>
        <span>{pct > 0 ? `${pct.toFixed(0)}%` : '-'}</span>
        <span>150%</span>
      </div>
    </div>
  );
}

// ============================================================================
// MARKET SECTION COMPONENT
// ============================================================================

function MarketSection({ settings, onToggle, isToggling }: {
  settings: AutoTradeMarketSettings;
  onToggle: (enabled: boolean) => void;
  isToggling: boolean;
}) {
  const cfg = MARKET_CONFIG[settings.marketKey];
  const clr = COLOR_MAP[cfg.color];
  const Icon = cfg.icon;

  return (
    <Card className={`border-l-4 ${cfg.accentBorder} bg-navy-800/60 border-navy-700/30 overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-navy-700/30">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${clr.bg}`}>
            <Icon className={`w-5 h-5 ${clr.text}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{cfg.title}</h3>
            <p className="text-[11px] text-navy-400">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ON
            </span>
          ) : (
            <span className="text-xs text-navy-500 font-medium">OFF</span>
          )}
          <ToggleSwitch
            checked={settings.enabled}
            onChange={onToggle}
            disabled={isToggling}
            color={cfg.color}
          />
        </div>
      </div>

      {/* Liquidity Bar */}
      <div className="px-5 py-3 border-b border-navy-700/20">
        <LiquidityBar
          current={settings.currentLiquidity}
          target={settings.targetLiquidity}
          color={cfg.color}
        />
      </div>

      {/* MM Info footer */}
      <div className="px-5 py-3 bg-navy-900/30 flex items-center gap-1.5 text-[11px] text-navy-500">
        <Zap className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{settings.marketMakers.map(mm => mm.name).join(', ') || 'No MMs'}</span>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export function AutoTradePage() {
  const [markets, setMarkets] = useState<AutoTradeMarketSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingSwap, setRefreshingSwap] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-orders — global background service (runs even when not on this page)
  const { isRunning: autoOrdering, nextOrderIn, orderCount } = useAutoOrdersStore();

  const loadMarkets = useCallback(async (silent = false) => {
    try {
      const data = await adminApi.getMarketSettings();
      const order = ['CEA_BID', 'CEA_ASK', 'EUA_SWAP'];
      data.sort((a, b) => order.indexOf(a.marketKey) - order.indexOf(b.marketKey));
      setMarkets(data);
      if (!silent) setError(null);
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    loadMarkets();
    refreshTimerRef.current = setInterval(() => loadMarkets(true), REFRESH_INTERVAL_MS);
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [loadMarkets]);

  // Toggle handler
  const handleToggle = useCallback(async (marketKey: string, enabled: boolean) => {
    setToggling(marketKey);
    try {
      const updated = await adminApi.updateMarketSettings(marketKey, { enabled });
      setMarkets(prev => prev.map(m => m.marketKey === marketKey ? updated : m));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }, []);

  // Refresh CEA Market handler
  const handleRefreshCea = useCallback(async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const result = await adminApi.refreshCeaMarket();
      const dev = result.price_deviation_pct ? ` (${Number(result.price_deviation_pct) > 0 ? '+' : ''}${result.price_deviation_pct}%)` : '';
      setRefreshResult(
        `CEA scraped: €${result.cea_price_eur} → mid: €${result.mid_price_eur}${dev}. ` +
        `${result.bid_orders_created} bids + ${result.ask_orders_created} asks.`
      );
      await loadMarkets(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [loadMarkets]);

  // Refresh Swap Market handler
  const handleRefreshSwap = useCallback(async () => {
    setRefreshingSwap(true);
    setRefreshResult(null);
    try {
      const result = await adminApi.refreshSwapMarket();
      const dev = result.midRatio ? ` (mid ratio: ${result.midRatio})` : '';
      setRefreshResult(
        `Swap: base ratio ${result.baseRatio}${dev}. ` +
        `${result.ordersCreated} orders → €${Number(result.liquidityEur).toLocaleString('en-US', { maximumFractionDigits: 0 })} / €${Number(result.targetLiquidityEur).toLocaleString('en-US', { maximumFractionDigits: 0 })}.`
      );
      await loadMarkets(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRefreshingSwap(false);
    }
  }, [loadMarkets]);

  // Clear refresh result after 8s
  useEffect(() => {
    if (refreshResult) {
      const t = setTimeout(() => setRefreshResult(null), 8000);
      return () => clearTimeout(t);
    }
  }, [refreshResult]);

  // Auto-refresh market data when an order is placed in the background
  const prevOrderCount = useRef(orderCount);
  useEffect(() => {
    if (orderCount > prevOrderCount.current) {
      loadMarkets(true);
    }
    prevOrderCount.current = orderCount;
  }, [orderCount, loadMarkets]);

  const subSubHeader = (
    <div className="flex items-center gap-3">
      {autoOrdering ? (
        <Button
          variant="danger"
          size="sm"
          onClick={stopAutoOrders}
          icon={<Square className="w-3.5 h-3.5" />}
        >
          Stop ({orderCount})
          {nextOrderIn !== null && (
            <span className="opacity-80 text-xs ml-1">{nextOrderIn}s</span>
          )}
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={startAutoOrders}
          icon={<Play className="w-3.5 h-3.5" />}
        >
          Auto Orders
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRefreshCea}
        disabled={refreshing}
        icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
      >
        Refresh CEA
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRefreshSwap}
        disabled={refreshingSwap}
        icon={<ArrowLeftRight className={`w-4 h-4 ${refreshingSwap ? 'animate-spin' : ''}`} />}
      >
        Refresh Swap
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => loadMarkets()}
        disabled={loading}
        icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        title="Refresh data"
        aria-label="Refresh data"
      />
    </div>
  );

  return (
    <BackofficeLayout subSubHeader={subSubHeader}>
      {error && (
            <AlertBanner
              variant="error"
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}
          {refreshResult && (
            <AlertBanner
              variant="success"
              message={refreshResult}
              onDismiss={() => setRefreshResult(null)}
              className="mb-4"
            />
          )}

          {loading && markets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {markets.map(market => (
                <MarketSection
                  key={market.marketKey}
                  settings={market}
                  onToggle={(enabled) => handleToggle(market.marketKey, enabled)}
                  isToggling={toggling === market.marketKey}
                />
              ))}
            </div>
          )}
    </BackofficeLayout>
  );
}

export default AutoTradePage;
