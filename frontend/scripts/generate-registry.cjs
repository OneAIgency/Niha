#!/usr/bin/env node

/**
 * Component Registry Generator
 * Scans src/components directory and creates a registry of all components
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const OUTPUT_FILE = path.join(__dirname, '../src/component-registry.json');

/**
 * Recursively scans directory to find all component files
 * @param {string} dir - Directory path to scan
 * @param {string} category - Current category path
 * @returns {Array} Array of component metadata objects
 */
function scanDirectory(dir, category = '') {
  const components = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      const categoryName = category ? `${category}/${item}` : item;
      components.push(...scanDirectory(fullPath, categoryName));
    } else if (item.endsWith('.tsx') && !item.endsWith('.test.tsx') && !item.endsWith('.stories.tsx')) {
      // Extract component info
      const content = fs.readFileSync(fullPath, 'utf-8');
      const componentName = item.replace('.tsx', '');

      // Skip index files
      if (componentName === 'index') {
        continue;
      }

      // Try to extract props interface (handle both simple and extends cases)
      const propsInterfaceMatch = content.match(/interface\s+(\w+Props)\s*(?:extends\s+[^{]+)?\s*{([^}]*)}/s);
      const props = propsInterfaceMatch ? extractProps(propsInterfaceMatch[2]) : [];

      // Build relative paths
      const relativePath = fullPath.replace(path.join(__dirname, '../'), '');
      const importPath = relativePath
        .replace('src/', '')
        .replace('.tsx', '');

      components.push({
        name: componentName,
        category: category || 'common',
        path: relativePath,
        importPath,
        props,
        description: extractDescription(content)
      });
    }
  }

  return components;
}

/**
 * Extracts prop metadata from interface string
 * Handles multi-line types using bracket/brace depth tracking
 * @param {string} propsString - The interface body content
 * @returns {Array} Array of prop metadata objects
 */
function extractProps(propsString) {
  const props = [];

  // Remove comments first (both single-line and multi-line)
  let cleaned = propsString
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    })
    .join('\n');

  let i = 0;
  while (i < cleaned.length) {
    // Skip whitespace
    while (i < cleaned.length && /\s/.test(cleaned[i])) {
      i++;
    }

    if (i >= cleaned.length) break;

    // Try to extract a prop definition
    // Match: propName?: type; or propName: type;
    const propNameMatch = cleaned.slice(i).match(/^(\w+)(\??)\s*:\s*/);
    if (!propNameMatch) {
      // Skip to next semicolon or newline if we can't parse
      const nextSemi = cleaned.indexOf(';', i);
      const nextNewline = cleaned.indexOf('\n', i);
      if (nextSemi === -1 && nextNewline === -1) {
        i = cleaned.length;
      } else if (nextSemi === -1) {
        i = nextNewline + 1;
      } else if (nextNewline === -1) {
        i = nextSemi + 1;
      } else {
        i = Math.min(nextSemi, nextNewline) + 1;
      }
      continue;
    }

    const propName = propNameMatch[1];
    const optional = propNameMatch[2] === '?';
    i += propNameMatch[0].length;

    // Now extract the type by tracking brace/bracket/paren depth
    let type = '';
    let braceDepth = 0;
    let bracketDepth = 0;
    let parenDepth = 0;
    let angleDepth = 0;
    let startI = i;

    while (i < cleaned.length) {
      const char = cleaned[i];
      const prevChar = i > 0 ? cleaned[i - 1] : '';
      const nextChar = i < cleaned.length - 1 ? cleaned[i + 1] : '';

      // Track depth FIRST
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
      } else if (char === '[') {
        bracketDepth++;
      } else if (char === ']') {
        bracketDepth--;
      } else if (char === '(') {
        parenDepth++;
      } else if (char === ')') {
        parenDepth--;
      } else if (char === '<' && prevChar !== '=' && nextChar !== '=') {
        // Only track < if it's not part of <= or =>
        angleDepth++;
      } else if (char === '>' && prevChar !== '=' && nextChar !== '=') {
        // Only track > if it's not part of >= or =>
        angleDepth--;
      }

      // Then check for end conditions at depth 0
      if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && angleDepth === 0) {
        // Semicolon always ends the type
        if (char === ';') {
          type = cleaned.slice(startI, i);
          i++; // Move past the semicolon
          break;
        }

        // Newline might end the type - check if next non-whitespace is a prop name
        if (char === '\n') {
          // Look ahead to see if the next non-whitespace starts a new prop
          let j = i + 1;
          while (j < cleaned.length && /[ \t]/.test(cleaned[j])) {
            j++;
          }

          // Check conditions
          const atEnd = j >= cleaned.length;
          const nextIsNewline = !atEnd && cleaned[j] === '\n';
          const nextMatchesProp = !atEnd && /^\w+\??:/.test(cleaned.slice(j));

          // If we found another newline or end of string, or a valid prop pattern, this newline ends the type
          if (atEnd || nextIsNewline || nextMatchesProp) {
            type = cleaned.slice(startI, i);
            i++; // Move past the newline
            break;
          }
        }
      }

      i++;
    }

    // Handle case where we reached end of string without semicolon or newline
    if (i >= cleaned.length && !type) {
      type = cleaned.slice(startI, i);
    }

    // Normalize whitespace in the type (collapse multiple spaces/newlines to single space)
    type = type.replace(/\s+/g, ' ').trim();

    if (propName && type) {
      props.push({
        name: propName,
        type: type,
        optional: optional
      });
    }
  }

  return props;
}

/**
 * Extracts description from JSDoc comment
 * @param {string} content - File content
 * @returns {string} Description or empty string
 */
function extractDescription(content) {
  // Look for JSDoc comment before export
  const match = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
  return match ? match[1].trim() : '';
}

// Main execution
if (require.main === module) {
  console.log('🔍 Scanning components...');
  const components = scanDirectory(COMPONENTS_DIR);

  const registry = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    components,
    categories: [...new Set(components.map(c => c.category))].sort()
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(registry, null, 2));

  console.log(`✅ Generated registry with ${components.length} components`);
  console.log(`📁 Categories: ${registry.categories.join(', ')}`);
  console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

// Export functions for testing
module.exports = {
  scanDirectory,
  extractProps,
  extractDescription
};
