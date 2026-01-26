import {
  Factory,
  BarChart3,
  Building2,
  Globe,
  Landmark,
  Briefcase,
  TrendingUp,
  FileCheck,
  CircleDollarSign,
  ArrowRight,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

// Types
export interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  category: 'company' | 'representative';
}

export interface HolderCategory {
  id: number;
  icon: LucideIcon;
  title: string;
  tag: string;
  description: string;
  subCategories: {
    name: string;
    details: string;
  }[];
  advantage: string;
  advantageLabel: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  duration: string;
  icon: LucideIcon;
  description: string;
  details: string[];
  outcome: string;
}

export interface KYCDocumentCategory {
  category: string;
  items: string[];
}

// Navigation sections
export const navSections = [
  { id: 'market', label: 'Market Overview' },
  { id: 'nihao', label: 'About Nihao' },
  { id: 'cea-holders', label: 'For CEA Holders' },
  { id: 'eua-holders', label: 'For EUA Holders' },
  { id: 'eu-entities', label: 'For EU Entities' },
];

// Document types for upload
export const documentTypes: DocumentType[] = [
  { id: 'business_reg', name: 'Business Registration Certificate', description: 'Company registration proof', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'articles', name: 'Articles of Incorporation', description: 'Company formation documents', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Recent statement showing company name (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'gov_id', name: 'Government-issued ID', description: 'Passport or national ID of representative', required: true, uploaded: false, status: 'pending', category: 'representative' },
  { id: 'proof_address', name: 'Proof of Address', description: 'Utility bill or bank statement (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'representative' },
];

// CEA Holder Categories Data
export const ceaHolderCategories: HolderCategory[] = [
  {
    id: 1,
    icon: Factory,
    title: 'Chinese Domestic Industrial Facilities',
    tag: 'Covered Entities',
    description: 'Industrial manufacturing facilities mandated in China\'s national ETS',
    subCategories: [
      { name: 'Power Generation Facilities', details: 'Thermal power, natural gas, CHP plants (2,500+ entities)' },
      { name: 'Steel and Iron Production', details: 'Blast furnace, EAF facilities (400-500 entities, 800-1,000 MtCO2e/year)' },
      { name: 'Cement Manufacturing', details: 'Portland cement, lime production (600-700 entities, 1,200-1,400 MtCO2e/year)' },
      { name: 'Aluminum Smelting', details: 'Primary aluminum, anode production (200-250 entities, 400-500 MtCO2e/year)' },
    ],
    advantage: '10-15%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 2,
    icon: BarChart3,
    title: 'Financial Trading Companies',
    tag: 'Non-Regulated Brokers',
    description: 'Financial intermediaries trading CEA for profit opportunities',
    subCategories: [
      { name: 'Carbon Trading Brokers', details: '100-200+ entities, holdings 1,000-10,000,000 tonnes' },
      { name: 'Energy Trading Companies', details: '50-100 entities, holdings 100,000-5,000,000 tonnes' },
      { name: 'Financial Investment Firms', details: '30-50 entities, 1-3 year holding periods' },
      { name: 'Tech-Enabled Trading Platforms', details: '10-20 platforms, 100,000-2,000,000 tonnes aggregate' },
    ],
    advantage: '15-25%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 3,
    icon: Building2,
    title: 'Conglomerate Trading Arms',
    tag: 'Subsidiaries of Manufacturing Groups',
    description: 'Trading subsidiaries optimizing carbon portfolios across group companies',
    subCategories: [
      { name: 'Conglomerate Trading Arms', details: '20-50 entities, 5-50 million tonnes aggregate' },
      { name: 'Internal Risk Management Entities', details: '15-30 entities, managing 5-50+ facilities per group' },
      { name: 'Strategic Reserves', details: '10-20 entities, 10-100+ million tonnes holdings' },
    ],
    advantage: '12-20%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 4,
    icon: Globe,
    title: 'Export-Focused Manufacturers',
    tag: 'Carbon Efficiency Leaders',
    description: 'Companies generating CEA surplus due to advanced production efficiency',
    subCategories: [
      { name: 'Export-Focused Industrial Manufacturers', details: '200-400 entities, 500-1,000 MtCO2e surplus/year' },
      { name: 'Joint Venture Manufacturers', details: '100-200 entities, best-available technologies' },
      { name: 'Technology Leaders in Heavy Industry', details: '50-100 entities, proprietary low-carbon processes' },
    ],
    advantage: '12-18%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 5,
    icon: Landmark,
    title: 'Government-Linked Entities',
    tag: 'SOE Holdings',
    description: 'Government-controlled organizations holding CEA for policy purposes',
    subCategories: [
      { name: 'Environmental Ministry Reserves', details: '100,000-5,000,000 tonnes for system stability' },
      { name: 'State Asset Management Companies', details: '15-30 entities, 5-50 million tonnes aggregate' },
      { name: 'Special Purpose Government Entities', details: 'Provincial reserves, 1-20 million tonnes' },
    ],
    advantage: '8-15%',
    advantageLabel: 'Total Value Improvement',
  },
];

// EUA Holder Categories Data
export const euaHolderCategories: HolderCategory[] = [
  {
    id: 1,
    icon: Globe,
    title: 'Multinational Corporations',
    tag: 'EU & China Operations',
    description: 'Large enterprises with manufacturing presence in both Europe and China',
    subCategories: [
      { name: 'Automotive & Transportation', details: '50-100 entities, 50,000-1,000,000 tonnes annually' },
      { name: 'Chemical & Materials Manufacturing', details: '30-60 entities, 100,000-500,000 tonnes annually' },
      { name: 'Metal Manufacturing & Aluminum', details: '20-40 entities, 200,000-2,000,000 tonnes' },
      { name: 'Paper, Pulp & Packaging', details: '15-30 entities, 50,000-500,000 tonnes' },
    ],
    advantage: '13-22%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 2,
    icon: Briefcase,
    title: 'Non-EU Financial Institutions',
    tag: 'European Market Access',
    description: 'Investment banks, asset managers, and brokers with EUA trading operations',
    subCategories: [
      { name: 'International Investment Banks', details: 'US, Asian, Middle Eastern banks (20-40 entities)' },
      { name: 'Asset Management Firms', details: 'ESG-focused funds (30-80 entities, 500K-20M tonnes)' },
      { name: 'Brokers and Traders', details: '20-50 entities, 100,000-10,000,000 tonnes' },
    ],
    advantage: '20-34%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'International Trading Companies',
    tag: 'Commodity Diversification',
    description: 'Global energy and commodity traders with carbon portfolio exposure',
    subCategories: [
      { name: 'Global Energy Trading Companies', details: '15-35 entities, 100,000-5,000,000 tonnes' },
      { name: 'Commodity Trading Houses', details: '20-40 entities, 50,000-2,000,000 tonnes' },
      { name: 'Environmental/ESG Trading Specialists', details: '30-50 entities, 500,000-20,000,000 tonnes' },
    ],
    advantage: '17-28%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 4,
    icon: Landmark,
    title: 'State-Owned & Government-Linked',
    tag: 'Strategic Holdings',
    description: 'Sovereign wealth funds and state investment vehicles with EUA positions',
    subCategories: [
      { name: 'Sovereign Wealth Funds', details: 'Middle Eastern, Asian (10-25 entities)' },
      { name: 'State-Owned Energy Companies', details: 'Russian, Chinese, Middle Eastern (5-15 entities)' },
    ],
    advantage: '10.5-20.5%',
    advantageLabel: 'Total Value Improvement',
  },
  {
    id: 5,
    icon: Factory,
    title: 'Infrastructure & Services',
    tag: 'EU Operations',
    description: 'Utilities, transportation, and consumer companies with European presence',
    subCategories: [
      { name: 'Utilities and Infrastructure', details: '20-40 entities, 100,000-1,000,000 tonnes' },
      { name: 'Transportation and Logistics', details: '10-25 entities, 50,000-500,000 tonnes' },
      { name: 'Consumer and Retail Companies', details: '15-30 entities, 10,000-100,000 tonnes' },
    ],
    advantage: '12-21%',
    advantageLabel: 'Total Value Improvement',
  },
];

// EU Entity Workflow Steps
export const workflowSteps: WorkflowStep[] = [
  {
    step: 1,
    title: 'KYC Process & Account Approval',
    duration: 'Weeks 1-4',
    icon: FileCheck,
    description: 'Establish EU entity as approved participant in Nihao\'s marketplace',
    details: [
      'Initial application submission (1-2 days)',
      'KYC documentation collection (3-5 days)',
      'Due diligence and verification (7-10 days)',
      'Enhanced due diligence if applicable (5-10 days)',
      'Final approval and account activation (1-2 days)',
    ],
    outcome: 'Active trading account with verified credentials, API access, custody account setup',
  },
  {
    step: 2,
    title: 'Account Funding - Wire Transfer',
    duration: 'Weeks 4-5',
    icon: CircleDollarSign,
    description: 'Establish capital available for CEA/EUA acquisitions',
    details: [
      'Wire transfer to Nihao\'s Hong Kong client account',
      'Amount range: EUR 100,000 - EUR 50,000,000+',
      'SWIFT-enabled international wire settlement',
      'Funds receipt confirmation (2-5 business days)',
      'Real-time balance viewing via portal',
    ],
    outcome: 'Immediate access to capital for CEA acquisitions',
  },
  {
    step: 3,
    title: 'Marketplace Access - Browse CEA Offerings',
    duration: 'Weeks 5-8',
    icon: Globe,
    description: 'Access marketplace showing available CEA from non-EU sellers',
    details: [
      'Real-time listing of CEA from various sellers',
      'Industrial Manufacturers: 50,000-500,000 tonnes',
      'Financial Trading Companies: 100,000-5,000,000 tonnes',
      'Filtering by quantity, price, delivery date',
      'Price comparison and watchlist functionality',
    ],
    outcome: 'Shortlist of preferred CEA sellers and offerings',
  },
  {
    step: 4,
    title: 'Seller Selection and Order Placement',
    duration: 'Weeks 5-8',
    icon: Briefcase,
    description: 'Place order to purchase CEA from selected non-EU seller(s)',
    details: [
      'Price competitiveness analysis (CNY 75-95/tonne)',
      'Order initiation and specification',
      'Seller confirmation process (24h window)',
      'Payment trigger: 30-50% upfront',
      'Binding contract establishment',
    ],
    outcome: 'Binding contract for CEA purchase',
  },
  {
    step: 5,
    title: 'Swap Offer Marketplace Access',
    duration: 'Weeks 6-10',
    icon: TrendingUp,
    description: 'Access marketplace where non-EU entities offer EUA for CEA',
    details: [
      'Parallel marketplace with swap offers',
      'Fixed-Ratio CEA-for-EUA Swaps',
      'Market-Adjusted Swaps (ratio adjusts)',
      'Staged/Tranche Swaps (multiple tranches)',
      'Swap ratio: typically 1 EUA : 8-12 CEA',
    ],
    outcome: 'EUA holder identified willing to swap',
  },
  {
    step: 6,
    title: 'Swap Execution - CEA-to-EUA Exchange',
    duration: 'Weeks 10-12',
    icon: ArrowRight,
    description: 'Execute bilateral swap between EU entity and EUA holder',
    details: [
      'Swap agreement confirmation',
      'Legal documentation prepared by Nihao',
      'Pre-settlement verification',
      'CEA transfer to EUA holder (T+2 to T+5)',
      'EUA transfer to EU entity (T+3 to T+7)',
    ],
    outcome: 'EU entity holds EUA certificates in EU ETS registry',
  },
  {
    step: 7,
    title: 'EUA Certification and Delivery',
    duration: 'Weeks 12-14',
    icon: CheckCircle,
    description: 'Confirm EUA holdings and prepare for compliance/trading use',
    details: [
      'EUA account verification in EU ETS registry',
      'Regulatory compliance documentation package',
      'EUA integration into compliance portfolio',
      'Final accounting of all costs',
      'Transaction reporting for tax purposes',
    ],
    outcome: 'Complete workflow with 15-25% total value improvement',
  },
];

// KYC Documents List
export const kycDocuments: KYCDocumentCategory[] = [
  { category: 'Corporate Information', items: ['Certificate of Incorporation', 'Articles of Association', 'Board Resolution', 'Certificate of Good Standing'] },
  { category: 'Beneficial Ownership', items: ['Beneficial Ownership Declaration', 'Shareholder Register', 'Organizational Chart', 'Beneficial Owner IDs'] },
  { category: 'Financial Documentation', items: ['Recent Financial Statements (2-3 years)', 'Bank Reference Letter', 'Tax Compliance Certificate', 'Credit Rating'] },
  { category: 'Compliance & Regulatory', items: ['Regulatory Licenses', 'Compliance Policies', 'List of Directors', 'Authorized Signatories'] },
  { category: 'Business & Use of Funds', items: ['Business Description', 'Use of Funds Statement', 'Trading Activity Plan'] },
  { category: 'Verification', items: ['Sanctions & PEP Declarations', 'Negative Screening Results', 'Adverse Media Screening'] },
];
