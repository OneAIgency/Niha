/**
 * Authentication constants
 * 
 * Centralized constants for authentication token storage to ensure
 * consistency across the application.
 */

/**
 * Storage key for authentication token in sessionStorage.
 * 
 * Note: Using sessionStorage instead of localStorage for better security.
 * TODO: Migrate to httpOnly cookies for production.
 */
export const TOKEN_KEY = 'auth_token';
