import { useIntroducerStore } from '../../stores/useIntroducerStore';
import { VALUE_PROPOSITIONS, depthAtLeast } from './constants';

const iconBgMap = {
  emerald: 'bg-emerald-500/20',
  amber: 'bg-amber-500/20',
  blue: 'bg-blue-500/20',
} as const;

const iconTextMap = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
} as const;

export function ValuePropositionCards() {
  const { contentDepth } = useIntroducerStore();
  const visibleProps = VALUE_PROPOSITIONS.filter((p) => depthAtLeast(contentDepth, p.depth));
  const showExtended = depthAtLeast(contentDepth, 'advanced');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visibleProps.map((prop) => (
        <div
          key={prop.title}
          className="bg-navy-800/50 border border-navy-700 rounded-xl p-6 flex items-start gap-4"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgMap[prop.color]}`}>
            <span className={`text-lg font-bold ${iconTextMap[prop.color]}`}>
              {prop.title.charAt(0)}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{prop.title}</div>
            <div className="text-xs text-navy-400 mt-1 leading-relaxed">
              {prop.description}
            </div>
            {showExtended && prop.extendedDescription && (
              <div className="text-xs text-navy-500 mt-2 leading-relaxed border-t border-navy-700 pt-2">
                {prop.extendedDescription}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
