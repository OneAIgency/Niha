import { useState } from 'react';
import { DesignEditorLayout } from '../design-editor/DesignEditorLayout';
import { ComponentBrowser } from '../design-editor/ComponentBrowser';
import { LiveCanvas } from '../design-editor/LiveCanvas';
import type { ComponentMetadata } from '../tools/component-registry';

export function DesignEditorPage() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentMetadata | null>(null);
  const [componentProps, setComponentProps] = useState<Record<string, any>>({});

  return (
    <DesignEditorLayout
      componentBrowser={
        <ComponentBrowser
          selectedComponent={selectedComponent}
          onSelectComponent={(component) => {
            setSelectedComponent(component);
            // Reset props when component changes
            setComponentProps({});
          }}
        />
      }
      liveCanvas={
        <LiveCanvas
          selectedComponent={selectedComponent}
          componentProps={componentProps}
        />
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
