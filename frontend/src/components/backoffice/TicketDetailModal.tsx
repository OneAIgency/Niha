import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertCircle, CheckCircle, Clock, User, Tag } from 'lucide-react';
import { Button } from '../common';

interface TicketLog {
  [key: string]: unknown;
  id: string;
  ticketId: string;
  timestamp: string;
  userId?: string;
  marketMakerId?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  status: 'SUCCESS' | 'FAILED';
  requestPayload?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  relatedTicketIds: string[];
  tags: string[];
}

interface TicketDetailModalProps {
  ticket: TicketLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, isOpen, onClose }: TicketDetailModalProps) {
  if (!isOpen || !ticket) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                ticket.status === 'SUCCESS'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {ticket.status === 'SUCCESS' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                  Ticket Details
                </h2>
                <p className="text-sm text-navy-500 dark:text-navy-400">{ticket.ticketId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">
                  Action Type
                </label>
                <div className="text-sm text-navy-900 dark:text-white font-medium">
                  {ticket.actionType}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">
                  Entity Type
                </label>
                <div className="text-sm text-navy-900 dark:text-white font-medium">
                  {ticket.entityType}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Timestamp
                </label>
                <div className="text-sm text-navy-900 dark:text-white">
                  {new Date(ticket.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">
                  Status
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ticket.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>

            {/* IDs */}
            {(ticket.userId || ticket.marketMakerId || ticket.entityId) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Identifiers
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {ticket.userId && (
                    <div className="text-sm">
                      <span className="text-navy-500 dark:text-navy-400">User ID:</span>{' '}
                      <code className="text-navy-900 dark:text-white bg-navy-100 dark:bg-navy-700 px-2 py-0.5 rounded">
                        {ticket.userId}
                      </code>
                    </div>
                  )}
                  {ticket.marketMakerId && (
                    <div className="text-sm">
                      <span className="text-navy-500 dark:text-navy-400">Market Maker ID:</span>{' '}
                      <code className="text-navy-900 dark:text-white bg-navy-100 dark:bg-navy-700 px-2 py-0.5 rounded">
                        {ticket.marketMakerId}
                      </code>
                    </div>
                  )}
                  {ticket.entityId && (
                    <div className="text-sm">
                      <span className="text-navy-500 dark:text-navy-400">Entity ID:</span>{' '}
                      <code className="text-navy-900 dark:text-white bg-navy-100 dark:bg-navy-700 px-2 py-0.5 rounded">
                        {ticket.entityId}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Tickets */}
            {ticket.relatedTicketIds && ticket.relatedTicketIds.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Related Tickets
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.relatedTicketIds.map((relatedId, index) => (
                    <code
                      key={index}
                      className="text-xs text-navy-900 dark:text-white bg-navy-100 dark:bg-navy-700 px-2 py-1 rounded"
                    >
                      {relatedId}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Request Payload */}
            {ticket.requestPayload && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Request Payload</h3>
                <pre className="text-xs bg-navy-100 dark:bg-navy-700 p-3 rounded-lg overflow-x-auto text-navy-900 dark:text-white">
                  {JSON.stringify(ticket.requestPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Data */}
            {ticket.responseData && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Response Data</h3>
                <pre className="text-xs bg-navy-100 dark:bg-navy-700 p-3 rounded-lg overflow-x-auto text-navy-900 dark:text-white">
                  {JSON.stringify(ticket.responseData, null, 2)}
                </pre>
              </div>
            )}

            {/* Before State */}
            {ticket.beforeState && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Before State</h3>
                <pre className="text-xs bg-navy-100 dark:bg-navy-700 p-3 rounded-lg overflow-x-auto text-navy-900 dark:text-white">
                  {JSON.stringify(ticket.beforeState, null, 2)}
                </pre>
              </div>
            )}

            {/* After State */}
            {ticket.afterState && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">After State</h3>
                <pre className="text-xs bg-navy-100 dark:bg-navy-700 p-3 rounded-lg overflow-x-auto text-navy-900 dark:text-white">
                  {JSON.stringify(ticket.afterState, null, 2)}
                </pre>
              </div>
            )}

            {/* Technical Info */}
            {(ticket.ipAddress || ticket.userAgent) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Technical Information</h3>
                <div className="space-y-1 text-xs text-navy-600 dark:text-navy-400">
                  {ticket.ipAddress && (
                    <div>
                      <span className="font-medium">IP Address:</span> {ticket.ipAddress}
                    </div>
                  )}
                  {ticket.userAgent && (
                    <div>
                      <span className="font-medium">User Agent:</span> {ticket.userAgent}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/50">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
