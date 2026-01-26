/**
 * Document Viewer Modal Component
 * 
 * Displays document previews (images, PDFs) or download prompts for unsupported file types.
 * Supports loading states, error handling, and retry functionality.
 * 
 * @component
 * @example
 * ```tsx
 * <DocumentViewerModal
 *   document={documentState}
 *   documentContentUrl={contentUrl}
 *   documentError={error}
 *   documentLoading={loading}
 *   onClose={handleClose}
 *   onDownload={handleDownload}
 *   onRetry={handleRetry}
 * />
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../common';
import { logger } from '../../utils/logger';
import type { DocumentViewerState } from '../../types/backoffice';

interface DocumentViewerModalProps {
  document: DocumentViewerState | null;
  documentContentUrl: string | null;
  documentError: string | null;
  documentLoading?: boolean;
  onClose: () => void;
  onDownload: () => void;
  onRetry?: () => void;
}

export function DocumentViewerModal({
  document,
  documentContentUrl,
  documentError,
  documentLoading = false,
  onClose,
  onDownload,
  onRetry,
}: DocumentViewerModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!document) return null;

  const mimeType = document.mimeType?.toLowerCase() || '';
  const fileName = document.fileName.toLowerCase();

  const renderPreview = () => {
    if (!documentContentUrl) return null;

    // Image preview
    if (mimeType.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)) {
      if (imageError) {
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 dark:text-red-400 mb-4">Failed to load image</p>
            <Button variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        );
      }

      return (
        <img
          src={documentContentUrl}
          alt={document.fileName}
          className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
          onError={() => {
            setImageError(true);
            logger.error('Failed to load image in document viewer', {
              fileName: document.fileName,
              mimeType: document.mimeType,
            });
          }}
        />
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return (
        <iframe
          src={documentContentUrl}
          title={document.fileName}
          className="w-full h-[60vh] rounded-lg border border-navy-200 dark:border-navy-600"
          aria-label={`PDF preview of ${document.fileName}`}
        />
      );
    }

    // Unsupported file type
    return (
      <div className="text-center">
        <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
        <p className="text-navy-500 dark:text-navy-400 mb-4">
          Preview not available for this file type
        </p>
        <Button variant="primary" onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="document-viewer-title">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-100 dark:border-navy-700">
          <div>
            <h2 id="document-viewer-title" className="font-semibold text-navy-900 dark:text-white">
              {document.type.replace(/_/g, ' ')}
            </h2>
            <p className="text-sm text-navy-500 dark:text-navy-400">{document.fileName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              aria-label={`Download ${document.fileName}`}
            >
              <Download className="w-4 h-4" />
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
              aria-label="Close document viewer"
            >
              <X className="w-5 h-5 text-navy-500" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-auto max-h-[calc(85vh-80px)] flex items-center justify-center bg-navy-50 dark:bg-navy-900">
          {documentLoading ? (
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-navy-400 animate-spin mx-auto mb-4" />
              <p className="text-navy-500 dark:text-navy-400">Loading document...</p>
            </div>
          ) : documentError ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-500 dark:text-red-400" role="alert">{documentError}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
            </div>
          ) : documentContentUrl && !imageError ? (
            renderPreview()
          ) : (
            <div className="text-center">
              <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
              <p className="text-navy-500 dark:text-navy-400">Document preview not available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
