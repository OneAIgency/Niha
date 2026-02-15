import { useEffect, useRef, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';
import { cashMarketApi } from '../../services/api';
import type { CashMarketTrade } from '../../types';

// ─────────────────────────────────────────────────
// Trade → OHLC aggregation (adaptive bucket sizing)
// ─────────────────────────────────────────────────

// Nice time intervals to snap to
const NICE_BUCKETS = [60, 120, 300, 600, 900, 1800, 3600];
const TARGET_TRADES_PER_CANDLE = 4;

interface ParsedTrade {
  time: number; // unix seconds
  price: number;
  quantity: number;
}

function parseTrade(t: CashMarketTrade): ParsedTrade {
  let ts = Date.now() / 1000;
  if (t.executedAt) {
    try {
      const utc = t.executedAt.endsWith('Z') ? t.executedAt : t.executedAt + 'Z';
      const d = new Date(utc);
      if (!isNaN(d.getTime())) ts = d.getTime() / 1000;
    } catch { /* use fallback */ }
  }
  return { time: Math.floor(ts), price: t.price, quantity: t.quantity };
}

// Auto-detect trade frequency and pick a bucket that groups ~4 trades per candle
function getAdaptiveBucket(parsed: ParsedTrade[]): number {
  if (parsed.length < 2) return 300;
  const timeSpan = parsed[parsed.length - 1].time - parsed[0].time;
  const avgInterval = timeSpan / (parsed.length - 1);
  const target = avgInterval * TARGET_TRADES_PER_CANDLE;
  return NICE_BUCKETS.reduce((best, n) =>
    Math.abs(n - target) < Math.abs(best - target) ? n : best
  );
}

function tradesToCandles(trades: CashMarketTrade[]): CandlestickData<Time>[] {
  if (!trades.length) return [];

  const parsed = trades.map(parseTrade).sort((a, b) => a.time - b.time);
  const bucketSize = getAdaptiveBucket(parsed);
  const buckets = new Map<number, ParsedTrade[]>();

  for (const t of parsed) {
    const bucket = Math.floor(t.time / bucketSize) * bucketSize;
    const arr = buckets.get(bucket);
    if (arr) arr.push(t);
    else buckets.set(bucket, [t]);
  }

  const candles: CandlestickData<Time>[] = [];
  for (const [bucket, pts] of buckets) {
    const prices = pts.map(p => p.price);
    candles.push({
      time: bucket as Time,
      open: pts[0].price,
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: pts[pts.length - 1].price,
    });
  }

  candles.sort((a, b) => (a.time as number) - (b.time as number));
  return candles;
}

function tradesToLine(trades: CashMarketTrade[]): LineData<Time>[] {
  const parsed = trades.map(parseTrade).sort((a, b) => a.time - b.time);
  const seen = new Map<number, number>();
  for (const t of parsed) seen.set(t.time, t.price);
  return Array.from(seen.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time: time as Time, value }));
}

// ─────────────────────────────────────────────────
// Chart colors (matches our navy/emerald design)
// ─────────────────────────────────────────────────

const COLORS = {
  background: 'transparent',
  text: '#94a3b8',         // navy-400
  grid: 'rgba(51, 65, 85, 0.3)', // navy-700 @ 30%
  crosshair: '#64748b',   // navy-500
  upColor: '#34d399',      // emerald-400
  downColor: '#f87171',    // red-400
  lineColor: '#34d399',    // emerald-400
};

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

const MIN_CANDLES_FOR_CANDLESTICK = 3;

export function CEAPriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const modeRef = useRef<'candle' | 'line'>('candle');
  const tradesRef = useRef<CashMarketTrade[]>([]);

  // Update chart data — decides candle vs line based on data density
  const updateChart = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const trades = tradesRef.current;
    const candles = tradesToCandles(trades);
    const useCandlestick = candles.length >= MIN_CANDLES_FOR_CANDLESTICK;
    const currentMode = modeRef.current;

    // Switch series type if needed
    if (useCandlestick && currentMode !== 'candle') {
      if (seriesRef.current) chart.removeSeries(seriesRef.current);
      const s = chart.addSeries(CandlestickSeries, {
        upColor: COLORS.upColor,
        downColor: COLORS.downColor,
        borderVisible: false,
        wickUpColor: COLORS.upColor,
        wickDownColor: COLORS.downColor,
      });
      seriesRef.current = s;
      modeRef.current = 'candle';
    } else if (!useCandlestick && currentMode !== 'line') {
      if (seriesRef.current) chart.removeSeries(seriesRef.current);
      const s = chart.addSeries(LineSeries, {
        color: COLORS.lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: COLORS.lineColor,
      });
      seriesRef.current = s;
      modeRef.current = 'line';
    }

    // Set data
    if (useCandlestick && seriesRef.current) {
      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(candles);
    } else if (seriesRef.current) {
      (seriesRef.current as ISeriesApi<'Line'>).setData(tradesToLine(trades));
    }

    // Fixed bar spacing for consistent thin candles, right-aligned
    chart.timeScale().applyOptions({ barSpacing: 12 });
    chart.timeScale().scrollToRealTime();
  }, []);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid' as const, color: COLORS.background },
        textColor: COLORS.text,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: {
        vertLine: { color: COLORS.crosshair, width: 1, style: 3, labelBackgroundColor: '#1e293b' },
        horzLine: { color: COLORS.crosshair, width: 1, style: 3, labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 12,
        minBarSpacing: 3,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Initial series — candlestick by default
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.upColor,
      downColor: COLORS.downColor,
      borderVisible: false,
      wickUpColor: COLORS.upColor,
      wickDownColor: COLORS.downColor,
    });
    seriesRef.current = candleSeries;
    modeRef.current = 'candle';

    // Resize observer
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Fetch data + live updates
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const trades = await cashMarketApi.getRecentTrades('CEA', 5000);
        if (!mounted) return;
        tradesRef.current = trades;
        updateChart();
      } catch (err) {
        console.error('CEAPriceChart fetch error:', err);
      }
    };
    fetchData();

    // Live trade events
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ trade: CashMarketTrade }>).detail;
      if (!detail?.trade || !mounted) return;
      if (detail.trade.certificateType !== 'CEA') return;
      tradesRef.current = [...tradesRef.current, detail.trade];
      updateChart();
    };
    window.addEventListener('nihao:tradeExecuted', handler);

    return () => {
      mounted = false;
      window.removeEventListener('nihao:tradeExecuted', handler);
    };
  }, [updateChart]);

  return (
    <div className="rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 bg-navy-800/30 widget-accent-emerald glow-emerald">
      <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5 shrink-0">
        <TrendingUp className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">CEA Price</span>
        <div className="live-dot bg-emerald-400 ml-auto" title="Live" />
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 relative" />
    </div>
  );
}
