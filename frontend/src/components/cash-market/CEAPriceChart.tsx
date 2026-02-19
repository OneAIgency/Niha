import { useEffect, useRef, useCallback, useState } from 'react';
import { TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { createChart, CandlestickSeries, LineSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';
import { cashMarketApi } from '../../services/api';
import type { CashMarketTrade } from '../../types';

// ─────────────────────────────────────────────────
// Time intervals
// ─────────────────────────────────────────────────

interface TimeInterval {
  label: string;
  seconds: number;
}

const TIME_INTERVALS: TimeInterval[] = [
  { label: '1m',  seconds: 60 },
  { label: '5m',  seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1h',  seconds: 3600 },
  { label: '6h',  seconds: 21600 },
  { label: '12h', seconds: 43200 },
  { label: '1D',  seconds: 86400 },
  { label: '1W',  seconds: 604800 },
  { label: '1M',  seconds: 2592000 },
];

const DEFAULT_INTERVAL = TIME_INTERVALS[2]; // 15m

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
  const candlesRef = useRef<CandlestickData<Time>[]>([]);
  const intervalRef = useRef(DEFAULT_INTERVAL);

  const [interval, setInterval] = useState<TimeInterval>(DEFAULT_INTERVAL);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Render candle data on chart — decides candle vs line based on density
  const renderChart = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const candles = candlesRef.current;
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
      const lineData: LineData<Time>[] = candles.map(c => ({
        time: c.time,
        value: c.close,
      }));
      (seriesRef.current as ISeriesApi<'Line'>).setData(lineData);
    }

    chart.timeScale().applyOptions({ barSpacing: 12 });
    chart.timeScale().scrollToRealTime();
  }, []);

  // Fetch OHLC data from server
  const fetchOHLC = useCallback(async () => {
    try {
      const data = await cashMarketApi.getOHLC('CEA', intervalRef.current.seconds);
      candlesRef.current = data.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      renderChart();
    } catch (err) {
      console.error('CEAPriceChart OHLC fetch error:', err);
    }
  }, [renderChart]);

  // Re-fetch when interval changes
  useEffect(() => {
    intervalRef.current = interval;
    fetchOHLC();
  }, [interval, fetchOHLC]);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: COLORS.background },
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

  // Fetch OHLC on mount + live trade updates + polling fallback
  useEffect(() => {
    let mounted = true;

    fetchOHLC();

    // Polling fallback: re-fetch OHLC every 30s to catch any missed WS events
    const poll = window.setInterval(() => { if (mounted) fetchOHLC(); }, 30000);

    // Live trade events — update the latest candle instantly
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ trade: CashMarketTrade }>).detail;
      if (!detail?.trade || !mounted) return;
      if (detail.trade.certificateType !== 'CEA') return;

      const trade = detail.trade;
      const price = trade.price;
      let ts = Date.now() / 1000;
      if (trade.executedAt) {
        try {
          const utc = trade.executedAt.endsWith('Z') ? trade.executedAt : trade.executedAt + 'Z';
          const d = new Date(utc);
          if (!isNaN(d.getTime())) ts = d.getTime() / 1000;
        } catch { /* use fallback */ }
      }

      const bucketSize = intervalRef.current.seconds;
      const bucket = Math.floor(ts / bucketSize) * bucketSize;
      const candles = candlesRef.current;
      const last = candles.length > 0 ? candles[candles.length - 1] : null;

      if (last && (last.time as number) === bucket) {
        // Update existing candle
        const updated: CandlestickData<Time> = {
          time: last.time,
          open: last.open,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
        };
        candlesRef.current = [...candles.slice(0, -1), updated];
      } else {
        // New candle bucket
        candlesRef.current = [...candles, {
          time: bucket as Time,
          open: price,
          high: price,
          low: price,
          close: price,
        }];
      }

      renderChart();
    };
    window.addEventListener('nihao:tradeExecuted', handler);

    return () => {
      mounted = false;
      clearInterval(poll);
      window.removeEventListener('nihao:tradeExecuted', handler);
    };
  }, [fetchOHLC, renderChart]);

  return (
    <div className="rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 bg-navy-800/30 widget-accent-emerald glow-emerald">
      <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5 shrink-0">
        <TrendingUp className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">CEA Price</span>

        {/* Interval selector */}
        <div className="relative ml-auto flex items-center gap-1.5" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
              text-navy-300 hover:text-white hover:bg-navy-700/50 transition-colors"
            aria-label="Select time interval"
          >
            <Clock className="w-3 h-3" />
            <span>{interval.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-navy-800 border border-navy-700 rounded-lg shadow-xl py-1 min-w-[80px]">
              {TIME_INTERVALS.map((ti) => (
                <button
                  key={ti.label}
                  onClick={() => { setInterval(ti); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1 text-[11px] font-mono transition-colors
                    ${ti.label === interval.label
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-navy-300 hover:text-white hover:bg-navy-700/50'
                    }`}
                >
                  {ti.label}
                </button>
              ))}
            </div>
          )}

          <div className="live-dot bg-emerald-400" title="Live" />
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 relative" />
    </div>
  );
}
