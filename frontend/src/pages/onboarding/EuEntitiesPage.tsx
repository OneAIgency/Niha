import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  DollarSign,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Briefcase,
  BarChart3,
  AlertTriangle,
  Calendar,
  Layers,
  Wallet,
  BadgeCheck,
  Building,
  PiggyBank,
} from 'lucide-react';
import { OnboardingLayout, colors } from '../../components/onboarding';

// =============================================================================
// Part 1: The Nihao Platform Workflow for EU Entities
// =============================================================================

const WorkflowStep: React.FC<{
  number: number;
  title: string;
  objective: string;
  timeline: string;
  outcome: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ number, title, objective, timeline, outcome, children, isActive, onClick }) => {
  return (
    <div
      className="border rounded-lg overflow-hidden cursor-pointer transition-all"
      style={{
        borderColor: isActive ? colors.primary : colors.border,
        backgroundColor: isActive ? `${colors.primary}10` : colors.bgCard,
      }}
      onClick={onClick}
    >
      <div className="p-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl"
          style={{ backgroundColor: colors.primary, color: 'white' }}
        >
          {number}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{title}</h4>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{timeline}</p>
        </div>
        <ArrowRight
          className={`w-5 h-5 transition-transform ${isActive ? 'rotate-90' : ''}`}
          style={{ color: colors.textSecondary }}
        />
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t" style={{ borderColor: colors.border }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Objective</div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{objective}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
                  <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Outcome</div>
                  <div className="text-sm" style={{ color: colors.primary }}>{outcome}</div>
                </div>
              </div>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlatformWorkflow = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="space-y-4">
      {/* Step 1: KYC Process */}
      <WorkflowStep
        number={1}
        title="KYC (Know Your Customer) Process & Account Approval"
        objective="Establish EU entity as approved participant in Nihao's marketplace"
        timeline="Weeks 1-3"
        outcome="Active trading account with verified credentials, API access, custody account, wire transfer details"
        isActive={activeStep === 1}
        onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: 1, title: 'Initial Application', time: 'Instant', desc: 'Submit account opening application via platform' },
              { num: 2, title: 'KYC Documentation', time: 'Instant', desc: 'Upload via secure portal, multi-format acceptance' },
              { num: 3, title: 'Due Diligence', time: '5-10 days', desc: 'Third-party verification, AML/sanctions screening' },
              { num: 4, title: 'Enhanced DD', time: '3-7 days', desc: 'If required for specific jurisdictions' },
              { num: 5, title: 'Final Approval', time: 'Instant', desc: 'Account credentials, trading platform access enabled' },
            ].map((item) => (
              <div key={item.num} className="p-3 rounded-lg text-center" style={{ backgroundColor: colors.bgCard }}>
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: colors.secondary, color: 'white' }}>
                  {item.num}
                </div>
                <div className="font-medium text-xs mb-1" style={{ color: colors.textPrimary }}>{item.title}</div>
                <div className="text-xs mb-1" style={{ color: colors.accent }}>{item.time}</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>Total KYC Timeline:</div>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="px-3 py-1 rounded text-xs" style={{ backgroundColor: colors.success, color: 'white' }}>Typical: 1-2 weeks (external verification)</span>
              <span className="px-3 py-1 rounded text-xs" style={{ backgroundColor: colors.secondary, color: 'white' }}>With Enhanced DD: 2-3 weeks</span>
            </div>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 2: Account Funding */}
      <WorkflowStep
        number={2}
        title="Account Funding - Wire Transfer of Capital"
        objective="Establish EU entity's capital available for CEA/EUA acquisitions"
        timeline="Week 3 (1-5 days bank processing)"
        outcome="EU entity has immediate access to capital for CEA acquisitions"
        isActive={activeStep === 2}
        onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.primary }}>
                <CreditCard className="w-4 h-4" />
                Wire Transfer Initiation
              </h5>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Amount range: €100,000 - €50,000,000+ (no maximum)</li>
                <li>• Typical amounts: €500,000 - €10,000,000 for active traders</li>
                <li>• Transfer to Nihao&apos;s Hong Kong client account</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.secondary }}>
                <Building className="w-4 h-4" />
                Banking Details Provided
              </h5>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Beneficiary: Nihao Group Hong Kong Limited (Client Account)</li>
                <li>• Bank: HSBC or Citibank Hong Kong</li>
                <li>• SWIFT code for international settlement</li>
                <li>• Purpose code: &quot;CEA/EUA Trading Account&quot;</li>
              </ul>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.accent }}>Wire Transfer Mechanics:</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-xs" style={{ color: colors.textMuted }}>Intra-Europe</div>
                <div className="font-bold text-sm" style={{ color: colors.success }}>1-3 business days</div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-xs" style={{ color: colors.textMuted }}>International</div>
                <div className="font-bold text-sm" style={{ color: colors.secondary }}>2-5 business days</div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-xs" style={{ color: colors.textMuted }}>Fees</div>
                <div className="font-bold text-sm" style={{ color: colors.accent }}>€20-100 per transfer</div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-xs" style={{ color: colors.textMuted }}>Total Timeline</div>
                <div className="font-bold text-sm" style={{ color: colors.primary }}>3-7 days total</div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>Account Balance Management:</h5>
            <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
              <li>• View balance 24/7 via portal</li>
              <li>• Withdrawal requests available (5-7 day processing)</li>
              <li>• Redeposit available at any time</li>
              <li>• Monthly account statements provided</li>
              <li>• Tax reporting statements available for year-end</li>
            </ul>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 3: Marketplace Access */}
      <WorkflowStep
        number={3}
        title="Marketplace Access - Browse CEA Seller Offerings"
        objective="EU entity accesses marketplace showing available CEA offerings from online sellers"
        timeline="Instant access (all sellers online)"
        outcome="EU entity selects preferred CEA sellers from live marketplace"
        isActive={activeStep === 3}
        onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: colors.primary }}>
              <BarChart3 className="w-4 h-4" />
              Dashboard Overview - Real-time CEA Listings
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Seller name/category', 'CEA quantity offered', 'Ask price per tonne', 'Delivery timeline', 'Terms summary', 'Credibility score', 'Transaction history', 'Watchlist'].map((item) => (
                <div key={item} className="p-2 rounded text-xs text-center" style={{ backgroundColor: colors.bgCardHover, color: colors.textSecondary }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Industrial Manufacturers', origin: 'China ETS allocation', qty: '50,000-500,000 tonnes', price: '¥75-95/t (€11-14/t)', delivery: '10-20 days', color: colors.primary },
              { title: 'Financial Trading Companies', origin: 'Accumulated surplus', qty: '100,000-5,000,000 tonnes', price: '¥78-90/t (€11.5-13/t)', delivery: '5-15 days', color: colors.secondary },
              { title: 'Conglomerate Trading Arms', origin: 'Portfolio optimization', qty: '500,000-10,000,000 tonnes', price: '¥80-92/t (€12-13.5/t)', delivery: '15-30 days', color: colors.accent },
              { title: 'Export-Focused Manufacturers', origin: 'Production surplus', qty: '100,000-2,000,000 tonnes', price: '¥75-88/t (€11-13/t)', delivery: '10-25 days', color: colors.success },
            ].map((seller) => (
              <div key={seller.title} className="p-3 rounded-lg border" style={{ borderColor: seller.color }}>
                <h6 className="font-medium text-sm mb-2" style={{ color: seller.color }}>{seller.title}</h6>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div style={{ color: colors.textSecondary }}><strong>Origin:</strong> {seller.origin}</div>
                  <div style={{ color: colors.textSecondary }}><strong>Quantity:</strong> {seller.qty}</div>
                  <div style={{ color: colors.textSecondary }}><strong>Price:</strong> {seller.price}</div>
                  <div style={{ color: colors.textSecondary }}><strong>Delivery:</strong> {seller.delivery}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>Marketplace Transparency & Competition:</h5>
            <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
              <li>• Price history (30-90 day pricing trends)</li>
              <li>• Multiple sellers typically available simultaneously</li>
              <li>• Typical competitive spread: ¥3-8/tonne between sellers (4-10% pricing variance)</li>
              <li>• Access timeline: Immediate after account funding</li>
            </ul>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 4: Seller Selection, Order Placement & CEA Delivery */}
      <WorkflowStep
        number={4}
        title="Seller Selection, Order Placement & CEA Delivery"
        objective="EU entity places order to purchase CEA from selected seller and receives CEA in custody"
        timeline="Order: Instant | Delivery: 10-30 days (China ETS registry)"
        outcome="CEA delivered and held in Nihao custody account on behalf of EU entity"
        isActive={activeStep === 4}
        onClick={() => setActiveStep(activeStep === 4 ? 0 : 4)}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>Seller Selection Criteria:</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Price competitiveness', 'Quantity needed', 'Delivery timeline', 'Seller reliability', 'Payment terms', 'Total value optimization'].map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: colors.success }} />
                  <span className="text-xs" style={{ color: colors.textSecondary }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: 'Order Initiation', desc: 'Select offering, click "Place Order", details auto-populated' },
              { step: 'Order Specification', desc: 'Confirm quantity, delivery destination, invoice preferences' },
              { step: 'Order Confirmation', desc: 'Reference number generated, 24-hour seller confirmation window' },
            ].map((item, idx) => (
              <div key={item.step} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
                <div className="w-6 h-6 rounded-full mb-2 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colors.secondary, color: 'white' }}>
                  {idx + 1}
                </div>
                <div className="font-medium text-xs mb-1" style={{ color: colors.textPrimary }}>{item.step}</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg border" style={{ borderColor: colors.accent }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.accent }}>Order & Settlement Structure:</h5>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="font-bold" style={{ color: colors.primary }}>100%</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>Full Payment Upfront</div>
              </div>
              <div>
                <div className="font-bold" style={{ color: colors.secondary }}>10-30 days</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>Registry Delivery Period</div>
              </div>
            </div>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 5: Swap Offer Marketplace Access */}
      <WorkflowStep
        number={5}
        title="CEA-to-EUA Swap Offer Marketplace Access"
        objective="EU entity accesses marketplace where online counterparties offer to swap EUA for CEA"
        timeline="Instant access (parallel with Step 4)"
        outcome="EU entity selects EUA holder from live swap marketplace"
        isActive={activeStep === 5}
        onClick={() => setActiveStep(activeStep === 5 ? 0 : 5)}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-3" style={{ color: colors.primary }}>Swap Marketplace Participants:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Non-EU multinational corporations with EUA holdings',
                'Non-EU financial institutions seeking CEA diversification',
                'International trading companies',
                'Government-linked entities seeking portfolio rebalancing',
              ].map((p) => (
                <div key={p} className="p-2 rounded text-xs" style={{ backgroundColor: colors.bgCardHover, color: colors.textSecondary }}>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.primary }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>Type A: Fixed-Ratio Swaps</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Offered by: Financial traders, multinationals</li>
                <li>• Example: &quot;1,000,000 EUA for 11,000,000 CEA&quot;</li>
                <li>• Timing: 15-30 days</li>
                <li>• Volume: 100,000-10,000,000 tonnes</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.secondary }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.secondary }}>Type B: Market-Adjusted Swaps</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Ratio adjusts based on market prices at settlement</li>
                <li>• Flexibility: Protects both parties from price drift</li>
                <li>• Timing: 15-45 days</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.accent }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.accent }}>Type C: Premium/Discount Swaps</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Fixed premium or discount to market price</li>
                <li>• Example: &quot;EUA at 2% discount to settlement date price&quot;</li>
                <li>• Price certainty with market flexibility</li>
                <li>• Timing: 15-30 days</li>
              </ul>
              <div className="mt-2 px-2 py-1 rounded text-xs" style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                Full payment at order confirmation
              </div>
            </div>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 6: Swap Execution */}
      <WorkflowStep
        number={6}
        title="Swap Execution - CEA-to-EUA Exchange"
        objective="Execute bilateral swap between EU entity (providing CEA) and EUA holder (providing EUA)"
        timeline="Initiation: Instant | Settlement: 10-14 days (registry transfers)"
        outcome="EU entity now holds EUA certificates in EU ETS registry account"
        isActive={activeStep === 6}
        onClick={() => setActiveStep(activeStep === 6 ? 0 : 6)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {[
                { title: 'Swap Agreement Confirmation', desc: 'Terms finalized: CEA/EUA quantities, exchange ratio, settlement timeline' },
                { title: 'Legal Documentation', desc: 'Nihao prepares bilateral swap agreement with all specifications' },
                { title: 'Pre-Settlement Verification', desc: 'Both parties\' holdings verified, registries coordinated' },
              ].map((item, idx) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: colors.primary, color: 'white' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: colors.textPrimary }}>{item.title}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { title: 'Settlement Phase 1: CEA Transfer', desc: 'CEA transferred to EUA holder, registry updated (T+2 to T+5 days)' },
                { title: 'Settlement Phase 2: EUA Transfer', desc: 'EUA transferred to EU entity, registry updated (T+3 to T+7 days)' },
                { title: 'Final Settlement Confirmation', desc: 'Both parties confirm receipt, custody accounts released' },
              ].map((item, idx) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: colors.success, color: 'white' }}>
                    {idx + 4}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: colors.textPrimary }}>{item.title}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.primary }}>
            <span className="font-bold text-white">Swap Execution Timeline: 10-14 days (signing to final settlement)</span>
          </div>
        </div>
      </WorkflowStep>

      {/* Step 7: EUA Certification and Delivery */}
      <WorkflowStep
        number={7}
        title="EUA Certification and Delivery Confirmation"
        objective="Confirm EU entity's EUA holdings and prepare for compliance/trading use"
        timeline="3-7 days (verification + documentation)"
        outcome="Final Settlement Report with full documentation for regulatory audit trail"
        isActive={activeStep === 7}
        onClick={() => setActiveStep(activeStep === 7 ? 0 : 7)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.primary }}>
                <BadgeCheck className="w-4 h-4" />
                EUA Account Verification
              </h5>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Verify EUA balance in primary EU ETS registry account</li>
                <li>• Quantity received confirmation</li>
                <li>• Serial numbers (if tracked)</li>
                <li>• Compliance year designation</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.secondary }}>
                <FileText className="w-4 h-4" />
                Regulatory Documentation Package
              </h5>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Original purchase order (CEA acquisition)</li>
                <li>• Swap agreement (CEA-to-EUA exchange)</li>
                <li>• Settlement confirmations & registry transfers</li>
                <li>• Tax reporting forms for audit trail</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium text-sm mb-2" style={{ color: colors.accent }}>EUA Integration Options:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Hold for future compliance year',
                'Trade on secondary market (EEX, ICE)',
                'Use for immediate compliance',
                'Collateral for financing',
              ].map((option) => (
                <div key={option} className="p-2 rounded text-xs text-center" style={{ backgroundColor: colors.bgCardHover, color: colors.textSecondary }}>
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border-2" style={{ borderColor: colors.success }}>
            <h5 className="font-bold text-sm text-center mb-2" style={{ color: colors.success }}>
              Total Workflow Timeline: 6-8 weeks
            </h5>
          </div>
        </div>
      </WorkflowStep>
    </div>
  );
};

// =============================================================================
// Part 2: Economic Advantages
// =============================================================================

const EconomicAdvantages = () => {
  const [activeTab, setActiveTab] = useState('price');

  const tabs = [
    { id: 'price', label: 'Price Advantage', icon: TrendingUp },
    { id: 'cost', label: 'Cost Reduction', icon: PiggyBank },
    { id: 'capital', label: 'Working Capital', icon: Wallet },
    { id: 'regulatory', label: 'Regulatory Benefits', icon: Shield },
  ];

  const tabContent: Record<string, React.ReactNode> = {
    price: (
      <div className="space-y-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Comparative Pricing Analysis</h4>

        {/* Option A: Direct Exchange Purchase */}
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger, backgroundColor: `${colors.danger}10` }}>
          <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.danger }}>
            <AlertTriangle className="w-5 h-5" />
            Option A: Direct Exchange Purchase (EEX/ICE) - Baseline
          </h5>
          <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
            EU entity needs 1,000,000 EUA for compliance
          </p>
          <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
            <div className="flex justify-between">
              <span>Market price:</span>
              <span className="font-bold">€95/tonne</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>1,000,000 EUA</span>
            </div>
            <div className="flex justify-between">
              <span>Gross cost:</span>
              <span>€95,000,000</span>
            </div>
            <div className="border-t pt-2 mt-2" style={{ borderColor: colors.border }}>
              <div className="flex justify-between text-xs">
                <span>Exchange fees (0.1-0.2%):</span>
                <span>€95,000-190,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Broker/dealer spread (0.2-0.3%):</span>
                <span>€190,000-285,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Market impact (0.5-1.5%):</span>
                <span>€475,000-1,425,000</span>
              </div>
            </div>
            <div className="border-t pt-2 mt-2" style={{ borderColor: colors.danger }}>
              <div className="flex justify-between font-bold" style={{ color: colors.danger }}>
                <span>Total cost:</span>
                <span>€95,760,000-97,185,000</span>
              </div>
              <div className="flex justify-between font-bold" style={{ color: colors.danger }}>
                <span>Effective price:</span>
                <span>€95.76-97.19/tonne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timing-Optimized Advantage */}
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}>
          <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.success }}>
            <Clock className="w-5 h-5" />
            Nihao Bilateral Strategy with Timing Optimization
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded" style={{ backgroundColor: colors.bgCard }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>Market Timing Context:</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Current EUA Q1 price (low season): €88/tonne</li>
                <li>• Forecast Q3 price (high season): €110/tonne</li>
                <li>• EU entity needs EUA for Q4 compliance</li>
              </ul>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: colors.bgCard }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>Nihao Strategy:</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Non-EU seller with CEA (~€10-11/tonne)</li>
                <li>• 3-month forward contract</li>
                <li>• Agree today at €87/tonne effective CEA value</li>
                <li>• Locked-in forward price: €87/tonne</li>
              </ul>
            </div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: colors.success }}>
            <div className="text-xl font-bold text-white">Timing Advantage: €8-18/tonne</div>
            <div className="text-sm text-white opacity-90">(€8,000,000-18,000,000 value for 1,000,000 EUA)</div>
          </div>
        </div>
      </div>
    ),

    cost: (
      <div className="space-y-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Transaction Cost Savings</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exchange Trading Costs */}
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Trading Costs:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li className="flex justify-between">
                <span>Exchange membership fee:</span>
                <span>€5,000-50,000/year</span>
              </li>
              <li className="flex justify-between">
                <span>Trading fees:</span>
                <span>0.2-0.5% per transaction</span>
              </li>
              <li className="flex justify-between">
                <span>Broker commissions:</span>
                <span>0.2-0.3%</span>
              </li>
              <li className="flex justify-between">
                <span>Bid-ask spread:</span>
                <span>0.3-0.5%</span>
              </li>
              <li className="flex justify-between">
                <span>Market impact (large trades):</span>
                <span>0.5-2%</span>
              </li>
              <li className="flex justify-between border-t pt-2 font-bold" style={{ borderColor: colors.danger, color: colors.danger }}>
                <span>Total for 1M EUA:</span>
                <span>€95,000-450,000</span>
              </li>
            </ul>
          </div>

          {/* Nihao Bilateral Costs */}
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Bilateral Costs:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li className="flex justify-between">
                <span>KYC setup (one-time):</span>
                <span>€10,000-30,000</span>
              </li>
              <li className="flex justify-between">
                <span>Account funding fees:</span>
                <span>€50-100 per wire</span>
              </li>
              <li className="flex justify-between">
                <span>Facilitation fee:</span>
                <span>0.5-1% per transaction</span>
              </li>
              <li className="flex justify-between">
                <span>No exchange membership:</span>
                <span style={{ color: colors.success }}>€0</span>
              </li>
              <li className="flex justify-between">
                <span>No repeated KYC:</span>
                <span style={{ color: colors.success }}>€0</span>
              </li>
              <li className="flex justify-between border-t pt-2 font-bold" style={{ borderColor: colors.success, color: colors.success }}>
                <span>Total for 1M EUA:</span>
                <span>€50,000-110,000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.primary }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Cost Savings: €45,000-340,000 per transaction</div>
            <div className="text-sm mt-1" style={{ color: colors.primaryLight }}>0.05-0.35% savings per transaction</div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h5 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Annual Savings (5 transactions/year):</h5>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-bold" style={{ color: colors.danger }}>€475K-2.25M</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Exchange costs</div>
            </div>
            <div>
              <div className="font-bold" style={{ color: colors.success }}>€250K-550K</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Nihao costs</div>
            </div>
            <div>
              <div className="font-bold" style={{ color: colors.primary }}>€225K-1.7M</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Annual savings</div>
            </div>
          </div>
        </div>
      </div>
    ),

    capital: (
      <div className="space-y-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Payment Terms Flexibility</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Market:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.danger }} />
                T+2 settlement mandatory
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.danger }} />
                Pre-funding required (100% upfront)
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.danger }} />
                No payment flexibility
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.danger }} />
                Working capital locked up for 2-3 days minimum
              </li>
            </ul>
            <div className="mt-3 p-2 rounded text-center" style={{ backgroundColor: `${colors.danger}15` }}>
              <div className="text-sm" style={{ color: colors.danger }}>Interest cost on locked capital:</div>
              <div className="font-bold" style={{ color: colors.danger }}>€25,000-75,000 per transaction</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Bilateral:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                Instant order confirmation (all parties online)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                Full payment at order - funds secured in client account
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                No exchange settlement delays
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                Transparent fee structure (no hidden costs)
              </li>
            </ul>
            <div className="mt-3 p-2 rounded text-center" style={{ backgroundColor: `${colors.success}15` }}>
              <div className="text-sm" style={{ color: colors.success }}>Total cost savings:</div>
              <div className="font-bold" style={{ color: colors.success }}>€45,000-340,000 per transaction</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.primary }}>
          <div className="text-center">
            <div className="text-xl font-bold text-white">Annual Savings (5 transactions): €125,000-750,000</div>
          </div>
        </div>
      </div>
    ),

    regulatory: (
      <div className="space-y-6">
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Reduced Regulatory Scrutiny</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Trading Profile:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• All trades publicly visible</li>
              <li>• Trading data available to regulators (ESMA)</li>
              <li>• Large purchases trigger market surveillance inquiries</li>
              <li>• Potential regulatory interviews or investigation</li>
              <li className="font-bold" style={{ color: colors.danger }}>
                Compliance cost: €50,000-500,000 per investigation
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Bilateral Structure:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Transactions remain confidential</li>
              <li>• Non-public deal reduces regulatory visibility</li>
              <li>• Lower compliance scrutiny probability</li>
              <li>• Avoids market surveillance flagging</li>
              <li className="font-bold" style={{ color: colors.success }}>
                Expected savings: €25,000-250,000
              </li>
            </ul>
          </div>
        </div>

        <h4 className="font-semibold mb-4 mt-6" style={{ color: colors.textPrimary }}>Documentation and Audit Benefits</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Trading:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>• Multiple transaction records across platforms</li>
              <li>• Reconciliation required across multiple systems</li>
              <li>• Higher audit costs</li>
              <li>• More complex tax reporting</li>
            </ul>
            <div className="mt-3 p-2 rounded text-center" style={{ backgroundColor: `${colors.danger}15` }}>
              <div className="font-bold" style={{ color: colors.danger }}>Audit fees: €20,000-100,000/year</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Nihao Consolidated:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>• Single platform, consolidated reporting</li>
              <li>• Unified transaction history</li>
              <li>• Simplified audit trail</li>
              <li>• Unified tax reporting documentation</li>
            </ul>
            <div className="mt-3 p-2 rounded text-center" style={{ backgroundColor: `${colors.success}15` }}>
              <div className="font-bold" style={{ color: colors.success }}>Audit fees: €10,000-50,000/year</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.primary }}>
          <div className="text-center">
            <div className="text-xl font-bold text-white">Audit Cost Savings: €10,000-50,000 annually</div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? colors.primary : colors.bgCardHover,
                color: activeTab === tab.id ? 'white' : colors.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Part 3: KYC Documentation Requirements
// =============================================================================

const KycDocumentation = () => {
  const [activeCategory, setActiveCategory] = useState('corporate');

  const categories = [
    { id: 'corporate', label: 'Corporate Info', icon: Building2, count: 4 },
    { id: 'beneficial', label: 'Beneficial Ownership', icon: Users, count: 4 },
    { id: 'financial', label: 'Financial', icon: DollarSign, count: 4 },
    { id: 'compliance', label: 'Compliance', icon: Shield, count: 4 },
    { id: 'business', label: 'Business & Funds', icon: Briefcase, count: 3 },
    { id: 'verification', label: 'Verification', icon: BadgeCheck, count: 4 },
  ];

  const documents: Record<string, { num: number; title: string; details: string[] }[]> = {
    corporate: [
      {
        num: 1,
        title: 'Certificate of Incorporation/Registration',
        details: [
          'Official document from company registry',
          'Shows: Company name, registration number, establishment date, registered office',
          'Format: Original or certified copy',
          'Language: English translation if not in English',
        ],
      },
      {
        num: 2,
        title: 'Articles of Association / Constitutional Documents',
        details: [
          'Complete corporate bylaws',
          'Shows: Ownership structure, decision-making authority, shareholder rights',
          'Format: Original or certified copy',
          'Pages: 10-50 typically',
        ],
      },
      {
        num: 3,
        title: 'Board Resolution (Authorizing Carbon Trading)',
        details: [
          'Trading in carbon allowances authorization',
          'Entering into agreements with Nihao Group',
          'Designation of authorized traders',
          'Funds commitment authorization',
          'Required signatures: Board chair, company secretary',
        ],
      },
      {
        num: 4,
        title: 'Certificate of Good Standing',
        details: [
          'From company registry (EU member state registry)',
          'Shows: Company in good legal standing, no pending dissolution/liquidation',
          'Format: Official certificate',
          'Validity: Typically 6 months',
        ],
      },
    ],
    beneficial: [
      {
        num: 5,
        title: 'Beneficial Ownership Declaration',
        details: [
          'Complete declaration of all beneficial owners (25%+ ownership)',
          'Format: Standardized Nihao form or EU beneficial ownership registry extract',
          'Includes: Names, addresses, ID numbers, ownership percentages',
          'Signature: Company representative and beneficiaries',
        ],
      },
      {
        num: 6,
        title: 'Shareholder Register',
        details: [
          'Official shareholder list',
          'Shows: All shareholders, ownership percentages, shareholding dates',
          'Format: Company register extract',
          'Certification: Company seal/signature',
        ],
      },
      {
        num: 7,
        title: 'Organizational Chart',
        details: [
          'Visual representation of corporate structure',
          'Shows: Parent company, subsidiaries, intermediate holding companies',
          'Includes: Ownership percentages at each level',
          'Format: Diagram or flowchart',
        ],
      },
      {
        num: 8,
        title: 'Beneficial Owner Identification Documents',
        details: [
          'For each beneficial owner (25%+):',
          'Valid passport or government ID',
          'Proof of address (utility bill, bank statement, lease agreement)',
          'Dated within last 3-6 months',
        ],
      },
    ],
    financial: [
      {
        num: 9,
        title: 'Recent Financial Statements',
        details: [
          'Last 2-3 years of audited financial statements:',
          'Balance sheet (assets, liabilities, equity)',
          'Income statement (revenues, profits)',
          'Cash flow statement & notes',
          'Format: Audited and signed by external auditor',
        ],
      },
      {
        num: 10,
        title: 'Bank Reference Letter',
        details: [
          'From company\'s primary bank',
          'Confirms: Account holder status, account duration, creditworthiness',
          'Includes: Account balance (if available), transaction history',
          'Signature: Bank officer authorized to provide references',
        ],
      },
      {
        num: 11,
        title: 'Tax Compliance Certificate',
        details: [
          'Proof of good standing with tax authorities',
          'Format: Official government tax certificate',
          'Shows: No tax liens, no pending investigations',
          'Validity: Current (within 6 months)',
        ],
      },
      {
        num: 12,
        title: 'Credit Rating or Financial Verification',
        details: [
          'Optional: Credit rating from Dun & Bradstreet or similar',
          'Or: Bank financial verification of creditworthiness',
          'Shows: Financial stability and payment capability',
        ],
      },
    ],
    compliance: [
      {
        num: 13,
        title: 'Regulatory Licenses and Approvals',
        details: [
          'If applicable: Financial services licenses',
          'Environmental permits (if manufacturing)',
          'Sector-specific regulatory approvals',
          'Format: Official regulatory certificates',
        ],
      },
      {
        num: 14,
        title: 'Compliance Policies and Procedures',
        details: [
          'AML/CFT policy documentation',
          'Know Your Counterparty procedures',
          'Risk assessment framework',
          'Sanctions screening procedures',
        ],
      },
      {
        num: 15,
        title: 'List of Directors and Managers',
        details: [
          'Names and titles of all board members and senior management',
          'Includes: Email, phone number, role',
          'Format: Company-certified list',
          'Signature: Board or company secretary',
        ],
      },
      {
        num: 16,
        title: 'Authorized Signatories Documentation',
        details: [
          'Board resolution identifying authorized individuals for:',
          'Trading decisions',
          'Fund transfers',
          'Bilateral deal execution & settlement authorization',
        ],
      },
    ],
    business: [
      {
        num: 17,
        title: 'Business Description and Purpose Statement',
        details: [
          'Detailed description of company business',
          'Explanation of carbon allowance trading purpose:',
          'Compliance requirement, investment strategy, portfolio optimization, or risk management',
          'Document: Formal business description (1-3 pages)',
        ],
      },
      {
        num: 18,
        title: 'Use of Funds Statement',
        details: [
          'Description of intended use of Nihao account funds:',
          'Estimated purchase volumes',
          'Estimated transaction frequency',
          'Intended counterparty types & time horizon',
          'Document: Management statement (1-2 pages)',
        ],
      },
      {
        num: 19,
        title: 'Anticipated Trading Activity Plan',
        details: [
          '12-month projection of:',
          'Expected trading volumes',
          'Estimated transaction amounts',
          'Expected settlement counterparties',
          'Risk management approach',
        ],
      },
    ],
    verification: [
      {
        num: 20,
        title: 'Corporate Website and Business Verification',
        details: [
          'Corporate website review (if applicable)',
          'Business directory listings (Bloomberg, Reuters)',
          'Industry association memberships',
          'Publicly available information confirming legitimacy',
        ],
      },
      {
        num: 21,
        title: 'Sanctions and PEP Screening Declarations',
        details: [
          'Company declaration that:',
          'No directors/beneficial owners on OFAC, UN, or EU sanctions lists',
          'No directors/beneficial owners are Politically Exposed Persons (PEPs)',
          'No beneficial owners from high-risk jurisdictions',
        ],
      },
      {
        num: 22,
        title: 'Negative Screening Results',
        details: [
          'OFAC Specially Designated Nationals (SDN) list',
          'EU consolidated sanctions list',
          'UN Security Council lists',
          'London Stock Exchange denied parties',
        ],
      },
      {
        num: 23,
        title: 'Adverse Media and Reputational Screening',
        details: [
          'Google News search & major news database',
          'Business press search',
          'Looking for: Negative publicity, enforcement actions, litigation',
          'Format: Screening report or "no adverse findings" certification',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
              style={{
                backgroundColor: activeCategory === cat.id ? colors.primary : colors.bgCardHover,
                color: activeCategory === cat.id ? 'white' : colors.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              <span className="px-1.5 py-0.5 rounded text-xs" style={{
                backgroundColor: activeCategory === cat.id ? 'rgba(255,255,255,0.2)' : colors.bgCard,
              }}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {documents[activeCategory].map((doc) => (
            <div key={doc.num} className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ backgroundColor: colors.primary, color: 'white' }}>
                  {doc.num}
                </div>
                <div>
                  <h5 className="font-semibold text-sm mb-2" style={{ color: colors.textPrimary }}>{doc.title}</h5>
                  <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                    {doc.details.map((detail, idx) => (
                      <li key={idx}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Document Summary Table */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
        <h5 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Document Summary by Entity Type</h5>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: colors.bgCard }}>
                <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Entity Type</th>
                <th className="px-3 py-2 text-center" style={{ color: colors.textPrimary }}>Core Docs</th>
                <th className="px-3 py-2 text-center" style={{ color: colors.textPrimary }}>Additional</th>
                <th className="px-3 py-2 text-center" style={{ color: colors.textPrimary }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Manufacturing Company (EU ETS)', core: '1-6, 9-11, 13, 15-17', add: '18-23', total: '18-22' },
                { type: 'Financial Institution', core: '1-6, 9-12, 14-17', add: '18-23', total: '18-23' },
                { type: 'Investment Fund/Asset Manager', core: '1-6, 9-12, 14-17', add: '18-23', total: '18-23' },
                { type: 'Large Multinational Corporation', core: '1-8, 9-11, 13-17', add: '18-23', total: '20-25' },
                { type: 'Private Company', core: '1-6, 9-11, 15-17', add: '18-23', total: '18-22' },
                { type: 'Government Entity / SOE', core: '1-7, 9-10, 15-17, 22-23', add: '18-21', total: '15-20' },
              ].map((row, idx) => (
                <tr key={row.type} style={{ backgroundColor: idx % 2 === 0 ? colors.bgCardHover : colors.bgCard }}>
                  <td className="px-3 py-2" style={{ color: colors.textPrimary }}>{row.type}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.core}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.add}</td>
                  <td className="px-3 py-2 text-center font-bold" style={{ color: colors.primary }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
        <h5 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Document Preparation Best Practices</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Certified Translations', items: ['All non-English docs require certified English translation', 'Translator must be sworn/certified', 'Include translator certification page'] },
            { title: 'Document Format', items: ['PDF format preferred', 'High-quality scans (min. 300 DPI)', 'Clear readability', 'Color scans preferred for IDs'] },
            { title: 'Dates and Validity', items: ['All documents current (within 6 months)', 'Board resolutions acceptable if structure unchanged', 'Electronic signatures acceptable'] },
          ].map((practice) => (
            <div key={practice.title} className="p-3 rounded" style={{ backgroundColor: colors.bgCardHover }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>{practice.title}</h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                {practice.items.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Part 4: Timeline and Part 5: Summary
// =============================================================================

const TimelineAndSummary = () => {
  return (
    <div className="space-y-8">
      {/* Timeline */}
      <div>
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Complete Project Timeline</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: colors.bgCardHover }}>
                <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Week</th>
                <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Activity</th>
                <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Stakeholders</th>
                <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Deliverables</th>
              </tr>
            </thead>
            <tbody>
              {[
                { week: 'Weeks 1-3', activity: 'Step 1: KYC Process (external verification)', stake: 'EU Entity, Nihao Compliance, External Verification', deliverable: 'Active Trading Account' },
                { week: 'Week 3', activity: 'Step 2: Account Funding (1-5 days bank transfer)', stake: 'EU Entity, Banks', deliverable: 'Funded Trading Account' },
                { week: 'Week 3', activity: 'Steps 3 & 5: Marketplace Access (instant)', stake: 'EU Entity, Online Sellers & Swap Partners', deliverable: 'Selections Made' },
                { week: 'Weeks 3-6', activity: 'Step 4: CEA Order & Delivery (10-30 days registry)', stake: 'China ETS Registry', deliverable: 'CEA in Custody' },
                { week: 'Weeks 5-7', activity: 'Step 6: Swap Settlement (10-14 days registry)', stake: 'China ETS + EU ETS Registries', deliverable: 'EUA in EU Entity Account' },
                { week: 'Weeks 7-8', activity: 'Step 7: Final Verification (3-7 days)', stake: 'EU Entity, Nihao, Auditors', deliverable: 'Final Settlement Report' },
              ].map((row, idx) => (
                <tr key={row.week} style={{ backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.bgCardHover, borderTop: `1px solid ${colors.border}` }}>
                  <td className="px-3 py-2 font-medium" style={{ color: colors.primary }}>{row.week}</td>
                  <td className="px-3 py-2" style={{ color: colors.textPrimary }}>{row.activity}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: colors.textSecondary }}>{row.stake}</td>
                  <td className="px-3 py-2" style={{ color: colors.success }}>{row.deliverable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary of Advantages */}
      <div>
        <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Total Value Advantages Summary</h4>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: colors.primary }}>
                <th className="px-4 py-3 text-left text-white">Advantage Category</th>
                <th className="px-4 py-3 text-left text-white">Mechanism</th>
                <th className="px-4 py-3 text-center text-white">Typical Benefit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Price Advantage', mech: 'Bilateral negotiation, timing optimization', benefit: '8-15% lower EUA price' },
                { cat: 'Cost Reduction', mech: 'Lower transaction costs vs. exchanges', benefit: '€45,000-340,000 per transaction' },
                { cat: 'Settlement Speed', mech: 'Instant confirmation, faster registry processing', benefit: '10-14 days vs 30+ days' },
                { cat: 'Regulatory', mech: 'Reduced scrutiny, simplified reporting', benefit: '€25,000-250,000 expected savings' },
                { cat: 'Operational', mech: 'Customized settlement, no market impact', benefit: '1-3% value preservation' },
                { cat: 'Strategic', mech: 'Access to emerging CEA market', benefit: '1-2% option value' },
              ].map((row, idx) => (
                <tr key={row.cat} style={{ backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.bgCardHover, borderTop: `1px solid ${colors.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{row.cat}</td>
                  <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{row.mech}</td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: colors.success }}>{row.benefit}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: colors.success }}>
                <td className="px-4 py-3 font-bold text-white">Total Benefit Range</td>
                <td className="px-4 py-3 text-white">Combined advantages</td>
                <td className="px-4 py-3 text-center font-bold text-xl text-white">15-25% improvement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Illustrative Financial Analysis */}
      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}>
        <h4 className="font-bold text-lg mb-4" style={{ color: colors.primary }}>
          Illustrative Full-Cycle Financial Analysis
        </h4>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          EU Entity Requirement: 1,000,000 EUA for compliance
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-semibold mb-2" style={{ color: colors.danger }}>Traditional Exchange Purchase:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>Market price: €95/tonne</li>
              <li>Transaction costs: €475,000</li>
              <li>Market impact: €950,000</li>
              <li className="font-bold pt-2 border-t" style={{ borderColor: colors.border, color: colors.danger }}>
                Total: €96,425,000 (€96.43/tonne)
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-semibold mb-2" style={{ color: colors.success }}>Nihao Timing-Optimized:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>Forward CEA @ ¥72/t (€10.80/t)</li>
              <li>8,500,000 CEA (8.5:1 ratio)</li>
              <li>Swap facilitation: €459,000</li>
              <li className="font-bold pt-2 border-t" style={{ borderColor: colors.border, color: colors.success }}>
                Total: €92,259,000 (€92.26/tonne)
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.primary }}>
          <div className="text-2xl font-bold text-white">
            Advantage: €4,166,000 savings (4.3%)
          </div>
          <div className="text-sm mt-1" style={{ color: colors.primaryLight }}>
            With additional optimization, total advantage reaches 8-15% (€7.7M-14.4M for 1M EUA)
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Conclusion Section
// =============================================================================

const Conclusion = () => {
  const benefits = [
    { num: 1, name: 'Price optimization', desc: 'via bilateral negotiation and timing flexibility' },
    { num: 2, name: 'Cost reduction', desc: 'through consolidated transaction infrastructure' },
    { num: 3, name: 'Settlement speed', desc: 'through instant confirmation and streamlined processing' },
    { num: 4, name: 'Regulatory advantages', desc: 'from private market structure' },
    { num: 5, name: 'Operational efficiency', desc: 'through customized settlement' },
    { num: 6, name: 'Strategic positioning', desc: 'in emerging global carbon markets' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
        <h4 className="font-bold text-xl mb-4" style={{ color: colors.textPrimary }}>
          Conclusion
        </h4>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          The Nihao platform workflow provides EU entities with a comprehensive alternative pathway to acquiring EUA certificates that delivers <strong style={{ color: colors.success }}>15-25% total value improvement</strong> through:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <div key={benefit.num} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: colors.primary }}>
                {benefit.num}
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>{benefit.name}</span>
                <span className="text-sm ml-1" style={{ color: colors.textSecondary }}>{benefit.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-lg text-center" style={{ backgroundColor: colors.primary }}>
        <p className="text-white text-sm">
          The structured seven-step workflow ensures full compliance, regulatory transparency, and controlled risk management while delivering substantial economic benefits to EU entities engaged in carbon portfolio optimization.
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Main Page Component
// =============================================================================

const EuEntitiesPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('workflow');

  const sections = [
    { id: 'workflow', label: '7-Step Workflow', icon: Layers },
    { id: 'economic', label: 'Economic Advantages', icon: TrendingUp },
    { id: 'kyc', label: 'KYC Requirements', icon: FileText },
    { id: 'timeline', label: 'Timeline & Summary', icon: Calendar },
    { id: 'conclusion', label: 'Conclusion', icon: CheckCircle2 },
  ];

  const sectionContent: Record<string, React.ReactNode> = {
    workflow: <PlatformWorkflow />,
    economic: <EconomicAdvantages />,
    kyc: <KycDocumentation />,
    timeline: <TimelineAndSummary />,
    conclusion: <Conclusion />,
  };

  return (
    <OnboardingLayout
      title="EU Entities"
      subtitle="Advantages for EU Entities Using Nihao Platform - Complete Workflow Analysis"
    >
      {/* Executive Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-xl"
        style={{ backgroundColor: colors.bgCardHover }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Executive Summary
        </h3>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          This document provides a comprehensive analysis of the economic, operational, and strategic advantages that EU-based entities realize by utilizing Nihao Group&apos;s platform to acquire European Union Allowances (EUA) through a structured private marketplace workflow rather than purchasing directly from public exchanges.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.success }}>15-25%</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Total value improvement</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>7 Steps</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Structured workflow</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.secondary }}>6-8 Weeks</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Total timeline</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>23 Docs</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>KYC requirements</div>
          </div>
        </div>
      </motion.div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm"
              style={{
                backgroundColor: activeSection === section.id ? colors.primary : colors.bgCard,
                color: activeSection === section.id ? 'white' : colors.textSecondary,
                border: `1px solid ${activeSection === section.id ? colors.primary : colors.border}`,
              }}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          {sectionContent[activeSection]}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
};

export default EuEntitiesPage;
