import { Badge } from './Badge';
import { clientStatusVariant } from '../../utils/roleBadge';

interface ClientStatusBadgeProps {
  /** User role (client status); supports user_role or userRole from API. */
  role: string | undefined;
  className?: string;
}

/**
 * Badge for client status (user_role). Displays role or "—" when missing.
 * Use wherever deposit/client role is shown (cards, tables).
 */
export function ClientStatusBadge({ role, className }: ClientStatusBadgeProps) {
  return (
    <Badge variant={clientStatusVariant(role)} className={className}>
      {role || '—'}
    </Badge>
  );
}
