import { type HTMLAttributes } from 'react';
import { cn } from '../../utils';

type SkeletonVariant = 'text' | 'textLg' | 'circular' | 'rectangular' | 'card' | 'avatar';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'skeleton-text',
  textLg: 'skeleton-text-lg',
  circular: 'skeleton rounded-full',
  rectangular: 'skeleton',
  card: 'skeleton-card',
  avatar: 'skeleton-avatar',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  const customStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1 && (variant === 'text' || variant === 'textLg')) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(variantStyles[variant], i === lines - 1 && 'w-3/4')}
            style={customStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(variantStyles[variant], className)}
      style={customStyle}
      {...props}
    />
  );
}
