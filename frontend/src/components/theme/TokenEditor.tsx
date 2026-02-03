import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useThemeTokenStore } from '../../stores/useStore';
import { TokenInput } from './TokenInput';
import type { TokenConfig } from '../../theme/tokens';

interface TokenEditorProps {
  /** Array of token configurations to display */
  tokens: TokenConfig[];
  /** Section title */
  title?: string;
  /** Start collapsed (default: true) */
  collapsed?: boolean;
}

/**
 * Collapsible token editor panel for a category of design tokens.
 * Shows all tokens with their editors and provides bulk reset.
 */
export function TokenEditor({
  tokens,
  title = 'Edit Tokens',
  collapsed = true,
}: TokenEditorProps) {
  const [isOpen, setIsOpen] = useState(!collapsed);
  const { overrides, resetElementOverrides } = useThemeTokenStore();

  // Count how many tokens in this category are modified
  const tokenKeys = tokens.map((t) => t.key);
  const modifiedCount = tokenKeys.filter((key) => key in overrides).length;

  // Reset all tokens in this category
  const handleResetCategory = () => {
    resetElementOverrides(tokenKeys);
  };

  return (
    <div className="mt-4 rounded-xl border border-navy-700 bg-navy-900/50 overflow-hidden">
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-navy-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-navy-400" />
          )}
          <span className="text-sm font-medium text-white">{title}</span>
          {modifiedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
              {modifiedCount} modified
            </span>
          )}
        </div>

        {/* Reset all button (only show if something is modified) */}
        {modifiedCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetCategory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-800 text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-navy-700 p-3 space-y-1">
          {tokens.map((token) => (
            <TokenInput key={token.key} token={token} />
          ))}

          {tokens.length === 0 && (
            <p className="text-sm text-navy-500 text-center py-4">
              No tokens in this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
