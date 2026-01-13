import { type HTMLAttributes } from 'react';
import { cn } from '../../utils';

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function Divider({
  orientation = 'horizontal',
  size = 'md',
  className,
  ...props
}: DividerProps) {
  const sizeStyles = {
    horizontal: {
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-6',
    },
    vertical: {
      sm: 'mx-2 h-4',
      md: 'mx-4 h-6',
      lg: 'mx-6 h-10',
    },
  };

  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'divider-horizontal w-full' : 'divider-vertical',
        sizeStyles[orientation][size],
        className
      )}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
}
