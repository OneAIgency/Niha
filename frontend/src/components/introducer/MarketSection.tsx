import { Tabs } from '../common/Tabs';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { AccordionItem } from './AccordionItem';
import {
  EU_ETS_METRICS,
  CHINA_ETS_METRICS,
  EU_ETS_ACCORDIONS,
  CHINA_ETS_ACCORDIONS,
  COMPARISON_METRICS,
  LIQUIDITY_INVERSION_BARS,
  STRUCTURAL_FACTORS,
  depthAtLeast,
} from './constants';

const TABS = [
  { id: 'eu-ets', label: 'EU ETS' },
  { id: 'china-ets', label: 'China ETS' },
  { id: 'comparison', label: 'Head-to-Head' },
];

function MetricsGrid({ metrics }: { metrics: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {metrics.map((m) => (
        <div key={m.label} className="bg-navy-900/50 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold font-mono text-white">{m.value}</div>
          <div className="text-xs text-navy-500 mt-1">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function EUETSTab() {
  const { contentDepth } = useIntroducerStore();
  const visibleAccordions = EU_ETS_ACCORDIONS.filter((a) => depthAtLeast(contentDepth, a.depth));

  return (
    <div>
      <MetricsGrid metrics={EU_ETS_METRICS} />
      <div className="space-y-2">
        {visibleAccordions.map((item) => (
          <AccordionItem key={item.id} sectionId="markets-eu" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

function ChinaETSTab() {
  const { contentDepth } = useIntroducerStore();
  const visibleAccordions = CHINA_ETS_ACCORDIONS.filter((a) => depthAtLeast(contentDepth, a.depth));

  return (
    <div>
      <MetricsGrid metrics={CHINA_ETS_METRICS} />
      <div className="space-y-2">
        {visibleAccordions.map((item) => (
          <AccordionItem key={item.id} sectionId="markets-cn" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

function LiquidityInversionBars() {
  return (
    <div className="mt-6">
      <h5 className="text-xs uppercase tracking-wider text-navy-400 mb-3">Liquidity Inversion: China ETS vs NIHA Phase 3</h5>
      <div className="space-y-3">
        {LIQUIDITY_INVERSION_BARS.map((bar) => {
          const maxVal = Math.max(bar.chinaValue, bar.nihaPhase3Value) || 1;
          let chinaWidth = Math.max((bar.chinaValue / maxVal) * 100, 5);
          let nihaWidth = Math.max((bar.nihaPhase3Value / maxVal) * 100, 5);
          // For inverted metrics (lower = better), swap bar widths
          if (bar.invertBar) {
            chinaWidth = Math.max((1 - bar.chinaValue / (maxVal + 1)) * 100, 5);
            nihaWidth = Math.max((1 - bar.nihaPhase3Value / (maxVal + 1)) * 100, 5);
          }
          const formatValue = (val: number) =>
            bar.invertBar ? `T+${val}` : `${val}${bar.unit}`;
          return (
            <div key={bar.label}>
              <div className="text-xs text-navy-400 mb-1">{bar.label}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-500 w-16 text-right">China</span>
                  <div className="flex-1 bg-navy-900/50 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-amber-500/40 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${chinaWidth}%` }}
                    >
                      <span className="text-[10px] text-amber-300 font-mono">
                        {formatValue(bar.chinaValue)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-500 w-16 text-right">NIHA P3</span>
                  <div className="flex-1 bg-navy-900/50 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/40 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${nihaWidth}%` }}
                    >
                      <span className="text-[10px] text-emerald-300 font-mono">
                        {formatValue(bar.nihaPhase3Value)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StructuralFactorsTable() {
  return (
    <div className="mt-6">
      <h5 className="text-xs uppercase tracking-wider text-navy-400 mb-3">Structural Factor Comparison</h5>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-navy-500">
              <th className="pb-2 pr-3 font-medium">Factor</th>
              <th className="pb-2 px-3 font-medium">EU ETS</th>
              <th className="pb-2 px-3 font-medium">China ETS</th>
              <th className="pb-2 pl-3 font-medium">NIHA Implication</th>
            </tr>
          </thead>
          <tbody>
            {STRUCTURAL_FACTORS.map((row, i) => (
              <tr key={row.factor} className={i < STRUCTURAL_FACTORS.length - 1 ? 'border-b border-navy-800' : ''}>
                <td className="py-2 pr-3 text-xs text-navy-300 font-medium">{row.factor}</td>
                <td className="py-2 px-3 text-xs text-navy-400">{row.euEts}</td>
                <td className="py-2 px-3 text-xs text-navy-400">{row.chinaEts}</td>
                <td className="py-2 pl-3 text-xs text-emerald-400">{row.nihaImplication}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonTab() {
  const { contentDepth } = useIntroducerStore();
  const showAdvanced = depthAtLeast(contentDepth, 'advanced');
  const showExpert = depthAtLeast(contentDepth, 'expert');

  return (
    <div>
      {/* Metrics comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-navy-400">
              <th className="pb-3 pr-4 font-medium">Metric</th>
              <th className="pb-3 px-4 font-medium">EU ETS</th>
              <th className="pb-3 px-4 font-medium">China ETS</th>
              <th className="pb-3 pl-4 font-medium">Takeaway</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_METRICS.map((row, i) => (
              <tr key={row.metric} className={i < COMPARISON_METRICS.length - 1 ? 'border-b border-navy-800' : ''}>
                <td className="py-3 pr-4 text-sm text-navy-300 font-medium">{row.metric}</td>
                <td className="py-3 px-4 text-sm text-navy-400">{row.eu}</td>
                <td className="py-3 px-4 text-sm text-navy-400">{row.cn}</td>
                <td className="py-3 pl-4 text-sm text-emerald-400 font-medium">{row.highlight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdvanced && <LiquidityInversionBars />}
      {showExpert && <StructuralFactorsTable />}
    </div>
  );
}

export function MarketSection() {
  const { activeTabs, setActiveTab } = useIntroducerStore();
  const activeTab = activeTabs['markets'] ?? 'eu-ets';

  return (
    <div>
      <h3 className="section-heading text-white mb-4">Carbon Markets Deep Dive</h3>
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab('markets', tabId)}
        variant="pills"
        size="sm"
      />
      <div className="mt-6">
        {activeTab === 'eu-ets' && <EUETSTab />}
        {activeTab === 'china-ets' && <ChinaETSTab />}
        {activeTab === 'comparison' && <ComparisonTab />}
      </div>
    </div>
  );
}
