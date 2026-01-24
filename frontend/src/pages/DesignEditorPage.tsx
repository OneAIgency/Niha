import { DesignEditorLayout } from '../design-editor/DesignEditorLayout';

export function DesignEditorPage() {
  return (
    <DesignEditorLayout
      componentBrowser={
        <div className="p-6">
          <p className="text-navy-600 dark:text-navy-400">
            ComponentBrowser placeholder
          </p>
        </div>
      }
      liveCanvas={
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-navy-600 dark:text-navy-400">
            LiveCanvas placeholder
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
