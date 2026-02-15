import { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '../../utils';
import { useSection } from './SectionRegistry';
import { SECTION_IDS, BATTLE_CARDS } from './constants';
import { DocumentPanel } from './DocumentPanel';

const badgeColorMap = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/20 text-blue-400',
  amber: 'bg-amber-500/20 text-amber-400',
} as const;

const iconBgMap = {
  emerald: 'bg-emerald-500/20',
  blue: 'bg-blue-500/20',
  amber: 'bg-amber-500/20',
} as const;

const iconTextMap = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
} as const;

// Battle card content for the document panel
const BATTLE_CARD_CONTENT: Record<string, string> = {
  comparison: 'This battle card provides a detailed side-by-side comparison between purchasing EUA directly on European exchanges versus using NIHA\'s CEA→EUA swap mechanism. Key talking points include the 8-12% cost savings, zero market impact through dark pool execution, instant T+0 settlement, and simplified compliance process. Use this when a prospect asks "Why wouldn\'t I just buy EUA directly?"',
  'cheat-sheet': 'Quick reference for all critical metrics: EU ETS spot price (€81/t), China ETS spot price (¥80-100/~€9-11/t), price gap (7-10×), NIHA discount range (8-12%), daily volumes (€3B+ EU vs €9.5M China), settlement speed (T+0 vs T+2), covered entities (~10,000 EU + 3,500+ China). Updated quarterly.',
  objections: 'Top objections and responses: 1) "Sounds too good to be true" → The arbitrage exists because two markets are structurally disconnected. 2) "Is this legal?" → Fully compliant structure using established regulatory pathways. 3) "What\'s the catch?" → NIHA takes a spread; client still saves 8-12%. 4) "What about counterparty risk?" → Escrow structures and staged settlement. 5) "Why can\'t I do this myself?" → Five structural barriers including Chinese market access.',
  'visual-guide': 'Five-step visual flow suitable for email or print: 1) Client identifies EUA compliance need → 2) NIHA sources CEA bilaterally from Chinese market → 3) CEA→EUA swap executed at favorable ratio → 4) EUA delivered to client registry at 8-12% discount → 5) Full compliance documentation provided. Include the four value propositions: cost savings, exclusive access, zero market impact, instant settlement.',
  regulatory: 'Regulatory framework covering: EU ETS Directive 2003/87/EC, China\'s National ETS Management Measures (MEE Decree No. 19), Shenzhen Pilot Market Regulations, Hong Kong\'s GBA financial cooperation framework, and EU CBAM Regulation 2023/956. Explains why Hong Kong is the only viable jurisdiction for cross-border carbon trading bridging EU and Chinese markets.',
  timing: 'Market timing analysis for 2026: Four key catalysts — EU CBAM full effect increasing EUA demand, EUA free allocation dropping 8% under "Fit for 55", China ETS expansion to 3,500+ entities creating more CEA sellers, and the arbitrage window narrowing from 7-10× to ~5× by 2030. Price convergence forecast table from 2024-2030.',
};

export function ResourcesSection() {
  const ref = useSection(SECTION_IDS.RESOURCES);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const activeCardData = BATTLE_CARDS.find((c) => c.id === activeCard);

  return (
    <section ref={ref} id={SECTION_IDS.RESOURCES}>
      <h3 className="section-heading text-white mb-6">Resources & Battle Cards</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BATTLE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-navy-800/40 border border-navy-700 rounded-xl p-6 hover:border-navy-600 transition-colors flex flex-col"
            >
              {/* Top: icon + badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[card.typeColor])}>
                  <Icon className={cn('w-5 h-5', iconTextMap[card.typeColor])} />
                </div>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', badgeColorMap[card.typeColor])}>
                  {card.type}
                </span>
              </div>

              {/* Content */}
              <h4 className="text-base font-medium text-navy-50 mb-1">{card.title}</h4>
              <p className="text-xs text-navy-500 italic mb-2">{card.audience}</p>
              <p className="text-sm text-navy-400 flex-1">{card.description}</p>

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveCard(card.id)}
                  className="flex-1 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  title="Coming soon"
                  className="px-3 py-1.5 bg-navy-800 text-navy-500 text-xs rounded-lg cursor-not-allowed flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Panel */}
      <DocumentPanel
        isOpen={!!activeCard}
        onClose={() => setActiveCard(null)}
        title={activeCardData?.title ?? ''}
        typeBadge={activeCardData?.type}
        badgeColor={activeCardData ? badgeColorMap[activeCardData.typeColor] : ''}
      >
        <div className="space-y-4">
          {activeCard && BATTLE_CARD_CONTENT[activeCard]?.split('. ').map((sentence, i) => (
            <p key={i}>{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</p>
          ))}
        </div>
      </DocumentPanel>
    </section>
  );
}
