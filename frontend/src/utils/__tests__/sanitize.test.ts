/**
 * Tests for sanitization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObject,
  sanitizeFormData,
} from '../sanitize';

describe('sanitizeString', () => {
  it('should remove null bytes', () => {
    expect(sanitizeString('test\0string')).toBe('teststring');
  });

  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeString(input)).not.toContain('<script>');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>';
    expect(sanitizeString(input)).not.toContain('onclick');
  });

  it('should remove javascript: protocol', () => {
    const input = 'javascript:alert(1)';
    expect(sanitizeString(input)).not.toContain('javascript:');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  test  ')).toBe('test');
  });
});

describe('sanitizeEmail', () => {
  it('should validate and sanitize valid email', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('should return empty string for invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBe('');
  });

  it('should handle empty string', () => {
    expect(sanitizeEmail('')).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('should parse valid numbers', () => {
    expect(sanitizeNumber('123.45')).toBe(123.45);
    expect(sanitizeNumber(123.45)).toBe(123.45);
  });

  it('should return null for invalid numbers', () => {
    expect(sanitizeNumber('not-a-number')).toBeNull();
    expect(sanitizeNumber(NaN)).toBeNull();
  });

  it('should handle null and undefined', () => {
    expect(sanitizeNumber(null)).toBeNull();
    expect(sanitizeNumber(undefined)).toBeNull();
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string values in object', () => {
    const input = {
      name: '<script>alert(1)</script>',
      // Note: sanitizeObject uses sanitizeString (XSS protection), NOT sanitizeEmail
      // Email normalization should be done explicitly with sanitizeEmail
      email: 'Test@Example.COM',
      age: 25,
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('<script>');
    // sanitizeObject preserves email case - use sanitizeEmail explicitly for normalization
    expect(result.email).toBe('Test@Example.COM');
    expect(result.age).toBe(25);
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: '<script>alert(1)</script>',
      },
    };
    const result = sanitizeObject(input);
    expect(result.user.name).not.toContain('<script>');
  });
});

describe('sanitizeFormData', () => {
  it('should sanitize form data object', () => {
    const formData = {
      entity_name: '  Test Entity  ',
      // Note: sanitizeFormData uses sanitizeObject which uses sanitizeString
      // Email normalization should be done explicitly with sanitizeEmail
      contact_email: 'Test@Example.COM',
      position: '<script>alert(1)</script>',
    };
    const result = sanitizeFormData(formData);
    expect(result.entity_name).toBe('Test Entity');
    // sanitizeFormData preserves email case - use sanitizeEmail explicitly for normalization
    expect(result.contact_email).toBe('Test@Example.COM');
    expect(result.position).not.toContain('<script>');
  });
});
