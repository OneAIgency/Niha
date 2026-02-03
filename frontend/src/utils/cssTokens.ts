/**
 * Utility functions for working with CSS custom properties (design tokens)
 */

/**
 * Get the current computed value of a CSS custom property.
 * Reads from :root element.
 *
 * @param varName - CSS variable name (e.g., '--color-primary')
 * @returns Current computed value, trimmed
 */
export function getCurrentTokenValue(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Check if a value looks like a CSS color.
 * Supports: hex (#fff, #ffffff), rgb, rgba, hsl, hsla, named colors.
 *
 * @param value - CSS value to check
 * @returns true if value appears to be a color
 */
export function isColorValue(value: string): boolean {
  const colorPatterns = [
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, // hex
    /^rgba?\s*\(/i, // rgb/rgba
    /^hsla?\s*\(/i, // hsl/hsla
    /^(transparent|currentColor)$/i,
  ];

  return colorPatterns.some((pattern) => pattern.test(value.trim()));
}

/**
 * Convert a CSS color to hex format for color picker input.
 * Color pickers require #rrggbb format.
 *
 * @param value - CSS color value
 * @returns Hex color string or original value if conversion fails
 */
export function colorToHex(value: string): string {
  const trimmed = value.trim();

  // Already hex
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed;
  }

  // Short hex to full hex
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // Use canvas to convert other formats
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = trimmed;
      const computed = ctx.fillStyle;
      // fillStyle normalizes to hex or rgb
      if (computed.startsWith('#')) {
        return computed;
      }
      // Convert rgb to hex
      const rgbMatch = computed.match(
        /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/
      );
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
  }

  return trimmed;
}

/**
 * Parse rgba() to hex with alpha awareness.
 * Returns hex and alpha separately for UI display.
 *
 * @param value - CSS color value that might be rgba
 * @returns Object with hex color and alpha (0-1)
 */
export function parseColorWithAlpha(value: string): { hex: string; alpha: number } {
  const trimmed = value.trim();

  // Check for rgba
  const rgbaMatch = trimmed.match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i
  );

  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    return { hex: `#${r}${g}${b}`, alpha };
  }

  return { hex: colorToHex(trimmed), alpha: 1 };
}
