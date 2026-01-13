import { type ReactNode } from 'react';
import { cn } from '../../utils';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'toggle' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}: TabsProps) {
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const paddingStyles = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  if (variant === 'toggle') {
    return (
      <div className={cn('tab-toggle', fullWidth && 'w-full', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'tab-toggle-item',
              sizeStyles[size],
              fullWidth && 'flex-1',
              activeTab === tab.id ? 'bg-slate-800 text-white' : 'tab-toggle-item-inactive',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 bg-navy-200 dark:bg-navy-600 rounded text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={cn('tab-group', fullWidth && 'w-full', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'tab-button flex items-center gap-2',
              paddingStyles[size],
              sizeStyles[size],
              fullWidth && 'flex-1 justify-center',
              activeTab === tab.id ? 'tab-button-active' : 'tab-button-inactive',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-navy-200 dark:border-navy-700', fullWidth && 'w-full', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-2 -mb-px transition-colors',
              paddingStyles[size],
              sizeStyles[size],
              fullWidth && 'flex-1 justify-center',
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 bg-navy-100 dark:bg-navy-700 rounded text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex gap-1', fullWidth && 'w-full', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-2 rounded-lg transition-colors',
            paddingStyles[size],
            sizeStyles[size],
            fullWidth && 'flex-1 justify-center',
            activeTab === tab.id
              ? 'bg-navy-100 dark:bg-navy-700 text-navy-900 dark:text-white'
              : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800',
            tab.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="px-1.5 py-0.5 bg-navy-200 dark:bg-navy-600 rounded text-xs">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
