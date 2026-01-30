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
  card_back: {
    label: '.card_back',
    params: [
      { key: '--color-card-back-bg', label: 'Background', type: 'color' },
      { key: '--color-card-back-border', label: 'Border', type: 'color' },
      { key: '--radius-card-back', label: 'Border radius', type: 'length' },
    ],
  },
};
