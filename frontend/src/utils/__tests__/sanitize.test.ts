/**
 * Tests for sanitization utilities
 * Tests match actual DOMPurify-based implementation behavior.
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
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeString(input)).not.toContain('<script>');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>';
    expect(sanitizeString(input)).not.toContain('onclick');
  });

  it('should strip all HTML tags', () => {
    const input = '<b>bold</b> and <i>italic</i>';
    expect(sanitizeString(input)).toBe('bold and italic');
  });

  it('should pass through plain text unchanged', () => {
    expect(sanitizeString('hello world')).toBe('hello world');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should sanitize and lowercase valid email', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('should lowercase any string input', () => {
    // sanitizeEmail strips HTML and lowercases; does not validate format
    expect(sanitizeEmail('not-an-email')).toBe('not-an-email');
  });

  it('should handle empty string', () => {
    expect(sanitizeEmail('')).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeEmail(null)).toBe('');
    expect(sanitizeEmail(undefined)).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('should parse valid numbers', () => {
    expect(sanitizeNumber('123.45')).toBe(123.45);
    expect(sanitizeNumber(123.45)).toBe(123.45);
  });

  it('should return default (0) for invalid numbers', () => {
    expect(sanitizeNumber('not-a-number')).toBe(0);
    expect(sanitizeNumber(NaN)).toBe(0);
  });

  it('should return default (0) for null and undefined', () => {
    expect(sanitizeNumber(null)).toBe(0);
    expect(sanitizeNumber(undefined)).toBe(0);
  });

  it('should use custom default value', () => {
    expect(sanitizeNumber(null, -1)).toBe(-1);
    expect(sanitizeNumber('bad', 42)).toBe(42);
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string values in object', () => {
    const input = {
      name: '<script>alert(1)</script>',
      email: 'Test@Example.COM',
      age: 25,
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('<script>');
    // sanitizeObject uses sanitizeString (XSS strip), not sanitizeEmail
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
  it('should strip HTML from form data values', () => {
    const formData = {
      entity_name: 'Test Entity',
      contact_email: 'Test@Example.COM',
      position: '<script>alert(1)</script>',
    };
    const result = sanitizeFormData(formData);
    expect(result.entity_name).toBe('Test Entity');
    // sanitizeFormData uses sanitizeString (XSS strip), preserves case
    expect(result.contact_email).toBe('Test@Example.COM');
    expect(result.position).not.toContain('<script>');
  });
});
