/**
 * Test utilities – re-export @testing-library/react for consistent imports.
 * Extend with custom render (e.g. Router/theme wrapper) if needed.
 */
export {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
