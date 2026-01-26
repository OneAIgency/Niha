import { AlertTriangle, CheckCircle, Eye, Shield } from 'lucide-react';
import { marketInefficiencies } from './strategicAdvantageData';

export function MarketInefficienciesSection() {
  return (
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
}
