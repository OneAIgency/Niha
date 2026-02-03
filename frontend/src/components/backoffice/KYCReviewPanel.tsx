import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  User,
  Building2,
  Mail,
} from 'lucide-react';
import { Button, Badge, Card } from '../common';
import {
  documentDefinitions,
  documentCategories,
  getDocumentsByCategory,
  REQUIRED_DOCUMENT_COUNT,
} from '../../constants/kycDocuments';
import type { KYCDocumentType } from '../../types';
import type { KYCDocument } from '../../types/backoffice';

interface KYCReviewPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  entityName?: string;
  documents: KYCDocument[];
  onDocumentApprove: (docId: string) => Promise<void>;
  onDocumentReject: (docId: string, notes?: string) => Promise<void>;
  onDocumentPreview: (doc: KYCDocument) => void;
  onUserApprove: () => Promise<void>;
  onUserReject: () => Promise<void>;
  actionLoading?: string | null;
}

export function KYCReviewPanel({
  userId,
  userEmail,
  userName,
  entityName,
  documents,
  onDocumentApprove,
  onDocumentReject,
  onDocumentPreview,
  onUserApprove,
  onUserReject,
  actionLoading,
}: KYCReviewPanelProps) {
  const [activeCategory, setActiveCategory] = useState<'company' | 'representative' | 'optional'>('company');
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Get document by type
  const getDocumentByType = (type: KYCDocumentType): KYCDocument | undefined => {
    return documents.find(d => d.documentType === type);
  };

  // Calculate progress
  const uploadedRequired = documentDefinitions
    .filter(d => d.required)
    .filter(d => getDocumentByType(d.type))
    .length;

  const approvedRequired = documentDefinitions
    .filter(d => d.required)
    .filter(d => {
      const doc = getDocumentByType(d.type);
      return doc && doc.status === 'approved';
    })
    .length;

  const progress = Math.round((approvedRequired / REQUIRED_DOCUMENT_COUNT) * 100);
  const allRequiredApproved = approvedRequired === REQUIRED_DOCUMENT_COUNT;

  const handleReject = async (docId: string) => {
    await onDocumentReject(docId, rejectNotes || undefined);
    setRejectingDoc(null);
    setRejectNotes('');
  };

  const categoryDocs = getDocumentsByCategory(activeCategory);

  return (
    <Card className="overflow-hidden">
      {/* User Header */}
      <div className="p-4 border-b border-navy-100 dark:border-navy-700 bg-gradient-to-r from-navy-50 to-transparent dark:from-navy-900/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              {userName?.charAt(0)?.toUpperCase() || userEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                {userName || 'Unknown User'}
              </h3>
              <p className="text-sm text-navy-500 dark:text-navy-400 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {userEmail}
              </p>
              {entityName && (
                <p className="text-sm text-navy-500 dark:text-navy-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" />
                  {entityName}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-navy-500 dark:text-navy-400">
              {uploadedRequired} of {REQUIRED_DOCUMENT_COUNT} required uploaded
            </p>
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
              {approvedRequired} of {REQUIRED_DOCUMENT_COUNT} approved
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-navy-500 dark:text-navy-400 mb-1">
            <span>Approval Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-navy-200 dark:bg-navy-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-navy-100 dark:border-navy-700">
        {documentCategories.map(cat => {
          const catDocs = getDocumentsByCategory(cat.id);
          const approved = catDocs.filter(d => {
            const doc = getDocumentByType(d.type);
            return doc && doc.status === 'approved';
          }).length;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeCategory === cat.id
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-navy-500 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-4 h-4" style={{ color: cat.color }} />
                <span>{cat.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-navy-200 dark:bg-navy-700">
                  {approved}/{catDocs.length}
                </span>
              </div>
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Document Slots */}
      <div className="p-4 space-y-3">
        {categoryDocs.map(docDef => {
          const uploadedDoc = getDocumentByType(docDef.type);
          const isApproved = uploadedDoc?.status === 'approved';
          const isRejected = uploadedDoc?.status === 'rejected';
          const isPending = uploadedDoc?.status === 'pending';

          return (
            <div
              key={docDef.type}
              className={`p-4 rounded-xl border-2 transition-all ${
                uploadedDoc
                  ? isApproved
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : isRejected
                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={`w-4 h-4 ${
                      uploadedDoc
                        ? isApproved ? 'text-emerald-500' : isRejected ? 'text-red-500' : 'text-amber-500'
                        : 'text-navy-400'
                    }`} />
                    <span className="font-medium text-navy-900 dark:text-white">
                      {docDef.name}
                    </span>
                    {docDef.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <p className="text-xs text-navy-500 dark:text-navy-400 mb-2">
                    {docDef.description}
                  </p>

                  {uploadedDoc ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-navy-600 dark:text-navy-300 truncate max-w-[200px]">
                        {uploadedDoc.fileName}
                      </span>
                      <Badge
                        variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                      >
                        {uploadedDoc.status.toUpperCase()}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-navy-400">
                      <Clock className="w-4 h-4" />
                      <span>Not uploaded yet</span>
                    </div>
                  )}

                  {uploadedDoc?.notes && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      Note: {uploadedDoc.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {uploadedDoc && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentPreview(uploadedDoc)}
                        title="Preview document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDocumentApprove(uploadedDoc.id)}
                            loading={actionLoading === `approve-${uploadedDoc.id}`}
                            className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Approve document"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRejectingDoc(uploadedDoc.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Reject document"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}

                      {isRejected && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Reject Dialog */}
              {rejectingDoc === uploadedDoc?.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-navy-200 dark:border-navy-700"
                >
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                    Rejection reason (optional)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Explain why this document is being rejected..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectingDoc(null);
                        setRejectNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReject(uploadedDoc!.id)}
                      loading={actionLoading === `reject-${uploadedDoc?.id}`}
                      className="bg-red-500 hover:bg-red-600 border-red-500"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Document
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-navy-100 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 flex items-center justify-between">
        <div className="text-sm text-navy-500 dark:text-navy-400">
          {allRequiredApproved ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              All required documents approved
            </span>
          ) : (
            <span>
              {REQUIRED_DOCUMENT_COUNT - approvedRequired} more document(s) need approval
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onUserReject}
            loading={actionLoading === `reject-user-${userId}`}
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <XCircle className="w-4 h-4" />
            Reject User
          </Button>
          <Button
            variant="primary"
            onClick={onUserApprove}
            disabled={!allRequiredApproved}
            loading={actionLoading === `approve-user-${userId}`}
            className={!allRequiredApproved ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <CheckCircle className="w-4 h-4" />
            Approve Full KYC
          </Button>
        </div>
      </div>
    </Card>
  );
}
