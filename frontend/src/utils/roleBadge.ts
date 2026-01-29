/**
 * Client status (user_role) badge helpers.
 * Single source of truth for role → Badge variant mapping; FUNDING when user announced transfer.
 */

export type ClientStatusVariant = 'default' | 'warning' | 'success' | 'info';

/**
 * Maps user role to Badge variant for client status display.
 * Used by PendingDepositsTab, AMLDepositsTab, BackofficeDepositsPage.
 */
export function clientStatusVariant(role: string | undefined): ClientStatusVariant {
  if (!role) return 'default';
  switch (role) {
    case 'FUNDING':
      return 'warning';
    case 'APPROVED':
    case 'AML':
      return 'info';
    case 'KYC':
    case 'NDA':
      return 'warning';
    default:
      return 'default';
  }
}
