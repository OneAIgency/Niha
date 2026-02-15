import {
  Home, ArrowRightLeft, TrendingUp, Shield, Scale,
  Calculator, FileText, HelpCircle,
  Target, Globe, CheckCircle,
  Swords, Hash, MessageSquare, Route, Clock,
} from 'lucide-react';

// ─── Section IDs ───────────────────────────────────────────
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
  { value: '€800B+', label: 'Global Carbon Market 2024', color: 'emerald' as const },
  { value: '7–10×', label: 'EUA / CEA Price Gap', color: 'amber' as const },
  { value: '8–12%', label: 'Cost Savings via NIHA', color: 'emerald' as const },
  { value: 'T+0', label: 'Settlement Speed', color: 'blue' as const },
];

// ─── How It Works Steps ────────────────────────────────────
export const HOW_IT_WORKS_STEPS = [
  { icon: Target, title: 'Client Identifies Need', subtitle: 'EU entity requires EUA for compliance' },
  { icon: Globe, title: 'NIHA Sources CEA', subtitle: 'Bilateral acquisition from Chinese market' },
  { icon: ArrowRightLeft, title: 'CEA → EUA Swap', subtitle: 'Cross-border exchange at favorable ratio' },
  { icon: CheckCircle, title: 'EUA Delivered', subtitle: 'Client receives EUA at 8–12% discount' },
  { icon: Shield, title: 'Compliance Complete', subtitle: 'Full documentation provided' },
];

// ─── Comparison Table ──────────────────────────────────────
export const COMPARISON_ROWS = [
  { feature: 'Cost per tonne', direct: '€81 market price', niha: '€71–74 (8–12% savings)', nihaWins: true },
  { feature: 'CEA access required', direct: 'No (EUA only)', niha: 'No — NIHA handles everything', nihaWins: true },
  { feature: 'Market impact', direct: 'Visible on orderbook', niha: 'Zero — dark pool, off-exchange', nihaWins: true },
  { feature: 'Settlement', direct: 'T+2', niha: 'T+0 instant', nihaWins: true },
  { feature: 'Block execution', direct: 'Hours, with slippage', niha: 'Instant, at known price', nihaWins: true },
  { feature: 'Trading hours', direct: '11h/day (exchange)', niha: '24/7 continuous', nihaWins: true },
  { feature: 'Complexity', direct: 'EU registry + clearing', niha: 'Fund EUR, receive EUA', nihaWins: true },
];

// ─── Value Propositions ────────────────────────────────────
export const VALUE_PROPOSITIONS = [
  { title: '8–12% Cost Savings', description: 'Via CEA→EUA swap arbitrage between disconnected carbon markets', color: 'emerald' as const },
  { title: 'Exclusive Access', description: 'Only bridge between EU ETS and China ETS via Hong Kong', color: 'amber' as const },
  { title: 'Zero Market Impact', description: 'Dark pool, off-exchange execution — fully confidential', color: 'blue' as const },
  { title: 'Instant Settlement', description: 'T+0 vs T+2, available 24/7 — no exchange delays', color: 'emerald' as const },
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
  { id: 'structure', title: 'Market Structure & Participants', content: 'The EU ETS covers approximately 10,000 installations across power generation, heavy industry, and aviation. The market operates in phases, with Phase 4 (2021-2030) introducing linear reduction factors that decrease the overall cap by 4.3% annually. Key participants include compliance entities, financial intermediaries, and over-the-counter (OTC) brokers who facilitate ~36% of total volume.' },
  { id: 'supply-2026', title: '2026 Supply Changes', content: 'Free allocation drops by 8% in 2026 as part of the "Fit for 55" package. Combined with CBAM taking full effect, this creates significant upward price pressure. Entities that previously received free allowances must now purchase them on the open market, increasing total demand while supply tightens.' },
  { id: 'trading-venues', title: 'Trading Venues & Access', content: 'Primary exchanges: ICE Endex (Netherlands) and EEX (Germany). OTC market handles 36% of volume. Access requires EU registry account, clearing membership, and compliance with MiFID II. Standard lot: 1,000 tonnes. Settlement: T+2 business days via clearing houses.' },
  { id: 'alternatives', title: 'Why EU Entities Need Alternatives', content: 'With EUA prices at €81/tonne and free allocations declining, compliance costs are accelerating. A mid-size industrial installation requiring 100,000 tonnes faces €8.1M in annual compliance costs. Even a 10% reduction via NIHA translates to €810,000 in savings — material enough to justify exploring alternative sourcing.' },
];

export const CHINA_ETS_ACCORDIONS = [
  { id: 'structure', title: 'Market Structure & Coverage', content: 'China\'s national ETS launched in 2021 covering the power sector. In 2024-2025, coverage expanded to include steel, cement, and aluminium — adding over 1,300 entities and bringing the total to 3,500+. The market uses China Emission Allowances (CEA) traded on designated exchanges in Shanghai, Hubei, and pilot markets including Shenzhen.' },
  { id: 'liquidity', title: 'Liquidity Challenge', content: '79% of annual trading volume concentrates in Q4 as compliance entities rush to meet year-end deadlines. This creates severe seasonal distortion: prices and liquidity spike in October-December, while January-September sees thin trading with wide spreads (1-2% vs 2-5 bps in EU ETS). Daily volume averages only €9.5M vs €3B+ in EU ETS — a 316× difference.' },
  { id: 'access', title: 'Access Restrictions', content: 'Only onshore compliance entities can directly participate in China\'s national ETS. Foreign entities face prohibitive barriers: no registry account access, no NRA-RMB banking relationships, and no exchange membership pathway. Even pilot markets (Shenzhen, Shanghai) that theoretically allow foreign participation require months of setup with uncertain outcomes.' },
  { id: 'expansion', title: '2024-2025 Expansion', content: 'The addition of steel, cement, and aluminium sectors in 2024-2025 has dramatically expanded the market. New compliance entities are entering an unfamiliar trading environment, creating opportunities for intermediaries who can offer better execution than the thin domestic market. Many new entrants are looking for EUR-denominated exits — exactly what NIHA provides.' },
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
  },
  {
    id: 'path-b',
    title: 'Chinese Entity Selling Surplus CEA',
    label: 'Path B',
    color: 'amber' as const,
    keyPoint: '5-8% better price than domestic exchange + EUR proceeds',
    steps: ['CN Entity sells CEA to NIHA', 'NIHA pays in EUR (hard currency)', 'Entity receives ¥103-106 equivalent', 'Hard currency diversification achieved'],
    comparison: { via: 'Domestic: ¥97-99/t after slippage, CNY only', niha: 'NIHA: ¥103-106 equivalent, EUR proceeds' },
  },
  {
    id: 'path-c',
    title: 'Non-EU Entity Swapping EUA → CEA',
    label: 'Path C',
    color: 'blue' as const,
    keyPoint: 'Single atomic transaction — no FX conversion needed',
    steps: ['Entity deposits EUA', 'NIHA swap engine executes', 'Entity receives CEA', 'No double exchange fees'],
    comparison: { via: 'Via exchanges: sell EUA + buy CEA, double fees, days', niha: 'NIHA: single atomic swap, instant' },
  },
];

// ─── Legal Framework ───────────────────────────────────────
export const LEGAL_ACCORDIONS = [
  { id: 'eu-cant-buy', title: 'Why EU Entities Cannot Acquire CEA', content: 'China\'s national ETS is closed to foreign participants by State Council regulation. Pilot markets require: NRA-RMB bank account (months of setup), SAFE foreign exchange approval, exchange membership application, and ongoing compliance reporting — all with no established precedent for EU entities. The regulatory path is theoretically possible but practically prohibitive.' },
  { id: 'hk-jurisdiction', title: 'Why Hong Kong Is the Only Jurisdiction', content: 'Hong Kong uniquely combines: (1) Greater Bay Area zone providing access to Shenzhen pilot carbon market, (2) NRA-RMB banking that is routine for HK entities but months-long for EU entities, (3) Standard European market infrastructure for EU ETS access, (4) Core Climate Exchange adding local marketplace optionality. Singapore lacks GBA access. Dubai and London face the same Chinese market barriers as EU entities.' },
  { id: 'transaction-architecture', title: 'Transaction Architecture', content: 'Five-step custody flow: (1) Client funds EUR to NIHA escrow, (2) NIHA acquires CEA from Chinese counterparty via pilot market, (3) CEA held in NIHA custody account (required — registry accounts cannot be opened by non-Chinese entities), (4) NIHA executes CEA→EUA swap as principal, (5) EUA delivered to client\'s EU registry account. Each step has legal justification rooted in regulatory requirements.' },
  { id: 'regulatory-sources', title: 'Key Regulatory Sources', content: 'EU ETS Directive 2003/87/EC (consolidated), China\'s National ETS Management Measures (MEE Decree No. 19), Shenzhen Pilot Market Regulations, Hong Kong Securities and Futures Ordinance, Greater Bay Area Financial Cooperation Framework, EU CBAM Regulation 2023/956.' },
];

// ─── Timing & Convergence ──────────────────────────────────
export const TIMING_CATALYSTS = [
  { title: 'EU CBAM Takes Effect', year: '2026', description: 'Importers must buy CBAM certificates for embedded emissions — increases EUA demand' },
  { title: 'EUA Supply Drops 8%', year: '2026', description: 'Free allocation reduction under "Fit for 55" — tightens supply significantly' },
  { title: 'China ETS Expanded', year: '2024-25', description: 'Steel, cement, aluminium added — 3,500+ entities, more CEA sellers' },
  { title: 'Arbitrage Window Closing', year: '2026-30', description: 'As China\'s carbon price rises, the 7-10× gap will compress to 5×' },
];

export const CONVERGENCE_TABLE = [
  { year: '2024', eua: '€67', cea: '~€12', ratio: '5.6×', opportunity: 'Building' },
  { year: '2025', eua: '€74', cea: '~€10', ratio: '7.4×', opportunity: 'Growing' },
  { year: '2026', eua: '€81', cea: '~€11', ratio: '7-10×', opportunity: '★ Peak Window' },
  { year: '2027', eua: '~€90', cea: '~€14', ratio: '~6.4×', opportunity: 'Narrowing' },
  { year: '2028', eua: '~€100', cea: '~€17', ratio: '~6×', opportunity: 'Compressing' },
  { year: '2030', eua: '~€126', cea: '~€25', ratio: '~5×', opportunity: 'Reduced' },
];

export const RISK_MITIGATIONS = [
  { risk: 'Regulatory Risk', description: 'China tightens cross-border carbon trading', mitigation: 'NIHA\'s HK structure uses established, legal pathways — no grey-area exploitation' },
  { risk: 'Counterparty Risk', description: 'NIHA as principal in OTC trades', mitigation: 'Escrow structures, staged settlement, institutional-grade custody' },
  { risk: 'FX Risk (EUR/CNY)', description: 'Currency volatility during settlement', mitigation: 'T+0 settlement minimizes exposure window; hedging available' },
  { risk: 'Price Convergence', description: 'CEA price rises, gap narrows', mitigation: 'Early movers capture widest gap; NIHA\'s fee model adapts to narrower spreads' },
];

// ─── FAQ ───────────────────────────────────────────────────
export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'mechanism', label: 'The Exchange Mechanism' },
  { id: 'compliance', label: 'Compliance & Regulation' },
  { id: 'pricing', label: 'Pricing & Settlement' },
] as const;

export const FAQ_ITEMS: { category: string; id: string; question: string; answer: string }[] = [
  { category: 'getting-started', id: 'business-model', question: 'What is NIHA\'s core business model?', answer: 'NIHA operates the only cross-border bridge between the EU ETS and China ETS. We source CEA (China Emission Allowances) bilaterally from Chinese counterparties, execute a CEA→EUA swap, and deliver EUA to EU entities at an 8-12% discount versus direct market purchase. Our unique position in Hong Kong gives us simultaneous access to both markets — something no other entity can replicate.' },
  { category: 'getting-started', id: 'target-clients', question: 'Who are NIHA\'s target clients?', answer: 'Primary: EU entities with EUA compliance obligations (power generators, industrial installations, aviation operators). Secondary: Chinese entities with surplus CEA seeking EUR-denominated exits at better prices than domestic exchanges. Tertiary: Non-EU entities seeking CEA→EUA or EUA→CEA swaps for portfolio management.' },
  { category: 'mechanism', id: 'swap-works', question: 'How does the CEA→EUA swap work?', answer: 'The client deposits EUR into NIHA\'s escrow account. NIHA bilaterally acquires CEA from Chinese counterparties via pilot market access. CEA is held in NIHA\'s custody account (required by regulation). NIHA then executes the swap as principal, converting CEA exposure into EUA. The EUA is delivered to the client\'s EU registry account. The entire process settles T+0.' },
  { category: 'mechanism', id: 'custody-requirement', question: 'Why must NIHA hold CEA in custody?', answer: 'CEA registry accounts cannot be opened by non-Chinese entities. The swap mechanism requires NIHA (as a GBA-based entity with Chinese market access) to take beneficial ownership of CEA, execute the cross-border swap as principal, and then deliver EUA. NIHA cannot act as mere agent — regulatory requirements mandate it be the counterparty.' },
  { category: 'mechanism', id: 'replication-barrier', question: 'What prevents someone from replicating NIHA\'s model?', answer: 'Five barriers: (1) Bilateral relationships with Chinese CEA holders — years to build, trust-based. (2) Cross-border regulatory expertise across EU and Chinese carbon law. (3) Swap execution infrastructure. (4) Network effects — sellers attract buyers and vice versa, creating a cold-start problem. (5) First-mover advantage with established operational track record.' },
  { category: 'compliance', id: 'eu-cant-buy-cea', question: 'Why can\'t EU entities buy CEA directly?', answer: 'China\'s national ETS is closed to foreign participants by State Council regulation. Pilot markets require: NRA-RMB bank account (months of setup), SAFE FX approval, exchange membership, and ongoing compliance reporting — all with no precedent for EU entities. The path is theoretically possible but practically prohibitive.' },
  { category: 'compliance', id: 'legal-sound', question: 'Is this structure legally sound?', answer: 'Yes. NIHA uses established, regulated pathways in each jurisdiction. The arbitrage exists because EU and China carbon markets are structurally disconnected — different registries, regulations, currencies, and access requirements. NIHA bridges this structural gap through Hong Kong\'s unique GBA position. There is no regulatory grey area being exploited.' },
  { category: 'compliance', id: 'cbam-effect', question: 'How does EU CBAM affect the opportunity?', answer: 'CBAM (Carbon Border Adjustment Mechanism) took full effect January 2026. EU importers must buy CBAM certificates for embedded emissions in imported goods. This increases demand for carbon compliance solutions and makes NIHA\'s offering more relevant — entities facing both EUA and CBAM obligations have larger carbon costs where 8-12% savings become material.' },
  { category: 'pricing', id: 'why-not-direct', question: 'Why wouldn\'t an EU entity just buy EUA directly?', answer: 'They can and most do. But they pay full market price (€81/t) with visible market impact. Via NIHA: same EUA at 8-12% discount, zero market impact (off-exchange, dark pool), instant T+0 settlement, and 24/7 availability. For a 500,000 tonne order, that\'s €4-5M in savings.' },
  { category: 'pricing', id: 'chinese-sell-own', question: 'Why don\'t Chinese entities sell on their own exchange?', answer: 'Via NIHA they get ¥103-106 equivalent per tonne vs ¥97-99 domestically (after slippage). That\'s 5-8% better, plus EUR proceeds provide hard currency diversification. China\'s carbon market has only 4 hours of daily trading and severe Q4 liquidity concentration.' },
  { category: 'pricing', id: 'settlement-terms', question: 'What are the settlement terms?', answer: 'NIHA settles T+0 — same-day execution and delivery. Compare this to T+2 on European exchanges. Trading is available 24/7, not limited to exchange hours (11h/day for EU ETS, 4h/day for China ETS). Minimum order size is flexible and negotiated bilaterally.' },
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
