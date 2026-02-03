import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Globe,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  ArrowRightLeft,
  Building2,
  Factory,
  Briefcase,
  CheckCircle,
  XCircle,
  Zap,
  Lock,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function LearnMorePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('market');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy-800/80 backdrop-blur-lg border-b border-navy-600/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-400 bg-clip-text text-transparent">
                  Nihao Group
                </h1>
                <span className="text-xs text-navy-400 uppercase tracking-wider">Carbon Bridge</span>
              </div>
            </div>
            <Link
              to="/onboarding"
              className="flex items-center gap-2 px-4 py-2 text-sm text-navy-300 hover:text-white hover:bg-navy-600/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Onboarding
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Carbon Trading
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-400 bg-clip-text text-transparent"> Made Simple</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-navy-300 max-w-3xl mx-auto mb-12"
          >
            Understand how EU and China carbon markets work, and how Nihao Group bridges these two worlds
            to create unique opportunities for qualified partners.
          </motion.p>

          {/* Key Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: '€88', label: 'EUA Price', sublabel: 'per tCO2', color: 'text-blue-400', icon: TrendingUp },
              { value: '€10', label: 'CEA Price', sublabel: 'per tCO2', color: 'text-red-400', icon: TrendingDown },
              { value: '8-9x', label: 'Price Ratio', sublabel: 'EUA vs CEA', color: 'text-emerald-400', icon: ArrowRightLeft },
              { value: '48h', label: 'Settlement', sublabel: 'average time', color: 'text-amber-400', icon: Clock },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-navy-700/50 border border-navy-600 rounded-2xl p-4 hover:border-emerald-500/50 transition-colors"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-navy-400">{stat.label}</div>
                <div className="text-xs text-navy-400">{stat.sublabel}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* Section: Understanding Carbon Markets */}
        <section className="mb-12">
          <button
            onClick={() => toggleSection('market')}
            className="w-full flex items-center justify-between p-6 bg-navy-700/50 border border-navy-600 rounded-2xl hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl">
                1
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Understanding Carbon Markets</h3>
                <p className="text-navy-400">EU ETS vs China ETS - Key Differences</p>
              </div>
            </div>
            {expandedSection === 'market' ? (
              <ChevronUp className="w-6 h-6 text-navy-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-navy-400" />
            )}
          </button>

          {expandedSection === 'market' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-6"
            >
              {/* Price Comparison Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* EU ETS Card */}
                <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold">EU Emission Allowances (EUA)</h4>
                      <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full mt-1">
                        European Union
                      </span>
                    </div>
                    <Globe className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-blue-400">€88</span>
                    <span className="text-navy-400">/tCO2</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Market Maturity</span>
                      <span className="text-white font-medium">Since 2005 (20 years)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Daily Volume</span>
                      <span className="text-white font-medium">~37M tonnes</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Allocation Method</span>
                      <span className="text-white font-medium">57% Auctions</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-navy-400">2030 Forecast</span>
                      <span className="text-emerald-400 font-medium">€130-150 (+50%)</span>
                    </div>
                  </div>
                </div>

                {/* China ETS Card */}
                <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold">China Emission Allowances (CEA)</h4>
                      <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full mt-1">
                        China
                      </span>
                    </div>
                    <Globe className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-red-400">€10</span>
                    <span className="text-navy-400">/tCO2 (~¥63)</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Market Maturity</span>
                      <span className="text-white font-medium">Since 2021 (3.5 years)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Daily Volume</span>
                      <span className="text-white font-medium">~0.5M tonnes</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-navy-600">
                      <span className="text-navy-400">Allocation Method</span>
                      <span className="text-white font-medium">100% Free</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-navy-400">2030 Forecast</span>
                      <span className="text-emerald-400 font-medium">€25-35 (+200%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-400 mb-2">The Opportunity</h4>
                    <p className="text-navy-300 leading-relaxed">
                      The 8-9x price difference between EU and China carbon markets creates significant
                      arbitrage opportunities. While both markets aim to reduce emissions, their different
                      stages of maturity and regulatory approaches result in vastly different carbon prices.
                      CEA offers substantially higher upside potential (+200% projected by 2030) compared
                      to EUA (+50%), making it an attractive diversification asset for sophisticated investors.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Section: Who Benefits */}
        <section className="mb-12">
          <button
            onClick={() => toggleSection('benefits')}
            className="w-full flex items-center justify-between p-6 bg-navy-700/50 border border-navy-600 rounded-2xl hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-xl">
                2
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Who Benefits from Our Platform</h3>
                <p className="text-navy-400">Three types of partners, each with unique advantages</p>
              </div>
            </div>
            {expandedSection === 'benefits' ? (
              <ChevronUp className="w-6 h-6 text-navy-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-navy-400" />
            )}
          </button>

          {expandedSection === 'benefits' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 grid md:grid-cols-3 gap-6"
            >
              {/* Chinese CEA Sellers */}
              <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 hover:border-red-500/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Factory className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Chinese CEA Sellers</h4>
                <p className="text-navy-400 text-sm mb-4">
                  Power plants and industrial facilities with surplus emission allowances
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">15-20% better prices than Shanghai Exchange</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Settlement in 48 hours vs 3-5 weeks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Export VAT treatment (0% vs 6%)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Complete confidentiality (no market signal)</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
                  <div className="text-xs text-navy-400 uppercase tracking-wider mb-1">Example Gain</div>
                  <div className="text-xl font-bold text-red-400">+€2M</div>
                  <div className="text-xs text-navy-400">on 2M CEA sale vs exchange</div>
                </div>
              </div>

              {/* EU Buyers & Swappers */}
              <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">EU Industrial Partners</h4>
                <p className="text-navy-400 text-sm mb-4">
                  European companies with EUA holdings or compliance needs
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Access China market without WFOE setup</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">CBAM optimization for imports</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">EUA→CEA swap for diversification</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Supply chain carbon cost reduction</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-xs text-navy-400 uppercase tracking-wider mb-1">CBAM Savings</div>
                  <div className="text-xl font-bold text-blue-400">€40/tonne</div>
                  <div className="text-xs text-navy-400">on steel/aluminum imports</div>
                </div>
              </div>

              {/* Investment Funds */}
              <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Investment Funds</h4>
                <p className="text-navy-400 text-sm mb-4">
                  Pension funds, sovereign wealth, and climate-focused investors
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Geographic diversification (EU + China)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Higher upside potential in CEA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Secure custody in Hong Kong</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-navy-300">Professional exit liquidity</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                  <div className="text-xs text-navy-400 uppercase tracking-wider mb-1">CEA Upside</div>
                  <div className="text-xl font-bold text-emerald-400">+200%</div>
                  <div className="text-xs text-navy-400">projected by 2030</div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Section: Swap Mechanism */}
        <section className="mb-12">
          <button
            onClick={() => toggleSection('swap')}
            className="w-full flex items-center justify-between p-6 bg-navy-700/50 border border-navy-600 rounded-2xl hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">
                3
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">EUA↔CEA Swap Mechanism</h3>
                <p className="text-navy-400">How cross-border certificate swaps work</p>
              </div>
            </div>
            {expandedSection === 'swap' ? (
              <ChevronUp className="w-6 h-6 text-navy-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-navy-400" />
            )}
          </button>

          {expandedSection === 'swap' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-6"
            >
              {/* Comparison: Direct Sale vs Swap */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Direct Sale Option */}
                <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-navy-500 rounded-full flex items-center justify-center text-sm font-bold">A</div>
                    <h4 className="font-bold text-navy-300">Traditional Route: Sell EUA → Buy CEA</h4>
                  </div>
                  <div className="bg-navy-800/50 rounded-lg p-4 font-mono text-sm space-y-2 mb-4">
                    <div className="flex gap-2">
                      <span className="text-navy-400">1.</span>
                      <span className="text-navy-300">Sell 100,000 EUA on EU market at €88/t</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">2.</span>
                      <span className="text-navy-300">Receive <span className="text-amber-400">€8.8M</span> in cash</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">3.</span>
                      <span className="text-navy-300">Transfer cash to China (SAFE approval)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">4.</span>
                      <span className="text-red-400">Wait 2-4 weeks for capital controls</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">5.</span>
                      <span className="text-navy-300">Convert EUR→RMB (<span className="text-red-400">-1.5% FX spread</span>)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">6.</span>
                      <span className="text-navy-300">Buy CEA on Shanghai market</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">7.</span>
                      <span className="text-navy-300">Obtain ~<span className="text-amber-400">1,089,523 CEA</span></span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-red-400 font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Issues
                    </h5>
                    <ul className="space-y-1 text-sm text-navy-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        Capital controls delay: 2-4 weeks
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        FX spread: ~€130k loss
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        Timing risk: CEA price may rise
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        Regulatory scrutiny on large transfers
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Swap Option */}
                <div className="bg-navy-700/50 border-2 border-emerald-500/50 rounded-2xl p-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 rounded-full text-sm font-bold">
                    RECOMMENDED
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">B</div>
                    <h4 className="font-bold text-emerald-400">Direct Swap via Nihao</h4>
                  </div>
                  <div className="bg-navy-800/50 rounded-lg p-4 font-mono text-sm space-y-2 mb-4">
                    <div className="flex gap-2">
                      <span className="text-navy-400">1.</span>
                      <span className="text-navy-300">Swap 100,000 EUA for 1,000,000 CEA</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">2.</span>
                      <span className="text-emerald-400">Settlement in 48 hours</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">3.</span>
                      <span className="text-emerald-400">Zero cash cross-border transfer</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-navy-400">4.</span>
                      <span className="text-emerald-400">Zero FX exposure</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-emerald-400 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Benefits
                    </h5>
                    <ul className="space-y-1 text-sm text-navy-300">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Instant compliance: CEA received immediately
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Zero capital controls (commodity swap)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Better ratio: 1:10 vs 1:10.9 (direct route)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Tax efficiency: No immediate taxable event
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Economic Summary */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
                <h4 className="font-bold text-emerald-400 mb-4">Economic Analysis: 100,000 EUA Swap</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-navy-800/50 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-400">€34k</div>
                    <div className="text-sm text-navy-400">Net Savings</div>
                    <div className="text-xs text-navy-400">vs traditional route</div>
                  </div>
                  <div className="text-center p-4 bg-navy-800/50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-400">48h</div>
                    <div className="text-sm text-navy-400">vs 4 weeks</div>
                    <div className="text-xs text-navy-400">settlement time</div>
                  </div>
                  <div className="text-center p-4 bg-navy-800/50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-400">0%</div>
                    <div className="text-sm text-navy-400">FX Risk</div>
                    <div className="text-xs text-navy-400">no currency exposure</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Section: Why Nihao */}
        <section className="mb-12">
          <button
            onClick={() => toggleSection('why')}
            className="w-full flex items-center justify-between p-6 bg-navy-700/50 border border-navy-600 rounded-2xl hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-navy-500 to-navy-600 rounded-xl flex items-center justify-center text-xl">
                4
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Why Choose Nihao Group</h3>
                <p className="text-navy-400">Our unique position and guarantees</p>
              </div>
            </div>
            {expandedSection === 'why' ? (
              <ChevronUp className="w-6 h-6 text-navy-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-navy-400" />
            )}
          </button>

          {expandedSection === 'why' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Globe,
                    title: 'Cross-Border Expertise',
                    description: 'Italy Nihao Group has been bridging Italy and China for over 20 years in grocery, wholesale, and logistics. We apply the same proven infrastructure to carbon markets.',
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    icon: Shield,
                    title: 'Settlement Security',
                    description: 'All transactions use escrow accounts with atomic settlement. Either both legs clear or neither does. Lloyd\'s-backed coverage up to €75M for settlement failures.',
                    color: 'from-emerald-500 to-emerald-600',
                  },
                  {
                    icon: Lock,
                    title: 'Complete Confidentiality',
                    description: 'OTC transactions with no market signal. Your trading activity remains private. No competitors, regulators, or government entities can infer your position.',
                    color: 'from-navy-500 to-navy-600',
                  },
                  {
                    icon: Users,
                    title: 'Partner Network',
                    description: 'Access our curated network of verified counterparties. We aggregate volume from multiple partners to negotiate better rates and ensure liquidity.',
                    color: 'from-amber-500 to-amber-600',
                  },
                  {
                    icon: DollarSign,
                    title: 'Tax Optimization',
                    description: 'Export VAT structure (0% vs 6%), proper inventory treatment for cost deduction, and environmental investment incentives can reduce tax burden significantly.',
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    icon: Zap,
                    title: 'Speed of Execution',
                    description: 'Settlement in 3-5 days vs 3-5 weeks through traditional routes. Critical for banking deadline compliance and cash flow management.',
                    color: 'from-red-500 to-red-600',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6 hover:border-navy-400 transition-all"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-navy-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Section: Onboarding Requirements */}
        <section className="mb-12">
          <button
            onClick={() => toggleSection('onboarding')}
            className="w-full flex items-center justify-between p-6 bg-navy-700/50 border border-navy-600 rounded-2xl hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl">
                5
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Onboarding Requirements</h3>
                <p className="text-navy-400">What you need to get started</p>
              </div>
            </div>
            {expandedSection === 'onboarding' ? (
              <ChevronUp className="w-6 h-6 text-navy-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-navy-400" />
            )}
          </button>

          {expandedSection === 'onboarding' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <div className="bg-navy-700/50 border border-navy-600 rounded-2xl p-6">
                <p className="text-navy-300 mb-6">
                  To participate in carbon certificate trading through Nihao Group, your company must complete
                  KYC verification for Union Registry account access. All partners need active accounts in the
                  EU&apos;s centralized electronic database for emissions certificates.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Documents
                    </h4>
                    <ul className="space-y-3">
                      {[
                        { name: 'Business Registration Certificate', note: 'Not older than 90 days' },
                        { name: 'Tax Registration Certificate', note: 'TIN/VAT number' },
                        { name: 'Articles of Association', note: 'Company statutes' },
                        { name: 'Latest Financial Statements', note: 'Annual report / balance sheet' },
                        { name: 'GHG Permit', note: 'For EU ETS operators only (optional)' },
                      ].map((doc, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <FileText className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-navy-200">{doc.name}</span>
                            <span className="text-navy-400 block text-xs">{doc.note}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-navy-400 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Representative Documents
                    </h4>
                    <ul className="space-y-3">
                      {[
                        { name: 'Government-Issued ID', note: 'Passport or national ID' },
                        { name: 'Proof of Authority', note: 'Legal rep status or Power of Attorney' },
                        { name: 'Contact Information', note: 'Email and phone for verification' },
                      ].map((doc, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <FileText className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-navy-200">{doc.name}</span>
                            <span className="text-navy-400 block text-xs">{doc.note}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-400 mb-1">Review Timeline</h5>
                      <p className="text-sm text-navy-400">
                        Our team typically reviews applications within 1-2 business days. Complete and accurate
                        documentation speeds up the verification process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-navy-400 mb-8 max-w-xl mx-auto">
            Complete your KYC verification to unlock access to our carbon trading platform
            and start benefiting from cross-border carbon market opportunities.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Onboarding
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
