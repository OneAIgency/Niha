import { cn } from '../../utils';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant = 'dark', size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div
      className={cn('font-bold tracking-tight flex items-center', sizes[size], className)}
    >
      <span className={variant === 'dark' ? 'text-navy-900' : 'text-white'}>
        NIHAO
      </span>
      <span className="text-emerald-500">GROUP</span>
    </div>
  );
}
