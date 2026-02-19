/**
 * Layout persistence for ResizablePanelGroup.
 * Uses localStorage with key niha_layout_{storageKey}.
 * On mobile (viewport < 768px) no persistence is applied.
 */

const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export type LayoutStorage = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
};

/**
 * Creates a layout storage adapter for react-resizable-panels.
 * Key format: niha_layout_{storageKey}
 * Validates stored JSON; returns null on parse error or mobile.
 */
export function createLayoutStorage(storageKey: string): LayoutStorage {
  const fullKey = `niha_layout_${storageKey}`;

  return {
    getItem(_name: string): string | null {
      if (isMobileViewport()) return null;
      try {
        const raw = localStorage.getItem(fullKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (typeof parsed !== 'object' || parsed === null) return null;
        const valid: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 0 && n <= 100) valid[k] = n;
        }
        return Object.keys(valid).length > 0 ? JSON.stringify(valid) : null;
      } catch {
        return null;
      }
    },
    setItem(_name: string, value: string): void {
      if (isMobileViewport()) return;
      try {
        localStorage.setItem(fullKey, value);
      } catch {
        // quota exceeded or private mode
      }
    },
  };
}
