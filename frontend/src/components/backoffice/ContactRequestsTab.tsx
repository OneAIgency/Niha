/**
 * Contact Requests Tab Component
 *
 * Displays and manages contact requests (join requests and NDA submissions) in compact list rows
 * (Entity, Name, Submitted + View / Approve & Invite / Reject / Delete). Each row shows entity_name and
 * contact_name (fallback "—" when missing). View opens ContactRequestViewModal with all fields and NDA
 * open-NDA button; onIpLookup is passed to the modal for the IP Lookup link. View/Approve/Reject/Delete
 * use aria-label fallbacks (entity_name ?? contact_email ?? id ?? 'contact request'). Real-time WebSocket updates.
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
 *   onOpenNDA={handleOpenNDA}
 *   onIpLookup={handleIpLookup}
 *   actionLoading={null}
 * />
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '../common';
import { Typography } from '../common/Typography';
import { ApproveInviteModal } from './ApproveInviteModal';
import { ContactRequestViewModal } from './ContactRequestViewModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { formatRelativeTime, formatDate } from '../../utils';
import type { ContactRequest } from '../../types/backoffice';

interface ContactRequestsTabProps {
  contactRequests: ContactRequest[];
  loading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  onRefresh: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onOpenNDA: (requestId: string) => Promise<void>;
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
  onOpenNDA,
  onIpLookup,
  actionLoading,
}: ContactRequestsTabProps) {
  // Suppress unused variable warnings for reserved parameters
  void _connectionStatus;
  void _onRefresh;
  const [approveModalRequest, setApproveModalRequest] = useState<ContactRequest | null>(null);
  const [viewModalRequest, setViewModalRequest] = useState<ContactRequest | null>(null);
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
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card_contact_request_list animate-pulse">
                  <div className="h-4 bg-navy-200 dark:bg-navy-600 rounded w-1/3" />
                  <div className="h-4 bg-navy-200 dark:bg-navy-600 rounded w-24" />
                </div>
              ))}
            </div>
          ) : contactRequests.length > 0 ? (
            <div className="space-y-2">
              {contactRequests.map((request) => (
                <div key={request.id} className="card_contact_request_list">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Typography as="span" variant="sectionLabel" color="muted">
                        Entity:
                      </Typography>
                      <Typography as="span" variant="bodySmall" color="primary" className="font-medium">
                        {request.entity_name ?? '—'}
                      </Typography>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Typography as="span" variant="sectionLabel" color="muted">
                        Name:
                      </Typography>
                      <Typography as="span" variant="bodySmall" color="primary">
                        {request.contact_name || '—'}
                      </Typography>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Typography as="span" variant="sectionLabel" color="muted">
                        Submitted:
                      </Typography>
                      <Typography as="span" variant="bodySmall" color="primary">
                        {request.created_at ? formatDate(request.created_at) : '—'}
                      </Typography>
                    </span>
                    <Badge variant={request.request_type === 'nda' ? 'warning' : 'info'} className="shrink-0 text-xs">
                      {request.request_type?.toUpperCase() || 'JOIN'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewModalRequest(request)}
                      className="p-2 rounded-lg text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
                      aria-label={`View details for ${request.entity_name ?? request.contact_email ?? request.id ?? 'contact request'}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {request.status === 'new' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveClick(request)}
                          loading={actionLoading === `approve-${request.id}`}
                          aria-label={`Approve request from ${request.entity_name ?? request.contact_email ?? request.id ?? 'contact request'}`}
                        >
                          Approve & Invite
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20"
                          onClick={() => onReject(request.id)}
                          loading={actionLoading === `reject-${request.id}`}
                          aria-label={`Reject request from ${request.entity_name ?? request.contact_email ?? request.id ?? 'contact request'}`}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(request)}
                      disabled={!!actionLoading}
                      className="p-2 rounded-lg text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      aria-label={`Delete request from ${request.entity_name ?? request.contact_email ?? request.id ?? 'contact request'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* View contact request details modal */}
      <ContactRequestViewModal
        request={viewModalRequest}
        isOpen={!!viewModalRequest}
        onClose={() => setViewModalRequest(null)}
        onOpenNDA={onOpenNDA}
        onIpLookup={onIpLookup}
        openNDALoading={actionLoading === `open-${viewModalRequest?.id}`}
      />

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
