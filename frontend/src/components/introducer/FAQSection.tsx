import { useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs } from '../common/Tabs';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSection } from './SectionRegistry';
import { AccordionItem } from './AccordionItem';
import { SECTION_IDS, FAQ_CATEGORIES, FAQ_ITEMS, depthAtLeast } from './constants';
import { MiniFlow, MiniCheckGrid, MiniBarChart, MiniScale } from './charts';
import { RichText } from './RichText';

function FAQAccordionContent({ id, answer }: { id: string; answer: string }) {
  switch (id) {
    case 'swap-works':
      return (
        <>
          <RichText text={answer} />
          <MiniFlow
            title="The 5-Step Swap Process"
            steps={[
              { label: 'EU client deposits EUR', detail: 'Segregated escrow in HK' },
              { label: 'NIHA acquires Chinese credits', detail: 'Via NRA-RMB on pilot market' },
              { label: 'Credits held in custody', detail: 'NIHA registry account' },
              { label: 'Swap execution', detail: 'Chinese credits → EUA' },
              { label: 'EUA delivered to client', detail: 'Union Registry, T+0' },
            ]}
          />
        </>
      );
    case 'eu-cant-buy-cea':
      return (
        <>
          <RichText text={answer} />
          <MiniCheckGrid
            title="Access Barriers"
            headers={['National ETS', 'Pilot Markets']}
            rows={[
              {
                label: 'EU Entity',
                values: [
                  { text: 'Closed', status: 'no' },
                  { text: 'No precedent', status: 'no' },
                ],
              },
              {
                label: 'NIHA',
                values: [
                  { text: 'Closed', status: 'no' },
                  { text: 'Authorized', status: 'yes' },
                ],
              },
            ]}
          />
        </>
      );
    case 'replication-barrier':
      return (
        <>
          <RichText text={answer} />
          <MiniBarChart
            title="Barrier Strength (qualitative)"
            bars={[
              { label: 'Regulatory auth.', value: 95, color: 'rgb(248,113,113)' },
              { label: 'Bilateral relationships', value: 90, color: 'rgb(248,113,113)' },
              { label: 'Cross-border expertise', value: 80, color: 'rgb(251,191,36)' },
              { label: 'Execution infrastructure', value: 75, color: 'rgb(251,191,36)' },
              { label: 'Network effects', value: 85, color: 'rgb(248,113,113)' },
              { label: 'GBA jurisdiction', value: 95, color: 'rgb(248,113,113)' },
            ]}
            maxValue={100}
          />
        </>
      );
    case 'detailed-path-examples':
      return (
        <>
          <RichText text={answer} />
          <MiniBarChart
            title="Annual Savings by Path"
            bars={[
              { label: 'Path A (Steel)', value: 1620, displayValue: '€1.62M/yr', color: 'rgb(52,211,153)' },
              { label: 'Path B (Power)', value: 500, displayValue: '¥3M + EUR', color: 'rgb(251,191,36)' },
              { label: 'Path C (Trader)', value: 200, displayValue: '~3-5% improvement', color: 'rgb(96,165,250)' },
            ]}
          />
        </>
      );
    case 'business-model':
      return (
        <>
          <RichText text={answer} />
          <MiniScale
            title="Price Comparison"
            left={{ label: 'Direct', value: '€81/t', numericValue: 81, color: 'rgb(248,113,113)' }}
            right={{ label: 'Via NIHA', value: '€71-74/t', numericValue: 72.5, color: 'rgb(52,211,153)' }}
            ratio="8-12% savings"
          />
        </>
      );
    case 'competitive-moat':
      return (
        <>
          <RichText text={answer} />
          <MiniBarChart
            title="Five Moat Layers"
            bars={[
              { label: 'Geographic', value: 95, color: 'rgb(52,211,153)' },
              { label: 'Regulatory', value: 90, color: 'rgb(52,211,153)' },
              { label: 'Relationship', value: 85, color: 'rgb(251,191,36)' },
              { label: 'Network', value: 80, color: 'rgb(251,191,36)' },
              { label: 'First-mover', value: 75, color: 'rgb(96,165,250)' },
            ]}
            maxValue={100}
          />
        </>
      );
    default:
      return <>{answer}</>;
  }
}

export function FAQSection() {
  const ref = useSection(SECTION_IDS.FAQ);
  const { activeTabs, setActiveTab, contentDepth } = useIntroducerStore();
  const activeCategory = activeTabs['faq'] ?? 'getting-started';
  const [search, setSearch] = useState('');

  const tabs = FAQ_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

  const filteredItems = FAQ_ITEMS.filter((item) => {
    if (!depthAtLeast(contentDepth, item.depth)) return false;
    const matchesCategory = item.category === activeCategory;
    if (!search.trim()) return matchesCategory;
    const query = search.toLowerCase();
    return matchesCategory && (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  });

  return (
    <section ref={ref} id={SECTION_IDS.FAQ}>
      <h3 className="section-heading text-white mb-4">Frequently Asked Questions</h3>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-navy-900/50 border border-navy-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-navy-600 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>

      {/* Category tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeCategory}
        onChange={(tabId) => setActiveTab('faq', tabId)}
        variant="pills"
        size="sm"
        className="mb-6"
      />

      {/* FAQ items */}
      <div className="space-y-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <AccordionItem
              key={item.id}
              sectionId="faq"
              itemId={item.id}
              title={item.question}
            >
              <FAQAccordionContent id={item.id} answer={item.answer} />
            </AccordionItem>
          ))
        ) : (
          <div className="text-center py-8 text-navy-500 text-sm">
            No questions match your search.
          </div>
        )}
      </div>
    </section>
  );
}
