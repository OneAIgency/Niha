import { Check } from 'lucide-react';
import { COMPARISON_ROWS } from './constants';

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-navy-400">
            <th className="pb-3 pr-4 font-medium">Feature</th>
            <th className="pb-3 px-4 font-medium">Direct EUA Purchase</th>
            <th className="pb-3 pl-4 font-medium border-l-2 border-emerald-500 bg-emerald-500/5 rounded-t-lg">
              Via NIHA (Recommended)
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.feature}
              className={i < COMPARISON_ROWS.length - 1 ? 'border-b border-navy-800' : ''}
            >
              <td className="py-3 pr-4 text-sm text-navy-300 font-medium">
                {row.feature}
              </td>
              <td className="py-3 px-4 text-sm text-navy-400">
                {row.direct}
              </td>
              <td className="py-3 pl-4 text-sm border-l-2 border-emerald-500 bg-emerald-500/5">
                <span className="flex items-center gap-2">
                  {row.nihaWins && (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="text-emerald-300">{row.niha}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {COMPARISON_ROWS.map((row) => (
          <div key={row.feature} className="bg-navy-800/50 border border-navy-700 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-navy-400 mb-2">
              {row.feature}
            </div>
            <div className="text-sm text-navy-400 mb-1">
              Direct: {row.direct}
            </div>
            <div className="text-sm text-emerald-300 flex items-center gap-1.5">
              {row.nihaWins && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
              NIHA: {row.niha}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
