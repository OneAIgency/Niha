#!/usr/bin/env node

/**
 * Tests for Component Registry Generator
 */

const fs = require('fs');
const path = require('path');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    testsPassed++;
    console.log(`✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual: ${JSON.stringify(actual)}`);
  }
}

// Import the functions to test
const {
  extractProps,
  extractDescription,
  scanDirectory
} = require('./generate-registry.cjs');

console.log('\n🧪 Running Component Registry Tests\n');

// Test 1: extractProps should parse simple props
console.log('Test Suite: extractProps');
const simplePropsString = `
  label: string
  value: number
  disabled?: boolean
`;
const expectedSimpleProps = [
  { name: 'label', type: 'string', optional: false },
  { name: 'value', type: 'number', optional: false },
  { name: 'disabled', type: 'boolean', optional: true }
];
assertEqual(
  extractProps(simplePropsString),
  expectedSimpleProps,
  'Should parse simple props with types'
);

// Test 2: extractProps should handle union types
const unionPropsString = `
  variant: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
`;
const expectedUnionProps = [
  { name: 'variant', type: "'primary' | 'secondary' | 'ghost'", optional: false },
  { name: 'size', type: "'sm' | 'md' | 'lg'", optional: true }
];
assertEqual(
  extractProps(unionPropsString),
  expectedUnionProps,
  'Should parse union types correctly'
);

// Test 3: extractProps should handle complex types
const complexPropsString = `
  onClick?: (event: React.MouseEvent) => void
  children: React.ReactNode
`;
const expectedComplexProps = [
  { name: 'onClick', type: '(event: React.MouseEvent) => void', optional: true },
  { name: 'children', type: 'React.ReactNode', optional: false }
];
assertEqual(
  extractProps(complexPropsString),
  expectedComplexProps,
  'Should parse complex types like functions and React nodes'
);

// Test 4: extractDescription should extract JSDoc
console.log('\nTest Suite: extractDescription');
const contentWithJSDoc = `
/**
 * A reusable button component
 * Additional description line
 */
export function Button() {}
`;
const description = extractDescription(contentWithJSDoc);
assert(
  description === 'A reusable button component',
  'Should extract first line of JSDoc comment'
);

// Test 5: extractDescription should return empty for no JSDoc
const contentWithoutJSDoc = `
export function Button() {}
`;
assertEqual(
  extractDescription(contentWithoutJSDoc),
  '',
  'Should return empty string when no JSDoc found'
);

// Test 6: scanDirectory should find components
console.log('\nTest Suite: scanDirectory');
// We can test with the actual components directory
const componentsDir = path.join(__dirname, '../src/components');
if (fs.existsSync(componentsDir)) {
  const components = scanDirectory(componentsDir);

  assert(
    Array.isArray(components),
    'scanDirectory should return an array'
  );

  assert(
    components.length > 0,
    'scanDirectory should find at least one component'
  );

  // Check structure of first component
  if (components.length > 0) {
    const firstComponent = components[0];
    assert(
      typeof firstComponent.name === 'string',
      'Component should have a name property'
    );
    assert(
      typeof firstComponent.category === 'string',
      'Component should have a category property'
    );
    assert(
      typeof firstComponent.path === 'string',
      'Component should have a path property'
    );
    assert(
      typeof firstComponent.importPath === 'string',
      'Component should have an importPath property'
    );
    assert(
      Array.isArray(firstComponent.props),
      'Component should have a props array'
    );
    assert(
      typeof firstComponent.description === 'string',
      'Component should have a description property'
    );
  }

  // Verify it found Button component
  const buttonComponent = components.find(c => c.name === 'Button');
  assert(
    buttonComponent !== undefined,
    'Should find Button component in common directory'
  );

  if (buttonComponent) {
    assert(
      buttonComponent.category === 'common',
      'Button should be in common category'
    );
    assert(
      buttonComponent.props.length > 0,
      'Button should have props extracted'
    );
  }
}

// Print results
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
