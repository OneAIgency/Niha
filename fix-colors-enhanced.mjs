#!/usr/bin/env node
/**
 * Enhanced Multi-Agent Color Replacement System v2
 *
 * Handles all edge cases including:
 * - Complex ternary expressions
 * - Nested conditionals
 * - Multi-property style objects
 * - Template literal borders
 * - Opacity backgrounds
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Enhanced Color Mappings
// =============================================================================

const TAILWIND_CLASSES = {
  // Text colors
  text: {
    textPrimary: 'text-navy-900 dark:text-white',
    textSecondary: 'text-navy-600 dark:text-navy-400',
    textMuted: 'text-navy-500',
    primary: 'text-emerald-500 dark:text-emerald-400',
    primaryLight: 'text-emerald-300',
    primaryDark: 'text-emerald-900',
    secondary: 'text-blue-500 dark:text-blue-400',
    secondaryLight: 'text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    accent: 'text-violet-500 dark:text-violet-400',
  },

  // Background colors
  bg: {
    bgDark: 'bg-navy-900',
    bgCard: 'bg-navy-800',
    bgCardHover: 'bg-navy-700',
    background: 'bg-white dark:bg-navy-900',
    surface: 'bg-white dark:bg-navy-800',
    primary: 'bg-emerald-500',
    primaryDark: 'bg-emerald-900',
    primaryLight: 'bg-emerald-100',
    secondary: 'bg-blue-500',
    secondaryLight: 'bg-blue-400',
    success: 'bg-emerald-500',
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    accent: 'bg-violet-500',
  },

  // Border colors
  border: {
    border: 'border-navy-200 dark:border-navy-700',
    primary: 'border-emerald-500',
    primaryDark: 'border-emerald-900',
    secondary: 'border-blue-500',
    secondaryLight: 'border-blue-400',
    success: 'border-emerald-500',
    danger: 'border-red-500',
    warning: 'border-amber-500',
    accent: 'border-violet-500',
  },
};

// Hex values for remaining inline styles
const HEX_VALUES = {
  primary: '#10b981',
  primaryDark: '#064e3b',
  primaryLight: '#d1fae5',
  secondary: '#3b82f6',
  secondaryLight: '#60a5fa',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  accent: '#8b5cf6',
  border: '#475569',
  bgCard: '#1e293b',
  bgCardHover: '#334155',
};

// =============================================================================
// Enhanced File Agent
// =============================================================================

class EnhancedFileAgent {
  constructor(filePath) {
    this.filePath = filePath;
    this.changes = 0;
  }

  async process() {
    try {
      let content = await fs.readFile(this.filePath, 'utf-8');
      const original = content;

      // Apply transformations
      content = this.fixComplexStyleObjects(content);
      content = this.fixSimpleStyles(content);
      content = this.fixTemplateLiterals(content);
      content = this.fixOpacityBackgrounds(content);
      content = this.removeInvalidSyntax(content);

      // Count remaining colors.xxx
      const before = (original.match(/colors\.\w+/g) || []).length;
      const after = (content.match(/colors\.\w+/g) || []).length;
      this.changes = before - after;

      if (content !== original) {
        await fs.writeFile(this.filePath, content, 'utf-8');
      }

      return {
        file: this.filePath,
        before,
        after,
        changes: this.changes,
        success: true,
      };
    } catch (error) {
      return {
        file: this.filePath,
        error: error.message,
        success: false,
      };
    }
  }

  /**
   * Fix complex multi-property style objects
   * Example: style={{ backgroundColor: x ? colors.a : colors.b, border: ... }}
   */
  fixComplexStyleObjects(content) {
    let result = content;

    // Multi-line style objects with complex ternaries
    result = result.replace(
      /style=\{\{([^}]+)\}\}/gs,
      (match, styleContent) => {
        let fixed = styleContent;

        // Fix backgroundColor with ternary: condition ? colors.a : colors.b
        fixed = fixed.replace(
          /backgroundColor:\s*(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
          (m, cond, trueC, falseC) => {
            const hexTrue = HEX_VALUES[trueC] || '#000000';
            const hexFalse = HEX_VALUES[falseC] || '#000000';
            return `backgroundColor: ${cond} ? "${hexTrue}" : "${hexFalse}"`;
          }
        );

        // Fix backgroundColor with nested ternary: a ? colors.x : (b ? colors.y : colors.z)
        fixed = fixed.replace(
          /backgroundColor:\s*(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*\(([^)]+)\)/g,
          (m, cond1, color1, nested) => {
            const hex1 = HEX_VALUES[color1] || '#000000';

            // Process the nested part
            let processedNested = nested.replace(
              /(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
              (m2, cond2, color2, color3) => {
                const hex2 = HEX_VALUES[color2] || '#000000';
                const hex3 = HEX_VALUES[color3] || '#000000';
                return `${cond2} ? "${hex2}" : "${hex3}"`;
              }
            );

            return `backgroundColor: ${cond1} ? "${hex1}" : (${processedNested})`;
          }
        );

        // Fix simple backgroundColor: colors.xxx
        fixed = fixed.replace(
          /backgroundColor:\s*colors\.(\w+)/g,
          (m, color) => {
            const hex = HEX_VALUES[color] || '#000000';
            return `backgroundColor: "${hex}"`;
          }
        );

        // Fix color with ternary
        fixed = fixed.replace(
          /color:\s*(\w+(?:\.\w+)*)\s*\?\s*['"](\w+)['"]\s*:\s*colors\.(\w+)/g,
          (m, cond, literal, color) => {
            const hex = HEX_VALUES[color] || '#000000';
            return `color: ${cond} ? "${literal}" : "${hex}"`;
          }
        );

        // Fix simple color: colors.xxx
        fixed = fixed.replace(
          /color:\s*colors\.(\w+)/g,
          (m, color) => {
            const hex = HEX_VALUES[color] || '#000000';
            return `color: "${hex}"`;
          }
        );

        return `style={{${fixed}}}`;
      }
    );

    return result;
  }

  /**
   * Fix simple standalone style properties
   */
  fixSimpleStyles(content) {
    let result = content;

    // Standalone style={{ color: colors.xxx }}
    result = result.replace(
      /\s+style=\{\{\s*color:\s*colors\.(\w+)\s*\}\}/g,
      (match, color) => {
        const className = TAILWIND_CLASSES.text[color] || `text-${color}`;
        return ` className="${className}"`;
      }
    );

    // Standalone style={{ backgroundColor: colors.xxx }}
    result = result.replace(
      /\s+style=\{\{\s*backgroundColor:\s*colors\.(\w+)\s*\}\}/g,
      (match, color) => {
        const className = TAILWIND_CLASSES.bg[color] || `bg-${color}`;
        return ` className="${className}"`;
      }
    );

    // Standalone style={{ borderColor: colors.xxx }}
    result = result.replace(
      /\s+style=\{\{\s*borderColor:\s*colors\.(\w+)\s*\}\}/g,
      (match, color) => {
        const className = TAILWIND_CLASSES.border[color] || `border-${color}`;
        return ` className="border ${className}"`;
      }
    );

    return result;
  }

  /**
   * Fix template literal borders
   */
  fixTemplateLiterals(content) {
    let result = content;

    // border: `1px solid ${colors.xxx}`
    result = result.replace(
      /border:\s*`(\d+)px solid \${colors\.(\w+)}`/g,
      (match, width, color) => {
        const hex = HEX_VALUES[color] || '#000000';
        return `border: "${width}px solid ${hex}"`;
      }
    );

    // borderTop/borderLeft/etc
    result = result.replace(
      /border(Top|Bottom|Left|Right):\s*`(\d+)px solid \${colors\.(\w+)}`/g,
      (match, side, width, color) => {
        const hex = HEX_VALUES[color] || '#000000';
        return `border${side}: "${width}px solid ${hex}"`;
      }
    );

    return result;
  }

  /**
   * Fix opacity backgrounds like `${colors.xxx}15`
   */
  fixOpacityBackgrounds(content) {
    let result = content;

    // backgroundColor: `${colors.xxx}10` (hex opacity)
    result = result.replace(
      /backgroundColor:\s*`\${colors\.(\w+)}(\w{2})`/g,
      (match, color, opacity) => {
        const baseHex = HEX_VALUES[color] || '#000000';
        const r = parseInt(baseHex.slice(1, 3), 16);
        const g = parseInt(baseHex.slice(3, 5), 16);
        const b = parseInt(baseHex.slice(5, 7), 16);
        const alpha = parseInt(opacity, 16) / 255;
        return `backgroundColor: "rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})"`;
      }
    );

    return result;
  }

  /**
   * Remove invalid syntax like style={{ className={} }}
   */
  removeInvalidSyntax(content) {
    return content.replace(
      /style=\{\{\s*className=\{([^}]+)\}\s*\}\}/g,
      'className={$1}'
    );
  }
}

// =============================================================================
// Coordinator
// =============================================================================

async function findFiles() {
  const frontendSrc = path.join(__dirname, 'frontend', 'src');
  const files = [];

  async function scan(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
          await scan(fullPath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes('.backup') && !entry.name.includes('.bak')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        if (content.includes('colors.')) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(frontendSrc);
  return files;
}

async function main() {
  console.log('🚀 Enhanced Multi-Agent Color Replacement System v2\n');

  const files = await findFiles();
  console.log(`Found ${files.length} files with colors.xxx references\n`);

  const agents = files.map(f => new EnhancedFileAgent(f));
  const results = await Promise.all(agents.map(a => a.process()));

  const successful = results.filter(r => r.success);
  const totalBefore = successful.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = successful.reduce((sum, r) => sum + r.after, 0);
  const totalFixed = totalBefore - totalAfter;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    RESULTS                                ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total colors.xxx before: ${totalBefore}`);
  console.log(`Total colors.xxx after:  ${totalAfter}`);
  console.log(`Total fixed:             ${totalFixed}\n`);

  successful.forEach(r => {
    const rel = path.relative(__dirname, r.file);
    console.log(`  ${rel}`);
    console.log(`    Before: ${r.before} | After: ${r.after} | Fixed: ${r.changes}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
