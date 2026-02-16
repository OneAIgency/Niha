import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { AccordionItem } from './AccordionItem';
import {
  TIMING_CATALYSTS,
  CONVERGENCE_TABLE,
  RISK_MITIGATIONS,
  depthAtLeast,
} from './constants';

export function TimingSection() {
  const { contentDepth } = useIntroducerStore();
  const showAdvanced = depthAtLeast(contentDepth, 'advanced');
  const visibleRisks = RISK_MITIGATIONS.filter((r) => depthAtLeast(contentDepth, r.depth));

  return (
    <div>
      <h4 className="text-sm font-semibold text-navy-300 mb-4">Why 2026 Is the Optimal Entry Point</h4>

      {/* Catalyst cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {TIMING_CATALYSTS.map((catalyst) => (
          <div key={catalyst.title} className="bg-navy-800/50 border border-navy-700 rounded-lg p-4">
            <div className="text-xs text-emerald-400 font-semibold mb-1">{catalyst.year}</div>
            <div className="text-sm font-medium text-white mb-1">{catalyst.title}</div>
            <div className="text-xs text-navy-500">{catalyst.description}</div>
            {showAdvanced && catalyst.extendedContent && (
              <div className="text-xs text-navy-500 mt-2 border-t border-navy-700 pt-2 leading-relaxed">
                {catalyst.extendedContent}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Convergence table */}
      <div className="bg-navy-800/30 border border-navy-700 rounded-xl p-4 mb-6">
        <h5 className="text-xs uppercase tracking-wider text-navy-400 mb-3">Price Convergence Forecast</h5>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-navy-500">
                <th className="pb-2 pr-3 font-medium">Year</th>
                <th className="pb-2 px-3 font-medium">EUA (€/t)</th>
                <th className="pb-2 px-3 font-medium">CEA (€ equiv.)</th>
                <th className="pb-2 px-3 font-medium">Ratio</th>
                <th className="pb-2 pl-3 font-medium">Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {CONVERGENCE_TABLE.map((row) => (
                <tr
                  key={row.year}
                  className={cn(
                    'border-t border-navy-800',
                    row.opportunity.includes('★') && 'bg-emerald-500/5'
                  )}
                >
                  <td className="py-2 pr-3 text-sm text-navy-300 font-medium">{row.year}</td>
                  <td className="py-2 px-3 text-sm text-navy-400 font-mono">{row.eua}</td>
                  <td className="py-2 px-3 text-sm text-navy-400 font-mono">{row.cea}</td>
                  <td className="py-2 px-3 text-sm text-amber-400 font-mono">{row.ratio}</td>
                  <td className={cn(
                    'py-2 pl-3 text-sm font-medium',
                    row.opportunity.includes('★') ? 'text-emerald-400' : 'text-navy-500'
                  )}>
                    {row.opportunity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risks & Mitigations */}
      <h5 className="text-xs uppercase tracking-wider text-navy-400 mb-3">Risks & Mitigations</h5>
      <div className="space-y-2">
        {visibleRisks.map((item) => (
          <AccordionItem key={item.id} sectionId="timing" itemId={item.id} title={`${item.risk}: ${item.description}`}>
            <span className="text-emerald-400/80">Mitigation:</span> {item.mitigation}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}
