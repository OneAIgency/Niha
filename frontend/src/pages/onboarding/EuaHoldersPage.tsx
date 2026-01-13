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
import { OnboardingLayout, colors } from '../../components/onboarding';

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
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Factory className="w-5 h-5" style={{ color: colors.secondary }} />
            Category 1: Multinational Corporations with European and Chinese Operations
          </h4>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Large publicly-listed multinational enterprises with significant manufacturing, trading, or operational presence in both Europe and China, generating compliance obligations or strategic carbon holdings in both jurisdictions.
          </p>
        </div>

        {/* Sub-Category 1A: Multinational Industrial Manufacturing Groups */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Factory className="w-4 h-4" />
            1A. Multinational Industrial Manufacturing Groups
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Automotive & Transportation */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.secondary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.secondary }}>
                Automotive & Transportation
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Multinational automotive component suppliers (brakes, engines, emissions systems)</li>
                <li>• Truck and bus manufacturers</li>
                <li>• Estimated non-EU entities with EU operations: 50-100</li>
                <li>• Typical EU allowance holdings: 50,000-1,000,000 tonnes annually</li>
                <li>• Estimated aggregate EUA holdings: 50-100 million tonnes annually</li>
              </ul>
            </div>

            {/* Chemical & Materials Manufacturing */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.secondary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.secondary }}>
                Chemical & Materials Manufacturing
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• International pharmaceutical manufacturers with EU facilities</li>
                <li>• Specialty chemicals and industrial materials producers</li>
                <li>• Polymers, adhesives, coatings manufacturers</li>
                <li>• Estimated non-EU entities: 30-60</li>
                <li>• Typical holdings: 100,000-500,000 tonnes annually</li>
                <li>• Aggregate holdings: 30-50 million tonnes</li>
              </ul>
            </div>

            {/* Metal Manufacturing & Aluminum */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.secondary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.secondary }}>
                Metal Manufacturing & Aluminum
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• International aluminum and metal producers</li>
                <li>• Non-EU operations serving Asian and European markets</li>
                <li>• Estimated entities: 20-40</li>
                <li>• Typical holdings: 200,000-2,000,000 tonnes</li>
                <li>• Aggregate holdings: 20-50 million tonnes</li>
              </ul>
            </div>

            {/* Paper, Pulp & Packaging */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.secondary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.secondary }}>
                Paper, Pulp & Packaging
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• International packaging manufacturers</li>
                <li>• Paper and pulp producers with EU mills</li>
                <li>• Estimated entities: 15-30</li>
                <li>• Typical holdings: 50,000-500,000 tonnes</li>
                <li>• Aggregate holdings: 10-20 million tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.primary }}>60%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Publicly Listed</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.secondary }}>30%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Private Groups</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.accent }}>10%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Joint Ventures</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: colors.border }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
              <li><strong>Source of EUA:</strong> EU operations allocation + direct market purchases</li>
              <li><strong>Annual generation/purchase:</strong> 50,000-2,000,000 tonnes per entity</li>
              <li><strong>Holding periods:</strong> 1-3 years</li>
              <li><strong>Holding motivation:</strong> Compliance, hedging, strategic reserves</li>
              <li><strong>Geographic distribution:</strong> EUA held at European subsidiaries or trading desk</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 1B: Non-EU Financial Institutions */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Landmark className="w-4 h-4" />
            1B. Non-EU Financial Institutions with European Market Access
          </h5>

          <div className="space-y-4">
            {/* International Investment Banks */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>
                International Investment Banks (Non-EU Headquarters)
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• U.S.-headquartered investment banks (JPMorgan, Goldman Sachs, Morgan Stanley)</li>
                <li>• Asian-headquartered banks (ICBC, China Construction Bank, OCBC)</li>
                <li>• Middle Eastern financial institutions</li>
                <li>• Estimated entities with EUA trading operations: 20-40</li>
                <li>• Typical holdings (principal and client): 1,000,000-100,000,000+ tonnes aggregate</li>
              </ul>
            </div>

            {/* Asset Management Firms */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>
                Asset Management Firms (Non-EU)
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• ESG-focused fund managers (Singapore, Japan, Australia, US)</li>
                <li>• Commodity hedge funds (Hong Kong, New York)</li>
                <li>• Pension and sovereign wealth funds (Asia, Middle East)</li>
                <li>• Estimated entities: 30-80</li>
                <li>• Typical holdings: 500,000-20,000,000 tonnes aggregate per firm</li>
              </ul>
            </div>

            {/* Brokers and Traders */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <h6 className="font-medium text-sm mb-2" style={{ color: colors.primary }}>
                Brokers and Traders
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• International commodity brokers headquartered outside EU</li>
                <li>• Trading firms with European licenses</li>
                <li>• Estimated entities: 20-50</li>
                <li>• Typical holdings: 100,000-10,000,000 tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.primary }}>40%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Publicly Listed</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.secondary }}>40%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Private Partnerships</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.accent }}>20%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>State-Owned</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: colors.border }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
              <li><strong>Source of EUA:</strong> EU exchange purchases, OTC bilateral deals, institutional client positions</li>
              <li><strong>Annual turnover:</strong> 10,000,000-500,000,000 tonnes aggregate</li>
              <li><strong>Holding periods:</strong> 3 months to 3 years (investment horizon dependent)</li>
              <li><strong>Holding motivation:</strong> Return maximization, commodity diversification, hedging services</li>
              <li><strong>Geographic concentration:</strong> Financial centers (London, Frankfurt, New York, Hong Kong)</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 1C: International Trading Companies */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <TrendingUp className="w-4 h-4" />
            1C. International Trading Companies
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global Energy Trading Companies */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.accent }}>
                <Fuel className="w-4 h-4" />
                Global Energy Trading
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• International oil and gas traders</li>
                <li>• Renewable energy traders with EU operations</li>
                <li>• Estimated entities: 15-35</li>
                <li>• Typical EUA holdings: 100,000-5,000,000 tonnes per entity</li>
              </ul>
            </div>

            {/* Commodity Trading Houses */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.accent }}>
                <BarChart3 className="w-4 h-4" />
                Commodity Trading Houses
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Agricultural commodities traders diversifying into carbon</li>
                <li>• Metals and minerals traders expanding portfolio</li>
                <li>• Estimated entities: 20-40</li>
                <li>• Typical EUA holdings: 50,000-2,000,000 tonnes per entity</li>
              </ul>
            </div>

            {/* Environmental/ESG Trading Specialists */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
              <h6 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: colors.accent }}>
                <Globe className="w-4 h-4" />
                Environmental/ESG Trading
              </h6>
              <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Carbon credit brokers and traders</li>
                <li>• Sustainability-focused trading firms</li>
                <li>• Estimated entities: 30-50</li>
                <li>• Typical EUA holdings: 500,000-20,000,000 tonnes</li>
              </ul>
            </div>
          </div>

          {/* Organizational Structure */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              Organizational Structure:
            </h6>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.primary }}>60%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Private Trading Partnerships</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.secondary }}>30%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Limited Liability Companies</div>
              </div>
              <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <div className="text-lg font-bold" style={{ color: colors.accent }}>10%</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Publicly Listed</div>
              </div>
            </div>
          </div>

          {/* EUA Holding Characteristics */}
          <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: colors.border }}>
            <h6 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
              EUA Holding Characteristics:
            </h6>
            <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
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
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Landmark className="w-5 h-5" style={{ color: colors.secondary }} />
            Category 2: State-Owned and Government-Linked Non-EU Entities
          </h4>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Government-controlled or government-influenced organizations from non-EU jurisdictions that hold EUA for strategic, sovereign wealth, or policy purposes.
          </p>
        </div>

        {/* Sub-Category 2A: Sovereign Wealth Funds */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Coins className="w-4 h-4" />
            2A. Sovereign Wealth Funds and State Investment Vehicles
          </h5>

          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: `${colors.secondary}15` }}>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Middle Eastern sovereign wealth funds investing in EU green bonds/carbon assets</li>
              <li>• Asian state development banks with EU investments</li>
              <li>• Chinese state-owned holding companies with European subsidiary portfolios</li>
              <li>• Estimated entities: 10-25</li>
              <li>• Aggregate EUA holdings: 1,000,000-50,000,000+ tonnes</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 2B: State-Owned Energy Companies */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Fuel className="w-4 h-4" />
            2B. State-Owned Energy Companies (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: `${colors.primary}15` }}>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Russian, Chinese, Middle Eastern oil/gas companies with EU operations/investments</li>
              <li>• State-owned renewable energy companies with European assets</li>
              <li>• Estimated entities: 5-15</li>
              <li>• Aggregate EUA holdings: 500,000-10,000,000+ tonnes</li>
            </ul>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
          <h5 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
            Organizational Structure:
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-3xl font-bold" style={{ color: colors.primary }}>90%+</div>
              <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                100% State-Owned Enterprises
              </div>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-3xl font-bold" style={{ color: colors.accent }}>10%</div>
              <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                State-Controlled Investment Vehicles
              </div>
            </div>
          </div>
        </div>

        {/* EUA Holding Characteristics */}
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
            EUA Holding Characteristics:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <ArrowRightLeft className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Source of EUA:</strong> Strategic market acquisitions, subsidiary operations</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <Clock className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Holding periods:</strong> 3-10+ years (long-term strategic)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <Target className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Holding motivation:</strong> Strategic reserve, policy objectives, subsidiary compliance</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <BarChart3 className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Profile:</strong> Low turnover, buy-and-hold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    services: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Truck className="w-5 h-5" style={{ color: colors.secondary }} />
            Category 3: Multinational Services and Infrastructure Companies
          </h4>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Large international companies in services, utilities, and infrastructure sectors with European operations generating EUA allocations or holdings.
          </p>
        </div>

        {/* Sub-Category 3A: Utilities and Infrastructure */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Zap className="w-4 h-4" />
            3A. Utilities and Infrastructure (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: `${colors.primary}15` }}>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• International utility companies with European generation assets</li>
              <li>• Infrastructure developers and operators with EU projects</li>
              <li>• Water and waste management companies</li>
              <li>• Estimated entities: 20-40</li>
              <li>• Typical EUA holdings: 100,000-1,000,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 3B: Transportation and Logistics */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <Truck className="w-4 h-4" />
            3B. Transportation and Logistics (Non-EU)
          </h5>

          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: `${colors.secondary}15` }}>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• International shipping companies with EU operations</li>
              <li>• Airlines with European operations (some non-EU headquartered)</li>
              <li>• Logistics and logistics tech companies</li>
              <li className="font-medium" style={{ color: colors.accent }}>
                Note: Transportation sector covered in EU ETS from 2024 (maritime)
              </li>
              <li>• Estimated entities: 10-25</li>
              <li>• Typical EUA holdings: 50,000-500,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Sub-Category 3C: Consumer and Retail Companies */}
        <div className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
            <ShoppingCart className="w-4 h-4" />
            3C. Consumer and Retail Companies
          </h5>

          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: `${colors.accent}15` }}>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• International food and beverage companies with EU manufacturing</li>
              <li>• Consumer goods manufacturers with European operations</li>
              <li>• E-commerce and logistics companies</li>
              <li>• Estimated entities: 15-30</li>
              <li>• Typical EUA holdings: 10,000-100,000 tonnes per entity</li>
            </ul>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
          <h5 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
            Organizational Structure:
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-3xl font-bold" style={{ color: colors.primary }}>70%</div>
              <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Publicly Listed Companies
              </div>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
              <div className="text-3xl font-bold" style={{ color: colors.secondary }}>30%</div>
              <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Private Multinational Enterprises
              </div>
            </div>
          </div>
        </div>

        {/* EUA Holding Characteristics */}
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
          <h5 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
            EUA Holding Characteristics:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <ArrowRightLeft className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Source of EUA:</strong> EU operations allocation + market purchases</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <Clock className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Holding periods:</strong> 1-3 years</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <Target className="w-4 h-4" style={{ color: colors.primary }} />
                <span><strong>Holding motivation:</strong> Compliance, operational hedging</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <BarChart3 className="w-4 h-4" style={{ color: colors.primary }} />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.bgCardHover,
                color: selectedCategory === cat.id ? 'white' : colors.textSecondary,
              }}
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
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: colors.bgCardHover }}>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: colors.textPrimary }}>Category</th>
              <th className="px-4 py-3 text-center font-semibold" style={{ color: colors.textPrimary }}># of Entities</th>
              <th className="px-4 py-3 text-center font-semibold" style={{ color: colors.textPrimary }}>Avg EUA Holdings</th>
              <th className="px-4 py-3 text-center font-semibold" style={{ color: colors.textPrimary }}>Total EUA Holdings</th>
              <th className="px-4 py-3 text-center font-semibold" style={{ color: colors.textPrimary }}>Annual Turnover</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.category}
                style={{
                  backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.bgCardHover,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{row.category}</td>
                <td className="px-4 py-3 text-center" style={{ color: colors.textSecondary }}>{row.entities}</td>
                <td className="px-4 py-3 text-center" style={{ color: colors.textSecondary }}>{row.avgHoldings}</td>
                <td className="px-4 py-3 text-center" style={{ color: colors.primary }}>{row.totalHoldings}</td>
                <td className="px-4 py-3 text-center" style={{ color: colors.secondary }}>{row.annualTurnover}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: colors.primary, borderTop: `2px solid ${colors.primaryDark}` }}>
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
      <div className="p-4 rounded-lg border-2" style={{ borderColor: colors.accent, backgroundColor: `${colors.accent}10` }}>
        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.accent }}>
          <PieChart className="w-5 h-5" />
          Conservative Estimate of Non-EU EUA Holdings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>250-500M</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>Total non-EU holdings (tonnes)</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.secondary }}>200-300M</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>Annual trading volume (tonnes)</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>€20-50B</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>Estimated replacement value</div>
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
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <TrendingUp className="w-5 h-5" style={{ color: colors.success }} />
            Advantage 1: EUA-CEA Price Spread Capture
          </h4>

          {/* Market Price Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.secondary, backgroundColor: `${colors.secondary}10` }}>
              <h5 className="font-medium mb-2" style={{ color: colors.secondary }}>EUA Prices (2025-2026)</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Current: €80-120/tonne</li>
                <li>• Compliance floor: €75-80/tonne</li>
                <li>• Volatility range: ±15-20%</li>
                <li>• Seasonal patterns: Q4 higher, Q2 lower</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.accent, backgroundColor: `${colors.accent}10` }}>
              <h5 className="font-medium mb-2" style={{ color: colors.accent }}>CEA Prices (2025-2026)</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Current: ¥65-90/tonne (~$9-13/tonne; €8.5-12/tonne)</li>
                <li>• Average: ¥75/tonne (~€11/tonne)</li>
                <li>• Volatility: ±10-15%</li>
                <li>• Limited international conversion mechanisms</li>
              </ul>
            </div>
          </div>

          {/* Price Spread Analysis */}
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Price Spread Analysis:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>• <strong>EUA/CEA exchange rate:</strong> 1 EUA ≈ 8-10 CEA (by carbon tonnage equivalent)</li>
              <li>• <strong>Market inefficiency:</strong> EUA price (~€100/tonne) vs. CEA value (~€11/tonne)</li>
              <li>• <strong>Ratio:</strong> 1 EUA = 9.1× the value of 1 CEA on nominal carbon basis</li>
              <li className="font-medium" style={{ color: colors.primary }}>
                BUT: Market treats them as near-equivalent for compliance purposes (same GtCO₂ tonnage)
              </li>
            </ul>
          </div>
        </div>

        {/* Example Arbitrage Calculation */}
        <div className="border-2 rounded-lg p-4" style={{ borderColor: colors.primary }}>
          <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Example Arbitrage Calculation
          </h4>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Scenario: Non-EU entity holds 1,000,000 EUA seeking to optimize portfolio value
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.danger}15`, borderLeft: `4px solid ${colors.danger}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>
                Option A: Sell EUA on Public Exchange
              </h5>
              <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
                <li>1,000,000 EUA × €95/tonne = <strong>€95,000,000</strong></li>
                <li>Transaction cost (0.5%): -€475,000</li>
                <li className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <strong style={{ color: colors.danger }}>Net proceeds: €94,525,000</strong>
                </li>
              </ul>
            </div>

            {/* Option B */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.success}15`, borderLeft: `4px solid ${colors.success}` }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>
                Option B: Swap EUA for CEA Through Nihao
              </h5>
              <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
                <li><strong>Step 1:</strong> Hold EUA (no sale, maintains positions)</li>
                <li><strong>Step 2:</strong> Nihao identifies Chinese entity willing to swap</li>
                <li><strong>Step 3:</strong> Bilateral negotiation</li>
                <li className="pl-3">• Sell 1,000,000 EUA as collateral/backing</li>
                <li className="pl-3">• Receive 11,000,000 CEA (1:11 ratio negotiated)</li>
                <li className="pl-3">• CEA value: 11,000,000 × ¥75/tonne = ¥825,000,000 (~€120,000,000)</li>
                <li className="pl-3">• Facilitation fee (0.5-1%): -€600,000 to -€1,200,000</li>
                <li className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <strong style={{ color: colors.success }}>Net proceeds value: €119,000,000</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Value Capture */}
          <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: colors.primary }}>
            <div className="text-xl font-bold text-white">
              Value Capture: €24,475,000 additional value
            </div>
            <div className="text-2xl font-bold mt-1" style={{ color: colors.primaryLight }}>
              25.9% improvement
            </div>
          </div>

          {/* Key to Arbitrage */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
            <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Key to Arbitrage:</h5>
            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
              <li>• CEA market is less efficient (smaller, less mature)</li>
              <li>• Bilateral negotiation achieves better pricing than exchange spreads</li>
              <li>• Swap structure allows position restructuring</li>
              <li>• Removes intermediary margins from exchange trading</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: Price Timing Optimization */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Clock className="w-5 h-5" style={{ color: colors.accent }} />
            Advantage 2: Price Timing Optimization
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* SEEE Seasonal Patterns */}
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.accent }}>
              <h5 className="font-medium mb-3" style={{ color: colors.accent }}>SEEE (CEA) Seasonal Price Patterns:</h5>
              <div className="space-y-3">
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.success}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.success }}>Q1-Q2: Higher prices (¥85-95/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Lower compliance pressure</li>
                    <li>• Fewer sellers</li>
                    <li>• Financial investors buying</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.secondary}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.secondary }}>Q3: Moderate prices (¥80-90/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Pre-compliance demand building</li>
                    <li>• Balanced supply/demand</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.danger}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.danger }}>Q4: Lower prices (¥65-78/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Compliance-driven selling</li>
                    <li>• Peak supply pressure</li>
                    <li>• Buyer consolidation period</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* EU ETS Seasonal Patterns */}
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.secondary }}>
              <h5 className="font-medium mb-3" style={{ color: colors.secondary }}>EU ETS (EUA) Seasonal Patterns:</h5>
              <div className="space-y-3">
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.danger}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.danger }}>Q1-Q2: Lower prices (€80-90/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Post-compliance surplus</li>
                    <li>• Moderate selling pressure</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.success}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.success }}>Q3: Higher prices (€95-110/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Pre-compliance demand</li>
                    <li>• Financial buying</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${colors.accent}15` }}>
                  <div className="font-medium text-sm" style={{ color: colors.accent }}>Q4: Variable (€85-105/tonne)</div>
                  <ul className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    <li>• Compliance submissions</li>
                    <li>• Year-end positioning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Arbitrage Strategy */}
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.primary }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.primary }}>Timing Arbitrage Through Nihao:</h5>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>1</div>
                <div>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>Monitor both markets</div>
                  <ul className="text-sm" style={{ color: colors.textSecondary }}>
                    <li>• When EUA Q3 pricing peaks (€105/tonne)</li>
                    <li>• When CEA Q2 pricing peaks (¥90/tonne)</li>
                    <li>• Spread advantage: Highest in Q3</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>2</div>
                <div>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>Execute bilateral swap in Q3</div>
                  <ul className="text-sm" style={{ color: colors.textSecondary }}>
                    <li>• Sell 1,000,000 EUA at €105/tonne (€105,000,000 value)</li>
                    <li>• Receive 12,000,000 CEA at negotiated rate (estimated value €115,000,000)</li>
                    <li>• Timing advantage captured: €10,000,000 (9.5% improvement)</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>3</div>
                <div>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>Liquidity management</div>
                  <ul className="text-sm" style={{ color: colors.textSecondary }}>
                    <li>• Use CEA holdings for future EU portfolio management</li>
                    <li>• Option to re-swap back to EUA in Q2 if prices decline</li>
                    <li>• Flexibility to sell CEA on improving market</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded text-center" style={{ backgroundColor: colors.accent }}>
              <span className="font-bold text-white">Estimated Timing Benefit: 3-8% of transaction value</span>
            </div>
          </div>
        </div>
      </div>
    ),

    operational: (
      <div className="space-y-6">
        {/* Advantage 1: Operational Flexibility */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Settings className="w-5 h-5" style={{ color: colors.primary }} />
            Advantage 1: Operational Flexibility in Multiple Jurisdictions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SEEE-Only Limitation */}
            <div className="p-4 rounded-lg border-2" style={{ borderColor: colors.danger, backgroundColor: `${colors.danger}10` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.danger }}>
                <AlertTriangle className="w-4 h-4" />
                SEEE-Only Limitation
              </h5>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Non-EU holders face restrictions selling on SEEE:
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Foreign participation restrictions apply to some market segments</li>
                <li>• Reporting requirements to Chinese authorities</li>
                <li>• Currency conversion delays (RMB settlement)</li>
                <li>• Limited liquidity windows for large transactions</li>
              </ul>
            </div>

            {/* Nihao Swap Advantage */}
            <div className="p-4 rounded-lg border-2" style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}>
              <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.success }}>
                <CheckCircle2 className="w-4 h-4" />
                Nihao Swap Advantage
              </h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Bilateral structure bypasses exchange participation restrictions</li>
                <li>• Direct settlement with counterparty (no SEEE regulatory constraints)</li>
                <li>• Multi-currency settlement options</li>
                <li>• Timing flexibility for execution</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Value Capture:</h5>
            <ul className="text-sm" style={{ color: colors.textSecondary }}>
              <li>• Enables larger transaction sizes without market impact</li>
              <li>• Allows execution at preferred timing window</li>
              <li className="font-medium" style={{ color: colors.primary }}>Estimated value: 1-2% operational efficiency gain</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: Portfolio Rebalancing */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Scale className="w-5 h-5" style={{ color: colors.secondary }} />
            Advantage 2: Portfolio Rebalancing Without Public Market Impact
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exchange Market Impact Risk */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Market Impact Risk:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Sale of 1,000,000+ EUA creates visible market signal</li>
                <li>• Competitors infer supply patterns</li>
                <li>• Price impact from large orders: 2-5% adverse movement</li>
                <li>• Publication in market data delays sale execution</li>
              </ul>
            </div>

            {/* Private Swap Benefit */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Swap Benefit:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Large swaps remain confidential</li>
                <li>• No market impact from public visibility</li>
                <li>• Faster execution without cascading price adjustments</li>
                <li>• Market impact avoided: 2-5% value preservation</li>
              </ul>
            </div>
          </div>

          {/* Example Impact Calculation */}
          <div className="mt-4 p-4 rounded-lg border-2" style={{ borderColor: colors.primary }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.primary }}>Example Impact Calculation:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded" style={{ backgroundColor: `${colors.danger}15` }}>
                <div className="text-sm" style={{ color: colors.textSecondary }}>Public sale impact</div>
                <div className="font-bold" style={{ color: colors.danger }}>-3% price movement</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: `${colors.danger}15` }}>
                <div className="text-sm" style={{ color: colors.textSecondary }}>Loss from market impact</div>
                <div className="font-bold" style={{ color: colors.danger }}>€2,850,000</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>(1M × €95 × 3%)</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: `${colors.success}15` }}>
                <div className="text-sm" style={{ color: colors.textSecondary }}>Private swap loss</div>
                <div className="font-bold" style={{ color: colors.success }}>€0</div>
              </div>
            </div>
            <div className="mt-3 text-center p-2 rounded" style={{ backgroundColor: colors.primary }}>
              <span className="font-bold text-white">Value advantage: €2,850,000 (3%)</span>
            </div>
          </div>
        </div>

        {/* Advantage 3: Regulatory Reporting Optimization */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <FileText className="w-5 h-5" style={{ color: colors.accent }} />
            Advantage 3: Regulatory Reporting Optimization
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exchange Trading Disclosure */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Trading Disclosure:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Public disclosure requirements under MiFID II (EU) and relevant regulations</li>
                <li>• Counterparty identification requirements</li>
                <li>• Transaction details reportable to regulators</li>
                <li>• Potential compliance scrutiny for large foreign traders</li>
                <li>• Risk of regulatory targeting or inquiry</li>
              </ul>
            </div>

            {/* Private Bilateral Structure */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Bilateral Structure:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Minimal regulatory reporting requirements</li>
                <li>• Bilateral transaction remains confidential</li>
                <li>• No public disclosure of counterparty details</li>
                <li>• Reduces regulatory footprint for large traders</li>
                <li>• Estimated compliance cost reduction: 0.5-1.5%</li>
                <li className="font-medium" style={{ color: colors.success }}>Estimated value: €50,000-500,000 per large transaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),

    currency: (
      <div className="space-y-6">
        {/* Advantage 1: Multi-Currency Funding Efficiency */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <DollarSign className="w-5 h-5" style={{ color: colors.success }} />
            Advantage 1: Multi-Currency Funding Efficiency
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Exchange-Based Restrictions */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange-Based Restrictions:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• SEEE requires EUR or direct bank transfer</li>
                <li>• Currency conversion required: 0.2-0.5% conversion spread</li>
                <li>• Delayed settlement due to international wire times</li>
                <li>• Limited ability to optimize currency mix</li>
              </ul>
            </div>

            {/* Private Swap Flexibility */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Swap Flexibility:</h5>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Bilateral negotiation allows payment in:
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCard }}>
                  <span className="font-bold" style={{ color: colors.secondary }}>EUR</span>
                  <div className="text-xs" style={{ color: colors.textMuted }}>EU-based buyers</div>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCard }}>
                  <span className="font-bold" style={{ color: colors.success }}>USD</span>
                  <div className="text-xs" style={{ color: colors.textMuted }}>International settlement</div>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCard }}>
                  <span className="font-bold" style={{ color: colors.accent }}>RMB</span>
                  <div className="text-xs" style={{ color: colors.textMuted }}>China-connected</div>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: colors.bgCard }}>
                  <span className="font-bold" style={{ color: colors.primary }}>Multi</span>
                  <div className="text-xs" style={{ color: colors.textMuted }}>Combinations</div>
                </div>
              </div>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Allows natural hedging against currency exposure</li>
                <li>• Reduces currency conversion needs</li>
              </ul>
            </div>
          </div>

          {/* Example Currency Optimization */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: colors.primary }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.primary }}>Example Currency Optimization:</h5>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
              International financial firm with USD liability:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EUA Exchange Sale */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.danger}15` }}>
                <h6 className="font-medium mb-2" style={{ color: colors.danger }}>EUA Exchange Sale:</h6>
                <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                  <li>Sale: 1,000,000 EUA × €95 = <strong>€95,000,000</strong></li>
                  <li>Convert to USD at 1.10 rate: $104,500,000</li>
                  <li>Conversion cost (0.3% spread): <strong style={{ color: colors.danger }}>-$313,500</strong></li>
                </ul>
              </div>

              {/* Private Swap */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.success}15` }}>
                <h6 className="font-medium mb-2" style={{ color: colors.success }}>Private Swap:</h6>
                <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                  <li>Swap 1,000,000 EUA for 11,000,000 CEA</li>
                  <li>Settle directly in USD: ~$115,000,000</li>
                  <li>Conversion cost: <strong style={{ color: colors.success }}>$0</strong></li>
                </ul>
              </div>
            </div>

            <div className="mt-3 text-center p-2 rounded" style={{ backgroundColor: colors.primary }}>
              <span className="font-bold text-white">Currency optimization value: $313,500 (0.3%)</span>
            </div>
          </div>
        </div>

        {/* Advantage 2: Payment Timing Flexibility */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Clock className="w-5 h-5" style={{ color: colors.secondary }} />
            Advantage 2: Payment Timing Flexibility
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Exchange Market Settlement */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.danger }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.danger }}>Exchange Market Settlement:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• T+2 settlement requirement</li>
                <li>• Requires pre-funding of account</li>
                <li>• No flexibility in payment timing</li>
                <li>• Working capital tied up during settlement</li>
              </ul>
            </div>

            {/* Private Swap Payment Options */}
            <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
              <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Swap Payment Options:</h5>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• Can negotiate 30-60 day settlement periods</li>
                <li>• Staged payments over multiple tranches</li>
                <li>• Allows optimization of cash flow timing</li>
                <li>• Reduces working capital requirements</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Value Capture:</h5>
            <ul className="text-sm" style={{ color: colors.textSecondary }}>
              <li>• Reduced working capital needs: 1-2% financing cost savings</li>
              <li>• Example: 1-month payment delay saves €95,000 × 1%/12 = <strong style={{ color: colors.primary }}>€79,000</strong> in financing costs</li>
            </ul>
          </div>
        </div>
      </div>
    ),

    strategic: (
      <div className="space-y-6">
        {/* Advantage 1: Diversification */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Globe className="w-5 h-5" style={{ color: colors.primary }} />
            Advantage 1: Diversification into Emerging Green Finance Markets
          </h4>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.primary }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.primary }}>Market Development Benefit:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• CEA market is emerging and growing (2025+ expansion)</li>
              <li>• Earlier participants gain first-mover advantage</li>
              <li>• Relationship building with Chinese counterparties</li>
              <li>• Portfolio diversification into new market</li>
            </ul>
          </div>

          <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Strategic Positioning Value:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Establish credibility in Chinese carbon market</li>
              <li>• Build relationships for future transactions</li>
              <li>• Position for China's carbon market growth (estimated to reach EU ETS size within 10 years)</li>
              <li className="font-medium" style={{ color: colors.success }}>Estimated strategic option value: 1-3% of portfolio value annually</li>
            </ul>
          </div>
        </div>

        {/* Advantage 2: ESG and Sustainability Positioning */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Award className="w-5 h-5" style={{ color: colors.success }} />
            Advantage 2: ESG and Sustainability Positioning
          </h4>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.success }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.success }}>Private Swap Market Leadership:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Participation in innovative carbon market solutions</li>
              <li>• ESG alignment through voluntary carbon management</li>
              <li>• Positioning as international carbon market participant</li>
              <li>• Storytelling advantage: "Active participant in global carbon markets"</li>
            </ul>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Value Capture:</h5>
            <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>Enhanced ESG credentials support:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <Users className="w-6 h-6 mx-auto mb-1" style={{ color: colors.primary }} />
                <div className="text-xs" style={{ color: colors.textSecondary }}>Client acquisition (ESG-focused investors value partners)</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <DollarSign className="w-6 h-6 mx-auto mb-1" style={{ color: colors.success }} />
                <div className="text-xs" style={{ color: colors.textSecondary }}>Access to green finance funding at lower costs</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.bgCardHover }}>
                <Award className="w-6 h-6 mx-auto mb-1" style={{ color: colors.accent }} />
                <div className="text-xs" style={{ color: colors.textSecondary }}>Brand positioning as sustainability leader</div>
              </div>
            </div>
            <div className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              <strong style={{ color: colors.primary }}>Estimated value:</strong> 1-2% client value improvement or 0.1-0.3% lower cost of capital
            </div>
          </div>
        </div>

        {/* Advantage 3: Regulatory Arbitrage */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
          <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Shield className="w-5 h-5" style={{ color: colors.secondary }} />
            Advantage 3: Regulatory Arbitrage and Future-Proofing
          </h4>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.secondary }}>
            <h5 className="font-semibold mb-3" style={{ color: colors.secondary }}>Forward-Looking Benefit:</h5>
            <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
              <li>• Private swaps establish non-EU entity presence in carbon markets</li>
              <li>• Positions entity for future EU-China market linkage</li>
              <li>• If markets eventually link, early participants have established relationships</li>
              <li>• Reduces transition risk if regulatory regimes converge</li>
            </ul>
          </div>

          <div className="mt-4 text-center p-3 rounded" style={{ backgroundColor: colors.primary }}>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: selectedAdvantage === adv.id ? colors.primary : colors.bgCardHover,
                color: selectedAdvantage === adv.id ? 'white' : colors.textSecondary,
              }}
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

const QuantifiedAdvantages = () => {
  const summaryData = [
    {
      category: 'Multinational Corporates',
      priceArbitrage: '8-12%',
      timing: '2-4%',
      operational: '1-2%',
      currency: '1-2%',
      strategic: '1-2%',
      total: '13-22%',
      color: colors.primary,
    },
    {
      category: 'Non-EU Financial Firms',
      priceArbitrage: '12-18%',
      timing: '3-8%',
      operational: '2-3%',
      currency: '2-3%',
      strategic: '1-2%',
      total: '20-34%',
      color: colors.secondary,
    },
    {
      category: 'Trading Companies',
      priceArbitrage: '10-15%',
      timing: '2-5%',
      operational: '2-3%',
      currency: '1-2%',
      strategic: '2-3%',
      total: '17-28%',
      color: colors.accent,
    },
    {
      category: 'Gov-Linked Entities',
      priceArbitrage: '6-10%',
      timing: '1-3%',
      operational: '1-2%',
      currency: '0.5-1.5%',
      strategic: '2-4%',
      total: '10.5-20.5%',
      color: colors.success,
    },
    {
      category: 'Infrastructure/Services',
      priceArbitrage: '8-12%',
      timing: '1-3%',
      operational: '1-2%',
      currency: '1-2%',
      strategic: '1-2%',
      total: '12-21%',
      color: colors.danger,
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
        <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <BarChart3 className="w-5 h-5" style={{ color: colors.primary }} />
          Advantage Summary by Entity Category
        </h4>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: colors.bgCardHover }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: colors.textPrimary }}>Category</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Price Arbitrage</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Timing</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Operational</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Currency</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Strategic</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row, idx) => (
                <tr
                  key={row.category}
                  style={{
                    backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.bgCardHover,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <td className="px-3 py-2 font-medium" style={{ color: row.color }}>{row.category}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.priceArbitrage}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.timing}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.operational}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.currency}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.textSecondary }}>{row.strategic}</td>
                  <td className="px-3 py-2 text-center font-bold" style={{ color: colors.success }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Value Creation Table */}
      <div>
        <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <LineChart className="w-5 h-5" style={{ color: colors.accent }} />
          Annual Value Creation Potential
        </h4>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: colors.bgCardHover }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: colors.textPrimary }}>Category</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Category Size</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Avg Advantage</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Annual Value Creation</th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: colors.textPrimary }}>Avg Per Entity</th>
              </tr>
            </thead>
            <tbody>
              {valueCreation.map((row, idx) => (
                <tr
                  key={row.category}
                  style={{
                    backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.bgCardHover,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <td className="px-3 py-2 font-medium" style={{ color: colors.textPrimary }}>{row.category}</td>
                  <td className="px-3 py-2 text-center text-xs" style={{ color: colors.textSecondary }}>{row.size}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.primary }}>{row.avgAdvantage}</td>
                  <td className="px-3 py-2 text-center font-bold" style={{ color: colors.success }}>{row.annualValue}</td>
                  <td className="px-3 py-2 text-center" style={{ color: colors.accent }}>{row.perEntity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aggregate Market Opportunity */}
      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}>
        <h4 className="font-bold text-xl mb-4 text-center" style={{ color: colors.primary }}>
          AGGREGATE MARKET OPPORTUNITY
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-3xl font-bold" style={{ color: colors.success }}>€58.7-982.7B</div>
            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>Total annual value creation</div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-3xl font-bold" style={{ color: colors.primary }}>€200-300B</div>
            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>Conservative realistic estimate</div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>10-22%</div>
            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>Total value improvement</div>
          </div>
        </div>
        <p className="text-sm text-center mt-4" style={{ color: colors.textSecondary }}>
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
        '• Payment terms (30-50% upfront, remainder on delivery)',
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
      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
        <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Multi-Step Swap Process
        </h4>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Complete framework for executing EUA-to-CEA swaps through Nihao's platform
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="p-4 rounded-lg border"
              style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    Step {step.number}: {step.title}
                  </h5>
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
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

const RiskMitigation = () => {
  const risks = [
    {
      title: 'Counterparty Credit Risk',
      icon: Users,
      color: colors.danger,
      mitigations: [
        'Nihao pre-qualification of all CEA providers',
        'Staged settlement reduces exposure per tranche',
        'Escrow arrangements protect both parties',
        'Performance bonds available for large transactions',
        'Insurance coverage options',
      ],
    },
    {
      title: 'Regulatory Risk',
      icon: Shield,
      color: colors.secondary,
      mitigations: [
        'Full documentation compliance with both jurisdictions',
        'Proper tax reporting in both EU and relevant jurisdictions',
        'Compliance with beneficial ownership requirements',
        'Sanctions screening of all counterparties',
      ],
    },
    {
      title: 'Market Risk',
      icon: TrendingUp,
      color: colors.accent,
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
      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
        <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Risk Mitigation Framework for CEA Swaps
        </h4>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Comprehensive risk management measures to protect all parties in bilateral swap transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {risks.map((risk) => {
          const Icon = risk.icon;
          return (
            <div
              key={risk.title}
              className="p-4 rounded-lg border"
              style={{ borderColor: risk.color, backgroundColor: colors.bgCard }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${risk.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: risk.color }} />
                </div>
                <h5 className="font-semibold" style={{ color: risk.color }}>{risk.title}</h5>
              </div>
              <ul className="text-sm space-y-2">
                {risk.mitigations.map((mitigation, idx) => (
                  <li key={idx} className="flex items-start gap-2" style={{ color: colors.textSecondary }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
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
      <div className="p-6 rounded-lg" style={{ backgroundColor: colors.bgCardHover }}>
        <h4 className="font-bold text-xl mb-4" style={{ color: colors.textPrimary }}>
          Executive Summary
        </h4>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          Non-EU entities holding EUA certificates can realize substantial value (<strong style={{ color: colors.success }}>10-22% improvement</strong>) by executing bilateral CEA swap transactions through Nihao Group rather than selling EUA directly on public exchanges.
        </p>

        <div className="space-y-3">
          {benefits.map((benefit, idx) => (
            <div
              key={benefit.name}
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{ backgroundColor: colors.bgCard }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: colors.primary }}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: colors.textPrimary }}>{benefit.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: colors.success, color: 'white' }}>
                    {benefit.range}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-lg border-2 text-center" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}>
        <div className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>€200-300 Billion</div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Annual value creation potential across all non-EU EUA holders
        </p>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
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
        className="mb-8 p-6 rounded-xl"
        style={{ backgroundColor: colors.bgCardHover }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Executive Summary
        </h3>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          Non-EU entities holding European Union Allowances (EUA) represent a distinct but emerging category of participants in European carbon markets. These organizations—primarily multinational corporations, international financial firms, and foreign-owned manufacturing operations—hold EUA certificates for various strategic reasons.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.success }}>10-22%</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Total value realization improvement</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>8-18%</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Price arbitrage capture</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.bgCard }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>2-5%</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>Cost optimization</div>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm"
              style={{
                backgroundColor: activeSection === section.id ? colors.primary : colors.bgCard,
                color: activeSection === section.id ? 'white' : colors.textSecondary,
                border: `1px solid ${activeSection === section.id ? colors.primary : colors.border}`,
              }}
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
          className="p-6 rounded-xl"
          style={{ backgroundColor: colors.bgCard }}
        >
          {sectionContent[activeSection]}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
};

export default EuaHoldersPage;
