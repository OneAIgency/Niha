import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Factory,
  Landmark,
  Shield,
  DollarSign,
  TrendingUp,
  Globe,
  Cpu,
  BarChart3,
  BadgeCheck,
  CheckCircle,
} from 'lucide-react';
import { stakeholderAdvantages } from './strategicAdvantageData';

export function StakeholderBenefitsSection() {
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
          {activeStakeholder === 'buyers' && <BuyersContent />}
          {activeStakeholder === 'developers' && <DevelopersContent />}
          {activeStakeholder === 'institutions' && <InstitutionsContent />}
          {activeStakeholder === 'regulators' && <RegulatorsContent />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function BuyersContent() {
  return (
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
  );
}

function DevelopersContent() {
  return (
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
  );
}

function InstitutionsContent() {
  return (
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
  );
}

function RegulatorsContent() {
  return (
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
  );
}
