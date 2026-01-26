import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, ArrowRight } from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding';
import {
  executiveSummary,
  tabs,
  MarketInefficienciesSection,
  StakeholderBenefitsSection,
  HongKongPositionSection,
  TechnologyPlatformSection,
  EconomicValueSection,
  CompetitiveEdgeSection,
  RiskLegalSection,
  SummarySection,
} from './strategic-advantage';

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
          {activeTab === 7 && <SummarySection />}
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
