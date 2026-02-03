/**
 * Registry of theme token keys (CSS variable names).
 * Single source for override UI and tooling. Values live in design-tokens.css.
 * See src/theme/README.md for the full theme hub.
 */

/** CSS variable names that can be overridden from Theme → Containers */
export const EDITABLE_TOKEN_KEYS = [
  '--page-bg-bg',
  '--page-container-dark-bg',
  '--content-wrapper-bg',
  '--content-wrapper-border',
  '--content-wrapper-radius',
  '--content-wrapper-padding',
  '--color-card-back-bg',
  '--color-card-back-border',
  '--radius-card-back',
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
