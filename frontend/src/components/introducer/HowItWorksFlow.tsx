import { ArrowRight, ArrowDown, RefreshCw } from 'lucide-react';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { useSection } from './SectionRegistry';
import {
  SECTION_IDS,
  HOW_IT_WORKS_STEPS,
  LIQUIDITY_FLYWHEEL,
  GROWTH_TRAJECTORY,
  DETAILED_EXAMPLES,
  depthAtLeast,
} from './constants';

export function HowItWorksFlow() {
  const ref = useSection(SECTION_IDS.MECHANISM);
  const { contentDepth } = useIntroducerStore();
  const showAdvanced = depthAtLeast(contentDepth, 'advanced');
  const showExpert = depthAtLeast(contentDepth, 'expert');

  return (
    <section ref={ref} id={SECTION_IDS.MECHANISM}>
      <h3 className="section-heading text-white mb-6">How It Works</h3>

      {/* 5-step flow */}
      <div className="flex flex-col lg:flex-row items-stretch gap-2">
        {HOW_IT_WORKS_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="contents">
              <div className="flex-1 bg-navy-800/50 border border-navy-700 rounded-lg p-4 flex flex-col items-center text-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <Icon className="w-5 h-5 text-navy-300" />
                <div>
                  <div className="text-sm font-medium text-navy-200">{step.title}</div>
                  <div className="text-xs text-navy-500 mt-1">{step.subtitle}</div>
                </div>
                {showAdvanced && step.extendedContent && (
                  <div className="text-xs text-navy-500 mt-2 border-t border-navy-700 pt-2 text-left leading-relaxed">
                    {step.extendedContent}
                  </div>
                )}
              </div>

              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <>
                  <div className="hidden lg:flex items-center justify-center text-navy-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="flex lg:hidden items-center justify-center text-navy-600 py-1">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Liquidity Flywheel (advanced) */}
      {showAdvanced && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-navy-300 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Liquidity Flywheel
          </h4>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {LIQUIDITY_FLYWHEEL.map((node, i) => (
              <div key={node.id} className="contents">
                <div className="flex-1 bg-navy-800/50 border border-navy-700 rounded-lg p-3 text-center min-w-0">
                  <div className="text-xs font-semibold text-emerald-400 mb-1">{node.label}</div>
                  <div className="text-xs text-navy-500">{node.description}</div>
                </div>
                {i < LIQUIDITY_FLYWHEEL.length - 1 && (
                  <>
                    <ArrowRight className="hidden sm:block w-4 h-4 text-navy-600 flex-shrink-0" />
                    <ArrowDown className="sm:hidden w-4 h-4 text-navy-600 flex-shrink-0" />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-xs text-navy-600 italic flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Cycle repeats — network effects compound
            </div>
          </div>
        </div>
      )}

      {/* Growth Trajectory (expert) */}
      {showExpert && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-navy-300 mb-4">Growth Trajectory</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GROWTH_TRAJECTORY.map((phase) => (
              <div key={phase.phase} className="bg-navy-800/50 border border-navy-700 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {phase.phase}
                  </span>
                  <span className="text-sm font-medium text-white">{phase.name}</span>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="text-xs text-navy-400">
                    <span className="text-navy-500">Volume:</span> <span className="text-navy-300 font-mono">{phase.volume}</span>
                  </div>
                  <div className="text-xs text-navy-400">
                    <span className="text-navy-500">Savings:</span> <span className="text-emerald-400 font-mono">{phase.spread}</span>
                  </div>
                  <div className="text-xs text-navy-400">
                    <span className="text-navy-500">Counterparties:</span> <span className="text-navy-300 font-mono">{phase.counterparties}</span>
                  </div>
                </div>
                <p className="text-xs text-navy-500 leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Examples (expert) */}
      {showExpert && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-navy-300 mb-4">Detailed Transaction Examples</h4>
          <div className="space-y-4">
            {DETAILED_EXAMPLES.map((ex) => (
              <div key={ex.id} className="bg-navy-800/30 border border-navy-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-white">{ex.title}</h5>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Saving: {ex.saving}
                  </span>
                </div>
                <p className="text-xs text-navy-400 mb-3">{ex.scenario}</p>
                <ul className="space-y-1">
                  {ex.breakdown.map((line, i) => (
                    <li key={i} className="text-xs text-navy-300 font-mono flex items-start gap-2">
                      <span className="text-navy-600 mt-0.5">-</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
