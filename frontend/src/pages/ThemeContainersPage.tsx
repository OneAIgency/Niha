import { useState } from 'react';
import { X, Check, AlertTriangle, Info, Trash2, Edit3, Download, Filter, ChevronDown } from 'lucide-react';
import { Card, PageHeader, Badge, Tabs } from '../components/common';

/**
 * Theme Containers page – Design System reference for structural components.
 * Shows: Layouts, Headers, Tabs, Cards/Wrappers, Tables, Modals
 */
export function ThemeContainersPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [certTab, setCertTab] = useState<'EUA' | 'CEA'>('EUA');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Containers & Structure"
        subtitle="Structural components: layouts, headers, tabs, cards, tables, modals."
        className="mb-10"
      />

      <div className="space-y-16">
        {/* ============================================
            SECTION 1: LAYOUTS
            ============================================ */}
        <section aria-labelledby="layouts-heading">
          <h2 id="layouts-heading" className="text-2xl font-bold text-white mb-2">
            1. Layouts
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Page-level wrappers that define background and content width.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* page-bg */}
            <div className="space-y-3">
              <div
                className="min-h-[100px] rounded-xl border-2 border-dashed border-navy-600 flex items-center justify-center"
                style={{ backgroundColor: 'var(--page-bg-bg)' }}
              >
                <span className="text-sm text-navy-400">.page-bg background</span>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.page-bg</code>
                <p className="text-xs text-navy-400 mt-1">
                  min-h-screen background. Used by most pages (Dashboard, Funding, etc.)
                </p>
              </div>
            </div>

            {/* page-container-dark */}
            <div className="space-y-3">
              <div
                className="min-h-[100px] rounded-xl border-2 border-dashed border-navy-600 flex items-center justify-center"
                style={{ backgroundColor: 'var(--page-container-dark-bg)' }}
              >
                <span className="text-sm text-navy-500">.page-container-dark background</span>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.page-container-dark</code>
                <p className="text-xs text-navy-400 mt-1">
                  Darker variant (navy-950). Used by Login, Backoffice.
                </p>
              </div>
            </div>

            {/* page-container */}
            <div className="space-y-3">
              <div className="page-container rounded-xl border-2 border-navy-700 py-4 bg-navy-800/30">
                <p className="text-sm text-navy-400 text-center">max-w-7xl centered content</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.page-container</code>
                <p className="text-xs text-navy-400 mt-1">
                  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8. Main content wrapper.
                </p>
              </div>
            </div>

            {/* content-container-narrow */}
            <div className="space-y-3">
              <div className="content-container-narrow rounded-xl border-2 border-navy-700 py-4 bg-navy-800/30">
                <p className="text-sm text-navy-400 text-center">max-w-6xl narrow content</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.content-container-narrow</code>
                <p className="text-xs text-navy-400 mt-1">
                  max-w-6xl mx-auto px-6. For forms, focused layouts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 2: HEADERS
            ============================================ */}
        <section aria-labelledby="headers-heading">
          <h2 id="headers-heading" className="text-2xl font-bold text-white mb-2">
            2. Headers
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Page section headers. Subheader is fixed below main nav; SubSubHeader for secondary navigation.
          </p>

          <div className="space-y-8">
            {/* Subheader */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Subheader (fixed below main nav)</p>
              <div className="rounded-xl overflow-hidden border border-navy-700">
                <div className="bg-navy-800 border-b border-navy-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <span className="text-amber-500 font-bold">P</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Page Title</h3>
                        <p className="text-sm text-navy-400">Page description</p>
                      </div>
                    </div>
                    <nav className="flex items-center gap-2">
                      <button className="subheader-nav-btn subheader-nav-btn-active">
                        <span>Tab 1</span>
                      </button>
                      <button className="subheader-nav-btn subheader-nav-btn-inactive">
                        <span>Tab 2</span>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.subheader-bar</code>
                <span className="text-navy-500 text-xs ml-2">+ .subheader-nav-btn, .subheader-nav-btn-active</span>
              </div>
            </div>

            {/* SubSubHeader */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">SubSubHeader (secondary nav, filters)</p>
              <div className="rounded-xl overflow-hidden border border-navy-700">
                <div className="subsubheader-bar justify-between">
                  <nav className="flex items-center gap-2">
                    <button className="subsubheader-nav-btn subsubheader-nav-btn-active">
                      <span>All</span>
                      <span className="subsubheader-nav-badge">24</span>
                    </button>
                    <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                      <span>Pending</span>
                      <span className="subsubheader-nav-badge">3</span>
                    </button>
                    <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                      <span>Completed</span>
                    </button>
                  </nav>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.subsubheader-bar</code>
                <span className="text-navy-500 text-xs ml-2">+ .subsubheader-nav-btn, .subsubheader-nav-badge</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 3: TABS
            ============================================ */}
        <section aria-labelledby="tabs-heading">
          <h2 id="tabs-heading" className="text-2xl font-bold text-white mb-2">
            3. Tabs
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Tab components for navigation and filtering.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Default Tabs */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Default Tabs</p>
              <Tabs
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'analytics', label: 'Analytics', badge: 5 },
                  { id: 'reports', label: 'Reports' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <code className="text-emerald-400 text-xs block">{'<Tabs tabs={[...]} activeTab={...} onChange={...} />'}</code>
            </div>

            {/* Pills Tabs */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Pills Variant</p>
              <Tabs
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'reports', label: 'Reports' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <code className="text-emerald-400 text-xs block">{'<Tabs variant="pills" ... />'}</code>
            </div>

            {/* Certificate Toggle */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Certificate Toggle (EUA/CEA)</p>
              <div className="tab-toggle">
                <button
                  className={`tab-toggle-item ${certTab === 'EUA' ? 'tab-toggle-item-active-eua' : 'tab-toggle-item-inactive'}`}
                  onClick={() => setCertTab('EUA')}
                >
                  EUA
                </button>
                <button
                  className={`tab-toggle-item ${certTab === 'CEA' ? 'tab-toggle-item-active-cea' : 'tab-toggle-item-inactive'}`}
                  onClick={() => setCertTab('CEA')}
                >
                  CEA
                </button>
              </div>
              <code className="text-emerald-400 text-xs block">.tab-toggle + .tab-toggle-item-active-eua/cea</code>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Buy/Sell Toggle</p>
              <div className="flex rounded-lg overflow-hidden border border-navy-600">
                <button
                  className={`trade-tab ${tradeTab === 'buy' ? 'trade-tab-buy-active' : 'trade-tab-buy-inactive'}`}
                  onClick={() => setTradeTab('buy')}
                >
                  Buy
                </button>
                <button
                  className={`trade-tab ${tradeTab === 'sell' ? 'trade-tab-sell-active' : 'trade-tab-sell-inactive'}`}
                  onClick={() => setTradeTab('sell')}
                >
                  Sell
                </button>
              </div>
              <code className="text-emerald-400 text-xs block">.trade-tab + .trade-tab-buy/sell-active</code>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 4: CARDS & WRAPPERS
            ============================================ */}
        <section aria-labelledby="cards-heading">
          <h2 id="cards-heading" className="text-2xl font-bold text-white mb-2">
            4. Cards & Wrappers
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Container components for grouping content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* content_wrapper */}
            <div className="space-y-3">
              <div className="content_wrapper">
                <p className="text-sm text-navy-400">Label</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">€1,234.56</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.content_wrapper</code>
                <p className="text-xs text-navy-400 mt-1">Dashboard stat cards, holdings display.</p>
              </div>
            </div>

            {/* content_wrapper_last */}
            <div className="space-y-3">
              <div className="content_wrapper_last p-4">
                <p className="text-sm text-navy-400">Section content goes here</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.content_wrapper_last</code>
                <p className="text-xs text-navy-400 mt-1">Generic card/section wrapper.</p>
              </div>
            </div>

            {/* content_wrapper_last-hover */}
            <div className="space-y-3">
              <div className="content_wrapper_last-hover p-4 cursor-pointer">
                <p className="text-sm text-navy-400">Hover me for elevation</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.content_wrapper_last-hover</code>
                <p className="text-xs text-navy-400 mt-1">Interactive card with hover effect.</p>
              </div>
            </div>

            {/* Card component */}
            <div className="space-y-3">
              <Card className="p-4">
                <p className="text-sm text-navy-400">Card component</p>
              </Card>
              <div>
                <code className="text-emerald-400 text-sm">{'<Card />'}</code>
                <p className="text-xs text-navy-400 mt-1">React component. Variants: default, glass, hover.</p>
              </div>
            </div>

            {/* Card glass */}
            <div className="space-y-3">
              <Card variant="glass" className="p-4">
                <p className="text-sm text-navy-400">Glass card</p>
              </Card>
              <div>
                <code className="text-emerald-400 text-sm">{'<Card variant="glass" />'}</code>
                <p className="text-xs text-navy-400 mt-1">Backdrop blur effect.</p>
              </div>
            </div>

            {/* stat-card */}
            <div className="space-y-3">
              <div className="stat-card">
                <p className="text-sm text-navy-400">Stat Card</p>
                <p className="text-xl font-bold text-white mt-1">Value</p>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.stat-card</code>
                <p className="text-xs text-navy-400 mt-1">Gradient background stat display.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 5: TABLES
            ============================================ */}
        <section aria-labelledby="tables-heading">
          <h2 id="tables-heading" className="text-2xl font-bold text-white mb-2">
            5. Tables
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Table container styles for data display.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* table-container */}
            <div className="space-y-3">
              <div className="table-container">
                <div className="table-header-cell border-b border-navy-700">HEADER</div>
                <div className="table-row-hover">
                  <div className="table-cell">Row 1 content</div>
                </div>
                <div className="table-row-hover">
                  <div className="table-cell">Row 2 content</div>
                </div>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.table-container</code>
                <p className="text-xs text-navy-400 mt-1">Standard data tables. Use with .table-header-cell, .table-row-hover, .table-cell.</p>
              </div>
            </div>

            {/* table-container-dark */}
            <div className="space-y-3">
              <div className="table-container-dark">
                <div className="px-5 py-3 text-xs uppercase text-navy-400 border-b border-navy-700">HEADER</div>
                <div className="table-row-dark">
                  <div className="px-5 py-3 text-sm text-white">Row 1</div>
                </div>
                <div className="table-row-dark">
                  <div className="px-5 py-3 text-sm text-white">Row 2</div>
                </div>
              </div>
              <div>
                <code className="text-emerald-400 text-sm">.table-container-dark</code>
                <p className="text-xs text-navy-400 mt-1">Darker variant with .table-row-dark.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 6: MODALS
            ============================================ */}
        <section aria-labelledby="modals-heading">
          <h2 id="modals-heading" className="text-2xl font-bold text-white mb-2">
            6. Modals
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Dialog and modal patterns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Modal Trigger */}
            <div className="space-y-3">
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Open Standard Modal
              </button>
              <p className="text-xs text-navy-400">
                Full-screen overlay with centered content card.
              </p>
            </div>

            {/* Confirmation Modal Trigger */}
            <div className="space-y-3">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="btn-secondary"
              >
                Open Confirmation Modal
              </button>
              <p className="text-xs text-navy-400">
                Compact dialog for confirm/cancel actions.
              </p>
            </div>

            {/* Modal Structure Preview */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-sm font-medium text-white">Modal Structure</p>
              <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-4">
                <pre className="text-xs text-navy-300 overflow-x-auto">
{`<!-- Backdrop -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
  <!-- Centered container -->
  <div class="flex items-center justify-center min-h-screen p-4">
    <!-- Modal card -->
    <div class="bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-navy-700">
        <h2>Title</h2>
        <button>×</button>
      </div>
      <!-- Body -->
      <div class="px-6 py-4">Content</div>
      <!-- Footer -->
      <div class="px-6 py-4 border-t border-navy-700 flex justify-end gap-3">
        <button class="btn-ghost">Cancel</button>
        <button class="btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SECTION 7: ALERTS
            ============================================ */}
        <section aria-labelledby="alerts-heading">
          <h2 id="alerts-heading" className="text-2xl font-bold text-white mb-2">
            7. Alerts & Feedback
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-4" />
          <p className="text-navy-400 mb-6">
            Inline feedback components.
          </p>

          <div className="space-y-4">
            {/* Success */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-emerald-400">Success</p>
                <p className="text-sm text-navy-300">Operation completed successfully.</p>
              </div>
              <button className="text-navy-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-400">Warning</p>
                <p className="text-sm text-navy-300">Please review before continuing.</p>
              </div>
              <button className="text-navy-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Error */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <X className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-400">Error</p>
                <p className="text-sm text-navy-300">Something went wrong. Please try again.</p>
              </div>
              <button className="text-navy-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-400">Info</p>
                <p className="text-sm text-navy-300">Here's some helpful information.</p>
              </div>
              <button className="text-navy-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================
          STANDARD MODAL
          ============================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Modal Title</h2>
                  <p className="text-sm text-navy-400">Modal description</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-navy-300 mb-4">
                This is the modal body content. Add forms, information, or any content here.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Input Field</label>
                  <input type="text" className="form-input" placeholder="Enter value..." />
                </div>
                <div>
                  <label className="form-label">Select Field</label>
                  <div className="relative">
                    <select className="form-input appearance-none pr-10">
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-navy-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          CONFIRMATION MODAL
          ============================================ */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Body */}
            <div className="px-6 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Delete Item?</h2>
              <p className="text-sm text-navy-400">
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-navy-700 flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
