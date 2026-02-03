import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Shield,
  Scale,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  Database,
  Server,
  BarChart3,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { OnboardingLayout, colors, OnboardingLink } from '@/components/onboarding';

// Color mapping helper for service offerings
const serviceColorMap: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  violet: { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-500' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
};

// Part 1: Company Overview Data
const companyOverview = {
  entity: {
    name: 'Italy Nihao Group Limited / Nihao Group Holdings',
    jurisdiction: 'Hong Kong (International Financial Centre framework)',
    regulatory: 'Hong Kong Securities and Futures Commission (SFC) oversight',
    capital: 'Hong Kong-based operations with Italian parent company connections',
  },
  hkRationale: [
    {
      category: 'Regulatory Framework',
      points: [
        'International financial hub status',
        'Robust regulatory infrastructure aligned with global standards',
        'Securities and Futures Commission (SFC) oversight',
        'Monetary Authority of Hong Kong (HKMA) banking supervision',
        'Anti-Money Laundering (AML) and Know-Your-Customer (KYC) standards comparable to EU',
      ],
    },
    {
      category: 'Financial Infrastructure',
      points: [
        'Deep pools of capital',
        'International banking presence',
        'Settlement and custody systems (Euroclear, Clearstream standards)',
        'Multi-currency transaction capabilities',
        'Direct Yuan/RMB convertibility access',
      ],
    },
    {
      category: 'Market Connectivity',
      points: [
        'Direct access to Chinese markets (Greater Bay Area)',
        'Gateway to EU/international markets',
        'Time zone optimization (trading across all major markets)',
        'Limited regulatory arbitrage while maintaining compliance',
      ],
    },
    {
      category: 'Carbon Market Positioning',
      points: [
        'HKEX Core Climate voluntary carbon trading platform',
        'Growing green finance hub status',
        '200+ ESG funds authorized',
        'HK$1.1 trillion in sustainable finance assets under management',
        'Over 250 greentech companies in startup ecosystem',
        'Government support for transition finance hub development',
      ],
    },
  ],
  businessModel: {
    function: 'Carbon Certificate Intermediation',
    nonEuSellers: [
      'Holders of Chinese Emission Allowances (CEA)',
      'Holders of other international carbon credits',
      'Seeking private placement alternatives to exchange trading',
    ],
    euBuyers: [
      'Industrial companies needing European Union Allowances (EUA)',
      'Compliance entities under EU ETS',
      'Financial institutions managing carbon portfolios',
      'Seeking private transaction advantages over public exchanges',
    ],
    transactionStructure: [
      'Private bilateral deal facilitation',
      'Direct negotiation between counterparties',
      'Customized contract terms',
      'Streamlined transaction workflows',
      'Custody and settlement services',
      'KYC/AML compliance management',
    ],
  },
  competitiveGap: {
    exchangeProblems: [
      'Time Delays: Compliance-driven selling pressure creates seasonal liquidity (Q4 for both systems)',
      'Price Inefficiency: Exchange prices don\'t reflect bilateral negotiation values',
      'Regulatory Restrictions: Foreign participation in China ETS prohibited',
      'Partial Matching: Exchange buyers/sellers don\'t perfectly match needs',
      'Execution Uncertainty: Public order books create information asymmetry',
    ],
    nihaoSolution: [
      'Operates in OTC market',
      'Serves as trusted intermediary between restricted markets',
      'Provides customized transaction structures',
      'Manages international regulatory requirements',
      'Offers private price discovery mechanisms',
      'Facilitates cross-border transactions',
    ],
  },
};

// Part 2: Regulatory Framework Data
const regulatoryFramework = [
  {
    regulation: 'Securities and Futures Ordinance (Cap. 571)',
    description: 'Defines financial instruments and derivatives',
    details: [
      'Regulates broker and dealer activities',
      'MiFID II equivalent framework',
      'Carbon allowances typically covered under commodity derivatives regulation',
    ],
  },
  {
    regulation: 'Anti-Money Laundering and Counter-Terrorist Financing Ordinance (AMLO)',
    description: 'Enhanced due diligence requirements',
    details: [
      'Customer identification and verification',
      'Beneficial ownership disclosure',
      'Transaction reporting for suspicious activity',
      'Record-keeping requirements (6-year minimum)',
    ],
  },
  {
    regulation: 'Securities and Futures (Client Money) Rules',
    description: 'Client fund protection',
    details: [
      'Segregation of client funds',
      'Trust account requirements',
      'Reporting and audit requirements',
    ],
  },
  {
    regulation: 'Hong Kong Monetary Authority (HKMA) Requirements',
    description: 'Banking operations oversight',
    details: [
      'Capital adequacy requirements',
      'Liquidity management',
      'Banking supervision',
    ],
  },
  {
    regulation: 'SFC Handbook',
    description: 'Conduct of Business rules',
    details: [
      'Best execution requirements',
      'Suitability rules for client advising',
      'Conflict of interest disclosures',
    ],
  },
];

// KYC/AML Framework
const kycFramework = {
  edd: [
    'Entity verification (corporate registration, business licenses)',
    'Beneficial ownership identification (BO register)',
    'Source of funds verification',
    'Business activity verification',
    'Sanctions screening (OFAC, EU, UN lists)',
    'Political Exposed Persons (PEP) screening',
  ],
  documentation: [
    'Corporate organization documents (articles, bylaws)',
    'Beneficial ownership declarations',
    'Board resolutions (transaction authorization)',
    'Financial statements (2-3 years)',
    'Business license and regulatory approvals',
    'Sector-specific compliance certifications',
  ],
  monitoring: [
    'Quarterly transaction monitoring',
    'Annual compliance review',
    'Update requirements for material changes',
    'Suspicious transaction reporting (within 10 days)',
    'Record retention (minimum 6 years)',
  ],
  technology: [
    'KYC platform integration',
    'Transaction monitoring systems',
    'Sanctions screening database',
    'Document management system',
    'Audit trail and reporting',
  ],
};

// Part 3: Service Offerings
const serviceOfferings = [
  {
    id: 1,
    title: 'Market Intelligence and Data Services',
    icon: BarChart3,
    colorKey: 'blue',
    services: [
      'CEA/EUA price analysis and forecasting',
      'Market participant identification',
      'Bilateral deal opportunity sourcing',
      'Regulatory development monitoring',
      'Counterparty risk assessment',
    ],
  },
  {
    id: 2,
    title: 'Transaction Facilitation Services',
    icon: Briefcase,
    colorKey: 'violet',
    services: [
      'Deal negotiation support',
      'Contract structuring and drafting',
      'Price negotiation mediation',
      'Documentation management',
      'Settlement arrangement',
    ],
  },
  {
    id: 3,
    title: 'Post-Trade Services',
    icon: FileText,
    colorKey: 'emerald',
    services: [
      'Custody and settlement',
      'Regulatory reporting (if required)',
      'Trade confirmation and reconciliation',
      'Invoice and payment processing',
      'Record maintenance and audit trail',
    ],
  },
  {
    id: 4,
    title: 'Risk Management Services',
    icon: Shield,
    colorKey: 'amber',
    services: [
      'Counterparty risk assessment',
      'Regulatory risk evaluation',
      'Transaction structure optimization',
      'Hedging advice',
      'Compliance gap analysis',
    ],
  },
  {
    id: 5,
    title: 'Regulatory Compliance Services',
    icon: Scale,
    colorKey: 'pink',
    services: [
      'KYC/AML documentation',
      'Ongoing monitoring',
      'Transaction reporting',
      'Regulatory filing support',
      'Compliance certification',
    ],
  },
];

// Technology Platform
const technologyModules = [
  {
    module: 'Deal Origination Module',
    features: [
      'Seller offerings database (CEA holders)',
      'Buyer requests database (EUA seekers)',
      'Matching algorithm',
      'Deal notification system',
      'Counterparty introduction protocols',
    ],
  },
  {
    module: 'Marketplace Interface',
    features: [
      'Secured portal for counterparties',
      'Real-time deal status tracking',
      'Document upload and management',
      'Negotiation workspace',
      'Video conferencing integration (for negotiations)',
    ],
  },
  {
    module: 'Compliance Module',
    features: [
      'KYC workflow automation',
      'Document collection and verification',
      'Sanctions screening integration',
      'Audit trail maintenance',
      'Report generation (regulatory and internal)',
    ],
  },
  {
    module: 'Settlement Module',
    features: [
      'Nostro/vostro account management',
      'Settlement instruction processing',
      'FX (if multi-currency deals)',
      'Custody account management',
      'Confirmation matching',
    ],
  },
  {
    module: 'Reporting and Analytics',
    features: [
      'Deal volume tracking',
      'Price realization reporting',
      'Risk metrics calculation',
      'Regulatory reporting templates',
      'Performance analytics',
    ],
  },
];

// Part 4: Multi-Leg Transaction Structure
const transactionLegs = [
  {
    leg: 1,
    title: 'CEA Acquisition',
    description: 'Non-EU entity holding CEA contacts Nihao',
    steps: [
      'Non-EU entity offers CEA for sale in private transaction',
      'Nihao purchases CEA on behalf of upcoming EU buyer',
      'Financing: EU entity pre-funds transaction',
      'Settlement: CEA transferred to Nihao custody',
    ],
  },
  {
    leg: 2,
    title: 'EUA/CEA Swap',
    description: 'EU entity agrees to exchange CEA for EUA',
    steps: [
      'CEA now held in Nihao custody',
      'Bilateral negotiation with another non-EU entity holding EUA',
      'Swap terms negotiated (1:1 typically, though market-dependent)',
      'Conditions of exchange documented',
    ],
  },
  {
    leg: 3,
    title: 'Final Delivery',
    description: 'Settlement completion and regulatory reporting',
    steps: [
      'CEA transferred from Nihao to EUA holder',
      'EUA transferred to EU entity',
      'Settlement completion',
      'Regulatory reporting filed',
    ],
  },
];

// Value Proposition by Participant Type
const valuePropositions = [
  {
    participant: 'Non-EU CEA Holders',
    benefits: [
      'Private price discovery (vs. exchange prices)',
      'Flexibility in timing (avoid year-end selling pressure)',
      'Potential for premium pricing (vs. exchange)',
      'Access to direct EU buyers (without intermediaries)',
      'Reduced transaction costs (direct deal vs. exchange + broker)',
    ],
    improvement: '8-25%',
  },
  {
    participant: 'EU EUA Buyers',
    benefits: [
      'Access to CEA swap market (restricted to private deals)',
      'Pricing benefits vs. exchange purchases',
      'Customized terms (timing, settlement)',
      'Reduced market impact (no public order books)',
      'Direct relationship with sellers',
    ],
    improvement: '15-25%',
  },
  {
    participant: 'Nihao Group',
    benefits: [
      'Transaction facilitation fees',
      'Custody and settlement service fees',
      'Bid-ask spread capture (if pricing as principal)',
      'Regulatory compliance fees',
      'Repeated transaction relationships',
    ],
    improvement: 'Revenue',
  },
];

// Part 5: Comparative Regulatory Analysis
const comparativeAnalysis = [
  { dimension: 'Carbon Market Access', hk: 'Both EUA & CEA visibility', eu: 'EU ETS only (CEA restricted)', sg: 'Both visibility', uk: 'Limited' },
  { dimension: 'Regulatory Framework', hk: 'SFO + HKMA', eu: 'MiFID II/EMIR', sg: 'MAS oversight', uk: 'FCA (separate)' },
  { dimension: 'KYC/AML Standards', hk: 'Comparable to EU', eu: 'Stringent', sg: 'Comparable', uk: 'Similar to EU' },
  { dimension: 'Settlement Infrastructure', hk: 'Euroclear-linked', eu: 'Direct', sg: 'DTC linked', uk: 'Euroclear-linked' },
  { dimension: 'Tax Efficiency', hk: 'Favorable (if structured)', eu: 'Standard EU', sg: 'Competitive', uk: 'Standard' },
  { dimension: 'Time Zone', hk: 'Asian hours (covers all)', eu: 'European hours', sg: 'Asian hours', uk: 'European hours' },
  { dimension: 'Cross-Border Capability', hk: 'China + EU + International', eu: 'EU + International', sg: 'Asia + International', uk: 'EU + International' },
  { dimension: 'Greentech Support', hk: 'Developing (government push)', eu: 'Established', sg: 'Growing', uk: 'Established' },
];

// Connectivity Advantages
const connectivityAdvantages = {
  china: [
    'Shanghai Environment and Energy Exchange (SEEE) integration',
    'MEE (Ministry of Ecology & Environment) regulatory connections',
    'Greater Bay Area financial infrastructure',
    'Direct RMB currency settlement',
    'Preferential market intelligence access',
  ],
  europe: [
    'EEX/ICE trading infrastructure',
    'ESMA regulatory coordination',
    'EU banking infrastructure',
    'Euro currency infrastructure',
    'EU regulatory compliance pathway',
  ],
  international: [
    '24-hour trading capability (Asian/European/American hours)',
    'Multi-currency settlement (HKD, USD, EUR, RMB)',
    'Professional financial services ecosystem',
    'Deep capital pools',
    'Institutional investor presence',
  ],
};

// Part 7: Risk Management
const operationalRisks = [
  {
    type: 'Market Risk',
    factors: [
      'Price movement between transaction legs',
      'Counterparty default pre-settlement',
      'Regulatory prohibition changes',
      'Liquidity risk in underlying markets',
    ],
  },
  {
    type: 'Counterparty Risk',
    factors: [
      'Non-EU entity failure to deliver CEA',
      'EU entity failure to fund account',
      'EUA holder failing to execute swap',
      'Settlement failures',
    ],
  },
  {
    type: 'Regulatory Risk',
    factors: [
      'Chinese restrictions on foreign participation expansion',
      'EU regulatory changes limiting private deals',
      'Hong Kong regulatory changes',
      'FATCA/CRS compliance complications',
    ],
  },
  {
    type: 'Reputational Risk',
    factors: [
      'Failed transactions',
      'Regulatory violations',
      'Client disputes',
      'Market manipulation allegations',
    ],
  },
];

const governanceFramework = {
  board: [
    'Chair: Oversees strategic direction',
    'Directors: Regulatory compliance, operations, risk',
    'Audit committee: External audit oversight',
    'Compliance committee: AML/regulatory matters',
  ],
  management: [
    'Chief Executive Officer',
    'Chief Compliance Officer',
    'Chief Technology Officer',
    'Head of Operations',
    'Head of Business Development',
  ],
  operational: [
    'Compliance team (2-3 FTE)',
    'Operations team (2-3 FTE)',
    'Business development team (2-4 FTE)',
    'Technology support (1-2 FTE)',
    'Finance/administration (1-2 FTE)',
  ],
  policies: [
    'Code of conduct',
    'Conflict of interest policy',
    'Market conduct rules',
    'Transaction monitoring procedures',
    'Sanctions screening protocols',
    'Whistleblower protection policy',
  ],
};

// Part 8: Strategic Competitive Advantages
const competitiveAdvantages = [
  {
    title: 'Market Access Bridge',
    description: 'Only entity positioned at intersection of restricted Chinese market (CEA) and liquid EU market (EUA)',
    points: [
      'Both markets\' regulatory frameworks understood',
      'Language/cultural capabilities for both markets',
      'Unique positioning as bridge',
    ],
  },
  {
    title: 'Regulatory Arbitrage (Compliant)',
    description: 'Leverages Hong Kong\'s mutual recognition potential',
    points: [
      'Operates in OTC market (less regulated than exchanges)',
      'Complies with all relevant jurisdictions',
      'Provides efficiency gains without legal violations',
    ],
  },
  {
    title: 'Timing Optimization',
    description: 'Operates across all time zones with 24-hour capability',
    points: [
      'Bridges Chinese business hours with EU hours',
      'Captures liquidity windows in both markets',
      'Matches seasonal supply/demand mismatches',
    ],
  },
  {
    title: 'Information Asymmetry',
    description: 'Privy to both markets\' participant needs',
    points: [
      'Can identify matching counterparties before public markets',
      'Provides bilateral negotiation before public disclosure',
      'Creates discovery value for clients',
    ],
  },
];

export default function AboutNihaoPage() {
  const [activeService, setActiveService] = useState(0);
  const [activeTechModule, setActiveTechModule] = useState(0);

  return (
    <OnboardingLayout
      title="About Nihao Group"
      subtitle="Strategic intermediary bridging EU and China carbon markets"
    >
      {/* Executive Summary */}
      <section className="mb-16">
        <div
          className="rounded-2xl p-8"
          style={{
            background: `linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(30, 64, 175, 0.15) 100%)`,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8" style={{ color: colors.primaryLight }} />
            <h3 className="text-xl font-bold">Executive Summary</h3>
          </div>
          <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
            Nihao Group Hong Kong represents a <strong style={{ color: colors.textPrimary }}>strategic intermediary</strong> positioned at the intersection of European and Chinese carbon markets, leveraging Hong Kong&apos;s unique role as a gateway between Western financial markets and mainland China. The business model depends on continued market inefficiencies between exchange-traded carbon markets and private bilateral deals.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primaryLight }} />
              <div className="font-bold" style={{ color: colors.textPrimary }}>Hong Kong HQ</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Strategic Gateway Location</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <Scale className="w-8 h-8 mx-auto mb-2" style={{ color: colors.accent }} />
              <div className="font-bold" style={{ color: colors.textPrimary }}>SFC Oversight</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Full Regulatory Compliance</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: colors.success }} />
              <div className="font-bold" style={{ color: colors.textPrimary }}>EU-Level KYC</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Comparable Standards</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: colors.secondaryLight }} />
              <div className="font-bold" style={{ color: colors.textPrimary }}>15-25%</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Value Improvement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 1: Company Overview and Strategic Positioning */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
          >
            1
          </div>
          <div>
            <h3 className="text-2xl font-bold">Company Overview and Strategic Positioning</h3>
            <p style={{ color: colors.textSecondary }}>Organizational structure and Hong Kong rationale</p>
          </div>
        </div>

        {/* Corporate Entity */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <h4 className="text-lg font-semibold mb-4" style={{ color: colors.primaryLight }}>Organizational Structure</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-sm" style={{ color: colors.textMuted }}>Primary Entity</div>
              <div className="font-semibold" style={{ color: colors.textPrimary }}>{companyOverview.entity.name}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-sm" style={{ color: colors.textMuted }}>Jurisdiction</div>
              <div className="font-semibold" style={{ color: colors.textPrimary }}>{companyOverview.entity.jurisdiction}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-sm" style={{ color: colors.textMuted }}>Regulatory Environment</div>
              <div className="font-semibold" style={{ color: colors.textPrimary }}>{companyOverview.entity.regulatory}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-sm" style={{ color: colors.textMuted }}>Capital Structure</div>
              <div className="font-semibold" style={{ color: colors.textPrimary }}>{companyOverview.entity.capital}</div>
            </div>
          </div>
        </div>

        {/* Hong Kong Rationale */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: colors.primaryLight }} />
            Strategic Headquarters Location: Hong Kong
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            {companyOverview.hkRationale.map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
              >
                <h5 className="font-semibold mb-3" style={{ color: colors.primaryLight }}>{item.category}</h5>
                <ul className="space-y-2">
                  {item.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Business Model */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Business Model: Carbon Certificate Intermediation</h4>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.danger}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Non-EU Entities (Sellers)</h5>
              <ul className="space-y-2">
                {companyOverview.businessModel.nonEuSellers.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.secondaryLight}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.secondaryLight }}>EU Entities (Buyers)</h5>
              <ul className="space-y-2">
                {companyOverview.businessModel.euBuyers.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.secondaryLight }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.primary}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.primaryLight }}>Transaction Structure</h5>
              <ul className="space-y-2">
                {companyOverview.businessModel.transactionStructure.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primaryLight }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Competitive Positioning */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Competitive Positioning: Market Gap Identified</h4>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.danger}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange-Based Trading Friction</h5>
              <ul className="space-y-2">
                {companyOverview.competitiveGap.exchangeProblems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao&apos;s Solution</h5>
              <ul className="space-y-2">
                {companyOverview.competitiveGap.nihaoSolution.map((item, i) => (
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

      {/* Part 2: Regulatory and Operational Capabilities */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)` }}
          >
            2
          </div>
          <div>
            <h3 className="text-2xl font-bold">Regulatory and Operational Capabilities</h3>
            <p style={{ color: colors.textSecondary }}>Hong Kong regulatory framework and KYC/AML compliance</p>
          </div>
        </div>

        {/* Regulatory Framework */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Applicable Regulations</h4>
          <div className="space-y-4">
            {regulatoryFramework.map((reg, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <Scale className="w-5 h-5" style={{ color: colors.accent }} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{reg.regulation}</h5>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{reg.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {reg.details.map((detail, j) => (
                        <span
                          key={j}
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ backgroundColor: colors.bgCardHover, color: colors.textSecondary }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC/AML Compliance Framework */}
        <div>
          <h4 className="text-lg font-semibold mb-4">KYC/AML Compliance Framework</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                <Shield className="w-5 h-5" />
                Enhanced Due Diligence (EDD)
              </h5>
              <ul className="space-y-2">
                {kycFramework.edd.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
                <FileText className="w-5 h-5" />
                Documentation Requirements
              </h5>
              <ul className="space-y-2">
                {kycFramework.documentation.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.accent }}>
                <Clock className="w-5 h-5" />
                Ongoing Monitoring
              </h5>
              <ul className="space-y-2">
                {kycFramework.monitoring.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2 text-pink-500">
                <Database className="w-5 h-5" />
                Technology Infrastructure
              </h5>
              <ul className="space-y-2">
                {kycFramework.technology.map((item, i) => (
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

      {/* Part 3: Operational Capabilities and Services */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
          >
            3
          </div>
          <div>
            <h3 className="text-2xl font-bold">Operational Capabilities and Services</h3>
            <p style={{ color: colors.textSecondary }}>Five comprehensive service offerings and technology platform</p>
          </div>
        </div>

        {/* Service Offerings */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Service Offerings</h4>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {serviceOfferings.map((service, i) => {
              const Icon = service.icon;
              const colorClasses = serviceColorMap[service.colorKey];
              return (
                <button
                  key={i}
                  onClick={() => setActiveService(i)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all border-2 ${
                    activeService === i
                      ? `${colorClasses.bg} ${colorClasses.border} text-white`
                      : 'bg-navy-800 border-navy-600 text-navy-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{service.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            {(() => {
              const activeOffer = serviceOfferings[activeService];
              const activeColorClasses = serviceColorMap[activeOffer.colorKey];
              const ActiveIcon = activeOffer.icon;
              return (
                <motion.div
                  key={activeService}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-xl p-6 bg-navy-800 border-2 ${activeColorClasses.border}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeColorClasses.bg}`}
                    >
                      <ActiveIcon className="w-6 h-6 text-white" />
                    </div>
                    <h5 className="text-xl font-bold text-white">
                      {activeOffer.title}
                    </h5>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {activeOffer.services.map((service, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-navy-700">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                        <span className="text-navy-300">{service}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Technology Platform */}
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" style={{ color: colors.primaryLight }} />
            Technology Platform Capabilities
          </h4>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {technologyModules.map((mod, i) => (
              <button
                key={i}
                onClick={() => setActiveTechModule(i)}
                className="flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm"
                style={{
                  backgroundColor: activeTechModule === i ? colors.primary : colors.bgCard,
                  border: activeTechModule === i ? `2px solid ${colors.primaryLight}` : `1px solid ${colors.border}`,
                  color: activeTechModule === i ? 'white' : colors.textSecondary,
                }}
              >
                {mod.module}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTechModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-xl p-6"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.primary}` }}
            >
              <h5 className="font-bold mb-4" style={{ color: colors.primaryLight }}>
                {technologyModules[activeTechModule].module}
              </h5>
              <div className="grid md:grid-cols-2 gap-3">
                {technologyModules[activeTechModule].features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primaryLight }} />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Part 4: Market Positioning for Carbon Swapping Operations */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold bg-gradient-to-br from-violet-500 to-pink-500"
          >
            4
          </div>
          <div>
            <h3 className="text-2xl font-bold">Market Positioning for Carbon Swapping</h3>
            <p style={{ color: colors.textSecondary }}>Multi-leg transaction structure and value proposition</p>
          </div>
        </div>

        {/* Multi-Leg Transaction Flow */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Multi-Leg Transaction Structure</h4>
          <div className="grid lg:grid-cols-3 gap-6">
            {transactionLegs.map((leg, i) => (
              <div
                key={i}
                className="rounded-xl p-5 relative"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
              >
                <div
                  className="absolute -top-3 left-6 px-3 py-1 rounded-full font-bold text-sm"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  Leg {leg.leg}
                </div>
                <h5 className="font-bold mt-2 mb-2" style={{ color: colors.textPrimary }}>{leg.title}</h5>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{leg.description}</p>
                <ul className="space-y-2">
                  {leg.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primaryLight }} />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition by Participant */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Value Proposition for Each Participant Type</h4>
          <div className="grid lg:grid-cols-3 gap-6">
            {valuePropositions.map((vp, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${i === 0 ? colors.danger : i === 1 ? colors.secondaryLight : colors.primary}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-bold" style={{ color: colors.textPrimary }}>{vp.participant}</h5>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: `${colors.success}20`, color: colors.success }}
                  >
                    {vp.improvement}
                  </span>
                </div>
                <ul className="space-y-2">
                  {vp.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Part 5: Strategic Advantages of Hong Kong Location */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.secondaryLight} 100%)` }}
          >
            5
          </div>
          <div>
            <h3 className="text-2xl font-bold">Strategic Advantages of Hong Kong Location</h3>
            <p style={{ color: colors.textSecondary }}>Comparative regulatory analysis and connectivity</p>
          </div>
        </div>

        {/* Comparative Regulatory Analysis Table */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <h4 className="p-4 font-semibold" style={{ backgroundColor: colors.bgCardHover, color: colors.textPrimary }}>
            Comparative Regulatory Analysis
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: colors.bgCardHover }}>
                  <th className="p-3 text-left text-sm font-semibold" style={{ color: colors.textPrimary }}>Dimension</th>
                  <th className="p-3 text-left text-sm font-semibold" style={{ color: colors.primaryLight }}>🇭🇰 Hong Kong</th>
                  <th className="p-3 text-left text-sm font-semibold" style={{ color: colors.secondaryLight }}>🇪🇺 EU</th>
                  <th className="p-3 text-left text-sm font-semibold" style={{ color: colors.accent }}>🇸🇬 Singapore</th>
                  <th className="p-3 text-left text-sm font-semibold text-pink-500">🇬🇧 UK</th>
                </tr>
              </thead>
              <tbody>
                {comparativeAnalysis.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary }}>
                      {row.dimension}
                    </td>
                    <td className="p-3 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.hk}
                    </td>
                    <td className="p-3 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.eu}
                    </td>
                    <td className="p-3 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.sg}
                    </td>
                    <td className="p-3 text-sm" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.uk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connectivity Advantages */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.danger}` }}>
            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.danger }}>
              🇨🇳 China Market Access
            </h5>
            <ul className="space-y-2">
              {connectivityAdvantages.china.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.secondaryLight}` }}>
            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
              🇪🇺 European Market Access
            </h5>
            <ul className="space-y-2">
              {connectivityAdvantages.europe.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.secondaryLight }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.primaryLight}` }}>
            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.primaryLight }}>
              🌍 International Financial Center
            </h5>
            <ul className="space-y-2">
              {connectivityAdvantages.international.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primaryLight }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Part 6: Risk Management and Governance */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.danger} 0%, ${colors.accent} 100%)` }}
          >
            6
          </div>
          <div>
            <h3 className="text-2xl font-bold">Risk Management and Governance</h3>
            <p style={{ color: colors.textSecondary }}>Operational risks and governance framework</p>
          </div>
        </div>

        {/* Operational Risks */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Operational Risks</h4>
          <div className="grid md:grid-cols-2 gap-6">
            {operationalRisks.map((risk, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
              >
                <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.danger }}>
                  <AlertTriangle className="w-5 h-5" />
                  {risk.type}
                </h5>
                <ul className="space-y-2">
                  {risk.factors.map((factor, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.accent }} />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Framework */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Governance Framework</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.primaryLight }}>Board Level</h5>
              <ul className="space-y-2">
                {governanceFramework.board.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.secondaryLight }}>Management Level</h5>
              <ul className="space-y-2">
                {governanceFramework.management.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.accent }}>Operational Teams</h5>
              <ul className="space-y-2">
                {governanceFramework.operational.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Compliance Policies</h5>
              <ul className="space-y-2">
                {governanceFramework.policies.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Part 8: Strategic Competitive Advantages */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold bg-gradient-to-br from-violet-500 to-blue-500"
          >
            8
          </div>
          <div>
            <h3 className="text-2xl font-bold">Strategic Competitive Advantages</h3>
            <p style={{ color: colors.textSecondary }}>Unique market position and scalability opportunities</p>
          </div>
        </div>

        {/* Four Key Advantages */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {competitiveAdvantages.map((adv, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${colors.primary}20`, color: colors.primaryLight }}
                >
                  {i + 1}
                </div>
                <h5 className="font-bold" style={{ color: colors.textPrimary }}>{adv.title}</h5>
              </div>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{adv.description}</p>
              <ul className="space-y-2">
                {adv.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </section>

      {/* Conclusion */}
      <section
        className="p-8 rounded-2xl text-center mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)`,
          border: `1px solid ${colors.primary}`,
        }}
      >
        <h3 className="text-2xl font-bold mb-4">Conclusion</h3>
        <p className="text-lg mb-6 max-w-4xl mx-auto" style={{ color: colors.textSecondary }}>
          Nihao Group Hong Kong represents a strategically positioned intermediary leveraging:
          <strong style={{ color: colors.textPrimary }}> Geographic advantage</strong> (Hong Kong&apos;s position between China and Europe),
          <strong style={{ color: colors.textPrimary }}> Regulatory advantage</strong> (compliant OTC market operation),
          <strong style={{ color: colors.textPrimary }}> Market knowledge advantage</strong> (deep understanding of both markets),
          <strong style={{ color: colors.textPrimary }}> Technology platform advantage</strong> (proprietary matching and compliance), and
          <strong style={{ color: colors.textPrimary }}> Relationship advantage</strong> (trust-based partnerships).
        </p>
        <OnboardingLink
          to="/onboarding/cea-holders"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
        >
          Explore CEA Holder Advantages
          <ArrowRight className="w-5 h-5" />
        </OnboardingLink>
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
        <OnboardingLink
          to="/onboarding/market-overview"
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: colors.textSecondary }}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Market Overview
        </OnboardingLink>
        <OnboardingLink
          to="/onboarding/cea-holders"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 bg-gradient-to-br from-red-600 to-orange-500"
        >
          Next: For CEA Holders
          <ArrowRight className="w-5 h-5" />
        </OnboardingLink>
      </div>
    </OnboardingLayout>
  );
}
