import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, FileCode, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeTokenStore } from '../../stores/useStore';
import { TokenInput } from './TokenInput';
import type { InputElementConfig } from '../../theme/tokens';

interface InputElementDetailPanelProps {
  config: InputElementConfig;
}

/**
 * Expandable detail panel for an input element.
 * Shows all CSS parameters with live editing, plus usage/suggestion sections.
 */
export function InputElementDetailPanel({ config }: InputElementDetailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { overrides, resetElementOverrides } = useThemeTokenStore();

  const tokenKeys = config.tokens.map((t) => t.key);
  const modifiedCount = tokenKeys.filter((key) => key in overrides).length;

  const handleResetAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetElementOverrides(tokenKeys);
  };

  return (
    <div className="mt-2 rounded-xl border border-navy-700 bg-navy-900/50 overflow-hidden">
      {/* Toggle Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-navy-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-navy-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-navy-400" />
          )}
          <span className="text-xs font-medium text-emerald-400">Details</span>
          <span className="text-xs text-navy-500">
            {config.tokens.length} parameters
          </span>
          {modifiedCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-400">
              {modifiedCount} modified
            </span>
          )}
        </div>

        {modifiedCount > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-navy-800 text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-navy-700">
          {/* Parameters Section */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-emerald-500" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Parameters
              </h4>
            </div>
            <p className="text-xs text-navy-400 mb-3">{config.description}</p>
            <div className="space-y-1">
              {config.tokens.map((token) => (
                <TokenInput key={token.key} token={token} />
              ))}
            </div>
          </div>

          {/* Used In Section */}
          <div className="border-t border-navy-700/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Used In ({config.usedIn.length} pages)
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.usedIn.map((usage) => (
                <Link
                  key={usage.path + usage.component}
                  to={usage.path}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-navy-800 border border-navy-700 text-navy-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                >
                  <span className="font-medium">{usage.page}</span>
                  {usage.component && (
                    <code className="text-[10px] text-navy-500">{usage.component}</code>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Suggestions Section */}
          {config.suggestedFor.length > 0 && (
            <div className="border-t border-navy-700/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Suggested For ({config.suggestedFor.length} pages)
                </h4>
              </div>
              <p className="text-[10px] text-navy-500 mb-2">
                Pages that could benefit from this element but don&apos;t use it yet.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {config.suggestedFor.map((usage) => (
                  <Link
                    key={usage.path + usage.component}
                    to={usage.path}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-navy-800/50 border border-dashed border-navy-700 text-navy-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors"
                  >
                    <span className="font-medium">{usage.page}</span>
                    {usage.component && (
                      <code className="text-[10px] text-navy-600">{usage.component}</code>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
