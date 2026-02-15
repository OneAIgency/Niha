import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils';
import { CLIENT_PATHS } from './constants';

const borderColorMap = {
  emerald: 'border-t-emerald-500',
  amber: 'border-t-amber-500',
  blue: 'border-t-blue-500',
} as const;

const badgeColorMap = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
  blue: 'bg-blue-500/20 text-blue-400',
} as const;

export function ClientPathsSection() {
  return (
    <div>
      <h4 className="text-sm font-semibold text-navy-300 mb-4">Client Transaction Paths</h4>
      <div className="space-y-4">
        {CLIENT_PATHS.map((path) => (
          <div
            key={path.id}
            className={cn(
              'bg-navy-800/50 border border-navy-700 border-t-2 rounded-xl p-6',
              borderColorMap[path.color]
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', badgeColorMap[path.color])}>
                {path.label}
              </span>
              <span className="text-sm font-medium text-white">{path.title}</span>
            </div>

            {/* Key point */}
            <p className="text-xs text-navy-400 mb-4 italic">{path.keyPoint}</p>

            {/* Mini flow */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {path.steps.map((step, i) => (
                <div key={step} className="contents">
                  <span className="text-xs bg-navy-900/50 border border-navy-700 rounded-md px-2 py-1 text-navy-300">
                    {step}
                  </span>
                  {i < path.steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-navy-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-navy-900/30 rounded-md p-2 text-navy-500">
                {path.comparison.via}
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-2 text-emerald-400">
                {path.comparison.niha}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
