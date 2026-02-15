import { ArrowRight, ArrowDown } from 'lucide-react';
import { useSection } from './SectionRegistry';
import { SECTION_IDS, HOW_IT_WORKS_STEPS } from './constants';

export function HowItWorksFlow() {
  const ref = useSection(SECTION_IDS.MECHANISM);

  return (
    <section ref={ref} id={SECTION_IDS.MECHANISM}>
      <h3 className="section-heading text-white mb-6">How It Works</h3>

      <div className="flex flex-col lg:flex-row items-stretch gap-2">
        {HOW_IT_WORKS_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="contents">
              {/* Step card */}
              <div className="flex-1 bg-navy-800/50 border border-navy-700 rounded-lg p-4 flex flex-col items-center text-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <Icon className="w-5 h-5 text-navy-300" />
                <div>
                  <div className="text-sm font-medium text-navy-200">{step.title}</div>
                  <div className="text-xs text-navy-500 mt-1">{step.subtitle}</div>
                </div>
              </div>

              {/* Arrow between steps (not after last) */}
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
    </section>
  );
}
