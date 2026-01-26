import { CheckCircle, Building2, Factory, Landmark, Shield, Globe, Cpu } from 'lucide-react';
import { conclusion } from './strategicAdvantageData';

export function SummarySection() {
  return (
    <div
      className="rounded-2xl p-8 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500"
    >
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
        Platform Benefits Summary
      </h3>
      <p className="text-sm mb-6 text-navy-600 dark:text-navy-400">
        {conclusion.intro}
      </p>

      {/* Quantified Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-navy-800">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
            <Building2 className="w-4 h-4" />
            For Buyers
          </h5>
          <ul className="space-y-1">
            {conclusion.buyers.map((b, i) => (
              <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {b}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-navy-800">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
            <Factory className="w-4 h-4" />
            For Developers
          </h5>
          <ul className="space-y-1">
            {conclusion.developers.map((d, i) => (
              <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {d}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-navy-800">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <Landmark className="w-4 h-4" />
            For Institutions
          </h5>
          <ul className="space-y-1">
            {conclusion.institutions.map((inst, i) => (
              <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {inst}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-navy-800">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-violet-500">
            <Shield className="w-4 h-4" />
            For Regulators
          </h5>
          <ul className="space-y-1">
            {conclusion.regulators.map((r, i) => (
              <li key={i} className="text-xs text-navy-600 dark:text-navy-400">• {r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hong Kong Advantages */}
      <div className="p-4 rounded-xl mb-6 bg-navy-800">
        <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
          <Globe className="w-5 h-5" />
          Hong Kong Strategic Position
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {conclusion.hkAdvantages.map((a, i) => (
            <div key={i} className="p-3 rounded-lg text-center text-xs bg-navy-700 text-navy-900 dark:text-white">
              {a}
            </div>
          ))}
        </div>
      </div>

      {/* Technology Leadership */}
      <div className="p-4 rounded-xl mb-6 bg-navy-800">
        <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Cpu className="w-5 h-5" />
          Technology Infrastructure
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {conclusion.technology.map((t, i) => (
            <div key={i} className="p-3 rounded-lg bg-navy-700">
              <div className="font-semibold text-sm mb-1 text-emerald-500">{t.name}</div>
              <div className="text-xs text-navy-600 dark:text-navy-400">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Statement */}
      <div className="p-4 rounded-xl bg-emerald-500">
        <p className="text-sm text-white">
          {conclusion.finalStatement}
        </p>
      </div>
    </div>
  );
}
