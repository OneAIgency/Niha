import {
  IntroducerLayout,
  HeroMetrics,
  HowItWorksFlow,
  MarketSection,
  ValuePropositionCards,
  ClientPathsSection,
  TimingSection,
  LegalSection,
  ROICalculator,
  FAQSection,
} from '../components/introducer';
import { SECTION_IDS } from '../components/introducer/constants';
import { ComparisonTable } from '../components/introducer/ComparisonTable';
import { useIntroducerStore } from '../stores/useIntroducerStore';

/** Markets: comparison table + tabbed deep-dive */
function MarketsSection() {
  return (
    <section id={SECTION_IDS.MARKETS}>
      <h3 className="section-heading text-white mb-6">NIHA vs Direct EUA Purchase</h3>
      <div className="bg-navy-800/50 border border-navy-700 rounded-xl p-6 mb-8">
        <ComparisonTable />
      </div>
      <MarketSection />
    </section>
  );
}

/** Advantages: value props + client paths + timing */
function AdvantagesSection() {
  return (
    <section id={SECTION_IDS.ADVANTAGES}>
      <h3 className="section-heading text-white mb-6">Why NIHA</h3>
      <ValuePropositionCards />
      <div className="mt-8">
        <ClientPathsSection />
      </div>
      <div className="mt-8">
        <TimingSection />
      </div>
    </section>
  );
}

const TAB_COMPONENTS: Record<string, () => JSX.Element> = {
  overview: () => <HeroMetrics />,
  mechanism: () => <HowItWorksFlow />,
  markets: () => <MarketsSection />,
  advantages: () => <AdvantagesSection />,
  legal: () => <LegalSection />,
  calculator: () => <ROICalculator />,
  faq: () => <FAQSection />,
};

export function IntroducerDashboardPage() {
  const dashboardTab = useIntroducerStore((s) => s.dashboardTab);
  const TabContent = TAB_COMPONENTS[dashboardTab] ?? TAB_COMPONENTS.overview;

  return (
    <IntroducerLayout>
      <TabContent />
    </IntroducerLayout>
  );
}
