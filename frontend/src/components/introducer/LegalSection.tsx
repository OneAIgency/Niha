import { useSection } from './SectionRegistry';
import { SECTION_IDS, LEGAL_ACCORDIONS } from './constants';
import { AccordionItem } from './AccordionItem';

export function LegalSection() {
  const ref = useSection(SECTION_IDS.LEGAL);

  return (
    <section ref={ref} id={SECTION_IDS.LEGAL}>
      <h3 className="section-heading text-white mb-4">Legal & Regulatory Framework</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-red-400 mb-1">Closed</div>
          <div className="text-xs text-navy-400">China&apos;s National ETS — no foreign access</div>
        </div>
        <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-amber-400 mb-1">Separate</div>
          <div className="text-xs text-navy-400">EU registry system — different infrastructure</div>
        </div>
        <div className="bg-navy-800/50 border border-emerald-500/30 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-emerald-400 mb-1">NIHA (HK)</div>
          <div className="text-xs text-navy-400">The only bridge — GBA + EU access</div>
        </div>
      </div>

      {/* Accordion items */}
      <div className="space-y-2">
        {LEGAL_ACCORDIONS.map((item) => (
          <AccordionItem key={item.id} sectionId="legal" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
