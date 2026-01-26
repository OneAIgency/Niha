/**
 * Contact Requests Tab Component
 * 
 * Displays and manages contact requests (join requests and NDA submissions).
 * Supports real-time updates via WebSocket, approval/rejection workflows,
 * IP lookup, and NDA file downloads.
 * 
 * @component
 * @example
 * ```tsx
 * <ContactRequestsTab
 *   contactRequests={requests}
 *   loading={false}
 *   connectionStatus="connected"
 *   onRefresh={handleRefresh}
 *   onApprove={handleApprove}
 *   onReject={handleReject}
 *   onDelete={handleDelete}
 *   onDownloadNDA={handleDownloadNDA}
 *   onIpLookup={handleIpLookup}
 *   actionLoading={null}
 * />
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Download, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '../common';
import { ApproveInviteModal } from './ApproveInviteModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { formatRelativeTime } from '../../utils';
import type { ContactRequest } from '../../types/backoffice';

interface ContactRequestsTabProps {
  contactRequests: ContactRequest[];
  loading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  onRefresh: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onDownloadNDA: (requestId: string) => Promise<void>;
  onIpLookup: (ip: string) => void;
  actionLoading: string | null;
}

export function ContactRequestsTab({
  contactRequests,
  loading,
  connectionStatus: _connectionStatus, // Reserved for future use
  onRefresh: _onRefresh, // Reserved for future use
  onApprove,
  onReject,
  onDelete,
  onDownloadNDA,
  onIpLookup,
  actionLoading,
}: ContactRequestsTabProps) {
  // Suppress unused variable warnings for reserved parameters
  void _connectionStatus;
  void _onRefresh;
  const [approveModalRequest, setApproveModalRequest] = useState<ContactRequest | null>(null);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<ContactRequest | null>(null);

  const handleApproveClick = (request: ContactRequest) => {
    setApproveModalRequest(request);
  };

  const handleApproveModalSuccess = () => {
    if (approveModalRequest) {
      onApprove(approveModalRequest.id);
    }
    setApproveModalRequest(null);
  };

  const handleDeleteClick = (request: ContactRequest) => {
    setDeleteConfirmRequest(request);
  };

  const confirmDeleteRequest = () => {
    if (deleteConfirmRequest) {
      onDelete(deleteConfirmRequest.id);
      setDeleteConfirmRequest(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-navy-600 dark:text-navy-400" />
            Contact Requests
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                  <div className="h-5 bg-navy-100 dark:bg-navy-600 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : contactRequests.length > 0 ? (
            <div className="space-y-4">
              {contactRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-navy-900 dark:text-white">
                          {request.entity_name}
                        </h3>
                        <Badge variant={request.request_type === 'nda' ? 'warning' : 'info'}>
                          {request.request_type?.toUpperCase() || 'JOIN'}
                        </Badge>
                        <Badge variant={request.status === 'new' ? 'info' : request.status === 'contacted' ? 'warning' : 'success'}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-navy-500 dark:text-navy-400">Contact:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200">{request.contact_email}</span>
                        </div>
                        {request.contact_name && (
                          <div>
                            <span className="text-navy-500 dark:text-navy-400">Name:</span>
                            <span className="ml-2 text-navy-700 dark:text-navy-200">{request.contact_name}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-navy-500 dark:text-navy-400">Position:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200">{request.position}</span>
                        </div>
                        {request.reference && (
                          <div>
                            <span className="text-navy-500 dark:text-navy-400">Reference:</span>
                            <span className="ml-2 text-navy-700 dark:text-navy-200">{request.reference}</span>
                          </div>
                        )}
                        {request.submitter_ip && (
                          <div>
                            <span className="text-navy-500 dark:text-navy-400">IP:</span>
                            <button
                              onClick={() => onIpLookup(request.submitter_ip!)}
                              className="ml-2 text-teal-600 dark:text-teal-400 hover:underline font-mono text-xs"
                              aria-label={`Lookup IP address ${request.submitter_ip}`}
                            >
                              {request.submitter_ip}
                            </button>
                          </div>
                        )}
                        {request.nda_file_name && (
                          <div className="col-span-2">
                            <span className="text-navy-500 dark:text-navy-400">NDA File:</span>
                            <button
                              onClick={() => onDownloadNDA(request.id)}
                              className="ml-2 text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                              aria-label={`Download NDA file ${request.nda_file_name}`}
                            >
                              <Download className="w-3 h-3" />
                              {request.nda_file_name}
                            </button>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-navy-500 dark:text-navy-400">Submitted:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200">{formatRelativeTime(request.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {request.status === 'new' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveClick(request)}
                            loading={actionLoading === `approve-${request.id}`}
                            aria-label={`Approve request from ${request.entity_name}`}
                          >
                            Approve & Invite
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReject(request.id)}
                            loading={actionLoading === `reject-${request.id}`}
                            aria-label={`Reject request from ${request.entity_name}`}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(request)}
                        loading={actionLoading === `delete-${request.id}`}
                        aria-label={`Delete request from ${request.entity_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
              <p className="text-navy-500 dark:text-navy-400">No contact requests</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Approve & Invite Modal */}
      {approveModalRequest && (
        <ApproveInviteModal
          contactRequest={{
            id: approveModalRequest.id,
            entity_name: approveModalRequest.entity_name,
            contact_email: approveModalRequest.contact_email,
            contact_name: approveModalRequest.contact_name,
            position: approveModalRequest.position,
            reference: approveModalRequest.reference,
            request_type: approveModalRequest.request_type,
            nda_file_name: approveModalRequest.nda_file_name,
            submitter_ip: approveModalRequest.submitter_ip,
            status: approveModalRequest.status as 'pending' | 'approved' | 'rejected' | 'enrolled',
            notes: approveModalRequest.notes,
            created_at: approveModalRequest.created_at,
          }}
          isOpen={!!approveModalRequest}
          onClose={() => setApproveModalRequest(null)}
          onSuccess={handleApproveModalSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirmRequest}
        onClose={() => setDeleteConfirmRequest(null)}
        onConfirm={confirmDeleteRequest}
        title="Delete Contact Request"
        message="This action cannot be undone. The contact request will be permanently deleted from the database."
        confirmText="Delete Request"
        cancelText="Cancel"
        variant="danger"
        requireConfirmation={deleteConfirmRequest?.entity_name}
        details={deleteConfirmRequest ? [
          { label: 'Company', value: deleteConfirmRequest.entity_name },
          { label: 'Contact', value: deleteConfirmRequest.contact_email },
          { label: 'Status', value: deleteConfirmRequest.status },
          { label: 'Submitted', value: formatRelativeTime(deleteConfirmRequest.created_at) },
        ] : []}
        loading={actionLoading === `delete-${deleteConfirmRequest?.id}`}
      />
    </>
  );
}
