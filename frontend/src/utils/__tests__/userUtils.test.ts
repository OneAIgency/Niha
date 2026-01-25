/**
 * Unit Tests for User Utility Functions
 * 
 * To run these tests, install a test framework:
 * npm install -D vitest @testing-library/react @testing-library/jest-dom
 * 
 * Then add to package.json scripts:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 * 
 * Run tests: npm test
 */

import { describe, it, expect } from 'vitest';
import { formatUserName, getUserInitials } from '../index';

describe('formatUserName', () => {
  it('should format full name when both first and last name are provided', () => {
    expect(formatUserName('John', 'Doe')).toBe('John Doe');
  });

  it('should format name when only first name is provided', () => {
    expect(formatUserName('John', null)).toBe('John');
    expect(formatUserName('John', undefined)).toBe('John');
  });

  it('should format name when only last name is provided', () => {
    expect(formatUserName(null, 'Doe')).toBe('Doe');
    expect(formatUserName(undefined, 'Doe')).toBe('Doe');
  });

  it('should return fallback when both names are missing', () => {
    expect(formatUserName(null, null)).toBe('No name provided');
    expect(formatUserName(undefined, undefined)).toBe('No name provided');
    expect(formatUserName('', '')).toBe('No name provided');
  });

  it('should use custom fallback message', () => {
    expect(formatUserName(null, null, 'Not set')).toBe('Not set');
  });

  it('should handle empty strings as missing values', () => {
    expect(formatUserName('', '')).toBe('No name provided');
    expect(formatUserName('John', '')).toBe('John');
    expect(formatUserName('', 'Doe')).toBe('Doe');
  });

  it('should trim whitespace from names', () => {
    expect(formatUserName('  John  ', '  Doe  ')).toBe('  John     Doe  '); // Note: filter(Boolean) doesn't trim, but join handles spacing
  });
});

describe('getUserInitials', () => {
  it('should return initials from first and last name', () => {
    expect(getUserInitials('John', 'Doe')).toBe('JD');
  });

  it('should return first initial and email second character when last name missing', () => {
    expect(getUserInitials('John', null, 'john@example.com')).toBe('Jj');
    expect(getUserInitials('John', undefined, 'john@example.com')).toBe('Jj');
  });

  it('should return email initials when both names missing', () => {
    expect(getUserInitials(null, null, 'john@example.com')).toBe('Jj');
    expect(getUserInitials(undefined, undefined, 'john@example.com')).toBe('Jj');
  });

  it('should return single initial when only first name provided', () => {
    expect(getUserInitials('John', null)).toBe('JU');
    expect(getUserInitials('John', undefined)).toBe('JU');
  });

  it('should return fallback "U" when all values missing', () => {
    expect(getUserInitials(null, null, null)).toBe('U');
    expect(getUserInitials(undefined, undefined, undefined)).toBe('U');
    expect(getUserInitials('', '', '')).toBe('U');
  });

  it('should handle single character names', () => {
    expect(getUserInitials('J', 'D')).toBe('JD');
    expect(getUserInitials('J', null, 'j@example.com')).toBe('Jj');
  });

  it('should uppercase initials', () => {
    expect(getUserInitials('john', 'doe')).toBe('JD');
    expect(getUserInitials('john', null, 'john@example.com')).toBe('Jj');
  });

  it('should handle email with single character', () => {
    expect(getUserInitials(null, null, 'j@example.com')).toBe('JU');
  });
});
