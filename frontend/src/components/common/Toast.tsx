import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  title?: string;
}

const variantConfig: Record<ToastVariant, { bg: string; border: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle },
  error: { bg: 'bg-red-500/15', border: 'border-red-500/30', icon: AlertCircle },
  info: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Info },
};

const variantText: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

let toastId = 0;
const listeners = new Set<(toast: ToastItem) => void>();

/** Fire a toast from anywhere (no React context needed). */
export function showToast(variant: ToastVariant, message: string, title?: string) {
  const toast: ToastItem = { id: ++toastId, variant, message, title };
  listeners.forEach(fn => fn(toast));
}

/** Render this once at the app root. */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setToasts(prev => [...prev, toast]);
      const timer = setTimeout(() => remove(toast.id), 5000);
      timers.current.set(toast.id, timer);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [remove]);

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const cfg = variantConfig[toast.variant];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg max-w-sm ${cfg.bg} ${cfg.border}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${variantText[toast.variant]}`} />
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className={`text-xs font-semibold mb-0.5 ${variantText[toast.variant]}`}>{toast.title}</p>
                )}
                <p className="text-xs text-navy-300">{toast.message}</p>
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 text-navy-500" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
