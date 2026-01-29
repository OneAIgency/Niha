import { lazy, Suspense, ComponentType, useMemo } from 'react';
import type { ComponentMetadata } from '../tools/component-registry';

interface ComponentLoaderProps {
  metadata: ComponentMetadata;
  props?: Record<string, unknown>;
}

/**
 * Dynamically loads a component using React.lazy
 */
export function loadComponent(metadata: ComponentMetadata): ComponentType<Record<string, unknown>> {
  // Convert importPath to dynamic import
  // Example: "components/common/Button" -> "../components/common/Button"
  const importPath = `../${metadata.importPath}`;

  return lazy(() =>
    import(/* @vite-ignore */ importPath).then(module => {
      // Try to find the named export matching the component name
      const Component = module[metadata.name] || module.default;

      if (!Component) {
        throw new Error(`Component ${metadata.name} not found in ${importPath}`);
      }

      return { default: Component };
    })
  );
}

/**
 * Renders a dynamically loaded component with Suspense fallback
 */
export function ComponentLoader({ metadata, props = {} }: ComponentLoaderProps) {
  const Component = useMemo(
    () => loadComponent(metadata),
    [metadata.importPath]
  );

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-navy-600 dark:text-navy-400">
              Loading {metadata.name}...
            </p>
          </div>
        </div>
      }
    >
      <Component {...props} />
    </Suspense>
  );
}
