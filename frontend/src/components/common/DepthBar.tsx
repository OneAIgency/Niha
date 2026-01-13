import { cn } from '../../utils';

interface DepthBarProps {
  percentage: number;
  side: 'bid' | 'ask';
  className?: string;
}

export function DepthBar({
  percentage,
  side,
  className,
}: DepthBarProps) {
  const barClass = side === 'bid' ? 'depth-bar-bid' : 'depth-bar-ask';

  return (
    <div
      className={cn(barClass, className)}
      style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
    />
  );
}
