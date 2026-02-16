import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSection } from './SectionRegistry';
import {
  SECTION_IDS,
  LEGAL_SUMMARY_CARDS,
  NIHA_AUTHORIZATION_CHAIN,
  LEGAL_ACCORDIONS,
  depthAtLeast,
} from './constants';
import { AccordionItem } from './AccordionItem';

const STATUS_COLORS = {
  red: { bg: 'border-red-500/30', text: 'text-red-400' },
  amber: { bg: 'border-amber-500/30', text: 'text-amber-400' },
  emerald: { bg: 'border-emerald-500/30', text: 'text-emerald-400' },
} as const;

export function LegalSection() {
  const ref = useSection(SECTION_IDS.LEGAL);
  const { contentDepth } = useIntroducerStore();
  const visibleAccordions = LEGAL_ACCORDIONS.filter((a) => depthAtLeast(contentDepth, a.depth));

  return (
    <section ref={ref} id={SECTION_IDS.LEGAL}>
      <h3 className="section-heading text-white mb-4">Legal & Regulatory Framework</h3>

      {/* Three-lock summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {LEGAL_SUMMARY_CARDS.map((card) => {
          const colors = STATUS_COLORS[card.statusColor];
          return (
            <div
              key={card.label}
              className={cn(
                'bg-navy-800/50 border rounded-lg p-4',
                colors.bg,
              )}
            >
              <div className={cn('text-lg font-semibold mb-1', colors.text)}>
                {card.status}
              </div>
              <div className="text-xs font-medium text-navy-300 mb-1">{card.label}</div>
              <div className="text-xs text-navy-500 leading-relaxed">{card.description}</div>
            </div>
          );
        })}
      </div>

      {/* Authorization chain */}
      <div className="bg-navy-800/30 border border-navy-700 rounded-xl p-4 mb-6">
        <div className="text-xs uppercase tracking-wider text-navy-400 mb-3">
          NIHA Authorization Chain — Required Approvals
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {NIHA_AUTHORIZATION_CHAIN.map((item, i) => (
            <div key={item.step} className="flex items-center gap-2">
              <div className="bg-navy-700/80 border border-navy-600 rounded-lg px-3 py-1.5 text-center min-w-[90px]">
                <div className="text-xs font-mono font-semibold text-emerald-400">{item.step}</div>
                <div className="text-[10px] text-navy-400 leading-tight mt-0.5">{item.label}</div>
              </div>
              {i < NIHA_AUTHORIZATION_CHAIN.length - 1 && (
                <span className="text-navy-600 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accordion items */}
      <div className="space-y-2">
        {visibleAccordions.map((item) => (
          <AccordionItem key={item.id} sectionId="legal" itemId={item.id} title={item.title}>
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
