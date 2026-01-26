import { Gavel, Scale, ShieldCheck, CheckCircle } from 'lucide-react';
import { riskAndLegal } from './strategicAdvantageData';

export function RiskLegalSection() {
  return (
    <div className="space-y-8">
      {/* EUR 10M Penalty */}
      <div className="p-6 rounded-xl border-2 border-red-500 bg-red-500/10">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <Gavel className="w-5 h-5" />
          {riskAndLegal.penaltyProvision.title}
        </h4>
        <p className="text-sm mb-4 text-navy-600 dark:text-navy-400">
          {riskAndLegal.penaltyProvision.intro}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-emerald-500">Deterrent Effect:</h5>
            <ul className="space-y-2">
              {riskAndLegal.penaltyProvision.deterrent.map((d, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {d}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Breach Categories Covered:</h5>
            <ol className="space-y-2">
              {riskAndLegal.penaltyProvision.breachCategories.map((b, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">{i + 1}. {b}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Legal Architecture */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Scale className="w-5 h-5" />
          {riskAndLegal.legalArchitecture.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-emerald-500">Tailored Governing Law:</h5>
            <ul className="space-y-2">
              {riskAndLegal.legalArchitecture.governingLaw.map((g, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {g}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Dispute Resolution Framework:</h5>
            <ul className="space-y-2">
              {riskAndLegal.legalArchitecture.disputeResolution.map((d, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {d}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance Infrastructure */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <ShieldCheck className="w-5 h-5" />
          {riskAndLegal.complianceInfrastructure.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {riskAndLegal.complianceInfrastructure.regulations.map((r, i) => (
            <div key={i} className="p-3 rounded-lg flex items-start gap-2 bg-navy-800">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              <span className="text-sm text-navy-600 dark:text-navy-400">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
