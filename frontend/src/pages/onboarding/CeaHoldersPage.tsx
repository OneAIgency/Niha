import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Factory,
  BarChart3,
  Building2,
  Globe,
  Landmark,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Shield,
  Scale,
  Clock,
  TrendingUp,
  AlertTriangle,
  Zap,
  Lock,
  Users,
} from 'lucide-react';
import { OnboardingLayout, colors } from '@/components/onboarding';

// Part 1: Five Categories of Non-EU Entities Holding CEA
const ceaHolderCategories = [
  {
    id: 1,
    icon: Factory,
    title: 'Chinese Domestic Industrial Facilities',
    tag: 'Covered Entities',
    description: 'Industrial manufacturing facilities mandated in China\'s national ETS under MEE regulations',
    color: '#ef4444',
    subCategories: [
      {
        name: 'Power Generation Facilities',
        details: [
          'Thermal power plants (coal-fired)',
          'Natural gas-fired power generation',
          'Combined heat and power (CHP) plants',
          'Annual emissions threshold: 26,000 tCO₂e or greater',
          'Estimated number in China: ~2,500 entities',
        ],
      },
      {
        name: 'Steel and Iron Production',
        details: [
          'Integrated steel mills (blast furnace + basic oxygen furnace)',
          'Electric arc furnace (EAF) facilities',
          'Iron ore sintering plants',
          'Estimated number newly added to ETS: ~400-500 entities',
          'Combined sector emissions: ~800-1,000 MtCO₂e annually',
        ],
      },
      {
        name: 'Cement Manufacturing',
        details: [
          'Portland cement clinker production',
          'Cement blending facilities',
          'Lime production',
          'Estimated number newly added to ETS: ~600-700 entities',
          'Sector emissions: ~1,200-1,400 MtCO₂e annually',
        ],
      },
      {
        name: 'Aluminum Smelting',
        details: [
          'Primary aluminum production (Hall-Héroult process)',
          'Secondary aluminum production',
          'Anode production for electrolysis',
          'Estimated number newly added to ETS: ~200-250 entities',
          'Sector emissions: ~400-500 MtCO₂e annually',
        ],
      },
    ],
    organizationalStructure: [
      'State-owned enterprises (SOEs): 40-50% of entities',
      'Private manufacturing companies: 30-35%',
      'Foreign-invested enterprises (FIEs): 15-20%',
      'Joint ventures: 5-10%',
    ],
    holdingsProfile: [
      'Allocation method: Free allocation based on verified emissions',
      'Allocation approach (2025+): Output-based intensity benchmarks',
      'Average annual allocation per entity: 50,000-500,000 tonnes',
      'Surplus accumulation: 20-40% of entities generate annual surpluses',
    ],
    advantage: '10-15%',
  },
  {
    id: 2,
    icon: BarChart3,
    title: 'Chinese Trading Companies and Financial Intermediaries',
    tag: 'Non-Regulated Brokers',
    description: 'Financial intermediaries trading CEA for profit opportunities, not as direct ETS participants',
    color: '#f97316',
    subCategories: [
      {
        name: 'Carbon Trading Brokers',
        details: [
          'Unregulated or lightly-regulated intermediaries',
          'Estimated number: 100-200+ entities',
          'Activities: Spot trading, forward contracts, portfolio management',
          'Typical holdings: 1,000-10,000,000 tonnes aggregate',
        ],
      },
      {
        name: 'Energy Trading Companies',
        details: [
          'Companies with expertise in energy commodities (natural gas, coal, electricity)',
          'Diversified into carbon allowance trading',
          'Estimated number: 50-100 entities',
          'Typical holdings: 100,000-5,000,000 tonnes',
        ],
      },
      {
        name: 'Financial Investment Firms',
        details: [
          'Fund managers, private equity groups, investment advisors',
          'Treat CEA as commodity or ESG investment vehicle',
          'Estimated number: 30-50 entities',
          'Typical holdings: 50,000-10,000,000 tonnes',
          'Investment horizon: 1-3 year holding periods',
        ],
      },
      {
        name: 'Tech-Enabled Trading Platforms',
        details: [
          'Fintech companies offering carbon trading services',
          'Online trading platforms connecting buyers and sellers',
          'Estimated number: 10-20 platforms',
          'Aggregate holdings: 100,000-2,000,000 tonnes across customer portfolios',
        ],
      },
    ],
    organizationalStructure: [
      'Private limited companies: 60-70%',
      'Publicly listed companies: 15-20%',
      'Foreign-invested enterprises: 10-15%',
    ],
    holdingsProfile: [
      'Acquisition method: Secondary market purchases, OTC bilateral deals',
      'Typical holding period: 3-18 months',
      'Position sizes: Highly variable (10,000 to 5,000,000+ tonnes)',
      'Profit motive: Trading spreads (typically 2-8% annual returns)',
    ],
    advantage: '15-25%',
  },
  {
    id: 3,
    icon: Building2,
    title: 'Chinese Affiliated Trading Operations',
    tag: 'Subsidiaries of Manufacturing Groups',
    description: 'Trading subsidiaries optimizing carbon allowance portfolios across group companies',
    color: '#8b5cf6',
    subCategories: [
      {
        name: 'Conglomerate Trading Arms',
        details: [
          'Subsidiaries of large state-owned enterprises',
          'Examples: Trading units of power generation groups, steel conglomerates',
          'Estimated number: 20-50 entities',
          'Aggregate holdings: 5-50 million tonnes',
        ],
      },
      {
        name: 'Internal Risk Management Entities',
        details: [
          'Dedicated units for intra-group hedging',
          'Optimize allowance allocation across group facilities',
          'Manage compliance across 5-50+ manufacturing locations per group',
          'Estimated number: 15-30 entities',
        ],
      },
      {
        name: 'Strategic Reserves',
        details: [
          'Entities holding CEA for strategic purposes',
          'Buffering against future allocation reductions',
          'Speculation on future price appreciation',
          'Estimated number: 10-20 entities',
          'Aggregate holdings: 10-100+ million tonnes',
        ],
      },
    ],
    organizationalStructure: [
      'Limited liability companies: 90%+',
      'Wholly-owned subsidiaries of parent SOEs or private groups',
      'Operate under group treasury functions',
    ],
    holdingsProfile: [
      'Acquisition method: Internal transfer from operating facilities, secondary market',
      'Holding periods: 1-5+ years',
      'Average positions: 1-50 million tonnes',
      'Strategic objectives: Portfolio optimization, intra-group pricing, future hedging',
    ],
    advantage: '12-20%',
  },
  {
    id: 4,
    icon: Globe,
    title: 'Chinese Export-Oriented Manufacturers',
    tag: 'Carbon Efficiency Leaders',
    description: 'Manufacturing companies generating CEA surplus due to advanced production efficiency',
    color: '#10b981',
    subCategories: [
      {
        name: 'Export-Focused Industrial Manufacturers',
        details: [
          'Companies exporting steel, chemicals, electronics, automotive components',
          'Higher efficiency standards due to international competitiveness',
          'Emissions allocations often exceed actual emissions',
          'Estimated number: 200-400 entities',
          'Aggregate surplus generation: 500-1,000 MtCO₂e annually',
        ],
      },
      {
        name: 'Joint Venture Manufacturers in China',
        details: [
          'Foreign-invested enterprises operating in China',
          'Often employ best-available technologies from parent company',
          'Generate consistent CEA surpluses',
          'Estimated number: 100-200 entities',
          'Aggregate surplus generation: 200-500 MtCO₂e annually',
        ],
      },
      {
        name: 'Technology Leaders in Heavy Industry',
        details: [
          'Companies with proprietary low-carbon production processes',
          'Significant competitive advantage in efficiency',
          'Maximum CEA surplus generation',
          'Estimated number: 50-100 entities',
          'Aggregate surplus generation: 300-600 MtCO₂e annually',
        ],
      },
    ],
    organizationalStructure: [
      'Private limited companies: 40%',
      'Joint ventures: 35%',
      'Wholly foreign-owned enterprises: 20%',
      'Listed subsidiaries: 5%',
    ],
    holdingsProfile: [
      'Accumulation method: Compliance-driven (actual emissions < allocation)',
      'Annual surplus per entity: 10,000-500,000 tonnes',
      'Carrying forward capability: 70-100% of surplus under new rules',
      'Cumulative holdings from multi-year surplus: 100,000-5,000,000 tonnes',
    ],
    advantage: '12-18%',
  },
  {
    id: 5,
    icon: Landmark,
    title: 'Chinese Government-Linked Entities and SOE Holdings',
    tag: 'Policy & Strategic Reserves',
    description: 'Government-controlled organizations holding CEA for policy purposes or strategic reserves',
    color: '#6366f1',
    subCategories: [
      {
        name: 'Environmental Ministry Reserve Holdings',
        details: [
          'Held by MEE or provincial environmental authorities',
          'Purposes: System stability, strategic reserves, research purposes',
          'Estimated quantity: 100,000-5,000,000 tonnes',
        ],
      },
      {
        name: 'State Asset Management Companies',
        details: [
          'Holding company structures managing state-owned manufacturing groups',
          'Hold CEA as part of consolidated group portfolios',
          'Estimated number: 15-30 entities',
          'Aggregate holdings: 5-50 million tonnes',
        ],
      },
      {
        name: 'Special Purpose Government Entities',
        details: [
          'Provinces or cities maintaining CEA reserves',
          'Supporting industrial policy or economic stimulus',
          'Estimated holdings: 1-20 million tonnes aggregate',
        ],
      },
    ],
    organizationalStructure: [
      'Government ministries and agencies',
      'State-owned enterprises (100% government owned)',
      'Government-controlled investment vehicles',
    ],
    holdingsProfile: [
      'Acquisition method: Allocation, policy purchases, market operations',
      'Holding purpose: Strategic, not trading-profit oriented',
      'Positions: Highly variable based on policy objectives',
      'Time horizons: Multi-year to indefinite',
    ],
    advantage: '8-15%',
  },
];

// Part 2: Advantages of Private Bilateral Deals
const economicAdvantages = {
  pricePremium: {
    title: 'Price Premium Realization (8-15% Premium Potential)',
    exchangeEnvironment: [
      'Public order books with visible bids and asks',
      'Standardized 10,000-tonne contract sizes',
      'Annual compliance-driven selling pressure (Q3-Q4)',
      'Limited buyer base due to restricted foreign participation',
      'Seasonal liquidity patterns with price volatility',
      'Average Q4 selling pressure discount: 8-15% below annual average',
    ],
    privateDealPremiums: [
      { type: 'Timing Optimization Premium', range: '3-8%', description: 'Avoid Q4 compliance selling pressure, lock-in prices before market downturns' },
      { type: 'Buyer-Seller Matching Premium', range: '2-5%', description: 'Direct negotiation, EU buyers willing to pay premium for bilateral CEA' },
      { type: 'Volume Efficiency Premium', range: '1-3%', description: 'Large block transactions (500K-10M tonnes), no market impact' },
      { type: 'Confidentiality Premium', range: '2-4%', description: 'Non-public pricing protects competitive position' },
    ],
    example: {
      volume: '100,000 tonnes annual surplus',
      seeeQ4: '100,000 × ¥75/tonne = ¥7,500,000',
      privateNihao: '100,000 × ¥87/tonne = ¥8,700,000',
      gain: '¥1,200,000 (16% premium)',
    },
  },
  carryOverBanking: {
    title: 'Carry-Over Banking Optimization',
    rules: [
      'Power sector base banking quota: 10,000 tonnes',
      'Steel, cement, aluminum base banking quota: 100,000 tonnes (newly increased)',
      'Additional carry-over limited based on "net sales volume" of CEA',
    ],
    exchangeImpact: [
      'Public sales record the entity\'s market position',
      'Net sales volume calculations reduce future banking eligibility',
      'Market participants can infer strategic positions from SEEE trading volume',
      'Reduces future year carry-over potential',
    ],
    privateDealAdvantage: [
      'Non-reported sales maintain lower recorded "net sales"',
      'Allows maximum banking quota utilization in future years',
      'Private deals don\'t impact future year banking calculations',
      'Example: Additional 50,000 tonnes carry-over benefit = ¥3,750,000 deferred revenue',
    ],
  },
  hedgingLockdown: {
    title: 'Hedging and Lockdown Pricing',
    benefit: 'Price Certainty Premium: 1-3% value capture',
    details: [
      'Private forward deals typically 2-4 week execution (vs. spot settlement)',
      'Allows entities to lock in agreed prices',
      'Protects against adverse Q4 price moves',
      'Equivalent to free option pricing benefit',
    ],
    example: {
      volume: '50,000 tonnes surplus',
      forwardPrice: '¥85/tonne through Nihao',
      spotForecast: '¥73/tonne (downside risk)',
      lockInBenefit: '(¥85 - ¥73) × 50,000 = ¥600,000 value capture',
    },
  },
};

const regulatoryAdvantages = {
  confidentiality: {
    title: 'Enhanced Confidentiality and Non-Disclosure',
    seeeDisclosure: [
      'All trades on SEEE are publicly reported',
      'Transaction details (buyer, seller, quantity, price) appear in public databases',
      'Competitive intelligence risk: Competitors see selling volume patterns',
      'Market impact risk: Large seller reputation creates supply expectations',
      'Stakeholder risk: Employees, customers, competitors learn trading patterns',
    ],
    nihaoBenefits: [
      'Bilateral transactions remain confidential between parties',
      'Nihao acts as intermediary, protecting counterparty identities',
      'Market participants cannot infer supply patterns',
      'Steel mills protect capacity utilization rates',
      'Power plants hide efficiency improvements',
      'Conglomerates conceal production optimization strategies',
    ],
    valueBenefit: 'Estimated value: 1-3% of transaction value',
  },
  reducedScrutiny: {
    title: 'Reduced Regulatory Scrutiny and Government Relations Risk',
    seeeScrutiny: [
      'MEE monitors all SEEE trading patterns',
      'Large sellers may trigger government inquiries',
      'Regulatory concerns about market manipulation or excessive speculation',
      'Potential policy changes if certain entities accumulate large surpluses',
      'Risk of reputational targeting as "carbon speculators"',
    ],
    privateProfile: [
      'Private bilateral deals operate in OTC market (less regulated than exchanges)',
      'Nihao handles KYC/AML compliance (Hong Kong standards)',
      'Does not require registration with SEEE or MEE reporting',
      'Maintains lower profile with Chinese authorities',
      'Reduced risk of policy changes targeting specific entity types',
    ],
    valueBenefit: 'Estimated benefit to high-volume traders: 2-5% of positions',
  },
  policyProtection: {
    title: 'Protection Against Policy Changes',
    exchangeRisk: [
      'SEEE participant database and trading records are MEE property',
      'Policy changes can target specific entity types (e.g., "non-compliance financial traders")',
      'Regulatory restrictions can be implemented retroactively',
      'Past examples: 2023 banking quota reduction from 50% to 10%',
      'Future potential: auction system introduction or holdings taxes',
    ],
    privateDealProtection: [
      'Transactions already completed and settled',
      'No ongoing reporting relationship with regulators',
      'Reduces vulnerability to policy changes targeting "market participants"',
      'Holdings transferred internationally reduce Chinese jurisdiction exposure',
    ],
    valueBenefit: 'For financial traders with large positions: 2-8% value protection',
  },
};

const operationalAdvantages = {
  customization: {
    title: 'Customized Transaction Structuring',
    seeeConstraints: [
      'Fixed contract sizes: 10,000 tonnes per contract',
      'Standardized settlement: T+2 (2 business days)',
      'Limited contract structures: Spot only (no forwards in early phase)',
      'Price fixing: Public market prices apply',
      'No negotiation on terms',
    ],
    nihaoFlexibility: [
      {
        type: 'Volume Customization',
        details: 'Any volume negotiated (100K-10M+ tonnes), batch transactions, partial deliveries',
      },
      {
        type: 'Settlement Timeline Flexibility',
        details: 'T+5 to T+30+ settlement negotiable (vs. T+2 SEEE standard)',
      },
      {
        type: 'Pricing Structures',
        details: 'Forward pricing, volume-tiered pricing, conditional pricing based on benchmarks',
      },
      {
        type: 'Payment Terms',
        details: '30-50% upfront with remainder on delivery, staged payments, escrow arrangements',
      },
      {
        type: 'Dispute Resolution',
        details: 'Specify arbitration venue (Hong Kong vs. China), governing law options',
      },
    ],
    valueBenefit: 'Value improvement: 2-5% through optimized structuring',
  },
  portfolioConsolidation: {
    title: 'Portfolio Consolidation and Batch Disposal',
    seeeReality: [
      'Large positions (1M+ tonnes) require 100+ transactions',
      'Individual 10,000-tonne contracts must execute sequentially',
      'Market impact: Each transaction signals remaining inventory',
      'Cumulative transaction costs: 0.3-0.5% of volume',
      'Time to liquidate: 3-6 months for 1,000,000-tonne portfolio',
    ],
    nihaoConsolidation: [
      'Single bilateral transaction for entire portfolio',
      'No market impact from staged execution',
      'Direct transfer to buyer\'s custody',
    ],
    example: {
      volume: '1,000,000 tonnes',
      seeeRoute: '100 transactions × ¥20,000 fee = ¥2,000,000 cost + market impact',
      privateRoute: 'Single deal, ¥100,000-200,000 facilitation fee',
      savings: '¥1,800,000+ (9% reduction in transaction costs)',
    },
  },
  counterpartyQuality: {
    title: 'Counterparty Quality and Creditworthiness Optimization',
    seeeRisk: [
      'Counterparties are anonymous (identified only after transaction)',
      'Default risk: Buyer failure to complete payment or take delivery',
      'Settlement guarantee only through LCH (limited to clearing members)',
      'Risk of payment delays or disputes',
      'No pre-transaction due diligence on counterparty',
    ],
    nihaoDueDiligence: [
      'Pre-transaction verification of EU entity financial capacity',
      'Banking relationships and creditworthiness assessment',
      'Settlement infrastructure readiness',
      'Prior transaction history review',
      'Lower counterparty default risk',
    ],
    valueBenefit: 'Counterparty risk value: 2-5% for financially sensitive sellers',
  },
};

const strategicAdvantages = {
  positioning: {
    title: 'Positioning as Strategic Partner vs. Market Speculator',
    seeeProfile: [
      'Frequent sellers appear as "carbon traders" or "speculators"',
      'Creates reputational concerns with policy makers',
      'Potential regulatory targeting of non-compliance entities',
      'Competitive disadvantage vs. "efficiency leaders"',
    ],
    nihaoPositioning: [
      'Transactions appear as "strategic partnerships" not "speculative trading"',
      'Framing: "Supporting international carbon market development"',
      'Framing: "Strategic export of environmental commodities"',
      'Framing: "Partnerships with international ESG investors"',
      'Improved relationship with Chinese government (supporting policy objectives)',
    ],
    valueBenefit: 'Positioning premium: 1-2% lower cost of capital, 2-3% option value',
  },
  relationships: {
    title: 'Relationship Leverage and Repeat Transaction Economics',
    seeeStructure: [
      'Spot market, each transaction independent',
      'No relationship continuity',
      'Repeated transactions treated identically',
      'No leverage to improve future pricing',
    ],
    nihaoRelationship: [
      'Bilateral transaction establishes relationship',
      'Established trust reduces due diligence costs',
      'Longer settlement timelines negotiable',
      'Volume discounts on facilitation fees',
      'Preferred pricing based on relationship history',
      'Multi-year supply agreements possible',
    ],
    valueBenefit: 'Repeat transactions (3-5+ over 2-3 years): 2-5% pricing improvement',
  },
};

const taxCurrencyOptimization = {
  tax: {
    title: 'International Tax Planning Opportunities',
    seeeTrading: [
      'All transactions subject to Chinese domestic taxation',
      'VAT and enterprise income tax apply',
      'No ability to optimize tax structure',
      'Cumulative tax rate on margins: 20-30%',
    ],
    privateStructure: [
      'Transactions routed through Hong Kong intermediary',
      'Timing of revenue recognition optimization',
      'Cross-border transfer pricing opportunities',
      'Treaty benefits (China-EU tax treaty applications)',
      'Timing of payment recognition vs. delivery',
    ],
    valueBenefit: 'Tax efficiency gain: 2-5% depending on entity structure',
    example: {
      sales: '¥7,500,000',
      taxableMargin: '¥1,500,000 (20% markup)',
      chineseTax: '¥375,000 (25% rate)',
      privateSavings: '¥100,000-300,000 per transaction',
    },
  },
  currency: {
    title: 'Currency Risk Management',
    seeeMarket: [
      'All transactions in RMB',
      'No currency management options',
      'Exposure to RMB depreciation for traders',
    ],
    privateOptions: [
      'Pricing in RMB, USD, or EUR negotiable',
      'Forward currency contracts available',
      'Allows currency hedging',
      'Protection against RMB depreciation risk',
    ],
    valueBenefit: 'Currency management value: 1-2% for entities with USD/EUR exposures',
  },
};

// Part 3: Summary Table
const advantageSummaryTable = [
  { category: 'Manufacturing Surplus Generators', pricePremium: '8-12%', confidentiality: 'High', regulatory: 'Medium', structuring: 'Medium', total: '10-15%' },
  { category: 'Financial Trading Companies', pricePremium: '10-15%', confidentiality: 'Very High', regulatory: 'High', structuring: 'High', total: '15-25%' },
  { category: 'Conglomerate Trading Arms', pricePremium: '5-10%', confidentiality: 'High', regulatory: 'High', structuring: 'High', total: '12-20%' },
  { category: 'Export-Focused Manufacturers', pricePremium: '8-12%', confidentiality: 'Medium', regulatory: 'Medium', structuring: 'High', total: '12-18%' },
  { category: 'Government-Linked Entities', pricePremium: '3-8%', confidentiality: 'High', regulatory: 'Very High', structuring: 'Medium', total: '8-15%' },
];

// Part 4: Risk Mitigation
const riskMitigation = {
  counterparty: {
    title: 'Counterparty Default Risk Management',
    measures: [
      {
        level: 'Buyer Pre-qualification',
        details: 'Nihao performs full KYC on EU entity, verification of capital adequacy (minimum €5-10M recommended), banking relationship verification, prior transaction history review',
      },
      {
        level: 'Staged Settlement with Escrow',
        details: 'First tranche: 30-50% of CEA/payment, Second tranche: 25-35%, Final tranche: 15-20%. Nihao holds funds until final delivery.',
      },
      {
        level: 'Insurance and Guarantees',
        details: 'Performance bonds available (1-2% of transaction value), parent company guarantees, bank letters of credit as backup',
      },
    ],
  },
  regulatory: {
    title: 'Regulatory Compliance Risk Management',
    measures: [
      'All transactions documented with full audit trail',
      'Compliant with Hong Kong AMLO requirements',
      'MEE reporting not required (OTC market transactions)',
      'No adverse regulatory implications for Chinese sellers',
      'Proper documentation for both Chinese and EU tax purposes',
    ],
  },
};

export default function CeaHoldersPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeAdvantageTab, setActiveAdvantageTab] = useState('economic');

  const advantageTabs = [
    { id: 'economic', label: 'Economic', icon: DollarSign },
    { id: 'regulatory', label: 'Regulatory', icon: Shield },
    { id: 'operational', label: 'Operational', icon: Zap },
    { id: 'strategic', label: 'Strategic', icon: TrendingUp },
    { id: 'tax', label: 'Tax & Currency', icon: Globe },
  ];

  return (
    <OnboardingLayout
      title="For CEA Holders"
      subtitle="Private bilateral deals offer 8-25% value improvement over SEEE exchange trading"
    >
      {/* Executive Summary */}
      <section className="mb-16">
        <div
          className="rounded-2xl p-8"
          style={{
            background: `linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)`,
            border: `1px solid ${colors.danger}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Factory className="w-8 h-8" style={{ color: colors.danger }} />
            <h3 className="text-xl font-bold">Executive Summary</h3>
          </div>
          <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
            Non-EU entities holding Chinese Emission Allowances (CEA) represent distinct organizational categories with varying compliance profiles and economic incentives. This analysis reveals that private bilateral trading offers <strong style={{ color: colors.textPrimary }}>8-15% premium pricing</strong>, enhanced confidentiality, reduced regulatory exposure, and optimized transaction structuring advantages.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="text-3xl font-extrabold" style={{ color: colors.success }}>8-25%</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Total Value Improvement</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="text-3xl font-extrabold" style={{ color: colors.primaryLight }}>5</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Entity Categories</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="text-3xl font-extrabold" style={{ color: colors.accent }}>¥200-400B</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Annual Value Creation</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="text-3xl font-extrabold" style={{ color: colors.danger }}>8-15%</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Price Premium Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 1: Taxonomy of Non-EU Entities Holding CEA */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.danger} 0%, #f97316 100%)` }}
          >
            1
          </div>
          <div>
            <h3 className="text-2xl font-bold">Taxonomy of Non-EU Entities Holding CEA</h3>
            <p style={{ color: colors.textSecondary }}>Five primary categories with distinct profiles</p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {ceaHolderCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button
                key={i}
                onClick={() => setActiveCategory(i)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all"
                style={{
                  backgroundColor: activeCategory === i ? cat.color : colors.bgCard,
                  border: activeCategory === i ? `2px solid ${cat.color}` : `1px solid ${colors.border}`,
                  color: activeCategory === i ? 'white' : colors.textSecondary,
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm whitespace-nowrap">Category {cat.id}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl p-6"
            style={{ backgroundColor: colors.bgCard, border: `2px solid ${ceaHolderCategories[activeCategory].color}` }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: ceaHolderCategories[activeCategory].color }}
                >
                  {(() => {
                    const Icon = ceaHolderCategories[activeCategory].icon;
                    return <Icon className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div>
                  <h4 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {ceaHolderCategories[activeCategory].title}
                  </h4>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium mt-2"
                    style={{ backgroundColor: `${ceaHolderCategories[activeCategory].color}30`, color: ceaHolderCategories[activeCategory].color }}
                  >
                    {ceaHolderCategories[activeCategory].tag}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold" style={{ color: colors.success }}>
                  {ceaHolderCategories[activeCategory].advantage}
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>Total Value Improvement</div>
              </div>
            </div>

            <p className="mb-6" style={{ color: colors.textSecondary }}>
              {ceaHolderCategories[activeCategory].description}
            </p>

            {/* Sub-Categories */}
            <div className="mb-6">
              <h5 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Sub-Categories</h5>
              <div className="grid lg:grid-cols-2 gap-4">
                {ceaHolderCategories[activeCategory].subCategories.map((sub, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: colors.bgCardHover }}>
                    <h6 className="font-semibold mb-2" style={{ color: ceaHolderCategories[activeCategory].color }}>
                      {sub.name}
                    </h6>
                    <ul className="space-y-1">
                      {sub.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.textMuted }} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizational Structure & Holdings Profile */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgCardHover }}>
                <h6 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <Building2 className="w-4 h-4" />
                  Organizational Structure
                </h6>
                <ul className="space-y-2">
                  {ceaHolderCategories[activeCategory].organizationalStructure.map((item, i) => (
                    <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgCardHover }}>
                <h6 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.accent }}>
                  <BarChart3 className="w-4 h-4" />
                  CEA Holdings Profile
                </h6>
                <ul className="space-y-2">
                  {ceaHolderCategories[activeCategory].holdingsProfile.map((item, i) => (
                    <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Part 2: Advantages of Private Bilateral Deals */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
          >
            2
          </div>
          <div>
            <h3 className="text-2xl font-bold">Advantages of Private Bilateral Deals Through Nihao</h3>
            <p style={{ color: colors.textSecondary }}>Comprehensive analysis of economic, regulatory, and operational benefits</p>
          </div>
        </div>

        {/* Advantage Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {advantageTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdvantageTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: activeAdvantageTab === tab.id ? colors.primary : colors.bgCard,
                  border: activeAdvantageTab === tab.id ? `2px solid ${colors.primaryLight}` : `1px solid ${colors.border}`,
                  color: activeAdvantageTab === tab.id ? 'white' : colors.textSecondary,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Advantage Content */}
        <AnimatePresence mode="wait">
          {activeAdvantageTab === 'economic' && (
            <motion.div
              key="economic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Price Premium */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.success }}>
                  <DollarSign className="w-5 h-5" />
                  {economicAdvantages.pricePremium.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange-Based Pricing Problems</h5>
                    <ul className="space-y-2">
                      {economicAdvantages.pricePremium.exchangeEnvironment.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}30` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Premium Types</h5>
                    <div className="space-y-3">
                      {economicAdvantages.pricePremium.privateDealPremiums.map((premium, i) => (
                        <div key={i} className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm" style={{ color: colors.textPrimary }}>{premium.type}</div>
                            <div className="text-xs" style={{ color: colors.textMuted }}>{premium.description}</div>
                          </div>
                          <span className="font-bold ml-2" style={{ color: colors.success }}>{premium.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <h5 className="font-semibold mb-2" style={{ color: colors.primaryLight }}>Illustrative Example</h5>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>{economicAdvantages.pricePremium.example.volume}</div>
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: colors.danger }}>SEEE Q4: {economicAdvantages.pricePremium.example.seeeQ4}</div>
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: colors.success }}>Nihao: {economicAdvantages.pricePremium.example.privateNihao}</div>
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: colors.success }}>Gain: {economicAdvantages.pricePremium.example.gain}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carry-Over Banking */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <Clock className="w-5 h-5" />
                  {economicAdvantages.carryOverBanking.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>CEA Banking Rules</h5>
                    <ul className="space-y-2">
                      {economicAdvantages.carryOverBanking.rules.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Banking Advantages</h5>
                    <ul className="space-y-2">
                      {economicAdvantages.carryOverBanking.privateDealAdvantage.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Hedging */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
                  <Shield className="w-5 h-5" />
                  {economicAdvantages.hedgingLockdown.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <ul className="space-y-2">
                      {economicAdvantages.hedgingLockdown.details.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                    <h5 className="font-semibold mb-2" style={{ color: colors.accent }}>Example</h5>
                    <div className="space-y-1 text-sm" style={{ color: colors.textSecondary }}>
                      <div>Volume: {economicAdvantages.hedgingLockdown.example.volume}</div>
                      <div>Forward: {economicAdvantages.hedgingLockdown.example.forwardPrice}</div>
                      <div>Spot Forecast: {economicAdvantages.hedgingLockdown.example.spotForecast}</div>
                      <div className="font-bold" style={{ color: colors.success }}>
                        Benefit: {economicAdvantages.hedgingLockdown.example.lockInBenefit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeAdvantageTab === 'regulatory' && (
            <motion.div
              key="regulatory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Confidentiality */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <Lock className="w-5 h-5" />
                  {regulatoryAdvantages.confidentiality.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Public Disclosure</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.confidentiality.seeeDisclosure.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}30` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Confidentiality</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.confidentiality.nihaoBenefits.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{regulatoryAdvantages.confidentiality.valueBenefit}</span>
                </div>
              </div>

              {/* Reduced Scrutiny */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
                  <Shield className="w-5 h-5" />
                  {regulatoryAdvantages.reducedScrutiny.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Trading Scrutiny</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.reducedScrutiny.seeeScrutiny.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Trading Profile</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.reducedScrutiny.privateProfile.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{regulatoryAdvantages.reducedScrutiny.valueBenefit}</span>
                </div>
              </div>

              {/* Policy Protection */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
                  <Scale className="w-5 h-5" />
                  {regulatoryAdvantages.policyProtection.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Trading Risk</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.policyProtection.exchangeRisk.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Protection</h5>
                    <ul className="space-y-2">
                      {regulatoryAdvantages.policyProtection.privateDealProtection.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{regulatoryAdvantages.policyProtection.valueBenefit}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeAdvantageTab === 'operational' && (
            <motion.div
              key="operational"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Customization */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <Zap className="w-5 h-5" />
                  {operationalAdvantages.customization.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6 mb-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}10` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Constraints</h5>
                    <ul className="space-y-2">
                      {operationalAdvantages.customization.seeeConstraints.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.success}10` }}>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Flexibility</h5>
                    <div className="space-y-3">
                      {operationalAdvantages.customization.nihaoFlexibility.map((item, i) => (
                        <div key={i}>
                          <div className="font-medium text-sm" style={{ color: colors.textPrimary }}>{item.type}</div>
                          <div className="text-xs" style={{ color: colors.textMuted }}>{item.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{operationalAdvantages.customization.valueBenefit}</span>
                </div>
              </div>

              {/* Portfolio Consolidation */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
                  <Layers className="w-5 h-5" />
                  {operationalAdvantages.portfolioConsolidation.title}
                </h4>
                <div className="grid lg:grid-cols-3 gap-6 mb-4">
                  <div className="col-span-2">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}10` }}>
                        <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Reality</h5>
                        <ul className="space-y-2">
                          {operationalAdvantages.portfolioConsolidation.seeeReality.map((item, i) => (
                            <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.success}10` }}>
                        <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Consolidation</h5>
                        <ul className="space-y-2">
                          {operationalAdvantages.portfolioConsolidation.nihaoConsolidation.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                    <h5 className="font-semibold mb-2" style={{ color: colors.primaryLight }}>Example: {operationalAdvantages.portfolioConsolidation.example.volume}</h5>
                    <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                      <div style={{ color: colors.danger }}>SEEE: {operationalAdvantages.portfolioConsolidation.example.seeeRoute}</div>
                      <div style={{ color: colors.success }}>Private: {operationalAdvantages.portfolioConsolidation.example.privateRoute}</div>
                      <div className="font-bold" style={{ color: colors.success }}>Savings: {operationalAdvantages.portfolioConsolidation.example.savings}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counterparty Quality */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
                  <Users className="w-5 h-5" />
                  {operationalAdvantages.counterpartyQuality.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Market Risk</h5>
                    <ul className="space-y-2">
                      {operationalAdvantages.counterpartyQuality.seeeRisk.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Due Diligence</h5>
                    <ul className="space-y-2">
                      {operationalAdvantages.counterpartyQuality.nihaoDueDiligence.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{operationalAdvantages.counterpartyQuality.valueBenefit}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeAdvantageTab === 'strategic' && (
            <motion.div
              key="strategic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Positioning */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <TrendingUp className="w-5 h-5" />
                  {strategicAdvantages.positioning.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Profile Impact</h5>
                    <ul className="space-y-2">
                      {strategicAdvantages.positioning.seeeProfile.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Positioning</h5>
                    <ul className="space-y-2">
                      {strategicAdvantages.positioning.nihaoPositioning.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{strategicAdvantages.positioning.valueBenefit}</span>
                </div>
              </div>

              {/* Relationships */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
                  <Users className="w-5 h-5" />
                  {strategicAdvantages.relationships.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Market Structure</h5>
                    <ul className="space-y-2">
                      {strategicAdvantages.relationships.seeeStructure.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Relationship Model</h5>
                    <ul className="space-y-2">
                      {strategicAdvantages.relationships.nihaoRelationship.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{strategicAdvantages.relationships.valueBenefit}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeAdvantageTab === 'tax' && (
            <motion.div
              key="tax"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Tax Planning */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
                  <DollarSign className="w-5 h-5" />
                  {taxCurrencyOptimization.tax.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Domestic Trading</h5>
                    <ul className="space-y-2">
                      {taxCurrencyOptimization.tax.seeeTrading.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private International Structure</h5>
                    <ul className="space-y-2">
                      {taxCurrencyOptimization.tax.privateStructure.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <h5 className="font-semibold mb-2" style={{ color: colors.accent }}>Example Calculation</h5>
                  <div className="grid md:grid-cols-4 gap-4 text-sm" style={{ color: colors.textSecondary }}>
                    <div>Sales: {taxCurrencyOptimization.tax.example.sales}</div>
                    <div>Taxable: {taxCurrencyOptimization.tax.example.taxableMargin}</div>
                    <div>Chinese Tax: {taxCurrencyOptimization.tax.example.chineseTax}</div>
                    <div className="font-bold" style={{ color: colors.success }}>Savings: {taxCurrencyOptimization.tax.example.privateSavings}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{taxCurrencyOptimization.tax.valueBenefit}</span>
                </div>
              </div>

              {/* Currency */}
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
                  <Globe className="w-5 h-5" />
                  {taxCurrencyOptimization.currency.title}
                </h4>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>SEEE Market</h5>
                    <ul className="space-y-2">
                      {taxCurrencyOptimization.currency.seeeMarket.map((item, i) => (
                        <li key={i} className="text-sm" style={{ color: colors.textSecondary }}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Deal Options</h5>
                    <ul className="space-y-2">
                      {taxCurrencyOptimization.currency.privateOptions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <span style={{ color: colors.success }}>{taxCurrencyOptimization.currency.valueBenefit}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Part 3: Summary Table */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)` }}
          >
            3
          </div>
          <div>
            <h3 className="text-2xl font-bold">Summary of Private Deal Advantages by Entity Category</h3>
            <p style={{ color: colors.textSecondary }}>Comprehensive advantage breakdown</p>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: colors.bgCardHover }}>
                  <th className="p-4 text-left font-semibold" style={{ color: colors.textPrimary }}>Entity Category</th>
                  <th className="p-4 text-center font-semibold" style={{ color: colors.success }}>Price Premium</th>
                  <th className="p-4 text-center font-semibold" style={{ color: colors.primaryLight }}>Confidentiality</th>
                  <th className="p-4 text-center font-semibold" style={{ color: colors.accent }}>Regulatory</th>
                  <th className="p-4 text-center font-semibold" style={{ color: colors.secondaryLight }}>Structuring</th>
                  <th className="p-4 text-center font-semibold" style={{ color: colors.success }}>Total Advantage</th>
                </tr>
              </thead>
              <tbody>
                {advantageSummaryTable.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary }}>
                      {row.category}
                    </td>
                    <td className="p-4 text-center" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.success }}>
                      {row.pricePremium}
                    </td>
                    <td className="p-4 text-center" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.confidentiality}
                    </td>
                    <td className="p-4 text-center" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.regulatory}
                    </td>
                    <td className="p-4 text-center" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.structuring}
                    </td>
                    <td className="p-4 text-center font-bold" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.success }}>
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Annual Value Creation */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}` }}
        >
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.success }}>
            <TrendingUp className="w-5 h-5" />
            Aggregate Annual Value Creation Potential
          </h4>
          <div className="text-center mb-6">
            <div className="text-4xl font-extrabold" style={{ color: colors.success }}>¥135.5-1,333 billion</div>
            <div style={{ color: colors.textSecondary }}>Conservative estimate: ¥200-400 billion annually</div>
          </div>
          <p className="text-center" style={{ color: colors.textSecondary }}>
            This represents the total economic advantage available to CEA holders using private deal channels vs. exchange trading
          </p>
        </div>
      </section>

      {/* Part 4: Risk Mitigation */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.danger} 0%, ${colors.accent} 100%)` }}
          >
            4
          </div>
          <div>
            <h3 className="text-2xl font-bold">Risk Mitigation Through Private Deal Structure</h3>
            <p style={{ color: colors.textSecondary }}>Multi-level protections for counterparty and regulatory risk</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.primaryLight }}>
              <Shield className="w-5 h-5" />
              {riskMitigation.counterparty.title}
            </h4>
            <div className="space-y-4">
              {riskMitigation.counterparty.measures.map((measure, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <h5 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{measure.level}</h5>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{measure.details}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
              <Scale className="w-5 h-5" />
              {riskMitigation.regulatory.title}
            </h4>
            <ul className="space-y-3">
              {riskMitigation.regulatory.measures.map((measure, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                  <span style={{ color: colors.textSecondary }}>{measure}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Conclusion */}
      <section
        className="p-8 rounded-2xl text-center mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)`,
          border: `1px solid ${colors.danger}`,
        }}
      >
        <h3 className="text-2xl font-bold mb-4">Conclusion</h3>
        <p className="text-lg mb-6 max-w-4xl mx-auto" style={{ color: colors.textSecondary }}>
          The economic, regulatory, operational, and strategic advantages of private bilateral deals through Nihao Group significantly exceed the benefits of direct SEEE exchange trading for most non-EU CEA holders. The aggregate advantage ranges from <strong style={{ color: colors.textPrimary }}>8-25%</strong> depending on entity category, with particular benefits for financial trading companies (15-25%), export-focused manufacturers (12-18%), and conglomerate trading arms (12-20%).
        </p>
        <Link
          to="/onboarding/eua-holders"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${colors.secondaryLight} 0%, #8b5cf6 100%)` }}
        >
          Explore EUA Holder Advantages
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
        <Link
          to="/onboarding/about-nihao"
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: colors.textSecondary }}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to About Nihao
        </Link>
        <Link
          to="/onboarding/eua-holders"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${colors.secondaryLight} 0%, #8b5cf6 100%)` }}
        >
          Next: For EUA Holders
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </OnboardingLayout>
  );
}

// Add missing Layers icon import
import { Layers } from 'lucide-react';
