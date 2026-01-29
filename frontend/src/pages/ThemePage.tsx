import { motion } from 'framer-motion';
import {
  Sun,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Leaf,
  Wind,
  Euro,
  User,
  Settings,
  Bell,
  Search,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useUIStore } from '../stores/useStore';
import { Card, PageHeader, Button } from '../components/common';

/**
 * Theme sample page – Admin only.
 * Displays all design system elements in the current theme (light/dark) with standard layout.
 */
export function ThemePage() {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const sectionCls = isDark
    ? 'border-navy-700 bg-navy-800'
    : 'border-navy-200 bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-navy-900';
  const textSecondary = isDark ? 'text-navy-400' : 'text-navy-600';
  const textMuted = isDark ? 'text-navy-500' : 'text-navy-500';

  return (
    <div className={isDark ? 'min-h-screen bg-navy-950' : 'min-h-screen bg-navy-50'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Theme Sample"
          subtitle={`Current theme: ${theme} · All design elements in one view`}
          className="mb-10"
        />

        <div className="space-y-12">
        {/* Colors */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Color Palette
          </h2>
          <div className={`h-1 w-20 rounded-full bg-emerald-500 mb-6`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Background', class: isDark ? 'bg-navy-950' : 'bg-navy-50' },
              { name: 'Surface', class: isDark ? 'bg-navy-800' : 'bg-white' },
              { name: 'Primary', class: 'bg-emerald-500' },
              { name: 'EUA', class: 'bg-blue-500' },
              { name: 'CEA', class: 'bg-amber-500' },
              { name: 'Bid', class: 'bg-emerald-500' },
              { name: 'Ask', class: 'bg-red-500' },
              { name: 'Success', class: 'bg-emerald-500' },
              { name: 'Warning', class: 'bg-amber-500' },
              { name: 'Error', class: 'bg-red-500' },
            ].map((c) => (
              <div
                key={c.name}
                className={`rounded-xl border p-4 ${sectionCls} border-navy-700`}
              >
                <div className={`h-12 rounded-lg ${c.class} mb-2`} />
                <p className={`text-sm font-medium ${textPrimary}`}>{c.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Typography
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6 space-y-4">
            <p className={`text-xs ${textMuted}`}>text-xs – Labels, badges</p>
            <p className={`text-sm ${textSecondary}`}>text-sm – Secondary text</p>
            <p className={`text-base ${textPrimary}`}>text-base – Body text</p>
            <p className={`text-lg font-semibold ${textPrimary}`}>
              text-lg – Emphasized
            </p>
            <p className={`text-xl font-bold ${textPrimary}`}>
              text-xl – Section heading
            </p>
            <p className={`text-2xl font-bold ${textPrimary}`}>
              text-2xl – Page subtitle
            </p>
            <p className={`text-3xl font-bold ${textPrimary}`}>
              text-3xl – Page title
            </p>
            <p className="font-mono text-lg font-semibold text-emerald-500">
              font-mono – €99.50 | 1,234.56
            </p>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Buttons
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6 space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" size="sm">
                Primary Small
              </Button>
              <Button variant="primary" size="md">
                Primary Medium
              </Button>
              <Button variant="primary" size="lg">
                Primary Large
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="md">
                Secondary
              </Button>
              <Button variant="outline" size="md">
                Outline
              </Button>
              <Button variant="ghost" size="md">
                Ghost
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" size="md" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                With Icon
              </Button>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Inputs
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6 space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${textSecondary}`}>
                Default
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className={`w-full rounded-xl border-2 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white placeholder-navy-400' : 'border-navy-200 bg-white text-navy-900 placeholder-navy-400'}`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${textSecondary}`}>
                With icon
              </label>
              <div className="relative">
                <Search
                  className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${textMuted}`}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`w-full rounded-xl border-2 py-3 pl-12 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'border-navy-600 bg-navy-800 text-white placeholder-navy-400' : 'border-navy-200 bg-white text-navy-900 placeholder-navy-400'}`}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-red-500">
                Error
              </label>
              <input
                type="text"
                placeholder="Error state"
                className={`w-full rounded-xl border-2 border-red-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${isDark ? 'bg-navy-800 text-white' : 'bg-white text-navy-900'}`}
              />
              <p className="mt-1 text-xs text-red-500">This field is required</p>
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${textMuted}`}>
                Disabled
              </label>
              <input
                type="text"
                placeholder="Disabled"
                disabled
                className={`w-full cursor-not-allowed rounded-xl border-2 px-4 py-3 ${isDark ? 'border-navy-700 bg-navy-800/50 text-navy-500' : 'border-navy-200 bg-navy-100 text-navy-400'}`}
              />
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Badges
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6 space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <Check className="h-3 w-3" />
                Success
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <AlertTriangle className="h-3 w-3" />
                Warning
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <AlertCircle className="h-3 w-3" />
                Error
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                <Info className="h-3 w-3" />
                Info
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? 'border-blue-500/50 bg-blue-500/20 text-blue-400' : 'border-blue-200 bg-blue-100 text-blue-700'}`}>
                <Leaf className="h-4 w-4" />
                EUA
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? 'border-amber-500/50 bg-amber-500/20 text-amber-400' : 'border-amber-200 bg-amber-100 text-amber-700'}`}>
                <Wind className="h-4 w-4" />
                CEA
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <TrendingUp className="h-4 w-4" />
                BID €99.50
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <TrendingDown className="h-4 w-4" />
                ASK €101.25
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className={`h-6 w-6 ${textSecondary}`} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  3
                </span>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Cards
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Activity className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-bold ${textPrimary}`}>Card Title</h4>
                  <p className={`mt-1 text-sm ${textSecondary}`}>
                    Default card with icon and actions.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="primary" size="sm">
                      Action
                    </Button>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
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
                  <h4 className={`text-lg font-bold ${textPrimary}`}>
                    Glass Card
                  </h4>
                  <p className={`mt-1 text-sm ${textSecondary}`}>
                    Frosted glass with backdrop blur.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 md:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${textSecondary}`}>
                    Total Revenue
                  </p>
                  <p className={`mt-2 font-mono text-3xl font-bold ${textPrimary}`}>
                    €12,543
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                    +12.5%
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Euro className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Table */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Data Table
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-navy-700 bg-navy-800' : 'border-navy-200 bg-white'}`}>
            <table className="w-full">
              <thead className={isDark ? 'border-navy-700 bg-navy-900/50' : 'border-navy-200 bg-navy-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
                    Certificate
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
                    Price
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
                    Change
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
                    Status
                  </th>
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
                  <td className={`px-6 py-4 text-right font-mono text-sm font-semibold ${textPrimary}`}>
                    €99.50
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-emerald-500">
                      <TrendingUp className="inline h-4 w-4 mr-1" /> +2.5%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Check className="h-3 w-3" /> Active
                    </span>
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
                  <td className={`px-6 py-4 text-right font-mono text-sm font-semibold ${textPrimary}`}>
                    €47.25
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-red-500">
                      <TrendingDown className="inline h-4 w-4 mr-1" /> -1.2%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                      <AlertTriangle className="h-3 w-3" /> Pending
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Trading UI */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Trading UI
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6 space-y-4">
            <div className={`rounded-lg p-3 ${isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  €99.50
                </span>
                <span className={`font-mono text-sm ${textSecondary}`}>1,234</span>
                <span className={`text-xs ${textMuted}`}>5 orders</span>
              </div>
            </div>
            <div className={`border-t border-b py-3 ${isDark ? 'border-navy-700' : 'border-navy-200'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs font-medium ${textSecondary}`}>Spread:</span>
                <span className={`font-mono text-sm font-bold ${textPrimary}`}>€0.10</span>
              </div>
            </div>
            <div className={`rounded-lg p-3 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  €99.55
                </span>
                <span className={`font-mono text-sm ${textSecondary}`}>3,421</span>
                <span className={`text-xs ${textMuted}`}>6 orders</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className={`rounded-xl p-4 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Positive
                  </span>
                </div>
                <p className={`mt-2 font-mono text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  +€2.50
                </p>
                <p className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                  +2.57% today
                </p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <TrendingDown className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    Negative
                  </span>
                </div>
                <p className={`mt-2 font-mono text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  -€1.25
                </p>
                <p className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>
                  -1.28% today
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Icons */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Icons (Lucide)
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <Card className="p-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {[
                { Icon: User, name: 'User' },
                { Icon: Settings, name: 'Settings' },
                { Icon: Bell, name: 'Bell' },
                { Icon: Search, name: 'Search' },
                { Icon: Download, name: 'Download' },
                { Icon: Upload, name: 'Upload' },
                { Icon: RefreshCw, name: 'Refresh' },
                { Icon: TrendingUp, name: 'Up' },
                { Icon: TrendingDown, name: 'Down' },
                { Icon: BarChart3, name: 'Chart' },
                { Icon: Activity, name: 'Activity' },
                { Icon: Check, name: 'Check' },
                { Icon: Leaf, name: 'Leaf' },
                { Icon: Wind, name: 'Wind' },
                { Icon: Euro, name: 'Euro' },
                { Icon: Sun, name: 'Sun' },
              ].map(({ Icon, name }) => (
                <div
                  key={name}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-colors ${isDark ? 'hover:bg-navy-700' : 'hover:bg-navy-50'}`}
                >
                  <Icon className={`h-6 w-6 ${isDark ? 'text-navy-300' : 'text-navy-700'}`} />
                  <span className={`text-xs ${textSecondary}`}>{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Animations */}
        <section>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Animations
          </h2>
          <div className="h-1 w-20 rounded-full bg-emerald-500 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className={`mb-4 text-sm font-semibold ${textPrimary}`}>
                Fade In
              </h3>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className={`rounded-xl p-6 ${isDark ? 'bg-navy-700' : 'bg-navy-100'}`}
              >
                <p className={`text-sm ${textSecondary}`}>
                  Fading in and out
                </p>
              </motion.div>
            </Card>
            <Card className="p-6">
              <h3 className={`mb-4 text-sm font-semibold ${textPrimary}`}>
                Slide Up
              </h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className={`rounded-xl p-6 ${isDark ? 'bg-navy-700' : 'bg-navy-100'}`}
              >
                <p className={`text-sm ${textSecondary}`}>
                  Sliding up from bottom
                </p>
              </motion.div>
            </Card>
            <Card className="p-6">
              <h3 className={`mb-4 text-sm font-semibold ${textPrimary}`}>
                Pulse (CSS)
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-emerald-500" />
                <div className="h-12 w-12 animate-pulse rounded-full bg-blue-500" style={{ animationDelay: '150ms' }} />
                <div className="h-12 w-12 animate-pulse rounded-full bg-amber-500" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className={`mb-4 text-sm font-semibold ${textPrimary}`}>
                Spin (Loading)
              </h3>
              <RefreshCw className={`h-8 w-8 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
            </Card>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
