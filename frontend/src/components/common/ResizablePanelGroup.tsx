/**
 * Resizable panel group wrapper.
 * Uses react-resizable-panels with navy/emerald styling per design system.
 * Persists layout to localStorage via niha_layout_{storageKey}.
 */

import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import { createLayoutStorage } from '../../hooks/useLayoutStorage';

const DEFAULT_MIN_SIZE = 15;

export interface ResizablePanelGroupProps {
  /** Horizontal or vertical layout */
  direction: 'horizontal' | 'vertical';
  /** localStorage key suffix (full key: niha_layout_{storageKey}) */
  storageKey: string;
  /** Default sizes as percentages 0–100 (must sum to 100) */
  defaultSizes: number[];
  /** Minimum size per panel (default 15) */
  minSize?: number;
  /** Panel contents; one child per panel */
  children: React.ReactNode[];
  /** Optional className for the group container */
  className?: string;
}

/**
 * Vertical resize handle styling (col-resize).
 * Design system: border navy-700, hover navy-600, 4–6px width.
 */
const verticalHandleClass =
  'w-1.5 shrink-0 bg-navy-700 hover:bg-navy-600 transition-colors cursor-col-resize data-[separator]:flex data-[separator]:items-center data-[separator]:justify-center';

/**
 * Horizontal resize handle styling (row-resize).
 */
const horizontalHandleClass =
  'h-1.5 shrink-0 bg-navy-700 hover:bg-navy-600 transition-colors cursor-row-resize data-[separator]:flex data-[separator]:items-center data-[separator]:justify-center';

export function ResizablePanelGroup({
  direction,
  storageKey,
  defaultSizes,
  minSize = DEFAULT_MIN_SIZE,
  children,
  className = '',
}: ResizablePanelGroupProps) {
  const orientation = direction === 'horizontal' ? 'horizontal' : 'vertical';
  const panelIds = children.map((_, i) => `p${i}`);

  const layoutHook = useDefaultLayout({
    id: storageKey,
    panelIds,
    storage: createLayoutStorage(storageKey),
  });

  const handleClass = orientation === 'horizontal' ? verticalHandleClass : horizontalHandleClass;

  const fallbackSize = 100 / Math.max(1, children.length);
  const elements: React.ReactNode[] = [];
  children.forEach((child, i) => {
    if (i > 0) {
      elements.push(
        <Separator key={`sep-${i}`} id={`s${i}`} className={handleClass} />
      );
    }
    const size = defaultSizes[i] ?? fallbackSize;
    elements.push(
      <Panel
        key={`panel-${i}`}
        id={panelIds[i]}
        defaultSize={size}
        minSize={minSize}
        className="min-h-0 min-w-0 flex flex-col overflow-hidden"
      >
        {child}
      </Panel>
    );
  });

  return (
    <Group
      orientation={orientation}
      className={`flex flex-1 min-h-0 min-w-0 ${className}`}
      defaultLayout={layoutHook.defaultLayout}
      onLayoutChanged={layoutHook.onLayoutChanged}
    >
      {elements}
    </Group>
  );
}
