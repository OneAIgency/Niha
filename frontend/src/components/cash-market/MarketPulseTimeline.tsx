import { useMemo } from 'react';
import { Gauge, Calendar } from 'lucide-react';
import type { OrderBookLevel } from '../../types';

// =============================================================================
// MARKET PULSE — sentiment gauge from bid/ask volume ratio
// =============================================================================

interface MarketPulseProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

function MarketPulse({ bids, asks }: MarketPulseProps) {
  const { ratio, sentiment, color, barPct } = useMemo(() => {
    const bidVol = bids.reduce((s, b) => s + b.quantity, 0);
    const askVol = asks.reduce((s, a) => s + a.quantity, 0);
    const total = bidVol + askVol;
    if (total === 0) return { ratio: 0.5, sentiment: 'Neutral', color: 'text-navy-300', barPct: 50 };

    const r = bidVol / total;
    const pct = Math.round(r * 100);
    if (r > 0.6) return { ratio: r, sentiment: 'Bullish', color: 'text-emerald-400', barPct: pct };
    if (r < 0.4) return { ratio: r, sentiment: 'Bearish', color: 'text-red-400', barPct: pct };
    return { ratio: r, sentiment: 'Neutral', color: 'text-navy-300', barPct: pct };
  }, [bids, asks]);

  return (
    <div className="px-3 py-3 flex flex-col gap-2 flex-1 justify-center">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${color}`}>{sentiment}</span>
        <span className="text-xs font-mono text-navy-400">{(ratio * 100).toFixed(0)}% bid</span>
      </div>
      {/* Bid/Ask bar */}
      <div className="h-2 rounded-full bg-navy-700/50 overflow-hidden flex">
        <div
          className="h-full bg-emerald-500/60 transition-all duration-500"
          style={{ width: `${barPct}%` }}
        />
        <div
          className="h-full bg-red-500/60 transition-all duration-500"
          style={{ width: `${100 - barPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-navy-500">
        <span>Bid volume</span>
        <span>Ask volume</span>
      </div>
    </div>
  );
}

// =============================================================================
// REGULATORY TIMELINE — static upcoming dates
// =============================================================================

interface TimelineEvent {
  date: string;
  label: string;
  type: 'cbam' | 'ets' | 'compliance';
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  { date: '2026-03-31', label: 'CBAM Q1 Report Deadline', type: 'cbam' },
  { date: '2026-06-30', label: 'EU ETS Phase IV Allocation', type: 'ets' },
  { date: '2026-09-30', label: 'CBAM Transitional End', type: 'cbam' },
  { date: '2027-01-01', label: 'CBAM Definitive Phase Start', type: 'cbam' },
  { date: '2027-04-30', label: 'EU ETS 2026 Compliance', type: 'compliance' },
];

const TYPE_STYLES = {
  cbam: { dot: 'bg-amber-400', text: 'text-amber-400' },
  ets: { dot: 'bg-blue-400', text: 'text-blue-400' },
  compliance: { dot: 'bg-red-400', text: 'text-red-400' },
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00Z');
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function RegulatoryTimeline() {
  return (
    <div className="px-3 py-2 flex flex-col justify-around flex-1">
      {TIMELINE_EVENTS.map((ev) => {
        const days = daysUntil(ev.date);
        const style = TYPE_STYLES[ev.type];
        return (
          <div key={ev.date + ev.label} className={`flex items-center gap-2 py-1.5 px-2 -mx-0 rounded-md hover:bg-navy-700/20 transition-colors border-l-2 ${
            ev.type === 'cbam' ? 'border-l-amber-500/40' : ev.type === 'ets' ? 'border-l-blue-500/40' : 'border-l-red-500/40'
          }`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
            <span className="text-[11px] text-navy-300 flex-1 min-w-0 truncate">{ev.label}</span>
            <span className={`text-[11px] font-mono shrink-0 ${days <= 45 ? 'text-amber-400 font-medium' : 'text-navy-500'}`}>
              {days > 0 ? `${days}d` : 'now'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// COMBINED WIDGET
// =============================================================================

interface MarketPulseTimelineProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function MarketPulseTimeline({ bids, asks }: MarketPulseTimelineProps) {
  return (
    <div className="rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 bg-navy-800/30 widget-accent-amber">
      {/* Pulse section */}
      <div className="flex flex-col shrink-0">
        <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5">
          <Gauge className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">Market Pulse</span>
          <div className="live-dot bg-amber-400 ml-auto" title="Live" />
        </div>
        <MarketPulse bids={bids} asks={asks} />
      </div>
      {/* Divider */}
      <div className="border-t border-navy-700/50" />
      {/* Timeline section — flex to fill remaining */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5 shrink-0">
          <Calendar className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">Regulatory Timeline</span>
        </div>
        <RegulatoryTimeline />
      </div>
    </div>
  );
}
