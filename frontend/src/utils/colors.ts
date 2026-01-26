/**
 * Color utility functions
 * Maps hex colors to Tailwind classes for consistent design system usage
 */

/**
 * Maps hex color codes to Tailwind CSS classes
 */
export function getColorClass(hexColor: string, variant: 'bg' | 'text' | 'border' = 'bg'): string {
  const colorMap: Record<string, string> = {
    '#10b981': 'emerald-500',
    '#059669': 'emerald-600',
    '#047857': 'emerald-700',
    '#064e3b': 'emerald-900',
    '#1e293b': 'navy-800',
    '#334155': 'navy-700',
    '#475569': 'navy-600',
    '#64748b': 'navy-500',
    '#94a3b8': 'navy-400',
    '#cbd5e1': 'navy-200',
    '#f8fafc': 'navy-50',
    '#0f172a': 'navy-900',
    '#ef4444': 'red-500',
    '#dc2626': 'red-600',
    '#3b82f6': 'blue-500',
    '#60a5fa': 'blue-400',
    '#1e40af': 'blue-700',
    '#8b5cf6': 'violet-500',
    '#f59e0b': 'amber-500',
    '#fbbf24': 'amber-400',
    '#ffffff': 'white',
    '#000000': 'slate-900',
  };

  const normalizedHex = hexColor.toLowerCase();
  const colorName = colorMap[normalizedHex];

  if (!colorName) {
    // Fallback for unknown colors
    return `${variant}-slate-500`;
  }

  return `${variant}-${colorName}`;
}

/**
 * Converts rgba color with opacity to Tailwind opacity class
 */
export function getRgbaClass(baseColor: string, opacity: number): string {
  const opacityMap: Record<number, string> = {
    0.06: '/6',
    0.08: '/8',
    0.1: '/10',
    0.15: '/15',
    0.2: '/20',
    0.25: '/25',
    0.3: '/30',
    0.4: '/40',
    0.5: '/50',
  };

  const opacitySuffix = opacityMap[opacity] || `/${Math.round(opacity * 100)}`;
  const baseClass = getColorClass(baseColor, 'bg').replace('bg-', '');

  return `bg-${baseClass}${opacitySuffix}`;
}

/**
 * Gets Tailwind class for a color with opacity from rgba string
 */
export function parseRgbaToClass(rgbaString: string): string {
  // Match rgba(r, g, b, a) or rgb(r, g, b)
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return 'bg-slate-500/20'; // Fallback
  }

  const [, r, g, b, a] = match;
  const opacity = a ? parseFloat(a) : 1;

  // Map RGB to closest Tailwind color
  const rgb = { r: parseInt(r), g: parseInt(g), b: parseInt(b) };

  // Emerald: rgb(16, 185, 129)
  if (rgb.r === 16 && rgb.g === 185 && rgb.b === 129) {
    return getRgbaClass('#10b981', opacity);
  }
  // Red: rgb(239, 68, 68)
  if (rgb.r === 239 && rgb.g === 68 && rgb.b === 68) {
    return getRgbaClass('#ef4444', opacity);
  }
  // Blue: rgb(59, 130, 246)
  if (rgb.r === 59 && rgb.g === 130 && rgb.b === 246) {
    return getRgbaClass('#3b82f6', opacity);
  }
  // Violet: rgb(139, 92, 246)
  if (rgb.r === 139 && rgb.g === 92 && rgb.b === 246) {
    return getRgbaClass('#8b5cf6', opacity);
  }

  return 'bg-slate-500/20'; // Fallback
}
