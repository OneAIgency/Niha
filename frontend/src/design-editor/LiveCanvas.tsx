import { useState } from 'react';
import { Monitor, Tablet, Smartphone, Sun, Moon } from 'lucide-react';
import { ComponentLoader } from './ComponentLoader';
import type { ComponentMetadata } from '../tools/component-registry';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface LiveCanvasProps {
  component: ComponentMetadata | null;
  componentProps: Record<string, any>;
}

const VIEWPORT_SIZES = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

const VIEWPORT_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export function LiveCanvas({ component, componentProps }: LiveCanvasProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="flex h-full flex-col bg-navy-50 dark:bg-navy-900">
      {/* Controls Bar */}
      <div className="flex items-center justify-between border-b border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
            Viewport:
          </span>
          {(Object.keys(VIEWPORT_SIZES) as Viewport[]).map((v) => {
            const Icon = VIEWPORT_ICONS[v];
            return (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={`rounded-lg p-2 transition-all ${
                  viewport === v
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700'
                }`}
                aria-label={`${v} viewport`}
                aria-pressed={viewport === v}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          className="rounded-lg p-2 text-navy-600 dark:text-navy-400 transition-all hover:bg-navy-100 dark:hover:bg-navy-700"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex h-full items-center justify-center">
          {component ? (
            <div
              className={`${VIEWPORT_SIZES[viewport]} transition-all duration-300 ${
                isDark ? 'dark' : ''
              }`}
            >
              <div className="rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-lg">
                <ComponentLoader
                  metadata={component}
                  props={componentProps}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Monitor className="mx-auto h-16 w-16 text-navy-300 dark:text-navy-600 mb-4" />
              <p className="text-lg font-medium text-navy-600 dark:text-navy-400">
                No component selected
              </p>
              <p className="mt-2 text-sm text-navy-500 dark:text-navy-500">
                Select a component from the browser to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Component Info Footer */}
      {component && (
        <div className="border-t border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-navy-600 dark:text-navy-400">
            <span>Path: {component.path}</span>
            <span>{component.props.length} props</span>
          </div>
        </div>
      )}
    </div>
  );
}
