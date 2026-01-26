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
  // Send specific users to onboarding (special case)
  if (user.email === 'eu@eu.ro') {
    return '/onboarding';
  }

  // PENDING users go to onboarding
  if (user.role === 'PENDING') {
    return '/onboarding';
  }

  // APPROVED users go to funding page
  if (user.role === 'APPROVED') {
    return '/funding';
  }

  // FUNDED and ADMIN users go to dashboard
  return '/dashboard';
}
