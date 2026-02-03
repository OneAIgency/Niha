import { type ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal width size */
  size?: ModalSize;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Whether clicking backdrop closes the modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
}

interface ModalHeaderProps {
  children: ReactNode;
  /** Show close button (default: true) */
  showClose?: boolean;
  /** Close callback - required if showClose is true */
  onClose?: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

/**
 * Modal Component
 *
 * A standardized modal dialog with header, body, and footer sections.
 *
 * @example
 * ```tsx
 * <Modal isOpen={open} onClose={close} size="md">
 *   <Modal.Header onClose={close}>
 *     <h2 className="text-lg font-semibold text-white">Modal Title</h2>
 *   </Modal.Header>
 *   <Modal.Body>
 *     <p>Modal content goes here...</p>
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="secondary" onClick={close}>Cancel</Button>
 *     <Button variant="primary" onClick={save}>Save</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative w-full mx-4 bg-navy-800 border border-navy-700 rounded-xl shadow-2xl overflow-hidden',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal Header
 */
function ModalHeader({ children, showClose = true, onClose, className }: ModalHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-navy-700', className)}>
      <div className="flex-1">{children}</div>
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-lg hover:bg-navy-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-navy-400" />
        </button>
      )}
    </div>
  );
}

/**
 * Modal Body
 */
function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4 max-h-[60vh] overflow-y-auto', className)}>
      {children}
    </div>
  );
}

/**
 * Modal Footer
 */
function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-700 bg-navy-900/50', className)}>
      {children}
    </div>
  );
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
