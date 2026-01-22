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
 * @param {string} propsString - The interface body content
 * @returns {Array} Array of prop metadata objects
 */
function extractProps(propsString) {
  const props = [];
  const propLines = propsString
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*'));

  for (const line of propLines) {
    // Match patterns like: propName?: type; or propName: type;
    const match = line.match(/(\w+)(\??):\s*([^;]+)/);
    if (match) {
      const [, name, optional, type] = match;
      props.push({
        name: name.trim(),
        type: type.trim(),
        optional: optional === '?'
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
