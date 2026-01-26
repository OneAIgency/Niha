/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';

/**
 * All providers wrapper for testing
 */
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
}

/**
 * Wait for a condition to be true (useful for async operations)
 * Note: For testing-library's waitFor, use the re-exported version from @testing-library/react
 */
export async function waitForCondition(
  callback: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await callback()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitForCondition timed out after ${timeout}ms`);
}

/**
 * Create a mock function that resolves after a delay
 */
export function createDelayedMock<T>(value: T, delay: number = 100) {
  return vi.fn().mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(value), delay))
  );
}

/**
 * Create a mock function that rejects after a delay
 */
export function createDelayedRejection(error: Error, delay: number = 100) {
  return vi.fn().mockImplementation(
    () => new Promise((_, reject) => setTimeout(() => reject(error), delay))
  );
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export userEvent
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default render
export { customRender as render };

// Import vi for mock utilities
import { vi } from 'vitest';
