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
import { colors } from './OnboardingLayout';
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
    color: '#3b82f6',
  },
  {
    id: 'representative',
    name: 'Representative Documents',
    icon: User,
    color: '#8b5cf6',
  },
  {
    id: 'optional',
    name: 'Optional Documents',
    icon: Leaf,
    color: '#10b981',
  },
];

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
      setUploadedDocs(status.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const requiredDocs = documentDefinitions.filter(d => d.required);
  const uploadedTypes = new Set(uploadedDocs.map(d => d.document_type));
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
      setUploadedDocs(prev => [...prev.filter(d => d.document_type !== type), doc]);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Upload failed');
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
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || 'Delete failed');
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
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = uploadedRequiredCount >= requiredDocs.length;
  const activeDocuments = documentDefinitions.filter(d => d.category === activeCategory);
  const activeCategoryData = categories.find(c => c.id === activeCategory);

  const getUploadedDoc = (type: KYCDocumentType) => uploadedDocs.find(d => d.document_type === type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: colors.border }}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" style={{ color: colors.textSecondary }} />
              </button>

              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                KYC Document Upload
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Upload {requiredDocs.length} required documents to complete verification
              </p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span style={{ color: colors.textSecondary }}>
                    {uploadedRequiredCount} of {requiredDocs.length} required documents
                  </span>
                  <span style={{ color: colors.primaryLight }}>{progress}%</span>
                </div>
                <div className="h-3 rounded-full" style={{ backgroundColor: colors.bgCardHover }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${colors.danger}20` }}>
                  <AlertCircle className="w-5 h-5" style={{ color: colors.danger }} />
                  <span style={{ color: colors.danger }}>{error}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div
                className="w-56 flex-shrink-0 p-4 space-y-2 overflow-y-auto"
                style={{ borderRight: `1px solid ${colors.border}` }}
              >
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
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor: isActive ? `${cat.color}20` : 'transparent',
                        border: isActive ? `1px solid ${cat.color}` : `1px solid transparent`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm"
                            style={{ color: isActive ? colors.textPrimary : colors.textSecondary }}
                          >
                            {cat.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                              {catUploaded}/{catDocs.length}
                            </span>
                            {isComplete && (
                              <CheckCircle className="w-3 h-3" style={{ color: colors.success }} />
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
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                  </div>
                ) : activeCategoryData && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${activeCategoryData.color}20` }}
                      >
                        <activeCategoryData.icon className="w-6 h-6" style={{ color: activeCategoryData.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                          {activeCategoryData.name}
                        </h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
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
                          color={activeCategoryData.color}
                          isUploading={uploading === doc.type}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-6 border-t flex items-center justify-between"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  {uploadedDocs.length}/{documentDefinitions.length} documents uploaded
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2"
                style={{
                  background: canSubmit && !submitting
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    : colors.bgCardHover,
                  opacity: canSubmit && !submitting ? 1 : 0.5,
                  cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                }}
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

// Document Upload Card Component
function DocumentUploadCard({
  docDef,
  uploadedDoc,
  onUpload,
  onDelete,
  color,
  isUploading,
}: {
  docDef: typeof documentDefinitions[0];
  uploadedDoc?: KYCDocument;
  onUpload: (type: KYCDocumentType, file: File) => void;
  onDelete: (id: string, type: KYCDocumentType) => void;
  color: string;
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

  const getStatusColor = () => {
    if (!uploadedDoc) return color;
    switch (uploadedDoc.status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.danger;
      default: return colors.accent; // pending status - amber/yellow
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${!uploadedDoc && !isUploading ? 'cursor-pointer hover:border-opacity-100' : ''}`}
      style={{
        backgroundColor: colors.bgCardHover,
        borderColor: uploadedDoc ? getStatusColor() : color,
        borderWidth: '2px',
        borderStyle: uploadedDoc ? 'solid' : 'dashed',
      }}
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
            <Loader2 className="w-6 h-6 mt-0.5 flex-shrink-0 animate-spin" style={{ color }} />
          ) : uploadedDoc ? (
            <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: getStatusColor() }} />
          ) : (
            <Upload className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color }} />
          )}
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {docDef.name}
              {docDef.required ? (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.danger}20`, color: colors.danger }}>
                  Required
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.success}20`, color: colors.success }}>
                  Optional
                </span>
              )}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              {docDef.description}
            </div>
            {uploadedDoc && (
              <div className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {uploadedDoc.file_name} - {uploadedDoc.status}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uploadedDoc && (
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4" style={{ color: colors.danger }} />
            </button>
          )}
          <div
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: uploadedDoc ? `${getStatusColor()}20` : `${color}20`,
              color: uploadedDoc ? getStatusColor() : color,
            }}
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
