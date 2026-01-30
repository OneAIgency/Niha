import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  CheckCircle,
  Building2,
  User,
  Leaf,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { onboardingApi } from '../../services/api';
import type { KYCDocument, KYCDocumentType } from '../../types';

// Document definitions matching backend REQUIRED_DOCUMENTS
const documentDefinitions: {
  type: KYCDocumentType;
  name: string;
  description: string;
  required: boolean;
  category: 'company' | 'representative' | 'optional';
}[] = [
  // Company Documents (4 required)
  {
    type: 'REGISTRATION',
    name: 'Business Registration Certificate',
    description: 'Official document from company registry showing company name and registration number',
    required: true,
    category: 'company',
  },
  {
    type: 'TAX_CERTIFICATE',
    name: 'Tax Registration Certificate',
    description: 'Proof of tax registration and compliance with tax authorities',
    required: true,
    category: 'company',
  },
  {
    type: 'ARTICLES',
    name: 'Articles of Association',
    description: 'Corporate bylaws showing ownership structure and decision-making authority',
    required: true,
    category: 'company',
  },
  {
    type: 'FINANCIAL_STATEMENTS',
    name: 'Latest Financial Statements',
    description: 'Recent audited financial statements (balance sheet, income statement)',
    required: true,
    category: 'company',
  },
  // Representative Documents (3 required)
  {
    type: 'ID',
    name: 'Government-Issued ID',
    description: 'Valid passport or national ID card of authorized representative',
    required: true,
    category: 'representative',
  },
  {
    type: 'PROOF_AUTHORITY',
    name: 'Proof of Authority',
    description: 'Power of Attorney or board resolution authorizing representative',
    required: true,
    category: 'representative',
  },
  {
    type: 'CONTACT_INFO',
    name: 'Representative Contact Information',
    description: 'Official contact details and verification of representative',
    required: true,
    category: 'representative',
  },
  // Optional Document
  {
    type: 'GHG_PERMIT',
    name: 'GHG Emissions Permit',
    description: 'Required only for EU ETS installation operators',
    required: false,
    category: 'optional',
  },
];

const categories = [
  {
    id: 'company',
    name: 'Company Documents',
    icon: Building2,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500',
    iconClass: 'text-blue-500',
  },
  {
    id: 'representative',
    name: 'Representative Documents',
    icon: User,
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500',
    iconClass: 'text-violet-500',
  },
  {
    id: 'optional',
    name: 'Optional Documents',
    icon: Leaf,
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500',
    iconClass: 'text-emerald-500',
  },
] as const;

interface KycUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgressChange: (progress: number) => void;
}

export default function KycUploadModal({
  isOpen,
  onClose,
  onProgressChange,
}: KycUploadModalProps) {
  const [uploadedDocs, setUploadedDocs] = useState<KYCDocument[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('company');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load existing documents on mount
  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await onboardingApi.getStatus();
      const docs = status.documents || [];
      // API response is camelCase (documentType, fileName); normalize so matching works
      setUploadedDocs(
        docs.map((doc: KYCDocument & { documentType?: string; fileName?: string }) => ({
          ...doc,
          document_type: doc.document_type ?? doc.documentType ?? '',
          file_name: doc.file_name ?? doc.fileName ?? '',
        }))
      );
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocType = (d: KYCDocument & { documentType?: string }) =>
    d.document_type ?? d.documentType ?? '';

  // Calculate progress
  const requiredDocs = documentDefinitions.filter(d => d.required);
  const uploadedTypes = new Set(uploadedDocs.map(d => getDocType(d)));
  const uploadedRequiredCount = requiredDocs.filter(d => uploadedTypes.has(d.type)).length;
  const progress = Math.round((uploadedRequiredCount / requiredDocs.length) * 100);

  useEffect(() => {
    onProgressChange(progress);
  }, [progress, onProgressChange]);

  const handleUpload = async (type: KYCDocumentType, file: File) => {
    setUploading(type);
    setError(null);
    try {
      const doc = await onboardingApi.uploadDocument(type, file);
      setUploadedDocs(prev => [...prev.filter(d => getDocType(d) !== type), doc]);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      const detail = typeof msg === 'string' ? msg : '';
      if (detail.includes('already uploaded')) {
        setError('This document type is already uploaded. Delete it using the trash icon, then upload a new file.');
        await loadDocuments();
      } else {
        setError(detail || 'Upload failed');
      }
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId: string, type: KYCDocumentType) => {
    setUploading(type);
    setError(null);
    try {
      await onboardingApi.deleteDocument(docId);
      setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setError(typeof msg === 'string' ? msg : 'Delete failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onboardingApi.submit();
      onClose();
    } catch (err: unknown) {
      console.error('Submit failed:', err);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setError(typeof msg === 'string' ? msg : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = uploadedRequiredCount >= requiredDocs.length;
  const activeDocuments = documentDefinitions.filter(d => d.category === activeCategory);
  const activeCategoryData = categories.find(c => c.id === activeCategory);

  const getUploadedDoc = (type: KYCDocumentType) =>
    uploadedDocs.find(d => getDocType(d) === type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/95"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col bg-navy-800 border border-navy-600"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-navy-600">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-navy-700 transition-colors"
              >
                <X className="w-6 h-6 text-navy-400" />
              </button>

              <h2 className="text-2xl font-bold mb-2 text-navy-50">
                KYC Document Upload
              </h2>
              <p className="text-navy-400">
                Upload {requiredDocs.length} required documents to complete verification
              </p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-navy-400">
                    {uploadedRequiredCount} of {requiredDocs.length} required documents
                  </span>
                  <span className="text-teal-300">{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-navy-600">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 text-red-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div className="w-56 flex-shrink-0 p-4 space-y-2 overflow-y-auto border-r border-navy-600">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const catDocs = documentDefinitions.filter(d => d.category === cat.id);
                  const catUploaded = catDocs.filter(d => uploadedTypes.has(d.type)).length;
                  const catRequired = catDocs.filter(d => d.required).length;
                  const isActive = activeCategory === cat.id;
                  const isComplete = catRequired > 0 ? catUploaded >= catRequired : catUploaded > 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all border ${
                        isActive ? `${cat.bgClass} ${cat.borderClass}` : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.bgClass}`}
                        >
                          <Icon className={`w-5 h-5 ${cat.iconClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium text-sm ${isActive ? 'text-navy-50' : 'text-navy-400'}`}
                          >
                            {cat.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-navy-500">
                              {catUploaded}/{catDocs.length}
                            </span>
                            {isComplete && (
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Documents Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                  </div>
                ) : activeCategoryData && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeCategoryData.bgClass}`}
                      >
                        <activeCategoryData.icon className={`w-6 h-6 ${activeCategoryData.iconClass}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-navy-50">
                          {activeCategoryData.name}
                        </h3>
                        <p className="text-sm text-navy-400">
                          {activeDocuments.filter(d => uploadedTypes.has(d.type)).length} of {activeDocuments.length} uploaded
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {activeDocuments.map(doc => (
                        <DocumentUploadCard
                          key={doc.type}
                          docDef={doc}
                          uploadedDoc={getUploadedDoc(doc.type)}
                          onUpload={handleUpload}
                          onDelete={handleDelete}
                          accentClasses={activeCategoryData}
                          isUploading={uploading === doc.type}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-navy-600 flex items-center justify-between">
              <div className="flex items-center gap-2 text-navy-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  {uploadedDocs.length}/{documentDefinitions.length} documents uploaded
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
                  canSubmit && !submitting
                    ? 'bg-gradient-to-br from-teal-500 to-blue-600 cursor-pointer opacity-100'
                    : 'bg-navy-600 cursor-not-allowed opacity-50'
                }`}
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? 'Submitting...' : canSubmit ? 'Submit for Verification' : `Upload ${requiredDocs.length - uploadedRequiredCount} more`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type CategoryItem = (typeof categories)[number];

function DocumentUploadCard({
  docDef,
  uploadedDoc,
  onUpload,
  onDelete,
  accentClasses,
  isUploading,
}: {
  docDef: typeof documentDefinitions[0];
  uploadedDoc?: KYCDocument;
  onUpload: (type: KYCDocumentType, file: File) => void;
  onDelete: (id: string, type: KYCDocumentType) => void;
  accentClasses: CategoryItem;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploadedDoc && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(docDef.type, file);
    }
    e.target.value = '';
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uploadedDoc) {
      onDelete(uploadedDoc.id, docDef.type);
    }
  };

  const statusClasses = !uploadedDoc
    ? { border: accentClasses.borderClass, icon: accentClasses.iconClass, btn: `${accentClasses.bgClass} ${accentClasses.iconClass}` }
    : uploadedDoc.status === 'approved'
      ? { border: 'border-emerald-500', icon: 'text-emerald-500', btn: 'bg-emerald-500/10 text-emerald-500' }
      : uploadedDoc.status === 'rejected'
        ? { border: 'border-red-500', icon: 'text-red-500', btn: 'bg-red-500/10 text-red-500' }
        : { border: 'border-amber-500', icon: 'text-amber-500', btn: 'bg-amber-500/10 text-amber-500' };

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all bg-navy-700/50 ${uploadedDoc ? `border-solid ${statusClasses.border}` : `border-dashed ${accentClasses.borderClass}`} ${!uploadedDoc && !isUploading ? 'cursor-pointer hover:border-opacity-100' : ''}`}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isUploading ? (
            <Loader2 className={`w-6 h-6 mt-0.5 flex-shrink-0 animate-spin ${accentClasses.iconClass}`} />
          ) : uploadedDoc ? (
            <CheckCircle className={`w-6 h-6 mt-0.5 flex-shrink-0 ${statusClasses.icon}`} />
          ) : (
            <Upload className={`w-6 h-6 mt-0.5 flex-shrink-0 ${accentClasses.iconClass}`} />
          )}
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2 text-navy-50">
              {docDef.name}
              {docDef.required ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Required</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Optional</span>
              )}
            </div>
            <div className="text-sm mt-1 text-navy-400">{docDef.description}</div>
            {uploadedDoc && (
              <div className="text-xs mt-2 text-navy-300">{uploadedDoc.file_name} - {uploadedDoc.status}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uploadedDoc && (
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-lg hover:bg-navy-600 transition-colors"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploadedDoc ? statusClasses.btn : `${accentClasses.bgClass} ${accentClasses.iconClass}`}`}
          >
            {isUploading ? 'Uploading...' : uploadedDoc ? (
              uploadedDoc.status === 'approved' ? 'Approved' :
              uploadedDoc.status === 'rejected' ? 'Rejected' : 'Pending'
            ) : 'Upload'}
          </div>
        </div>
      </div>
    </div>
  );
}
