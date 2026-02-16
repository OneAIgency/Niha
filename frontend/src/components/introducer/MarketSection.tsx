import { Tabs } from '../common/Tabs';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { AccordionItem } from './AccordionItem';
import { MiniDonut, MiniBarChart, MiniScale, MiniTimeline, MiniCheckGrid } from './charts';
import { RichText } from './RichText';
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

function EUETSAccordionContent({ id, content }: { id: string; content: string }) {
  switch (id) {
    case 'structure':
      return (
        <>
          <RichText text={content} />
          <MiniDonut
            title="EU ETS Volume Breakdown"
            segments={[
              { label: 'Exchange', value: 64, color: 'rgb(96,165,250)' },
              { label: 'OTC Brokers', value: 36, color: 'rgb(251,191,36)' },
            ]}
          />
        </>
      );
    case 'supply-2026':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="Free Allocation Reduction (cumulative vs 2025)"
            horizontal={false}
            bars={[
              { label: '2026', value: 8, displayValue: '-8%', color: 'rgb(251,191,36)' },
              { label: '2027', value: 16, displayValue: '-16%', color: 'rgb(251,191,36)' },
              { label: '2028', value: 24, displayValue: '-24%', color: 'rgb(248,113,113)' },
              { label: '2029', value: 35, displayValue: '-35%', color: 'rgb(248,113,113)' },
              { label: '2030', value: 48, displayValue: '-48%', color: 'rgb(239,68,68)' },
            ]}
          />
        </>
      );
    case 'trading-venues':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="Volume by Venue"
            bars={[
              { label: 'ICE Endex', value: 60, displayValue: '~60%', color: 'rgb(96,165,250)' },
              { label: 'EEX', value: 25, displayValue: '~25%', color: 'rgb(52,211,153)' },
              { label: 'OTC', value: 15, displayValue: '15-25%', color: 'rgb(251,191,36)' },
            ]}
          />
        </>
      );
    case 'alternatives':
      return (
        <>
          <RichText text={content} />
          <MiniScale
            title="Cost per Tonne"
            left={{ label: 'Direct', value: '€81/t', numericValue: 81, color: 'rgb(248,113,113)' }}
            right={{ label: 'Via NIHA', value: '€71-74/t', numericValue: 72.5, color: 'rgb(52,211,153)' }}
            ratio="8-12% savings"
          />
        </>
      );
    case 'exchange-details':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="Margin Requirements"
            bars={[
              { label: 'ICE Futures', value: 20, displayValue: '15-20%', color: 'rgb(96,165,250)' },
              { label: 'ECC', value: 18, displayValue: '~18%', color: 'rgb(52,211,153)' },
              { label: 'NIHA', value: 100, displayValue: '100% prefunded', color: 'rgb(251,191,36)' },
            ]}
          />
        </>
      );
    case 'otc-share':
      return (
        <>
          <RichText text={content} />
          <MiniDonut
            title="Carbon Market Structure"
            segments={[
              { label: 'Exchange-traded', value: 75, color: 'rgb(96,165,250)' },
              { label: 'OTC (NIHA target)', value: 25, color: 'rgb(52,211,153)' },
            ]}
          />
        </>
      );
    case 'phase-out':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="CBAM Sector Free Allocation (% remaining)"
            horizontal={false}
            maxValue={100}
            bars={[
              { label: '2026', value: 92, displayValue: '92%', color: 'rgb(52,211,153)' },
              { label: '2028', value: 76, displayValue: '76%', color: 'rgb(251,191,36)' },
              { label: '2030', value: 52, displayValue: '52%', color: 'rgb(251,191,36)' },
              { label: '2032', value: 25, displayValue: '25%', color: 'rgb(248,113,113)' },
              { label: '2034', value: 0, displayValue: '0%', color: 'rgb(239,68,68)' },
            ]}
            annotation="CBAM sectors: cement, steel, aluminium, fertiliser, electricity, hydrogen"
          />
        </>
      );
    default:
      return <RichText text={content} />;
  }
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
            <EUETSAccordionContent id={item.id} content={item.content} />
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

function ChinaETSAccordionContent({ id, content }: { id: string; content: string }) {
  switch (id) {
    case 'structure':
      return (
        <>
          <RichText text={content} />
          <MiniTimeline
            title="China ETS Expansion"
            events={[
              { year: '2021', label: 'Power sector launch', detail: '~2,200 entities', color: 'rgb(52,211,153)' },
              { year: '2024', label: 'Steel & cement added', detail: '+800 entities', color: 'rgb(251,191,36)', highlight: true },
              { year: '2025', label: 'Aluminium added', detail: '3,500+ total', color: 'rgb(251,191,36)', highlight: true },
              { year: '2027', label: 'Absolute cap transition', detail: 'Intensity \u2192 absolute', color: 'rgb(248,113,113)' },
            ]}
          />
        </>
      );
    case 'liquidity':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            horizontal={false}
            title="Quarterly Volume Distribution"
            maxValue={100}
            bars={[
              { label: 'Q1', value: 5, displayValue: '5%', color: 'rgb(100,116,139)' },
              { label: 'Q2', value: 10, displayValue: '10%', color: 'rgb(100,116,139)' },
              { label: 'Q3', value: 6, displayValue: '6%', color: 'rgb(100,116,139)' },
              { label: 'Q4', value: 79, displayValue: '79%', color: 'rgb(251,191,36)' },
            ]}
            annotation="79% of volume in Q4 — extreme compliance-driven seasonality"
          />
        </>
      );
    case 'access':
      return (
        <>
          <RichText text={content} />
          <MiniCheckGrid
            title="Foreign Access by Market Type"
            headers={['National ETS', 'Pilot Markets']}
            rows={[
              { label: 'EU Entities', values: [{ text: 'Blocked', status: 'no' }, { text: 'Practically impossible', status: 'no' }] },
              { label: 'HK Entities', values: [{ text: 'Blocked', status: 'no' }, { text: 'SAFE authorization', status: 'partial' }] },
              { label: 'NIHA (GBA)', values: [{ text: 'Blocked', status: 'no' }, { text: 'Authorized', status: 'yes' }] },
            ]}
          />
        </>
      );
    case 'expansion':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="Covered Entities"
            bars={[
              { label: '2021 Power', value: 2200, displayValue: '2,200', color: 'rgb(96,165,250)' },
              { label: '2024 +Steel/Cement', value: 3000, displayValue: '3,000', color: 'rgb(251,191,36)' },
              { label: '2025 +Aluminium', value: 3500, displayValue: '3,500+', color: 'rgb(52,211,153)' },
            ]}
          />
        </>
      );
    case 'venues':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            title="Trading Venue Activity"
            bars={[
              { label: 'Shanghai SEEE', value: 45, displayValue: 'Primary national', color: 'rgb(96,165,250)' },
              { label: 'Shenzhen', value: 30, displayValue: 'Most active pilot', color: 'rgb(52,211,153)' },
              { label: 'Hubei', value: 15, displayValue: 'Significant national', color: 'rgb(251,191,36)' },
              { label: 'Other pilots', value: 10, displayValue: 'Beijing, Tianjin, etc.', color: 'rgb(100,116,139)' },
            ]}
          />
        </>
      );
    case 'seasonal':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            horizontal={false}
            title="Monthly Volume Pattern"
            bars={[
              { label: 'Jan', value: 2, color: 'rgb(100,116,139)' },
              { label: 'Feb', value: 1, color: 'rgb(100,116,139)' },
              { label: 'Mar', value: 2, color: 'rgb(100,116,139)' },
              { label: 'Apr', value: 3, color: 'rgb(100,116,139)' },
              { label: 'May', value: 4, color: 'rgb(100,116,139)' },
              { label: 'Jun', value: 3, color: 'rgb(100,116,139)' },
              { label: 'Jul', value: 2, color: 'rgb(100,116,139)' },
              { label: 'Aug', value: 2, color: 'rgb(100,116,139)' },
              { label: 'Sep', value: 2, color: 'rgb(100,116,139)' },
              { label: 'Oct', value: 18, color: 'rgb(251,191,36)' },
              { label: 'Nov', value: 27, color: 'rgb(251,191,36)' },
              { label: 'Dec', value: 34, color: 'rgb(248,113,113)' },
            ]}
            annotation="NIHA sources CEA at favorable prices Q1-Q3, executes swaps year-round"
          />
        </>
      );
    case 'cap-2027':
      return (
        <>
          <RichText text={content} />
          <MiniBarChart
            horizontal={false}
            title="CEA Price Projection (\u00A5/t)"
            bars={[
              { label: '2025', value: 90, displayValue: '\u00A580-100', color: 'rgb(100,116,139)' },
              { label: '2026', value: 100, displayValue: '\u00A580-100', color: 'rgb(251,191,36)' },
              { label: '2027', value: 115, displayValue: '\u00A5100-130', color: 'rgb(251,191,36)' },
              { label: '2028', value: 150, displayValue: '\u00A5130-170', color: 'rgb(248,113,113)' },
              { label: '2030', value: 200, displayValue: '\u00A5200+', color: 'rgb(239,68,68)' },
            ]}
            annotation="As prices rise, ratio compresses from 7-10\u00D7 to ~5\u00D7"
          />
        </>
      );
    default:
      return <RichText text={content} />;
  }
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
            <ChinaETSAccordionContent id={item.id} content={item.content} />
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
