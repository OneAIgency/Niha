import { memo } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { Card } from '../common';
import { KYCReviewPanel } from './KYCReviewPanel';
import type { KYCUser, KYCDocument } from '../../types/backoffice';

interface KYCReviewTabProps {
  kycUsers: KYCUser[];
  kycDocuments: KYCDocument[];
  loading: boolean;
  actionLoading: string | null;
  onApproveKYC: (userId: string) => Promise<void>;
  onRejectKYC: (userId: string) => Promise<void>;
  onReviewDocument: (docId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  onOpenDocumentViewer: (doc: KYCDocument) => void;
  getUserDocuments: (userId: string) => KYCDocument[];
  setActionLoading: (loading: string | null) => void;
}

export const KYCReviewTab: FC<KYCReviewTabProps> = memo(({
  kycUsers,
  loading,
  actionLoading,
  onApproveKYC,
  onRejectKYC,
  onReviewDocument,
  onOpenDocumentViewer,
  getUserDocuments,
  setActionLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          KYC Documents Review
        </h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
          Review and approve user KYC documents by category
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-4 border-b border-navy-100 dark:border-navy-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-navy-200 dark:bg-navy-700" />
                  <div className="flex-1">
                    <div className="h-5 bg-navy-200 dark:bg-navy-700 rounded w-1/4 mb-2" />
                    <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/3" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-10 bg-navy-100 dark:bg-navy-700 rounded mb-3" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-navy-100 dark:bg-navy-700 rounded" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : kycUsers.length > 0 ? (
        <div className="space-y-6">
          {kycUsers.map((user) => {
            const userDocs = getUserDocuments(user.id);
            return (
              <KYCReviewPanel
                key={user.id}
                userId={user.id}
                userEmail={user.email}
                userName={`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                entityName={user.entity_name}
                documents={userDocs}
                onDocumentApprove={async (docId) => {
                  setActionLoading(`approve-${docId}`);
                  await onReviewDocument(docId, 'approved');
                  setActionLoading(null);
                }}
                onDocumentReject={async (docId, notes) => {
                  setActionLoading(`reject-${docId}`);
                  await onReviewDocument(docId, 'rejected', notes);
                  setActionLoading(null);
                }}
                onDocumentPreview={onOpenDocumentViewer}
                onUserApprove={async () => {
                  setActionLoading(`approve-user-${user.id}`);
                  await onApproveKYC(user.id);
                  setActionLoading(null);
                }}
                onUserReject={async () => {
                  setActionLoading(`reject-user-${user.id}`);
                  await onRejectKYC(user.id);
                  setActionLoading(null);
                }}
                actionLoading={actionLoading}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-navy-400 mx-auto mb-4" />
            <p className="text-navy-500 dark:text-navy-400">No KYC reviews pending</p>
            <p className="text-xs text-navy-400 mt-1">All users have completed their verification</p>
          </div>
        </Card>
      )}
    </motion.div>
  );
});

KYCReviewTab.displayName = 'KYCReviewTab';
