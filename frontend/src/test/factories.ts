/**
 * Test factories for building mock API/domain objects.
 * Contact request state: use user_role only (NDA, KYC, REJECTED).
 */

export function createMockContactRequest(
  overrides: Partial<{
    id: string;
    entity_name: string;
    contact_email: string;
    contact_name: string;
    position: string;
    nda_file_name: string;
    submitter_ip: string;
    user_role: string;
    notes: string;
    created_at: string;
  }> = {}
) {
  return {
    id: 'req-1',
    entity_name: 'Test Entity',
    contact_email: 'contact@test.com',
    contact_name: 'Test Contact',
    position: 'Director',
    nda_file_name: undefined as string | undefined,
    submitter_ip: undefined as string | undefined,
    user_role: 'NDA',
    notes: undefined as string | undefined,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
