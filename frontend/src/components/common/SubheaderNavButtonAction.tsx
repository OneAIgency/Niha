import { cn } from '../../utils';

interface SubheaderNavButtonActionProps {
  /** Label shown on hover (inactive) or always (active) */
  label: string;
  /** Icon element (e.g. Lucide icon) */
  icon: React.ReactNode;
  /** When true, shows icon + label; when false, icon only with label on hover */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Navigation level: 'subheader' (default) or 'subsubheader' for nested nav */
  level?: 'subheader' | 'subsubheader';
}

/**
 * Action button for subheader/subsubheader: icon-only by default, label on hover.
 * When active, shows both icon and label.
 * Same styling as SubheaderNavButton but uses onClick instead of navigation.
 *
 * Use level="subsubheader" for section navigation under the main subheader nav.
 */
export function SubheaderNavButtonAction({ label, icon, isActive, onClick, level = 'subheader' }: SubheaderNavButtonActionProps) {
  const baseClass = level === 'subsubheader' ? 'subsubheader-nav-btn' : 'subheader-nav-btn';
  const activeClass = level === 'subsubheader' ? 'subsubheader-nav-btn-active' : 'subheader-nav-btn-active';
  const inactiveClass = level === 'subsubheader' ? 'subsubheader-nav-btn-inactive' : 'subheader-nav-btn-inactive';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={cn(
        'group',
        baseClass,
        isActive ? activeClass : inactiveClass
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
    </button>
  );
}
