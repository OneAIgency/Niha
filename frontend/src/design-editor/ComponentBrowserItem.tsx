import type { ComponentMetadata } from '../tools/component-registry';

interface ComponentBrowserItemProps {
  component: ComponentMetadata;
  isSelected: boolean;
  onClick: () => void;
}

export function ComponentBrowserItem({ component, isSelected, onClick }: ComponentBrowserItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl p-3 text-left transition-all ${
        isSelected
          ? 'bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500'
          : 'bg-white dark:bg-navy-700 border border-navy-200 dark:border-navy-600 hover:bg-navy-50 dark:hover:bg-navy-600'
      }`}
    >
      <h3 className="text-sm font-semibold text-navy-900 dark:text-white">
        {component.name}
      </h3>
      <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">
        {component.props.length} props
      </p>
      {component.description && (
        <p className="mt-1 text-xs text-navy-500 dark:text-navy-500">
          {component.description}
        </p>
      )}
    </button>
  );
}
