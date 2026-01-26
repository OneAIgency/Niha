/**
 * MSW Server Configuration
 * Sets up the mock service worker for Node.js testing environment
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create and export the server instance
export const server = setupServer(...handlers);
