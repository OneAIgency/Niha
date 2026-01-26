import { type ReactNode } from 'react';
import { cn } from '../../utils';

interface SubSubHeaderProps {
  /** Left-aligned content (e.g. CEA|EUA toggle, filters) */
  left?: ReactNode;
  /** Right-aligned content (actions, buttons). When `left` is set, use justify-between. */
  children?: ReactNode;
  /** Optional additional className for the container */
  className?: string;
}

/**
 * SubSubHeader Component
 *
 * A bar rendered under the dashboard Subheader, containing page-specific
 * elements (actions, filters, etc.). Do not put page-specific content
 * in the dashboard Subheader; use SubSubHeader instead.
 *
 * Use `left` for left-aligned content; `children` for right-aligned.
 *
 * @example
 * ```tsx
 * <SubSubHeader left={<Toggle />}>
 *   <Button onClick={onRefresh}>Refresh</Button>
 * </SubSubHeader>
 * ```
 */
export function SubSubHeader({ left, children, className }: SubSubHeaderProps) {
  return (
    <div
      className={cn(
        'bg-navy-900/80 border-b border-navy-800 px-6 py-3',
        className
      )}
    >
      <div
        className={cn(
          'max-w-7xl w-full mx-auto flex flex-wrap items-center gap-4 text-sm',
          left != null ? 'justify-between' : 'justify-end'
        )}
      >
        {left != null ? <div>{left}</div> : null}
        {children != null ? <div className="flex flex-wrap items-center gap-4">{children}</div> : null}
      </div>
    </div>
  );
}
