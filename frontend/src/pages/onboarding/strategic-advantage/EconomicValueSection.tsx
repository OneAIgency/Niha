import { Building2, Factory, Landmark, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { economicValue } from './strategicAdvantageData';

export function EconomicValueSection() {
  return (
    <div className="space-y-8">
      {/* Buyer Savings Table */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <Building2 className="w-5 h-5" />
          Cost Savings Analysis: For Buyers
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800">
                <th className="px-4 py-3 text-left text-white">Cost Category</th>
                <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
                <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
                <th className="px-4 py-3 text-center text-emerald-500">Savings</th>
              </tr>
            </thead>
            <tbody>
              {economicValue.buyerSavings.map((row, i) => (
                <tr
                  key={i}
                  className={row.isTotal ? 'bg-emerald-500' : i % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700'}
                >
                  <td className={`px-4 py-3 ${row.isTotal ? 'font-bold text-white' : 'text-navy-900 dark:text-white'}`}>
                    {row.category}
                  </td>
                  <td className={`px-4 py-3 text-center ${row.isTotal ? "text-white" : "text-navy-600 dark:text-navy-400"}`}>
                    {row.traditional}
                  </td>
                  <td className={`px-4 py-3 text-center ${row.isTotal ? "text-white" : "text-navy-600 dark:text-navy-400"}`}>
                    {row.nihao}
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${row.isTotal ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {row.savings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Savings Table */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <Factory className="w-5 h-5" />
          Cost Savings Analysis: For Project Developers
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800">
                <th className="px-4 py-3 text-left text-white">Revenue Category</th>
                <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional</th>
                <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
                <th className="px-4 py-3 text-center text-emerald-500">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {economicValue.developerSavings.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                  <td className="px-4 py-3 text-white">{row.category}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Investors Value Table */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Landmark className="w-5 h-5" />
          Value Analysis: For Institutional Investors & Financial Institutions
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800">
                <th className="px-4 py-3 text-left text-white">Value Category</th>
                <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
                <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
                <th className="px-4 py-3 text-center text-emerald-500">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {economicValue.institutionalValue.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                  <td className="px-4 py-3 text-white">{row.category}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulators & Standards Bodies Value Table */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-violet-500">
          <Shield className="w-5 h-5" />
          Value Analysis: For Regulators & Standards Bodies
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800">
                <th className="px-4 py-3 text-left text-white">Oversight Category</th>
                <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Traditional Market</th>
                <th className="px-4 py-3 text-center text-emerald-500">Nihao Platform</th>
                <th className="px-4 py-3 text-center text-emerald-500">Efficiency Gain</th>
              </tr>
            </thead>
            <tbody>
              {economicValue.regulatorValue.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}>
                  <td className="px-4 py-3 text-white">{row.category}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.traditional}</td>
                  <td className="px-4 py-3 text-center text-navy-600 dark:text-navy-400">{row.nihao}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Projections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-700">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            VCM Projections
          </h5>
          {economicValue.marketProjections.vcm.map((v, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-navy-200 dark:border-navy-600">
              <span className="text-sm text-navy-500 dark:text-navy-500">{v.year}</span>
              <span className="text-sm font-medium text-emerald-500">{v.value}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-navy-700">
          <h5 className="font-bold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <BarChart3 className="w-4 h-4" />
            EU ETS Market Size
          </h5>
          {economicValue.marketProjections.euEts.map((e, i) => (
            <div key={i} className="py-2 border-b border-navy-200 dark:border-navy-600">
              <span className="text-xs text-navy-500 dark:text-navy-500">{e.metric}</span>
              <div className="text-sm font-medium text-emerald-500">{e.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
