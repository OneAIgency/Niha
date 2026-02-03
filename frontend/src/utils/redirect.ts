import type { User } from '../types';

/**
 * Determines the appropriate redirect path after user login based on user role and email.
 * 
 * This function centralizes the redirect logic to prevent mismatches between
 * LoginPage and route guards (e.g., DashboardRoute). All redirect logic should
 * use this function to ensure consistency.
 * 
 * @param user - The authenticated user object
 * @returns The path to redirect to after login
 * 
 * @example
 * ```typescript
 * const redirectPath = getPostLoginRedirect(user);
 * navigate(redirectPath, { replace: true });
 * ```
 */
export function getPostLoginRedirect(user: User): string {
  // Rejected: no access
  if (user.role === 'REJECTED') {
    return '/login';
  }

  // NDA, KYC: onboarding (KYC form)
  if (user.role === 'NDA' || user.role === 'KYC') {
    return '/onboarding';
  }

  // APPROVED, FUNDING, AML: funding page
  if (user.role === 'APPROVED' || user.role === 'FUNDING' || user.role === 'AML') {
    return '/funding';
  }

  // CEA, CEA_SETTLE: dashboard
  if (user.role === 'CEA' || user.role === 'CEA_SETTLE') {
    return '/dashboard';
  }

  // SWAP: swap page (can execute CEA→EUA swap)
  if (user.role === 'SWAP') {
    return '/swap';
  }

  // EUA_SETTLE: dashboard (waiting for EUA settlement, no swap access)
  if (user.role === 'EUA_SETTLE') {
    return '/dashboard';
  }

  // MM (Market Maker), EUA, ADMIN: full access → dashboard
  return '/dashboard';
}
