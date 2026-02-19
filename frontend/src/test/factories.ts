/**
 * Test factories for building mock API/domain objects.
 * Contact request state: use userRole only (NDA, KYC, REJECTED).
 */

import type { ContactRequest } from '../types/backoffice';

export function createMockContactRequest(
  overrides: Partial<ContactRequest> = {}
): ContactRequest {
  return {
    id: 'req-1',
    entityName: 'Test Entity',
    contactEmail: 'contact@test.com',
    contactName: 'Test Contact',
    position: 'Director',
    userRole: 'NDA',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
