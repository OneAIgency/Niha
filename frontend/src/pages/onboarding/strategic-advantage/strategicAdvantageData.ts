import {
  TrendingUp,
  DollarSign,
  Shield,
  Scale,
  Globe,
  Building2,
  Database,
  BarChart3,
  Target,
  CheckCircle,
  AlertTriangle,
  Users,
  Factory,
  Landmark,
  Cpu,
  Gavel,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface MarketContextItem {
  label: string;
  value: string;
  growth?: string;
  cagr?: string;
  detail?: string;
  issue?: boolean;
}

export interface ExecutiveSummaryData {
  intro: string;
  marketContext: MarketContextItem[];
}

export interface TabConfig {
  id: number;
  label: string;
  icon: LucideIcon;
}

export interface BuyerSavingsRow {
  category: string;
  traditional: string;
  nihao: string;
  savings: string;
  isTotal?: boolean;
}

export interface DeveloperSavingsRow {
  category: string;
  traditional: string;
  nihao: string;
  improvement: string;
}

export interface InstitutionalValueRow {
  category: string;
  traditional: string;
  nihao: string;
  improvement: string;
}

export interface RegulatorValueRow {
  category: string;
  traditional: string;
  nihao: string;
  improvement: string;
}

export interface VCMProjection {
  year: string;
  value: string;
}

export interface EUETSProjection {
  metric: string;
  value: string;
}

// =============================================================================
// Executive Summary Data
// =============================================================================

export const executiveSummary: ExecutiveSummaryData = {
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

export const marketInefficiencies = {
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

export const stakeholderAdvantages = {
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

export const hongKongPosition = {
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

export const technologyInfrastructure = {
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

export const economicValue = {
  buyerSavings: [
    { category: 'Intermediary Fees', traditional: '15.5% - 90%', nihao: '3% - 10%', savings: '12.5% - 80%' },
    { category: 'Transaction Processing', traditional: '$5 - $15 per credit', nihao: '$0.50 - $3', savings: '70% - 90%' },
    { category: 'Verification Costs', traditional: '30-60% of income', nihao: '10-20%', savings: '50% - 67%' },
    { category: 'Administrative Overhead', traditional: 'High (manual)', nihao: 'Low (automated)', savings: '50% - 70%' },
    { category: 'Total Estimated Savings', traditional: '—', nihao: '—', savings: '30% - 75%', isTotal: true },
  ] as BuyerSavingsRow[],
  developerSavings: [
    { category: 'Revenue Retained', traditional: '10% - 50%', nihao: '60% - 90%', improvement: '+20% to +80%' },
    { category: 'Time to Market', traditional: '18-36 months', nihao: '4-12 months', improvement: '70% faster' },
    { category: 'Verification Cost', traditional: 'High', nihao: 'Low (automated)', improvement: '50% - 70%' },
    { category: 'Buyer Access', traditional: 'Limited', nihao: 'Global', improvement: '10x - 100x' },
  ] as DeveloperSavingsRow[],
  institutionalValue: [
    { category: 'Portfolio Risk Reduction', traditional: 'High volatility exposure', nihao: 'Hedging tools + diversification', improvement: '40% - 60% risk reduction' },
    { category: 'Market Access Cost', traditional: 'Multiple platform fees', nihao: 'Single unified platform', improvement: '50% - 70% cost reduction' },
    { category: 'Due Diligence Time', traditional: '4-8 weeks per project', nihao: '1-2 weeks (AI-assisted)', improvement: '70% - 85% faster' },
    { category: 'Settlement Risk', traditional: 'T+2 to T+5 exposure', nihao: 'Real-time DvP settlement', improvement: '100% elimination' },
    { category: 'Market Depth Access', traditional: 'Fragmented liquidity', nihao: '€33B daily EU ETS access', improvement: '10x - 100x liquidity' },
    { category: 'Compliance Reporting', traditional: 'Manual compilation', nihao: 'Automated reporting', improvement: '60% - 80% effort reduction' },
  ] as InstitutionalValueRow[],
  regulatorValue: [
    { category: 'Market Surveillance Efficiency', traditional: 'Manual oversight', nihao: 'Real-time automated monitoring', improvement: '70% - 90% efficiency gain' },
    { category: 'Audit Trail Completeness', traditional: '60% - 70% visibility', nihao: '100% transparent records', improvement: '100% audit coverage' },
    { category: 'Double-Counting Detection', traditional: 'Post-hoc discovery', nihao: 'Real-time prevention', improvement: '100% prevention rate' },
    { category: 'Cross-Border Coordination', traditional: 'Bilateral negotiations', nihao: 'Standardized API reporting', improvement: '80% faster coordination' },
    { category: 'Compliance Violation Detection', traditional: 'Weeks to months', nihao: 'Real-time alerts', improvement: '95% faster detection' },
    { category: 'Market Integrity Score', traditional: 'Low confidence', nihao: 'High integrity assurance', improvement: 'Qualitative improvement' },
  ] as RegulatorValueRow[],
  marketProjections: {
    vcm: [
      { year: '2025', value: '$1.6 - $4.04 billion' },
      { year: '2030', value: '$7 - $35 billion' },
      { year: '2035', value: '$23.99 - $47.5 billion' },
      { year: '2050', value: '$45 - $250 billion' },
    ] as VCMProjection[],
    euEts: [
      { metric: 'Current annual volume', value: '€38 billion (2022)' },
      { metric: 'Total raised since 2013', value: '€175+ billion' },
      { metric: 'Daily trading volume', value: '€33 billion (spot + futures)' },
    ] as EUETSProjection[],
  },
};

// =============================================================================
// Section 6: Competitive Positioning
// =============================================================================

export const platformBenefits = {
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

export const riskAndLegal = {
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

export const conclusion = {
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

export const tabs: TabConfig[] = [
  { id: 0, label: 'Inefficiencies', icon: AlertTriangle },
  { id: 1, label: 'Stakeholders', icon: Users },
  { id: 2, label: 'Hong Kong', icon: Globe },
  { id: 3, label: 'Technology', icon: Cpu },
  { id: 4, label: 'Economics', icon: DollarSign },
  { id: 5, label: 'Benefits', icon: Target },
  { id: 6, label: 'Risk/Legal', icon: Gavel },
  { id: 7, label: 'Summary', icon: CheckCircle },
];
