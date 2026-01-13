import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  icon?: ReactNode;
  iconColor?: 'emerald' | 'blue' | 'amber' | 'purple' | 'red';
  title: string;
  value: string | number;
  valueColor?: 'default' | 'amber' | 'blue' | 'emerald' | 'red';
  subtitle?: string;
  subtitleVariant?: 'default' | 'warning';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'minimal';
  loading?: boolean;
  className?: string;
}

const iconColorStyles = {
  emerald: 'stat-card-icon-emerald',
  blue: 'stat-card-icon-blue',
  amber: 'stat-card-icon-amber',
  purple: 'stat-card-icon-purple',
  red: 'stat-card-icon-red',
};

const valueColorStyles = {
  default: 'text-white',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
};

export function StatCard({
  icon,
  iconColor = 'emerald',
  title,
  value,
  valueColor = 'default',
  subtitle,
  subtitleVariant = 'default',
  trend,
  variant = 'default',
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn(variant === 'default' ? 'card p-4' : 'bg-slate-900/50 rounded-xl p-5', className)}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton variant="avatar" width={40} height={40} />
          <Skeleton variant="text" width="60%" />
        </div>
        <Skeleton variant="textLg" width="80%" />
        <Skeleton variant="text" width="40%" className="mt-2" />
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('bg-slate-900/50 rounded-xl p-5', className)}>
        <div className="section-label mb-3">{title}</div>
        <div className={cn('text-2xl font-semibold font-mono', valueColorStyles[valueColor])}>{value}</div>
        {subtitle && (
          <div className={cn(
            'text-xs mt-2',
            subtitleVariant === 'warning' ? 'text-amber-500/70' : 'text-slate-600'
          )}>
            {subtitle}
          </div>
        )}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-2',
            trend.direction === 'up' ? 'price-positive' : 'price-negative'
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('stat-card-icon', iconColorStyles[iconColor])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="stat-card-label">{title}</div>
          <div className="flex items-center gap-2">
            <span className="stat-card-value">{value}</span>
            {trend && (
              <span className={cn(
                'flex items-center gap-0.5 text-sm',
                trend.direction === 'up' ? 'price-positive' : 'price-negative'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
