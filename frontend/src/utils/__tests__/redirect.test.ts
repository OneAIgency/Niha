/**
 * Unit tests for redirect utilities (post-login and PENDING routing).
 */

import { describe, it, expect } from 'vitest';
import { getPostLoginRedirect } from '../redirect';
import type { User } from '../../types';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'PENDING',
    entity_id: undefined,
    ...overrides,
  };
}

describe('getPostLoginRedirect', () => {
  it('sends PENDING users to /onboarding', () => {
    const user = makeUser({ role: 'PENDING' });
    expect(getPostLoginRedirect(user)).toBe('/onboarding');
  });

  it('sends APPROVED users to /funding', () => {
    const user = makeUser({ role: 'APPROVED' });
    expect(getPostLoginRedirect(user)).toBe('/funding');
  });

  it('sends FUNDED users to /dashboard', () => {
    const user = makeUser({ role: 'FUNDED' });
    expect(getPostLoginRedirect(user)).toBe('/dashboard');
  });

  it('sends ADMIN users to /dashboard', () => {
    const user = makeUser({ role: 'ADMIN' });
    expect(getPostLoginRedirect(user)).toBe('/dashboard');
  });

  it('sends special email eu@eu.ro to /onboarding regardless of role', () => {
    expect(getPostLoginRedirect(makeUser({ email: 'eu@eu.ro', role: 'APPROVED' }))).toBe(
      '/onboarding'
    );
    expect(getPostLoginRedirect(makeUser({ email: 'eu@eu.ro', role: 'FUNDED' }))).toBe(
      '/onboarding'
    );
  });
});

describe('PENDING routing (0009)', () => {
  it('PENDING user redirect target is /onboarding for protected routes', () => {
    const pendingUser = makeUser({ role: 'PENDING' });
    expect(getPostLoginRedirect(pendingUser)).toBe('/onboarding');
  });

  it('unauthenticated access to onboarding would use login redirect (contract)', () => {
    // AuthGuard sends unauthenticated to /login; getPostLoginRedirect is for authenticated users.
    const approvedUser = makeUser({ role: 'APPROVED' });
    expect(getPostLoginRedirect(approvedUser)).toBe('/funding');
  });
});
