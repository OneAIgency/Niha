#!/usr/bin/env node
/**
 * Multi-Agent Color Replacement System
 *
 * Automatically replaces all colors.xxx references with proper Tailwind classes
 * based on the design tokens defined in frontend/src/styles/design-tokens.css
 *
 * Architecture:
 * - Main coordinator spawns file-specific agents
 * - Each agent analyzes its file and applies context-aware transformations
 * - Results are aggregated and validated
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Color Mapping Rules (Based on design-tokens.css)
// =============================================================================

const COLOR_MAPPINGS = {
  // Background colors
  background: {
    'colors.bgDark': 'bg-navy-900',
    'colors.bgCard': 'bg-navy-800',
    'colors.bgCardHover': 'bg-navy-700',
    'colors.background': 'bg-white dark:bg-navy-900',
    'colors.surface': 'bg-white dark:bg-navy-800',
    'colors.primary': 'bg-emerald-500',
    'colors.primaryDark': 'bg-emerald-900',
    'colors.primaryLight': 'bg-emerald-100',
    'colors.secondary': 'bg-blue-500',
    'colors.secondaryLight': 'bg-blue-400',
    'colors.success': 'bg-emerald-500',
    'colors.danger': 'bg-red-500',
    'colors.warning': 'bg-amber-500',
    'colors.accent': 'bg-violet-500',
  },

  // Text colors
  color: {
    'colors.textPrimary': 'text-navy-900 dark:text-white',
    'colors.textSecondary': 'text-navy-600 dark:text-navy-400',
    'colors.textMuted': 'text-navy-500 dark:text-navy-500',
    'colors.primary': 'text-emerald-500 dark:text-emerald-400',
    'colors.primaryLight': 'text-emerald-300',
    'colors.primaryDark': 'text-emerald-900',
    'colors.secondary': 'text-blue-500 dark:text-blue-400',
    'colors.secondaryLight': 'text-blue-400',
    'colors.success': 'text-emerald-600 dark:text-emerald-400',
    'colors.danger': 'text-red-600 dark:text-red-400',
    'colors.warning': 'text-amber-600 dark:text-amber-400',
    'colors.accent': 'text-violet-500 dark:text-violet-400',
  },

  // Border colors
  border: {
    'colors.border': 'border-navy-200 dark:border-navy-700',
    'colors.primary': 'border-emerald-500',
    'colors.primaryDark': 'border-emerald-900',
    'colors.secondary': 'border-blue-500',
    'colors.secondaryLight': 'border-blue-400',
    'colors.success': 'border-emerald-500',
    'colors.danger': 'border-red-500',
    'colors.warning': 'border-amber-500',
    'colors.accent': 'border-violet-500',
  },
};

// RGB/Hex values for template literal replacements
const COLOR_VALUES = {
  'colors.primary': '#10b981',
  'colors.primaryDark': '#064e3b',
  'colors.primaryLight': '#d1fae5',
  'colors.secondary': '#3b82f6',
  'colors.secondaryLight': '#60a5fa',
  'colors.success': '#10b981',
  'colors.danger': '#ef4444',
  'colors.warning': '#f59e0b',
  'colors.accent': '#8b5cf6',
  'colors.border': '#475569',
  'colors.bgCard': '#1e293b',
  'colors.bgCardHover': '#334155',
};

// =============================================================================
// File Agent - Processes individual files
// =============================================================================

class FileAgent {
  constructor(filePath) {
    this.filePath = filePath;
    this.changes = 0;
    this.errors = [];
  }

  async process() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      let modified = content;

      // Track changes
      const initialContent = content;

      // Apply transformations in order
      modified = this.replaceInlineStyles(modified);
      modified = this.replaceTemplateLiterals(modified);
      modified = this.replaceOpacityBackgrounds(modified);
      modified = this.replaceConditionalStyles(modified);
      modified = this.cleanupClassNames(modified);

      // Count changes
      this.changes = this.countDifferences(initialContent, modified);

      // Write back if changed
      if (this.changes > 0) {
        await fs.writeFile(this.filePath, modified, 'utf-8');
      }

      return {
        file: this.filePath,
        changes: this.changes,
        errors: this.errors,
        success: true,
      };
    } catch (error) {
      this.errors.push(error.message);
      return {
        file: this.filePath,
        changes: 0,
        errors: this.errors,
        success: false,
      };
    }
  }

  /**
   * Replace inline style objects: style={{ color: colors.xxx }}
   */
  replaceInlineStyles(content) {
    let result = content;

    // Pattern 1: style={{ color: colors.xxx }} with existing className
    result = result.replace(
      /className="([^"]*)"\s+style=\{\{\s*color:\s*colors\.(\w+)\s*\}\}/g,
      (match, existingClasses, colorName) => {
        const tailwindClass = COLOR_MAPPINGS.color[`colors.${colorName}`] || `text-${colorName}`;
        return `className="${existingClasses} ${tailwindClass}"`;
      }
    );

    // Pattern 2: standalone style={{ color: colors.xxx }}
    result = result.replace(
      /style=\{\{\s*color:\s*colors\.(\w+)\s*\}\}/g,
      (match, colorName) => {
        const tailwindClass = COLOR_MAPPINGS.color[`colors.${colorName}`] || `text-${colorName}`;
        return `className="${tailwindClass}"`;
      }
    );

    // Pattern 3: style={{ backgroundColor: colors.xxx }} with existing className
    result = result.replace(
      /className="([^"]*)"\s+style=\{\{\s*backgroundColor:\s*colors\.(\w+)\s*\}\}/g,
      (match, existingClasses, colorName) => {
        const tailwindClass = COLOR_MAPPINGS.background[`colors.${colorName}`] || `bg-${colorName}`;
        return `className="${existingClasses} ${tailwindClass}"`;
      }
    );

    // Pattern 4: standalone style={{ backgroundColor: colors.xxx }}
    result = result.replace(
      /style=\{\{\s*backgroundColor:\s*colors\.(\w+)\s*\}\}/g,
      (match, colorName) => {
        const tailwindClass = COLOR_MAPPINGS.background[`colors.${colorName}`] || `bg-${colorName}`;
        return `className="${tailwindClass}"`;
      }
    );

    // Pattern 5: style={{ borderColor: colors.xxx }}
    result = result.replace(
      /style=\{\{\s*borderColor:\s*colors\.(\w+)\s*\}\}/g,
      (match, colorName) => {
        const tailwindClass = COLOR_MAPPINGS.border[`colors.${colorName}`] || `border-${colorName}`;
        return `className="border ${tailwindClass}"`;
      }
    );

    return result;
  }

  /**
   * Replace template literal borders: border: `1px solid ${colors.xxx}`
   */
  replaceTemplateLiterals(content) {
    let result = content;

    // Pattern: border: `1px solid ${colors.xxx}`
    result = result.replace(
      /border:\s*`1px solid \${colors\.(\w+)}`/g,
      (match, colorName) => {
        const hexValue = COLOR_VALUES[`colors.${colorName}`] || '#000000';
        return `border: "1px solid ${hexValue}"`;
      }
    );

    // Pattern: borderTop: `2px solid ${colors.xxx}`
    result = result.replace(
      /borderTop:\s*`(\d+)px solid \${colors\.(\w+)}`/g,
      (match, width, colorName) => {
        const hexValue = COLOR_VALUES[`colors.${colorName}`] || '#000000';
        return `borderTop: "${width}px solid ${hexValue}"`;
      }
    );

    // Pattern: borderLeft: `4px solid ${colors.xxx}`
    result = result.replace(
      /borderLeft:\s*`(\d+)px solid \${colors\.(\w+)}`/g,
      (match, width, colorName) => {
        const hexValue = COLOR_VALUES[`colors.${colorName}`] || '#000000';
        return `borderLeft: "${width}px solid ${hexValue}"`;
      }
    );

    return result;
  }

  /**
   * Replace opacity backgrounds: backgroundColor: `${colors.xxx}15`
   */
  replaceOpacityBackgrounds(content) {
    let result = content;

    // Pattern: backgroundColor: `${colors.xxx}10` or similar
    result = result.replace(
      /backgroundColor:\s*`\${colors\.(\w+)}(\d+)`/g,
      (match, colorName, opacity) => {
        const opacityPercent = parseInt(opacity, 16) / 255;
        const hexValue = COLOR_VALUES[`colors.${colorName}`] || '#000000';
        // Convert to rgba
        const r = parseInt(hexValue.slice(1, 3), 16);
        const g = parseInt(hexValue.slice(3, 5), 16);
        const b = parseInt(hexValue.slice(5, 7), 16);
        return `backgroundColor: "rgba(${r}, ${g}, ${b}, ${opacityPercent.toFixed(2)})"`;
      }
    );

    return result;
  }

  /**
   * Replace conditional styles: row.isTotal ? colors.primary : colors.bgCard
   */
  replaceConditionalStyles(content) {
    let result = content;

    // Pattern: backgroundColor: condition ? colors.xxx : colors.yyy
    result = result.replace(
      /backgroundColor:\s*(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
      (match, condition, trueColor, falseColor) => {
        const trueClass = COLOR_MAPPINGS.background[`colors.${trueColor}`] || `bg-${trueColor}`;
        const falseClass = COLOR_MAPPINGS.background[`colors.${falseColor}`] || `bg-${falseColor}`;
        return `className={${condition} ? "${trueClass}" : "${falseClass}"}`;
      }
    );

    // Pattern: color: condition ? colors.xxx : colors.yyy
    result = result.replace(
      /color:\s*(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
      (match, condition, trueColor, falseColor) => {
        const trueClass = COLOR_MAPPINGS.color[`colors.${trueColor}`] || `text-${trueColor}`;
        const falseClass = COLOR_MAPPINGS.color[`colors.${falseColor}`] || `text-${falseColor}`;
        return `className={${condition} ? "${trueClass}" : "${falseClass}"}`;
      }
    );

    // Pattern: color: condition ? 'white' : colors.xxx
    result = result.replace(
      /color:\s*(\w+(?:\.\w+)*)\s*\?\s*['"]white['"]\s*:\s*colors\.(\w+)/g,
      (match, condition, color) => {
        const colorClass = COLOR_MAPPINGS.color[`colors.${color}`] || `text-${color}`;
        return `className={${condition} ? "text-white" : "${colorClass}"}`;
      }
    );

    return result;
  }

  /**
   * Clean up duplicate classes in className
   */
  cleanupClassNames(content) {
    return content.replace(/className="([^"]*)"/g, (match, classes) => {
      const uniqueClasses = [...new Set(classes.split(/\s+/).filter(Boolean))];
      return `className="${uniqueClasses.join(' ')}"`;
    });
  }

  /**
   * Count meaningful differences between two strings
   */
  countDifferences(before, after) {
    const beforeColors = (before.match(/colors\.\w+/g) || []).length;
    const afterColors = (after.match(/colors\.\w+/g) || []).length;
    return beforeColors - afterColors;
  }
}

// =============================================================================
// Coordinator - Manages file agents and aggregates results
// =============================================================================

class Coordinator {
  constructor() {
    this.agents = [];
    this.results = [];
  }

  async findTargetFiles() {
    const frontendSrc = path.join(__dirname, 'frontend', 'src');
    const files = [];

    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, dist, build
          if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          // Only process non-backup files
          if (!entry.name.includes('.backup') && !entry.name.includes('.bak')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.includes('colors.')) {
              files.push(fullPath);
            }
          }
        }
      }
    }

    await scan(frontendSrc);
    return files;
  }

  async execute() {
    console.log('🤖 Multi-Agent Color Replacement System\n');
    console.log('Step 1: Discovering files with colors.xxx references...');

    const files = await this.findTargetFiles();
    console.log(`Found ${files.length} files to process:\n`);
    files.forEach(f => console.log(`  - ${path.relative(__dirname, f)}`));

    console.log('\nStep 2: Spawning file agents...');
    this.agents = files.map(f => new FileAgent(f));

    console.log(`\nStep 3: Processing ${this.agents.length} files in parallel...`);
    this.results = await Promise.all(this.agents.map(agent => agent.process()));

    console.log('\nStep 4: Aggregating results...\n');
    this.printSummary();

    return this.results;
  }

  printSummary() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const totalChanges = this.results.reduce((sum, r) => sum + r.changes, 0);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    EXECUTION SUMMARY                      ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`✅ Successful: ${successful.length} files`);
    console.log(`❌ Failed: ${failed.length} files`);
    console.log(`🔄 Total replacements: ${totalChanges}\n`);

    if (successful.length > 0) {
      console.log('Successful Files:');
      successful.forEach(r => {
        const relativePath = path.relative(__dirname, r.file);
        console.log(`  ✓ ${relativePath} (${r.changes} changes)`);
      });
      console.log();
    }

    if (failed.length > 0) {
      console.log('Failed Files:');
      failed.forEach(r => {
        const relativePath = path.relative(__dirname, r.file);
        console.log(`  ✗ ${relativePath}`);
        r.errors.forEach(err => console.log(`    Error: ${err}`));
      });
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

// =============================================================================
// Main Execution
// =============================================================================

async function main() {
  const coordinator = new Coordinator();
  await coordinator.execute();
}

main().catch(console.error);
