import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  LogOut,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  Scale,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import {
  // Data
  navSections,
  documentTypes,
  ceaHolderCategories,
  euaHolderCategories,
  workflowSteps,
  kycDocuments,
  // Types
  type DocumentType,
  // Components
  FloatingUploadButton,
  UploadModal,
  EntityCategoryCard,
  EntityCategoryDetail,
  WorkflowStepCard,
  WorkflowStepDetail,
} from './onboarding/onboarding-components';

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
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none bg-radial-gradient from-teal-500/20 to-transparent"
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
          <div className="rounded-2xl p-6 overflow-x-auto bg-navy-800 border border-navy-700">
            <h4 className="text-xl font-semibold mb-6">Key Regulatory Differences</h4>
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
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
          <div className="p-6 rounded-xl text-center mt-8 bg-gradient-to-br from-amber-500/10 to-red-600/10 border border-violet-500">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-teal-500 to-blue-700">
              2
            </div>
            <div>
              <h3 className="text-3xl font-bold">About Nihao Group</h3>
              <p className="text-navy-200">Strategic intermediary bridging EU and China carbon markets</p>
            </div>
          </div>

          {/* Company Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl p-6 bg-navy-800 border border-navy-700">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-teal-500 to-blue-700">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Hong Kong Headquarters</h4>
              <p className="text-sm text-navy-200">
                Strategic positioning at the intersection of European and Chinese carbon markets, leveraging Hong Kong's unique role as a gateway.
              </p>
            </div>
            <div className="rounded-2xl p-6 bg-navy-800 border border-navy-700">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-violet-500 to-red-500">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Regulatory Compliance</h4>
              <p className="text-sm text-navy-200">
                Full compliance with Hong Kong SFC oversight, AML/KYC standards comparable to EU, and FATCA/CRS requirements.
              </p>
            </div>
            <div className="rounded-2xl p-6 bg-navy-800 border border-navy-700">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-violet-500 to-pink-500">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">Secure Infrastructure</h4>
              <p className="text-sm text-navy-200">
                Custody and settlement services, multi-currency transaction capabilities, and direct Yuan/RMB convertibility access.
              </p>
            </div>
          </div>

          {/* Service Offerings */}
          <div className="rounded-2xl p-8 mb-8 bg-navy-800 border border-navy-700">
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
          <div className="rounded-2xl p-8 border border-teal-500 bg-gradient-to-br from-teal-500/15 to-blue-700/15">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-red-500 to-orange-500">
              3
            </div>
            <div>
              <h3 className="text-3xl font-bold">For CEA Holders</h3>
              <p className="text-navy-200">Private bilateral deals offer 8-25% value improvement over SEEE exchange trading</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium bg-red-500/13 text-red-500">
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
          <div className="p-6 rounded-xl mt-8 bg-gradient-to-br from-red-600/10 to-orange-500/10 border border-red-500">
            <h5 className="font-semibold mb-4 text-red-500">
              Key Advantages for CEA Holders via Nihao
            </h5>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-black/20">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <div className="text-xl font-bold text-emerald-500">8-15%</div>
                <div className="text-xs text-navy-200">Price Premium</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <Shield className="w-8 h-8 mx-auto mb-2 text-teal-300" />
                <div className="text-xl font-bold text-teal-300">High</div>
                <div className="text-xs text-navy-200">Confidentiality</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <Scale className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-xl font-bold text-amber-500">Lower</div>
                <div className="text-xs text-navy-200">Regulatory Scrutiny</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-blue-400 to-violet-500">
              4
            </div>
            <div>
              <h3 className="text-3xl font-bold">For EUA Holders</h3>
              <p className="text-navy-200">EUA-to-CEA swaps generate 10-22% total value improvement</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium bg-blue-400/13 text-blue-400">
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
          <div className="p-6 rounded-xl mt-8 bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-400">
            <h5 className="font-semibold mb-4 text-blue-400">
              EUA-to-CEA Swap Value Breakdown
            </h5>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-emerald-500">8-18%</div>
                <div className="text-xs text-navy-200">Price Arbitrage</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-teal-300">1-8%</div>
                <div className="text-xs text-navy-200">Timing Optimization</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-amber-500">1-3%</div>
                <div className="text-xs text-navy-200">Operational Efficiency</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-blue-400">1-2%</div>
                <div className="text-xs text-navy-200">Currency Management</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-purple-400">1-4%</div>
                <div className="text-xs text-navy-200">Strategic Positioning</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: For EU Entities */}
        <section id="eu-entities" className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-emerald-500">
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
          <div className="rounded-2xl p-8 mt-8 bg-navy-800 border border-navy-700">
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
          <div className="p-6 rounded-xl mt-8 bg-gradient-to-br from-green-600/15 to-teal-500/15 border border-emerald-500">
            <h5 className="font-semibold mb-4 text-emerald-500">
              Total Value Advantages for EU Entities
            </h5>
            <div className="grid md:grid-cols-6 gap-4">
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-emerald-500">8-15%</div>
                <div className="text-xs text-navy-200">Price Advantage</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-teal-300">EUR 45-340K</div>
                <div className="text-xs text-navy-200">Cost Reduction</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-amber-500">EUR 25-150K</div>
                <div className="text-xs text-navy-200">Working Capital</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-blue-400">EUR 25-250K</div>
                <div className="text-xs text-navy-200">Regulatory Savings</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-purple-400">1-3%</div>
                <div className="text-xs text-navy-200">Operational</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <div className="text-xl font-bold text-emerald-500">15-25%</div>
                <div className="text-xs text-navy-200">Total Benefit</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16">
          <div className="rounded-3xl p-12 border border-teal-500 bg-gradient-to-br from-teal-500/20 to-blue-700/20">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-navy-200">
              Complete your KYC documentation to access the Nihao marketplace and start benefiting from bilateral carbon trading opportunities.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all bg-gradient-to-br from-teal-500 to-blue-700"
            >
              Complete Your KYC Documentation
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-navy-600">
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
