import {
  Home, ArrowRightLeft, TrendingUp, Shield, Scale,
  Calculator, FileText, HelpCircle,
  Target, Globe, CheckCircle,
  Swords, Hash, MessageSquare, Route, Clock,
} from 'lucide-react';
import type { ContentDepth } from '../../stores/useIntroducerStore';

// ─── Content Depth ───────────────────────────────────────
export const DEPTH_LEVELS: { id: ContentDepth; label: string }[] = [
  { id: 'essential', label: 'Essential' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const DEPTH_ORDER: Record<ContentDepth, number> = { essential: 0, advanced: 1, expert: 2 };

/** Returns true if the current depth is at least the required depth. */
export function depthAtLeast(current: ContentDepth, required: ContentDepth): boolean {
  return DEPTH_ORDER[current] >= DEPTH_ORDER[required];
}

// ─── Section IDs ───────────────────────────────────────────
// (defined below, referenced by SECTION_DEPTH_MAP after declaration)
export const SECTION_IDS = {
  OVERVIEW: 'overview',
  MECHANISM: 'mechanism',
  MARKETS: 'markets',
  ADVANTAGES: 'advantages',
  LEGAL: 'legal',
  CALCULATOR: 'calculator',
  RESOURCES: 'resources',
  FAQ: 'faq',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

/** Which depth levels have additional content per dashboard tab. */
export const SECTION_DEPTH_MAP: Record<string, ContentDepth[]> = {
  [SECTION_IDS.OVERVIEW]: ['essential', 'advanced', 'expert'],
  [SECTION_IDS.MECHANISM]: ['essential', 'advanced', 'expert'],
  [SECTION_IDS.MARKETS]: ['essential', 'advanced', 'expert'],
  [SECTION_IDS.ADVANTAGES]: ['essential', 'advanced', 'expert'],
  [SECTION_IDS.LEGAL]: ['essential', 'advanced', 'expert'],
  [SECTION_IDS.CALCULATOR]: ['essential'],
  [SECTION_IDS.RESOURCES]: ['essential'],
  [SECTION_IDS.FAQ]: ['essential', 'advanced', 'expert'],
};

// ─── Navigation Items ──────────────────────────────────────
export const NAV_ITEMS = [
  { id: SECTION_IDS.OVERVIEW, label: 'Overview', icon: Home },
  { id: SECTION_IDS.MECHANISM, label: 'How It Works', icon: ArrowRightLeft },
  { id: SECTION_IDS.MARKETS, label: 'Markets', icon: TrendingUp },
  { id: SECTION_IDS.ADVANTAGES, label: 'Why NIHA', icon: Shield },
  { id: SECTION_IDS.LEGAL, label: 'Legal Basis', icon: Scale },
  { id: SECTION_IDS.CALCULATOR, label: 'Calculator', icon: Calculator },
  { id: SECTION_IDS.RESOURCES, label: 'Resources', icon: FileText },
  { id: SECTION_IDS.FAQ, label: 'FAQ', icon: HelpCircle },
] as const;

// ─── Hero Metrics ──────────────────────────────────────────
export const HERO_METRICS = [
  { value: '€800B+', label: 'Global Carbon Market 2024', color: 'emerald' as const, depth: 'essential' as ContentDepth },
  { value: '7–10×', label: 'EUA / CEA Price Gap', color: 'amber' as const, depth: 'essential' as ContentDepth },
  { value: '8–12%', label: 'Cost Savings via NIHA', color: 'emerald' as const, depth: 'essential' as ContentDepth },
  { value: 'T+0', label: 'Settlement Speed', color: 'blue' as const, depth: 'essential' as ContentDepth },
  // Advanced
  { value: '15–25%', label: 'Broker-Intermediated OTC', color: 'amber' as const, depth: 'advanced' as ContentDepth },
  { value: '316×', label: 'EU / CN Volume Ratio', color: 'blue' as const, depth: 'advanced' as ContentDepth },
  { value: '3,500+', label: 'China ETS Entities', color: 'emerald' as const, depth: 'advanced' as ContentDepth },
  { value: '24/7', label: 'Trading Hours', color: 'blue' as const, depth: 'advanced' as ContentDepth },
  // Expert
  { value: '~€9–11/t', label: 'CEA Spot Price', color: 'amber' as const, depth: 'expert' as ContentDepth },
  { value: '~10,000', label: 'EU ETS Installations', color: 'emerald' as const, depth: 'expert' as ContentDepth },
];

// ─── Overview Narratives ──────────────────────────────────
export const OVERVIEW_NARRATIVES: { id: string; title: string; content: string; depth: ContentDepth }[] = [
  {
    id: 'core-thesis',
    title: 'Core Thesis',
    content: 'The EU and China operate the world\'s two largest carbon markets, yet they are completely disconnected — different registries, currencies, regulations, and access requirements. This structural gap creates a persistent 7–10× price differential. NIHA, based in Hong Kong, is the only entity with simultaneous access to both markets, enabling CEA→EUA swaps that deliver 8–12% savings to EU compliance entities.',
    depth: 'essential',
  },
  {
    id: 'what-this-means',
    title: 'What This Means for Introducers',
    content: 'The OTC carbon market handles 15–25% of EU ETS volume — a massive segment operating outside exchanges. These participants value confidentiality, block execution, and price improvement — exactly what NIHA offers. As an introducer, you\'re connecting clients to the only bridge between these two markets at a time when the arbitrage window is at its widest.',
    depth: 'advanced',
  },
  {
    id: 'otc-opportunity',
    title: 'The OTC Opportunity',
    content: 'Over-the-counter trading represents €450B–€750B of annual carbon market activity. These are sophisticated entities making large block trades where 8–12% savings on €10M+ positions are transformational. China\'s market adds 3,500+ new entities with only €9.5M daily volume — a 316× liquidity gap versus EU ETS. NIHA\'s platform is positioned at the intersection of these two structurally disconnected pools.',
    depth: 'expert',
  },
];

// ─── How It Works Steps ────────────────────────────────────
export const HOW_IT_WORKS_STEPS = [
  {
    icon: Target,
    title: 'Client Identifies Need',
    subtitle: 'EU entity requires EUA for compliance',
    extendedContent: 'The client is typically an EU installation covered under the ETS Directive, facing annual compliance obligations. With free allocations declining by 8% in 2026, many entities are facing a growing "compliance gap" — the difference between free allocations received and actual emissions. This gap must be filled by purchasing EUA on the open market.',
  },
  {
    icon: Globe,
    title: 'NIHA Sources CEA',
    subtitle: 'Bilateral acquisition from Chinese market',
    extendedContent: 'NIHA leverages its Greater Bay Area position and established relationships with Chinese compliance entities to bilaterally acquire CEA. These are typically entities with surplus allowances — power generators who have reduced emissions below their allocation, or new entrants in the expanded steel/cement/aluminium sectors who received generous initial allocations.',
  },
  {
    icon: ArrowRightLeft,
    title: 'CEA → EUA Swap',
    subtitle: 'Cross-border exchange at favorable ratio',
    extendedContent: 'The swap is executed with NIHA acting as principal (required by regulation — NIHA must take beneficial ownership of CEA). The conversion ratio reflects the 7–10× price gap between markets. At current prices (EUA ~€81, CEA ~€11), NIHA can source equivalent carbon value at a fraction of EU market price, passing 8–12% savings to the client.',
  },
  {
    icon: CheckCircle,
    title: 'EUA Delivered',
    subtitle: 'Client receives EUA at 8–12% discount',
    extendedContent: 'EUA are delivered to the client\'s EU registry account — the same account they would use for any exchange purchase. Settlement is T+0 (same-day) versus T+2 on European exchanges. The client\'s compliance position is updated immediately, and they retain full documentation for audit purposes.',
  },
  {
    icon: Shield,
    title: 'Compliance Complete',
    subtitle: 'Full documentation provided',
    extendedContent: 'NIHA provides comprehensive documentation: transaction confirmation, custody chain records, swap execution details, and regulatory compliance certificates. The client\'s auditors and regulators see standard EUA holdings — the sourcing method is transparent but the competitive advantage is embedded in the pricing.',
  },
];

// ─── Liquidity Flywheel ──────────────────────────────────
export const LIQUIDITY_FLYWHEEL: { id: string; label: string; description: string }[] = [
  { id: 'fw-1', label: 'EU Buyers Enter', description: 'Demand for discounted EUA attracts EU compliance entities' },
  { id: 'fw-2', label: 'CEA Demand Rises', description: 'More EU buyers means more CEA needed from Chinese market' },
  { id: 'fw-3', label: 'CN Sellers Attracted', description: 'Better prices and EUR proceeds attract Chinese surplus holders' },
  { id: 'fw-4', label: 'Spreads Tighten', description: 'More liquidity on both sides improves execution quality' },
  { id: 'fw-5', label: 'Network Effects', description: 'Better prices attract more participants, reinforcing the cycle' },
];

// ─── Growth Trajectory ──────────────────────────────────
export const GROWTH_TRAJECTORY: { phase: string; name: string; volume: string; spread: string; counterparties: string; description: string }[] = [
  {
    phase: 'Phase 1',
    name: 'Seed',
    volume: '€5–20M/month',
    spread: '8–12% savings',
    counterparties: '5–15 active',
    description: 'Initial bilateral relationships, manual execution, establishing trust and track record with early movers.',
  },
  {
    phase: 'Phase 2',
    name: 'Traction',
    volume: '€50–200M/month',
    spread: '6–10% savings',
    counterparties: '30–80 active',
    description: 'Platform-assisted matching, growing network effects, repeat client revenue. Core Climate Exchange integration adds marketplace optionality.',
  },
  {
    phase: 'Phase 3',
    name: 'Overtake',
    volume: '€500M+/month',
    spread: '4–8% savings',
    counterparties: '100+ active',
    description: 'Automated matching engine, institutional-grade API, regional expansion beyond HK. At this scale, NIHA becomes the de facto cross-border carbon liquidity venue.',
  },
];

// ─── Detailed Examples ──────────────────────────────────
export const DETAILED_EXAMPLES: { id: string; title: string; scenario: string; breakdown: string[]; saving: string }[] = [
  {
    id: 'ex-steel',
    title: 'Steel Plant — 200,000 EUA',
    scenario: 'A German steel manufacturer needs 200,000 EUA for annual compliance. Free allocations cover only 140,000 tonnes, leaving a 60,000 tonne gap that grows each year.',
    breakdown: [
      'Direct purchase: 200,000 × €81 = €16.2M',
      'Via NIHA (10% saving): 200,000 × €72.9 = €14.58M',
      'Annual saving: €1.62M',
      'Over Phase 4 remaining (2026-2030): ~€8.1M cumulative',
    ],
    saving: '€1.62M/year',
  },
  {
    id: 'ex-power',
    title: 'Power Company — 500,000 CEA',
    scenario: 'A Chinese power generator has 500,000 surplus CEA after reducing emissions ahead of schedule. Domestic exchange offers ¥97-99/t after slippage in the thin market.',
    breakdown: [
      'Domestic sale: 500,000 × ¥98 = ¥49M (after slippage)',
      'Via NIHA: 500,000 × ¥104 equivalent = ¥52M (EUR proceeds)',
      'Benefit: ¥3M better + hard currency diversification',
      'EUR proceeds provide natural hedge against CNY depreciation',
    ],
    saving: '¥3M + EUR diversification',
  },
  {
    id: 'ex-trader',
    title: 'Trading House — 50,000 EUA Swap',
    scenario: 'A Hong Kong-based trading house holds 50,000 EUA from a previous transaction and wants CEA exposure for portfolio diversification.',
    breakdown: [
      'Via exchanges: sell EUA on ICE (T+2, slippage) + buy CEA (if access available)',
      'Double execution costs + FX conversion EUR→CNY',
      'Via NIHA: single atomic swap, known ratio, T+0',
      'Eliminates double spread, FX risk, and settlement lag',
    ],
    saving: '~3-5% execution improvement',
  },
];

// ─── Head-to-Head Comparison Metrics (Markets tab) ─────────
export const COMPARISON_METRICS = [
  { metric: 'Spot Price', eu: '€81/t', cn: '~€11/t', highlight: '7-10× gap' },
  { metric: 'Daily Volume', eu: '€3B+', cn: '€9.5M', highlight: '316× difference' },
  { metric: 'Bid-Ask Spread', eu: '2-5 bps', cn: '1-2%', highlight: '50-100× wider' },
  { metric: 'Trading Hours', eu: '11h/day', cn: '4h/day', highlight: '' },
  { metric: 'Covered Entities', eu: '~10,000', cn: '3,500+', highlight: '' },
  { metric: 'Foreign Access', eu: 'Open (MiFID II)', cn: 'Closed', highlight: 'Key barrier' },
];

// ─── Comparison Table ──────────────────────────────────────
export const COMPARISON_ROWS = [
  { feature: 'Cost per tonne', direct: '€81 market price', niha: '€71–74 (8–12% savings)', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'CEA access required', direct: 'No (EUA only)', niha: 'No — NIHA handles everything', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'Market impact', direct: 'Visible on orderbook', niha: 'Zero — dark pool, off-exchange', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'Settlement', direct: 'T+2', niha: 'T+0 instant', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'Block execution', direct: 'Hours, with slippage', niha: 'Instant, at known price', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'Trading hours', direct: '11h/day (exchange)', niha: '24/7 continuous', nihaWins: true, depth: 'essential' as ContentDepth },
  { feature: 'Complexity', direct: 'EU registry + clearing', niha: 'Fund EUR, receive EUA', nihaWins: true, depth: 'essential' as ContentDepth },
  // Advanced
  { feature: 'Confidentiality', direct: 'Exchange-reported', niha: 'Fully confidential OTC', nihaWins: true, depth: 'advanced' as ContentDepth },
  { feature: 'Minimum order', direct: '1,000t standard lot', niha: 'Flexible, negotiated bilaterally', nihaWins: true, depth: 'advanced' as ContentDepth },
  // Expert
  { feature: 'Derivatives access', direct: 'Futures/options available', niha: 'Spot only (for now)', nihaWins: false, depth: 'expert' as ContentDepth },
];

// ─── Liquidity Inversion Bars ──────────────────────────────
export const LIQUIDITY_INVERSION_BARS: { label: string; chinaValue: number; nihaPhase3Value: number; unit: string; invertBar?: boolean }[] = [
  { label: 'Daily Volume', chinaValue: 9.5, nihaPhase3Value: 500, unit: '€M' },
  { label: 'Active Counterparties', chinaValue: 50, nihaPhase3Value: 100, unit: '' },
  { label: 'Trading Hours/Day', chinaValue: 4, nihaPhase3Value: 24, unit: 'h' },
  { label: 'Settlement Speed (lower = better)', chinaValue: 2, nihaPhase3Value: 0, unit: ' days', invertBar: true },
  { label: 'Bid-Ask Spread', chinaValue: 150, nihaPhase3Value: 20, unit: 'bps' },
];

// ─── Structural Factors (Head-to-Head Expert) ──────────────
export const STRUCTURAL_FACTORS: { factor: string; euEts: string; chinaEts: string; nihaImplication: string }[] = [
  { factor: 'Market Age', euEts: '20+ years (2005)', chinaEts: '3 years (2021)', nihaImplication: 'China still maturing — more inefficiencies' },
  { factor: 'Registry System', euEts: 'EU Transaction Log', chinaEts: 'National + provincial', nihaImplication: 'No interoperability — NIHA bridges' },
  { factor: 'Currency', euEts: 'EUR', chinaEts: 'CNY', nihaImplication: 'FX layer adds complexity competitors avoid' },
  { factor: 'Cap Type', euEts: 'Absolute (declining)', chinaEts: 'Intensity-based → absolute 2027', nihaImplication: 'China transition creates uncertainty = opportunity' },
  { factor: 'Verification', euEts: 'Accredited verifiers', chinaEts: 'MRV improving', nihaImplication: 'Quality assurance needs intermediary trust' },
  { factor: 'Financial Products', euEts: 'Futures, options, swaps', chinaEts: 'Spot only', nihaImplication: 'Spot-to-spot swap is natural fit' },
  { factor: 'Foreign Access', euEts: 'Open (MiFID II)', chinaEts: 'Closed (State Council)', nihaImplication: 'Access barrier = NIHA\'s moat' },
  { factor: 'OTC Market', euEts: '36% of volume', chinaEts: 'Minimal', nihaImplication: 'EU entities familiar with OTC execution' },
  { factor: 'Compliance Cycle', euEts: 'Annual (April 30)', chinaEts: 'Annual (Dec 31)', nihaImplication: 'Offset timing enables year-round flow' },
  { factor: 'Price Transparency', euEts: 'High (exchange-listed)', chinaEts: 'Low (fragmented)', nihaImplication: 'Opacity = value for informed intermediary' },
];

// ─── Value Propositions ────────────────────────────────────
export const VALUE_PROPOSITIONS = [
  { title: '8–12% Cost Savings', description: 'Via CEA→EUA swap arbitrage between disconnected carbon markets', extendedDescription: 'The savings are structural, not speculative — they exist because two large, liquid markets are completely disconnected by regulation, currency, and access barriers. As long as the price gap persists (forecast through at least 2030), the arbitrage is repeatable.', color: 'emerald' as const, depth: 'essential' as ContentDepth },
  { title: 'Exclusive Access', description: 'Only bridge between EU ETS and China ETS via Hong Kong', extendedDescription: 'Hong Kong\'s Greater Bay Area position gives NIHA what no other entity has: simultaneous access to Chinese pilot carbon markets (via GBA framework) and European carbon infrastructure. This isn\'t replicable from Singapore, Dubai, London, or any other financial center.', color: 'amber' as const, depth: 'essential' as ContentDepth },
  { title: 'Zero Market Impact', description: 'Dark pool, off-exchange execution — fully confidential', extendedDescription: 'Large institutional orders on exchanges move prices against the buyer. A 500,000 tonne order on ICE would be visible to the entire market. Via NIHA, the same order executes bilaterally with zero information leakage — the market never sees the trade.', color: 'blue' as const, depth: 'essential' as ContentDepth },
  { title: 'Instant Settlement', description: 'T+0 vs T+2, available 24/7 — no exchange delays', extendedDescription: 'Exchange settlement requires clearing house involvement, margin calls, and T+2 delivery. NIHA settles same-day because the swap is bilateral and pre-funded. For entities managing tight compliance deadlines, this speed advantage can be critical.', color: 'emerald' as const, depth: 'essential' as ContentDepth },
  // Advanced
  { title: 'Network Effects', description: 'More buyers attract more sellers — liquidity begets liquidity', extendedDescription: 'NIHA\'s platform creates a two-sided network: EU entities seeking discounted EUA, and Chinese entities seeking better CEA exits. Each new participant on either side makes the platform more valuable for everyone. This is the classic marketplace flywheel that creates winner-take-most dynamics.', color: 'amber' as const, depth: 'advanced' as ContentDepth },
  { title: 'Regulatory Moat', description: 'HK GBA position creates structural barriers to entry', extendedDescription: 'Replicating NIHA requires: HK entity with GBA carbon market access (regulatory), NRA-RMB banking relationships (financial), bilateral relationships with Chinese CEA holders (years to build), cross-border regulatory expertise (specialized), and first-mover network effects (market). Each barrier is significant; together they are formidable.', color: 'blue' as const, depth: 'advanced' as ContentDepth },
];

// ─── Market Data ───────────────────────────────────────────
export const EU_ETS_METRICS = [
  { label: 'Spot Price', value: '€81/t' },
  { label: 'Daily Volume', value: '€3B+' },
  { label: 'Bid-Ask Spread', value: '2-5 bps' },
  { label: 'Covered Entities', value: '~10,000' },
];

export const CHINA_ETS_METRICS = [
  { label: 'Spot Price', value: '¥80-100 (~€9-11/t)' },
  { label: 'Daily Volume', value: '€9.5M' },
  { label: 'Bid-Ask Spread', value: '1-2%' },
  { label: 'Covered Entities', value: '3,500+' },
];

export const EU_ETS_ACCORDIONS = [
  { id: 'structure', title: 'Market Structure & Participants', content: 'The EU ETS covers approximately 10,000 installations across power generation, heavy industry, and aviation. The market operates in phases, with Phase 4 (2021-2030) introducing linear reduction factors that decrease the overall cap by 4.3% annually. Key participants include compliance entities, financial intermediaries, and over-the-counter (OTC) brokers who facilitate ~36% of total volume.', depth: 'essential' as ContentDepth },
  { id: 'supply-2026', title: '2026 Supply Changes', content: 'Free allocation drops by 8% in 2026 as part of the "Fit for 55" package. Combined with CBAM taking full effect, this creates significant upward price pressure. Entities that previously received free allowances must now purchase them on the open market, increasing total demand while supply tightens.', depth: 'essential' as ContentDepth },
  { id: 'trading-venues', title: 'Trading Venues & Access', content: 'Primary exchanges: ICE Endex (Netherlands) and EEX (Germany). OTC market handles 36% of volume. Access requires EU registry account, clearing membership, and compliance with MiFID II. Standard lot: 1,000 tonnes. Settlement: T+2 business days via clearing houses.', depth: 'essential' as ContentDepth },
  { id: 'alternatives', title: 'Why EU Entities Need Alternatives', content: 'With EUA prices at €81/tonne and free allocations declining, compliance costs are accelerating. A mid-size industrial installation requiring 100,000 tonnes faces €8.1M in annual compliance costs. Even a 10% reduction via NIHA translates to €810,000 in savings — material enough to justify exploring alternative sourcing.', depth: 'essential' as ContentDepth },
  // Advanced
  { id: 'exchange-details', title: 'Exchange Infrastructure (ICE/EEX/OTC)', content: 'ICE Endex (Amsterdam) handles ~60% of exchange volume with the benchmark EUA futures contract. EEX (Leipzig) serves primarily German and Austrian participants. OTC brokers (ICAP, Tradition, Tschach Solutions) handle 15-25% of total volume for large block trades where anonymity matters. Clearing is via ICE Clear Europe or European Commodity Clearing (ECC). Margin requirements are 15-20% of notional for futures positions.', depth: 'advanced' as ContentDepth },
  { id: 'otc-share', title: 'OTC Market Share & Dynamics', content: 'The OTC segment processes an estimated €450B–€750B annually in carbon trades. These are sophisticated participants — utilities managing multi-year hedging programs, industrial groups with cross-border compliance, and trading houses running spread strategies. OTC participants value: confidentiality (no exchange reporting), block execution (no market impact), customized settlement terms, and relationship-based pricing. This is exactly NIHA\'s target market.', depth: 'advanced' as ContentDepth },
  // Expert
  { id: 'phase-out', title: 'Free Allocation Phase-Out Schedule', content: 'Phase 4 free allocation reductions: 2026: -8% vs 2025, 2027: -16% cumulative, 2028: -24% cumulative, 2029: -35% cumulative, 2030: -48% cumulative. CBAM sectors (cement, steel, aluminium, fertiliser, electricity, hydrogen) face accelerated phase-out: free allocations reach zero by 2034. This creates a predictable, growing demand curve for EUA purchases — the total addressable market for NIHA expands every year through 2034.', depth: 'expert' as ContentDepth },
];

export const CHINA_ETS_ACCORDIONS = [
  { id: 'structure', title: 'Market Structure & Coverage', content: 'China\'s national ETS launched in 2021 covering the power sector. In 2024-2025, coverage expanded to include steel, cement, and aluminium — adding over 1,300 entities and bringing the total to 3,500+. The market uses China Emission Allowances (CEA) traded on designated exchanges in Shanghai, Hubei, and pilot markets including Shenzhen.', depth: 'essential' as ContentDepth },
  { id: 'liquidity', title: 'Liquidity Challenge', content: '79% of annual trading volume concentrates in Q4 as compliance entities rush to meet year-end deadlines. This creates severe seasonal distortion: prices and liquidity spike in October-December, while January-September sees thin trading with wide spreads (1-2% vs 2-5 bps in EU ETS). Daily volume averages only €9.5M vs €3B+ in EU ETS — a 316× difference.', depth: 'essential' as ContentDepth },
  { id: 'access', title: 'Access Restrictions', content: 'Only onshore compliance entities can directly participate in China\'s national ETS. Foreign entities face prohibitive barriers: no registry account access, no NRA-RMB banking relationships, and no exchange membership pathway. Even pilot markets (Shenzhen, Shanghai) that theoretically allow foreign participation require months of setup with uncertain outcomes.', depth: 'essential' as ContentDepth },
  { id: 'expansion', title: '2024-2025 Expansion', content: 'The addition of steel, cement, and aluminium sectors in 2024-2025 has dramatically expanded the market. New compliance entities are entering an unfamiliar trading environment, creating opportunities for intermediaries who can offer better execution than the thin domestic market. Many new entrants are looking for EUR-denominated exits — exactly what NIHA provides.', depth: 'essential' as ContentDepth },
  // Advanced
  { id: 'venues', title: 'Trading Venues (Shanghai/Shenzhen/Pilots)', content: 'Shanghai Environment and Energy Exchange (SEEE) is the primary national venue. Shenzhen Emissions Exchange is the most active pilot market and the one most accessible to Greater Bay Area entities. Hubei handles significant national volume. Pilot markets in Beijing, Tianjin, Chongqing, and Guangdong continue to operate independently. Each venue has different rules, price discovery, and access requirements — creating fragmentation that benefits informed intermediaries like NIHA.', depth: 'advanced' as ContentDepth },
  { id: 'seasonal', title: 'Seasonal Volume Pattern', content: 'January-March: ~5% of annual volume (post-compliance lull). April-June: ~10% (new allocation distribution). July-September: ~6% (summer doldrums). October-December: ~79% (compliance rush). This extreme seasonality means NIHA can source CEA at favorable prices during Q1-Q3 quiet periods and execute swaps year-round, exploiting the timing mismatch between EU compliance (April 30) and China compliance (December 31).', depth: 'advanced' as ContentDepth },
  // Expert
  { id: 'cap-2027', title: '2027 Absolute Cap Transition', content: 'China\'s current intensity-based allocation (tonnes CO₂ per unit of output) transitions to an absolute cap by 2027. This is a paradigm shift: entities can no longer grow emissions proportionally with production. Price projections: 2026 ¥80-100/t, 2027 ¥100-130/t, 2028 ¥130-170/t, 2030 ¥200+/t. As Chinese carbon prices rise, the 7-10× gap narrows to ~5× by 2030 — but absolute price levels on both sides increase, meaning NIHA\'s 8-12% savings remain material in EUR terms even as the ratio compresses.', depth: 'expert' as ContentDepth },
];

// ─── Client Paths ──────────────────────────────────────────
export const CLIENT_PATHS = [
  {
    id: 'path-a',
    title: 'EU Entity Acquiring EUA',
    label: 'Path A',
    color: 'emerald' as const,
    keyPoint: 'EU entity never touches CEA — fund EUR, receive EUA',
    steps: ['EU Entity deposits EUR', 'NIHA sources CEA bilaterally', 'NIHA executes CEA→EUA swap', 'EU Entity receives EUA at discount'],
    comparison: { via: 'Exchange: €81/t, T+2, visible on orderbook', niha: 'NIHA: €71-74/t, T+0, zero market impact' },
    extendedExample: {
      title: '200,000 EUA — German Steel Manufacturer',
      lines: [
        'Annual compliance gap: 60,000 tonnes (growing 8%/year)',
        'Direct cost: 200,000 × €81 = €16.2M',
        'Via NIHA: 200,000 × €72.90 = €14.58M (10% saving)',
        'Annual saving: €1.62M → €8.1M over Phase 4 remainder',
      ],
    },
    detailedComparison: {
      rows: [
        { label: 'Unit price', exchange: '€81.00/t', niha: '€72.90/t' },
        { label: 'Total cost', exchange: '€16.2M', niha: '€14.58M' },
        { label: 'Settlement', exchange: 'T+2 via clearing', niha: 'T+0 bilateral' },
        { label: 'Market impact', exchange: '~€0.15-0.30/t slippage', niha: 'Zero' },
        { label: 'All-in saving', exchange: '—', niha: '€1.62M + reduced slippage' },
      ],
    },
  },
  {
    id: 'path-b',
    title: 'Chinese Entity Selling Surplus CEA',
    label: 'Path B',
    color: 'amber' as const,
    keyPoint: '5-8% better price than domestic exchange + EUR proceeds',
    steps: ['CN Entity sells CEA to NIHA', 'NIHA pays in EUR (hard currency)', 'Entity receives ¥103-106 equivalent', 'Hard currency diversification achieved'],
    comparison: { via: 'Domestic: ¥97-99/t after slippage, CNY only', niha: 'NIHA: ¥103-106 equivalent, EUR proceeds' },
    extendedExample: {
      title: '500,000 CEA — Chinese Power Generator',
      lines: [
        'Surplus from emissions reduction program',
        'Domestic exchange: 500,000 × ¥98 = ¥49M (after 1-2% slippage)',
        'Via NIHA: 500,000 × ¥104 equiv = ¥52M in EUR proceeds',
        'Benefit: ¥3M better price + hard currency diversification',
      ],
    },
    detailedComparison: {
      rows: [
        { label: 'Unit price', exchange: '¥98/t (after slippage)', niha: '¥104/t equivalent' },
        { label: 'Total proceeds', exchange: '¥49M', niha: '¥52M (in EUR)' },
        { label: 'Currency', exchange: 'CNY only', niha: 'EUR (hard currency)' },
        { label: 'Execution window', exchange: '4h/day, Q4 concentrated', niha: '24/7, year-round' },
        { label: 'Net benefit', exchange: '—', niha: '¥3M + FX diversification' },
      ],
    },
  },
  {
    id: 'path-c',
    title: 'Non-EU Entity Swapping EUA → CEA',
    label: 'Path C',
    color: 'blue' as const,
    keyPoint: 'Single atomic transaction — no FX conversion needed',
    steps: ['Entity deposits EUA', 'NIHA swap engine executes', 'Entity receives CEA', 'No double exchange fees'],
    comparison: { via: 'Via exchanges: sell EUA + buy CEA, double fees, days', niha: 'NIHA: single atomic swap, instant' },
    extendedExample: {
      title: '50,000 EUA — Hong Kong Trading House',
      lines: [
        'Portfolio rebalancing: shift EUA exposure to CEA',
        'Via exchanges: sell EUA on ICE (T+2) + buy CEA (if access available)',
        'Double execution costs: ~1-2% on each leg = 2-4% total',
        'Via NIHA: single atomic swap at known ratio, T+0, ~1% total cost',
      ],
    },
    detailedComparison: {
      rows: [
        { label: 'Execution', exchange: 'Two separate trades', niha: 'Single atomic swap' },
        { label: 'Total fees', exchange: '2-4% (double spread)', niha: '~1%' },
        { label: 'FX exposure', exchange: 'EUR→CNY conversion needed', niha: 'None (direct swap)' },
        { label: 'Time to complete', exchange: '2-5 business days', niha: 'Same day (T+0)' },
        { label: 'Execution risk', exchange: 'Leg risk between trades', niha: 'Atomic — all or nothing' },
      ],
    },
  },
];

// ─── Legal Framework ───────────────────────────────────────
export const LEGAL_ACCORDIONS = [
  { id: 'eu-cant-buy', title: 'Why EU Entities Cannot Acquire CEA', content: 'China\'s national ETS is closed to foreign participants by State Council regulation. Pilot markets require: NRA-RMB bank account (months of setup), SAFE foreign exchange approval, exchange membership application, and ongoing compliance reporting — all with no established precedent for EU entities. The regulatory path is theoretically possible but practically prohibitive.', depth: 'essential' as ContentDepth },
  { id: 'hk-jurisdiction', title: 'Why Hong Kong Is the Only Jurisdiction', content: 'Hong Kong uniquely combines: (1) Greater Bay Area zone providing access to Shenzhen pilot carbon market, (2) NRA-RMB banking that is routine for HK entities but months-long for EU entities, (3) Standard European market infrastructure for EU ETS access, (4) Core Climate Exchange adding local marketplace optionality. Singapore lacks GBA access. Dubai and London face the same Chinese market barriers as EU entities.', depth: 'essential' as ContentDepth },
  { id: 'transaction-architecture', title: 'Transaction Architecture', content: 'Five-step custody flow: (1) Client funds EUR to NIHA escrow, (2) NIHA acquires CEA from Chinese counterparty via pilot market, (3) CEA held in NIHA custody account (required — registry accounts cannot be opened by non-Chinese entities), (4) NIHA executes CEA→EUA swap as principal, (5) EUA delivered to client\'s EU registry account. Each step has legal justification rooted in regulatory requirements.', depth: 'essential' as ContentDepth },
  { id: 'regulatory-sources', title: 'Key Regulatory Sources', content: 'EU ETS Directive 2003/87/EC (consolidated), China\'s National ETS Management Measures (MEE Decree No. 19), Shenzhen Pilot Market Regulations, Hong Kong Securities and Futures Ordinance, Greater Bay Area Financial Cooperation Framework, EU CBAM Regulation 2023/956.', depth: 'essential' as ContentDepth },
  // Advanced
  { id: 'carbon-connect', title: 'Greater Bay Area Carbon Connect', content: 'The GBA Carbon Connect scheme, announced in 2024, creates a framework for cross-boundary carbon trading within the Greater Bay Area (Hong Kong, Macau, Guangdong). While still in pilot phase, it provides the regulatory foundation for HK-based entities to participate in Shenzhen\'s pilot carbon market. NIHA\'s structure anticipates and leverages this framework. Key risk: if Carbon Connect evolves to allow direct EU-China access, NIHA\'s intermediary role could be disrupted — but current trajectory suggests years before any such direct access materializes.', depth: 'advanced' as ContentDepth },
  { id: 'jurisdictions', title: 'Why Not Singapore, Dubai, or London?', content: 'Singapore: No Greater Bay Area access, no NRA-RMB banking pathway, and no pilot market participation framework. Climate Impact X (CIX) focuses on voluntary carbon, not compliance markets. Dubai: DEWA carbon credits are domestic. No Chinese market linkage exists or is planned. DIFC provides no advantage for carbon market access. London: Post-Brexit, UK operates a separate UK ETS. EU market access requires EU entity. Chinese market access faces same barriers as any European entity. Only Hong Kong sits at the intersection of Chinese market access (GBA), European market infrastructure (SWIFT, EUR banking), and carbon market expertise.', depth: 'advanced' as ContentDepth },
  // Expert
  { id: 'custody-legal', title: 'Custody Flow Legal Justification', content: 'Step 1 (EUR deposit): Standard escrow arrangement under HK law. Funds held in segregated account at licensed bank. Step 2 (CEA acquisition): NIHA acquires as principal, not agent — required because foreign entities cannot hold Chinese carbon registry accounts. Legal basis: Shenzhen pilot market foreign participation regulations (2023 amendment). Step 3 (Custody): CEA held in NIHA\'s registry account. Beneficial ownership documented but legal title with NIHA — mirrors how prime brokers hold securities for clients. Step 4 (Swap execution): NIHA converts CEA economic value to EUA as principal transaction. Not a derivative under MiFID II because it\'s physical delivery of commodity. Step 5 (EUA delivery): Standard EU registry transfer. Client receives EUA with full provenance documentation.', depth: 'expert' as ContentDepth },
  { id: 'citations', title: 'Detailed Regulatory Citations', content: 'EU ETS: Directive 2003/87/EC Art. 12 (transfer of allowances), Art. 19 (registries). Registry Regulation (EU) 2019/1122 Art. 15 (account types). China National ETS: MEE Decree No. 19 Art. 7 (covered entities — power sector), Art. 10 (allocation), Art. 14 (trading restrictions). Shenzhen Pilot: SZMO [2014] No. 3 Art. 29 (foreign institutional investors). GBA Framework: Outline Development Plan for GBA (2019) Section 6.3 (financial cooperation). CBAM: Regulation (EU) 2023/956 Art. 4 (scope), Art. 7 (CBAM certificates). HK SFO: Cap. 571 Part V (licensing), Schedule 5 (regulated activities — carbon not currently a "security" or "future" under SFO, but Core Climate Exchange operates under voluntary framework).', depth: 'expert' as ContentDepth },
];

// ─── Timing & Convergence ──────────────────────────────────
export const TIMING_CATALYSTS = [
  { title: 'EU CBAM Takes Effect', year: '2026', description: 'Importers must buy CBAM certificates for embedded emissions — increases EUA demand', extendedContent: 'CBAM covers cement, iron & steel, aluminium, fertiliser, electricity, and hydrogen. EU importers must purchase CBAM certificates at the prevailing EUA price for embedded emissions in imported goods. This effectively extends EUA demand beyond the ~10,000 installations covered by the ETS, adding thousands of importers to the demand side.' },
  { title: 'EUA Supply Drops 8%', year: '2026', description: 'Free allocation reduction under "Fit for 55" — tightens supply significantly', extendedContent: 'The linear reduction factor increases from 2.2% to 4.3% annually under the revised ETS Directive. Combined with CBAM-related phase-out of free allocations for covered sectors, the supply squeeze accelerates through 2030. Analysts project EUA prices of €90-100 by 2027 and €120-130 by 2030.' },
  { title: 'China ETS Expanded', year: '2024-25', description: 'Steel, cement, aluminium added — 3,500+ entities, more CEA sellers', extendedContent: 'The expansion from ~2,200 power-sector entities to 3,500+ adds compliance entities in sectors with high carbon intensity and, in many cases, surplus allocations (generous initial allocation to ease transition). These new entrants represent fresh CEA supply for NIHA\'s platform.' },
  { title: 'Arbitrage Window Closing', year: '2026-30', description: 'As China\'s carbon price rises, the 7-10× gap will compress to 5×', extendedContent: 'Current 7-10× price gap is at or near its maximum. As China transitions to absolute caps (2027) and prices rise toward ¥200+/t (~€25), the ratio compresses to ~5× by 2030. However, 8-12% savings remain achievable in EUR terms because both base prices increase. Early movers capture the widest gap.' },
];

export const CONVERGENCE_TABLE = [
  { year: '2024', eua: '€67', cea: '~€12', ratio: '5.6×', opportunity: 'Building' },
  { year: '2025', eua: '€74', cea: '~€10', ratio: '7.4×', opportunity: 'Growing' },
  { year: '2026', eua: '€81', cea: '~€11', ratio: '7-10×', opportunity: '★ Peak Window' },
  { year: '2027', eua: '~€90', cea: '~€14', ratio: '~6.4×', opportunity: 'Narrowing' },
  { year: '2028', eua: '~€100', cea: '~€17', ratio: '~6×', opportunity: 'Compressing' },
  { year: '2029', eua: '~€113', cea: '~€21', ratio: '~5.4×', opportunity: 'Reduced' },
  { year: '2030', eua: '~€126', cea: '~€25', ratio: '~5×', opportunity: 'Reduced' },
];

export const RISK_MITIGATIONS = [
  { id: 'reg-risk', risk: 'Regulatory Risk', description: 'China tightens cross-border carbon trading', mitigation: 'NIHA\'s HK structure uses established, legal pathways — no grey-area exploitation', depth: 'essential' as ContentDepth },
  { id: 'cpty-risk', risk: 'Counterparty Risk', description: 'NIHA as principal in OTC trades', mitigation: 'Escrow structures, staged settlement, institutional-grade custody', depth: 'essential' as ContentDepth },
  { id: 'fx-risk', risk: 'FX Risk (EUR/CNY)', description: 'Currency volatility during settlement', mitigation: 'T+0 settlement minimizes exposure window; hedging available', depth: 'essential' as ContentDepth },
  { id: 'convergence-risk', risk: 'Price Convergence', description: 'CEA price rises, gap narrows', mitigation: 'Early movers capture widest gap; NIHA\'s fee model adapts to narrower spreads', depth: 'essential' as ContentDepth },
  // Advanced
  { id: 'carbon-connect-risk', risk: 'Carbon Connect Risk', description: 'GBA Carbon Connect may enable direct EU-China carbon trading', mitigation: 'Carbon Connect is in pilot phase, focused on GBA entities only. Even if expanded, direct EU access requires years of regulatory harmonization. NIHA\'s bilateral relationships and execution infrastructure remain valuable regardless of market structure evolution.', depth: 'advanced' as ContentDepth },
  // Expert
  { id: 'liquidity-risk', risk: 'Liquidity Risk', description: 'Insufficient CEA supply or EUA demand at NIHA\'s target prices', mitigation: 'China ETS expansion to 3,500+ entities creates growing CEA supply pool. EU free allocation phase-out creates growing EUA demand. NIHA\'s platform model means it only needs to match bilateral flows — it doesn\'t warehouse positions or take directional risk. The liquidity flywheel (more buyers → more sellers → better prices → more participants) creates a self-reinforcing cycle.', depth: 'expert' as ContentDepth },
];

// ─── FAQ ───────────────────────────────────────────────────
export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'mechanism', label: 'The Exchange Mechanism' },
  { id: 'compliance', label: 'Compliance & Regulation' },
  { id: 'pricing', label: 'Pricing & Settlement' },
] as const;

export const FAQ_ITEMS: { category: string; id: string; question: string; answer: string; depth: ContentDepth }[] = [
  // Essential (existing)
  { category: 'getting-started', id: 'business-model', question: 'What is NIHA\'s core business model?', answer: 'NIHA operates the only cross-border bridge between the EU ETS and China ETS. We source CEA (China Emission Allowances) bilaterally from Chinese counterparties, execute a CEA→EUA swap, and deliver EUA to EU entities at an 8-12% discount versus direct market purchase. Our unique position in Hong Kong gives us simultaneous access to both markets — something no other entity can replicate.', depth: 'essential' },
  { category: 'getting-started', id: 'target-clients', question: 'Who are NIHA\'s target clients?', answer: 'Primary: EU entities with EUA compliance obligations (power generators, industrial installations, aviation operators). Secondary: Chinese entities with surplus CEA seeking EUR-denominated exits at better prices than domestic exchanges. Tertiary: Non-EU entities seeking CEA→EUA or EUA→CEA swaps for portfolio management.', depth: 'essential' },
  { category: 'mechanism', id: 'swap-works', question: 'How does the CEA→EUA swap work?', answer: 'The client deposits EUR into NIHA\'s escrow account. NIHA bilaterally acquires CEA from Chinese counterparties via pilot market access. CEA is held in NIHA\'s custody account (required by regulation). NIHA then executes the swap as principal, converting CEA exposure into EUA. The EUA is delivered to the client\'s EU registry account. The entire process settles T+0.', depth: 'essential' },
  { category: 'mechanism', id: 'custody-requirement', question: 'Why must NIHA hold CEA in custody?', answer: 'CEA registry accounts cannot be opened by non-Chinese entities. The swap mechanism requires NIHA (as a GBA-based entity with Chinese market access) to take beneficial ownership of CEA, execute the cross-border swap as principal, and then deliver EUA. NIHA cannot act as mere agent — regulatory requirements mandate it be the counterparty.', depth: 'essential' },
  { category: 'mechanism', id: 'replication-barrier', question: 'What prevents someone from replicating NIHA\'s model?', answer: 'Five barriers: (1) Bilateral relationships with Chinese CEA holders — years to build, trust-based. (2) Cross-border regulatory expertise across EU and Chinese carbon law. (3) Swap execution infrastructure. (4) Network effects — sellers attract buyers and vice versa, creating a cold-start problem. (5) First-mover advantage with established operational track record.', depth: 'essential' },
  { category: 'compliance', id: 'eu-cant-buy-cea', question: 'Why can\'t EU entities buy CEA directly?', answer: 'China\'s national ETS is closed to foreign participants by State Council regulation. Pilot markets require: NRA-RMB bank account (months of setup), SAFE FX approval, exchange membership, and ongoing compliance reporting — all with no precedent for EU entities. The path is theoretically possible but practically prohibitive.', depth: 'essential' },
  { category: 'compliance', id: 'legal-sound', question: 'Is this structure legally sound?', answer: 'Yes. NIHA uses established, regulated pathways in each jurisdiction. The arbitrage exists because EU and China carbon markets are structurally disconnected — different registries, regulations, currencies, and access requirements. NIHA bridges this structural gap through Hong Kong\'s unique GBA position. There is no regulatory grey area being exploited.', depth: 'essential' },
  { category: 'compliance', id: 'cbam-effect', question: 'How does EU CBAM affect the opportunity?', answer: 'CBAM (Carbon Border Adjustment Mechanism) took full effect January 2026. EU importers must buy CBAM certificates for embedded emissions in imported goods. This increases demand for carbon compliance solutions and makes NIHA\'s offering more relevant — entities facing both EUA and CBAM obligations have larger carbon costs where 8-12% savings become material.', depth: 'essential' },
  { category: 'pricing', id: 'why-not-direct', question: 'Why wouldn\'t an EU entity just buy EUA directly?', answer: 'They can and most do. But they pay full market price (€81/t) with visible market impact. Via NIHA: same EUA at 8-12% discount, zero market impact (off-exchange, dark pool), instant T+0 settlement, and 24/7 availability. For a 500,000 tonne order, that\'s €4-5M in savings.', depth: 'essential' },
  { category: 'pricing', id: 'chinese-sell-own', question: 'Why don\'t Chinese entities sell on their own exchange?', answer: 'Via NIHA they get ¥103-106 equivalent per tonne vs ¥97-99 domestically (after slippage). That\'s 5-8% better, plus EUR proceeds provide hard currency diversification. China\'s carbon market has only 4 hours of daily trading and severe Q4 liquidity concentration.', depth: 'essential' },
  { category: 'pricing', id: 'settlement-terms', question: 'What are the settlement terms?', answer: 'NIHA settles T+0 — same-day execution and delivery. Compare this to T+2 on European exchanges. Trading is available 24/7, not limited to exchange hours (11h/day for EU ETS, 4h/day for China ETS). Minimum order size is flexible and negotiated bilaterally.', depth: 'essential' },
  // Advanced
  { category: 'compliance', id: 'hk-access-china', question: 'Can Hong Kong entities access China ETS directly?', answer: 'Not the national ETS — that remains closed to all non-mainland entities. However, HK entities can access pilot markets (particularly Shenzhen) through the Greater Bay Area framework. This requires: HK-incorporated entity, NRA-RMB bank account (routine for HK entities), Shenzhen exchange membership application, and compliance with pilot market regulations. NIHA has completed this setup — it took months and requires ongoing regulatory compliance. This is one of NIHA\'s key structural advantages.', depth: 'advanced' },
  { category: 'getting-started', id: 'competitive-moat', question: 'What is NIHA\'s competitive moat?', answer: 'Five layers: (1) Geographic — HK is the only jurisdiction with simultaneous GBA carbon access and European market infrastructure. (2) Regulatory — years of setup for NRA-RMB banking, Shenzhen exchange membership, EU registry access. (3) Relationship — bilateral trust with Chinese CEA holders cannot be replicated quickly. (4) Network — two-sided marketplace creates cold-start problem for competitors. (5) First-mover — established track record and operational expertise compound over time.', depth: 'advanced' },
  // Expert
  { category: 'compliance', id: 'carbon-connect-threat', question: 'Is GBA Carbon Connect a threat to NIHA?', answer: 'Carbon Connect is currently a pilot framework for cross-boundary carbon trading within the Greater Bay Area. It does NOT create direct EU-China access — it enables HK-Shenzhen linkages, which NIHA already uses. If Carbon Connect expanded to allow EU entities direct CEA access (highly unlikely in the medium term), NIHA would still retain advantages: bilateral relationship network, execution infrastructure, EUR/CNY settlement expertise, and established track record. The more likely scenario is that Carbon Connect strengthens NIHA\'s position by formalizing and legitimizing the cross-boundary carbon trading that NIHA already facilitates.', depth: 'expert' },
  { category: 'compliance', id: 'eu-hold-cea', question: 'Why can\'t an EU entity hold CEA directly?', answer: 'Multiple barriers: (1) No foreign access to China\'s national carbon registry system — accounts require Chinese business registration number. (2) Pilot market access requires NRA-RMB bank account — for EU entities, this takes 6-12 months and requires SAFE (State Administration of Foreign Exchange) approval with uncertain outcomes. (3) Even with a registry account, compliance with Chinese MRV (monitoring, reporting, verification) requirements adds ongoing operational burden. (4) No established precedent — no EU entity has successfully navigated this pathway. NIHA eliminates all of this: EU entities simply fund EUR and receive EUA.', depth: 'expert' },
  { category: 'pricing', id: 'detailed-path-examples', question: 'Can you show detailed numerical examples for each path?', answer: 'Path A (200K EUA steel plant): Direct cost €16.2M, via NIHA €14.58M, saving €1.62M/year. Path B (500K CEA power co): Domestic ¥49M, via NIHA ¥52M equivalent in EUR, benefit ¥3M + hard currency. Path C (50K EUA swap): Via exchanges ~4% total cost over 2-5 days, via NIHA ~1% cost same-day atomic swap. In all cases, the saving is structural (price gap between markets) not speculative (no directional bet). The 8-12% saving on Path A alone, applied to the ~€3B daily EU ETS volume, represents €240-360M of daily potential value creation.', depth: 'expert' },
];

// ─── Battle Cards / Resources ──────────────────────────────
export const BATTLE_CARDS = [
  { id: 'comparison', title: 'NIHA vs Direct EUA Purchase', type: 'Battle Card', typeColor: 'emerald' as const, audience: 'Client conversations', icon: Swords, description: 'Side-by-side comparison, key numbers, objection responses' },
  { id: 'cheat-sheet', title: 'Key Numbers Cheat Sheet', type: 'Quick Reference', typeColor: 'blue' as const, audience: 'Before meetings', icon: Hash, description: 'All critical metrics on one scannable page' },
  { id: 'objections', title: 'Objection Handling Guide', type: 'Battle Card', typeColor: 'emerald' as const, audience: 'Difficult questions', icon: MessageSquare, description: 'Top 10 objections with scripted responses' },
  { id: 'visual-guide', title: 'How It Works — Visual Guide', type: 'One-Pager', typeColor: 'amber' as const, audience: 'Email to prospects', icon: Route, description: '5-step flow + value propositions, client-ready' },
  { id: 'regulatory', title: 'Regulatory Summary', type: 'Reference', typeColor: 'blue' as const, audience: 'Compliance-focused buyers', icon: Scale, description: 'Legal framework, HK jurisdiction, CBAM context' },
  { id: 'timing', title: 'Market Timing Brief', type: 'Brief', typeColor: 'amber' as const, audience: 'Urgency-building', icon: Clock, description: '2026 catalysts, convergence data, window analysis' },
];
