import { type ReactNode } from 'react';
import { cn } from '../../utils';

interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description/helper text */
  description?: string;
  /** Form fields */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a border at the bottom (default: false) */
  bordered?: boolean;
}

/**
 * FormSection Component
 *
 * A wrapper for grouping related form fields with optional title and description.
 *
 * @example
 * ```tsx
 * <FormSection title="Personal Information" description="Your basic contact details">
 *   <Input label="Name" value={name} onChange={setName} />
 *   <Input label="Email" value={email} onChange={setEmail} />
 * </FormSection>
 *
 * <FormSection title="Security Settings">
 *   <Input label="Password" type="password" />
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  children,
  className,
  bordered = false,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        bordered && 'pb-6 border-b border-navy-700',
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-medium text-white">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-navy-400">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * FormRow Component
 *
 * A horizontal row for placing multiple form fields side by side.
 *
 * @example
 * ```tsx
 * <FormRow>
 *   <Input label="First Name" />
 *   <Input label="Last Name" />
 * </FormRow>
 * ```
 */
export function FormRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {children}
    </div>
  );
}

/**
 * FormActions Component
 *
 * Container for form action buttons (Save, Cancel, etc.)
 *
 * @example
 * ```tsx
 * <FormActions>
 *   <Button variant="secondary" onClick={cancel}>Cancel</Button>
 *   <Button variant="primary" onClick={save}>Save Changes</Button>
 * </FormActions>
 * ```
 */
export function FormActions({
  children,
  className,
  align = 'right',
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('flex items-center gap-3 pt-4', alignClasses[align], className)}>
      {children}
    </div>
  );
}
