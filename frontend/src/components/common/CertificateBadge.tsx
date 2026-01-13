import { cn } from '../../utils';

type CertificateType = 'EUA' | 'CEA';

interface CertificateBadgeProps {
  type: CertificateType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'solid';
  className?: string;
}

const sizeStyles = {
  sm: 'cert-badge',
  md: 'px-3 py-1 text-sm font-bold rounded-lg',
  lg: 'cert-badge-lg',
};

const typeStyles = {
  EUA: {
    default: 'cert-badge-eua',
    outline: 'border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-transparent',
    solid: 'bg-blue-500 text-white',
  },
  CEA: {
    default: 'cert-badge-cea',
    outline: 'border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-transparent',
    solid: 'bg-amber-500 text-white',
  },
};

const labels = {
  EUA: 'EU Allowances',
  CEA: 'China Allowances',
};

export function CertificateBadge({
  type,
  size = 'sm',
  showLabel = false,
  variant = 'default',
  className,
}: CertificateBadgeProps) {
  const baseClass = size === 'sm' ? typeStyles[type][variant] : sizeStyles[size];
  const colorClass = size !== 'sm' ? typeStyles[type][variant] : '';

  return (
    <span className={cn(
      'inline-flex items-center gap-2',
      size === 'sm' && baseClass,
      size !== 'sm' && baseClass,
      size !== 'sm' && colorClass,
      className
    )}>
      {type}
      {showLabel && <span className="text-xs font-normal opacity-75">{labels[type]}</span>}
    </span>
  );
}
