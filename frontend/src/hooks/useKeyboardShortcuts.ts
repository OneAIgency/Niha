import { useEffect, useRef, useCallback, useState } from 'react';

export interface Shortcut {
  key: string;            // e.g. 'r', 'b', 'Escape'
  label: string;          // Display label for help overlay, e.g. 'R'
  description: string;    // What it does
  handler: () => void;
  ctrl?: boolean;
  shift?: boolean;
  /** If true, shortcut fires even when an input/textarea is focused */
  global?: boolean;
}

/**
 * Registers keyboard shortcuts and returns a help toggle.
 * The `?` key is automatically bound to toggle the help overlay.
 * Shortcuts are suppressed when the user is typing in an input/textarea
 * unless the shortcut is marked `global: true`.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [helpOpen, setHelpOpen] = useState(false);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const helpOpenRef = useRef(helpOpen);
  helpOpenRef.current = helpOpen;

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Built-in: ? toggles help overlay
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setHelpOpen(prev => !prev);
        return;
      }

      // If help is open, only Escape closes it
      if (helpOpenRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      for (const s of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        if (!keyMatch) continue;
        if (s.ctrl && !e.ctrlKey && !e.metaKey) continue;
        if (s.shift && !e.shiftKey) continue;
        if (isInput && !s.global) continue;

        e.preventDefault();
        s.handler();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { helpOpen, closeHelp };
}
