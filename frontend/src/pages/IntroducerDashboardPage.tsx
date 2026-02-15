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
  ResourcesSection,
} from '../components/introducer';
import { useSection } from '../components/introducer/SectionRegistry';
import { SECTION_IDS } from '../components/introducer/constants';
import { ComparisonTable } from '../components/introducer/ComparisonTable';

/** Markets: comparison table + tabbed deep-dive */
function MarketsSection() {
  const ref = useSection(SECTION_IDS.MARKETS);
  return (
    <section ref={ref} id={SECTION_IDS.MARKETS}>
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
  const ref = useSection(SECTION_IDS.ADVANTAGES);
  return (
    <section ref={ref} id={SECTION_IDS.ADVANTAGES}>
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

export function IntroducerDashboardPage() {
  return (
    <IntroducerLayout>
      <HeroMetrics />
      <HowItWorksFlow />
      <MarketsSection />
      <AdvantagesSection />
      <LegalSection />
      <ROICalculator />
      <ResourcesSection />
      <FAQSection />
    </IntroducerLayout>
  );
}
