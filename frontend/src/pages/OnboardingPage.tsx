import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Users,
  LogOut,
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

interface ScenarioData {
  id: number;
  icon: string;
  iconClass: string;
  title: string;
  titleEn: string;
  tag: string;
  description: string;
  metrics: { value: string; label: string }[];
  context: string;
  optionA: {
    title: string;
    steps: string[];
    issues: string[];
  };
  optionB: {
    title: string;
    steps: string[];
    benefits: string[];
  };
  example: {
    title: string;
    situation: string[];
    solution: string[];
  };
  economics: { value: string; label: string; color: string }[];
}

// Color palette from swap-analysis.html
const colors = {
  primary: '#0d9488',
  primaryDark: '#0f766e',
  primaryLight: '#5eead4',
  secondary: '#1e40af',
  secondaryLight: '#3b82f6',
  accent: '#f59e0b',
  danger: '#dc2626',
  success: '#16a34a',
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  bgCardHover: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
};

// All 6 scenarios data from swap-analysis.html - COMPLETE DATA
const scenariosData: ScenarioData[] = [
  {
    id: 1,
    icon: '🌏',
    iconClass: 's1',
    title: 'China Compliance Arbitrage',
    titleEn: 'China Compliance Arbitrage',
    tag: 'Dual Operational Necessity',
    description: 'Multinationals with operations in both jurisdictions',
    metrics: [
      { value: '80%+', label: 'Conversion Rate' },
      { value: '2M', label: 'tCO2/year' },
    ],
    context: 'A multinational with operations in both jurisdictions that has EUA surplus from EU operations (efficient facilities or capacity closures) and CEA deficit from China operations (expansion or production higher than benchmarks).',
    optionA: {
      title: 'Direct Sale (Status Quo)',
      steps: [
        'Sell 100,000 EUA on EU market at EUR88/t = EUR8.8M',
        'Transfer EUR8.8M to China (subject to capital controls)',
        'Convert to RMB (7.8 rate) = 68.64M yuan',
        'Buy CEA on China market at 63 yuan/t',
        'Obtain ~1,089,523 CEA',
      ],
      issues: [
        'Capital controls delay: 2-4 weeks for SAFE approval (>$50k USD)',
        'FX spread: 1-2% loss in EUR to RMB conversion (68.64M to 67.87M real)',
        'Timing risk: CEA price may rise during waiting period for transfer',
        'Transparency: Large capital transfers attract attention from regulators in both jurisdictions',
        'Tax complications: Potential double taxation on profit from EUA sale',
      ],
    },
    optionB: {
      title: 'Direct Swap (via Nihao)',
      steps: [
        'Swap 100,000 EUA directly for 1,000,000 CEA (ratio 1:10)',
        'Settlement in 48h through respective registries',
        'Zero cross-border cash transfer',
        'Zero FX exposure',
      ],
      benefits: [
        'Instant compliance: Receive CEA immediately for China deadline',
        'Zero capital controls: Swap is commodity-for-commodity, not capital flow',
        'Better effective ratio: 1:10 vs 1:10.9 (avoiding FX and timing losses in Option A)',
        'Regulatory simplicity: Declared as "barter trade" not investment outflow',
      ],
    },
    example: {
      title: 'Real-World Example: German Cement Company with China Factory (e.g., HeidelbergCement)',
      situation: [
        'Cement plant in Germany: modernization leads to 50,000 EUA surplus',
        'New cement factory in Guangdong: needs 500,000 CEA for 2025 compliance',
        'Problem: Transferring EUR4.4M from Germany to China for CEA acquisition is complicated',
      ],
      solution: [
        'Direct swap 50,000 EUA to 500,000 CEA, avoiding all frictions',
      ],
    },
    economics: [
      { value: 'EUR100,000+', label: 'Cost avoided (FX spread + delay + compliance)', color: colors.success },
      { value: 'EUR66,000', label: 'Nihao Fee (1.5% x EUR4.4M)', color: colors.accent },
      { value: 'EUR34,000+', label: 'Net savings + timing risk elimination', color: colors.primaryLight },
    ],
  },
  {
    id: 2,
    icon: '📊',
    iconClass: 's2',
    title: 'Strategic Repositioning',
    titleEn: 'Strategic Repositioning',
    tag: 'China Market Bull Bet',
    description: 'Investment funds with bullish thesis on China carbon market reform',
    metrics: [
      { value: '+212%', label: 'CEA Upside' },
      { value: '1M', label: 'tCO2/fund' },
    ],
    context: 'An investment fund or corporate treasury that holds EUA as commoditized carbon asset (investment, not compliance), has bullish thesis on China carbon market reform, and believes CEA will appreciate dramatically when absolute caps are introduced (2027-2030). Current prices: EUA EUR88/t, projection 2030: EUR130-150/t = +48-70% upside. CEA 63 yuan (~EUR8/t), projection 2030 with reforms: 200 yuan (~EUR25/t) = +212% upside. Asymmetric opportunity: CEA has growth potential 3-4x higher than EUA.',
    optionA: {
      title: 'Problem with Sell then Buy',
      steps: [],
      issues: [
        'Market impact: Selling 500,000 EUA on market can move price (5 bps)',
        'CEA acquisition is DIFFICULT for foreigners:',
        '- Requires WFOE in China (EUR50k-100k setup, 6-12 months)',
        '- Limited access to Shanghai Exchange without local entity',
        '- Lack of international brokers facilitating CEA purchases',
      ],
    },
    optionB: {
      title: 'Swap Advantage',
      steps: [],
      benefits: [
        'One-stop execution: Nihao manages both legs simultaneously',
        'No market impact: OTC bilateral transaction, not through public order book',
        'Instant China exposure: Get CEA without establishing WFOE',
        'Secure custody: Nihao keeps CEA in custody until investor decides to sell',
      ],
    },
    example: {
      title: 'Example: Hedge Fund "Green Alpha Partners"',
      situation: [
        'Current portfolio: 1,000,000 EUA (value EUR88M) purchased in 2023 at EUR60/t',
        'Unrealized profit: EUR28M (+47%)',
        'Thesis: EUA will continue rising, but CEA offers more upside',
        'Strategy: Rebalancing - sell 20% of EUA holdings (200,000 EUA) and reallocate to CEA',
      ],
      solution: [
        'Transfer 200,000 EUA to Nihao',
        'Receive 2,000,000 CEA',
        'Keep in Nihao Hong Kong custody',
        'If CEA rises to 200 yuan (EUR25) in 2030: profit EUR34M (200% return)',
        'If CEA fails reform and stays 60 yuan (EUR7.7): loss only EUR600k (-3.4% portfolio)',
      ],
    },
    economics: [
      { value: '-3.4%', label: 'Downside (portfolio if CEA fails)', color: colors.danger },
      { value: '+39%', label: 'Upside (portfolio if CEA thesis correct)', color: colors.success },
      { value: 'Asymmetric', label: 'Risk-Reward justifies swap', color: colors.primaryLight },
    ],
  },
  {
    id: 3,
    icon: '🏭',
    iconClass: 's3',
    title: 'CBAM Strategy',
    titleEn: 'CBAM Strategy',
    tag: 'Supply Chain Optimization',
    description: 'EU companies with Chinese supply chain, subject to CBAM from 2026',
    metrics: [
      { value: 'EUR40', label: '/ton product savings' },
      { value: '60%', label: 'Conversion Rate' },
    ],
    context: 'A European company with Chinese supply chain that imports carbon-intensive products (steel, aluminum, cement), will be subject to CBAM (Carbon Border Adjustment Mechanism) from 2026, and has surplus EUA from own EU operations. CBAM mechanism: From 2026, EU importers must buy CBAM certificates for embedded emissions in imports. CBAM certificate price = quarterly average EUA price. Deduction available: If Chinese producer has already paid carbon price in China. Formula: CBAM cost = (Embedded emissions - Carbon price paid in China) x EUA price.',
    optionA: {
      title: 'Benefits for EU Company',
      steps: [
        'Increased CBAM discount: Instead of 63 yuan/t (EUR8), supplier demonstrates cost EUR88/t',
        'Savings per ton of imported product: (EUR88 - EUR8) x emission factor = EUR80 x 0.5 tCO2/ton product = EUR40/ton product',
        'If importing 10,000 tons of steel/year: EUR400,000 annual savings',
      ],
      issues: [],
    },
    optionB: {
      title: 'Benefits for Chinese Supplier',
      steps: [],
      benefits: [
        'Receives EUA "for free": EUR88 value in exchange for CEA EUR8 value = EUR80/t gift',
        'Reduces customer CBAM burden: Maintains competitiveness',
        'Avoids CEA market purchase: Where low liquidity creates timing risk',
      ],
    },
    example: {
      title: 'Example: ThyssenKrupp with Supplier HBIS Group',
      situation: [
        'ThyssenKrupp (German steel): Imports 50,000 tons steel billets/year from HBIS Group (Hebei Iron & Steel, Chinese SOE)',
        'CBAM 2026: needs to demonstrate carbon cost for 25,000 tCO2 embedded',
        'HBIS has 500,000 CEA deficit in compliance cycle',
      ],
      solution: [
        'ThyssenKrupp swap 50,000 EUA surplus to HBIS',
        'HBIS swap 500,000 CEA to ThyssenKrupp (unused)',
        'HBIS surrender partial EUA to demonstrate CBAM (documentation purposes)',
        'ThyssenKrupp reduces CBAM bill by EUR2M annually',
        'Both parties win vs. direct market sale',
      ],
    },
    economics: [
      { value: 'EUR2M/year', label: 'CBAM savings for EU Company', color: colors.success },
      { value: 'EUR80/t', label: '"Gift" to supplier (maintaining relationship)', color: colors.accent },
      { value: 'Win-Win', label: 'Supply chain strengthening', color: colors.primaryLight },
    ],
  },
  {
    id: 4,
    icon: '🚪',
    iconClass: 's4',
    title: 'Jurisdictional Exit',
    titleEn: 'Jurisdictional Exit',
    tag: 'Strategic Divestment',
    description: 'Chinese companies exiting EU market, wanting to repatriate value to China',
    metrics: [
      { value: '48h', label: 'Settlement Time' },
      { value: '90%', label: 'Conversion Rate' },
    ],
    context: 'A Chinese company exiting the European market that has EU installations with EUA surplus, wants to repatriate all value to China without leaving cash abroad, and prefers tangible assets in China (CEA) over cash subject to controls. Example reversed scenario: In 2024, Shell exited China power market after operating carbon trading desk. Imagine the inverse.',
    optionA: {
      title: 'Option A: Sell EUA on EU Market',
      steps: [
        '1. Sell 200,000 EUA at EUR88/t = EUR17.6M',
        '2. Cash remains in EU account (German/Spanish bank)',
        '3. Apply SAFE China for EUR17.6M transfer to China',
        '4. Wait 4-8 weeks for approval (large sum)',
        '5. Wire transfer with audit trail and justifications',
        '6. Convert to RMB with 1.5% spread = loss EUR264k',
        '7. Final: 135.4M RMB in China mainland',
      ],
      issues: [
        'Capital controls scrutiny: EUR17.6M triggers enhanced review',
        'Repatriation justification: must document as "profit from closed operations"',
        'Potential freezing: If EU sanctions or China policy changes, cash blocked',
        'FX risk: 2 months between sale and conversion, EUR/RMB may fluctuate',
      ],
    },
    optionB: {
      title: 'Option B: Direct Swap for CEA',
      steps: [
        '1. Swap 200,000 EUA for 2,000,000 CEA via Nihao',
        '2. CEA transferred to Shanghai subsidiary custody in 48h',
        '3. Zero cross-border cash, zero FX exposure',
        '4. Can resell CEA gradually on China market or use for compliance',
        '5. Total value: 2M x 63 yuan = 126M yuan (~EUR16.15M)',
      ],
      benefits: [
        'Instant repatriation: Assets in China in 2 days vs. 2 months',
        'Zero regulatory friction: Commodity swap, not capital transfer',
        'Flexibility: CEA can be held for speculation or sold gradually',
        'No political risk: No EUR17.6M cash "stuck" in EU banking system',
      ],
    },
    example: {
      title: 'Hypothetical: Chinese SOE "China Power International" exits EU operations',
      situation: [
        'Closes 3 gas plants in Spain and Italy',
        'Has 200,000 EUA surplus from unconsumed free allocations',
        'Objective: complete liquidation of EU assets and repatriation to China',
      ],
      solution: [
        'Swap to CEA provides instant repatriation',
        'Trade-off: Loss 8% (EUR16.15M CEA value vs EUR17.6M EUA sale) = -EUR1.45M',
        'But eliminates: FX spread (EUR264k) + capital controls risk + timing risk',
        'Net real cost: ~EUR1.2M for certainty and speed',
        'Decision: If SOE values speed and capital repatriation certainty more than EUR1.2M, swap makes sense',
      ],
    },
    economics: [
      { value: '-EUR1.45M', label: 'Value difference (8%)', color: colors.danger },
      { value: '+EUR264k', label: 'FX spread avoided', color: colors.success },
      { value: '~EUR1.2M', label: 'Net cost for certainty & speed', color: colors.accent },
    ],
  },
  {
    id: 5,
    icon: '🏢',
    iconClass: 's5',
    title: 'Offshore Treasury',
    titleEn: 'Offshore Treasury Management',
    tag: 'SPV Optimization',
    description: 'Multinationals with complex holding structures using HK SPV for treasury management',
    metrics: [
      { value: '0%', label: 'Withholding Tax' },
      { value: 'EUR40M', label: 'Transfer Value' },
    ],
    context: 'Multinationals with complex holding structures that hold EUA in EU subsidiary (e.g., Luxembourg, Netherlands), have China operations generating profit but cannot easily repatriate (restrictions), and use Hong Kong SPV for regional treasury management. Objective: Balance regional assets without moving cash cross-border directly. Structure example: Parent (Swiss HQ) with EU Subsidiary (Netherlands) holding 500,000 EUA, China WFOE (Shanghai) holding 150M RMB cash, and HK Treasury SPV as regional cash pool.',
    optionA: {
      title: 'Problems with Standard Approach',
      steps: [
        'EU sub wants to distribute dividends to HQ: subject to 15% withholding tax',
        'China WFOE wants to distribute profit: capital controls + SAFE audit',
      ],
      issues: [
        'Subject to withholding tax 15%',
        'Capital controls and SAFE audit requirements',
        'Solution: Use carbon assets as "internal currency" between subsidiaries',
      ],
    },
    optionB: {
      title: 'Swap Execution Flow',
      steps: [
        '1. EU sub transfers 500,000 EUA to HK Treasury SPV (intra-group transfer)',
        '2. HK Treasury SPV swap EUA for 5,000,000 CEA with Nihao',
        '3. HK Treasury SPV transfers CEA to China WFOE',
        '4. China WFOE sells CEA gradually on market (315M yuan = EUR40.4M)',
        '5. China WFOE uses proceeds for working capital or reinvestment in China',
      ],
      benefits: [
        'No withholding tax: Asset transfer intra-group, not cash dividend',
        'No capital controls: CEA considered "inventory commodity" in China accounting',
        'Better FX rate: Avoid EU cash to RMB conversion with bank spread',
        'Flexibility: CEA can be held until price is favorable for sale',
      ],
    },
    example: {
      title: 'Use Case: Danone or Similar FMCG with Large China Operations',
      situation: [
        'EU dairy plants have reduced emissions: EUA surplus',
        'China yogurt factories need working capital but profit blocked by restrictions',
      ],
      solution: [
        'Swap EUA to CEA permits internal value transfer without cross-border cash',
        'Carbon assets become "internal currency" for regional treasury optimization',
      ],
    },
    economics: [
      { value: '0%', label: 'Withholding Tax (vs 15%)', color: colors.success },
      { value: 'Zero', label: 'Capital Controls Friction', color: colors.success },
      { value: 'Better', label: 'Effective FX Rate', color: colors.success },
    ],
  },
  {
    id: 6,
    icon: '📈',
    iconClass: 's6',
    title: 'Portfolio Diversification',
    titleEn: 'Hedging and Portfolio Diversification',
    tag: 'Institutional Investors',
    description: 'Pension funds, sovereign wealth seeking China exposure but cannot access directly',
    metrics: [
      { value: '30%', label: 'CEA Allocation Target' },
      { value: 'Low', label: 'Correlation with EUA' },
    ],
    context: 'Institutional investors (pension funds, sovereign wealth) that hold EUA as climate-aligned investment (ESG mandates), seek geographic diversification in carbon exposure, and see China market potential but cannot access directly. Current portfolio: 100% EUA exposure (EUR88M). Risk concentration: Geographic (100% EU policy risk), Regulatory (vulnerable to EU ETS reforms, MSR changes), Correlation (EUA correlated with EU gas prices at 89% at peak). Desired portfolio: 70% EUA / 30% CEA for diversification benefits.',
    optionA: {
      title: 'Problem: No Mechanism to Buy CEA Directly',
      steps: [],
      issues: [
        'Hong Kong Core Climate platform: only voluntary credits (CCER), not compliance CEA',
        'Shanghai Exchange: closed to foreigners without WFOE',
        'OTC brokers: non-existent for CEA international purchases',
        'Result: There is no free mechanism for foreign institutional investor to buy CEA',
      ],
    },
    optionB: {
      title: 'Swap Solution via Nihao',
      steps: [],
      benefits: [
        'Nihao offers access: Institutional investor swap EUA to CEA',
        'Custody in HK: CEA kept in secure custody (beneficiary ownership)',
        'Liquidity at exit: When investor wants to sell, Nihao facilitates',
        'Fee justified: Investor pays 2% intermediation fee (EUR528k) for access to otherwise inaccessible market',
      ],
    },
    example: {
      title: 'Diversification Thesis',
      situation: [
        'Current: 100% EUA exposure = 100% EU policy risk',
        'Desired: 70% EUA / 30% CEA',
        'Benefits: Geographic split (70% EU / 30% China), Low correlation (CEA driven by China policy, not EU gas)',
        'Upside optionality: CEA potential +200% vs EUA +50%',
      ],
      solution: [
        'Sell 30% EUA (300,000 tons) = EUR26.4M cash',
        'Use Nihao swap service to convert to CEA',
        'Hold CEA in Nihao Hong Kong custody',
        'Achieve desired 70/30 portfolio allocation',
      ],
    },
    economics: [
      { value: 'Access', label: 'To otherwise inaccessible China market', color: colors.success },
      { value: 'Secure', label: 'Hong Kong custody arrangement', color: colors.success },
      { value: '2%', label: 'Intermediation fee (justified for access)', color: colors.accent },
    ],
  },
];

// Comparison table data - EXACT from swap-analysis.html
const comparisonData = [
  { criteria: 'Execution Speed', sale: '2-5 days (spot market)', swap: '2-5 days (OTC swap)', winner: 'tie' },
  { criteria: 'Transaction Costs', sale: '0.1-0.3% (exchange fees)', swap: '1-2% (intermediation)', winner: 'sale' },
  { criteria: 'Capital Repatriation', sale: '4-8 weeks (China controls)', swap: '48h (commodity transfer)', winner: 'swap' },
  { criteria: 'FX Risk', sale: 'EUR/RMB exposure 1-2 months', swap: 'Zero (no cash conversion)', winner: 'swap' },
  { criteria: 'Regulatory Complexity', sale: 'Medium (cash transfer scrutiny)', swap: 'Low (barter trade)', winner: 'swap' },
  { criteria: 'Access to CEA', sale: 'Very difficult (requires WFOE)', swap: 'Immediate (via intermediary)', winner: 'swap' },
  { criteria: 'Tax Efficiency', sale: 'Profit taxable immediately', swap: 'Deferral (no cash realized)', winner: 'swap' },
  { criteria: 'Downstream Flexibility', sale: 'Cash = maximum flexibility', swap: 'CEA = limited to China use', winner: 'sale' },
];

// Document types for upload
const documentTypes: DocumentType[] = [
  { id: 'business_reg', name: 'Business Registration Certificate', description: 'Company registration proof', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'articles', name: 'Articles of Incorporation', description: 'Company formation documents', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Recent statement showing company name (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'company' },
  { id: 'gov_id', name: 'Government-issued ID', description: 'Passport or national ID of representative', required: true, uploaded: false, status: 'pending', category: 'representative' },
  { id: 'proof_address', name: 'Proof of Address', description: 'Utility bill or bank statement (< 3 months)', required: true, uploaded: false, status: 'pending', category: 'representative' },
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
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
      style={{
        background: isComplete
          ? `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`
          : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)`,
      }}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl p-8"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-6 h-6" style={{ color: colors.textSecondary }} />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Complete Your KYC Documentation
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Upload the required documents to complete your account verification and unlock full platform access
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span style={{ color: colors.textSecondary }}>Progress</span>
                <span style={{ color: colors.primaryLight }}>{progress}%</span>
              </div>
              <div className="h-3 rounded-full" style={{ backgroundColor: colors.bgCardHover }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Company Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.secondaryLight }}>
                <Building2 className="w-5 h-5" />
                Company Documents
              </h3>
              <div className="grid gap-4">
                {companyDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onUpload={onUpload} color={colors.secondaryLight} />
                ))}
              </div>
            </div>

            {/* Representative Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#8b5cf6' }}>
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
              className="w-full py-4 rounded-xl font-semibold text-white transition-all"
              style={{
                background: canSubmit
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  : colors.bgCardHover,
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
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
      className="p-4 rounded-xl border transition-all cursor-pointer hover:border-opacity-100"
      style={{
        backgroundColor: colors.bgCardHover,
        borderColor: doc.uploaded ? colors.success : color,
        borderWidth: '1px',
        borderStyle: doc.uploaded ? 'solid' : 'dashed',
      }}
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
            <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
          ) : (
            <FileText className="w-5 h-5" style={{ color }} />
          )}
          <div>
            <div className="font-medium" style={{ color: colors.textPrimary }}>
              {doc.name}
              {doc.required && <span style={{ color: colors.danger }}> *</span>}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {doc.description}
            </div>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: doc.uploaded ? `${colors.success}20` : `${color}20`,
            color: doc.uploaded ? colors.success : color,
          }}
        >
          {doc.uploaded ? 'Uploaded' : 'Upload'}
        </div>
      </div>
    </div>
  );
};

// Scenario Detail Panel Component - COMPREHENSIVE with ALL content
const ScenarioDetailPanel = ({ scenario }: { scenario: ScenarioData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl p-8 mt-8"
      style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 mb-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{
            background: scenario.iconClass === 's1' ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` :
                        scenario.iconClass === 's2' ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)` :
                        scenario.iconClass === 's3' ? `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)` :
                        scenario.iconClass === 's4' ? `linear-gradient(135deg, #ef4444 0%, #f97316 100%)` :
                        scenario.iconClass === 's5' ? `linear-gradient(135deg, #10b981 0%, #3b82f6 100%)` :
                        `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`
          }}
        >
          {scenario.icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Scenario {scenario.id}: {scenario.titleEn}
          </h3>
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2"
            style={{ backgroundColor: colors.primary, color: 'white' }}
          >
            {scenario.tag}
          </span>
        </div>
      </div>

      {/* Context Box */}
      <div
        className="p-6 rounded-xl mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)`,
          border: `1px solid ${colors.accent}`,
        }}
      >
        <strong style={{ color: colors.accent }}>Context:</strong>{' '}
        <span style={{ color: colors.textSecondary }}>{scenario.context}</span>
      </div>

      {/* Options Comparison */}
      <h4 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
        Comparison: Why Swap Instead of Direct Sale?
      </h4>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Option A - Sale/Problem */}
        <div
          className="p-6 rounded-xl"
          style={{ border: `2px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.textMuted, color: 'white' }}
            >
              A
            </span>
            <span className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
              {scenario.optionA.title}
            </span>
          </div>

          {scenario.optionA.steps.length > 0 && (
            <div
              className="p-4 rounded-lg mb-4 font-mono text-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              {scenario.optionA.steps.map((step, i) => (
                <div key={i} className="flex gap-2 py-1">
                  <span style={{ color: colors.textMuted }}>{step.startsWith(String(i+1)) ? '' : `${i + 1}.`}</span>
                  <span style={{ color: colors.textSecondary }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {scenario.optionA.issues.length > 0 && (
            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: colors.danger }}>
                <AlertCircle className="w-4 h-4" />
                Problems & Frictions
              </h5>
              <ul className="space-y-2">
                {scenario.optionA.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="py-1 pl-6 relative text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    <span className="absolute left-0 font-bold" style={{ color: colors.danger }}>✗</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Option B - Swap (Recommended) */}
        <div
          className="p-6 rounded-xl relative"
          style={{
            border: `2px solid ${colors.success}`,
            background: `linear-gradient(180deg, rgba(22, 163, 74, 0.1) 0%, transparent 100%)`,
          }}
        >
          <div
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase"
            style={{ backgroundColor: colors.success, color: 'white' }}
          >
            RECOMMENDED
          </div>

          <div className="flex items-center gap-2 mb-4 mt-2">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.success, color: 'white' }}
            >
              B
            </span>
            <span className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
              {scenario.optionB.title}
            </span>
          </div>

          {scenario.optionB.steps.length > 0 && (
            <div
              className="p-4 rounded-lg mb-4 font-mono text-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              {scenario.optionB.steps.map((step, i) => (
                <div key={i} className="flex gap-2 py-1">
                  <span style={{ color: colors.textMuted }}>{step.startsWith(String(i+1)) ? '' : `${i + 1}.`}</span>
                  <span style={{ color: colors.textSecondary }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {scenario.optionB.benefits.length > 0 && (
            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: colors.success }}>
                <CheckCircle className="w-4 h-4" />
                Benefits
              </h5>
              <ul className="space-y-2">
                {scenario.optionB.benefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="py-1 pl-6 relative text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    <span className="absolute left-0 font-bold" style={{ color: colors.success }}>✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Example Box */}
      <div
        className="p-6 rounded-xl mb-8"
        style={{
          backgroundColor: colors.bgCardHover,
          borderLeft: `4px solid ${colors.accent}`,
        }}
      >
        <h5 className="font-semibold mb-4 text-lg" style={{ color: colors.textPrimary }}>
          💡 {scenario.example.title}
        </h5>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h6 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              📍 Situation
            </h6>
            <ul className="space-y-2">
              {scenario.example.situation.map((item, i) => (
                <li key={i} className="text-sm" style={{ color: colors.textPrimary }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              💡 Solution
            </h6>
            <ul className="space-y-2">
              {scenario.example.solution.map((item, i) => (
                <li key={i} className="text-sm" style={{ color: colors.textPrimary }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Economic Analysis Box */}
      <div
        className="p-6 rounded-xl"
        style={{
          background: `linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(30, 64, 175, 0.15) 100%)`,
          border: `1px solid ${colors.primary}`,
        }}
      >
        <h5 className="font-semibold mb-6 text-lg" style={{ color: colors.primaryLight }}>
          📊 Economic Analysis
        </h5>
        <div className="grid md:grid-cols-3 gap-4">
          {scenario.economics.map((item, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-xl"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              <div className="text-3xl font-extrabold mb-2" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export default function OnboardingPage() {
  const { logout } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentType[]>(documentTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<number>(1);
  const [activeNav, setActiveNav] = useState('overview');

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
    <div className="min-h-screen" style={{ backgroundColor: colors.bgDark, color: colors.textPrimary }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(13, 148, 136, 0.15) 0%, transparent 100%)',
          borderBottom: `1px solid ${colors.border}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              N
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Nihao Group
              </h1>
              <span className="text-xs uppercase tracking-widest" style={{ color: colors.textSecondary }}>
                Strategic Analysis Report
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: colors.bgCard }}>
              {['overview', 'scenarios', 'comparison'].map(nav => (
                <button
                  key={nav}
                  onClick={() => scrollToSection(nav)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: activeNav === nav ? colors.primary : 'transparent',
                    color: activeNav === nav ? 'white' : colors.textSecondary,
                  }}
                >
                  {nav.charAt(0).toUpperCase() + nav.slice(1)}
                </button>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/20"
              style={{ color: colors.danger }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Hero Section */}
        <section id="overview" className="text-center py-16 relative">
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(13, 148, 136, 0.2) 0%, transparent 70%)',
            }}
          />
          <h2 className="text-5xl font-extrabold mb-4 relative">
            Economic Scenarios for
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EUA→CEA Swap
            </span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8" style={{ color: colors.textSecondary }}>
            Detailed analysis of why EUA-holding entities would prefer swapping for CEA instead of direct market sale. Based on extensive research and current market data from EU ETS and China ETS markets.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: '📈', value: 'EUR88/t', label: 'Current EUA Price (January 2026)', color: colors.secondaryLight },
            { icon: '🇨🇳', value: '63 CNY/t', label: 'Current CEA Price (~EUR8/t)', color: colors.accent },
            { icon: '🔄', value: '1:10', label: 'EUA to CEA Swap Ratio', color: colors.primaryLight },
            { icon: '💰', value: '+212%', label: 'CEA Potential Upside 2030', color: colors.success },
          ].map((stat, i) => (
            <motion.div
              key={i}
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

        {/* Section 1: Price Comparison */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              1
            </div>
            <h3 className="text-2xl font-bold">Price Comparison & Projections</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* EUA Card */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: colors.secondaryLight }} />
              <div className="flex justify-between items-start mb-6">
                <div className="text-lg font-semibold">European Union Allowances (EUA)</div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: colors.secondaryLight }}
                >
                  EU ETS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold">EUR88</span>
                <span className="text-xl" style={{ color: colors.textSecondary }}>/tCO2</span>
              </div>
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>2030 Projection:</span>
                  <span className="font-semibold">EUR130-150/t</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>Potential Upside:</span>
                  <span className="font-semibold" style={{ color: colors.success }}>+48-70%</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>EU Gas Correlation:</span>
                  <span className="font-semibold">89% at peak</span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: colors.textSecondary }}>2024 Volume Traded:</span>
                  <span className="font-semibold">13.7 Gt CO2</span>
                </div>
              </div>
            </div>

            {/* CEA Card */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: colors.danger }} />
              <div className="flex justify-between items-start mb-6">
                <div className="text-lg font-semibold">Chinese Emission Allowances (CEA)</div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: colors.danger }}
                >
                  China ETS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold">63 CNY</span>
                <span className="text-xl" style={{ color: colors.textSecondary }}>/tCO2 (~EUR8)</span>
              </div>
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>2030 Projection (with reforms):</span>
                  <span className="font-semibold">200 CNY/t (~EUR25)</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>Potential Upside:</span>
                  <span className="font-semibold" style={{ color: colors.success }}>+212%</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.textSecondary }}>Upside vs EUA:</span>
                  <span className="font-semibold" style={{ color: colors.success }}>3-4x higher</span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: colors.textSecondary }}>Emissions Covered:</span>
                  <span className="font-semibold">~5.1 Gt CO2/year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight Box */}
          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(13, 148, 136, 0.1) 100%)`,
              border: `1px solid ${colors.success}`,
            }}
          >
            <strong style={{ color: colors.success }}>Key Investment Thesis:</strong>{' '}
            <span style={{ color: colors.textSecondary }}>
              CEA has growth potential <strong style={{ color: colors.textPrimary }}>3-4x higher</strong> than EUA.
              EUA: +48-70% upside to 2030 → CEA: +212% upside to 2030.
              The asymmetric opportunity justifies the swap for investors seeking China carbon exposure.
            </span>
          </div>
        </section>

        {/* Section 2: Scenarios */}
        <section id="scenarios" className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              2
            </div>
            <h3 className="text-2xl font-bold">The 6 Economic Scenarios</h3>
          </div>
          <p className="mb-4 text-lg" style={{ color: colors.textSecondary }}>
            Click on each scenario to see complete details, including step-by-step comparison of options,
            real-world examples, and economic analysis.
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            <span className="animate-pulse">👆</span>
            Select a scenario card below to view full analysis
          </div>

          {/* Scenario Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {scenariosData.map(scenario => (
              <motion.div
                key={scenario.id}
                className="p-6 rounded-2xl cursor-pointer transition-all"
                style={{
                  backgroundColor: activeScenario === scenario.id ? 'transparent' : colors.bgCard,
                  border: `2px solid ${activeScenario === scenario.id ? colors.primary : colors.border}`,
                  background: activeScenario === scenario.id
                    ? `linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, transparent 100%)`
                    : colors.bgCard,
                  opacity: activeScenario === scenario.id ? 1 : 0.5,
                }}
                onClick={() => setActiveScenario(scenario.id)}
                whileHover={{ y: -4, borderColor: colors.primary, opacity: 1 }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{
                    background: scenario.iconClass === 's1' ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` :
                                scenario.iconClass === 's2' ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.danger} 100%)` :
                                scenario.iconClass === 's3' ? `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)` :
                                scenario.iconClass === 's4' ? `linear-gradient(135deg, #ef4444 0%, #f97316 100%)` :
                                scenario.iconClass === 's5' ? `linear-gradient(135deg, #10b981 0%, #3b82f6 100%)` :
                                `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`
                  }}
                >
                  {scenario.icon}
                </div>
                <h4 className="font-bold text-lg mb-2">{scenario.title}</h4>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                  {scenario.description}
                </p>
                <div className="flex gap-4">
                  {scenario.metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="flex-1 text-center p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="text-xl font-bold" style={{ color: colors.primaryLight }}>
                        {metric.value}
                      </div>
                      <div className="text-xs" style={{ color: colors.textMuted }}>
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active Scenario Detail */}
          <AnimatePresence mode="wait">
            {activeScenario && (
              <ScenarioDetailPanel
                key={activeScenario}
                scenario={scenariosData.find(s => s.id === activeScenario)!}
              />
            )}
          </AnimatePresence>
        </section>

        {/* Section 3: Comparison Table */}
        <section id="comparison" className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              3
            </div>
            <h3 className="text-2xl font-bold">Detailed Comparison: Swap vs. Direct Sale</h3>
          </div>

          <div
            className="rounded-2xl p-6 overflow-x-auto"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <th className="text-left p-4 font-semibold rounded-tl-lg">Criteria</th>
                  <th className="text-left p-4 font-semibold">Direct EUA Sale</th>
                  <th className="text-left p-4 font-semibold">EUA to CEA Swap</th>
                  <th className="text-center p-4 font-semibold rounded-tr-lg">Winner</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      {row.criteria}
                    </td>
                    <td className="p-4" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.sale}
                    </td>
                    <td className="p-4" style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                      {row.swap}
                    </td>
                    <td className="p-4 text-center" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <span
                        className="px-4 py-1 rounded-full text-xs font-bold uppercase"
                        style={{
                          backgroundColor: row.winner === 'swap' ? 'rgba(22, 163, 74, 0.2)' :
                                          row.winner === 'sale' ? 'rgba(59, 130, 246, 0.2)' :
                                          'rgba(100, 116, 139, 0.2)',
                          color: row.winner === 'swap' ? colors.success :
                                row.winner === 'sale' ? colors.secondaryLight :
                                colors.textSecondary,
                        }}
                      >
                        {row.winner === 'swap' ? 'SWAP' : row.winner === 'sale' ? 'SALE' : 'TIE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="p-6 rounded-xl text-center mt-8"
            style={{
              background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)`,
              border: `1px solid ${colors.accent}`,
            }}
          >
            <strong style={{ color: colors.accent }}>Conclusion:</strong>{' '}
            <span style={{ color: colors.textSecondary }}>
              Swap wins when <strong style={{ color: colors.textPrimary }}>non-cash benefits are valuable</strong> (speed, regulatory simplicity, access)
              and when there is a <strong style={{ color: colors.textPrimary }}>specific use case for CEA</strong> in China.
              Score: Swap wins 5 criteria, Sale wins 2, Tie on 1.
            </span>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer
        className="text-center py-12"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <p className="font-semibold" style={{ color: colors.textSecondary }}>
          Nihao Group | Strategic Analysis Report | January 2026
        </p>
        <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
          Analysis based on extensive research and current market data from EU ETS and China ETS markets
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
