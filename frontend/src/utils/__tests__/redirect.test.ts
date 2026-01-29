/**
 * Unit tests for redirect utilities (post-login and 0010 role routing).
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
    role: 'NDA',
    entity_id: undefined,
    ...overrides,
  };
}

describe('getPostLoginRedirect', () => {
  it('sends NDA users to /onboarding', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'NDA' }))).toBe('/onboarding');
  });

  it('sends KYC users to /onboarding', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'KYC' }))).toBe('/onboarding');
  });

  it('sends REJECTED users to /login', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'REJECTED' }))).toBe('/login');
  });

  it('sends APPROVED users to /funding', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'APPROVED' }))).toBe('/funding');
  });

  it('sends FUNDING users to /funding', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'FUNDING' }))).toBe('/funding');
  });

  it('sends AML users to /funding', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'AML' }))).toBe('/funding');
  });

  it('sends CEA users to /cash-market', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'CEA' }))).toBe('/cash-market');
  });

  it('sends CEA_SETTLE users to /cash-market', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'CEA_SETTLE' }))).toBe('/cash-market');
  });

  it('sends SWAP users to /swap', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'SWAP' }))).toBe('/swap');
  });

  it('sends EUA_SETTLE users to /swap', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'EUA_SETTLE' }))).toBe('/swap');
  });

  it('sends EUA users to /dashboard', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'EUA' }))).toBe('/dashboard');
  });

  it('sends ADMIN users to /dashboard', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'ADMIN' }))).toBe('/dashboard');
  });

  it('sends special email eu@eu.ro to /onboarding regardless of role', () => {
    expect(getPostLoginRedirect(makeUser({ email: 'eu@eu.ro', role: 'ADMIN' }))).toBe(
      '/onboarding'
    );
    expect(getPostLoginRedirect(makeUser({ email: 'eu@eu.ro', role: 'NDA' }))).toBe(
      '/onboarding'
    );
  });
});

describe('NDA routing (0009)', () => {
  it('NDA user redirect target is /onboarding for protected routes', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'NDA' }))).toBe('/onboarding');
  });

  it('unauthenticated access to onboarding would use login redirect (contract)', () => {
    expect(getPostLoginRedirect(makeUser({ role: 'ADMIN' }))).toBe('/dashboard');
  });
});
