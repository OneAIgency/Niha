import { Link } from 'react-router-dom';
import { cn } from '../../utils';

interface SubheaderNavButtonProps {
  /** Target path */
  to: string;
  /** Page name shown on hover (inactive) or always (active) */
  label: string;
  /** Icon element (e.g. Lucide icon) */
  icon: React.ReactNode;
  /** When true, shows icon + label; when false, icon only with label on hover */
  isActive: boolean;
}

/**
 * Nav button for subheader: icon-only by default, label on hover.
 * When active, shows both icon and label.
 */
export function SubheaderNavButton({ to, label, icon, isActive }: SubheaderNavButtonProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      className={cn(
        'group subheader-nav-btn',
        isActive ? 'subheader-nav-btn-active' : 'subheader-nav-btn-inactive'
      )}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span
        className={cn(
          'whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200',
          isActive
            ? 'max-w-[14rem] opacity-100'
            : 'max-w-0 opacity-0 group-hover:max-w-[14rem] group-hover:opacity-100'
        )}
      >
        {label}
      </span>
    </Link>
  );
}
