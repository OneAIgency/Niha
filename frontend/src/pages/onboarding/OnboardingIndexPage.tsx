import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Building2,
  Factory,
  Globe,
  FileText,
  ChevronRight,
  ArrowRight,
  Zap,
  Shield,
  DollarSign,
  Clock,
  Target,
} from 'lucide-react';
import { OnboardingLayout, colors } from '@/components/onboarding';

// Navigation cards for the 5 sections
const sectionCards = [
  {
    id: 1,
    path: '/onboarding/market-overview',
    title: 'Market Overview',
    subtitle: 'EU ETS vs China ETS Comparison',
    icon: TrendingUp,
    gradient: ['#3b82f6', '#1e40af'],
    stats: [
      { label: 'EU ETS Coverage', value: '1.6B tonnes' },
      { label: 'China ETS Coverage', value: '4.5B tonnes' },
    ],
    description: 'Comprehensive analysis of the world\'s two largest carbon markets including historical development, market structure, price dynamics, legal framework, and strategic opportunities.',
    highlights: [
      'EU ETS Phase 4 (2021-2030) analysis',
      'China ETS expansion roadmap',
      '11-dimension regulatory comparison',
      'Price discovery mechanisms',
      'Strategic risk assessment',
    ],
  },
  {
    id: 2,
    path: '/onboarding/about-nihao',
    title: 'About Nihao Group',
    subtitle: 'Your Bridge Between Markets',
    icon: Building2,
    gradient: ['#0d9488', '#1e40af'],
    stats: [
      { label: 'Headquarters', value: 'Hong Kong' },
      { label: 'Market Access', value: 'EU + China' },
    ],
    description: 'Strategic intermediary positioned at the intersection of European and Chinese carbon markets, leveraging Hong Kong\'s unique role as a gateway between Western financial markets and mainland China.',
    highlights: [
      'Hong Kong regulatory framework',
      '5 comprehensive service offerings',
      'Technology platform capabilities',
      'Business model economics',
      'Risk management & governance',
    ],
  },
  {
    id: 3,
    path: '/onboarding/cea-holders',
    title: 'For CEA Holders',
    subtitle: 'Non-EU Entities with Chinese Allowances',
    icon: Factory,
    gradient: ['#dc2626', '#f97316'],
    stats: [
      { label: 'Value Improvement', value: '8-25%' },
      { label: 'Entity Categories', value: '5 Types' },
    ],
    description: 'Complete taxonomy of non-EU entities holding Chinese Emission Allowances and systematic analysis of the significant advantages gained through private bilateral deals via Nihao vs. SEEE exchange trading.',
    highlights: [
      '5 CEA holder categories detailed',
      'Price premium analysis (8-15%)',
      'Confidentiality advantages',
      'Regulatory benefits',
      'Tax & currency optimization',
    ],
  },
  {
    id: 4,
    path: '/onboarding/eua-holders',
    title: 'For EUA Holders',
    subtitle: 'Non-EU Entities with European Allowances',
    icon: Globe,
    gradient: ['#3b82f6', '#8b5cf6'],
    stats: [
      { label: 'Swap Advantage', value: '10-22%' },
      { label: 'Entity Categories', value: '5 Types' },
    ],
    description: 'Identification of all major categories of non-EU EUA holders and systematic analysis of substantial advantages realized by exchanging EUA for CEA through Nihao\'s platform.',
    highlights: [
      '5 EUA holder categories',
      'Price arbitrage capture (8-18%)',
      'Timing optimization (1-8%)',
      'Operational advantages',
      'Strategic positioning benefits',
    ],
  },
  {
    id: 5,
    path: '/onboarding/eu-entities',
    title: 'For EU Entities',
    subtitle: 'Complete Platform Workflow',
    icon: FileText,
    gradient: ['#16a34a', '#0d9488'],
    stats: [
      { label: 'Total Benefit', value: '15-25%' },
      { label: 'Workflow Steps', value: '7 Steps' },
    ],
    description: 'Comprehensive analysis of economic, operational, and strategic advantages for EU entities using Nihao\'s platform to acquire EUA through structured private marketplace workflow.',
    highlights: [
      'Complete 7-step workflow',
      '23 KYC document requirements',
      'Economic advantages breakdown',
      'Timeline & milestones',
      'Value summary analysis',
    ],
  },
  {
    id: 6,
    path: '/onboarding/strategic-advantage',
    title: 'Strategic Advantages',
    subtitle: 'Why Choose Nihao Marketplace',
    icon: Target,
    gradient: ['#8b5cf6', '#6366f1'],
    stats: [
      { label: 'Cost Savings', value: '30-75%' },
      { label: 'Time Savings', value: '60%' },
    ],
    description: 'Comprehensive analysis of market inefficiencies, stakeholder benefits, Hong Kong\'s strategic position, technology infrastructure, and competitive positioning that make Nihao the optimal carbon trading solution.',
    highlights: [
      'Market inefficiency analysis',
      '4 stakeholder advantage categories',
      'Hong Kong strategic positioning',
      'Technology platform capabilities',
      'Competitive edge breakdown',
    ],
  },
];

// Key statistics
const keyStats = [
  { icon: '🇪🇺', value: '1.6B tonnes', label: 'EU ETS Coverage', color: colors.secondaryLight },
  { icon: '🇨🇳', value: '4.5B tonnes', label: 'China ETS Coverage', color: colors.danger },
  { icon: '🌍', value: '6.1B tonnes', label: 'Combined Market Coverage', color: colors.primaryLight },
  { icon: '💹', value: '15-25%', label: 'Value Improvement (EU Entities)', color: colors.success },
];

// Value propositions
const valueProps = [
  {
    icon: DollarSign,
    title: 'Price Optimization',
    description: '8-18% better pricing through bilateral negotiation and timing optimization',
    color: colors.success,
  },
  {
    icon: Shield,
    title: 'Regulatory Compliance',
    description: 'Full compliance with Hong Kong SFC, EU, and China regulatory frameworks',
    color: colors.primaryLight,
  },
  {
    icon: Clock,
    title: 'Timing Flexibility',
    description: 'Avoid Q4 compliance selling pressure and lock in favorable prices',
    color: colors.accent,
  },
  {
    icon: Zap,
    title: 'Operational Efficiency',
    description: 'Streamlined KYC, custody, and settlement through single platform',
    color: colors.secondaryLight,
  },
];

export default function OnboardingIndexPage() {
  return (
    <OnboardingLayout showBreadcrumb={false}>
      {/* Hero Section */}
      <section className="text-center py-16 relative">
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.2) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-5xl font-extrabold mb-4 relative">
            Welcome to
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Nihao Group
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8" style={{ color: colors.textSecondary }}>
            Your gateway to the world's two largest carbon markets. We bridge the EU ETS and China ETS through innovative bilateral trading solutions, delivering 15-25% value improvement to our clients.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/onboarding/market-overview"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/onboarding/eu-entities"
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              View Workflow
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {keyStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-6 rounded-2xl text-center transition-all"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            whileHover={{ y: -4, borderColor: colors.primary }}
          >
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              {stat.icon}
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Section Cards */}
      <section className="mb-16">
        <h3 className="text-2xl font-bold mb-8 text-center">
          Explore Our Platform
        </h3>
        <div className="grid gap-6">
          {sectionCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={card.path}
                  className="block rounded-2xl p-6 transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Icon and Title */}
                    <div className="flex items-start gap-4 lg:w-1/3">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${card.gradient[0]} 0%, ${card.gradient[1]} 100%)` }}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ backgroundColor: `${card.gradient[0]}30`, color: card.gradient[0] }}
                          >
                            Section {card.id}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                          {card.title}
                        </h4>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {card.subtitle}
                        </p>
                        <div className="flex gap-4 mt-3">
                          {card.stats.map((stat, j) => (
                            <div key={j}>
                              <div className="text-lg font-bold" style={{ color: card.gradient[0] }}>
                                {stat.value}
                              </div>
                              <div className="text-xs" style={{ color: colors.textMuted }}>
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Description */}
                    <div className="lg:w-1/3">
                      <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                        {card.description}
                      </p>
                    </div>

                    {/* Right: Highlights */}
                    <div className="lg:w-1/3">
                      <div className="space-y-2">
                        {card.highlights.map((highlight, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            <ChevronRight className="w-4 h-4" style={{ color: card.gradient[0] }} />
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                        style={{ backgroundColor: `${card.gradient[0]}20` }}
                      >
                        <ArrowRight className="w-6 h-6" style={{ color: card.gradient[0] }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="mb-16">
        <h3 className="text-2xl font-bold mb-8 text-center">
          Why Choose Nihao?
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((prop, i) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
              >
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${prop.color}20` }}
                >
                  <Icon className="w-7 h-7" style={{ color: prop.color }} />
                </div>
                <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {prop.title}
                </h4>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {prop.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Key Opportunity Box */}
      <section
        className="p-8 rounded-2xl text-center mb-16"
        style={{
          background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)`,
          border: `1px solid ${colors.accent}`,
        }}
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.accent }}>
          Key Market Opportunity
        </h3>
        <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
          The <strong style={{ color: colors.textPrimary }}>significant price differential</strong> between EU and China carbon markets creates unique bilateral trading opportunities.
          <br />
          <strong style={{ color: colors.primaryLight }}>Nihao provides the bridge</strong> connecting these two major carbon markets.
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="text-3xl font-extrabold" style={{ color: colors.secondaryLight }}>1.6B</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>EU ETS Coverage (tonnes)</div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="text-3xl font-extrabold" style={{ color: colors.danger }}>4.5B</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>China ETS Coverage (tonnes)</div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="text-3xl font-extrabold" style={{ color: colors.success }}>15-25%</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>Value Improvement</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-8">
        <div
          className="rounded-3xl p-12"
          style={{
            background: `linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)`,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
            Complete your KYC documentation to access the Nihao marketplace and start benefiting from bilateral carbon trading opportunities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/onboarding/market-overview"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              Start with Market Overview
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </OnboardingLayout>
  );
}
