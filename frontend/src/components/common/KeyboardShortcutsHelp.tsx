import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import type { Shortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsHelp({ open, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="bg-navy-800 border border-navy-600 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-700 transition-colors">
                <X className="w-4 h-4 text-navy-400" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="px-5 py-3 space-y-1">
              {shortcuts.map(s => (
                <div key={s.key + s.description} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-navy-300">{s.description}</span>
                  <kbd className="min-w-[2rem] text-center px-2 py-0.5 rounded bg-navy-700 border border-navy-600 text-[11px] font-mono font-semibold text-emerald-400">
                    {s.ctrl ? '⌘' : ''}{s.shift ? '⇧' : ''}{s.label}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-navy-700">
              <p className="text-[10px] text-navy-500 text-center">Press <kbd className="px-1 py-0.5 rounded bg-navy-700 border border-navy-600 text-[10px] font-mono text-navy-400">?</kbd> or <kbd className="px-1 py-0.5 rounded bg-navy-700 border border-navy-600 text-[10px] font-mono text-navy-400">Esc</kbd> to close</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
