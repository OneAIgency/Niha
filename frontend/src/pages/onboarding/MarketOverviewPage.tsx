import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Globe,
  Scale,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { OnboardingLayout, colors, LivePriceComparison, OnboardingLink } from '@/components/onboarding';

// Color mapping helper for EU ETS phases
const phaseColorMap: Record<string, { bg: string; border: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-500' },
  violet: { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-500' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
  fuchsia: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-500' },
};

// EU ETS Phase Data
const euEtsPhases = [
  {
    phase: 'Phase 1',
    period: '2005-2007',
    title: 'Pilot Phase',
    description: 'Initial learning period with over-allocation',
    details: [
      'First large-scale ETS in the world',
      'Covered ~11,000 installations',
      'Free allocation based on historical emissions',
      'Price collapsed to near zero in 2007 due to over-allocation',
      'No banking between Phase 1 and 2',
    ],
    colorKey: 'indigo',
  },
  {
    phase: 'Phase 2',
    period: '2008-2012',
    title: 'Kyoto Commitment Period',
    description: 'Aligned with Kyoto Protocol first commitment period',
    details: [
      'Stricter cap than Phase 1',
      'Introduction of aviation sector (2012)',
      'Prices peaked at €30/t in 2008',
      'Financial crisis caused demand collapse',
      'Prices fell to €6-7/t by 2012',
      'Emergence of surplus allowances',
    ],
    colorKey: 'violet',
  },
  {
    phase: 'Phase 3',
    period: '2013-2020',
    title: 'Structural Reform',
    description: 'Major overhaul with auctioning and centralized cap',
    details: [
      'Single EU-wide cap instead of national caps',
      'Auctioning became default allocation method',
      'Free allocation based on benchmarks',
      'Market Stability Reserve (MSR) introduced in 2019',
      'Linear reduction factor of 1.74%/year',
      'Prices recovered from €3 (2013) to €25 (2019)',
    ],
    colorKey: 'purple',
  },
  {
    phase: 'Phase 4',
    period: '2021-2030',
    title: 'Climate Ambition',
    description: 'Aligned with EU Green Deal and 55% reduction target',
    details: [
      'Linear reduction factor increased to 2.2%/year',
      'Maritime shipping included from 2024',
      'Carbon Border Adjustment Mechanism (CBAM) implementation',
      'Phase-out of free allocation for CBAM sectors',
      'MSR intake rate doubled to 24%',
      'Prices reached all-time high of €100+ in 2023',
      'Target: 62% reduction vs 2005 by 2030',
    ],
    colorKey: 'fuchsia',
  },
];

// China ETS Evolution Data
const chinaEtsEvolution = [
  {
    year: '2011-2013',
    title: 'Regional Pilot Programs',
    details: [
      'Seven pilot ETS programs launched (Beijing, Shanghai, Guangdong, Shenzhen, Tianjin, Hubei, Chongqing)',
      'Different sector coverage and design features',
      'Total coverage: ~1 billion tonnes CO2',
      'Experimentation with allocation methods',
      'Price range: CNY 20-130/t across pilots',
    ],
  },
  {
    year: '2017',
    title: 'National ETS Announced',
    details: [
      'Initial focus on power sector only',
      'Coverage: 2,225 power generation companies',
      'Approximately 4.5 billion tonnes CO2',
      'Largest carbon market by coverage in the world',
      'Intensity-based rather than absolute cap',
    ],
  },
  {
    year: '2021',
    title: 'National Trading Begins',
    details: [
      'First compliance cycle (2019-2020 emissions)',
      'Trading launched July 16, 2021',
      'Opening price: CNY 48/t',
      'First year trading volume: 179 million tonnes',
      'Compliance rate: 99.5%',
    ],
  },
  {
    year: '2024-2025',
    title: 'Sector Expansion',
    details: [
      'Steel, cement, aluminum sectors added',
      'Combined additional coverage: ~2.5 billion tonnes',
      'Total covered emissions: ~7 billion tonnes',
      'New benchmark allocation methods',
      'Enhanced MRV requirements',
    ],
  },
];

// Market Structure Comparison Data
const marketStructureComparison = [
  {
    category: 'Covered Entities',
    eu: '~10,000-11,000 installations',
    china: '2,162+ companies (power); expanding to 5,000+ with new sectors',
  },
  {
    category: 'Emissions Coverage',
    eu: '~1.6 billion tonnes CO2 (~40% of EU emissions)',
    china: '~4.5 billion tonnes CO2 (power); ~7 billion with expansion (~40% of China emissions)',
  },
  {
    category: 'Sectors Covered',
    eu: 'Power, industry (steel, cement, chemicals, glass, paper), aviation, maritime (2024)',
    china: 'Power generation only (initially); steel, cement, aluminum (2024+)',
  },
  {
    category: 'Market Participants',
    eu: 'Compliance entities, financial institutions, traders, speculators',
    china: 'Compliance entities only; no financial traders allowed',
  },
  {
    category: 'Allocation Method',
    eu: 'Auctioning (default) + free allocation based on benchmarks',
    china: 'Free allocation based on output-based intensity benchmarks',
  },
  {
    category: 'Cap Type',
    eu: 'Absolute cap with linear reduction factor (2.2%/year)',
    china: 'Intensity-based cap (no absolute cap yet)',
  },
  {
    category: 'Trading Venues',
    eu: 'Multiple exchanges (EEX, ICE, Nasdaq)',
    china: 'Single exchange (Shanghai Environment and Energy Exchange - SEEE)',
  },
  {
    category: 'Derivatives',
    eu: 'Futures, options, forwards actively traded',
    china: 'Spot trading only (no derivatives yet)',
  },
];

// Legal Framework 11-Dimension Comparison
const legalFramework = [
  {
    dimension: 'Primary Legislation',
    eu: 'EU ETS Directive 2003/87/EC (amended)',
    china: 'National Carbon Trading Management Measures (2021)',
    analysis: 'EU has stronger legal foundation; China uses administrative measures',
  },
  {
    dimension: 'Regulatory Authority',
    eu: 'European Commission + Member State authorities',
    china: 'Ministry of Ecology and Environment (MEE)',
    analysis: 'EU has multi-level governance; China is centralized',
  },
  {
    dimension: 'Cap Setting',
    eu: 'EU-wide cap set by legislation, annual linear reduction',
    china: 'Intensity benchmarks by sector, no absolute cap',
    analysis: 'EU provides more market certainty; China cap is implicit',
  },
  {
    dimension: 'Allocation Rules',
    eu: 'Benchmarks for free allocation; power sector 100% auctioned',
    china: 'Output-based intensity benchmarks; 100% free initially',
    analysis: 'EU more mature; China transitioning to benchmarks',
  },
  {
    dimension: 'MRV Requirements',
    eu: 'Third-party verification mandatory; EU-accredited verifiers',
    china: 'Third-party verification; MEE-registered verifiers',
    analysis: 'Similar requirements; EU has longer track record',
  },
  {
    dimension: 'Compliance Penalties',
    eu: 'EUR 100/t + make-up obligation; name-and-shame',
    china: 'Up to CNY 500% of shortage value; administrative penalties',
    analysis: 'Both have significant penalties; different structures',
  },
  {
    dimension: 'Market Oversight',
    eu: 'ESMA + national financial regulators; MiFID II applies',
    china: 'MEE oversight; not classified as financial instrument',
    analysis: 'EU has stricter financial market regulation',
  },
  {
    dimension: 'Trading Rules',
    eu: 'Continuous trading; position limits; reporting requirements',
    china: 'Spot trading only; daily price limits (±10%)',
    analysis: 'EU more flexible; China has price stabilization',
  },
  {
    dimension: 'Banking & Borrowing',
    eu: 'Full banking allowed; no borrowing',
    china: 'Banking allowed within compliance period; no borrowing',
    analysis: 'Similar approach; EU more flexible on banking',
  },
  {
    dimension: 'Offsets',
    eu: 'International credits restricted; limited use',
    china: 'CCER (China Certified Emission Reductions) up to 5%',
    analysis: 'Both limit offsets to maintain market integrity',
  },
  {
    dimension: 'Foreign Participation',
    eu: 'Open to foreign entities with EU operations',
    china: 'Domestic entities only; foreign participation prohibited',
    analysis: 'Key difference creating arbitrage opportunity',
  },
];

// Price Dynamics Data
const priceHistory = {
  eu: [
    { year: '2005', price: '€20-25', event: 'Launch' },
    { year: '2007', price: '€0.03', event: 'Over-allocation crash' },
    { year: '2008', price: '€25-30', event: 'Peak before crisis' },
    { year: '2013', price: '€3-5', event: 'Surplus crisis' },
    { year: '2018', price: '€15-25', event: 'MSR impact' },
    { year: '2021', price: '€50-60', event: 'Green Deal rally' },
    { year: '2022', price: '€80-100', event: 'Energy crisis' },
    { year: '2023', price: '€80-100', event: 'Stabilization' },
    { year: '2024', price: '€65-90', event: 'Consolidation' },
    { year: '2025', price: '€80-95', event: 'Current' },
  ],
  china: [
    { year: '2021 Jul', price: '¥48', event: 'Launch price' },
    { year: '2021 Dec', price: '¥54', event: 'First compliance' },
    { year: '2022', price: '¥55-60', event: 'Second year' },
    { year: '2023', price: '¥60-75', event: 'Gradual increase' },
    { year: '2024', price: '¥70-90', event: 'Sector expansion' },
    { year: '2025', price: '¥63-80', event: 'Current' },
  ],
};

// Strategic Risk Factors (8 factors)
const strategicRisks = [
  {
    factor: 'Regulatory Divergence',
    impact: 'High',
    probability: 'Medium',
    description: 'EU and China ETS may develop incompatible rules, limiting future linkage potential',
    mitigation: 'Early engagement through bilateral platforms like Nihao',
  },
  {
    factor: 'Price Volatility',
    impact: 'High',
    probability: 'High',
    description: 'Both markets experience significant price swings due to policy changes',
    mitigation: 'Timing optimization and bilateral deal structuring',
  },
  {
    factor: 'Foreign Access Restrictions',
    impact: 'Very High',
    probability: 'Current',
    description: 'China ETS explicitly prohibits foreign participation',
    mitigation: 'Nihao provides compliant bridge through bilateral deals',
  },
  {
    factor: 'Compliance Timing',
    impact: 'Medium',
    probability: 'High',
    description: 'Q4 compliance periods create predictable price pressure',
    mitigation: 'Private bilateral deals avoid seasonal pressure',
  },
  {
    factor: 'Currency Exposure',
    impact: 'Medium',
    probability: 'Medium',
    description: 'EUR/CNY/USD fluctuations affect cross-border transactions',
    mitigation: 'Multi-currency settlement through Hong Kong platform',
  },
  {
    factor: 'Political Risk',
    impact: 'High',
    probability: 'Low-Medium',
    description: 'Trade tensions may affect carbon market cooperation',
    mitigation: 'Hong Kong neutral jurisdiction provides buffer',
  },
  {
    factor: 'Market Maturity Gap',
    impact: 'Medium',
    probability: 'High',
    description: 'EU market more mature with derivatives; China spot-only',
    mitigation: 'Opportunity for bilateral hedging arrangements',
  },
  {
    factor: 'Information Asymmetry',
    impact: 'Medium',
    probability: 'High',
    description: 'Limited transparency in China ETS compared to EU',
    mitigation: 'Nihao provides market intelligence and participant identification',
  },
];

// Price Discovery Mechanisms
const priceDiscoveryMechanisms = [
  {
    mechanism: 'Exchange Trading',
    eu: 'Continuous auction and order matching on EEX, ICE; high liquidity; transparent order books',
    china: 'Single daily session on SEEE; lower liquidity; price limits (±10%)',
  },
  {
    mechanism: 'Auction Markets',
    eu: 'Regular primary auctions by Member States; benchmark pricing',
    china: 'No regular auctions; government allocation only',
  },
  {
    mechanism: 'OTC Markets',
    eu: 'Active bilateral trading; broker-dealer networks; reported to regulators',
    china: 'Limited OTC activity; primarily exchange-based',
  },
  {
    mechanism: 'Derivatives',
    eu: 'Futures (Dec and Mar contracts most liquid); options; swaps',
    china: 'No derivatives market; spot only',
  },
  {
    mechanism: 'Index Products',
    eu: 'EUA spot indexes; futures indexes; ESG benchmarks',
    china: 'Limited index development; SEEE reference prices',
  },
];

// Challenges and Outlook
const challengesOutlook = {
  eu: {
    challenges: [
      'CBAM implementation complexity',
      'Industrial competitiveness concerns',
      'Windfall profit debates',
      'Aviation inclusion disputes',
      'ETS 2 (transport/buildings) design',
    ],
    outlook: [
      'Price projection: EUR 130-150/t by 2030',
      'Cap reduction accelerating post-2030',
      'Potential international linkage expansion',
      'Enhanced oversight under MiFID III',
      'Green hydrogen inclusion potential',
    ],
  },
  china: {
    challenges: [
      'Transition from intensity to absolute cap',
      'Data quality and verification accuracy',
      'Limited market liquidity',
      'No financial participant access',
      'Price level concerns (too low)',
    ],
    outlook: [
      'Price projection: CNY 200/t by 2030',
      'Additional sectors (petrochemicals, aviation)',
      'Derivatives market development',
      'Regional pilot integration',
      'International cooperation potential',
    ],
  },
};

export default function MarketOverviewPage() {
  const [activeEuPhase, setActiveEuPhase] = useState(3); // Phase 4

  return (
    <OnboardingLayout
      title="Market Overview"
      subtitle="Comprehensive analysis of the world's two largest carbon markets"
    >
      {/* Introduction */}
      <section className="mb-16">
        <div
          className="rounded-2xl p-8"
          style={{
            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 64, 175, 0.15) 100%)`,
            border: `1px solid ${colors.secondaryLight}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8" style={{ color: colors.secondaryLight }} />
            <h3 className="text-xl font-bold">The Global Carbon Market Landscape</h3>
          </div>
          <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
            The European Union Emissions Trading System (EU ETS) and China&apos;s national carbon market together cover over <strong style={{ color: colors.textPrimary }}>6.1 billion tonnes of CO2</strong> emissions annually, representing the world&apos;s two largest carbon markets. Despite their scale, fundamental differences in market design, pricing, and accessibility create significant arbitrage opportunities for sophisticated participants.
          </p>
          <LivePriceComparison />
        </div>
      </section>

      {/* Part 1: Historical Development */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
          >
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Historical Development</h3>
            <p style={{ color: colors.textSecondary }}>Evolution of the world&apos;s two largest carbon markets</p>
          </div>
        </div>

        {/* EU ETS Phases */}
        <div className="mb-12">
          <h4 className="text-xl font-semibold mb-6" style={{ color: colors.secondaryLight }}>
            EU ETS: Four Phases of Evolution (2005-2030)
          </h4>

          {/* Phase Timeline */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {euEtsPhases.map((phase, i) => {
              const colorClasses = phaseColorMap[phase.colorKey];
              return (
                <button
                  key={i}
                  onClick={() => setActiveEuPhase(i)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all border-2 ${
                    activeEuPhase === i
                      ? `${colorClasses.bg} ${colorClasses.border} text-white`
                      : 'bg-navy-800 border-navy-600 text-navy-400'
                  }`}
                >
                  <div className="font-bold">{phase.phase}</div>
                  <div className="text-xs">{phase.period}</div>
                </button>
              );
            })}
          </div>

          {/* Active Phase Detail */}
          <AnimatePresence mode="wait">
            {(() => {
              const activePhase = euEtsPhases[activeEuPhase];
              const activeColorClasses = phaseColorMap[activePhase.colorKey];
              return (
                <motion.div
                  key={activeEuPhase}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-2xl p-6 bg-navy-800 border-2 ${activeColorClasses.border}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl text-white ${activeColorClasses.bg}`}
                    >
                      {activePhase.phase.split(' ')[1]}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-white">
                        {activePhase.title}
                      </h5>
                      <p className="text-navy-300">
                        {activePhase.period} - {activePhase.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activePhase.details.map((detail, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-navy-700">
                        <ChevronRight className={`w-5 h-5 mt-0.5 flex-shrink-0 ${activeColorClasses.text}`} />
                        <span className="text-navy-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* China ETS Evolution */}
        <div>
          <h4 className="text-xl font-semibold mb-6" style={{ color: colors.danger }}>
            China ETS: From Pilots to National Market (2011-2025)
          </h4>
          <div className="relative">
            {/* Timeline Line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: colors.danger }}
            />

            <div className="space-y-6">
              {chinaEtsEvolution.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-16"
                >
                  {/* Timeline Dot */}
                  <div
                    className="absolute left-4 w-5 h-5 rounded-full border-4"
                    style={{ backgroundColor: colors.bgDark, borderColor: colors.danger }}
                  />

                  <div
                    className="rounded-xl p-5"
                    style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ backgroundColor: `${colors.danger}20`, color: colors.danger }}
                      >
                        {item.year}
                      </span>
                      <h5 className="font-bold" style={{ color: colors.textPrimary }}>{item.title}</h5>
                    </div>
                    <ul className="space-y-2">
                      {item.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Part 2: Market Structure Comparison */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)` }}
          >
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Market Structure Comparison</h3>
            <p style={{ color: colors.textSecondary }}>Fundamental differences between EU ETS and China ETS</p>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: colors.bgCardHover }}>
                <th className="p-4 text-left font-semibold" style={{ color: colors.textPrimary }}>Category</th>
                <th className="p-4 text-left font-semibold" style={{ color: colors.secondaryLight }}>
                  <div className="flex items-center gap-2">
                    <span>🇪🇺</span> EU ETS
                  </div>
                </th>
                <th className="p-4 text-left font-semibold" style={{ color: colors.danger }}>
                  <div className="flex items-center gap-2">
                    <span>🇨🇳</span> China ETS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {marketStructureComparison.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-white/5">
                  <td className="p-4 font-medium" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary }}>
                    {row.category}
                  </td>
                  <td className="p-4" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                    {row.eu}
                  </td>
                  <td className="p-4" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                    {row.china}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Difference Alert */}
        <div
          className="mt-6 p-4 rounded-xl flex items-start gap-4"
          style={{ backgroundColor: `${colors.accent}15`, border: `1px solid ${colors.accent}` }}
        >
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: colors.accent }} />
          <div>
            <h5 className="font-bold mb-1" style={{ color: colors.accent }}>Critical Difference: Foreign Participation</h5>
            <p style={{ color: colors.textSecondary }}>
              The EU ETS allows foreign entities with EU operations to participate, while China ETS explicitly prohibits foreign participation.
              This fundamental restriction creates the opportunity that Nihao addresses through bilateral deal facilitation.
            </p>
          </div>
        </div>
      </section>

      {/* Part 3: Price Dynamics */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Price Dynamics</h3>
            <p style={{ color: colors.textSecondary }}>Historical price trends and key market events</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* EU ETS Price History */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
          >
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🇪🇺</span> EU ETS Price History
            </h4>
            <div className="space-y-3">
              {priceHistory.eu.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.bgCardHover }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm px-2 py-1 rounded" style={{ backgroundColor: colors.secondaryLight + '30', color: colors.secondaryLight }}>
                      {item.year}
                    </span>
                    <span style={{ color: colors.textSecondary }}>{item.event}</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.secondaryLight }}>{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* China ETS Price History */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
          >
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🇨🇳</span> China ETS Price History
            </h4>
            <div className="space-y-3">
              {priceHistory.china.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.bgCardHover }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm px-2 py-1 rounded" style={{ backgroundColor: colors.danger + '30', color: colors.danger }}>
                      {item.year}
                    </span>
                    <span style={{ color: colors.textSecondary }}>{item.event}</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.danger }}>{item.price}</span>
                </div>
              ))}
            </div>

            {/* Price Projection */}
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${colors.success}15`, border: `1px solid ${colors.success}` }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: colors.success }} />
                <span className="font-semibold" style={{ color: colors.success }}>2030 Projection</span>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                EU ETS: <strong style={{ color: colors.textPrimary }}>EUR 130-150/t</strong> (+48-70%) |
                China ETS: <strong style={{ color: colors.textPrimary }}>CNY 200/t</strong> (+212%)
              </p>
            </div>
          </div>
        </div>

        {/* Price Drivers */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-xl" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
            <h5 className="font-semibold mb-4" style={{ color: colors.secondaryLight }}>EU ETS Price Drivers</h5>
            <ul className="space-y-2">
              {[
                'Market Stability Reserve (MSR) intake reducing supply',
                'Linear reduction factor increasing cap stringency',
                'Energy prices and fuel switching economics',
                'Regulatory announcements (Fit for 55)',
                'Speculative activity and financial flows',
                'Economic activity and industrial output',
              ].map((driver, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.secondaryLight }} />
                  {driver}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 rounded-xl" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
            <h5 className="font-semibold mb-4" style={{ color: colors.danger }}>China ETS Price Drivers</h5>
            <ul className="space-y-2">
              {[
                'Compliance period timing (Q3-Q4 pressure)',
                'Benchmark stringency changes',
                'Sector expansion announcements',
                'Government policy signals on cap tightening',
                'Economic growth and power demand',
                'Limited market liquidity concentrates impact',
              ].map((driver, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                  {driver}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Part 4: Legal Framework (11-Dimension Comparison) */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500"
          >
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Legal & Regulatory Framework</h3>
            <p style={{ color: colors.textSecondary }}>11-dimension comparison of governance structures</p>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: colors.bgCardHover }}>
                  <th className="p-4 text-left font-semibold" style={{ color: colors.textPrimary }}>Dimension</th>
                  <th className="p-4 text-left font-semibold" style={{ color: colors.secondaryLight }}>🇪🇺 EU ETS</th>
                  <th className="p-4 text-left font-semibold" style={{ color: colors.danger }}>🇨🇳 China ETS</th>
                  <th className="p-4 text-left font-semibold" style={{ color: colors.primaryLight }}>Analysis</th>
                </tr>
              </thead>
              <tbody>
                {legalFramework.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/5">
                    <td className="p-4 font-medium" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary }}>
                      {row.dimension}
                    </td>
                    <td className="p-4 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.eu}
                    </td>
                    <td className="p-4 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.china}
                    </td>
                    <td className="p-4 text-sm italic" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted }}>
                      {row.analysis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Part 5: Price Discovery Mechanisms */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Price Discovery Mechanisms</h3>
            <p style={{ color: colors.textSecondary }}>How prices are formed in each market</p>
          </div>
        </div>

        <div className="space-y-4">
          {priceDiscoveryMechanisms.map((mechanism, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <h5 className="font-semibold mb-4" style={{ color: colors.primaryLight }}>{mechanism.mechanism}</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.secondaryLight}10`, border: `1px solid ${colors.secondaryLight}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>🇪🇺</span>
                    <span className="font-medium" style={{ color: colors.secondaryLight }}>EU ETS</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{mechanism.eu}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>🇨🇳</span>
                    <span className="font-medium" style={{ color: colors.danger }}>China ETS</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{mechanism.china}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 6: Challenges and Outlook */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.danger} 0%, ${colors.accent} 100%)` }}
          >
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Challenges and Outlook</h3>
            <p style={{ color: colors.textSecondary }}>Current issues and future projections</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* EU Challenges & Outlook */}
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.secondaryLight}` }}>
              <h5 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
                <span>🇪🇺</span> EU ETS Challenges
              </h5>
              <ul className="space-y-2">
                {challengesOutlook.eu.challenges.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}` }}>
              <h5 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.success }}>
                <TrendingUp className="w-5 h-5" />
                EU ETS Outlook
              </h5>
              <ul className="space-y-2">
                {challengesOutlook.eu.outlook.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* China Challenges & Outlook */}
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.danger}` }}>
              <h5 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.danger }}>
                <span>🇨🇳</span> China ETS Challenges
              </h5>
              <ul className="space-y-2">
                {challengesOutlook.china.challenges.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}` }}>
              <h5 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.success }}>
                <TrendingUp className="w-5 h-5" />
                China ETS Outlook
              </h5>
              <ul className="space-y-2">
                {challengesOutlook.china.outlook.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Part 7: Strategic Risk Assessment (8 factors) */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600"
          >
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Strategic Risk Assessment</h3>
            <p style={{ color: colors.textSecondary }}>8-factor risk analysis for cross-market participants</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {strategicRisks.map((risk, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-semibold" style={{ color: colors.textPrimary }}>{risk.factor}</h5>
                <div className="flex gap-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: risk.impact === 'Very High' ? `${colors.danger}30` : risk.impact === 'High' ? `${colors.accent}30` : `${colors.primaryLight}30`,
                      color: risk.impact === 'Very High' ? colors.danger : risk.impact === 'High' ? colors.accent : colors.primaryLight,
                    }}
                  >
                    Impact: {risk.impact}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: risk.probability === 'Current' || risk.probability === 'High' ? `${colors.danger}30` : `${colors.accent}30`,
                      color: risk.probability === 'Current' || risk.probability === 'High' ? colors.danger : colors.accent,
                    }}
                  >
                    {risk.probability}
                  </span>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{risk.description}</p>
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{ backgroundColor: `${colors.success}10` }}>
                <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
                <span style={{ color: colors.success }}>Mitigation:</span>
                <span style={{ color: colors.textSecondary }}>{risk.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Opportunity Summary */}
      <section
        className="p-8 rounded-2xl text-center mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)`,
          border: `1px solid ${colors.primary}`,
        }}
      >
        <h3 className="text-2xl font-bold mb-4">Strategic Opportunity Summary</h3>
        <p className="text-lg mb-6 max-w-3xl mx-auto" style={{ color: colors.textSecondary }}>
          The fundamental differences between EU ETS and China ETS—particularly the foreign participation restriction—create a structural market opportunity.
          The significant price differential, combined with different compliance cycles and market maturities, enables sophisticated bilateral deal structuring.
        </p>
        <OnboardingLink
          to="/onboarding/about-nihao"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
        >
          Learn About Nihao Group
          <ArrowRight className="w-5 h-5" />
        </OnboardingLink>
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
        <OnboardingLink
          to="/onboarding"
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: colors.textSecondary }}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Overview
        </OnboardingLink>
        <OnboardingLink
          to="/onboarding/about-nihao"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
        >
          Next: About Nihao Group
          <ArrowRight className="w-5 h-5" />
        </OnboardingLink>
      </div>
    </OnboardingLayout>
  );
}
