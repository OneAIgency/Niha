import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Leaf,
  Wind,
  Search,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Activity,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Menu,
  Loader2,
} from 'lucide-react';
import { useUIStore } from '../stores/useStore';
import { Card, Button, Badge, Tabs, ToggleGroup, ProgressBar, Skeleton, StatCard, ConfirmationModal } from '../components/common';
import { TokenEditor, ThemeExportImport } from '../components/theme';
import { DESIGN_TOKEN_CATEGORIES } from '../theme';

/**
 * Theme Section Page - Renders individual design system sections based on route
 */
export function ThemeSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  // State for interactive components
  const [activeTab, setActiveTab] = useState('tab1');
  const [activeCertToggle, setActiveCertToggle] = useState('eua');
  const [activeTradeToggle, setActiveTradeToggle] = useState('buy');
  const [showModal, setShowModal] = useState(false);

  const textPrimary = isDark ? 'text-white' : 'text-navy-900';
  const textSecondary = isDark ? 'text-navy-400' : 'text-navy-600';
  const textMuted = isDark ? 'text-navy-500' : 'text-navy-500';

  // Redirect invalid sections to layout
  const validSections = ['layout', 'containers', 'colors', 'typography', 'buttons', 'inputs', 'badges', 'tabs', 'cards', 'tables', 'feedback', 'loading'];
  if (!section || !validSections.includes(section)) {
    return <Navigate to="/theme/layout" replace />;
  }

  return (
    <div className="relative">
      {section === 'layout' && (
        <LayoutSection textPrimary={textPrimary} textSecondary={textSecondary} />
      )}

      {section === 'containers' && (
        <ContainersSection textSecondary={textSecondary} />
      )}

      {section === 'colors' && (
        <ColorsSection textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />
      )}

      {section === 'typography' && (
        <TypographySection textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted} />
      )}

      {section === 'buttons' && (
        <ButtonsSection textSecondary={textSecondary} />
      )}

      {section === 'inputs' && (
        <InputsSection textSecondary={textSecondary} textMuted={textMuted} isDark={isDark} />
      )}

      {section === 'badges' && (
        <BadgesSection textSecondary={textSecondary} isDark={isDark} />
      )}

      {section === 'tabs' && (
        <TabsSection
          textSecondary={textSecondary}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeCertToggle={activeCertToggle}
          setActiveCertToggle={setActiveCertToggle}
          activeTradeToggle={activeTradeToggle}
          setActiveTradeToggle={setActiveTradeToggle}
        />
      )}

      {section === 'cards' && (
        <CardsSection textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />
      )}

      {section === 'tables' && (
        <TablesSection textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />
      )}

      {section === 'feedback' && (
        <FeedbackSection
          textSecondary={textSecondary}
          isDark={isDark}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}

      {section === 'loading' && (
        <LoadingSection textSecondary={textSecondary} textMuted={textMuted} />
      )}
    </div>
  );
}

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="h-1 w-16 rounded-full bg-emerald-500 mt-2" />
    </div>
  );
}

// ============================================
// LAYOUT SECTION
// ============================================
function LayoutSection({ textSecondary }: { textPrimary: string; textSecondary: string }) {
  return (
    <>
      <SectionHeader title="Standard Page Layout" />
      <p className={`text-sm ${textSecondary} mb-6`}>
        Every page follows this structure. Fixed header and subheader, optional sticky subsubheader, then page content.
      </p>

      {/* HEADER ANATOMY */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-xs font-bold">1</span>
          Header
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          Fixed at top, z-50, height h-16 (mobile) / h-20 (desktop). Contains logo, price ticker, navigation, and user menu.
        </p>

        {/* Header Preview */}
        <div className="rounded-xl overflow-hidden">
          <header className="bg-navy-900/80 backdrop-blur-lg border-b border-navy-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 md:h-20">
                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="text-xl font-bold text-white">NIHAO</span>
                  <span className="text-xl font-bold text-emerald-400">GROUP</span>
                </div>
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-lg bg-navy-800/50 border border-navy-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-400">E</span>
                    </div>
                    <span className="text-sm font-medium text-white font-mono">€72.45</span>
                    <span className="text-xs text-emerald-400">+1.2%</span>
                  </div>
                  <div className="w-px h-4 bg-navy-600" />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-400">C</span>
                    </div>
                    <span className="text-sm font-medium text-white font-mono">€48.30</span>
                    <span className="text-xs text-red-400">-0.5%</span>
                  </div>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                  <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer">Dashboard</span>
                  <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer">Funding</span>
                  <span className="text-sm font-medium text-white cursor-pointer">CEA Cash</span>
                  <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer">Swap</span>
                  <div className="flex items-center gap-2 p-1 rounded-full">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      AU
                    </div>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>
                </nav>
                <div className="md:hidden p-2 rounded-lg border border-navy-700">
                  <Menu className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Header Specs */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Position</p>
            <code className="text-sm text-emerald-400">fixed top-0 left-0 right-0</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Z-Index</p>
            <code className="text-sm text-emerald-400">z-50</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Height</p>
            <code className="text-sm text-emerald-400">h-16 md:h-20</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Background</p>
            <code className="text-sm text-emerald-400">bg-navy-900/80 backdrop-blur-lg</code>
          </div>
        </div>
      </div>

      {/* SUBHEADER ANATOMY */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">2</span>
          Subheader
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          Fixed below header, z-40. Contains page icon, title, description, and optional right-side content.
        </p>

        <div className="rounded-xl overflow-hidden">
          <div className="subheader-bar !static">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="section-heading text-white">Cash Market</h1>
                    <p className="text-sm text-navy-400">CEA Buy & Sell</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <nav className="flex items-center gap-1 p-1 rounded-lg bg-navy-900/50">
                    <button className="subheader-nav-btn subheader-nav-btn-active">Order Book</button>
                    <button className="subheader-nav-btn subheader-nav-btn-inactive">My Orders</button>
                  </nav>
                  <button className="p-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-navy-400 hover:text-white">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Position</p>
            <code className="text-sm text-blue-400">fixed top-16 md:top-20</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Z-Index</p>
            <code className="text-sm text-blue-400">z-40</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Class</p>
            <code className="text-sm text-blue-400">.subheader-bar</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Background</p>
            <code className="text-sm text-blue-400">bg-navy-800 border-b</code>
          </div>
        </div>
      </div>

      {/* SUBSUBHEADER */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-xs font-bold text-navy-900">3</span>
          SubSubHeader
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          Optional bar below Subheader for page-specific filters, toggles, and actions.
        </p>

        <div className="rounded-xl overflow-hidden">
          <div className="subsubheader-bar justify-between">
            <div className="flex items-center gap-2">
              <button className="subsubheader-nav-btn subsubheader-nav-btn-active">
                All <span className="subsubheader-nav-badge">24</span>
              </button>
              <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                Pending <span className="subsubheader-nav-badge">3</span>
              </button>
              <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">Completed</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-navy-400 hover:bg-navy-700/50 hover:text-white">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-navy-400 hover:bg-navy-700/50 hover:text-white">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Position</p>
            <code className="text-sm text-amber-400">static (or sticky)</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Class</p>
            <code className="text-sm text-amber-400">.subsubheader-bar</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Background</p>
            <code className="text-sm text-amber-400">bg-navy-900/80</code>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
            <p className="text-xs text-navy-400 mb-1">Border</p>
            <code className="text-sm text-amber-400">border-b border-navy-700</code>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// CONTAINERS SECTION
// ============================================
function ContainersSection({ textSecondary }: { textSecondary: string }) {
  return (
    <>
      <SectionHeader title="CSS Container Classes" />
      <p className={`text-sm ${textSecondary} mb-6`}>
        Reusable CSS classes for page layouts, wrappers, and content containers.
      </p>

      {/* Layout Classes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Layout Classes</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div
              className="min-h-[80px] rounded-xl border-2 border-dashed border-navy-600 flex items-center justify-center"
              style={{ backgroundColor: 'var(--page-bg-bg)' }}
            >
              <span className="text-sm text-navy-400">.page-bg background</span>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.page-bg</code>
              <p className="text-xs text-navy-400 mt-1">min-h-screen background for most pages</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="page-container rounded-xl border-2 border-navy-700 py-4 bg-navy-800/30">
              <p className="text-sm text-navy-400 text-center">max-w-7xl centered</p>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.page-container</code>
              <p className="text-xs text-navy-400 mt-1">max-w-7xl mx-auto px-4 sm:px-6 lg:px-8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card/Wrapper Classes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Card & Wrapper Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="content_wrapper">
              <p className="text-sm text-navy-400">Label</p>
              <p className="text-2xl font-bold text-white font-mono mt-1">€1,234.56</p>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.content_wrapper</code>
              <p className="text-xs text-navy-400 mt-1">Dashboard stat cards</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="content_wrapper_last p-4">
              <p className="text-sm text-navy-400">Section content</p>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.content_wrapper_last</code>
              <p className="text-xs text-navy-400 mt-1">Generic section wrapper</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="content_wrapper_last-hover p-4 cursor-pointer">
              <p className="text-sm text-navy-400">Hover me</p>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.content_wrapper_last-hover</code>
              <p className="text-xs text-navy-400 mt-1">Interactive with hover effect</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Classes */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Table Classes</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="table-container">
              <div className="table-header-cell border-b border-navy-700">HEADER</div>
              <div className="table-row-hover">
                <div className="table-cell">Row 1</div>
              </div>
              <div className="table-row-hover">
                <div className="table-cell">Row 2</div>
              </div>
            </div>
            <div>
              <code className="text-emerald-400 text-sm">.table-container</code>
              <p className="text-xs text-navy-400 mt-1">+ .table-header-cell, .table-row-hover</p>
            </div>
          </div>

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
              <p className="text-xs text-navy-400 mt-1">Darker variant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Container Token Editor */}
      <TokenEditor
        tokens={DESIGN_TOKEN_CATEGORIES.containers.tokens}
        title="Edit Container Tokens"
      />
    </>
  );
}

// ============================================
// COLORS SECTION
// ============================================
function ColorsSection({ textPrimary, textSecondary, isDark }: { textPrimary: string; textSecondary: string; isDark: boolean }) {
  return (
    <>
      <SectionHeader title="Color Palette" />

      {/* Theme Export/Import Controls */}
      <div className="mb-6">
        <ThemeExportImport />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[
          { name: 'Navy', shades: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'], base: 'navy' },
          { name: 'Emerald', shades: ['100', '400', '500', '600'], base: 'emerald' },
          { name: 'Blue', shades: ['100', '400', '500', '600'], base: 'blue' },
          { name: 'Amber', shades: ['100', '400', '500', '600'], base: 'amber' },
          { name: 'Red', shades: ['100', '400', '500', '600'], base: 'red' },
        ].map((color) => (
          <div key={color.name} className="space-y-2">
            <p className={`text-sm font-semibold ${textPrimary}`}>{color.name}</p>
            <div className="space-y-1">
              {color.shades.map((shade) => (
                <div
                  key={shade}
                  className={`h-8 rounded-lg bg-${color.base}-${shade} flex items-center justify-end px-2`}
                >
                  <span className={`text-xs font-mono ${parseInt(shade) > 400 ? 'text-white' : 'text-navy-900'}`}>
                    {shade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Background', class: isDark ? 'bg-navy-950' : 'bg-navy-50' },
          { name: 'Surface', class: isDark ? 'bg-navy-800' : 'bg-white' },
          { name: 'Primary (CTA)', class: 'bg-emerald-500' },
          { name: 'EUA', class: 'bg-blue-500' },
          { name: 'CEA', class: 'bg-amber-500' },
          { name: 'Success', class: 'bg-emerald-500' },
          { name: 'Warning', class: 'bg-amber-500' },
          { name: 'Error', class: 'bg-red-500' },
        ].map((c) => (
          <Card key={c.name} className="p-3">
            <div className={`h-10 rounded-lg ${c.class} mb-2`} />
            <p className={`text-xs font-medium ${textSecondary}`}>{c.name}</p>
          </Card>
        ))}
      </div>

      {/* Color Token Editor */}
      <TokenEditor
        tokens={DESIGN_TOKEN_CATEGORIES.colors.tokens}
        title="Edit Color Tokens"
      />
    </>
  );
}

// ============================================
// TYPOGRAPHY SECTION
// ============================================
function TypographySection({ textPrimary, textSecondary, textMuted }: { textPrimary: string; textSecondary: string; textMuted: string }) {
  return (
    <>
      <SectionHeader title="Typography" />
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className={`text-xs ${textMuted}`}>text-xs - Labels, captions</p>
            <p className={`text-sm ${textSecondary}`}>text-sm - Secondary text</p>
            <p className={`text-base ${textPrimary}`}>text-base - Body text</p>
            <p className={`text-lg font-semibold ${textPrimary}`}>text-lg - Emphasized</p>
            <p className={`text-xl font-bold ${textPrimary}`}>text-xl - Section heading</p>
            <p className={`text-2xl font-bold ${textPrimary}`}>text-2xl - Page title</p>
          </div>
          <div className="space-y-4">
            <div>
              <p className={`text-xs ${textMuted} mb-1`}>Monospace (prices, IDs)</p>
              <p className="font-mono text-xl font-semibold text-emerald-500">€99.50</p>
            </div>
            <div>
              <p className={`text-xs ${textMuted} mb-1`}>Positive change</p>
              <p className="font-mono text-lg font-semibold text-emerald-500">+2.5%</p>
            </div>
            <div>
              <p className={`text-xs ${textMuted} mb-1`}>Negative change</p>
              <p className="font-mono text-lg font-semibold text-red-500">-1.2%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Typography Token Editor */}
      <TokenEditor
        tokens={DESIGN_TOKEN_CATEGORIES.typography.tokens}
        title="Edit Typography Tokens"
      />

      {/* Spacing Token Editor */}
      <TokenEditor
        tokens={DESIGN_TOKEN_CATEGORIES.spacing.tokens}
        title="Edit Spacing Tokens"
      />

      {/* Radius Token Editor */}
      <TokenEditor
        tokens={DESIGN_TOKEN_CATEGORIES.radius.tokens}
        title="Edit Radius Tokens"
      />
    </>
  );
}

// ============================================
// BUTTONS SECTION
// ============================================
function ButtonsSection({ textSecondary }: { textSecondary: string }) {
  return (
    <>
      <SectionHeader title="Buttons" />
      <Card className="p-6 space-y-6">
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Variants</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Sizes</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>With Icons</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>States</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading</Button>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============================================
// INPUTS SECTION
// ============================================
function InputsSection({ textSecondary, textMuted, isDark }: { textSecondary: string; textMuted: string; isDark: boolean }) {
  return (
    <>
      <SectionHeader title="Inputs" />
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`mb-2 block text-sm font-medium ${textSecondary}`}>Default</label>
            <input
              type="text"
              placeholder="Enter text..."
              className={`w-full rounded-xl border-2 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white placeholder-navy-400' : 'border-navy-200 bg-white text-navy-900 placeholder-navy-400'}`}
            />
          </div>
          <div>
            <label className={`mb-2 block text-sm font-medium ${textSecondary}`}>With Icon</label>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${textMuted}`} />
              <input
                type="text"
                placeholder="Search..."
                className={`w-full rounded-xl border-2 py-3 pl-12 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white placeholder-navy-400' : 'border-navy-200 bg-white text-navy-900 placeholder-navy-400'}`}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-red-500">Error State</label>
            <input
              type="text"
              placeholder="Error state"
              className={`w-full rounded-xl border-2 border-red-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${isDark ? 'bg-navy-800 text-white' : 'bg-white text-navy-900'}`}
            />
            <p className="mt-1 text-xs text-red-500">This field is required</p>
          </div>
          <div>
            <label className={`mb-2 block text-sm font-medium ${textSecondary}`}>Select</label>
            <div className="relative">
              <select className={`w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white' : 'border-navy-200 bg-white text-navy-900'}`}>
                <option>Select an option...</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
              <ChevronDown className={`absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============================================
// BADGES SECTION
// ============================================
function BadgesSection({ textSecondary, isDark }: { textSecondary: string; isDark: boolean }) {
  return (
    <>
      <SectionHeader title="Badges" />
      <Card className="p-6 space-y-6">
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Status Badges</p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Color Badges</p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="eua">EUA</Badge>
            <Badge variant="cea">CEA</Badge>
            <Badge variant="blue">Blue</Badge>
            <Badge variant="navy">Navy</Badge>
            <Badge variant="amber">Amber</Badge>
            <Badge variant="emerald">Emerald</Badge>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>With Icons</p>
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <Check className="h-3 w-3" /> Approved
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
              <AlertTriangle className="h-3 w-3" /> Pending
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="h-3 w-3" /> Failed
            </span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Certificate Badges</p>
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? 'border-blue-500/50 bg-blue-500/20 text-blue-400' : 'border-blue-200 bg-blue-100 text-blue-700'}`}>
              <Leaf className="h-4 w-4" /> EUA
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? 'border-amber-500/50 bg-amber-500/20 text-amber-400' : 'border-amber-200 bg-amber-100 text-amber-700'}`}>
              <Wind className="h-4 w-4" /> CEA
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============================================
// TABS SECTION
// ============================================
function TabsSection({
  textSecondary,
  activeTab,
  setActiveTab,
  activeCertToggle,
  setActiveCertToggle,
  activeTradeToggle,
  setActiveTradeToggle,
}: {
  textSecondary: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCertToggle: string;
  setActiveCertToggle: (toggle: string) => void;
  activeTradeToggle: string;
  setActiveTradeToggle: (toggle: string) => void;
}) {
  return (
    <>
      <SectionHeader title="Tabs & Toggles" />
      <Card className="p-6 space-y-8">
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Default Tabs</p>
          <Tabs
            tabs={[
              { id: 'tab1', label: 'Overview' },
              { id: 'tab2', label: 'Analytics', badge: 5 },
              { id: 'tab3', label: 'Reports' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Pills Variant</p>
          <Tabs
            tabs={[
              { id: 'tab1', label: 'Overview' },
              { id: 'tab2', label: 'Analytics' },
              { id: 'tab3', label: 'Reports' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Certificate Toggle</p>
          <ToggleGroup
            options={[
              { value: 'eua', label: 'EUA', colorScheme: 'eua', icon: <Leaf className="w-4 h-4" /> },
              { value: 'cea', label: 'CEA', colorScheme: 'cea', icon: <Wind className="w-4 h-4" /> },
            ]}
            value={activeCertToggle}
            onChange={setActiveCertToggle}
          />
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Buy/Sell Toggle</p>
          <ToggleGroup
            options={[
              { value: 'buy', label: 'Buy', colorScheme: 'buy', icon: <ArrowUpRight className="w-4 h-4" /> },
              { value: 'sell', label: 'Sell', colorScheme: 'sell', icon: <ArrowDownRight className="w-4 h-4" /> },
            ]}
            value={activeTradeToggle}
            onChange={setActiveTradeToggle}
          />
        </div>
      </Card>
    </>
  );
}

// ============================================
// CARDS SECTION
// ============================================
function CardsSection({ textPrimary, textSecondary, isDark }: { textPrimary: string; textSecondary: string; isDark: boolean }) {
  return (
    <>
      <SectionHeader title="Cards & Stats" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          iconColor="emerald"
          title="Total Balance"
          value="€1,234,567.89"
          trend={{ value: 12.5, direction: 'up' }}
          subtitle="Updated just now"
        />
        <StatCard
          icon={<Leaf className="w-5 h-5" />}
          iconColor="blue"
          title="EUA Holdings"
          value="5,000"
          trend={{ value: 2.3, direction: 'down' }}
          subtitle="Certificates"
        />
        <StatCard
          icon={<Wind className="w-5 h-5" />}
          iconColor="amber"
          title="CEA Holdings"
          value="10,000"
          trend={{ value: 5.7, direction: 'up' }}
          subtitle="Certificates"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <Activity className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1">
              <h4 className={`text-lg font-bold ${textPrimary}`}>Standard Card</h4>
              <p className={`mt-1 text-sm ${textSecondary}`}>Default card with icon and content.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" size="sm">Action</Button>
                <Button variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6 border border-white/20 dark:border-navy-700/50 bg-white/80 dark:bg-navy-800/80 backdrop-blur-lg">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <BarChart3 className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <h4 className={`text-lg font-bold ${textPrimary}`}>Glass Card</h4>
              <p className={`mt-1 text-sm ${textSecondary}`}>With backdrop blur effect.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// ============================================
// TABLES SECTION
// ============================================
function TablesSection({ textPrimary, textSecondary, isDark }: { textPrimary: string; textSecondary: string; isDark: boolean }) {
  return (
    <>
      <SectionHeader title="Tables" />
      <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-navy-700 bg-navy-800' : 'border-navy-200 bg-white'}`}>
        <table className="w-full">
          <thead className={isDark ? 'border-navy-700 bg-navy-900/50' : 'border-navy-200 bg-navy-50'}>
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Certificate</th>
              <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Price</th>
              <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Change</th>
              <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-navy-700' : 'divide-navy-200'}`}>
            <tr className={isDark ? 'hover:bg-navy-700/50' : 'hover:bg-navy-50'}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Leaf className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${textPrimary}`}>EUA</div>
                    <div className={`text-xs ${textSecondary}`}>EU Allowance</div>
                  </div>
                </div>
              </td>
              <td className={`px-6 py-4 text-right font-mono text-sm font-semibold ${textPrimary}`}>€99.50</td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-semibold text-emerald-500 flex items-center justify-end gap-1">
                  <TrendingUp className="h-4 w-4" /> +2.5%
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <Badge variant="success">Active</Badge>
              </td>
            </tr>
            <tr className={isDark ? 'hover:bg-navy-700/50' : 'hover:bg-navy-50'}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Wind className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${textPrimary}`}>CEA</div>
                    <div className={`text-xs ${textSecondary}`}>China Allowance</div>
                  </div>
                </div>
              </td>
              <td className={`px-6 py-4 text-right font-mono text-sm font-semibold ${textPrimary}`}>€47.25</td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-semibold text-red-500 flex items-center justify-end gap-1">
                  <TrendingDown className="h-4 w-4" /> -1.2%
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <Badge variant="warning">Pending</Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============================================
// FEEDBACK SECTION
// ============================================
function FeedbackSection({ textSecondary, isDark, showModal, setShowModal }: { textSecondary: string; isDark: boolean; showModal: boolean; setShowModal: (show: boolean) => void }) {
  return (
    <>
      <SectionHeader title="Alerts & Modals" />
      <Card className="p-6 space-y-4">
        <Alert type="success" title="Success" message="Your order has been placed successfully." isDark={isDark} />
        <Alert type="warning" title="Warning" message="Your session will expire in 5 minutes." isDark={isDark} />
        <Alert type="error" title="Error" message="Failed to process your request. Please try again." isDark={isDark} />
        <Alert type="info" title="Info" message="Market will close in 30 minutes for maintenance." isDark={isDark} />

        <div className="pt-4 border-t border-navy-200 dark:border-navy-700">
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Confirmation Modal</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Open Modal
          </Button>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => setShowModal(false)}
        title="Confirm Action"
        message="Are you sure you want to proceed? This action cannot be undone."
        confirmText="Confirm"
        cancelText="Cancel"
        variant="danger"
        details={[
          { label: 'Order ID', value: 'ORD-12345' },
          { label: 'Amount', value: '€1,234.56' },
        ]}
      />
    </>
  );
}

// Alert Component
function Alert({ type, title, message, isDark }: { type: 'success' | 'warning' | 'error' | 'info'; title: string; message: string; isDark: boolean }) {
  const styles = {
    success: { bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', text: isDark ? 'text-emerald-400' : 'text-emerald-700', Icon: Check },
    warning: { bg: isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200', text: isDark ? 'text-amber-400' : 'text-amber-700', Icon: AlertTriangle },
    error: { bg: isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200', text: isDark ? 'text-red-400' : 'text-red-700', Icon: AlertCircle },
    info: { bg: isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200', text: isDark ? 'text-blue-400' : 'text-blue-700', Icon: Info },
  };

  const { bg, text, Icon } = styles[type];

  return (
    <div className={`flex items-start gap-3 rounded-xl p-4 border ${bg}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${text}`} />
      <div className="flex-1">
        <p className={`font-semibold ${text}`}>{title}</p>
        <p className={`text-sm ${text} opacity-80`}>{message}</p>
      </div>
      <button className={`p-1 rounded-lg transition-colors hover:bg-black/10 ${text}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// LOADING SECTION
// ============================================
function LoadingSection({ textSecondary, textMuted }: { textSecondary: string; textMuted: string }) {
  return (
    <>
      <SectionHeader title="Loading States" />
      <Card className="p-6 space-y-6">
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Progress Bars</p>
          <div className="space-y-4">
            <ProgressBar value={65} showLabel label="Default" />
            <ProgressBar value={100} variant="success" showLabel label="Success" />
            <ProgressBar value={75} variant="warning" showLabel label="Warning" />
            <ProgressBar value={30} variant="danger" showLabel label="Danger" />
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Spinners</p>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              <span className={`text-xs ${textMuted}`}>Border</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className={`text-xs ${textMuted}`}>Icon</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <span className={`text-xs ${textMuted}`}>Loader</span>
            </div>
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${textSecondary} mb-3`}>Skeletons</p>
          <div className="space-y-4">
            <Skeleton variant="text" />
            <div className="flex items-center gap-4">
              <Skeleton variant="avatar" />
              <Skeleton variant="text" width="60%" />
            </div>
            <Skeleton variant="card" />
          </div>
        </div>
      </Card>
    </>
  );
}
