import { Database, Brain, CheckCircle, Zap } from 'lucide-react';
import { technologyInfrastructure } from './strategicAdvantageData';

export function TechnologyPlatformSection() {
  return (
    <div className="space-y-8">
      {/* Digital Platform */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <Database className="w-5 h-5" />
          {technologyInfrastructure.digitalPlatform.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-emerald-500">Core Transformation:</h5>
            <ul className="space-y-2">
              {technologyInfrastructure.digitalPlatform.coreTransformation.map((c, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Operational Advantages:</h5>
            <ul className="space-y-2">
              {technologyInfrastructure.digitalPlatform.operationalAdvantages.map((o, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-500" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI/ML */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Brain className="w-5 h-5" />
          {technologyInfrastructure.ai.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-emerald-500">Quality Assessment Innovation:</h5>
            <ul className="space-y-2">
              {technologyInfrastructure.ai.qualityAssessment.map((q, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {q}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Market Intelligence:</h5>
            <ul className="space-y-2">
              {technologyInfrastructure.ai.marketIntelligence.map((m, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {m}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
