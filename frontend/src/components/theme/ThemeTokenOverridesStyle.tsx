import { useThemeTokenStore } from '../../stores/useStore';
import { sanitizeCssVariables } from '../../utils/sanitize';

/**
 * Injects theme token overrides as CSS custom properties on :root.
 * Overrides are persisted in localStorage and applied app-wide.
 *
 * Security: CSS variable names and values are validated to prevent
 * CSS injection attacks (e.g., url(), expression(), javascript:).
 */
export function ThemeTokenOverridesStyle() {
  const overrides = useThemeTokenStore((state) => state.overrides);
  const entries = Object.entries(overrides) as [string, string][];

  // Sanitize entries to prevent CSS injection
  const safeEntries = sanitizeCssVariables(entries);

  if (safeEntries.length === 0) return null;

  const css = `:root { ${safeEntries.map(([k, v]) => `${k}: ${v};`).join(' ')} }`;
  return <style id="theme-token-overrides" dangerouslySetInnerHTML={{ __html: css }} />;
}
