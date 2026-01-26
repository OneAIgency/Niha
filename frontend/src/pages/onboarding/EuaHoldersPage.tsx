import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Landmark,
  TrendingUp,
  Globe,
  Shield,
  DollarSign,
  Users,
  Factory,
  BarChart3,
  ArrowRightLeft,
  Clock,
  Settings,
  Target,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Scale,
  FileText,
  Layers,
  Zap,
  Lock,
  Truck,
  ShoppingCart,
  Fuel,
  Award,
  LineChart,
  PieChart,
} from 'lucide-react';
import { OnboardingLayout } from '../../components/onboarding';

// =============================================================================
// Part 1: Categories of Non-EU Entities Holding EUA
// =============================================================================

const EuaHolderCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState('multinational');

  const categories = [
    { id: 'multinational', label: 'Multinational Corps', icon: Building2 },
    { id: 'government', label: 'Gov-Linked Entities', icon: Landmark },
    { id: 'services', label: 'Services & Infrastructure', icon: Truck },
  ];

  const categoryDetails: Record<string, React.ReactNode> = {
    multinational: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
            <Factory className="w-5 h-5 text-blue-400" />
            Category 1: Multinational Corporations with European and Chinese Operations
          </h4>
          <p className="text-sm mb-4 text-navy-200">
            Large publicly-listed multinational enterprises with significant manufacturing, trading, or operational presence in both Europe and China, generating compliance obligations or strategic carbon holdings in both jurisdictions.
          </p>
        </div>

        {/* Sub-Category 1A: Multinational Industrial Manufacturing Groups */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Factory className="w-4 h-4" />
            1A. Multinational Industrial Manufacturing Groups
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Automotive & Transportation */}
            <div className="p-3 rounded-lg bg-blue-400/15">
              <h6 className="font-medium text-sm mb-2 text-blue-400">
                Automotive & Transportation
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• Multinational automotive component suppliers (brakes, engines, emissions systems)</li>
                <li>• Truck and bus manufacturers</li>
                <li>• Estimated non-EU entities with EU operations: 50-100</li>
                <li>• Typical EU allowance holdings: 50,000-1,000,000 tonnes annually</li>
                <li>• Estimated aggregate EUA holdings: 50-100 million tonnes annually</li>
              </ul>
            </div>

            {/* Chemical & Materials Manufacturing */}
            <div className="p-3 rounded-lg bg-blue-400/15">
              <h6 className="font-medium text-sm mb-2 text-blue-400">
                Chemical & Materials Manufacturing
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• International pharmaceutical manufacturers with EU facilities</li>
                <li>• Specialty chemicals and industrial materials producers</li>
                <li>• Polymers, adhesives, coatings manufacturers</li>
                <li>• Estimated non-EU entities: 30-60</li>
                <li>• Typical holdings: 100,000-500,000 tonnes annually</li>
                <li>• Aggregate holdings: 30-50 million tonnes</li>
              </ul>
            </div>

            {/* Metal Manufacturing & Aluminum */}
            <div className="p-3 rounded-lg bg-blue-400/15">
              <h6 className="font-medium text-sm mb-2 text-blue-400">
                Metal Manufacturing & Aluminum
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• International aluminum and metal producers</li>
                <li>• Non-EU operations serving Asian and European markets</li>
                <li>• Estimated entities: 20-40</li>
                <li>• Typical holdings: 200,000-2,000,000 tonnes</li>
                <li>• Aggregate holdings: 20-50 million tonnes</li>
              </ul>
            </div>

            {/* Paper, Pulp & Packaging */}
            <div className="p-3 rounded-lg bg-blue-400/15">
              <h6 className="font-medium text-sm mb-2 text-blue-400">
                Paper, Pulp & Packaging
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• International packaging manufacturers</li>
                <li>• Paper and pulp producers with EU mills</li>
                <li>• Estimated entities: 15-30</li>
                <li>• Typical holdings: 50,000-500,000 tonnes</li>
                <li>• Aggregate holdings: 10-20 million tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg bg-navy-800">
            <h6 className="font-medium text-sm mb-2 text-white">
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-emerald-500">60%</div>
                <div className="text-xs text-navy-200">Publicly Listed</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-blue-400">30%</div>
                <div className="text-xs text-navy-200">Private Groups</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-violet-500">10%</div>
                <div className="text-xs text-navy-200">Joint Ventures</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border border-navy-600">
            <h6 className="font-medium text-sm mb-2 text-white">
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1 text-navy-200">
              <li><strong>Source of EUA:</strong> EU operations allocation + direct market purchases</li>
              <li><strong>Annual generation/purchase:</strong> 50,000-2,000,000 tonnes per entity</li>
              <li><strong>Holding periods:</strong> 1-3 years</li>
              <li><strong>Holding motivation:</strong> Compliance, hedging, strategic reserves</li>
              <li><strong>Geographic distribution:</strong> EUA held at European subsidiaries or trading desk</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 1B: Non-EU Financial Institutions */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Landmark className="w-4 h-4" />
            1B. Non-EU Financial Institutions with European Market Access
          </h5>

          <div className="space-y-4">
            {/* International Investment Banks */}
            <div className="p-3 rounded-lg bg-emerald-500/15">
              <h6 className="font-medium text-sm mb-2 text-emerald-500">
                International Investment Banks (Non-EU Headquarters)
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• U.S.-headquartered investment banks (JPMorgan, Goldman Sachs, Morgan Stanley)</li>
                <li>• Asian-headquartered banks (ICBC, China Construction Bank, OCBC)</li>
                <li>• Middle Eastern financial institutions</li>
                <li>• Estimated entities with EUA trading operations: 20-40</li>
                <li>• Typical holdings (principal and client): 1,000,000-100,000,000+ tonnes aggregate</li>
              </ul>
            </div>

            {/* Asset Management Firms */}
            <div className="p-3 rounded-lg bg-emerald-500/15">
              <h6 className="font-medium text-sm mb-2 text-emerald-500">
                Asset Management Firms (Non-EU)
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• ESG-focused fund managers (Singapore, Japan, Australia, US)</li>
                <li>• Commodity hedge funds (Hong Kong, New York)</li>
                <li>• Pension and sovereign wealth funds (Asia, Middle East)</li>
                <li>• Estimated entities: 30-80</li>
                <li>• Typical holdings: 500,000-20,000,000 tonnes aggregate per firm</li>
              </ul>
            </div>

            {/* Brokers and Traders */}
            <div className="p-3 rounded-lg bg-emerald-500/15">
              <h6 className="font-medium text-sm mb-2 text-emerald-500">
                Brokers and Traders
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• International commodity brokers headquartered outside EU</li>
                <li>• Trading firms with European licenses</li>
                <li>• Estimated entities: 20-50</li>
                <li>• Typical holdings: 100,000-10,000,000 tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg bg-navy-800">
            <h6 className="font-medium text-sm mb-2 text-white">
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-emerald-500">40%</div>
                <div className="text-xs text-navy-200">Publicly Listed</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-blue-400">40%</div>
                <div className="text-xs text-navy-200">Private Partnerships</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-violet-500">20%</div>
                <div className="text-xs text-navy-200">State-Owned</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border border-navy-600">
            <h6 className="font-medium text-sm mb-2 text-white">
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1 text-navy-200">
              <li><strong>Source of EUA:</strong> EU exchange purchases, OTC bilateral deals, institutional client positions</li>
              <li><strong>Annual turnover:</strong> 10,000,000-500,000,000 tonnes aggregate</li>
              <li><strong>Holding periods:</strong> 3 months to 3 years (investment horizon dependent)</li>
              <li><strong>Holding motivation:</strong> Return maximization, commodity diversification, hedging services</li>
              <li><strong>Geographic concentration:</strong> Financial centers (London, Frankfurt, New York, Hong Kong)</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 1C: International Trading Companies */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            1C. International Trading Companies
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global Energy Trading Companies */}
            <div className="p-3 rounded-lg bg-violet-500/15">
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2 text-violet-500">
                <Fuel className="w-4 h-4" />
                Global Energy Trading
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• International oil and gas traders</li>
                <li>• Renewable energy traders with EU operations</li>
                <li>• Estimated entities: 15-35</li>
                <li>• Typical EUA holdings: 100,000-5,000,000 tonnes per entity</li>
              </ul>
            </div>

            {/* Commodity Trading Houses */}
            <div className="p-3 rounded-lg bg-violet-500/15">
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2 text-violet-500">
                <BarChart3 className="w-4 h-4" />
                Commodity Trading Houses
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• Agricultural commodities traders diversifying into carbon</li>
                <li>• Metals and minerals traders expanding portfolio</li>
                <li>• Estimated entities: 20-40</li>
                <li>• Typical EUA holdings: 50,000-2,000,000 tonnes per entity</li>
              </ul>
            </div>

            {/* Environmental/ESG Trading Specialists */}
            <div className="p-3 rounded-lg bg-violet-500/15">
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2 text-violet-500">
                <Globe className="w-4 h-4" />
                Environmental/ESG Trading
              </h6>
              <ul className="text-xs space-y-1 text-navy-200">
                <li>• Carbon credit brokers and traders</li>
                <li>• Sustainability-focused trading firms</li>
                <li>• Estimated entities: 30-50</li>
                <li>• Typical EUA holdings: 500,000-20,000,000 tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg bg-navy-800">
            <h6 className="font-medium text-sm mb-2 text-white">
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-emerald-500">60%</div>
                <div className="text-xs text-navy-200">Private Trading Partnerships</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-blue-400">30%</div>
                <div className="text-xs text-navy-200">Limited Liability Companies</div>
              </div>
              <div className="text-center p-2 rounded bg-navy-700">
                <div className="text-lg font-bold text-violet-500">10%</div>
                <div className="text-xs text-navy-200">Publicly Listed</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border border-navy-600">
            <h6 className="font-medium text-sm mb-2 text-white">
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1 text-navy-200">
              <li><strong>Source of EUA:</strong> Market purchases, client holdings, principal positions</li>
              <li><strong>Typical holdings:</strong> 50,000-10,000,000 tonnes per entity</li>
              <li><strong>Holding periods:</strong> 6 months to 2 years</li>
              <li><strong>Holding motivation:</strong> Trading profit, market making, inventory management</li>
            </ul>
          </div>
        </div>
      </div>
    ),

    government: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
            <Landmark className="w-5 h-5 text-blue-400" />
            Category 2: State-Owned and Government-Linked Non-EU Entities
          </h4>
          <p className="text-sm mb-4 text-navy-200">
            Government-controlled or government-influenced organizations from non-EU jurisdictions that hold EUA for strategic, sovereign wealth, or policy purposes.
          </p>
        </div>

        {/* Sub-Category 2A: Sovereign Wealth Funds */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Coins className="w-4 h-4" />
            2A. Sovereign Wealth Funds and State Investment Vehicles
          </h5>

          <div className="p-3 rounded-lg mb-4 bg-blue-400/15">
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• Middle Eastern sovereign wealth funds investing in EU green bonds/carbon assets</li>
              <li>• Asian state development banks with EU investments</li>
              <li>• Chinese state-owned holding companies with European subsidiary portfolios</li>
              <li>• Estimated entities: 10-25</li>
              <li>• Aggregate EUA holdings: 1,000,000-50,000,000+ tonnes</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 2B: State-Owned Energy Companies */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Fuel className="w-4 h-4" />
            2B. State-Owned Energy Companies (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4 bg-emerald-500/15">
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• Russian, Chinese, Middle Eastern oil/gas companies with EU operations/investments</li>
              <li>• State-owned renewable energy companies with European assets</li>
              <li>• Estimated entities: 5-15</li>
              <li>• Aggregate EUA holdings: 500,000-10,000,000+ tonnes</li>
            </ul>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-medium mb-3 text-white">
            Organizational Structure:
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-navy-700">
              <div className="text-3xl font-bold text-emerald-500">90%+</div>
              <div className="text-sm mt-1 text-navy-200">
                100% State-Owned Enterprises
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-navy-700">
              <div className="text-3xl font-bold text-violet-500">10%</div>
              <div className="text-sm mt-1 text-navy-200">
                State-Controlled Investment Vehicles
              </div>
            </div>
          </div>
        </div>

        {/* EUA Holding Characteristics */}
        <div className="p-4 rounded-lg border border-navy-600">
          <h5 className="font-medium mb-3 text-white">
            EUA Holding Characteristics:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                <span><strong>Source of EUA:</strong> Strategic market acquisitions, subsidiary operations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span><strong>Holding periods:</strong> 3-10+ years (long-term strategic)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <Target className="w-4 h-4 text-emerald-500" />
                <span><strong>Holding motivation:</strong> Strategic reserve, policy objectives, subsidiary compliance</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span><strong>Profile:</strong> Low turnover, buy-and-hold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    services: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
            <Truck className="w-5 h-5 text-blue-400" />
            Category 3: Multinational Services and Infrastructure Companies
          </h4>
          <p className="text-sm mb-4 text-navy-200">
            Large international companies in services, utilities, and infrastructure sectors with European operations generating EUA allocations or holdings.
          </p>
        </div>

        {/* Sub-Category 3A: Utilities and Infrastructure */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Zap className="w-4 h-4" />
            3A. Utilities and Infrastructure (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4 bg-emerald-500/15">
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• International utility companies with European generation assets</li>
              <li>• Infrastructure developers and operators with EU projects</li>
              <li>• Water and waste management companies</li>
              <li>• Estimated entities: 20-40</li>
              <li>• Typical EUA holdings: 100,000-1,000,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 3B: Transportation and Logistics */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <Truck className="w-4 h-4" />
            3B. Transportation and Logistics (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4 bg-blue-400/15">
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• International shipping companies with EU operations</li>
              <li>• Airlines with European operations (some non-EU headquartered)</li>
              <li>• Logistics and logistics tech companies</li>
              <li className="font-medium text-violet-500">
                Note: Transportation sector covered in EU ETS from 2024 (maritime)
              </li>
              <li>• Estimated entities: 10-25</li>
              <li>• Typical EUA holdings: 50,000-500,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 3C: Consumer and Retail Companies */}
        <div className="border rounded-lg p-4 border-navy-600">
          <h5 className="font-medium mb-4 flex items-center gap-2 text-emerald-500">
            <ShoppingCart className="w-4 h-4" />
            3C. Consumer and Retail Companies
          </h5>

          <div className="p-3 rounded-lg mb-4 bg-violet-500/15">
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• International food and beverage companies with EU manufacturing</li>
              <li>• Consumer goods manufacturers with European operations</li>
              <li>• E-commerce and logistics companies</li>
              <li>• Estimated entities: 15-30</li>
              <li>• Typical EUA holdings: 10,000-100,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="p-4 rounded-lg bg-navy-800">
          <h5 className="font-medium mb-3 text-white">
            Organizational Structure:
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-navy-700">
              <div className="text-3xl font-bold text-emerald-500">70%</div>
              <div className="text-sm mt-1 text-navy-200">
                Publicly Listed Companies
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-navy-700">
              <div className="text-3xl font-bold text-blue-400">30%</div>
              <div className="text-sm mt-1 text-navy-200">
                Private Multinational Enterprises
              </div>
            </div>
          </div>
        </div>

        {/* EUA Holding Characteristics */}
        <div className="p-4 rounded-lg border border-navy-600">
          <h5 className="font-medium mb-3 text-white">
            EUA Holding Characteristics:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                <span><strong>Source of EUA:</strong> EU operations allocation + market purchases</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span><strong>Holding periods:</strong> 1-3 years</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <Target className="w-4 h-4 text-emerald-500" />
                <span><strong>Holding motivation:</strong> Compliance, operational hedging</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-200">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span><strong>Profile:</strong> Moderate holdings, compliance-focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-navy-800 text-navy-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {categoryDetails[selectedCategory]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Aggregate Market Sizing Table
// =============================================================================

const MarketSizingTable = () => {
  const data = [
    {
      category: 'Multinational Industrial',
      entities: '150-250',
      avgHoldings: '200K-500K',
      totalHoldings: '30-125M tonnes',
      annualTurnover: '30-125M tonnes',
    },
    {
      category: 'Non-EU Financial Institutions',
      entities: '80-150',
      avgHoldings: '2M-20M',
      totalHoldings: '160-3,000M tonnes',
      annualTurnover: '160-3,000M tonnes',
    },
    {
      category: 'Trading Companies',
      entities: '65-125',
      avgHoldings: '500K-5M',
      totalHoldings: '32.5-625M tonnes',
      annualTurnover: '32.5-625M tonnes',
    },
    {
      category: 'Gov-Linked Entities',
      entities: '15-40',
      avgHoldings: '1M-10M',
      totalHoldings: '15-400M tonnes',
      annualTurnover: '1-50M tonnes',
    },
    {
      category: 'Infrastructure/Services',
      entities: '45-95',
      avgHoldings: '50K-500K',
      totalHoldings: '2.25-47.5M tonnes',
      annualTurnover: '2.25-47.5M tonnes',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-navy-600">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-700">
              <th className="px-4 py-3 text-left font-semibold text-white">Category</th>
              <th className="px-4 py-3 text-center font-semibold text-white"># of Entities</th>
              <th className="px-4 py-3 text-center font-semibold text-white">Avg EUA Holdings</th>
              <th className="px-4 py-3 text-center font-semibold text-white">Total EUA Holdings</th>
              <th className="px-4 py-3 text-center font-semibold text-white">Annual Turnover</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.category}
                className={`${idx % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700'} border-t border-navy-600`}
              >
                <td className="px-4 py-3 font-medium text-white">{row.category}</td>
                <td className="px-4 py-3 text-center text-navy-200">{row.entities}</td>
                <td className="px-4 py-3 text-center text-navy-200">{row.avgHoldings}</td>
                <td className="px-4 py-3 text-center text-emerald-500">{row.totalHoldings}</td>
                <td className="px-4 py-3 text-center text-blue-400">{row.annualTurnover}</td>
              </tr>
            ))}
            <tr className="bg-emerald-500 border-t-2 border-emerald-900">
              <td className="px-4 py-3 font-bold text-white">TOTAL</td>
              <td className="px-4 py-3 text-center font-bold text-white">355-660</td>
              <td className="px-4 py-3 text-center font-bold text-white">Avg: ~1.5M</td>
              <td className="px-4 py-3 text-center font-bold text-white">239.75-4,197.5M</td>
              <td className="px-4 py-3 text-center font-bold text-white">225.75-3,847.5M</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conservative Estimate Box */}
      <div className="p-4 rounded-lg border-2 border-violet-500 bg-violet-500/6">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-violet-500">
          <PieChart className="w-5 h-5" />
          Conservative Estimate of Non-EU EUA Holdings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-emerald-500">250-500M</div>
            <div className="text-sm text-navy-200">Total non-EU holdings (tonnes)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-blue-400">200-300M</div>
            <div className="text-sm text-navy-200">Annual trading volume (tonnes)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-violet-500">€20-50B</div>
            <div className="text-sm text-navy-200">Estimated replacement value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Part 2: Advantages of EUA-to-CEA Swaps
// =============================================================================

const SwapAdvantages = () => {
  const [selectedAdvantage, setSelectedAdvantage] = useState('price');

  const advantages = [
    { id: 'price', label: 'Price Arbitrage (8-18%)', icon: TrendingUp },
    { id: 'operational', label: 'Operational & Timing (3-8%)', icon: Settings },
    { id: 'currency', label: 'Currency (2-5%)', icon: DollarSign },
    { id: 'strategic', label: 'Strategic (2-5%)', icon: Target },
  ];

  const advantageDetails: Record<string, React.ReactNode> = {
    price: (
      <div className="space-y-6">
        {/* Advantage 1: EUA-CEA Price Spread Capture */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Advantage 1: EUA-CEA Price Spread Capture
          </h4>

          {/* Market Price Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg border border-blue-500 bg-blue-500/6">
              <h5 className="font-medium mb-2 text-blue-400">EUA Prices (2025-2026)</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Current: €80-120/tonne</li>
                <li>• Compliance floor: €75-80/tonne</li>
                <li>• Volatility range: ±15-20%</li>
                <li>• Seasonal patterns: Q4 higher, Q2 lower</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border border-violet-500 bg-violet-500/6">
              <h5 className="font-medium mb-2 text-violet-500">CEA Prices (2025-2026)</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Current: ¥65-90/tonne (~$9-13/tonne; €8.5-12/tonne)</li>
                <li>• Average: ¥75/tonne (~€11/tonne)</li>
                <li>• Volatility: ±10-15%</li>
                <li>• Limited international conversion mechanisms</li>
              </ul>
            </div>
          </div>

          {/* Price Spread Analysis */}
          <div className="p-3 rounded-lg mb-4 bg-navy-800">
            <h5 className="font-medium mb-2 text-white">Price Spread Analysis:</h5>
            <ul className="text-sm space-y-1 text-navy-200">
              <li>• <strong>EUA/CEA exchange rate:</strong> 1 EUA ≈ 8-10 CEA (by carbon tonnage equivalent)</li>
              <li>• <strong>Market inefficiency:</strong> EUA price (~€100/tonne) vs. CEA value (~€11/tonne)</li>
              <li>• <strong>Ratio:</strong> 1 EUA = 9.1× the value of 1 CEA on nominal carbon basis</li>
              <li className="font-medium text-emerald-500">
                BUT: Market treats them as near-equivalent for compliance purposes (same GtCO₂ tonnage)
              </li>
            </ul>
          </div>
        </div>

        {/* Example Arbitrage Calculation */}
        <div className="border-2 rounded-lg p-4 border border-emerald-500">
          <h4 className="font-semibold mb-4 text-white">
            Example Arbitrage Calculation
          </h4>
          <p className="text-sm mb-4 text-navy-200">
            Scenario: Non-EU entity holds 1,000,000 EUA seeking to optimize portfolio value
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A */}
            <div className="p-4 rounded-lg bg-red-500/8 border-l-4 border-red-500">
              <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">
                Option A: Sell EUA on Public Exchange
              </h5>
              <ul className="text-sm space-y-2 text-navy-200">
                <li>1,000,000 EUA × €95/tonne = <strong>€95,000,000</strong></li>
                <li>Transaction cost (0.5%): -€475,000</li>
                <li className="pt-2 border-t border-navy-600">
                  <strong className="text-red-600 dark:text-red-400">Net proceeds: €94,525,000</strong>
                </li>
              </ul>
            </div>

            {/* Option B */}
            <div className="p-4 rounded-lg bg-emerald-500/8 border-l-4 border-emerald-500">
              <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">
                Option B: Swap EUA for CEA Through Nihao
              </h5>
              <ul className="text-sm space-y-2 text-navy-200">
                <li><strong>Step 1:</strong> Hold EUA (no sale, maintains positions)</li>
                <li><strong>Step 2:</strong> Nihao identifies Chinese entity willing to swap</li>
                <li><strong>Step 3:</strong> Bilateral negotiation</li>
                <li className="pl-3">• Sell 1,000,000 EUA as collateral/backing</li>
                <li className="pl-3">• Receive 11,000,000 CEA (1:11 ratio negotiated)</li>
                <li className="pl-3">• CEA value: 11,000,000 × ¥75/tonne = ¥825,000,000 (~€120,000,000)</li>
                <li className="pl-3">• Facilitation fee (0.5-1%): -€600,000 to -€1,200,000</li>
                <li className="pt-2 border-t border-navy-600">
                  <strong className="text-emerald-500 dark:text-emerald-400">Net proceeds value: €119,000,000</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Value Capture */}
          <div className="mt-4 p-4 rounded-lg text-center bg-emerald-500">
            <div className="text-xl font-bold text-white">
              Value Capture: €24,475,000 additional value
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-300">
              25.9% improvement
            </div>
          </div>

          {/* Key to Arbitrage */}
          <div className="mt-4 p-3 rounded-lg bg-navy-700">
            <h5 className="font-medium mb-2 text-white">Key to Arbitrage:</h5>
            <ul className="text-sm space-y-1 text-navy-200">
              <li>• CEA market is less efficient (smaller, less mature)</li>
              <li>• Bilateral negotiation achieves better pricing than exchange spreads</li>
              <li>• Swap structure allows position restructuring</li>
              <li>• Removes intermediary margins from exchange trading</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: Price Timing Optimization */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-violet-500" />
            Advantage 2: Price Timing Optimization
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* SEEE Seasonal Patterns */}
            <div className="p-3 rounded-lg border border border-violet-500">
              <h5 className="font-medium mb-3 text-violet-500">SEEE (CEA) Seasonal Price Patterns:</h5>
              <div className="space-y-3">
                <div className="p-2 rounded bg-emerald-500/8">
                  <div className="font-medium text-sm text-emerald-500 dark:text-emerald-400">Q1-Q2: Higher prices (¥85-95/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Lower compliance pressure</li>
                    <li>• Fewer sellers</li>
                    <li>• Financial investors buying</li>
                  </ul>
                </div>
                <div className="p-2 rounded bg-blue-400/15">
                  <div className="font-medium text-sm text-blue-400">Q3: Moderate prices (¥80-90/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Pre-compliance demand building</li>
                    <li>• Balanced supply/demand</li>
                  </ul>
                </div>
                <div className="p-2 rounded bg-red-500/8">
                  <div className="font-medium text-sm text-red-600 dark:text-red-400">Q4: Lower prices (¥65-78/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Compliance-driven selling</li>
                    <li>• Peak supply pressure</li>
                    <li>• Buyer consolidation period</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* EU ETS Seasonal Patterns */}
            <div className="p-3 rounded-lg border border border-blue-500">
              <h5 className="font-medium mb-3 text-blue-400">EU ETS (EUA) Seasonal Patterns:</h5>
              <div className="space-y-3">
                <div className="p-2 rounded bg-red-500/8">
                  <div className="font-medium text-sm text-red-600 dark:text-red-400">Q1-Q2: Lower prices (€80-90/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Post-compliance surplus</li>
                    <li>• Moderate selling pressure</li>
                  </ul>
                </div>
                <div className="p-2 rounded bg-emerald-500/8">
                  <div className="font-medium text-sm text-emerald-500 dark:text-emerald-400">Q3: Higher prices (€95-110/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Pre-compliance demand</li>
                    <li>• Financial buying</li>
                  </ul>
                </div>
                <div className="p-2 rounded bg-violet-500/15">
                  <div className="font-medium text-sm text-violet-500">Q4: Variable (€85-105/tonne)</div>
                  <ul className="text-xs mt-1 text-navy-200">
                    <li>• Compliance submissions</li>
                    <li>• Year-end positioning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Arbitrage Strategy */}
          <div className="p-4 rounded-lg border border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Timing Arbitrage Through Nihao:</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-emerald-500">1</div>
                <div>
                  <div className="font-medium text-white">Monitor both markets</div>
                  <ul className="text-sm text-navy-200">
                    <li>• When EUA Q3 pricing peaks (€105/tonne)</li>
                    <li>• When CEA Q2 pricing peaks (¥90/tonne)</li>
                    <li>• Spread advantage: Highest in Q3</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-emerald-500">2</div>
                <div>
                  <div className="font-medium text-white">Execute bilateral swap in Q3</div>
                  <ul className="text-sm text-navy-200">
                    <li>• Sell 1,000,000 EUA at €105/tonne (€105,000,000 value)</li>
                    <li>• Receive 12,000,000 CEA at negotiated rate (estimated value €115,000,000)</li>
                    <li>• Timing advantage captured: €10,000,000 (9.5% improvement)</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-emerald-500">3</div>
                <div>
                  <div className="font-medium text-white">Liquidity management</div>
                  <ul className="text-sm text-navy-200">
                    <li>• Use CEA holdings for future EU portfolio management</li>
                    <li>• Option to re-swap back to EUA in Q2 if prices decline</li>
                    <li>• Flexibility to sell CEA on improving market</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded text-center bg-violet-500">
              <span className="font-bold text-white">Estimated Timing Benefit: 3-8% of transaction value</span>
            </div>
          </div>
        </div>
      </div>
    ),

    operational: (
      <div className="space-y-6">
        {/* Advantage 1: Operational Flexibility */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-emerald-500" />
            Advantage 1: Operational Flexibility in Multiple Jurisdictions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SEEE-Only Limitation */}
            <div className="p-4 rounded-lg border-2 border-red-500 bg-red-500/6">
              <h5 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                SEEE-Only Limitation
              </h5>
              <p className="text-sm mb-2 text-navy-200">
                Non-EU holders face restrictions selling on SEEE:
              </p>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Foreign participation restrictions apply to some market segments</li>
                <li>• Reporting requirements to Chinese authorities</li>
                <li>• Currency conversion delays (RMB settlement)</li>
                <li>• Limited liquidity windows for large transactions</li>
              </ul>
            </div>

            {/* Nihao Swap Advantage */}
            <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/6">
              <h5 className="font-semibold mb-3 flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Nihao Swap Advantage
              </h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Bilateral structure bypasses exchange participation restrictions</li>
                <li>• Direct settlement with counterparty (no SEEE regulatory constraints)</li>
                <li>• Multi-currency settlement options</li>
                <li>• Timing flexibility for execution</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-navy-800">
            <h5 className="font-medium mb-2 text-white">Value Capture:</h5>
            <ul className="text-sm text-navy-200">
              <li>• Enables larger transaction sizes without market impact</li>
              <li>• Allows execution at preferred timing window</li>
              <li className="font-medium text-emerald-500">Estimated value: 1-2% operational efficiency gain</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: Portfolio Rebalancing */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Scale className="w-5 h-5 text-blue-400" />
            Advantage 2: Portfolio Rebalancing Without Public Market Impact
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exchange Market Impact Risk */}
            <div className="p-4 rounded-lg border border border-red-500">
              <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Exchange Market Impact Risk:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Sale of 1,000,000+ EUA creates visible market signal</li>
                <li>• Competitors infer supply patterns</li>
                <li>• Price impact from large orders: 2-5% adverse movement</li>
                <li>• Publication in market data delays sale execution</li>
              </ul>
            </div>

            {/* Private Swap Benefit */}
            <div className="p-4 rounded-lg border border border-emerald-500">
              <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Private Swap Benefit:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Large swaps remain confidential</li>
                <li>• No market impact from public visibility</li>
                <li>• Faster execution without cascading price adjustments</li>
                <li>• Market impact avoided: 2-5% value preservation</li>
              </ul>
            </div>
          </div>

          {/* Example Impact Calculation */}
          <div className="mt-4 p-4 rounded-lg border-2 border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Example Impact Calculation:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded bg-red-500/8">
                <div className="text-sm text-navy-200">Public sale impact</div>
                <div className="font-bold text-red-600 dark:text-red-400">-3% price movement</div>
              </div>
              <div className="p-3 rounded bg-red-500/8">
                <div className="text-sm text-navy-200">Loss from market impact</div>
                <div className="font-bold text-red-600 dark:text-red-400">€2,850,000</div>
                <div className="text-xs text-navy-500 dark:text-navy-500">(1M × €95 × 3%)</div>
              </div>
              <div className="p-3 rounded bg-emerald-500/8">
                <div className="text-sm text-navy-200">Private swap loss</div>
                <div className="font-bold text-emerald-500 dark:text-emerald-400">€0</div>
              </div>
            </div>
            <div className="mt-3 text-center p-2 rounded bg-emerald-500">
              <span className="font-bold text-white">Value advantage: €2,850,000 (3%)</span>
            </div>
          </div>
        </div>

        {/* Advantage 3: Regulatory Reporting Optimization */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-violet-500" />
            Advantage 3: Regulatory Reporting Optimization
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exchange Trading Disclosure */}
            <div className="p-4 rounded-lg border border border-red-500">
              <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Exchange Trading Disclosure:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Public disclosure requirements under MiFID II (EU) and relevant regulations</li>
                <li>• Counterparty identification requirements</li>
                <li>• Transaction details reportable to regulators</li>
                <li>• Potential compliance scrutiny for large foreign traders</li>
                <li>• Risk of regulatory targeting or inquiry</li>
              </ul>
            </div>

            {/* Private Bilateral Structure */}
            <div className="p-4 rounded-lg border border border-emerald-500">
              <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Private Bilateral Structure:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Minimal regulatory reporting requirements</li>
                <li>• Bilateral transaction remains confidential</li>
                <li>• No public disclosure of counterparty details</li>
                <li>• Reduces regulatory footprint for large traders</li>
                <li>• Estimated compliance cost reduction: 0.5-1.5%</li>
                <li className="font-medium text-emerald-500 dark:text-emerald-400">Estimated value: €50,000-500,000 per large transaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),

    currency: (
      <div className="space-y-6">
        {/* Advantage 1: Multi-Currency Funding Efficiency */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Advantage 1: Multi-Currency Funding Efficiency
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Exchange-Based Restrictions */}
            <div className="p-4 rounded-lg border border border-red-500">
              <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Exchange-Based Restrictions:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• SEEE requires EUR or direct bank transfer</li>
                <li>• Currency conversion required: 0.2-0.5% conversion spread</li>
                <li>• Delayed settlement due to international wire times</li>
                <li>• Limited ability to optimize currency mix</li>
              </ul>
            </div>

            {/* Private Swap Flexibility */}
            <div className="p-4 rounded-lg border border border-emerald-500">
              <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Private Swap Flexibility:</h5>
              <p className="text-sm mb-2 text-navy-200">
                Bilateral negotiation allows payment in:
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center p-2 rounded bg-navy-800">
                  <span className="font-bold text-blue-400">EUR</span>
                  <div className="text-xs text-navy-500 dark:text-navy-500">EU-based buyers</div>
                </div>
                <div className="text-center p-2 rounded bg-navy-800">
                  <span className="font-bold text-emerald-500 dark:text-emerald-400">USD</span>
                  <div className="text-xs text-navy-500 dark:text-navy-500">International settlement</div>
                </div>
                <div className="text-center p-2 rounded bg-navy-800">
                  <span className="font-bold text-violet-500">RMB</span>
                  <div className="text-xs text-navy-500 dark:text-navy-500">China-connected</div>
                </div>
                <div className="text-center p-2 rounded bg-navy-800">
                  <span className="font-bold text-emerald-500">Multi</span>
                  <div className="text-xs text-navy-500 dark:text-navy-500">Combinations</div>
                </div>
              </div>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Allows natural hedging against currency exposure</li>
                <li>• Reduces currency conversion needs</li>
              </ul>
            </div>
          </div>

          {/* Example Currency Optimization */}
          <div className="p-4 rounded-lg border-2 border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Example Currency Optimization:</h5>
            <p className="text-sm mb-3 text-navy-200">
              International financial firm with USD liability:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EUA Exchange Sale */}
              <div className="p-3 rounded-lg bg-red-500/8">
                <h6 className="font-medium mb-2 text-red-600 dark:text-red-400">EUA Exchange Sale:</h6>
                <ul className="text-sm space-y-1 text-navy-200">
                  <li>Sale: 1,000,000 EUA × €95 = <strong>€95,000,000</strong></li>
                  <li>Convert to USD at 1.10 rate: $104,500,000</li>
                  <li>Conversion cost (0.3% spread): <strong className="text-red-600 dark:text-red-400">-$313,500</strong></li>
                </ul>
              </div>

              {/* Private Swap */}
              <div className="p-3 rounded-lg bg-emerald-500/8">
                <h6 className="font-medium mb-2 text-emerald-500 dark:text-emerald-400">Private Swap:</h6>
                <ul className="text-sm space-y-1 text-navy-200">
                  <li>Swap 1,000,000 EUA for 11,000,000 CEA</li>
                  <li>Settle directly in USD: ~$115,000,000</li>
                  <li>Conversion cost: <strong className="text-emerald-500 dark:text-emerald-400">$0</strong></li>
                </ul>
              </div>
            </div>

            <div className="mt-3 text-center p-2 rounded bg-emerald-500">
              <span className="font-bold text-white">Currency optimization value: $313,500 (0.3%)</span>
            </div>
          </div>
        </div>

        {/* Advantage 2: Payment Timing Flexibility */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-blue-400" />
            Advantage 2: Payment Timing Flexibility
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Exchange Market Settlement */}
            <div className="p-4 rounded-lg border border border-red-500">
              <h5 className="font-semibold mb-3 text-red-600 dark:text-red-400">Exchange Market Settlement:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• T+2 settlement requirement</li>
                <li>• Requires pre-funding of account</li>
                <li>• No flexibility in payment timing</li>
                <li>• Working capital tied up during settlement</li>
              </ul>
            </div>

            {/* Private Swap Settlement */}
            <div className="p-4 rounded-lg border border border-emerald-500">
              <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Private Swap Settlement:</h5>
              <ul className="text-sm space-y-1 text-navy-200">
                <li>• Full payment at order confirmation</li>
                <li>• Funds secured in Nihao client account with HSBC</li>
                <li>• Instant order matching (all parties online)</li>
                <li>• Streamlined registry processing (10-14 days)</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-800">
            <h5 className="font-medium mb-2 text-white">Value Capture:</h5>
            <ul className="text-sm text-navy-200">
              <li>• Zero settlement risk: funds secured at order confirmation</li>
              <li>• Faster processing: 10-14 days vs 30+ days on exchanges</li>
            </ul>
          </div>
        </div>
      </div>
    ),

    strategic: (
      <div className="space-y-6">
        {/* Advantage 1: Diversification */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-emerald-500" />
            Advantage 1: Diversification into Emerging Green Finance Markets
          </h4>

          <div className="p-4 rounded-lg border border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500">Market Development Benefit:</h5>
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• CEA market is emerging and growing (2025+ expansion)</li>
              <li>• Earlier participants gain first-mover advantage</li>
              <li>• Relationship building with Chinese counterparties</li>
              <li>• Portfolio diversification into new market</li>
            </ul>
          </div>

          <div className="mt-4 p-4 rounded-lg border border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Strategic Positioning Value:</h5>
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• Establish credibility in Chinese carbon market</li>
              <li>• Build relationships for future transactions</li>
              <li>• Position for China's carbon market growth (estimated to reach EU ETS size within 10 years)</li>
              <li className="font-medium text-emerald-500 dark:text-emerald-400">Estimated strategic option value: 1-3% of portfolio value annually</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: ESG and Sustainability Positioning */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Award className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Advantage 2: ESG and Sustainability Positioning
          </h4>

          <div className="p-4 rounded-lg border border border-emerald-500">
            <h5 className="font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Private Swap Market Leadership:</h5>
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• Participation in innovative carbon market solutions</li>
              <li>• ESG alignment through voluntary carbon management</li>
              <li>• Positioning as international carbon market participant</li>
              <li>• Storytelling advantage: "Active participant in global carbon markets"</li>
            </ul>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-white">Value Capture:</h5>
            <p className="text-sm mb-2 text-navy-200">Enhanced ESG credentials support:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded bg-navy-700">
                <Users className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                <div className="text-xs text-navy-200">Client acquisition (ESG-focused investors value partners)</div>
              </div>
              <div className="text-center p-3 rounded bg-navy-700">
                <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-500 dark:text-emerald-400" />
                <div className="text-xs text-navy-200">Access to green finance funding at lower costs</div>
              </div>
              <div className="text-center p-3 rounded bg-navy-700">
                <Award className="w-6 h-6 mx-auto mb-1 text-violet-500" />
                <div className="text-xs text-navy-200">Brand positioning as sustainability leader</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-navy-200">
              <strong className="text-emerald-500">Estimated value:</strong> 1-2% client value improvement or 0.1-0.3% lower cost of capital
            </div>
          </div>
        </div>

        {/* Advantage 3: Regulatory Arbitrage */}
        <div className="p-4 rounded-lg bg-navy-700">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-blue-400" />
            Advantage 3: Regulatory Arbitrage and Future-Proofing
          </h4>

          <div className="p-4 rounded-lg border border border-blue-500">
            <h5 className="font-semibold mb-3 text-blue-400">Forward-Looking Benefit:</h5>
            <ul className="text-sm space-y-2 text-navy-200">
              <li>• Private swaps establish non-EU entity presence in carbon markets</li>
              <li>• Positions entity for future EU-China market linkage</li>
              <li>• If markets eventually link, early participants have established relationships</li>
              <li>• Reduces transition risk if regulatory regimes converge</li>
            </ul>
          </div>

          <div className="mt-4 text-center p-3 rounded bg-emerald-500">
            <span className="font-bold text-white">Estimated Strategic Value: Option value for future market changes: 1-2% annually</span>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Advantage Tabs */}
      <div className="flex flex-wrap gap-2">
        {advantages.map((adv) => {
          const Icon = adv.icon;
          return (
            <button
              key={adv.id}
              onClick={() => setSelectedAdvantage(adv.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                selectedAdvantage === adv.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-navy-700 text-navy-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {adv.label}
            </button>
          );
        })}
      </div>

      {/* Advantage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAdvantage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {advantageDetails[selectedAdvantage]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Part 3: Quantified Advantages Summary
// =============================================================================

const QuantifiedAdvantages = () => { const summaryData = [
    {
      category: 'Multinational Corporates',
      priceArbitrage: '8-12%',
      timing: '2-4%',
      operational: '1-2%',
      currency: '1-2%',
      strategic: '1-2%',
      total: '13-22%',
      color: "#10b981",
     },
    { category: 'Non-EU Financial Firms',
      priceArbitrage: '12-18%',
      timing: '3-8%',
      operational: '2-3%',
      currency: '2-3%',
      strategic: '1-2%',
      total: '20-34%',
      color: "#3b82f6",
     },
    { category: 'Trading Companies',
      priceArbitrage: '10-15%',
      timing: '2-5%',
      operational: '2-3%',
      currency: '1-2%',
      strategic: '2-3%',
      total: '17-28%',
      color: "#8b5cf6",
     },
    { category: 'Gov-Linked Entities',
      priceArbitrage: '6-10%',
      timing: '1-3%',
      operational: '1-2%',
      currency: '0.5-1.5%',
      strategic: '2-4%',
      total: '10.5-20.5%',
      color: "#10b981",
     },
    { category: 'Infrastructure/Services',
      priceArbitrage: '8-12%',
      timing: '1-3%',
      operational: '1-2%',
      currency: '1-2%',
      strategic: '1-2%',
      total: '12-21%',
      color: "#ef4444",
     },
  ];

  const valueCreation = [
    {
      category: 'Multinational Corporates',
      size: '50-100M tonnes EUA annually',
      avgAdvantage: '17%',
      annualValue: '€7.75-17B',
      perEntity: '€50-170M',
    },
    {
      category: 'Non-EU Financial Institutions',
      size: '160-3,000M tonnes EUA annually',
      avgAdvantage: '27%',
      annualValue: '€43.2-810B',
      perEntity: '€540-10,125M',
    },
    {
      category: 'Trading Companies',
      size: '32.5-625M tonnes EUA annually',
      avgAdvantage: '22.5%',
      annualValue: '€7.3-140.6B',
      perEntity: '€112-2,165M',
    },
    {
      category: 'Government-Linked Entities',
      size: '15-400M tonnes (1-50M traded)',
      avgAdvantage: '15.5%',
      annualValue: '€0.15-7.5B',
      perEntity: '€10-500M',
    },
    {
      category: 'Infrastructure/Services',
      size: '2.25-47.5M tonnes EUA annually',
      avgAdvantage: '16.5%',
      annualValue: '€0.37-7.6B',
      perEntity: '€8-170M',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Advantage Summary Table */}
      <div>
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Advantage Summary by Entity Category
        </h4>
        <div className="overflow-x-auto rounded-lg border border-navy-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-700">
                <th className="px-3 py-2 text-left font-semibold text-white">Category</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Price Arbitrage</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Timing</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Operational</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Currency</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Strategic</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row, idx) => (
                <tr
                  key={row.category}
                  className={`${idx % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700'} border-t border-navy-600`}
                >
                  <td className={`px-3 py-2 font-medium ${
                    row.color === '#10b981' ? 'text-emerald-500' :
                    row.color === '#3b82f6' ? 'text-blue-500' :
                    row.color === '#8b5cf6' ? 'text-violet-500' :
                    'text-white'
                  }`}>{row.category}</td>
                  <td className="px-3 py-2 text-center text-navy-200">{row.priceArbitrage}</td>
                  <td className="px-3 py-2 text-center text-navy-200">{row.timing}</td>
                  <td className="px-3 py-2 text-center text-navy-200">{row.operational}</td>
                  <td className="px-3 py-2 text-center text-navy-200">{row.currency}</td>
                  <td className="px-3 py-2 text-center text-navy-200">{row.strategic}</td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-500 dark:text-emerald-400">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Value Creation Table */}
      <div>
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <LineChart className="w-5 h-5 text-violet-500" />
          Annual Value Creation Potential
        </h4>
        <div className="overflow-x-auto rounded-lg border border-navy-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-700">
                <th className="px-3 py-2 text-left font-semibold text-white">Category</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Category Size</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Avg Advantage</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Annual Value Creation</th>
                <th className="px-3 py-2 text-center font-semibold text-white">Avg Per Entity</th>
              </tr>
            </thead>
            <tbody>
              {valueCreation.map((row, idx) => (
                <tr
                  key={row.category}
                  className={`${idx % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700'} border-t border-navy-600`}
                >
                  <td className="px-3 py-2 font-medium text-white">{row.category}</td>
                  <td className="px-3 py-2 text-center text-xs text-navy-200">{row.size}</td>
                  <td className="px-3 py-2 text-center text-emerald-500">{row.avgAdvantage}</td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-500 dark:text-emerald-400">{row.annualValue}</td>
                  <td className="px-3 py-2 text-center text-violet-500">{row.perEntity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aggregate Market Opportunity */}
      <div className="p-6 rounded-lg border-2 border-emerald-500 bg-emerald-500/6">
        <h4 className="font-bold text-xl mb-4 text-center text-emerald-500">
          AGGREGATE MARKET OPPORTUNITY
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-navy-800">
            <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">€58.7-982.7B</div>
            <div className="text-sm mt-1 text-navy-200">Total annual value creation</div>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <div className="text-3xl font-bold text-emerald-500">€200-300B</div>
            <div className="text-sm mt-1 text-navy-200">Conservative realistic estimate</div>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <div className="text-3xl font-bold text-violet-500">10-22%</div>
            <div className="text-sm mt-1 text-navy-200">Total value improvement</div>
          </div>
        </div>
        <p className="text-sm text-center mt-4 text-navy-200">
          This represents the total economic advantage available to non-EU EUA holders through CEA swaps vs. standard exchange trading
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Part 4: Implementation Framework
// =============================================================================

const ImplementationFramework = () => {
  const steps = [
    {
      number: 1,
      title: 'EU Entity KYC and Account Setup with Nihao',
      details: [
        'Detailed separately in Document 6',
        'Timeline: 2-4 weeks',
        'Output: Approved account with trading limits',
      ],
      icon: Users,
    },
    {
      number: 2,
      title: 'CEA Sourcing and Marketplace Access',
      details: [
        'Nihao provides marketplace access to available CEA offerings',
        'Non-EU sellers list surplus CEA for swap/sale',
        'EU entity reviews opportunities and pricing',
      ],
      icon: Globe,
    },
    {
      number: 3,
      title: 'Swap Negotiation',
      details: [
        'EU entity identifies preferred CEA holding/seller',
        'Negotiation of:',
        '• EUA/CEA exchange ratio (1 EUA : 8-12 CEA typically)',
        '• Settlement timeline (usually 14-30 days)',
        '• Payment terms (100% upfront, funds secured in client account)',
        '• Pricing (negotiated bilaterally)',
      ],
      icon: ArrowRightLeft,
    },
    {
      number: 4,
      title: 'Bilateral Swap Agreement',
      details: [
        'Nihao facilitates agreement between:',
        '• EU entity (providing EUA, receiving CEA)',
        '• Non-EU entity (providing CEA, receiving compensation)',
        'Detailed contract specifying:',
        '• Exact quantities and delivery schedule',
        '• Pricing and payment terms',
        '• Settlement procedures',
        '• Dispute resolution',
      ],
      icon: FileText,
    },
    {
      number: 5,
      title: 'Settlement and Custody',
      details: [
        'EUA transferred from EU entity to non-EU seller (via Nihao custody)',
        'CEA transferred from non-EU seller to EU entity (via Nihao custody)',
        'Payment settlement per agreed terms',
        'Final confirmation and documentation',
      ],
      icon: Lock,
    },
    {
      number: 6,
      title: 'Compliance Integration',
      details: [
        'CEA certificates integrated into EU entity\'s compliance account',
        'Can be re-swapped to EUA, held, or eventually surrendered for compliance',
        'Documentation maintained for regulatory audit trail',
      ],
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-navy-700">
        <h4 className="font-semibold mb-2 text-white">
          Multi-Step Swap Process
        </h4>
        <p className="text-sm text-navy-200">
          Complete framework for executing EUA-to-CEA swaps through Nihao's platform
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="p-4 rounded-lg border border-navy-600 bg-navy-800"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500"
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-2 text-white">
                    Step {step.number}: {step.title}
                  </h5>
                  <ul className="text-sm space-y-1 text-navy-200">
                    {step.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Part 5: Risk Mitigation
// =============================================================================

const RiskMitigation = () => { const risks = [
    {
      title: 'Counterparty Credit Risk',
      icon: Users,
      color: "#ef4444",
      mitigations: [
        'Nihao pre-qualification of all CEA providers',
        'Full upfront payment eliminates settlement risk',
        'Client account arrangements protect both parties',
        'Performance bonds available for large transactions',
        'Insurance coverage options',
      ],
     },
    { title: 'Regulatory Risk',
      icon: Shield,
      color: "#3b82f6",
      mitigations: [
        'Full documentation compliance with both jurisdictions',
        'Proper tax reporting in both EU and relevant jurisdictions',
        'Compliance with beneficial ownership requirements',
        'Sanctions screening of all counterparties',
      ],
     },
    { title: 'Market Risk',
      icon: TrendingUp,
      color: "#8b5cf6",
      mitigations: [
        'Forward pricing locks in agreed rates',
        'Hedging options available if prices move adversely',
        'Flexibility to unwind through reverse swap if needed',
        'Long settlement periods allow market monitoring',
      ],
     },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-navy-700">
        <h4 className="font-semibold mb-2 text-white">
          Risk Mitigation Framework for CEA Swaps
        </h4>
        <p className="text-sm text-navy-200">
          Comprehensive risk management measures to protect all parties in bilateral swap transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {risks.map((risk) => {
          const Icon = risk.icon;
          return (
            <div
                key={risk.title}
                className={`p-4 rounded-lg border bg-navy-800 ${
                risk.color === '#ef4444' ? 'border-red-500' :
                risk.color === '#3b82f6' ? 'border-blue-500' :
                risk.color === '#8b5cf6' ? 'border-violet-500' :
                'border-navy-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    risk.color === '#ef4444' ? 'bg-red-500/20' :
                    risk.color === '#3b82f6' ? 'bg-blue-500/20' :
                    risk.color === '#8b5cf6' ? 'bg-violet-500/20' :
                    'bg-slate-500/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    risk.color === '#ef4444' ? 'text-red-500' :
                    risk.color === '#3b82f6' ? 'text-blue-500' :
                    risk.color === '#8b5cf6' ? 'text-violet-500' :
                    'text-slate-400'
                  }`} />
                </div>
                <h5 className={`font-semibold ${
                  risk.color === '#ef4444' ? 'text-red-500' :
                  risk.color === '#3b82f6' ? 'text-blue-500' :
                  risk.color === '#8b5cf6' ? 'text-violet-500' :
                  'text-white'
                }`}>{risk.title}</h5>
              </div>
              <ul className="text-sm space-y-2">
                {risk.mitigations.map((mitigation, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-navy-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
                    {mitigation}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Conclusion Section
// =============================================================================

const Conclusion = () => {
  const benefits = [
    { name: 'Price arbitrage', range: '8-18%', description: 'Capturing inefficiencies between immature CEA market and mature EUA market' },
    { name: 'Timing optimization', range: '1-8%', description: 'Executing during favorable price spreads' },
    { name: 'Operational efficiency', range: '1-3%', description: 'Avoiding public market impact and trading frictions' },
    { name: 'Currency management', range: '1-2%', description: 'Multi-currency settlement flexibility' },
    { name: 'Strategic positioning', range: '1-4%', description: 'Building relationships in emerging green finance markets' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg bg-navy-700">
        <h4 className="font-bold text-xl mb-4 text-white">
          Executive Summary
        </h4>
        <p className="text-sm mb-4 text-navy-200">
          Non-EU entities holding EUA certificates can realize substantial value (<strong className="text-emerald-500 dark:text-emerald-400">10-22% improvement</strong>) by executing bilateral CEA swap transactions through Nihao Group rather than selling EUA directly on public exchanges.
        </p>

        <div className="space-y-3">
          {benefits.map((benefit, idx) => (
            <div
              key={benefit.name}
              className="flex items-center gap-4 p-3 rounded-lg bg-navy-800"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-emerald-500"
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{benefit.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
                    {benefit.range}
                  </span>
                </div>
                <p className="text-xs mt-1 text-navy-200">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-lg border-2 text-center border-emerald-500 bg-emerald-500/6">
        <div className="text-3xl font-bold mb-2 text-emerald-500">€200-300 Billion</div>
        <p className="text-sm text-navy-200">
          Annual value creation potential across all non-EU EUA holders
        </p>
        <p className="text-sm mt-2 text-navy-200">
          The swap mechanism effectively bridges two previously separate carbon markets, enabling efficient capital allocation and optimal risk management for international participants.
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Main Page Component
// =============================================================================

const EuaHoldersPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('categories');

  const sections = [
    { id: 'categories', label: 'EUA Holder Categories', icon: Building2 },
    { id: 'sizing', label: 'Market Sizing', icon: PieChart },
    { id: 'advantages', label: 'Swap Advantages', icon: TrendingUp },
    { id: 'quantified', label: 'Quantified Benefits', icon: BarChart3 },
    { id: 'implementation', label: 'Implementation', icon: Layers },
    { id: 'risks', label: 'Risk Mitigation', icon: Shield },
    { id: 'conclusion', label: 'Conclusion', icon: CheckCircle2 },
  ];

  const sectionContent: Record<string, React.ReactNode> = {
    categories: <EuaHolderCategories />,
    sizing: <MarketSizingTable />,
    advantages: <SwapAdvantages />,
    quantified: <QuantifiedAdvantages />,
    implementation: <ImplementationFramework />,
    risks: <RiskMitigation />,
    conclusion: <Conclusion />,
  };

  return (
    <OnboardingLayout
      title="EUA Holders"
      subtitle="Categories of Non-EU Entities Holding EUA - Advantages of CEA Swap Through Nihao"
    >
      {/* Executive Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-xl bg-navy-700"
      >
        <h3 className="text-lg font-semibold mb-3 text-white">
          Executive Summary
        </h3>
        <p className="text-sm mb-4 text-navy-200">
          Non-EU entities holding European Union Allowances (EUA) represent a distinct but emerging category of participants in European carbon markets. These organizations—primarily multinational corporations, international financial firms, and foreign-owned manufacturing operations—hold EUA certificates for various strategic reasons.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">10-22%</div>
            <div className="text-xs mt-1 text-navy-200">Total value realization improvement</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-emerald-500">8-18%</div>
            <div className="text-xs mt-1 text-navy-200">Price arbitrage capture</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-navy-800">
            <div className="text-2xl font-bold text-violet-500">2-5%</div>
            <div className="text-xs mt-1 text-navy-200">Cost optimization</div>
          </div>
        </div>
      </motion.div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm border ${activeSection === section.id ? "bg-emerald-500 text-white border-emerald-500" : "bg-navy-800 text-navy-600 dark:text-navy-400 border-navy-200 dark:border-navy-600"}`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-xl bg-navy-800"
        >
          {sectionContent[activeSection]}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
};

export default EuaHoldersPage;
