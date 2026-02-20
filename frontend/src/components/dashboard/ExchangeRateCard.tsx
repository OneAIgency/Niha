import { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, Skeleton } from '../common';
import { exchangeRatesApi } from '../../services/api';
import type { ChartPoint, ExchangeRatePeriod, ExchangeRateHistoryResponse } from '../../types';

const PERIODS: ExchangeRatePeriod[] = ['24h', '7d', '30d'];

export function ExchangeRateCard() {
  const [period, setPeriod] = useState<ExchangeRatePeriod>('24h');
  const [data, setData] = useState<ExchangeRateHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await exchangeRatesApi.getHistory({ period });
      setData(response);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map response points to chart points
  const points: ChartPoint[] = data?.points?.map(p => ({
    price: p.rate,
    recordedAt: p.recordedAt,
  })) ?? [];

  // Calculate percentage change from first to last point
  const pctChange = points.length >= 2
    ? ((points[points.length - 1].price - points[0].price) / points[0].price) * 100
    : 0;
  const trending = pctChange >= 0;

  // Chart dimensions (following SettingsPage PriceHistoryChart pattern)
  const W = 600, H = 120, PX = 40, PY = 12;

  const prices = points.map(p => p.price);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const range = maxP - minP || 1;

  const toX = (i: number) => PX + (i / (points.length - 1)) * (W - PX * 2);
  const toY = (p: number) => PY + (1 - (p - minP) / range) * (H - PY * 2);

  const pathD = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(pt.price).toFixed(1)}`).join(' ');
  const areaD = points.length >= 2
    ? pathD + ` L${toX(points.length - 1).toFixed(1)},${(H - PY).toFixed(1)} L${PX.toFixed(1)},${(H - PY).toFixed(1)} Z`
    : '';

  // Y-axis labels (3 ticks)
  const yTicks = [minP, minP + range / 2, maxP];

  // X-axis labels (first, mid, last)
  const xIndices = points.length >= 3
    ? [0, Math.floor(points.length / 2), points.length - 1]
    : points.length === 2
      ? [0, 1]
      : points.length === 1
        ? [0]
        : [];

  const fmtTime = (iso: string) => {
    const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
    return d.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((mouseX - PX) / (W - PX * 2)) * (points.length - 1));
    if (idx >= 0 && idx < points.length) {
      setHover({ x: toX(idx), y: toY(points[idx].price), point: points[idx] });
    }
  };

  // eslint-disable-next-line no-restricted-syntax -- SVG chart requires direct color values
  const lineColor = trending ? '#10b981' : '#ef4444';
  // eslint-disable-next-line no-restricted-syntax -- SVG chart requires direct color values
  const fillColor = trending ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';

  // Loading state
  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={180} />
          </div>
          <div className="flex gap-1">
            <Skeleton variant="rectangular" width={32} height={24} className="rounded-full" />
            <Skeleton variant="rectangular" width={32} height={24} className="rounded-full" />
            <Skeleton variant="rectangular" width={32} height={24} className="rounded-full" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <Skeleton variant="text" width={100} height={28} />
          <Skeleton variant="text" width={60} height={18} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={120} className="rounded" />
      </Card>
    );
  }

  // Empty / error state
  if (!data || points.length < 2) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            EUR/CNY Exchange Rate
          </h3>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                  period === p
                    ? 'bg-navy-600 text-white'
                    : 'bg-navy-800 text-navy-400 hover:text-navy-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-xs text-navy-400">No exchange rate data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          EUR/CNY Exchange Rate
        </h3>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                period === p
                  ? 'bg-navy-600 text-white'
                  : 'bg-navy-800 text-navy-400 hover:text-navy-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Rate display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">
          {data.currentRate != null ? data.currentRate.toFixed(4) : '--'}
        </span>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            trending ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {trending ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {trending ? '+' : ''}{pctChange.toFixed(2)}%
        </span>
      </div>

      {/* SVG Sparkline Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={PX} x2={W - PX}
            y1={toY(t)} y2={toY(t)}
            stroke="currentColor"
            className="text-navy-700"
            strokeWidth="0.5"
            strokeDasharray="4 2"
          />
        ))}

        {/* Area fill */}
        <path d={areaD} fill={fillColor} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={PX - 4} y={toY(t) + 3}
            textAnchor="end"
            className="fill-navy-400"
            fontSize="9"
          >
            {t.toFixed(2)}
          </text>
        ))}

        {/* X-axis labels */}
        {xIndices.map((idx) => (
          <text
            key={idx}
            x={toX(idx)} y={H - 2}
            textAnchor="middle"
            className="fill-navy-400"
            fontSize="8"
          >
            {fmtTime(points[idx].recordedAt)}
          </text>
        ))}

        {/* Hover crosshair + tooltip */}
        {hover && (
          <>
            <line
              x1={hover.x} x2={hover.x}
              y1={PY} y2={H - PY}
              stroke={lineColor}
              strokeWidth="0.5"
              opacity="0.5"
            />
            <circle cx={hover.x} cy={hover.y} r="3" fill={lineColor} />
            <rect
              x={hover.x - 55} y={hover.y - 28}
              width="110" height="20" rx="4"
              className="fill-navy-700"
              opacity="0.9"
            />
            <text
              x={hover.x} y={hover.y - 15}
              textAnchor="middle"
              className="fill-white"
              fontSize="9"
              fontWeight="600"
            >
              {hover.point.price.toFixed(4)} &middot; {fmtTime(hover.point.recordedAt).split(',')[0]}
            </text>
          </>
        )}
      </svg>
    </Card>
  );
}
