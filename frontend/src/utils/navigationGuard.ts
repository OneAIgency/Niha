/**
 * Navigation guard utility to prevent IPC flooding from excessive navigations
 *
 * This module provides a global mechanism to prevent multiple rapid navigations
 * that can trigger browser throttling warnings.
 */

import { logger } from './logger';

// Global flag to track if navigation is in progress
let isNavigating = false;
let navigationTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Checks if navigation is currently in progress
 */
export function isNavigationInProgress(): boolean {
  return isNavigating;
}

/**
 * Marks navigation as in progress and sets a timeout to reset the flag
 * This prevents multiple rapid navigations that cause IPC flooding
 */
export function setNavigationInProgress(): void {
  logger.debug('[NavigationGuard] Setting navigation in progress');
  isNavigating = true;

  // Clear existing timeout if any
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }

  // Reset flag after a short delay to allow navigation to complete
  // Reduced timeout to allow faster navigation while still preventing rapid successive navigations
  navigationTimeout = setTimeout(() => {
    logger.debug('[NavigationGuard] Navigation timeout elapsed, resetting flag');
    isNavigating = false;
    navigationTimeout = null;
  }, 150); // 150ms should be enough for navigation to complete and prevent rapid successive navigations
}

/**
 * Resets the navigation flag immediately
 * Use this when navigation is cancelled or fails
 */
export function resetNavigationFlag(): void {
  logger.debug('[NavigationGuard] Resetting navigation flag immediately');
  isNavigating = false;
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }
}
