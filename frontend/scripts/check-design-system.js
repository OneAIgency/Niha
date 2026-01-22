#!/usr/bin/env node

/**
 * Design System Compliance Checker
 *
 * Checks staged files for design system violations:
 * - slate-* colors (should use navy-*)
 * - gray-* colors (should use navy-*)
 * - Hardcoded hex colors (should use Tailwind or CSS variables)
 * - Hardcoded RGB colors (should use CSS variables)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const errors = [];

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
    .split('\n')
    .filter(file => file.match(/\.(tsx?|jsx?|css)$/));

  console.log(`\n Checking ${stagedFiles.length} staged files for design system violations...\n`);

  for (const file of stagedFiles) {
    if (!file) continue;

    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for slate-* colors
      if (line.match(/['"`].*slate-\d+.*['"`]/) || line.match(/className=.*slate-\d+/)) {
        errors.push({
          file,
          line: lineNum,
          message: 'Uses slate-* color. Use navy-* instead.',
          code: line.trim()
        });
      }

      // Check for gray-* colors (excluding gray-opacity which might be valid)
      if (line.match(/['"`].*gray-\d+.*['"`]/) || line.match(/className=.*gray-\d+/)) {
        errors.push({
          file,
          line: lineNum,
          message: 'Uses gray-* color. Use navy-* instead.',
          code: line.trim()
        });
      }

      // Check for hardcoded hex colors (but allow CSS variable definitions)
      if (line.match(/#[0-9a-fA-F]{3,8}/) && !line.match(/--color-/)) {
        // Exclude comments and imports
        if (!line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.includes('import')) {
          errors.push({
            file,
            line: lineNum,
            message: 'Uses hardcoded hex color. Use Tailwind class or CSS variable.',
            code: line.trim()
          });
        }
      }

      // Check for hardcoded RGB colors
      if (line.match(/rgb\(/) && !line.includes('var(--')) {
        errors.push({
          file,
          line: lineNum,
          message: 'Uses hardcoded RGB color. Use CSS variable like var(--color-bid).',
          code: line.trim()
        });
      }
    });
  }

  if (errors.length > 0) {
    console.error('\n Design System Violations Found:\n');
    errors.forEach(error => {
      console.error(`  ${error.file}:${error.line}`);
      console.error(`    ${error.message}`);
      console.error(`    ${error.code}\n`);
    });
    console.error(`\n See migration guide: docs/DESIGN_TOKENS_MIGRATION.md`);
    console.error(` See developer guidelines: .claude/claude.md\n`);
    process.exit(1);
  }

  console.log(' No design system violations found!\n');
  process.exit(0);

} catch (error) {
  console.error('Error running design system checks:', error.message);
  // Don't block commit on script errors
  process.exit(0);
}
