import { useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs } from '../common/Tabs';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSection } from './SectionRegistry';
import { AccordionItem } from './AccordionItem';
import { SECTION_IDS, FAQ_CATEGORIES, FAQ_ITEMS, depthAtLeast } from './constants';

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
              {item.answer}
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
