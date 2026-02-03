import { useRef } from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';
import { useThemeTokenStore } from '../../stores/useStore';
import { Button } from '../common';

/**
 * Export/Import controls for theme token overrides.
 * Allows saving/loading customizations as JSON files.
 */
export function ThemeExportImport() {
  const { overrides, resetAllOverrides } = useThemeTokenStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasOverrides = Object.keys(overrides).length > 0;

  // Export overrides as JSON file
  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      overrides,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `niha-theme-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import overrides from JSON file
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.overrides || typeof data.overrides !== 'object') {
        throw new Error('Invalid theme file: missing overrides object');
      }

      // Apply overrides
      const { setOverride } = useThemeTokenStore.getState();
      Object.entries(data.overrides).forEach(([key, value]) => {
        if (typeof key === 'string' && typeof value === 'string') {
          setOverride(key, value);
        }
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[ThemeExportImport] Failed to import theme:', err);
      alert(
        'Failed to import theme file. Please ensure it is a valid JSON export.'
      );
    }
  };

  // Reset all overrides
  const handleResetAll = () => {
    if (
      window.confirm(
        'Reset all theme customizations to defaults? This cannot be undone.'
      )
    ) {
      resetAllOverrides();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-navy-700 bg-navy-900/50">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white mb-1">
          Theme Customizations
        </h4>
        <p className="text-xs text-navy-400">
          {hasOverrides
            ? `${Object.keys(overrides).length} token(s) customized`
            : 'No customizations active'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Export button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={!hasOverrides}
          className="flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>

        {/* Import button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleImport}
          className="flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Reset all button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetAll}
          disabled={!hasOverrides}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All
        </Button>
      </div>
    </div>
  );
}
