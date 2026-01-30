import { useThemeTokenStore } from '../../stores/useStore';

/**
 * Injects theme token overrides as CSS custom properties on :root.
 * Overrides are persisted in localStorage and applied app-wide.
 */
export function ThemeTokenOverridesStyle() {
  const overrides = useThemeTokenStore((state) => state.overrides);
  const entries = Object.entries(overrides);
  if (entries.length === 0) return null;
  const css = `:root { ${entries.map(([k, v]) => `${k}: ${v};`).join(' ')} }`;
  return <style id="theme-token-overrides" dangerouslySetInnerHTML={{ __html: css }} />;
}
