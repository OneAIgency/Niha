import { Tabs } from '../common/Tabs';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { AccordionItem } from './AccordionItem';
import {
  EU_ETS_METRICS,
  CHINA_ETS_METRICS,
  EU_ETS_ACCORDIONS,
  CHINA_ETS_ACCORDIONS,
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
  return (
    <div>
      <MetricsGrid metrics={EU_ETS_METRICS} />
      <div className="space-y-2">
        {EU_ETS_ACCORDIONS.map((item) => (
          <AccordionItem key={item.id} sectionId="markets-eu" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

function ChinaETSTab() {
  return (
    <div>
      <MetricsGrid metrics={CHINA_ETS_METRICS} />
      <div className="space-y-2">
        {CHINA_ETS_ACCORDIONS.map((item) => (
          <AccordionItem key={item.id} sectionId="markets-cn" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

const COMPARISON_METRICS = [
  { metric: 'Spot Price', eu: '€81/t', cn: '~€11/t', highlight: '7-10× gap' },
  { metric: 'Daily Volume', eu: '€3B+', cn: '€9.5M', highlight: '316× difference' },
  { metric: 'Bid-Ask Spread', eu: '2-5 bps', cn: '1-2%', highlight: '50-100× wider' },
  { metric: 'Trading Hours', eu: '11h/day', cn: '4h/day', highlight: '' },
  { metric: 'Covered Entities', eu: '~10,000', cn: '3,500+', highlight: '' },
  { metric: 'Foreign Access', eu: 'Open (MiFID II)', cn: 'Closed', highlight: 'Key barrier' },
];

function ComparisonTab() {
  return (
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
