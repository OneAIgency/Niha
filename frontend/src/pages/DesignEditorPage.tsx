import { useState } from 'react';
import { DesignEditorLayout } from '../design-editor/DesignEditorLayout';
import { ComponentBrowser } from '../design-editor/ComponentBrowser';
import { LiveCanvas } from '../design-editor/LiveCanvas';
import { PropsPanel } from '../design-editor/PropsPanel';
import { CodeGenerator } from '../design-editor/CodeGenerator';
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
          component={selectedComponent}
          componentProps={componentProps}
        />
      }
      propsPanel={
        <PropsPanel
          component={selectedComponent}
          props={componentProps}
          onPropsChange={setComponentProps}
        />
      }
      codeGenerator={
        <CodeGenerator
          component={selectedComponent}
          props={componentProps}
        />
      }
    />
  );
}
