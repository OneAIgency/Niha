import { useState, useCallback } from 'react';
import { useThemeTokenStore } from '../stores/useStore';
import { Card, PageHeader } from '../components/common';
import { X } from 'lucide-react';
import { THEME_ELEMENT_CONFIG } from '../theme';

/**
 * Theme Containers page – Admin only.
 * Click any element to edit its theme parameters; overrides are saved and applied app-wide.
 */
export function ThemeContainersPage() {
  const overrides = useThemeTokenStore((s) => s.overrides);
  const setOverride = useThemeTokenStore((s) => s.setOverride);
  const resetElementOverrides = useThemeTokenStore((s) => s.resetElementOverrides);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Dark mode only - no theme switching needed
  const textPrimary = 'text-white';
  const textSecondary = 'text-navy-400';
  const sectionBorder = 'border-navy-700';

  const handleElementClick = useCallback((elementId: string) => {
    setSelectedElement((prev) => (prev === elementId ? null : elementId));
  }, []);

  const config = selectedElement ? THEME_ELEMENT_CONFIG[selectedElement] : null;

  const handleReset = useCallback(() => {
    const varNames = config?.params.map((p) => p.key) ?? [];
    if (selectedElement && varNames.length) {
      resetElementOverrides(varNames);
    }
  }, [selectedElement, config, resetElementOverrides]);

  return (
    <>
      <PageHeader
        title="Containers"
        subtitle="Click an element to edit its parameters. Changes are saved and applied across the app."
        className="mb-10"
      />

      <div className="space-y-12">
        {/* Page background & container */}
        <section aria-labelledby="page-containers-heading">
          <h2 id="page-containers-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Page background & container
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                data-theme-element="page_bg"
                onClick={() => handleElementClick('page_bg')}
                onKeyDown={(e) => e.key === 'Enter' && handleElementClick('page_bg')}
                className={`min-h-[120px] rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedElement === 'page_bg'
                    ? 'border-amber-500 ring-2 ring-amber-500/50'
                    : 'border-dashed border-navy-300 dark:border-navy-600'
                }`}
                style={{ backgroundColor: 'var(--page-bg-bg)' }}
                aria-label="Edit page-bg"
              >
                <span className={`text-sm ${textSecondary}`}>Click to edit</span>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.page-bg</p>
              <p className={`text-sm ${textSecondary}`}>
                min-h-screen background. Full-page wrapper for standard pages.
              </p>
            </div>
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                data-theme-element="page_container_dark"
                onClick={() => handleElementClick('page_container_dark')}
                onKeyDown={(e) => e.key === 'Enter' && handleElementClick('page_container_dark')}
                className={`min-h-[120px] rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedElement === 'page_container_dark'
                    ? 'border-amber-500 ring-2 ring-amber-500/50'
                    : 'border-dashed border-navy-300 dark:border-navy-600'
                }`}
                style={{ backgroundColor: 'var(--page-container-dark-bg)' }}
                aria-label="Edit page-container-dark"
              >
                <span className="text-sm text-navy-400">Click to edit</span>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.page-container-dark</p>
              <p className={`text-sm ${textSecondary}`}>
                min-h-screen bg. Dark full-page wrapper (e.g. login, backoffice).
              </p>
            </div>
          </div>
        </section>

        {/* Page section headers (Subheader & SubSubHeader) */}
        <section aria-labelledby="page-headers-heading">
          <h2 id="page-headers-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Page section headers (Subheader & SubSubHeader)
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <p className={`text-sm ${textSecondary} mb-4`}>
            Unified bar styling for page section headers. Tokens and classes in <code className="font-mono text-xs">design-tokens.css</code>; components in <code className="font-mono text-xs">components/common</code>. See Design System → Page Section Headers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="rounded-t-xl bg-navy-800 border-b border-navy-700 px-4 py-3" aria-hidden>
                <div className="max-w-7xl mx-auto flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-sm">T</div>
                  <div>
                    <p className="section-heading text-white text-base">Section title</p>
                    <p className="text-sm text-navy-400">Description</p>
                  </div>
                </div>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.subheader-bar</p>
              <p className={`text-sm ${textSecondary}`}>
                <code className="font-mono text-xs">--color-subheader-bg</code>, <code className="font-mono text-xs">--color-subheader-border</code>, padding. Used by <code className="font-mono text-xs">Subheader</code>.
              </p>
            </div>
            <div className="space-y-2">
              <div className="rounded-t-xl bg-navy-900/80 border-b border-navy-700 px-4 py-2" aria-hidden>
                <div className="max-w-7xl w-full mx-auto flex items-center justify-between text-sm text-navy-400">
                  <span>Left (filters, tabs)</span>
                  <span>Right (actions)</span>
                </div>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.subsubheader-bar</p>
              <p className={`text-sm ${textSecondary}`}>
                <code className="font-mono text-xs">--color-subsubheader-bg</code>, <code className="font-mono text-xs">--color-subsubheader-border</code>. Used by <code className="font-mono text-xs">SubSubHeader</code>. Sticky: <code className="font-mono text-xs">.page-section-header-sticky</code>.
              </p>
            </div>
          </div>

          {/* SubSubHeader Navigation Buttons */}
          <div className="mt-6 space-y-2">
            <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>SubSubHeader Navigation Buttons</h3>
            <div className="rounded-xl bg-navy-900/80 border-b border-navy-700 px-4 py-2" aria-hidden>
              <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
                <nav className="flex items-center gap-2">
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-active">
                    <span className="w-4 h-4 rounded bg-white/20" />
                    <span>Active Tab</span>
                    <span className="subsubheader-nav-badge">3</span>
                  </button>
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                    <span className="w-4 h-4 rounded bg-current opacity-50" />
                    <span>Inactive Tab</span>
                  </button>
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                    <span className="w-4 h-4 rounded bg-current opacity-50" />
                    <span>Another Tab</span>
                    <span className="subsubheader-nav-badge">12</span>
                  </button>
                </nav>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-400">Right actions</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-1">
                <p className={`font-mono text-sm ${textPrimary}`}>.subsubheader-nav-btn</p>
                <p className={`text-xs ${textSecondary}`}>Base class for navigation buttons in SubSubHeader.</p>
              </div>
              <div className="space-y-1">
                <p className={`font-mono text-sm ${textPrimary}`}>.subsubheader-nav-btn-active</p>
                <p className={`text-xs ${textSecondary}`}>Active state with <code className="font-mono text-xs">--color-subsubheader-nav-active-bg/text</code>.</p>
              </div>
              <div className="space-y-1">
                <p className={`font-mono text-sm ${textPrimary}`}>.subsubheader-nav-badge</p>
                <p className={`text-xs ${textSecondary}`}>Count badge (red bg). Use for pending/new items.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Page container (main content wrapper) */}
        <section aria-labelledby="content-containers-heading">
          <h2 id="content-containers-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Page container
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div
                className={`page-container rounded-xl border-2 ${sectionBorder} py-6 px-4 bg-navy-800/50`}
                aria-hidden
              >
                <p className={`text-sm ${textSecondary} text-center`}>Centered, max-w-7xl, responsive padding</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.page-container</p>
              <p className={`text-sm ${textSecondary}`}>
                max-w-7xl mx-auto px-4 sm:px-6 lg:px-8. Main content wrapper (Dashboard, Funding, Swap, etc.).
              </p>
            </div>
            <div className="space-y-2">
              <div
                className={`content-container-narrow rounded-xl border-2 ${sectionBorder} py-6 px-6 bg-navy-800/50`}
                aria-hidden
              >
                <p className={`text-sm ${textSecondary} text-center`}>max-w-6xl, px-6</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.content-container-narrow</p>
              <p className={`text-sm ${textSecondary}`}>
                max-w-6xl mx-auto px-6. Narrow content (forms, focused layout).
              </p>
            </div>
          </div>
        </section>

        {/* Section / card wrapper */}
        <section aria-labelledby="section-card-heading">
          <h2 id="section-card-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Section / card wrapper
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                data-theme-element="content_wrapper"
                onClick={() => handleElementClick('content_wrapper')}
                onKeyDown={(e) => e.key === 'Enter' && handleElementClick('content_wrapper')}
                className={`content_wrapper cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedElement === 'content_wrapper' ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-navy-900' : ''
                }`}
                aria-label="Edit content_wrapper"
              >
                <p className="text-sm text-navy-400">Label</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">0.00</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.content_wrapper</p>
              <p className={`text-sm ${textSecondary}`}>
                Dashboard cards (Cash, CEA/EUA Holdings, sections). Click to edit.
              </p>
            </div>
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                data-theme-element="content_wrapper_last"
                onClick={() => handleElementClick('content_wrapper_last')}
                onKeyDown={(e) => e.key === 'Enter' && handleElementClick('content_wrapper_last')}
                className={`content_wrapper_last cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedElement === 'content_wrapper_last' ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-navy-900' : ''
                }`}
                aria-label="Edit content_wrapper_last"
              >
                <p className={`text-sm ${textSecondary}`}>Placeholder content</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.content_wrapper_last</p>
              <p className={`text-sm ${textSecondary}`}>
                Section/card wrapper (theme vars). Card, StatCard. Click to edit.
              </p>
            </div>
            <div className="space-y-2">
              <div className="content_wrapper_last-hover cursor-pointer" aria-hidden>
                <p className={`text-sm ${textSecondary}`}>Hover for elevation</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.content_wrapper_last-hover</p>
              <p className={`text-sm ${textSecondary}`}>
                content_wrapper_last with hover (shadow, translate). Interactive cards.
              </p>
            </div>
            <div className="space-y-2">
              <Card aria-hidden>
                <p className={`text-sm ${textSecondary}`}>Card component</p>
              </Card>
              <p className={`font-mono text-sm ${textPrimary}`}>{'<Card />'}</p>
              <p className={`text-sm ${textSecondary}`}>
                Component using content_wrapper_last. Variants: default, glass, hover.
              </p>
            </div>
          </div>
        </section>

        {/* Table containers */}
        <section aria-labelledby="table-containers-heading">
          <h2 id="table-containers-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Table containers
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="table-container overflow-hidden rounded-xl" aria-hidden>
                <div className={`px-5 py-4 border-b ${sectionBorder} text-sm ${textSecondary}`}>
                  Header row
                </div>
                <div className={`px-5 py-3 text-sm ${textPrimary}`}>Row 1</div>
                <div className={`px-5 py-3 text-sm ${textPrimary}`}>Row 2</div>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.table-container</p>
              <p className={`text-sm ${textSecondary}`}>
                bg white/navy-800, rounded-xl, border. Standard data tables.
              </p>
            </div>
            <div className="space-y-2">
              <div className="table-container-dark overflow-hidden rounded-xl" aria-hidden>
                <div className={`px-5 py-4 border-b ${sectionBorder} text-sm ${textSecondary}`}>
                  Header
                </div>
                <div className={`px-5 py-3 text-sm ${textPrimary}`}>Row 1</div>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.table-container-dark</p>
              <p className={`text-sm ${textSecondary}`}>
                bg-navy-800/50, rounded-xl. Used by DataTable in dark contexts.
              </p>
            </div>
          </div>
        </section>

        {/* Others */}
        <section aria-labelledby="others-heading">
          <h2 id="others-heading" className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Others
          </h2>
          <div className="h-1 w-20 rounded-full bg-amber-500 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="card_contact_request_list rounded-lg" aria-hidden>
                <span className={`text-sm ${textSecondary}`}>Entitate · Nume · Data</span>
                <span className={`text-sm ${textPrimary}`}>Actions</span>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.card_contact_request_list</p>
              <p className={`text-sm ${textSecondary}`}>
                Compact list row for Contact Requests (Entitate, Nume, Data completării + actions).
              </p>
            </div>
            <div className="space-y-2">
              <div className={`section-spacing border-2 border-dashed ${sectionBorder} rounded-xl`} aria-hidden>
                <p className={`text-sm ${textSecondary} text-center`}>py-8 md:py-10</p>
              </div>
              <p className={`font-mono text-sm ${textPrimary}`}>.section-spacing</p>
              <p className={`text-sm ${textSecondary}`}>
                py-8 md:py-10. Vertical spacing between sections.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Editor panel */}
      {config && (
        <aside
          className="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-navy-800 border-l border-navy-700 shadow-xl overflow-y-auto"
          aria-label="Theme token editor"
        >
          <div className="sticky top-0 bg-navy-800 border-b border-navy-700 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit {config.label}</h3>
            <button
              type="button"
              onClick={() => setSelectedElement(null)}
              className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {config.params.map((param) => (
              <div key={param.key} className="space-y-1">
                <label className="block text-sm font-medium text-navy-300" htmlFor={param.key}>
                  {param.label}
                </label>
                {param.type === 'color' ? (
                  <div className="flex gap-2">
                    <input
                      id={param.key}
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(overrides[param.key] ?? '')
                          ? (overrides[param.key] as string)
                          // eslint-disable-next-line no-restricted-syntax -- Default fallback for color picker in theme editor
                          : '#1e293b'
                      }
                      onChange={(e) => setOverride(param.key, e.target.value)}
                      className="h-10 w-14 rounded border border-navy-600 bg-navy-900 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={overrides[param.key] ?? ''}
                      onChange={(e) => setOverride(param.key, e.target.value)}
                      placeholder="e.g. #1e293b"
                      className="flex-1 px-3 py-2 rounded-lg border border-navy-600 bg-navy-900 text-white placeholder-navy-500 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <input
                    id={param.key}
                    type="text"
                    value={overrides[param.key] ?? ''}
                    onChange={(e) => setOverride(param.key, e.target.value)}
                    placeholder="e.g. 0.75rem, 1.25rem"
                    className="w-full px-3 py-2 rounded-lg border border-navy-600 bg-navy-900 text-white placeholder-navy-500 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 px-4 rounded-lg border border-navy-600 text-navy-300 hover:bg-navy-700 hover:text-white transition-colors text-sm font-medium"
            >
              Reset to default
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
