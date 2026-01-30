import { useState } from 'react';
import {
  Sun,
  Moon,
  Leaf,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  RefreshCw,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Typography,
  Skeleton,
  Divider,
  ProgressBar,
  DataTable,
  Tabs,
  ToggleGroup,
  StatCard,
  CertificateBadge,
  PriceDisplay,
  DepthBar,
  PageHeader,
  type Column,
} from '../components/common';
import { cn } from '../utils';

interface SampleData {
  id: string;
  asset: string;
  quantity: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled';
  [key: string]: unknown;
}

const sampleTableData: SampleData[] = [
  { id: '1', asset: 'CEA', quantity: 1000, price: 10.25, status: 'filled' },
  { id: '2', asset: 'EUA', quantity: 500, price: 82.50, status: 'open' },
  { id: '3', asset: 'CEA', quantity: 2500, price: 10.18, status: 'cancelled' },
];

const tableColumns: Column<SampleData>[] = [
  { key: 'id', header: 'ID', width: '80px' },
  {
    key: 'asset',
    header: 'Asset',
    render: (value) => <CertificateBadge type={value as 'EUA' | 'CEA'} />,
  },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'right',
    render: (value) => <span className="font-mono">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (value) => <span className="font-mono">${typeof value === 'number' ? value.toFixed(2) : String(value)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    render: (value) => (
      <span className={cn(
        'text-xs',
        value === 'filled' && 'status-complete',
        value === 'open' && 'status-pending',
        value === 'cancelled' && 'status-cancelled'
      )}>
        {String(value)}
      </span>
    ),
  },
];

const sections = [
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Form Inputs' },
  { id: 'cards', label: 'Cards' },
  { id: 'badges', label: 'Badges' },
  { id: 'tables', label: 'Data Tables' },
  { id: 'tabs', label: 'Tabs & Toggles' },
  { id: 'stats', label: 'Stat Cards' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'trading', label: 'Trading' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'layout', label: 'Layout' },
];

export function ComponentShowcasePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState('typography');
  const [activeTab, setActiveTab] = useState('tab1');
  const [certType, setCertType] = useState('EUA');
  const [tradeSide, setTradeSide] = useState('buy');

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="page-container-dark min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-navy-800 border-b border-navy-700">
          <div className="page-container flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-white">Design System</h1>
              <p className="text-sm text-navy-400">Component Library & Style Guide</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            >
              {darkMode ? 'Light' : 'Dark'}
            </Button>
          </div>
        </header>

        <div className="page-container py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Navigation Sidebar */}
            <nav className="col-span-3 sticky top-24 h-fit">
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={cn(
                      'block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors',
                      activeSection === section.id
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-navy-400 hover:text-white hover:bg-navy-700'
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content Area */}
            <main className="col-span-9 space-y-16">
              {/* Typography Section */}
              <section id="typography">
                <h2 className="section-heading text-white mb-2">Typography</h2>
                <p className="text-muted mb-6">Text styles and typography components</p>
                <div className="space-y-6">
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <div className="space-y-4">
                      <Typography variant="pageTitle">Page Title (h1)</Typography>
                      <Typography variant="pageTitleSm">Page Title Small (h1)</Typography>
                      <Typography variant="sectionHeading">Section Heading (h2)</Typography>
                      <Typography variant="sectionLabel">Section Label</Typography>
                      <Typography variant="body">Body text for paragraphs and content.</Typography>
                      <Typography variant="bodySmall">Body small for secondary content.</Typography>
                      <Typography variant="caption">Caption text for hints and metadata.</Typography>
                      <Typography variant="mono">Monospace: 1,234.56</Typography>
                      <Typography variant="monoLg">Mono Large: $82.50</Typography>
                      <Divider />
                      <div className="flex gap-4 flex-wrap">
                        <Typography color="positive">Positive +2.5%</Typography>
                        <Typography color="negative">Negative -1.8%</Typography>
                        <Typography color="eua">EUA Blue</Typography>
                        <Typography color="cea">CEA Amber</Typography>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Buttons Section */}
              <section id="buttons">
                <h2 className="section-heading text-white mb-2">Buttons</h2>
                <p className="text-muted mb-6">Button variants, sizes, and states</p>
                <div className="space-y-6">
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Variants</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                    </div>
                  </Card>
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Sizes</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small</Button>
                      <Button size="md">Medium</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </Card>
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">With Icons</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button icon={<ShoppingCart className="w-4 h-4" />}>Buy CEA</Button>
                      <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
                      <Button variant="ghost" icon={<ArrowRightLeft className="w-4 h-4" />}>Swap</Button>
                    </div>
                  </Card>
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">States</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button disabled>Disabled</Button>
                      <Button loading>Loading</Button>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Form Inputs Section */}
              <section id="inputs">
                <h2 className="section-heading text-white mb-2">Form Inputs</h2>
                <p className="text-muted mb-6">Input fields and form controls</p>
                <Card variant="hover" className="bg-navy-800 border-navy-700">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Input label="Email Address" placeholder="name@company.com" />
                    </div>
                    <div>
                      <Input label="Password" type="password" placeholder="Enter password" />
                    </div>
                    <div>
                      <Input label="With Error" error="This field is required" placeholder="Required field" />
                    </div>
                    <div>
                      <Input label="Disabled" disabled placeholder="Disabled input" />
                    </div>
                    <div>
                      <Input label="With Icon" icon={<CreditCard className="w-5 h-5" />} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="form-label">Native Select</label>
                      <select className="form-input-lg">
                        <option>Select an option</option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Cards Section */}
              <section id="cards">
                <h2 className="section-heading text-white mb-2">Cards</h2>
                <p className="text-muted mb-6">Card containers and variants</p>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Default Card</h3>
                    <p className="text-muted text-sm">Standard card with default styling.</p>
                  </Card>
                  <Card variant="hover">
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Hover Card</h3>
                    <p className="text-muted text-sm">Card with hover effect.</p>
                  </Card>
                  <Card variant="glass">
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Glass Card</h3>
                    <p className="text-muted text-sm">Glassmorphism style.</p>
                  </Card>
                </div>
              </section>

              {/* Badges Section */}
              <section id="badges">
                <h2 className="section-heading text-white mb-2">Badges</h2>
                <p className="text-muted mb-6">Status badges and labels</p>
                <Card variant="hover" className="bg-navy-800 border-navy-700">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-semibold mb-3">Status Badges</h3>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="danger">Danger</Badge>
                        <Badge variant="info">Info</Badge>
                        <Badge>Default</Badge>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <h3 className="text-white font-semibold mb-3">Certificate Badges</h3>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="eua">EUA</Badge>
                        <Badge variant="cea">CEA</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Data Tables Section */}
              <section id="tables">
                <h2 className="section-heading text-white mb-2">Data Tables</h2>
                <p className="text-muted mb-6">Table components for data display</p>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Default Table</h3>
                    <DataTable columns={tableColumns} data={sampleTableData} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Dark Table</h3>
                    <DataTable columns={tableColumns} data={sampleTableData} variant="dark" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Loading State</h3>
                    <DataTable columns={tableColumns} data={[]} loading loadingRows={3} />
                  </div>
                </div>
              </section>

              {/* Tabs Section */}
              <section id="tabs">
                <h2 className="section-heading text-white mb-2">Tabs & Toggles</h2>
                <p className="text-muted mb-6">Tab navigation and toggle controls</p>
                <div className="space-y-6">
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Tab Variants</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted mb-2">Default</p>
                        <Tabs
                          tabs={[
                            { id: 'tab1', label: 'Overview' },
                            { id: 'tab2', label: 'Orders' },
                            { id: 'tab3', label: 'History' },
                          ]}
                          activeTab={activeTab}
                          onChange={setActiveTab}
                        />
                      </div>
                      <Divider />
                      <div>
                        <p className="text-sm text-muted mb-2">Pills</p>
                        <Tabs
                          tabs={[
                            { id: 'tab1', label: 'Open' },
                            { id: 'tab2', label: 'History', badge: 12 },
                          ]}
                          activeTab={activeTab}
                          onChange={setActiveTab}
                          variant="pills"
                        />
                      </div>
                      <Divider />
                      <div>
                        <p className="text-sm text-muted mb-2">Toggle</p>
                        <Tabs
                          tabs={[
                            { id: 'tab1', label: 'Open Orders' },
                            { id: 'tab2', label: 'Order History' },
                          ]}
                          activeTab={activeTab}
                          onChange={setActiveTab}
                          variant="toggle"
                        />
                      </div>
                    </div>
                  </Card>
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Toggle Groups</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted mb-2">Certificate Type</p>
                        <ToggleGroup
                          options={[
                            { value: 'EUA', label: 'EUA', colorScheme: 'eua' },
                            { value: 'CEA', label: 'CEA', colorScheme: 'cea' },
                          ]}
                          value={certType}
                          onChange={setCertType}
                        />
                      </div>
                      <Divider />
                      <div>
                        <p className="text-sm text-muted mb-2">Trade Side</p>
                        <ToggleGroup
                          options={[
                            { value: 'buy', label: 'Buy', colorScheme: 'buy' },
                            { value: 'sell', label: 'Sell', colorScheme: 'sell' },
                          ]}
                          value={tradeSide}
                          onChange={setTradeSide}
                          fullWidth
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Stat Cards Section */}
              <section id="stats">
                <h2 className="section-heading text-white mb-2">Stat Cards</h2>
                <p className="text-muted mb-6">Statistics and metric displays</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<CreditCard className="w-6 h-6 text-emerald-500" />}
                    iconColor="emerald"
                    title="Cash Balance"
                    value="$1,250,000"
                    subtitle="Available"
                  />
                  <StatCard
                    icon={<Leaf className="w-6 h-6 text-amber-500" />}
                    iconColor="amber"
                    title="CEA Holdings"
                    value="443,014"
                    subtitle="tonnes"
                    trend={{ value: 2.5, direction: 'up' }}
                  />
                  <StatCard
                    icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
                    iconColor="blue"
                    title="EUA Price"
                    value="$82.50"
                    trend={{ value: -1.2, direction: 'down' }}
                  />
                  <StatCard
                    icon={<Clock className="w-6 h-6 text-purple-500" />}
                    iconColor="purple"
                    title="Pending"
                    value="3"
                    subtitle="orders"
                  />
                </div>
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Minimal Variant</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard title="Cash" value="$0" variant="minimal" />
                    <StatCard title="CEA" value="443,014" variant="minimal" />
                    <StatCard title="EUA" value="0" subtitle="+39,357 pending" variant="minimal" />
                    <StatCard title="Orders" value="1" subtitle="in progress" variant="minimal" />
                  </div>
                </div>
              </section>

              {/* Certificates Section */}
              <section id="certificates">
                <h2 className="section-heading text-white mb-2">Certificate Displays</h2>
                <p className="text-muted mb-6">Certificate type badges and indicators</p>
                <Card variant="hover" className="bg-navy-800 border-navy-700">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-semibold mb-3">Certificate Badges</h3>
                      <div className="flex flex-wrap gap-4">
                        <CertificateBadge type="EUA" size="sm" />
                        <CertificateBadge type="CEA" size="sm" />
                        <CertificateBadge type="EUA" size="md" />
                        <CertificateBadge type="CEA" size="md" />
                        <CertificateBadge type="EUA" size="lg" />
                        <CertificateBadge type="CEA" size="lg" />
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <h3 className="text-white font-semibold mb-3">Price Displays</h3>
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <p className="text-sm text-muted mb-1">With Change</p>
                          <PriceDisplay price={82.50} change={2.35} size="lg" />
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">Negative</p>
                          <PriceDisplay price={10.18} change={-1.45} size="lg" />
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">Neutral</p>
                          <PriceDisplay price={75.00} size="md" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Trading Section */}
              <section id="trading">
                <h2 className="section-heading text-white mb-2">Trading Components</h2>
                <p className="text-muted mb-6">Order book and trading interface elements</p>
                <Card variant="hover" className="bg-navy-800 border-navy-700">
                  <h3 className="text-white font-semibold mb-4">Depth Bars</h3>
                  <div className="space-y-2">
                    <div className="relative h-8 bg-navy-700 rounded flex items-center px-4">
                      <DepthBar percentage={80} side="bid" />
                      <span className="relative z-10 text-sm price-positive">80.24 (80%)</span>
                    </div>
                    <div className="relative h-8 bg-navy-700 rounded flex items-center px-4">
                      <DepthBar percentage={60} side="bid" />
                      <span className="relative z-10 text-sm price-positive">80.22 (60%)</span>
                    </div>
                    <div className="h-4 flex items-center justify-center text-xs text-muted">
                      Spread: 0.02
                    </div>
                    <div className="relative h-8 bg-navy-700 rounded flex items-center px-4">
                      <DepthBar percentage={45} side="ask" />
                      <span className="relative z-10 text-sm price-negative">80.26 (45%)</span>
                    </div>
                    <div className="relative h-8 bg-navy-700 rounded flex items-center px-4">
                      <DepthBar percentage={70} side="ask" />
                      <span className="relative z-10 text-sm price-negative">80.28 (70%)</span>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Feedback Section */}
              <section id="feedback">
                <h2 className="section-heading text-white mb-2">Loading & Feedback</h2>
                <p className="text-muted mb-6">Loading states and progress indicators</p>
                <div className="space-y-6">
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Skeleton Loaders</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted mb-2">Text Lines</p>
                        <Skeleton variant="text" lines={3} />
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm text-muted mb-2">Avatar</p>
                          <Skeleton variant="avatar" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted mb-2">Card</p>
                          <Skeleton variant="card" height={80} />
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card variant="hover" className="bg-navy-800 border-navy-700">
                    <h3 className="text-white font-semibold mb-4">Progress Bars</h3>
                    <div className="space-y-4">
                      <ProgressBar value={40} showLabel label="Transfer Progress" />
                      <ProgressBar value={75} variant="success" size="md" />
                      <ProgressBar value={50} variant="gradient" size="lg" />
                      <ProgressBar value={25} variant="warning" />
                    </div>
                  </Card>
                </div>
              </section>

              {/* Layout Section */}
              <section id="layout">
                <h2 className="section-heading text-white mb-2">Layout Utilities</h2>
                <p className="text-muted mb-6">Layout patterns and spacing</p>
                <Card variant="hover" className="bg-navy-800 border-navy-700">
                  <h3 className="text-white font-semibold mb-4">Dividers</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted mb-2">Horizontal</p>
                      <Divider orientation="horizontal" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-2">Vertical (inline)</p>
                      <div className="flex items-center gap-4">
                        <span>Item 1</span>
                        <Divider orientation="vertical" size="sm" />
                        <span>Item 2</span>
                        <Divider orientation="vertical" size="sm" />
                        <span>Item 3</span>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card variant="hover" className="bg-navy-800 border-navy-700 mt-6">
                  <h3 className="text-white font-semibold mb-4">Page Header</h3>
                  <PageHeader
                    title="Dashboard"
                    subtitle="Overview of your trading portfolio"
                    actions={<Button size="sm">Action</Button>}
                    breadcrumbs={[
                      { label: 'Home', href: '/' },
                      { label: 'Dashboard' },
                    ]}
                  />
                </Card>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
