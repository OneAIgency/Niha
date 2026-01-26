import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Shield,
  Scale,
  Globe,
  Building2,
  Zap,
  Database,
  BarChart3,
  Target,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Users,
  Factory,
  Landmark,
  Cpu,
  Eye,
  Award,
  Gavel,
  Link2,
  Brain,
  ShieldCheck,
  MapPin,
  Building,
  BadgeCheck,
} from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding';

// =============================================================================
// Executive Summary Data
// =============================================================================

const executiveSummary = {
  intro: 'The placement of Italy Nihao Group Limited (HK) as an intermediary platform in the carbon trading ecosystem delivers transformative advantages to all stakeholders. Based on comprehensive analysis of 80+ authoritative sources, this research quantifies how a Hong Kong-based, multi-jurisdictional digital platform addresses critical market inefficiencies while creating unprecedented value.',
  marketContext: [
    { label: 'VCM 2025', value: '$1.6B', growth: 'Growing to $47.5B by 2035', cagr: '38% CAGR' },
    { label: 'EU ETS Annual', value: '€38B', detail: '€175B+ raised since 2013' },
    { label: 'Non-transparent Intermediaries', value: '90%', issue: true },
    { label: 'Transaction Cost Burden', value: '30-60%', issue: true },
  ],
};

// =============================================================================
// Section 1: Critical Market Inefficiencies
// =============================================================================

const marketInefficiencies = {
  intermediaryProblem: {
    title: 'The Intermediary Fee Extraction Problem',
    currentReality: [
      '90% of intermediaries don\'t disclose their fee structures',
      'Disclosed fees average 15.5%—likely a significant underestimate',
      'Some brokers resell credits for 3x or more the purchase price',
      '50-90% of total proceeds flow to intermediaries rather than project developers',
    ],
    nihaoSolution: [
      'Minimizing intermediary layers through direct buyer-seller matching',
      'Providing transparent, auditable transaction records that eliminate hidden markups',
      'Enabling standardized, publicly disclosed fee structures',
      'Delivering estimated cost savings of 10-75% compared to traditional channels',
    ],
  },
  transparencyCrisis: {
    title: 'Transparency and Price Discovery Crisis',
    intro: 'With over 200 project types creating extreme price opacity, buyers and sellers face price spreads exceeding $8 per metric ton for similar credits.',
    issues: [
      'Fragmented data sources prevent accurate price discovery',
      'Limited real-time information creates information asymmetries',
      'Sophisticated intermediaries exploit these asymmetries',
      'Over 200 project types create extreme price opacity',
    ],
    platformInnovation: [
      'Real-time pricing data across all credit categories',
      'Centralized marketplace aggregating diverse projects for comparison',
      'Public registry integration providing full traceability from issuance to retirement',
      'Standardized contract structures enhancing price comparability',
    ],
  },
  counterpartyRisk: {
    title: 'Counterparty and Settlement Risk',
    intro: 'Voluntary carbon markets face substantial counterparty risk that regulated markets largely avoid.',
    risks: [
      'Project failures from forest fires, political instability, or poor management',
      'Trust that projects genuinely deliver promised reductions',
      'Monitoring robustness concerns over project lifetime',
      'Permanence guarantees that must hold over decades',
    ],
    mitigation: [
      'Delivery versus Payment (DvP) settlement eliminating counterparty default risk',
      'Automated settlement systems ensuring atomic settlement',
      'Client account mechanisms protecting both parties during verification periods',
      'Professional clearing and settlement infrastructure comparable to major exchanges',
    ],
  },
};

// =============================================================================
// Section 2: Stakeholder-Specific Advantages
// =============================================================================

const stakeholderAdvantages = {
  buyers: {
    title: 'For Carbon Credit Buyers (Corporations & Compliance Entities)',
    costEfficiency: {
      title: 'Cost Efficiency: 30-75% Transaction Cost Reduction',
      context: '2,700+ companies have set science-based climate targets, a 65% increase from 2023. Currently, 40% of corporate buyers understand their emission reduction pathways through 2030, with 87% recognizing carbon dioxide removal (CDR) credits as vital to net-zero strategies.',
      benefits: [
        '15.5% to 75% reduction in transaction costs versus traditional intermediaries',
        'Elimination of hidden markup fees typically ranging 100-300%',
        'Automated processes reducing administrative overhead by 50-70%',
        'Access to wholesale pricing through aggregated liquidity',
      ],
      marketContext: 'The EU ETS demonstrates the power of efficient markets, with €3 billion daily spot trading and €30 billion daily futures contracts, creating the liquidity that enables efficient large-volume purchases at tight bid-ask spreads.',
    },
    qualityAssurance: {
      title: 'Enhanced Quality Assurance',
      context: '35% of credits retired in the first half of 2024 were rated BBB or above, compared to just 25% in 2022. There\'s been a 102% increase in carbon removal credit transactions year-over-year.',
      features: [
        'Integration with Core Carbon Principles (CCP) standards',
        'Automated additionality verification',
        'Integration with global carbon registries for verification',
        'Registry-based double-counting prevention',
        'Public registry tracking ensuring credit uniqueness',
      ],
    },
    multiJurisdictional: {
      title: 'Multi-Jurisdictional Access',
      features: [
        'Single access point for EU ETS, UK ETS, and voluntary markets',
        'Carbon Border Adjustment Mechanism (CBAM) mitigation through proper ETS linkage',
        'Hong Kong time zone enabling 24/7 global trading access',
        'Simplified compliance with multiple regulatory frameworks (EU, UK, Hong Kong, Luxembourg, Italy)',
      ],
      savings: 'A UK-EU link could generate up to €770 million in transaction cost savings by 2030, driven by greater liquidity and increased market depth.',
    },
  },
  developers: {
    title: 'For Project Developers and Credit Sellers',
    revenueOptimization: {
      title: 'Revenue Optimization: 70% vs. 30% Retention',
      context: 'Traditional intermediary models extract extreme value from project developers. Research indicates developers retain only 10-50% of final credit sale prices.',
      transformation: [
        '70% of revenue retained by project owners versus 30% in traditional channels',
        'Elimination of multi-layered intermediary markup extraction',
        'Transparent pricing enabling better negotiation leverage',
        'Near-real-time issuances providing earlier cash flow',
        'Pre-issuance financing options supporting project development',
      ],
      marketGrowth: 'The VCM must scale 15-fold by 2030 to meet Paris Agreement goals. The removal credit market grew 50% in 2023.',
    },
    marketAccess: {
      title: 'Expanded Market Access',
      features: [
        'Access to international buyer pools across EU, UK, Asia-Pacific, and Americas',
        'Hong Kong positioning as bridge to China\'s 5 billion tonne ETS market (world\'s largest)',
        'Connection to creditworthy institutional buyers',
        'Reduced dependency on individual broker relationships',
      ],
      growth: 'Asia-Pacific\'s VCM is projected to grow at a 36%+ compound annual growth rate.',
    },
    technicalSupport: {
      title: 'Technical Support and Acceleration',
      capabilities: [
        'Improved data quality and increased accuracy',
        'Reduced verification timelines by 50-70%',
        'Automated certification document processing',
        'AI-powered project quality scoring algorithms',
        'Real-time verification through registry integration',
      ],
      timeAdvantage: 'Low-code digital platforms can be operational in 4 months versus 2-3 years for traditional solutions.',
    },
  },
  institutions: {
    title: 'For Financial Institutions and Investors',
    liquidity: {
      title: 'Market Liquidity and Investment Scale',
      stats: [
        'EU ETS: €38 billion annual auction revenue (2022), up from €14 billion in 2019',
        'VCM projections: $7-35 billion by 2030, potentially $45-250 billion by 2050',
        'Daily trading volumes: €33 billion combined spot and futures in EU ETS',
      ],
    },
    investmentDrivers: [
      '87% of corporate buyers recognize carbon credits in net-zero strategies',
      '2,700+ companies with science-based targets requiring credit purchases',
      'Aviation sector entering mandatory CORSIA compliance phase in 2027',
      'Nature-based solutions accounting for nearly 50% of VCM demand',
    ],
    riskManagement: {
      title: 'Risk Management Infrastructure',
      tools: [
        'Futures and options contracts for price hedging',
        'Forward contracting for long-term position management',
        'Portfolio diversification across project types and geographies',
        'Carbon-themed ETF development opportunities',
        'Professional clearing houses (ECC, ICE Clear) for secure trading',
      ],
      stability: 'Increased market participation reduces volatility. Individual investors and diverse financial players employing buy-and-hold strategies contribute to long-term price appreciation.',
    },
  },
  regulators: {
    title: 'For Regulatory Entities and Compliance Markets',
    euMar: {
      title: 'EU Market Abuse Regulation (MAR) Compliance',
      features: [
        'Automated transaction reporting to National Competent Authorities',
        'Real-time position reporting for emission allowances',
        'Suspicious transaction detection and notification',
        'ESMA coordination for cross-border enforcement',
      ],
    },
    aml: {
      title: 'Anti-Money Laundering (AML) and KYC',
      features: [
        'Customer due diligence automation',
        'Beneficial ownership verification',
        'Ongoing transaction monitoring',
        'Sanctions list screening (EU, UN, OFAC)',
      ],
    },
    dataProtection: {
      title: 'Data Protection (GDPR)',
      features: [
        'GDPR compliance for EU participants',
        'Technical and organizational security measures',
        'Data subject rights protection',
        'Cross-border transfer safeguards',
      ],
    },
    integrity: {
      title: 'Market Integrity Enhancement',
      transparency: [
        'Secure transaction records preventing fraud',
        'Double-counting prevention through registry verification',
        'Real-time audit trails for regulatory review',
        'Automated verification of corresponding adjustments under Article 6',
      ],
      standards: 'Integration with Core Carbon Principles (CCP), VCMI Claims Codes of Practice, ICVCM Ten Core Carbon Principles, GHG Protocol accounting standards, and Science Based Targets initiative (SBTi) validation.',
    },
  },
};

// =============================================================================
// Section 3: Hong Kong Strategic Positioning
// =============================================================================

const hongKongPosition = {
  geographic: {
    title: 'Geographic and Financial Center Benefits',
    tradingAccess: [
      'Time zone bridges Asian and European markets',
      'Overlapping trading hours with both regions maximize liquidity',
      'Proximity to China\'s 5 billion tonne ETS (world\'s largest carbon market)',
      'International financial center infrastructure with mature regulatory frameworks',
    ],
    marketGrowth: 'Hong Kong\'s voluntary carbon market is expected to expand from $723 million to $10-40 billion by 2030.',
  },
  oneCountryTwoSystems: {
    title: '"One Country, Two Systems" Advantage',
    bridge: [
      'Facilitates internationalization of China Certified Emission Reductions (CCERs)',
      'Separate legal and regulatory system from Mainland China',
      'International recognition and trust from global counterparties',
      'Established arbitration frameworks (HKIAC) accepted worldwide',
    ],
    integration: [
      'HKEX Core Climate platform launched in 2022',
      'Memorandum of Understanding with Guangzhou Futures Exchange',
      'Green certification services familiar with both Mainland and international standards',
      'Cross-boundary carbon data exchange capabilities',
    ],
  },
  policySupport: {
    title: 'Policy and Ecosystem Support',
    government: [
      'Financial Services Development Council (FSDC) actively advocates for carbon market development',
      'Carbon Market Workstream co-chaired by Securities and Futures Commission (SFC) and HKEX',
      'Environment Bureau (ENB), Financial Services and Treasury Bureau (FSTB), and Hong Kong Monetary Authority (HKMA) coordination',
    ],
    objectives: 'Hong Kong aims to position itself as the premier carbon trading hub for Asia-Pacific, capturing regional carbon trading activity while supporting China\'s Nationally Determined Contributions (NDC) under the Paris Agreement and facilitating international climate finance flows.',
  },
};

// =============================================================================
// Section 4: Technology Infrastructure
// =============================================================================

const technologyInfrastructure = {
  digitalPlatform: {
    title: 'Advanced Digital Platform Technology',
    coreTransformation: [
      'Secure transaction records preventing fraud and manipulation',
      'Transparent audit trails accessible to all stakeholders',
      'Double-counting prevention through integrated registry verification',
      'Process automation eliminating human error',
      'Professional custody model ensuring security and reliability',
    ],
    operationalAdvantages: [
      'Real-time settlement versus T+2 or T+3 in traditional systems',
      'Atomic transactions ensuring delivery and payment occur simultaneously',
      'Flexible transaction sizing enabling smaller transactions',
      'Cross-border settlement without correspondent banking delays',
      'Automated compliance embedded directly in platform workflows',
    ],
  },
  ai: {
    title: 'Artificial Intelligence and Machine Learning',
    qualityAssessment: [
      'Automated project quality scoring across environmental impact, economic viability, and regulatory compliance',
      'Real-time environmental impact analysis',
      'Fraud detection and anomaly identification',
    ],
    marketIntelligence: [
      'Predictive analytics for carbon credit price trends',
      'Supply-demand forecasting',
      'Optimal trade execution timing',
      'Portfolio risk analysis',
      'AI-powered buyer-seller matching optimization',
    ],
  },
};

// =============================================================================
// Section 5: Economic Value Quantification
// =============================================================================

const economicValue = {
  buyerSavings: [
    { category: 'Intermediary Fees', traditional: '15.5% - 90%', nihao: '3% - 10%', savings: '12.5% - 80%' },
    { category: 'Transaction Processing', traditional: '$5 - $15 per credit', nihao: '$0.50 - $3', savings: '70% - 90%' },
    { category: 'Verification Costs', traditional: '30-60% of income', nihao: '10-20%', savings: '50% - 67%' },
    { category: 'Administrative Overhead', traditional: 'High (manual)', nihao: 'Low (automated)', savings: '50% - 70%' },
    { category: 'Total Estimated Savings', traditional: '—', nihao: '—', savings: '30% - 75%', isTotal: true },
  ],
  developerSavings: [
    { category: 'Revenue Retained', traditional: '10% - 50%', nihao: '60% - 90%', improvement: '+20% to +80%' },
    { category: 'Time to Market', traditional: '18-36 months', nihao: '4-12 months', improvement: '70% faster' },
    { category: 'Verification Cost', traditional: 'High', nihao: 'Low (automated)', improvement: '50% - 70%' },
    { category: 'Buyer Access', traditional: 'Limited', nihao: 'Global', improvement: '10x - 100x' },
  ],
  institutionalValue: [
    { category: 'Portfolio Risk Reduction', traditional: 'High volatility exposure', nihao: 'Hedging tools + diversification', improvement: '40% - 60% risk reduction' },
    { category: 'Market Access Cost', traditional: 'Multiple platform fees', nihao: 'Single unified platform', improvement: '50% - 70% cost reduction' },
    { category: 'Due Diligence Time', traditional: '4-8 weeks per project', nihao: '1-2 weeks (AI-assisted)', improvement: '70% - 85% faster' },
    { category: 'Settlement Risk', traditional: 'T+2 to T+5 exposure', nihao: 'Real-time DvP settlement', improvement: '100% elimination' },
    { category: 'Market Depth Access', traditional: 'Fragmented liquidity', nihao: '€33B daily EU ETS access', improvement: '10x - 100x liquidity' },
    { category: 'Compliance Reporting', traditional: 'Manual compilation', nihao: 'Automated reporting', improvement: '60% - 80% effort reduction' },
  ],
  regulatorValue: [
    { category: 'Market Surveillance Efficiency', traditional: 'Manual oversight', nihao: 'Real-time automated monitoring', improvement: '70% - 90% efficiency gain' },
    { category: 'Audit Trail Completeness', traditional: '60% - 70% visibility', nihao: '100% transparent records', improvement: '100% audit coverage' },
    { category: 'Double-Counting Detection', traditional: 'Post-hoc discovery', nihao: 'Real-time prevention', improvement: '100% prevention rate' },
    { category: 'Cross-Border Coordination', traditional: 'Bilateral negotiations', nihao: 'Standardized API reporting', improvement: '80% faster coordination' },
    { category: 'Compliance Violation Detection', traditional: 'Weeks to months', nihao: 'Real-time alerts', improvement: '95% faster detection' },
    { category: 'Market Integrity Score', traditional: 'Low confidence', nihao: 'High integrity assurance', improvement: 'Qualitative improvement' },
  ],
  marketProjections: {
    vcm: [
      { year: '2025', value: '$1.6 - $4.04 billion' },
      { year: '2030', value: '$7 - $35 billion' },
      { year: '2035', value: '$23.99 - $47.5 billion' },
      { year: '2050', value: '$45 - $250 billion' },
    ],
    euEts: [
      { metric: 'Current annual volume', value: '€38 billion (2022)' },
      { metric: 'Total raised since 2013', value: '€175+ billion' },
      { metric: 'Daily trading volume', value: '€33 billion (spot + futures)' },
    ],
  },
};

// =============================================================================
// Section 6: Competitive Positioning
// =============================================================================

const platformBenefits = {
  vsBrokers: {
    title: 'Compared to Traditional Brokers',
    challenges: [
      'Opaque fee structures (90% non-transparent)',
      'High markups on transactions',
      'Limited geographic market access',
      'Manual, inefficient processes',
      'Single-jurisdiction regulatory focus',
      'Counterparty risk exposure',
    ],
    benefits: [
      'Transparent, fixed-fee structure with public disclosure',
      'Minimal markup through direct buyer-seller matching',
      'Global market access (EU, UK, Hong Kong, China bridge)',
      'Fully automated digital processes',
      'Multi-jurisdictional regulatory compliance',
      'DvP settlement eliminating counterparty risk',
    ],
  },
  vsExchanges: {
    title: 'Compared to Exchange Platforms',
    challenges: [
      'Primarily compliance market oriented',
      'Limited voluntary market integration',
      'High institutional barriers to entry',
      'Single regulatory jurisdiction',
      'Traditional financial infrastructure',
    ],
    benefits: [
      'Integrated compliance AND voluntary markets on single platform',
      'Low barriers enabling SME and individual participation',
      'Multi-jurisdictional regulatory compliance built-in',
      'Hong Kong strategic positioning as Asia-EU-Americas bridge',
      'Next-generation infrastructure (advanced digital platform, AI)',
    ],
  },
  vsRegistries: {
    title: 'Compared to Registry Platforms',
    challenges: [
      'Registry and certification focus only',
      'Limited or no trading functionality',
      'No professional settlement services',
      'Absence of price discovery mechanisms',
      'Single standard focus',
    ],
    benefits: [
      'Complete ecosystem (registry integration + trading + settlement)',
      'Professional trading platform with deep liquidity',
      'DvP settlement infrastructure',
      'Real-time price discovery and benchmarking',
      'Multi-standard compatibility (Verra, Gold Standard, CCB, CDM, etc.)',
    ],
  },
};

// =============================================================================
// Section 7: Risk Management and Legal Framework
// =============================================================================

const riskAndLegal = {
  penaltyProvision: {
    title: 'EUR 10 Million Penalty Provision',
    intro: 'The EUR 10,000,000 liquidated damages provision serves critical strategic functions:',
    deterrent: [
      'Protects against material breaches including unauthorized disclosure, intellectual property theft, and competitive misuse',
      'Compensates for difficult-to-quantify damages (reputational harm, competitive intelligence loss, market position erosion)',
      'Safeguards proprietary algorithms, pricing methodologies, and participant data',
      'Enforceable across multiple jurisdictions (Hong Kong, UK, EU, Luxembourg, Italy)',
    ],
    breachCategories: [
      'Unauthorized disclosure of confidential platform information',
      'Reverse engineering of proprietary trading technology',
      'Competitive use of platform market intelligence',
      'Sublicensing or unauthorized access transfer to third parties',
      'Any breach causing commercial, reputational, or operational harm to Nihao',
    ],
  },
  legalArchitecture: {
    title: 'Multi-Jurisdictional Legal Architecture',
    governingLaw: [
      'EU/Luxembourg/Italy entities: Governed by the entity\'s member state law',
      'UK entities: Laws of England and Wales',
      'Hong Kong entities: Laws of Hong Kong',
      'Explicit exclusion of UN Convention on International Sale of Goods (CISG)',
      'Conflict of law principles excluded for certainty',
    ],
    disputeResolution: [
      'EU/UK/Luxembourg entities: ICC Rules, London seat (or member state by mutual agreement)',
      'Hong Kong entities: HKIAC Rules, Hong Kong seat',
      'All arbitrations conducted in English',
      '30-day good-faith negotiation period before arbitration',
      'Right to seek preliminary injunctive relief preserved in competent courts',
    ],
  },
  complianceInfrastructure: {
    title: 'Regulatory Compliance Infrastructure',
    regulations: [
      'EU Market Abuse Regulation (MAR) transaction and position reporting',
      'Anti-Money Laundering (AML) customer due diligence and ongoing monitoring',
      'GDPR data protection compliance for EU participants',
      'Corporate Sustainability Reporting Directive (CSRD) integration',
      'SEC climate disclosure rules support where material',
    ],
  },
};

// =============================================================================
// Conclusion Data (Client-Facing Benefits Summary)
// =============================================================================

const conclusion = {
  intro: 'The strategic placement of Italy Nihao Group Limited (HK) as a carbon trading intermediary platform delivers quantifiable, transformative advantages across the entire ecosystem:',
  buyers: [
    '30-75% transaction cost reduction through transparent, automated processes',
    '24/7 global market access via Hong Kong positioning',
    'Zero counterparty risk through DvP settlement',
    'Multi-jurisdictional compliance (EU, UK, Hong Kong, China)',
  ],
  developers: [
    '70% revenue retention vs. 30% traditional model',
    '70% faster time-to-market (4-12 months vs. 18-36 months)',
    '10x to 100x expanded buyer access globally',
    '50-70% reduction in verification costs',
  ],
  institutions: [
    '€33 billion daily trading volume access in EU ETS',
    '34.6% CAGR growth in voluntary carbon markets',
    '$250 billion market potential by 2050',
    'Professional risk management infrastructure (clearing, settlement, derivatives)',
  ],
  regulators: [
    '100% transparent audit trails via secure digital platform',
    'Automated compliance with MAR, AML, GDPR',
    'Real-time market surveillance capabilities',
    'Cross-border coordination through standardized reporting',
  ],
  hkAdvantages: [
    'Bridge between China\'s 5 billion tonne ETS and international markets',
    '"One country, Two systems" regulatory flexibility',
    '24/7 time zone coverage for global trading',
    'Mature financial infrastructure with international credibility',
  ],
  technology: [
    { name: 'Digital Platform', desc: 'Transparency eliminating hidden fees and double-counting' },
    { name: 'AI/ML', desc: 'Automated quality assessment and optimal execution' },
    { name: 'Cloud', desc: '99.9% uptime and global accessibility' },
  ],
  finalStatement: 'Nihao addresses the carbon market\'s fundamental inefficiencies—opaque pricing, excessive intermediary fees, counterparty risk, and market fragmentation—while creating substantial value for all participants through Hong Kong strategic positioning, advanced technology infrastructure, and comprehensive multi-jurisdictional compliance.',
};

// =============================================================================
// Tab Configuration
// =============================================================================

const tabs = [
  { id: 0, label: 'Inefficiencies', icon: AlertTriangle },
  { id: 1, label: 'Stakeholders', icon: Users },
  { id: 2, label: 'Hong Kong', icon: Globe },
  { id: 3, label: 'Technology', icon: Cpu },
  { id: 4, label: 'Economics', icon: DollarSign },
  { id: 5, label: 'Benefits', icon: Target },
  { id: 6, label: 'Risk/Legal', icon: Gavel },
  { id: 7, label: 'Summary', icon: CheckCircle },
];

// =============================================================================
// Section Components
// =============================================================================

const MarketInefficienciesSection = () => (
  <div className="space-y-8">
    {/* Intermediary Problem */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 rounded-xl border-2 border-red-500 bg-red-500/10">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Current Reality: {marketInefficiencies.intermediaryProblem.title}
        </h4>
        <ul className="space-y-3">
          {marketInefficiencies.intermediaryProblem.currentReality.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-navy-600 dark:text-navy-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 rounded-xl border-2 border-emerald-500 bg-emerald-500/10">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <CheckCircle className="w-5 h-5" />
          Nihao Platform Solution
        </h4>
        <ul className="space-y-3">
          {marketInefficiencies.intermediaryProblem.nihaoSolution.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-navy-600 dark:text-navy-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Transparency Crisis */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
        <Eye className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        {marketInefficiencies.transparencyCrisis.title}
      </h4>
      <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
        {marketInefficiencies.transparencyCrisis.intro}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Issues:</h5>
          <ul className="space-y-2">
            {marketInefficiencies.transparencyCrisis.issues.map((item, idx) => (
              <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Platform Innovation:</h5>
          <ul className="space-y-2">
            {marketInefficiencies.transparencyCrisis.platformInnovation.map((item, idx) => (
              <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Counterparty Risk */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
        <Shield className="w-5 h-5 text-violet-500" />
        {marketInefficiencies.counterpartyRisk.title}
      </h4>
      <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
        {marketInefficiencies.counterpartyRisk.intro}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-red-500">
          <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">VCM Risks:</h5>
          <ul className="space-y-2">
            {marketInefficiencies.counterpartyRisk.risks.map((item, idx) => (
              <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-emerald-500">
          <h5 className="font-semibold mb-3 text-emerald-500">Risk Mitigation Infrastructure:</h5>
          <ul className="space-y-2">
            {marketInefficiencies.counterpartyRisk.mitigation.map((item, idx) => (
              <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const StakeholderBenefitsSection = () => {
  const [activeStakeholder, setActiveStakeholder] = useState('buyers');

  const stakeholders = [
    { id: 'buyers', label: 'Buyers', icon: Building2 },
    { id: 'developers', label: 'Developers', icon: Factory },
    { id: 'institutions', label: 'Institutions', icon: Landmark },
    { id: 'regulators', label: 'Regulators', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Stakeholder Tabs */}
      <div className="flex flex-wrap gap-2">
        {stakeholders.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStakeholder(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeStakeholder === s.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-navy-800 text-navy-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStakeholder}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeStakeholder === 'buyers' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">
                {stakeholderAdvantages.buyers.title}
              </h3>

              {/* Cost Efficiency */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                  {stakeholderAdvantages.buyers.costEfficiency.title}
                </h4>
                <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
                  {stakeholderAdvantages.buyers.costEfficiency.context}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-navy-800">
                    <h5 className="font-semibold mb-2 text-emerald-500">Quantified Benefits:</h5>
                    <ul className="space-y-2">
                      {stakeholderAdvantages.buyers.costEfficiency.benefits.map((b, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-navy-800">
                    <h5 className="font-semibold mb-2 text-blue-500 dark:text-blue-400">Market Context:</h5>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      {stakeholderAdvantages.buyers.costEfficiency.marketContext}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quality Assurance */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <BadgeCheck className="w-5 h-5" />
                  {stakeholderAdvantages.buyers.qualityAssurance.title}
                </h4>
                <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
                  {stakeholderAdvantages.buyers.qualityAssurance.context}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stakeholderAdvantages.buyers.qualityAssurance.features.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg text-center text-sm bg-navy-800 text-navy-600 dark:text-navy-400">
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Jurisdictional */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                  <Globe className="w-5 h-5" />
                  {stakeholderAdvantages.buyers.multiJurisdictional.title}
                </h4>
                <ul className="space-y-2 mb-4">
                  {stakeholderAdvantages.buyers.multiJurisdictional.features.map((f, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="p-4 rounded-lg bg-emerald-500">
                  <p className="text-sm text-white font-medium">
                    {stakeholderAdvantages.buyers.multiJurisdictional.savings}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStakeholder === 'developers' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">
                {stakeholderAdvantages.developers.title}
              </h3>

              {/* Revenue Optimization */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <TrendingUp className="w-5 h-5" />
                  {stakeholderAdvantages.developers.revenueOptimization.title}
                </h4>
                <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
                  {stakeholderAdvantages.developers.revenueOptimization.context}
                </p>
                <ul className="space-y-2 mb-4">
                  {stakeholderAdvantages.developers.revenueOptimization.transformation.map((t, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="p-3 rounded-lg bg-violet-500">
                  <p className="text-sm text-white font-medium">
                    {stakeholderAdvantages.developers.revenueOptimization.marketGrowth}
                  </p>
                </div>
              </div>

              {/* Market Access */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <Globe className="w-5 h-5" />
                  {stakeholderAdvantages.developers.marketAccess.title}
                </h4>
                <ul className="space-y-2 mb-4">
                  {stakeholderAdvantages.developers.marketAccess.features.map((f, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-violet-500">
                  {stakeholderAdvantages.developers.marketAccess.growth}
                </p>
              </div>

              {/* Technical Support */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                  <Cpu className="w-5 h-5" />
                  {stakeholderAdvantages.developers.technicalSupport.title}
                </h4>
                <p className="text-sm mb-2 text-navy-500 dark:text-navy-500">Digital MRV Capabilities:</p>
                <ul className="space-y-2 mb-4">
                  {stakeholderAdvantages.developers.technicalSupport.capabilities.map((c, i) => (
                    <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {c}</li>
                  ))}
                </ul>
                <div className="p-3 rounded-lg bg-emerald-500">
                  <p className="text-sm text-white font-medium">
                    Time-to-Market Advantage: {stakeholderAdvantages.developers.technicalSupport.timeAdvantage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStakeholder === 'institutions' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">
                {stakeholderAdvantages.institutions.title}
              </h3>

              {/* Liquidity */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <BarChart3 className="w-5 h-5" />
                  {stakeholderAdvantages.institutions.liquidity.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stakeholderAdvantages.institutions.liquidity.stats.map((s, i) => (
                    <div key={i} className="p-4 rounded-lg text-center bg-navy-800">
                      <p className="text-sm text-navy-600 dark:text-navy-400">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment Drivers */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 text-emerald-500">Investment Thesis Drivers:</h4>
                <ul className="space-y-2">
                  {stakeholderAdvantages.institutions.investmentDrivers.map((d, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                      <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Management */}
              <div className="p-6 rounded-xl bg-navy-700">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                  <Shield className="w-5 h-5" />
                  {stakeholderAdvantages.institutions.riskManagement.title}
                </h4>
                <ul className="space-y-2 mb-4">
                  {stakeholderAdvantages.institutions.riskManagement.tools.map((t, i) => (
                    <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {t}</li>
                  ))}
                </ul>
                <p className="text-sm text-navy-500 dark:text-navy-500">
                  {stakeholderAdvantages.institutions.riskManagement.stability}
                </p>
              </div>
            </div>
          )}

          {activeStakeholder === 'regulators' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">
                {stakeholderAdvantages.regulators.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EU MAR */}
                <div className="p-4 rounded-xl bg-navy-700">
                  <h4 className="font-bold mb-3 text-emerald-500">
                    {stakeholderAdvantages.regulators.euMar.title}
                  </h4>
                  <ul className="space-y-2">
                    {stakeholderAdvantages.regulators.euMar.features.map((f, i) => (
                      <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {f}</li>
                    ))}
                  </ul>
                </div>

                {/* AML */}
                <div className="p-4 rounded-xl bg-navy-700">
                  <h4 className="font-bold mb-3 text-blue-500 dark:text-blue-400">
                    {stakeholderAdvantages.regulators.aml.title}
                  </h4>
                  <ul className="space-y-2">
                    {stakeholderAdvantages.regulators.aml.features.map((f, i) => (
                      <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Data Protection */}
                <div className="p-4 rounded-xl bg-navy-700">
                  <h4 className="font-bold mb-3 text-violet-500">
                    {stakeholderAdvantages.regulators.dataProtection.title}
                  </h4>
                  <ul className="space-y-2">
                    {stakeholderAdvantages.regulators.dataProtection.features.map((f, i) => (
                      <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Integrity */}
                <div className="p-4 rounded-xl bg-navy-700">
                  <h4 className="font-bold mb-3 text-emerald-500">
                    {stakeholderAdvantages.regulators.integrity.title}
                  </h4>
                  <ul className="space-y-2">
                    {stakeholderAdvantages.regulators.integrity.transparency.map((b, i) => (
                      <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-navy-800">
                <h5 className="font-semibold mb-2 text-white">Standards Alignment:</h5>
                <p className="text-sm text-navy-600 dark:text-navy-400">
                  {stakeholderAdvantages.regulators.integrity.standards}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const HongKongPositionSection = () => (
  <div className="space-y-8">
    {/* Geographic Benefits */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
        <MapPin className="w-5 h-5" />
        {hongKongPosition.geographic.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">24/7 Global Trading Access:</h5>
          <ul className="space-y-2">
            {hongKongPosition.geographic.tradingAccess.map((t, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <Globe className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500">
          <h5 className="font-semibold mb-2 text-white">Market Growth Trajectory:</h5>
          <p className="text-sm text-white opacity-90">
            {hongKongPosition.geographic.marketGrowth}
          </p>
        </div>
      </div>
    </div>

    {/* One Country Two Systems */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-violet-500">
        <Link2 className="w-5 h-5" />
        {hongKongPosition.oneCountryTwoSystems.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">China-International Bridge Function:</h5>
          <ul className="space-y-2">
            {hongKongPosition.oneCountryTwoSystems.bridge.map((b, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {b}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Market Integration Infrastructure:</h5>
          <ul className="space-y-2">
            {hongKongPosition.oneCountryTwoSystems.integration.map((i, idx) => (
              <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {i}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Policy Support */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
        <Building className="w-5 h-5" />
        {hongKongPosition.policySupport.title}
      </h4>
      <div className="p-4 rounded-lg mb-4 bg-navy-800">
        <h5 className="font-semibold mb-3 text-emerald-500">Government-Led Initiatives:</h5>
        <ul className="space-y-2">
          {hongKongPosition.policySupport.government.map((g, i) => (
            <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {g}</li>
          ))}
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-emerald-500">
        <h5 className="font-semibold mb-2 text-white">Strategic Objectives:</h5>
        <p className="text-sm text-white opacity-90">
          {hongKongPosition.policySupport.objectives}
        </p>
      </div>
    </div>
  </div>
);

const TechnologyPlatformSection = () => (
  <div className="space-y-8">
    {/* Digital Platform */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
        <Database className="w-5 h-5" />
        {technologyInfrastructure.digitalPlatform.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Core Transformation:</h5>
          <ul className="space-y-2">
            {technologyInfrastructure.digitalPlatform.coreTransformation.map((c, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Operational Advantages:</h5>
          <ul className="space-y-2">
            {technologyInfrastructure.digitalPlatform.operationalAdvantages.map((o, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-500" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* AI/ML */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
        <Brain className="w-5 h-5" />
        {technologyInfrastructure.ai.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Quality Assessment Innovation:</h5>
          <ul className="space-y-2">
            {technologyInfrastructure.ai.qualityAssessment.map((q, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {q}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Market Intelligence:</h5>
          <ul className="space-y-2">
            {technologyInfrastructure.ai.marketIntelligence.map((m, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {m}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const EconomicValueSection = () => (
  <div className="space-y-8">
    {/* Buyer Savings Table */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
        <Building2 className="w-5 h-5" />
        Cost Savings Analysis: For Buyers
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800">
              <th className="px-4 py-3 text-left text-white">Cost Category</th>
              <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
              <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
              <th className="px-4 py-3 text-center text-emerald-500">Savings</th>
            </tr>
          </thead>
          <tbody>
            {economicValue.buyerSavings.map((row, i) => (
              <tr
                key={i}
                className={row.isTotal ? 'bg-emerald-500' : i % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700'}
              >
                <td className={`px-4 py-3 ${row.isTotal ? 'font-bold text-white' : 'text-navy-900 dark:text-white'}`}>
                  {row.category}
                </td>
                <td className={`px-4 py-3 text-center ${row.isTotal ? "text-white" : "text-navy-600 dark:text-navy-400"}`}>
                  {row.traditional}
                </td>
                <td className={`px-4 py-3 text-center ${row.isTotal ? "text-white" : "text-navy-600 dark:text-navy-400"}`}>
                  {row.nihao}
                </td>
                <td className={`px-4 py-3 text-center font-bold ${row.isTotal ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {row.savings}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Developer Savings Table */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
        <Factory className="w-5 h-5" />
        Cost Savings Analysis: For Project Developers
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800">
              <th className="px-4 py-3 text-left text-white">Revenue Category</th>
              <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional</th>
              <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
              <th className="px-4 py-3 text-center text-emerald-500">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {economicValue.developerSavings.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                <td className="px-4 py-3 text-white">{row.category}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Institutional Investors Value Table */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
        <Landmark className="w-5 h-5" />
        Value Analysis: For Institutional Investors & Financial Institutions
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800">
              <th className="px-4 py-3 text-left text-white">Value Category</th>
              <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
              <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
              <th className="px-4 py-3 text-center text-emerald-500">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {economicValue.institutionalValue.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                <td className="px-4 py-3 text-white">{row.category}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Regulators & Standards Bodies Value Table */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-violet-500">
        <Shield className="w-5 h-5" />
        Value Analysis: For Regulators & Standards Bodies
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800">
              <th className="px-4 py-3 text-left text-white">Oversight Category</th>
              <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
              <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
              <th className="px-4 py-3 text-center text-emerald-500">Efficiency Gain</th>
            </tr>
          </thead>
          <tbody>
            {economicValue.regulatorValue.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                <td className="px-4 py-3 text-white">{row.category}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Market Projections */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-navy-700">
        <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
          <TrendingUp className="w-4 h-4" />
          VCM Projections
        </h5>
        {economicValue.marketProjections.vcm.map((v, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
            <span className="text-sm text-navy-500 dark:text-navy-500">{v.year}</span>
            <span className="text-sm font-medium text-emerald-500">{v.value}</span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-navy-700">
        <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <BarChart3 className="w-4 h-4" />
          EU ETS Market Size
        </h5>
        {economicValue.marketProjections.euEts.map((e, i) => (
          <div key={i} className="py-2 border-b border-navy-200 dark:border-navy-600">
            <span className="text-xs text-navy-500 dark:text-navy-500">{e.metric}</span>
            <div className="text-sm font-medium text-emerald-500">{e.value}</div>
          </div>
        ))}
      </div>

    </div>
  </div>
);

const CompetitiveEdgeSection = () => (
  <div className="space-y-8">
    {/* vs Brokers */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 text-white">
        {platformBenefits.vsBrokers.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border-2 border-red-500">
          <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsBrokers.challenges.map((l, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border-2 border-emerald-500">
          <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsBrokers.benefits.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* vs Exchanges */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 text-white">
        {platformBenefits.vsExchanges.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border-2 border-red-500">
          <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsExchanges.challenges.map((l, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border-2 border-emerald-500">
          <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsExchanges.benefits.map((a, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* vs Registries */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 text-white">
        {platformBenefits.vsRegistries.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border-2 border-red-500">
          <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsRegistries.challenges.map((l, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border-2 border-emerald-500">
          <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
          <ul className="space-y-2">
            {platformBenefits.vsRegistries.benefits.map((a, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const RiskLegalSection = () => (
  <div className="space-y-8">
    {/* EUR 10M Penalty */}
    <div className="p-6 rounded-xl border-2 border-2 border-red-500 bg-red-500/10">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
        <Gavel className="w-5 h-5" />
        {riskAndLegal.penaltyProvision.title}
      </h4>
      <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
        {riskAndLegal.penaltyProvision.intro}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Deterrent Effect:</h5>
          <ul className="space-y-2">
            {riskAndLegal.penaltyProvision.deterrent.map((d, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {d}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Breach Categories Covered:</h5>
          <ol className="space-y-2">
            {riskAndLegal.penaltyProvision.breachCategories.map((b, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">{i + 1}. {b}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>

    {/* Legal Architecture */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
        <Scale className="w-5 h-5" />
        {riskAndLegal.legalArchitecture.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Tailored Governing Law:</h5>
          <ul className="space-y-2">
            {riskAndLegal.legalArchitecture.governingLaw.map((g, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {g}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Dispute Resolution Framework:</h5>
          <ul className="space-y-2">
            {riskAndLegal.legalArchitecture.disputeResolution.map((d, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Compliance Infrastructure */}
    <div className="p-6 rounded-xl bg-navy-700">
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
        <ShieldCheck className="w-5 h-5" />
        {riskAndLegal.complianceInfrastructure.title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {riskAndLegal.complianceInfrastructure.regulations.map((r, i) => (
          <div key={i} className="p-3 rounded-lg flex items-start gap-2 bg-navy-800">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <span className="text-sm text-navy-600 dark:text-navy-400">{r}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// =============================================================================
// Main Page Component
// =============================================================================

export default function StrategicAdvantagePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <OnboardingLayout
      title="Strategic Advantages"
      subtitle="Nihao Privileged Services in Carbon Trading"
    >
      {/* Executive Summary */}
      <section className="mb-12">
        <div
          className="rounded-2xl p-8 bg-gradient-to-br from-violet-500/15 to-blue-500/15 border border-blue-400"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Executive Summary</h3>
          </div>
          <p className="text-sm mb-6 text-navy-600 dark:text-navy-400">
            {executiveSummary.intro}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {executiveSummary.marketContext.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-center ${
                  item.issue
                    ? 'bg-red-500/20 border border-red-500'
                    : 'bg-navy-800 border border-navy-600'
                }`}
              >
                <div className={`text-2xl font-bold mb-1 ${item.issue ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {item.value}
                </div>
                <div className="text-xs text-navy-500 dark:text-navy-500">{item.label}</div>
                {item.growth && <div className="text-xs mt-1 text-violet-500">{item.growth}</div>}
                {item.detail && <div className="text-xs mt-1 text-navy-600 dark:text-navy-400">{item.detail}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white border border-emerald-500'
                  : 'bg-navy-800 text-navy-600 border border-navy-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          {activeTab === 0 && <MarketInefficienciesSection />}
          {activeTab === 1 && <StakeholderBenefitsSection />}
          {activeTab === 2 && <HongKongPositionSection />}
          {activeTab === 3 && <TechnologyPlatformSection />}
          {activeTab === 4 && <EconomicValueSection />}
          {activeTab === 5 && <CompetitiveEdgeSection />}
          {activeTab === 6 && <RiskLegalSection />}
          {activeTab === 7 && (
            <div
              className="rounded-2xl p-8 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                Platform Benefits Summary
              </h3>
              <p className="text-sm mb-6 text-navy-600 dark:text-navy-400">
                {conclusion.intro}
              </p>

              {/* Quantified Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-navy-800">
                  <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                    <Building2 className="w-4 h-4" />
                    For Buyers
                  </h5>
                  <ul className="space-y-1">
                    {conclusion.buyers.map((b, i) => (
                      <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {b}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-navy-800">
                  <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                    <Factory className="w-4 h-4" />
                    For Developers
                  </h5>
                  <ul className="space-y-1">
                    {conclusion.developers.map((d, i) => (
                      <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {d}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-navy-800">
                  <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                    <Landmark className="w-4 h-4" />
                    For Institutions
                  </h5>
                  <ul className="space-y-1">
                    {conclusion.institutions.map((inst, i) => (
                      <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {inst}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-navy-800">
                  <h5 className="font-bold mb-3 flex items-center gap-2 text-violet-500">
                    <Shield className="w-4 h-4" />
                    For Regulators
                  </h5>
                  <ul className="space-y-1">
                    {conclusion.regulators.map((r, i) => (
                      <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hong Kong Advantages */}
              <div className="p-4 rounded-xl mb-6 bg-navy-800">
                <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
                  <Globe className="w-5 h-5" />
                  Hong Kong Strategic Position
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {conclusion.hkAdvantages.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg text-center text-xs bg-navy-700 text-navy-900 dark:text-white">
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technology Leadership */}
              <div className="p-4 rounded-xl mb-6 bg-navy-800">
                <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                  <Cpu className="w-5 h-5" />
                  Technology Infrastructure
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {conclusion.technology.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg bg-navy-700">
                      <div className="font-semibold text-sm mb-1 text-emerald-500">{t.name}</div>
                      <div className="text-xs text-navy-600 dark:text-navy-400">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Statement */}
              <div className="p-4 rounded-xl bg-emerald-500">
                <p className="text-sm text-white">
                  {conclusion.finalStatement}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-navy-200 dark:border-navy-600">
        <Link
          to="/onboarding/about-nihao"
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all bg-navy-800 text-navy-900 dark:text-white"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          About Nihao
        </Link>
        <Link
          to="/onboarding/cea-holders"
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all bg-emerald-500 text-white"
        >
          CEA Holders
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </OnboardingLayout>
  );
}
