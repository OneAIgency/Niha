import React from 'react';

interface DesignEditorLayoutProps {
  componentBrowser: React.ReactNode;
  liveCanvas: React.ReactNode;
  propsPanel: React.ReactNode;
  codeGenerator: React.ReactNode;
}

export function DesignEditorLayout({
  componentBrowser,
  liveCanvas,
  propsPanel,
  codeGenerator
}: DesignEditorLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-navy-50 dark:bg-navy-900">
      {/* Header */}
      <header className="border-b border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          Design Editor
        </h1>
        <p className="text-sm text-navy-600 dark:text-navy-400">
          Interactive component development environment
        </p>
      </header>

      {/* Main Content - 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - ComponentBrowser */}
        <aside className="w-80 border-r border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800">
          {componentBrowser}
        </aside>

        {/* Center Panel - LiveCanvas + CodeGenerator */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">{liveCanvas}</div>
          <div className="h-80 border-t border-navy-200 dark:border-navy-700">
            {codeGenerator}
          </div>
        </main>

        {/* Right Sidebar - PropsPanel */}
        <aside className="w-96 border-l border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800">
          {propsPanel}
        </aside>
      </div>
    </div>
  );
}
