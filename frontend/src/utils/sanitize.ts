/**
 * Sanitization utilities for XSS prevention
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}

/**
 * Sanitize a string for use in text content (strips all HTML)
 * @param dirty - Untrusted string that may contain HTML
 * @returns Plain text with all HTML stripped
 */
export function sanitizeString(dirty: string | null | undefined): string {
  if (dirty == null) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate a CSS custom property name (--variable-name format)
 * @param name - CSS variable name to validate
 * @returns true if valid CSS variable name
 */
export function isValidCssVariableName(name: string): boolean {
  // Must start with -- and contain only valid CSS identifier characters
  // Valid: letters, digits, hyphens, underscores (after the --)
  return /^--[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * Validate a CSS value (prevents injection of scripts or other malicious content)
 * @param value - CSS value to validate
 * @returns true if value appears safe for CSS
 */
export function isValidCssValue(value: string): boolean {
  // Block dangerous patterns
  const dangerousPatterns = [
    /url\s*\(/i,           // url() - can load external resources
    /expression\s*\(/i,    // expression() - IE JavaScript execution
    /javascript\s*:/i,     // javascript: protocol
    /@import/i,            // @import - can load external stylesheets
    /behavior\s*:/i,       // behavior: - IE HTC files
    /-moz-binding/i,       // -moz-binding - XBL bindings
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize CSS variable entries for safe injection
 * @param entries - Array of [name, value] pairs
 * @returns Filtered array with only safe entries
 */
export function sanitizeCssVariables(
  entries: [string, string][]
): [string, string][] {
  return entries.filter(([name, value]) => {
    const validName = isValidCssVariableName(name);
    const validValue = isValidCssValue(value);

    if (!validName) {
      console.warn(`[Sanitize] Invalid CSS variable name blocked: ${name}`);
    }
    if (!validValue) {
      console.warn(`[Sanitize] Unsafe CSS value blocked for ${name}`);
    }

    return validName && validValue;
  });
}

/**
 * Sanitize an email address by trimming whitespace, converting to lowercase,
 * and stripping any HTML/script content
 * @param email - Email address to sanitize
 * @returns Sanitized email string, or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (email == null) return '';
  // Strip HTML tags and trim whitespace
  const cleaned = DOMPurify.sanitize(email, { ALLOWED_TAGS: [] }).trim().toLowerCase();
  return cleaned;
}

/**
 * Sanitize a number by ensuring it's a valid finite number
 * @param value - Value to sanitize (can be number, string, null, or undefined)
 * @param defaultValue - Default value to return if input is invalid (default: 0)
 * @returns Sanitized number value
 */
export function sanitizeNumber(
  value: number | string | null | undefined,
  defaultValue: number = 0
): number {
  if (value == null) return defaultValue;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return defaultValue;
  }

  return num;
}

/**
 * Sanitize an object by recursively sanitizing all string values
 * Non-string values are passed through unchanged
 * @param obj - Object to sanitize
 * @returns New object with all string values sanitized
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value !== null && typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Sanitize form data by sanitizing all string field values
 * Specifically designed for form submissions to prevent XSS
 * @param formData - Form data object with string values
 * @returns New object with all string values sanitized
 */
export function sanitizeFormData<T extends Record<string, string>>(formData: T): T {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(formData)) {
    result[key] = sanitizeString(value);
  }

  return result as T;
}
