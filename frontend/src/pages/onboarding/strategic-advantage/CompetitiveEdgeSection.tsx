import { AlertTriangle, CheckCircle } from 'lucide-react';
import { platformBenefits } from './strategicAdvantageData';

export function CompetitiveEdgeSection() {
  return (
    <div className="space-y-8">
      {/* vs Brokers */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 text-white">
          {platformBenefits.vsBrokers.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border-2 border-red-500">
            <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsBrokers.challenges.map((l, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border-2 border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsBrokers.benefits.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* vs Exchanges */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 text-white">
          {platformBenefits.vsExchanges.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border-2 border-red-500">
            <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsExchanges.challenges.map((l, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border-2 border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsExchanges.benefits.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* vs Registries */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 text-white">
          {platformBenefits.vsRegistries.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border-2 border-red-500">
            <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Traditional Challenges:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsRegistries.challenges.map((l, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border-2 border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Platform Benefits:</h5>
            <ul className="space-y-2">
              {platformBenefits.vsRegistries.benefits.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
