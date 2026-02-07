/**
 * Registry of theme token keys (CSS variable names).
 * Single source for override UI and tooling. Values live in design-tokens.css.
 * See src/theme/README.md for the full theme hub.
 */

/** CSS variable names that can be overridden from Theme UI */
export const EDITABLE_TOKEN_KEYS = [
  // Container tokens
  '--page-bg-bg',
  '--page-container-dark-bg',
  '--content-wrapper-bg',
  '--content-wrapper-border',
  '--content-wrapper-radius',
  '--content-wrapper-padding',
  '--color-card-back-bg',
  '--color-card-back-border',
  '--radius-card-back',
  // Input element tokens
  '--input-bg',
  '--input-border',
  '--input-border-width',
  '--input-text',
  '--input-placeholder',
  '--input-radius',
  '--input-padding-x',
  '--input-padding-y',
  '--input-font-size',
  '--input-focus-ring',
  '--input-focus-ring-width',
  '--input-label-size',
  '--input-label-weight',
  '--input-label-color',
  '--input-error-border',
  '--input-error-ring',
  '--input-error-label-color',
  '--input-error-text-color',
  '--input-error-text-size',
  '--select-bg',
  '--select-border',
  '--select-text',
  '--select-radius',
  '--select-padding-x',
  '--select-padding-y',
  '--select-padding-right',
  '--select-font-size',
  '--select-focus-ring',
  '--select-icon-color',
  '--input-search-icon-color',
  '--input-search-icon-size',
  '--input-search-padding-left',
] as const;

export type EditableTokenKey = (typeof EDITABLE_TOKEN_KEYS)[number];

/** Token type for editor */
export type TokenType = 'color' | 'size';

/** Token configuration for editor UI */
export interface TokenConfig {
  key: string;
  label: string;
  type: TokenType;
}

/** Token category with label and tokens */
export interface TokenCategory {
  label: string;
  tokens: TokenConfig[];
}

/**
 * Design token categories for the interactive editor.
 * Organized by: colors, typography, spacing, radius, shadows.
 */
export const DESIGN_TOKEN_CATEGORIES: Record<string, TokenCategory> = {
  colors: {
    label: 'Colors',
    tokens: [
      // Brand & Primary
      { key: '--color-primary', label: 'Primary', type: 'color' },
      { key: '--color-primary-hover', label: 'Primary Hover', type: 'color' },
      { key: '--color-primary-active', label: 'Primary Active', type: 'color' },
      // Background
      { key: '--color-background', label: 'Background', type: 'color' },
      { key: '--color-surface', label: 'Surface', type: 'color' },
      { key: '--color-surface-elevated', label: 'Surface Elevated', type: 'color' },
      // Text
      { key: '--color-text-primary', label: 'Text Primary', type: 'color' },
      { key: '--color-text-secondary', label: 'Text Secondary', type: 'color' },
      { key: '--color-text-muted', label: 'Text Muted', type: 'color' },
      // Border
      { key: '--color-border', label: 'Border', type: 'color' },
      { key: '--color-border-strong', label: 'Border Strong', type: 'color' },
      // Certificates
      { key: '--color-eua', label: 'EUA Blue', type: 'color' },
      { key: '--color-cea', label: 'CEA Amber', type: 'color' },
      // Status
      { key: '--color-success', label: 'Success', type: 'color' },
      { key: '--color-warning', label: 'Warning', type: 'color' },
      { key: '--color-error', label: 'Error', type: 'color' },
      { key: '--color-info', label: 'Info', type: 'color' },
      // Trading
      { key: '--color-bid', label: 'Bid (Buy)', type: 'color' },
      { key: '--color-ask', label: 'Ask (Sell)', type: 'color' },
    ],
  },
  typography: {
    label: 'Typography',
    tokens: [
      { key: '--text-xs', label: 'XS (12px)', type: 'size' },
      { key: '--text-sm', label: 'SM (14px)', type: 'size' },
      { key: '--text-base', label: 'Base (16px)', type: 'size' },
      { key: '--text-lg', label: 'LG (18px)', type: 'size' },
      { key: '--text-xl', label: 'XL (20px)', type: 'size' },
      { key: '--text-2xl', label: '2XL (24px)', type: 'size' },
      { key: '--text-3xl', label: '3XL (30px)', type: 'size' },
    ],
  },
  spacing: {
    label: 'Spacing',
    tokens: [
      { key: '--space-1', label: '1 (4px)', type: 'size' },
      { key: '--space-2', label: '2 (8px)', type: 'size' },
      { key: '--space-3', label: '3 (12px)', type: 'size' },
      { key: '--space-4', label: '4 (16px)', type: 'size' },
      { key: '--space-6', label: '6 (24px)', type: 'size' },
      { key: '--space-8', label: '8 (32px)', type: 'size' },
      { key: '--space-12', label: '12 (48px)', type: 'size' },
    ],
  },
  radius: {
    label: 'Border Radius',
    tokens: [
      { key: '--radius-sm', label: 'SM (6px)', type: 'size' },
      { key: '--radius-md', label: 'MD (8px)', type: 'size' },
      { key: '--radius-lg', label: 'LG (12px)', type: 'size' },
      { key: '--radius-xl', label: 'XL (16px)', type: 'size' },
      { key: '--radius-2xl', label: '2XL (24px)', type: 'size' },
    ],
  },
  containers: {
    label: 'Containers',
    tokens: [
      { key: '--page-bg-bg', label: 'Page Background', type: 'color' },
      { key: '--page-container-dark-bg', label: 'Page Container Dark', type: 'color' },
      { key: '--content-wrapper-bg', label: 'Content Wrapper BG', type: 'color' },
      { key: '--content-wrapper-border', label: 'Content Wrapper Border', type: 'color' },
      { key: '--content-wrapper-radius', label: 'Content Wrapper Radius', type: 'size' },
      { key: '--content-wrapper-padding', label: 'Content Wrapper Padding', type: 'size' },
      { key: '--color-card-back-bg', label: 'Card Back BG', type: 'color' },
      { key: '--color-card-back-border', label: 'Card Back Border', type: 'color' },
      { key: '--radius-card-back', label: 'Card Back Radius', type: 'size' },
    ],
  },
};

/**
 * Input element detail configs for Theme → Inputs interactive editor.
 * Each element has: label, description, CSS variable tokens, usage info.
 */
export interface InputElementUsage {
  page: string;
  path: string;
  component?: string;
}

export interface InputElementConfig {
  id: string;
  label: string;
  description: string;
  tokens: TokenConfig[];
  /** Pages where this element is currently used */
  usedIn: InputElementUsage[];
  /** Pages where this element could be used (suggestions) */
  suggestedFor: InputElementUsage[];
}

export const INPUT_ELEMENT_CONFIGS: InputElementConfig[] = [
  {
    id: 'default-input',
    label: 'Default Text Input',
    description: 'Standard text input with rounded border, used for general form fields.',
    tokens: [
      { key: '--input-bg', label: 'Background', type: 'color' },
      { key: '--input-border', label: 'Border Color', type: 'color' },
      { key: '--input-border-width', label: 'Border Width', type: 'size' },
      { key: '--input-text', label: 'Text Color', type: 'color' },
      { key: '--input-placeholder', label: 'Placeholder Color', type: 'color' },
      { key: '--input-radius', label: 'Border Radius', type: 'size' },
      { key: '--input-padding-x', label: 'Horizontal Padding', type: 'size' },
      { key: '--input-padding-y', label: 'Vertical Padding', type: 'size' },
      { key: '--input-font-size', label: 'Font Size', type: 'size' },
      { key: '--input-focus-ring', label: 'Focus Ring Color', type: 'color' },
      { key: '--input-focus-ring-width', label: 'Focus Ring Width', type: 'size' },
      { key: '--input-label-size', label: 'Label Font Size', type: 'size' },
      { key: '--input-label-weight', label: 'Label Font Weight', type: 'size' },
      { key: '--input-label-color', label: 'Label Color', type: 'color' },
    ],
    usedIn: [
      { page: 'Settings', path: '/settings', component: 'SettingsPage' },
      { page: 'Profile', path: '/profile', component: 'ProfilePage' },
      { page: 'Funding', path: '/funding', component: 'FundingPage' },
      { page: 'Create User (Modal)', path: '/backoffice/users', component: 'CreateUserModal' },
      { page: 'Edit User (Modal)', path: '/backoffice/users', component: 'EditUserModal' },
      { page: 'Create Market Maker (Modal)', path: '/backoffice/users', component: 'CreateMarketMakerModal' },
      { page: 'Search Tickets', path: '/backoffice/tickets', component: 'SearchTicketsTab' },
      { page: 'Place Order', path: '/backoffice/market', component: 'PlaceOrder' },
    ],
    suggestedFor: [
      { page: 'Fee Settings', path: '/backoffice/fees', component: 'FeeSettingsPage' },
      { page: 'Dashboard (search/filter)', path: '/dashboard', component: 'DashboardPage' },
    ],
  },
  {
    id: 'search-input',
    label: 'Search Input (with Icon)',
    description: 'Input with a left-aligned search icon, used for search/filter fields.',
    tokens: [
      { key: '--input-bg', label: 'Background', type: 'color' },
      { key: '--input-border', label: 'Border Color', type: 'color' },
      { key: '--input-border-width', label: 'Border Width', type: 'size' },
      { key: '--input-text', label: 'Text Color', type: 'color' },
      { key: '--input-placeholder', label: 'Placeholder Color', type: 'color' },
      { key: '--input-radius', label: 'Border Radius', type: 'size' },
      { key: '--input-padding-y', label: 'Vertical Padding', type: 'size' },
      { key: '--input-font-size', label: 'Font Size', type: 'size' },
      { key: '--input-focus-ring', label: 'Focus Ring Color', type: 'color' },
      { key: '--input-focus-ring-width', label: 'Focus Ring Width', type: 'size' },
      { key: '--input-search-icon-color', label: 'Icon Color', type: 'color' },
      { key: '--input-search-icon-size', label: 'Icon Size', type: 'size' },
      { key: '--input-search-padding-left', label: 'Left Padding (icon space)', type: 'size' },
    ],
    usedIn: [
      { page: 'Search Tickets', path: '/backoffice/tickets', component: 'SearchTicketsTab' },
      { page: 'Users Management', path: '/backoffice/users', component: 'UsersPage' },
    ],
    suggestedFor: [
      { page: 'All Tickets', path: '/backoffice/tickets', component: 'AllTicketsTab' },
      { page: 'Market Maker Orders', path: '/backoffice/market-makers', component: 'MarketMakerOrdersList' },
      { page: 'Cash Market', path: '/cash-market', component: 'CashMarketProPage' },
      { page: 'Swap Market', path: '/swap-market', component: 'CeaSwapMarketPage' },
    ],
  },
  {
    id: 'error-input',
    label: 'Error State Input',
    description: 'Input in error state with red border, focus ring, and error message below.',
    tokens: [
      { key: '--input-bg', label: 'Background', type: 'color' },
      { key: '--input-error-border', label: 'Error Border Color', type: 'color' },
      { key: '--input-border-width', label: 'Border Width', type: 'size' },
      { key: '--input-text', label: 'Text Color', type: 'color' },
      { key: '--input-radius', label: 'Border Radius', type: 'size' },
      { key: '--input-padding-x', label: 'Horizontal Padding', type: 'size' },
      { key: '--input-padding-y', label: 'Vertical Padding', type: 'size' },
      { key: '--input-error-ring', label: 'Error Focus Ring', type: 'color' },
      { key: '--input-error-label-color', label: 'Error Label Color', type: 'color' },
      { key: '--input-error-text-color', label: 'Error Text Color', type: 'color' },
      { key: '--input-error-text-size', label: 'Error Text Size', type: 'size' },
    ],
    usedIn: [
      { page: 'Settings', path: '/settings', component: 'SettingsPage' },
      { page: 'Profile', path: '/profile', component: 'ProfilePage' },
      { page: 'Confirmation Modal', path: '(global)', component: 'ConfirmationModal' },
      { page: 'Create User (Modal)', path: '/backoffice/users', component: 'CreateUserModal' },
    ],
    suggestedFor: [
      { page: 'Place Order', path: '/backoffice/market', component: 'PlaceOrder' },
      { page: 'Funding (deposit form)', path: '/funding', component: 'FundingPage' },
      { page: 'MM Order Placement', path: '/backoffice/market-makers', component: 'MMOrderPlacementModal' },
    ],
  },
  {
    id: 'select-dropdown',
    label: 'Select Dropdown',
    description: 'Native select with custom styling and dropdown chevron icon.',
    tokens: [
      { key: '--select-bg', label: 'Background', type: 'color' },
      { key: '--select-border', label: 'Border Color', type: 'color' },
      { key: '--select-text', label: 'Text Color', type: 'color' },
      { key: '--select-radius', label: 'Border Radius', type: 'size' },
      { key: '--select-padding-x', label: 'Horizontal Padding', type: 'size' },
      { key: '--select-padding-y', label: 'Vertical Padding', type: 'size' },
      { key: '--select-padding-right', label: 'Right Padding (arrow space)', type: 'size' },
      { key: '--select-font-size', label: 'Font Size', type: 'size' },
      { key: '--select-focus-ring', label: 'Focus Ring Color', type: 'color' },
      { key: '--select-icon-color', label: 'Chevron Icon Color', type: 'color' },
    ],
    usedIn: [
      { page: 'Settings', path: '/settings', component: 'SettingsPage' },
      { page: 'Profile', path: '/profile', component: 'ProfilePage' },
      { page: 'Users Management', path: '/backoffice/users', component: 'UsersPage' },
      { page: 'Fee Settings', path: '/backoffice/fees', component: 'FeeSettingsPage' },
      { page: 'AML Deposits', path: '/backoffice/aml', component: 'AMLDepositsTab' },
      { page: 'Pending Deposits', path: '/backoffice/deposits', component: 'PendingDepositsTab' },
      { page: 'Market Maker Auto Trade', path: '/backoffice/market-makers', component: 'MarketMakerAutoTradeTab' },
      { page: 'Market Maker Orders', path: '/backoffice/market-makers', component: 'MarketMakerOrdersList' },
      { page: 'All Tickets', path: '/backoffice/tickets', component: 'AllTicketsTab' },
      { page: 'Search Tickets', path: '/backoffice/tickets', component: 'SearchTicketsTab' },
      { page: 'Create Market Maker', path: '/backoffice/users', component: 'CreateMarketMakerModal' },
      { page: 'Funding', path: '/funding', component: 'FundingPage' },
      { page: 'Place Order', path: '/backoffice/market', component: 'PlaceOrder' },
      { page: 'MM Order Placement', path: '/backoffice/market-makers', component: 'MMOrderPlacementModal' },
      { page: 'Place Market Order', path: '/backoffice/market', component: 'PlaceMarketOrderSection' },
    ],
    suggestedFor: [
      { page: 'Dashboard (timeframe filter)', path: '/dashboard', component: 'DashboardPage' },
      { page: 'Cash Market (order type)', path: '/cash-market', component: 'CashMarketProPage' },
    ],
  },
];

/** Element config for Theme Containers page: element id -> label + CSS params */
export interface ThemeElementParam {
  key: string;
  label: string;
  type: 'color' | 'length';
}

export interface ThemeElementConfig {
  label: string;
  params: ThemeElementParam[];
}

export const THEME_ELEMENT_CONFIG: Record<string, ThemeElementConfig> = {
  page_bg: {
    label: '.page-bg',
    params: [{ key: '--page-bg-bg', label: 'Background', type: 'color' }],
  },
  page_container_dark: {
    label: '.page-container-dark',
    params: [{ key: '--page-container-dark-bg', label: 'Background', type: 'color' }],
  },
  content_wrapper: {
    label: '.content_wrapper',
    params: [
      { key: '--content-wrapper-bg', label: 'Background', type: 'color' },
      { key: '--content-wrapper-border', label: 'Border', type: 'color' },
      { key: '--content-wrapper-radius', label: 'Border radius', type: 'length' },
      { key: '--content-wrapper-padding', label: 'Padding', type: 'length' },
    ],
  },
  content_wrapper_last: {
    label: '.content_wrapper_last',
    params: [
      { key: '--color-card-back-bg', label: 'Background', type: 'color' },
      { key: '--color-card-back-border', label: 'Border', type: 'color' },
      { key: '--radius-card-back', label: 'Border radius', type: 'length' },
    ],
  },
};
