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
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Menu,
} from 'lucide-react';
import { useUIStore } from '../stores/useStore';
import { Card, Button, Badge, Tabs, ToggleGroup, ProgressBar, Skeleton, StatCard, ConfirmationModal, AlertBanner, Modal, LoadingState, FormSection, FormRow, FormActions, Input } from '../components/common';

/**
 * Theme Sample Page - Design System Showcase
 *
 * Section navigation is in the Subheader (ThemeLayout).
 * Each section has an id attribute for hash navigation.
 */

export function ThemePage() {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  // State for interactive components
  const [activeTab, setActiveTab] = useState('tab1');
  const [activeCertToggle, setActiveCertToggle] = useState('eua');
  const [activeTradeToggle, setActiveTradeToggle] = useState('buy');
  const [showModal, setShowModal] = useState(false);
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState<string | null>(null);

  const textPrimary = isDark ? 'text-white' : 'text-navy-900';
  const textSecondary = isDark ? 'text-navy-400' : 'text-navy-600';
  const textMuted = isDark ? 'text-navy-500' : 'text-navy-500';

  return (
    <div className="relative">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Design System Sample</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>
          All standardized components displayed in {theme} mode. Click section tabs above to navigate.
        </p>
      </div>

      <div className="space-y-16">
        {/* PAGE LAYOUT SECTION */}
        <section
          id="layout"
        >
          <SectionHeader title="Standard Page Layout" />
          <p className={`text-sm ${textSecondary} mb-6`}>
            Every page follows this structure. Fixed header and subheader, optional sticky subsubheader, then page content.
          </p>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER ANATOMY */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-xs font-bold">1</span>
              Header
            </h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              Fixed at top, z-50, height h-16 (mobile) / h-20 (desktop). Contains logo, price ticker, navigation, and user menu.
            </p>

            {/* Header - REAL STYLING (contained in rounded wrapper) */}
            <div className="rounded-xl overflow-hidden">
              <header className="bg-navy-900/80 backdrop-blur-lg border-b border-navy-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <span className="text-xl font-bold text-white">NIHAO</span>
                      <span className="text-xl font-bold text-emerald-400">GROUP</span>
                    </div>

                    {/* Price Ticker (Desktop) */}
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

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                      <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer transition-colors">Dashboard</span>
                      <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer transition-colors">Funding</span>
                      <span className="text-sm font-medium text-white cursor-pointer">CEA Cash</span>
                      <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer transition-colors">Swap</span>

                      {/* User Avatar */}
                      <div className="flex items-center gap-2 p-1 rounded-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          AU
                        </div>
                        <ChevronDown className="w-4 h-4 text-white" />
                      </div>
                    </nav>

                    {/* Mobile menu button */}
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

            {/* Header Components */}
            <div className="mt-4 p-4 rounded-lg bg-navy-800/30 border border-navy-700">
              <p className="text-xs text-navy-400 mb-3 uppercase tracking-wider">Header Components</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                  <code>&lt;Logo /&gt;</code>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-sm text-blue-400">
                  <code>&lt;PriceTicker /&gt;</code>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                  <code>navLinks[]</code>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
                  <code>UserDropdown</code>
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SUBHEADER ANATOMY */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">2</span>
              Subheader
            </h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              Fixed below header, z-40. Contains page icon, title, description, and optional right-side content (tabs, buttons, stats).
            </p>

            {/* Subheader - REAL .subheader-bar CLASS (contained in rounded wrapper) */}
            <div className="rounded-xl overflow-hidden">
              <div className="subheader-bar !static">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left side: Icon, Title, Description */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h1 className="section-heading text-white">Cash Market</h1>
                        <p className="text-sm text-navy-400">CEA Buy & Sell</p>
                      </div>
                    </div>

                    {/* Right side: Page-specific content */}
                    <div className="flex items-center gap-6 text-sm">
                      {/* Navigation Tabs */}
                      <nav className="flex items-center gap-1 p-1 rounded-lg bg-navy-900/50">
                        <button className="subheader-nav-btn subheader-nav-btn-active">Order Book</button>
                        <button className="subheader-nav-btn subheader-nav-btn-inactive">My Orders</button>
                      </nav>

                      {/* Action Buttons */}
                      <button className="p-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-navy-400 hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subheader Specs */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
                <p className="text-xs text-navy-400 mb-1">Position</p>
                <code className="text-sm text-blue-400">fixed top-16 md:top-20</code>
              </div>
              <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
                <p className="text-xs text-navy-400 mb-1">Z-Index</p>
                <code className="text-sm text-blue-400">z-40 (--z-elevated)</code>
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

            {/* Subheader Structure */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Side Components */}
              <div className="p-4 rounded-lg bg-navy-800/30 border border-navy-700">
                <p className="text-xs text-navy-400 mb-3 uppercase tracking-wider">Left Side (Required)</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                    </span>
                    <div>
                      <code className="text-sm text-white">icon</code>
                      <p className="text-xs text-navy-500">ReactNode - page icon in colored container</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center text-white text-xs font-bold">T</span>
                    <div>
                      <code className="text-sm text-white">title</code>
                      <p className="text-xs text-navy-500">string - main page title</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center text-navy-400 text-xs">desc</span>
                    <div>
                      <code className="text-sm text-white">description</code>
                      <p className="text-xs text-navy-500">string - subtitle or breadcrumb</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Components */}
              <div className="p-4 rounded-lg bg-navy-800/30 border border-navy-700">
                <p className="text-xs text-navy-400 mb-3 uppercase tracking-wider">Right Side (Optional children)</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                    <code>Tabs / ToggleGroup</code>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                    <code>Stat displays</code>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
                    <code>Action buttons</code>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                    <code>Export / Refresh</code>
                  </span>
                </div>
                <div className="mt-3 p-2 rounded bg-navy-900/50 border border-navy-700">
                  <p className="text-xs text-navy-500 font-mono">
                    &lt;Subheader icon=&#123;...&#125; title="..." description="..."&gt;<br />
                    &nbsp;&nbsp;&#123;/* right side content */&#125;<br />
                    &lt;/Subheader&gt;
                  </p>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Spacer Required</p>
                <p className="text-xs text-blue-400/80 mt-1">
                  The <code className="bg-blue-500/20 px-1 rounded">&lt;Subheader /&gt;</code> component automatically adds
                  <code className="bg-blue-500/20 px-1 rounded">.subheader-bar-spacer</code> to push page content below the fixed bar.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SUBSUBHEADER ANATOMY */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-xs font-bold text-navy-900">3</span>
              SubSubHeader
            </h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              Optional bar below Subheader for page-specific filters, toggles, and actions. NOT fixed - flows with content or can be sticky.
            </p>

            {/* SubSubHeader - REAL .subsubheader-bar CLASS */}
            <div className="rounded-xl overflow-hidden">
              <div className="subsubheader-bar justify-between">
                {/* Left side: Filters/Toggles */}
                <div className="flex items-center gap-2">
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-active">
                    All
                    <span className="subsubheader-nav-badge">24</span>
                  </button>
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">
                    Pending
                    <span className="subsubheader-nav-badge">3</span>
                  </button>
                  <button className="subsubheader-nav-btn subsubheader-nav-btn-inactive">Completed</button>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg text-navy-400 hover:bg-navy-700/50 hover:text-white transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-navy-400 hover:bg-navy-700/50 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-navy-400 hover:bg-navy-700/50 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SubSubHeader Specs */}
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

            {/* SubSubHeader Structure */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Side */}
              <div className="p-4 rounded-lg bg-navy-800/30 border border-navy-700">
                <p className="text-xs text-navy-400 mb-3 uppercase tracking-wider">Left Side (left prop)</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                      <code>Filter tabs</code>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-sm text-blue-400">
                      <code>EUA/CEA toggle</code>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                      <code>Status filters</code>
                    </span>
                  </div>
                  <p className="text-xs text-navy-500 mt-2">
                    Use <code className="bg-navy-700 px-1 rounded">.subsubheader-nav-btn</code> for filter buttons
                  </p>
                  <p className="text-xs text-navy-500">
                    Use <code className="bg-navy-700 px-1 rounded">.subsubheader-nav-badge</code> for count badges
                  </p>
                </div>
              </div>

              {/* Right Side */}
              <div className="p-4 rounded-lg bg-navy-800/30 border border-navy-700">
                <p className="text-xs text-navy-400 mb-3 uppercase tracking-wider">Right Side (children)</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                    <Search className="w-3 h-3" />
                    <code>Search</code>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-600/50 border border-navy-500/30 text-sm text-navy-300">
                    <RefreshCw className="w-3 h-3" />
                    <code>Refresh</code>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
                    <Download className="w-3 h-3" />
                    <code>Export</code>
                  </span>
                </div>
                <div className="mt-3 p-2 rounded bg-navy-900/50 border border-navy-700">
                  <p className="text-xs text-navy-500 font-mono">
                    &lt;SubSubHeader left=&#123;&lt;Filters /&gt;&#125;&gt;<br />
                    &nbsp;&nbsp;&lt;Button&gt;Action&lt;/Button&gt;<br />
                    &lt;/SubSubHeader&gt;
                  </p>
                </div>
              </div>
            </div>

            {/* When to Use Note */}
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-medium">When to Use</p>
                <p className="text-xs text-amber-400/80 mt-1">
                  Use SubSubHeader for <strong>page-specific</strong> filters and actions (e.g., Backoffice tabs, Order filters).
                  Don't put page-specific content in the main Subheader — that's for title and navigation only.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FULL PAGE LAYOUT VISUAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-navy-600 flex items-center justify-center text-xs font-bold">∑</span>
              Full Page Structure
            </h3>
          </div>

          {/* Visual Layout Mockup */}
          <div className="rounded-2xl border-2 border-navy-600 overflow-hidden bg-navy-900/50">
            {/* HEADER (simplified) */}
            <div className="bg-navy-900 border-b-2 border-emerald-500/50 px-4 py-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold">NIHAO</span>
                    <span className="text-emerald-400 font-bold">GROUP</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm text-navy-400">
                    <span>Dashboard</span>
                    <span>Funding</span>
                    <span className="text-white">CEA Cash</span>
                    <span>Swap</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">U</div>
              </div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-l font-medium hidden lg:block">
                HEADER (fixed, z-50)
              </div>
            </div>

            {/* SUBHEADER */}
            <div className="bg-navy-800 border-b-2 border-navy-700 px-4 py-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Page Title</h3>
                    <p className="text-xs text-navy-400">Page description here</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-600 text-white">Tab 1</button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-navy-400 hover:bg-navy-700">Tab 2</button>
                </div>
              </div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-l font-medium hidden lg:block">
                SUBHEADER (fixed)
              </div>
            </div>

            {/* SUBSUBHEADER */}
            <div className="bg-navy-900/80 border-b border-navy-700 px-4 py-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="px-2.5 py-1 text-xs font-medium rounded-md bg-navy-700 text-white flex items-center gap-1">
                    All <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">24</span>
                  </button>
                  <button className="px-2.5 py-1 text-xs font-medium rounded-md text-navy-400">Pending</button>
                  <button className="px-2.5 py-1 text-xs font-medium rounded-md text-navy-400">Completed</button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-700">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-700">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs px-2 py-1 rounded-l font-medium hidden lg:block">
                SUBSUBHEADER (sticky)
              </div>
            </div>

            {/* PAGE CONTENT */}
            <div className="p-4 relative" style={{ backgroundColor: 'var(--page-bg-bg)' }}>
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Total Value', 'Cash (EUR)', 'CEA', 'EUA'].map((label) => (
                    <div key={label} className="content_wrapper p-3">
                      <p className="text-xs text-navy-400">{label}</p>
                      <p className="text-lg font-bold text-white font-mono">€{(Math.random() * 10000).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Main Card */}
                  <div className="lg:col-span-2 content_wrapper_last">
                    <div className="px-4 py-3 border-b border-navy-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Main Content Card</span>
                      </div>
                      <button className="text-xs text-navy-400 hover:text-white">View All</button>
                    </div>
                    <div className="p-4">
                      <div className="h-24 rounded-lg border-2 border-dashed border-navy-700 flex items-center justify-center">
                        <span className="text-xs text-navy-500">Table / List / Chart content here</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Card */}
                  <div className="content_wrapper_last">
                    <div className="px-4 py-3 border-b border-navy-700">
                      <span className="text-sm font-semibold text-white">Quick Actions</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <button className="btn-primary w-full text-sm py-2">Primary Action</button>
                      <button className="btn-outline w-full text-sm py-2">Secondary Action</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 top-4 bg-navy-600 text-white text-xs px-2 py-1 rounded-l font-medium hidden lg:block">
                PAGE CONTENT
              </div>
            </div>
          </div>

          {/* Layout Rules */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Layout Components</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <code className="text-emerald-400">Header</code>
                  <span className="text-navy-400">Fixed, z-50, h-16/h-20</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-blue-400">Subheader</code>
                  <span className="text-navy-400">Fixed below header, .subheader-bar</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-amber-400">SubSubHeader</code>
                  <span className="text-navy-400">Sticky, .subsubheader-bar (optional)</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-navy-300">Page Content</code>
                  <span className="text-navy-400">.page-bg + .page-container</span>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Content Components</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <code className="text-emerald-400">.content_wrapper</code>
                  <span className="text-navy-400">Stat cards, value displays</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-emerald-400">.content_wrapper_last</code>
                  <span className="text-navy-400">Section cards, panels</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-emerald-400">.table-container</code>
                  <span className="text-navy-400">Data tables</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-emerald-400">&lt;Card /&gt;</code>
                  <span className="text-navy-400">Generic content wrapper</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* CONTAINERS SECTION */}
        <section id="containers">
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
                  <p className="text-xs text-navy-400 mt-1">+ .table-header-cell, .table-row-hover, .table-cell</p>
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
                  <p className="text-xs text-navy-400 mt-1">Darker variant with .table-row-dark</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COLORS SECTION */}
        <section
          id="colors"
        >
          <SectionHeader title="Color Palette" />
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
        </section>

        {/* TYPOGRAPHY SECTION */}
        <section
          id="typography"
        >
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
        </section>

        {/* BUTTONS SECTION */}
        <section
          id="buttons"
        >
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
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
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
        </section>

        {/* INPUTS SECTION */}
        <section
          id="inputs"
        >
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
                  <select className={`w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white' : 'border-navy-200 bg-white text-navy-900'}`}>
                    <option>Select an option...</option>
                    <option>Option 1</option>
                    <option>Option 2</option>
                  </select>
                  <ChevronDown className={`absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none ${textMuted}`} />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* FORM LAYOUT SECTION */}
        <section
          id="forms"
        >
          <SectionHeader title="Form Layout" />
          <Card className="p-6 space-y-6">
            <p className={`text-sm font-medium ${textSecondary} mb-3`}>FormSection, FormRow & FormActions Components</p>

            <FormSection title="Personal Information" description="Enter your contact details" bordered>
              <FormRow>
                <Input label="First Name" placeholder="John" />
                <Input label="Last Name" placeholder="Doe" />
              </FormRow>
              <Input label="Email Address" type="email" placeholder="john.doe@example.com" />
            </FormSection>

            <FormSection title="Security Settings">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <FormRow>
                <Input label="New Password" type="password" placeholder="••••••••" />
                <Input label="Confirm Password" type="password" placeholder="••••••••" />
              </FormRow>
            </FormSection>

            <FormActions>
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save Changes</Button>
            </FormActions>
          </Card>
        </section>

        {/* BADGES SECTION */}
        <section
          id="badges"
        >
          <SectionHeader title="Badges" />
          <Card className="p-6 space-y-6">
            <div>
              <p className={`text-sm font-medium ${textSecondary} mb-3`}>Status Badges (Component)</p>
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
        </section>

        {/* TABS & TOGGLES SECTION */}
        <section
          id="tabs"
        >
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
        </section>

        {/* CARDS SECTION */}
        <section
          id="cards"
        >
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
        </section>

        {/* TABLES SECTION */}
        <section
          id="tables"
        >
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
        </section>

        {/* FEEDBACK SECTION */}
        <section
          id="feedback"
        >
          <SectionHeader title="Alerts & Modals" />

          {/* AlertBanner Component - Standardized */}
          <Card className="p-6 space-y-4 mb-6">
            <p className={`text-sm font-medium ${textSecondary} mb-3`}>AlertBanner Component (Standardized)</p>
            <AlertBanner variant="success" title="Success" message="Your order has been placed successfully." />
            <AlertBanner variant="warning" title="Warning" message="Your session will expire in 5 minutes." />
            <AlertBanner variant="error" title="Error" message="Failed to process your request. Please try again." />
            <AlertBanner variant="info" title="Info" message="Market will close in 30 minutes for maintenance." />

            {dismissedAlert !== 'dismissible' && (
              <AlertBanner
                variant="success"
                message="This alert can be dismissed. Click the X to hide it."
                onDismiss={() => setDismissedAlert('dismissible')}
              />
            )}
          </Card>

          {/* Modal Components */}
          <Card className="p-6 space-y-4">
            <p className={`text-sm font-medium ${textSecondary} mb-3`}>Modal Components</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setShowBaseModal(true)}>
                Base Modal
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(true)}>
                Confirmation Modal
              </Button>
            </div>
          </Card>

          {/* Base Modal Example */}
          <Modal isOpen={showBaseModal} onClose={() => setShowBaseModal(false)} size="md">
            <Modal.Header onClose={() => setShowBaseModal(false)}>
              <h2 className="text-lg font-semibold text-white">Base Modal Example</h2>
            </Modal.Header>
            <Modal.Body>
              <p className="text-navy-300 mb-4">
                This is the standardized Modal component with Header, Body, and Footer sections.
              </p>
              <FormSection title="Example Form" description="Demonstrating FormSection inside a modal">
                <FormRow>
                  <Input label="First Name" placeholder="Enter first name" />
                  <Input label="Last Name" placeholder="Enter last name" />
                </FormRow>
                <Input label="Email" type="email" placeholder="Enter email address" />
              </FormSection>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBaseModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setShowBaseModal(false)}>Save Changes</Button>
            </Modal.Footer>
          </Modal>

          {/* Confirmation Modal */}
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
        </section>

        {/* LOADING SECTION */}
        <section
          id="loading"
        >
          <SectionHeader title="Loading States" />

          {/* LoadingState Component - Standardized */}
          <Card className="p-6 space-y-6 mb-6">
            <p className={`text-sm font-medium ${textSecondary} mb-3`}>LoadingState Component (Standardized)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className={`text-xs ${textMuted} mb-3`}>Spinner (default)</p>
                <LoadingState variant="spinner" size="lg" />
              </div>
              <div className="text-center">
                <p className={`text-xs ${textMuted} mb-3`}>Spinner with text</p>
                <LoadingState variant="spinner" text="Loading data..." />
              </div>
              <div className="text-center">
                <p className={`text-xs ${textMuted} mb-3`}>Inline spinner</p>
                <div className="flex items-center justify-center gap-2">
                  <LoadingState variant="inline" size="sm" />
                  <span className={textSecondary}>Processing...</span>
                </div>
              </div>
            </div>
            <div>
              <p className={`text-xs ${textMuted} mb-3`}>Skeleton rows (for tables)</p>
              <LoadingState variant="skeleton" skeletonRows={3} />
            </div>
          </Card>

          {/* Progress Bars */}
          <Card className="p-6 space-y-6 mb-6">
            <div>
              <p className={`text-sm font-medium ${textSecondary} mb-3`}>Progress Bars</p>
              <div className="space-y-4">
                <ProgressBar value={65} showLabel label="Default" />
                <ProgressBar value={100} variant="success" showLabel label="Success" />
                <ProgressBar value={75} variant="warning" showLabel label="Warning" />
                <ProgressBar value={30} variant="danger" showLabel label="Danger" />
              </div>
            </div>
          </Card>

          {/* Skeletons */}
          <Card className="p-6 space-y-6">
            <div>
              <p className={`text-sm font-medium ${textSecondary} mb-3`}>Skeleton Variants</p>
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
        </section>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  return (
    <div className="mb-6">
      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
      <div className="h-1 w-16 rounded-full bg-emerald-500 mt-2" />
    </div>
  );
}
