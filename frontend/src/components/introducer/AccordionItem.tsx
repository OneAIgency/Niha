import { useEffect, useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils';
import { useIntroducerStore } from '../../stores/useIntroducerStore';

interface AccordionItemProps {
  sectionId: string;
  itemId: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ sectionId, itemId, title, children, defaultOpen }: AccordionItemProps) {
  const { expandedAccordions, toggleAccordion, expandAccordion } = useIntroducerStore();
  const isOpen = (expandedAccordions[sectionId] ?? []).includes(itemId);
  const contentId = useId();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (defaultOpen) expandAccordion(sectionId, itemId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={cn(
        'border rounded-lg transition-colors duration-200',
        isOpen
          ? 'bg-navy-800/50 border-emerald-500/30'
          : 'bg-navy-800/30 border-navy-700'
      )}
    >
      <button
        onClick={() => toggleAccordion(sectionId, itemId)}
        className="w-full flex items-center justify-between p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset rounded-lg"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="text-sm font-medium text-navy-200">{title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-navy-400 transition-transform duration-200 flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-navy-400 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
