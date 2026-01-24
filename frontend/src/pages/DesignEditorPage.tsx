import { useState } from 'react';
import { DesignEditorLayout } from '../design-editor/DesignEditorLayout';
import { ComponentBrowser } from '../design-editor/ComponentBrowser';
import type { ComponentMetadata } from '../tools/component-registry';

export function DesignEditorPage() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentMetadata | null>(null);

  return (
    <DesignEditorLayout
      componentBrowser={
        <ComponentBrowser
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
        />
      }
      liveCanvas={
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-navy-600 dark:text-navy-400">
            {selectedComponent
              ? `Selected: ${selectedComponent.name}`
              : 'Select a component to preview'}
          </p>
        </div>
      }
      propsPanel={
        <div className="p-6">
          <p className="text-navy-600 dark:text-navy-400">
            PropsPanel placeholder
          </p>
        </div>
      }
      codeGenerator={
        <div className="p-6">
          <p className="text-navy-600 dark:text-navy-400">
            CodeGenerator placeholder
          </p>
        </div>
      }
    />
  );
}
