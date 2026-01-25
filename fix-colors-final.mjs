#!/usr/bin/env node
/**
 * Final Comprehensive Color Replacement System v3
 *
 * Handles ALL remaining edge cases:
 * - CSS gradients (convert to hex)
 * - Data object properties (convert to hex)
 * - Framer Motion props (convert to hex)
 * - Complex multi-level ternaries
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hex color values from design tokens
const COLORS_TO_HEX = {
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
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
};

class FinalAgent {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async process() {
    try {
      let content = await fs.readFile(this.filePath, 'utf-8');
      const before = (content.match(/colors\.\w+/g) || []).length;

      // Apply all transformations
      content = this.replaceInGradients(content);
      content = this.replaceInDataObjects(content);
      content = this.replaceInFramerMotion(content);
      content = this.replaceInTernaries(content);
      content = this.replaceRemaining(content);

      const after = (content.match(/colors\.\w+/g) || []).length;

      if (before !== after) {
        await fs.writeFile(this.filePath, content, 'utf-8');
      }

      return {
        file: path.relative(__dirname, this.filePath),
        before,
        after,
        fixed: before - after,
        success: true,
      };
    } catch (error) {
      return {
        file: path.relative(__dirname, this.filePath),
        error: error.message,
        success: false,
      };
    }
  }

  replaceInGradients(content) {
    // Match: linear-gradient(135deg, ${colors.xxx} 0%, ${colors.yyy} 100%)
    return content.replace(
      /linear-gradient\(([^)]+)\)/g,
      (match, gradientContent) => {
        let fixed = gradientContent.replace(
          /\${colors\.(\w+)}/g,
          (m, colorName) => COLORS_TO_HEX[colorName] || '#000000'
        );
        return `linear-gradient(${fixed})`;
      }
    );
  }

  replaceInDataObjects(content) {
    // Match: { color: colors.xxx } in object literals
    return content.replace(
      /\{\s*([^}]*color:\s*colors\.\w+[^}]*)\s*\}/g,
      (match, objectContent) => {
        let fixed = objectContent.replace(
          /colors\.(\w+)/g,
          (m, colorName) => `"${COLORS_TO_HEX[colorName] || '#000000'}"`
        );
        return `{ ${fixed} }`;
      }
    );
  }

  replaceInFramerMotion(content) {
    // Match: whileHover={{ borderColor: colors.xxx }}
    return content.replace(
      /(whileHover|whileTap|initial|animate|exit)=\{\{([^}]+)\}\}/g,
      (match, prop, motionContent) => {
        let fixed = motionContent.replace(
          /colors\.(\w+)/g,
          (m, colorName) => `"${COLORS_TO_HEX[colorName] || '#000000'}"`
        );
        return `${prop}={{${fixed}}}`;
      }
    );
  }

  replaceInTernaries(content) {
    // Match complex ternary chains: condition ? colors.xxx : condition2 ? colors.yyy : colors.zzz
    let result = content;

    // Three-level ternary
    result = result.replace(
      /(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*(\w+(?:\.\w+)*)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
      (match, cond1, color1, cond2, color2, color3) => {
        const hex1 = COLORS_TO_HEX[color1] || '#000000';
        const hex2 = COLORS_TO_HEX[color2] || '#000000';
        const hex3 = COLORS_TO_HEX[color3] || '#000000';
        return `${cond1} ? "${hex1}" : ${cond2} ? "${hex2}" : "${hex3}"`;
      }
    );

    // Two-level ternary: condition ? colors.xxx : colors.yyy
    result = result.replace(
      /(\w+(?:\.\w+)*(?:\s*===\s*['"]?\w+['"]?)?)\s*\?\s*colors\.(\w+)\s*:\s*colors\.(\w+)/g,
      (match, condition, color1, color2) => {
        const hex1 = COLORS_TO_HEX[color1] || '#000000';
        const hex2 = COLORS_TO_HEX[color2] || '#000000';
        return `${condition} ? "${hex1}" : "${hex2}"`;
      }
    );

    // Simple: condition ? colors.xxx : 'literal'
    result = result.replace(
      /(\w+(?:\.\w+)*(?:\s*===\s*['"]?\w+['"]?)?)\s*\?\s*colors\.(\w+)\s*:\s*['"]([^'"]+)['"]/g,
      (match, condition, color, literal) => {
        const hex = COLORS_TO_HEX[color] || '#000000';
        return `${condition} ? "${hex}" : "${literal}"`;
      }
    );

    // Simple: condition ? 'literal' : colors.xxx
    result = result.replace(
      /(\w+(?:\.\w+)*(?:\s*===\s*['"]?\w+['"]?)?)\s*\?\s*['"]([^'"]+)['"]\s*:\s*colors\.(\w+)/g,
      (match, condition, literal, color) => {
        const hex = COLORS_TO_HEX[color] || '#000000';
        return `${condition} ? "${literal}" : "${hex}"`;
      }
    );

    return result;
  }

  replaceRemaining(content) {
    // Any remaining standalone colors.xxx references
    return content.replace(
      /\bcolors\.(\w+)\b/g,
      (match, colorName) => `"${COLORS_TO_HEX[colorName] || '#000000'}"`
    );
  }
}

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
  console.log('🎯 Final Comprehensive Color Replacement v3\n');

  const files = await findFiles();
  console.log(`Processing ${files.length} files...\n`);

  const agents = files.map(f => new FinalAgent(f));
  const results = await Promise.all(agents.map(a => a.process()));

  const successful = results.filter(r => r.success);
  const totalBefore = successful.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = successful.reduce((sum, r) => sum + r.after, 0);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                 FINAL RESULTS                             ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Before:  ${totalBefore} colors.xxx references`);
  console.log(`After:   ${totalAfter} colors.xxx references`);
  console.log(`Fixed:   ${totalBefore - totalAfter}\n`);

  successful.forEach(r => {
    if (r.fixed > 0) {
      console.log(`  ✓ ${r.file}: ${r.before} → ${r.after} (fixed ${r.fixed})`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (totalAfter > 0) {
    console.log('⚠️  Remaining references may need manual review\n');
  } else {
    console.log('✅ All colors.xxx references successfully replaced!\n');
  }
}

main().catch(console.error);
