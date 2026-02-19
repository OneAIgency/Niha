import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useIntroducerStore } from '../../stores/useIntroducerStore';

export function ChatFAB() {
  const { isChatOpen, openChat } = useIntroducerStore();
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {!isChatOpen && (
        <motion.button
          initial={prefersReduced ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={openChat}
          title="Ask me anything about NIHA"
          aria-label="Open AI chat assistant"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
        >
          <MessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
