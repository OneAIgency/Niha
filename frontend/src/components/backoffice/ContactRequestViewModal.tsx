/**
 * Modal that shows all contact request form data and a button to open the attached NDA PDF in a new tab.
 * Supports Escape to close, focus trap, exit animation, and optional IP lookup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, FileText } from 'lucide-react';
import { Typography } from '../common/Typography';
import type { ContactRequest } from '../../types/backoffice';
import { formatDate } from '../../utils';

interface ContactRequestViewModalProps {
  request: ContactRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNDA: (requestId: string) => Promise<void>;
  onIpLookup?: (ip: string) => void;
  openNDALoading?: boolean;
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function DataRow({
  label,
  value,
  showEmpty = false,
}: {
  label: string;
  value: string | undefined;
  showEmpty?: boolean;
}) {
  const display = value != null && value !== '' ? value : showEmpty ? '—' : null;
  if (display === null) return null;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 py-1.5 border-b border-navy-200/60 dark:border-navy-600/60 last:border-0">
      <Typography as="span" variant="sectionLabel" color="muted" className="shrink-0">
        {label}:
      </Typography>
      <Typography as="span" variant="bodySmall" color="primary">
        {display}
      </Typography>
    </div>
  );
}

export function ContactRequestViewModal({
  request,
  isOpen,
  onClose,
  onOpenNDA,
  onIpLookup,
  openNDALoading = false,
}: ContactRequestViewModalProps) {
  const [exiting, setExiting] = useState(false);
  const [closingRequest, setClosingRequest] = useState<ContactRequest | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showingRequest = (isOpen && request) ? request : closingRequest;
  const isVisible = !!(isOpen && request) || (exiting && closingRequest);

  const handleClose = useCallback(() => {
    if (exiting) return;
    if (!request) {
      onClose();
      return;
    }
    setClosingRequest(request);
    setExiting(true);
  }, [exiting, request, onClose]);

  const handleAnimationComplete = useCallback(() => {
    if (exiting) {
      onClose();
      setExiting(false);
      setClosingRequest(null);
    }
  }, [exiting, onClose]);

  // Reset exiting when opening
  useEffect(() => {
    if (isOpen && request) setExiting(false);
  }, [isOpen, request]);

  // Escape to close
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isVisible, handleClose]);

  // Focus close button on open; focus trap (Tab / Shift+Tab)
  useEffect(() => {
    if (!isVisible || !modalRef.current) return;
    closeButtonRef.current?.focus();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !modalRef.current) return;
    const el = modalRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [isVisible]);

  if (!isVisible || !showingRequest) return null;

  const handleOpenNDA = () => {
    onOpenNDA(showingRequest.id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-request-view-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={exiting ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onAnimationComplete={handleAnimationComplete}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700 shrink-0">
          <h2 id="contact-request-view-title" className="text-lg font-semibold text-navy-900 dark:text-white">
            Contact request details
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-navy-800"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <DataRow label="ID" value={showingRequest.id} showEmpty />
          <DataRow label="Entity" value={showingRequest.entity_name} showEmpty />
          <DataRow label="Name" value={showingRequest.contact_name} showEmpty />
          <DataRow label="Email" value={showingRequest.contact_email} showEmpty />
          <DataRow label="Position" value={showingRequest.position} showEmpty />
          <DataRow label="User role" value={showingRequest.user_role} showEmpty />
          <DataRow label="NDA file name" value={showingRequest.nda_file_name} />
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 py-1.5 border-b border-navy-200/60 dark:border-navy-600/60">
            <Typography as="span" variant="sectionLabel" color="muted" className="shrink-0">
              Submitter IP:
            </Typography>
            <Typography as="span" variant="bodySmall" color="primary" className="shrink-0">
              {showingRequest.submitter_ip ?? '—'}
            </Typography>
            {onIpLookup && showingRequest.submitter_ip && (
              <button
                type="button"
                onClick={() => onIpLookup(showingRequest.submitter_ip!)}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded"
                aria-label={`Lookup IP ${showingRequest.submitter_ip}`}
              >
                Lookup
              </button>
            )}
          </div>
          <DataRow label="Notes" value={showingRequest.notes} showEmpty />
          <DataRow
            label="Submitted"
            value={showingRequest.created_at ? formatDate(showingRequest.created_at) : undefined}
            showEmpty
          />

          {showingRequest.nda_file_name && (
            <div className="pt-2 border-t border-navy-200/60 dark:border-navy-600/60">
              <Typography as="p" variant="sectionLabel" color="muted" className="mb-2">
                Link to attached PDF for verification
              </Typography>
              <button
                type="button"
                onClick={handleOpenNDA}
                disabled={openNDALoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-navy-50 dark:bg-navy-900/50 text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-700/50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Open NDA ${showingRequest.nda_file_name}`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <ExternalLink className="w-4 h-4 shrink-0" />
                {openNDALoading ? 'Opening…' : `Open ${showingRequest.nda_file_name}`}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
