import { useEffect, useState, useRef } from 'react';
import { Leaf } from 'lucide-react';
import { cashMarketApi } from '../../services/api';
import type { CashMarketTrade } from '../../types';
import { CHART_NAVY, GAUGE_COLORS } from '../../constants/chartColors';

/** CO2 equivalence factors (approximate, for storytelling) */
const TONS_PER_CEA = 1; // 1 CEA = 1 tonne CO2
const TREES_PER_TON = 45; // ~45 trees absorb 1 ton CO2/year
const CAR_KM_PER_TON = 4_600; // ~4600 km driven per ton CO2

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

interface Metric {
  label: string;
  value: string;
  raw: number;
  sub: string;
  color: string;
  gradFrom: string;
  gradTo: string;
}

/** Mini radial gauge SVG */
function MiniGauge({ pct, color }: { pct: number; color: string }) {
  const r = 18;
  const stroke = 3;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - Math.min(pct, 1));
  return (
    <svg width={44} height={44} className="shrink-0">
      <circle cx={22} cy={22} r={r} fill="none" stroke={CHART_NAVY[800]} strokeWidth={stroke} />
      <circle
        cx={22} cy={22} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export function EnvironmentalImpact() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const maxRef = useRef({ tons: 100000, trees: 4500000, km: 460000000, trades: 200 });

  useEffect(() => {
    let mounted = true;

    const compute = (trades: CashMarketTrade[]) => {
      const totalQty = trades.reduce((s, t) => s + t.quantity, 0);
      const tonsCO2 = totalQty * TONS_PER_CEA;
      const trees = tonsCO2 * TREES_PER_TON;
      const carKm = tonsCO2 * CAR_KM_PER_TON;

      // Update maxes for gauge normalization
      const m = maxRef.current;
      if (tonsCO2 > m.tons) m.tons = tonsCO2 * 1.2;
      if (trees > m.trees) m.trees = trees * 1.2;
      if (carKm > m.km) m.km = carKm * 1.2;
      if (trades.length > m.trades) m.trades = trades.length * 1.2;

      setMetrics([
        { label: 'CO\u2082 Traded', value: formatCompact(tonsCO2), raw: tonsCO2 / m.tons, sub: 'tonnes today', color: 'text-emerald-400', gradFrom: 'from-emerald-500/10', gradTo: 'to-emerald-500/0' },
        { label: 'Tree Equiv.', value: formatCompact(trees), raw: trees / m.trees, sub: 'trees/year absorb', color: 'text-green-400', gradFrom: 'from-green-500/10', gradTo: 'to-green-500/0' },
        { label: 'Cars Off Road', value: formatCompact(carKm), raw: carKm / m.km, sub: 'km equivalent', color: 'text-teal-400', gradFrom: 'from-teal-500/10', gradTo: 'to-teal-500/0' },
        { label: 'Trades', value: String(trades.length), raw: trades.length / m.trades, sub: 'executed today', color: 'text-cyan-400', gradFrom: 'from-cyan-500/10', gradTo: 'to-cyan-500/0' },
      ]);
    };

    cashMarketApi.getRecentTrades('CEA', 100)
      .then((trades) => { if (mounted) compute(trades); })
      .catch(() => {
        if (mounted) setMetrics([
          { label: 'CO\u2082 Traded', value: '—', raw: 0, sub: 'loading...', color: 'text-emerald-400', gradFrom: 'from-emerald-500/10', gradTo: 'to-emerald-500/0' },
          { label: 'Tree Equiv.', value: '—', raw: 0, sub: 'loading...', color: 'text-green-400', gradFrom: 'from-green-500/10', gradTo: 'to-green-500/0' },
          { label: 'Cars Off Road', value: '—', raw: 0, sub: 'loading...', color: 'text-teal-400', gradFrom: 'from-teal-500/10', gradTo: 'to-teal-500/0' },
          { label: 'Trades', value: '—', raw: 0, sub: 'loading...', color: 'text-cyan-400', gradFrom: 'from-cyan-500/10', gradTo: 'to-cyan-500/0' },
        ]);
      });

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ trade: CashMarketTrade }>).detail;
      if (!detail?.trade || detail.trade.certificateType !== 'CEA' || !mounted) return;
      cashMarketApi.getRecentTrades('CEA', 100)
        .then((trades) => { if (mounted) compute(trades); })
        .catch(() => {});
    };
    window.addEventListener('nihao:tradeExecuted', handler);

    return () => { mounted = false; window.removeEventListener('nihao:tradeExecuted', handler); };
  }, []);

  return (
    <div className="rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 bg-navy-800/30 widget-accent-green">
      <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5 shrink-0">
        <Leaf className="w-3 h-3 text-green-400" />
        <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">Environmental Impact</span>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-px bg-navy-700/20 overflow-hidden">
        {metrics.map((m, i) => (
          <div key={m.label} className={`bg-gradient-to-br ${m.gradFrom} ${m.gradTo} bg-navy-800/60 flex items-center gap-2 p-3`}>
            <MiniGauge pct={m.raw} color={GAUGE_COLORS[i]} />
            <div className="flex flex-col min-w-0">
              <span className={`text-base font-bold font-mono tabular-nums leading-tight ${m.color}`}>{m.value}</span>
              <span className="text-[10px] text-navy-300 font-medium leading-tight">{m.label}</span>
              <span className="text-[9px] text-navy-500 leading-tight">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
