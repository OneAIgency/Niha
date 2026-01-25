import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  Building2,
  Users,
  LogOut,
  ChevronRight,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  Factory,
  Landmark,
  Briefcase,
  Scale,
  FileCheck,
  CircleDollarSign,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';

// Types
interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  category: 'company' | 'representative';
}

// Note: Colors now use design tokens via Tailwind classes
// See frontend/src/styles/design-tokens.css for available tokens

// Navigation sections
const navSections = [
  { id: 'market', label: 'Market Overview' },
  { id: 'nihao', label: 'About Nihao' },
  { id: 'cea-holders', label: 'For CEA Holders' },
  { id: 'eua-holders', label: 'For EUA Holders' },
  { id: 'eu-entities', label: 'For EU Entities' },
];

// Document types for upload
const documentTypes: DocumentType[] = [
  { id: 'business_reg', name: 'Business Registration Certificate', description: 'Company registration proof', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'articles', name: 'Articles of Incorporation', description: 'Company formation documents', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Recent statement showing company name (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'gov_id', name: 'Government-issued ID', description: 'Passport or national ID of representative', required: true, uploaded: false, status: 'pending', category: 'representative' },
  { id: 'proof_address', name: 'Proof of Address', description: 'Utility bill or bank statement (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'representative' },
];

// CEA Holder Categories Data
const ceaHolderCategories = [
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
const euaHolderCategories = [
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
const workflowSteps = [
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
const kycDocuments = [
  { category: 'Corporate Information', items: ['Certificate of Incorporation', 'Articles of Association', 'Board Resolution', 'Certificate of Good Standing'] },
  { category: 'Beneficial Ownership', items: ['Beneficial Ownership Declaration', 'Shareholder Register', 'Organizational Chart', 'Beneficial Owner IDs'] },
  { category: 'Financial Documentation', items: ['Recent Financial Statements (2-3 years)', 'Bank Reference Letter', 'Tax Compliance Certificate', 'Credit Rating'] },
  { category: 'Compliance & Regulatory', items: ['Regulatory Licenses', 'Compliance Policies', 'List of Directors', 'Authorized Signatories'] },
  { category: 'Business & Use of Funds', items: ['Business Description', 'Use of Funds Statement', 'Trading Activity Plan'] },
  { category: 'Verification', items: ['Sanctions & PEP Declarations', 'Negative Screening Results', 'Adverse Media Screening'] },
];

// Floating Upload Button Component
const FloatingUploadButton = ({
  progress,
  onClick
}: {
  progress: number;
  onClick: () => void;
}) => {
  const isComplete = progress >= 100;

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${
        isComplete
          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
          : 'bg-gradient-to-br from-amber-500 to-red-500'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={!isComplete ? {
        boxShadow: [
          '0 0 20px rgba(245, 158, 11, 0.4)',
          '0 0 40px rgba(245, 158, 11, 0.6)',
          '0 0 20px rgba(245, 158, 11, 0.4)',
        ],
      } : {}}
      transition={!isComplete ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {}}
    >
      {isComplete ? (
        <CheckCircle className="w-6 h-6 text-white" />
      ) : (
        <Upload className="w-6 h-6 text-white" />
      )}
      <div className="text-white">
        <div className="text-sm font-semibold">
          {isComplete ? 'Documents Complete' : 'Complete KYC'}
        </div>
        <div className="text-xs opacity-90">
          {progress}% uploaded
        </div>
      </div>
      {!isComplete && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </motion.button>
  );
};

// Upload Modal Component
const UploadModal = ({
  isOpen,
  onClose,
  documents,
  onUpload,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentType[];
  onUpload: (id: string, file: File) => void;
  onSubmit: () => void;
}) => {
  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredCount = documents.filter(d => d.required).length;
  const progress = Math.round((uploadedCount / requiredCount) * 100);
  const canSubmit = uploadedCount >= requiredCount;

  const companyDocs = documents.filter(d => d.category === 'company');
  const representativeDocs = documents.filter(d => d.category === 'representative');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/90"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl p-8 bg-navy-800 border border-navy-700"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-navy-600 transition-colors"
            >
              <X className="w-6 h-6 text-navy-200" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Complete Your KYC Documentation
              </h2>
              <p className="text-navy-200">
                Upload the required documents to complete your account verification and unlock full platform access
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-navy-200">Progress</span>
                <span className="text-teal-300">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-navy-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Company Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400">
                <Building2 className="w-5 h-5" />
                Company Documents
              </h3>
              <div className="grid gap-4">
                {companyDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onUpload={onUpload} color="#60a5fa" />
                ))}
              </div>
            </div>

            {/* Representative Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-400">
                <Users className="w-5 h-5" />
                Representative Documents
              </h3>
              <div className="grid gap-4">
                {representativeDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onUpload={onUpload} color="#8b5cf6" />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`w-full px-6 py-4 rounded-xl font-semibold text-white transition-all ${
                canSubmit
                  ? 'bg-gradient-to-br from-teal-500 to-blue-700 opacity-100 cursor-pointer'
                  : 'bg-navy-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {canSubmit ? 'Submit for Verification' : `Upload ${requiredCount - uploadedCount} more document(s)`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Document Card Component
const DocumentCard = ({
  doc,
  onUpload,
  color,
}: {
  doc: DocumentType;
  onUpload: (id: string, file: File) => void;
  color: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(doc.id, file);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-opacity-100 ${
        doc.uploaded ? 'bg-navy-700 border-emerald-500 border-solid' : 'bg-navy-700 border-dashed border-navy-600 dark:border-navy-500'
      }`}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {doc.uploaded ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <FileText className="w-5 h-5 text-navy-600 dark:text-navy-400" />
          )}
          <div>
            <div className="font-medium text-white">
              {doc.name}
              {doc.required && <span className="text-red-500"> *</span>}
            </div>
            <div className="text-sm text-navy-400">
              {doc.description}
            </div>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            doc.uploaded ? 'bg-emerald-500/20 text-emerald-500' : 'bg-navy-100 dark:bg-navy-500/20 text-navy-600 dark:text-navy-400'
          }`}
        >
          {doc.uploaded ? 'Uploaded' : 'Upload'}
        </div>
      </div>
    </div>
  );
};

// Entity Category Card Component
const EntityCategoryCard = ({
  category,
  isActive,
  onClick,
  colorScheme,
}: {
  category: typeof ceaHolderCategories[0];
  isActive: boolean;
  onClick: () => void;
  colorScheme: 'cea' | 'eua';
}) => {
  const Icon = category.icon;
  const gradients = {
    cea: ['#dc2626', '#f97316'],
    eua: ['#3b82f6', '#8b5cf6'],
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl cursor-pointer transition-all ${
        isActive
          ? 'bg-gradient-to-br from-teal-500/15 to-transparent border-2 border-teal-500 opacity-100'
          : 'bg-navy-800 border-2 border-navy-700 opacity-60'
      }`}
      onClick={onClick}
      whileHover={{ y: -4, opacity: 1 }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `linear-gradient(135deg, ${gradients[colorScheme][0]} 0%, ${gradients[colorScheme][1]} 100%)`
        }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-bold text-lg mb-2 text-white">{category.title}</h4>
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-teal-500/30 text-teal-300">
        {category.tag}
      </span>
      <p className="text-sm mb-4 text-navy-200">
        {category.description}
      </p>
      <div className="text-center p-3 rounded-lg bg-white/5">
        <div className="text-2xl font-bold text-emerald-500">
          {category.advantage}
        </div>
        <div className="text-xs text-navy-400">
          {category.advantageLabel}
        </div>
      </div>
    </motion.div>
  );
};

// Entity Category Detail Panel
const EntityCategoryDetail = ({
  category,
  colorScheme,
}: {
  category: typeof ceaHolderCategories[0];
  colorScheme: 'cea' | 'eua';
}) => {
  const Icon = category.icon;
  const gradients = {
    cea: ['#dc2626', '#f97316'],
    eua: ['#3b82f6', '#8b5cf6'],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl p-8 mt-8 bg-navy-800 border border-navy-700"
    >
      <div className="flex items-center gap-4 pb-6 mb-6 border-b border-navy-700">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${gradients[colorScheme][0]} 0%, ${gradients[colorScheme][1]} 100%)`
          }}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">
            {category.title}
          </h3>
          <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2 bg-teal-500 text-white">
            {category.tag}
          </span>
        </div>
        <div className="ml-auto text-right">
          <div className="text-4xl font-extrabold text-emerald-500">
            {category.advantage}
          </div>
          <div className="text-sm text-navy-200">
            {category.advantageLabel}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-white">
          Sub-Categories
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          {category.subCategories.map((sub, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-navy-700"
            >
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 mt-0.5 text-teal-300" />
                <div>
                  <div className="font-semibold text-white">
                    {sub.name}
                  </div>
                  <div className="text-sm mt-1 text-navy-200">
                    {sub.details}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500 dark:border-emerald-400">
        <h5 className="font-semibold mb-3 text-emerald-500">
          Key Advantages via Nihao Platform
        </h5>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-300">8-15%</div>
            <div className="text-xs text-navy-200">Price Premium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">High</div>
            <div className="text-xs text-navy-200">Confidentiality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">Medium</div>
            <div className="text-xs text-navy-200">Regulatory</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">High</div>
            <div className="text-xs text-navy-200">Structuring</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Workflow Step Card
const WorkflowStepCard = ({
  step,
  isActive,
  onClick,
}: {
  step: typeof workflowSteps[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = step.icon;

  return (
    <motion.div
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-teal-500 border-2 border-teal-300' : 'bg-navy-800 border-2 border-navy-700'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-navy-700 text-teal-300'
          }`}
        >
          {step.step}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-white">
            {step.title}
          </div>
          <div className={`text-xs ${isActive ? 'text-white/70' : 'text-navy-600 dark:text-navy-400'}`}>
            {step.duration}
          </div>
        </div>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-navy-200'}`} />
      </div>
    </motion.div>
  );
};

// Workflow Step Detail
const WorkflowStepDetail = ({ step }: { step: typeof workflowSteps[0] }) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl p-8 bg-navy-800 border border-navy-700"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-700">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-teal-500 text-white">
              Step {step.step}
            </span>
            <span className="flex items-center gap-1 text-sm text-amber-500">
              <Clock className="w-4 h-4" />
              {step.duration}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {step.title}
          </h3>
        </div>
      </div>

      <p className="text-lg mb-6 text-navy-200">
        {step.description}
      </p>

      <div className="mb-6">
        <h4 className="font-semibold mb-4 text-white">
          Process Details
        </h4>
        <div className="space-y-3">
          {step.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <span className="text-navy-200">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl border border-teal-500 bg-gradient-to-br from-teal-500/15 to-blue-700/15">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-teal-300" />
          <span className="font-semibold text-teal-300">Outcome</span>
        </div>
        <p className="text-white">{step.outcome}</p>
      </div>
    </motion.div>
  );
};

// Main Component
export default function OnboardingPage() {
  const { logout } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentType[]>(documentTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('market');
  const [activeCeaCategory, setActiveCeaCategory] = useState(1);
  const [activeEuaCategory, setActiveEuaCategory] = useState(1);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);

  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredCount = documents.filter(d => d.required).length;
  const progress = Math.round((uploadedCount / requiredCount) * 100);

  const handleUpload = (id: string, _file: File) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, uploaded: true, status: 'uploaded' } : doc
      )
    );
  };

  const handleSubmit = () => {
    alert('KYC documents submitted for review!');
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveNav(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-teal-500/15 to-transparent border-b border-navy-700 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg bg-gradient-to-br from-teal-500 to-blue-700">
              N
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-blue-700 bg-clip-text text-transparent">
                Nihao Group
              </h1>
              <span className="text-xs uppercase tracking-widest text-navy-200">
                Onboarding
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex gap-1 p-1 rounded-xl bg-navy-800">
              {navSections.map(nav => (
                <button
                  key={nav.id}
                  onClick={() => scrollToSection(nav.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeNav === nav.id ? 'bg-teal-500 text-white' : 'bg-transparent text-navy-200'
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/20 text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 relative">
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(13, 148, 136, 0.2) 0%, transparent 70%)',
            }}
          />
          <h2 className="text-5xl font-extrabold mb-4 relative">
            Welcome to
            <br />
            <span className="bg-gradient-to-r from-emerald-500 to-blue-700 bg-clip-text text-transparent">
              Nihao Group
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-navy-200">
            Your gateway to the world's two largest carbon markets. We bridge the EU ETS and China ETS through innovative bilateral trading solutions.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => scrollToSection('market')}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-br from-teal-500 to-blue-700"
            >
              Learn More
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-xl font-semibold transition-all bg-navy-800 border border-navy-700 text-white"
            >
              Complete KYC
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: '🇪🇺', value: 'EUR 88/t', label: 'Current EUA Price', colorClass: 'text-blue-500 dark:text-blue-400' },
            { icon: '🇨🇳', value: 'CNY 63/t', label: 'Current CEA Price (~EUR 8)', colorClass: 'text-red-500 dark:text-red-400' },
            { icon: '🌍', value: '6.1B tonnes', label: 'Combined Market Coverage', colorClass: 'text-teal-300' },
            { icon: '💹', value: '15-25%', label: 'Value Improvement via Nihao', colorClass: 'text-emerald-500 dark:text-emerald-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-2xl text-center transition-all bg-navy-800 border border-navy-700"
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-teal-500 to-blue-700">
                {stat.icon}
              </div>
              <div className={`text-3xl font-extrabold mb-1 ${stat.colorClass}`}>
                {stat.value}
              </div>
              <div className="text-sm text-navy-200">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </section>

        {/* SECTION 1: Market Overview */}
        <section id="market" className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-teal-500 to-blue-700">
              1
            </div>
            <div>
              <h3 className="text-3xl font-bold">Market Overview</h3>
              <p className="text-navy-200">Understanding the world's two largest carbon markets</p>
            </div>
          </div>

          {/* Market Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* EU ETS Card */}
            <div className="rounded-2xl p-6 relative overflow-hidden bg-navy-800 border border-navy-700">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 dark:bg-blue-400" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-lg font-semibold">EU Emissions Trading System</div>
                  <div className="text-sm text-navy-200">European Union Allowances (EUA)</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  EU ETS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold">EUR 88</span>
                <span className="text-xl text-navy-200">/tCO2</span>
              </div>
              <div className="p-4 rounded-xl space-y-3 bg-white/5">
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Emissions Coverage:</span>
                  <span className="font-semibold">1.6 billion tonnes CO2</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Covered Entities:</span>
                  <span className="font-semibold">~10,000-11,000 installations</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Market Maturity:</span>
                  <span className="font-semibold">Phase 4 (since 2021)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">2030 Projection:</span>
                  <span className="font-semibold text-emerald-500">EUR 130-150/t (+48-70%)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-200">Annual Trading Volume:</span>
                  <span className="font-semibold">8-9 billion tonnes</span>
                </div>
              </div>
            </div>

            {/* China ETS Card */}
            <div className="rounded-2xl p-6 relative overflow-hidden bg-navy-800 border border-navy-700">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-lg font-semibold">China Emissions Trading Scheme</div>
                  <div className="text-sm text-navy-200">Chinese Emission Allowances (CEA)</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                  China ETS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold">CNY 63</span>
                <span className="text-xl text-navy-200">/tCO2 (~EUR 8)</span>
              </div>
              <div className="p-4 rounded-xl space-y-3 bg-white/5">
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Emissions Coverage:</span>
                  <span className="font-semibold">4.5 billion tonnes CO2</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Covered Entities:</span>
                  <span className="font-semibold">2,162+ companies</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">Market Status:</span>
                  <span className="font-semibold">Expanding (2024+)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
                  <span className="text-navy-200">2030 Projection:</span>
                  <span className="font-semibold text-emerald-500">CNY 200/t (+212%)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-200">Annual Trading Volume:</span>
                  <span className="font-semibold">200-250 million tonnes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Comparison Table */}
          <div
            className="rounded-2xl p-6 overflow-x-auto"
            className="bg-navy-800 border border-navy-700"
          >
            <h4 className="text-xl font-semibold mb-6">Key Regulatory Differences</h4>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <th className="text-left p-4 font-semibold rounded-tl-lg">Dimension</th>
                  <th className="text-left p-4 font-semibold">EU ETS</th>
                  <th className="text-left p-4 font-semibold rounded-tr-lg">China ETS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dimension: 'Supply Model', eu: 'Absolute cap with linear reduction', china: 'Carbon intensity benchmarking' },
                  { dimension: 'Allocation', eu: 'Mix of auction and free allocation', china: 'Primarily free allocation' },
                  { dimension: 'Market Access', eu: 'Open (MiFID II compliant)', china: 'Closed (domestic entities only)' },
                  { dimension: 'Financial Participation', eu: 'Yes (regulated banks, funds)', china: 'No' },
                  { dimension: 'Trading Venues', eu: 'Multiple (EEX, ICE)', china: 'Single (SEEE)' },
                  { dimension: 'Futures Market', eu: 'Yes (active)', china: 'No (spot only)' },
                  { dimension: 'Compliance Penalty', eu: 'EUR 100/tonne fixed', china: 'Up to 500% of shortage value' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold border-b border-navy-700">
                      {row.dimension}
                    </td>
                    <td className="p-4 border-b border-navy-700 text-navy-200">
                      {row.eu}
                    </td>
                    <td className="p-4 border-b border-navy-700 text-navy-200">
                      {row.china}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Insight Box */}
          <div
            className="p-6 rounded-xl text-center mt-8"
            style={{
              background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)`,
              border: "1px solid #8b5cf6",
            }}
          >
            <strong className="text-amber-500">Key Opportunity:</strong>{' '}
            <span className="text-navy-200">
              The 7-10x price differential between EU EUA (EUR 88/t) and China CEA (EUR 8/t) creates significant arbitrage opportunities.
              Foreign participation in China ETS is explicitly prohibited - Nihao provides the bridge.
            </span>
          </div>
        </section>

        {/* SECTION 2: About Nihao */}
        <section id="nihao" className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              className="bg-gradient-to-br from-teal-500 to-blue-700"
            >
              2
            </div>
            <div>
              <h3 className="text-3xl font-bold">About Nihao Group</h3>
              <p className="text-navy-200">Strategic intermediary bridging EU and China carbon markets</p>
            </div>
          </div>

          {/* Company Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div
              className="rounded-2xl p-6"
              className="bg-navy-800 border border-navy-700"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                className="bg-gradient-to-br from-teal-500 to-blue-700"
              >
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Hong Kong Headquarters</h4>
              <p className="text-sm text-navy-200">
                Strategic positioning at the intersection of European and Chinese carbon markets, leveraging Hong Kong's unique role as a gateway.
              </p>
            </div>
            <div
              className="rounded-2xl p-6"
              className="bg-navy-800 border border-navy-700"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `linear-gradient(135deg, #8b5cf6 0%, #ef4444 100%)` }}
              >
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Regulatory Compliance</h4>
              <p className="text-sm text-navy-200">
                Full compliance with Hong Kong SFC oversight, AML/KYC standards comparable to EU, and FATCA/CRS requirements.
              </p>
            </div>
            <div
              className="rounded-2xl p-6"
              className="bg-navy-800 border border-navy-700"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)` }}
              >
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Secure Infrastructure</h4>
              <p className="text-sm text-navy-200">
                Custody and settlement services, multi-currency transaction capabilities, and direct Yuan/RMB convertibility access.
              </p>
            </div>
          </div>

          {/* Service Offerings */}
          <div
            className="rounded-2xl p-8 mb-8"
            className="bg-navy-800 border border-navy-700"
          >
            <h4 className="text-xl font-semibold mb-6">Our Services</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Market Intelligence', items: ['CEA/EUA price analysis', 'Market participant identification', 'Counterparty risk assessment'] },
                { title: 'Transaction Facilitation', items: ['Deal negotiation support', 'Contract structuring', 'Settlement arrangement'] },
                { title: 'Post-Trade Services', items: ['Custody and settlement', 'Trade confirmation', 'Invoice processing'] },
                { title: 'Risk Management', items: ['Counterparty risk evaluation', 'Transaction optimization', 'Hedging advice'] },
                { title: 'Regulatory Compliance', items: ['KYC/AML documentation', 'Ongoing monitoring', 'Transaction reporting'] },
                { title: 'Technology Platform', items: ['Secure marketplace portal', 'Real-time deal tracking', 'Audit trail maintenance'] },
              ].map((service, i) => (
                <div key={i} className="p-4 rounded-xl bg-navy-700">
                  <h5 className="font-semibold mb-3 text-teal-300">{service.title}</h5>
                  <ul className="space-y-2">
                    {service.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-navy-200">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Hong Kong Advantages */}
          <div
            className="rounded-2xl p-8"
            className="border border-teal-500"
            style={{
              background: `linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(30, 64, 175, 0.15) 100%)`
            }}
          >
            <h4 className="text-xl font-semibold mb-6 text-teal-300">
              Why Hong Kong?
            </h4>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'China Market Access', desc: 'Direct Greater Bay Area connectivity' },
                { label: 'EU Market Access', desc: 'EEX/ICE trading infrastructure' },
                { label: 'Multi-Currency', desc: 'HKD, USD, EUR, RMB settlement' },
                { label: '24-Hour Trading', desc: 'Asian/European/American coverage' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold mb-1 text-white">{item.label}</div>
                  <div className="text-sm text-navy-200">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: For CEA Holders */}
        <section id="cea-holders" className="mb-20">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, #ef4444 0%, #f97316 100%)` }}
            >
              3
            </div>
            <div>
              <h3 className="text-3xl font-bold">For CEA Holders</h3>
              <p className="text-navy-200">Private bilateral deals offer 8-25% value improvement over SEEE exchange trading</p>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.13)", color: "#ef4444" }}
          >
            <span className="animate-pulse">👆</span>
            Select an entity category to view full details
          </div>

          {/* CEA Category Cards */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {ceaHolderCategories.map(category => (
              <EntityCategoryCard
                key={category.id}
                category={category}
                isActive={activeCeaCategory === category.id}
                onClick={() => setActiveCeaCategory(category.id)}
                colorScheme="cea"
              />
            ))}
          </div>

          {/* Active CEA Category Detail */}
          <AnimatePresence mode="wait">
            {activeCeaCategory && (
              <EntityCategoryDetail
                key={activeCeaCategory}
                category={ceaHolderCategories.find(c => c.id === activeCeaCategory)!}
                colorScheme="cea"
              />
            )}
          </AnimatePresence>

          {/* CEA Advantages Summary */}
          <div
            className="p-6 rounded-xl mt-8"
            style={{
              background: `linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)`,
              border: "1px solid #ef4444",
            }}
          >
            <h5 className="font-semibold mb-4 text-red-500">
              Key Advantages for CEA Holders via Nihao
            </h5>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <div className="text-xl font-bold text-emerald-500">8-15%</div>
                <div className="text-xs text-navy-200">Price Premium</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <Shield className="w-8 h-8 mx-auto mb-2 text-teal-300" />
                <div className="text-xl font-bold text-teal-300">High</div>
                <div className="text-xs text-navy-200">Confidentiality</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <Scale className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-xl font-bold text-amber-500">Lower</div>
                <div className="text-xs text-navy-200">Regulatory Scrutiny</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <Zap className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-xl font-bold text-blue-400">Custom</div>
                <div className="text-xs text-navy-200">Transaction Structuring</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: For EUA Holders */}
        <section id="eua-holders" className="mb-20">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%)` }}
            >
              4
            </div>
            <div>
              <h3 className="text-3xl font-bold">For EUA Holders</h3>
              <p className="text-navy-200">EUA-to-CEA swaps generate 10-22% total value improvement</p>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ backgroundColor: "rgba(96, 165, 250, 0.13)", color: "#60a5fa" }}
          >
            <span className="animate-pulse">👆</span>
            Select an entity category to view full details
          </div>

          {/* EUA Category Cards */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {euaHolderCategories.map(category => (
              <EntityCategoryCard
                key={category.id}
                category={category}
                isActive={activeEuaCategory === category.id}
                onClick={() => setActiveEuaCategory(category.id)}
                colorScheme="eua"
              />
            ))}
          </div>

          {/* Active EUA Category Detail */}
          <AnimatePresence mode="wait">
            {activeEuaCategory && (
              <EntityCategoryDetail
                key={activeEuaCategory}
                category={euaHolderCategories.find(c => c.id === activeEuaCategory)!}
                colorScheme="eua"
              />
            )}
          </AnimatePresence>

          {/* EUA Swap Advantage Box */}
          <div
            className="p-6 rounded-xl mt-8"
            style={{
              background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`,
              border: "1px solid #60a5fa",
            }}
          >
            <h5 className="font-semibold mb-4 text-blue-400">
              EUA-to-CEA Swap Value Breakdown
            </h5>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold" className="text-emerald-500">8-18%</div>
                <div className="text-xs" className="text-navy-200">Price Arbitrage</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold" className="text-teal-300">1-8%</div>
                <div className="text-xs" className="text-navy-200">Timing Optimization</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-amber-500">1-3%</div>
                <div className="text-xs text-navy-200">Operational Efficiency</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-blue-400">1-2%</div>
                <div className="text-xs text-navy-200">Currency Management</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-purple-400">1-4%</div>
                <div className="text-xs text-navy-200">Strategic Positioning</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: For EU Entities */}
        <section id="eu-entities" className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, #10b981 0%, #10b981 100%)` }}
            >
              5
            </div>
            <div>
              <h3 className="text-3xl font-bold">For EU Entities</h3>
              <p className="text-navy-200">Complete 7-step workflow delivering 15-25% total value improvement</p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              {workflowSteps.map(step => (
                <WorkflowStepCard
                  key={step.step}
                  step={step}
                  isActive={activeWorkflowStep === step.step}
                  onClick={() => setActiveWorkflowStep(step.step)}
                />
              ))}
            </div>
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {activeWorkflowStep && (
                  <WorkflowStepDetail
                    key={activeWorkflowStep}
                    step={workflowSteps.find(s => s.step === activeWorkflowStep)!}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div
            className="rounded-2xl p-8 mt-8"
            className="bg-navy-800 border border-navy-700"
          >
            <h4 className="text-xl font-semibold mb-6">KYC Documentation Requirements (23 Documents)</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kycDocuments.map((category, i) => (
                <div key={i} className="p-4 rounded-xl bg-navy-700">
                  <h5 className="font-semibold mb-3 text-teal-300">{category.category}</h5>
                  <ul className="space-y-2">
                    {category.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-navy-200">
                        <FileText className="w-4 h-4 text-navy-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* EU Entity Value Summary */}
          <div
            className="p-6 rounded-xl mt-8"
            style={{
              background: `linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)`,
              border: "1px solid #10b981",
            }}
          >
            <h5 className="font-semibold mb-4 text-emerald-500">
              Total Value Advantages for EU Entities
            </h5>
            <div className="grid md:grid-cols-6 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold" className="text-emerald-500">8-15%</div>
                <div className="text-xs" className="text-navy-200">Price Advantage</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold" className="text-teal-300">EUR 45-340K</div>
                <div className="text-xs" className="text-navy-200">Cost Reduction</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-amber-500">EUR 25-150K</div>
                <div className="text-xs text-navy-200">Working Capital</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-blue-400">EUR 25-250K</div>
                <div className="text-xs text-navy-200">Regulatory Savings</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-purple-400">1-3%</div>
                <div className="text-xs text-navy-200">Operational</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xl font-bold text-emerald-500">15-25%</div>
                <div className="text-xs text-navy-200">Total Benefit</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16">
          <div
            className="rounded-3xl p-12"
            className="border border-teal-500"
            style={{
              background: `linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)`
            }}
          >
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-navy-200">
              Complete your KYC documentation to access the Nihao marketplace and start benefiting from bilateral carbon trading opportunities.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all"
              className="bg-gradient-to-br from-teal-500 to-blue-700"
            >
              Complete Your KYC Documentation
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-12"
        style={{ borderTop: "1px solid #475569" }}
      >
        <p className="font-semibold text-navy-200">
          Nihao Group Hong Kong | Carbon Market Intermediation | January 2026
        </p>
        <p className="text-sm mt-2 text-navy-400">
          Bridging the EU ETS and China ETS through innovative bilateral trading solutions
        </p>
      </footer>

      {/* Floating Upload Button */}
      <FloatingUploadButton progress={progress} onClick={() => setIsModalOpen(true)} />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documents={documents}
        onUpload={handleUpload}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
