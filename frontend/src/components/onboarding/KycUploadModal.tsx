import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  Building2,
  Users,
  Briefcase,
  Shield,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { colors } from './OnboardingLayout';

// Document types
interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  category: string;
}

// Full KYC document list from doc5 (23 documents across 6 categories)
const kycDocumentCategories = [
  {
    id: 'corporate',
    name: 'Corporate Information Documents',
    icon: Building2,
    color: '#3b82f6',
    documents: [
      { id: 'cert_incorporation', name: 'Certificate of Incorporation/Registration', description: 'Official document from company registry showing company name, registration number, establishment date', required: true },
      { id: 'articles', name: 'Articles of Association / Constitutional Documents', description: 'Complete corporate bylaws showing ownership structure, decision-making authority', required: true },
      { id: 'board_resolution', name: 'Board Resolution (Authorizing Carbon Trading)', description: 'Board decision authorizing trading in carbon allowances and entering into agreements with Nihao', required: true },
      { id: 'good_standing', name: 'Certificate of Good Standing', description: 'From company registry showing company in good legal standing, no pending dissolution', required: true },
    ],
  },
  {
    id: 'ownership',
    name: 'Beneficial Ownership Documentation',
    icon: Users,
    color: '#8b5cf6',
    documents: [
      { id: 'bo_declaration', name: 'Beneficial Ownership Declaration', description: 'Complete declaration of all beneficial owners (25%+ ownership)', required: true },
      { id: 'shareholder_register', name: 'Shareholder Register', description: 'Official shareholder list showing all shareholders, ownership percentages', required: true },
      { id: 'org_chart', name: 'Organizational Chart', description: 'Visual representation of corporate structure showing parent company, subsidiaries', required: true },
      { id: 'bo_id', name: 'Beneficial Owner Identification Documents', description: 'Valid passport or government ID for each beneficial owner (25%+), plus proof of address', required: true },
    ],
  },
  {
    id: 'financial',
    name: 'Financial Documentation',
    icon: Briefcase,
    color: '#10b981',
    documents: [
      { id: 'financial_statements', name: 'Recent Financial Statements (2-3 years)', description: 'Audited balance sheet, income statement, cash flow statement with notes', required: true },
      { id: 'bank_reference', name: 'Bank Reference Letter', description: 'From company\'s primary bank confirming account holder status, creditworthiness', required: true },
      { id: 'tax_certificate', name: 'Tax Compliance Certificate', description: 'Proof of good standing with tax authorities, no tax liens or pending investigations', required: true },
      { id: 'credit_rating', name: 'Credit Rating or Financial Verification', description: 'Credit rating from Dun & Bradstreet or similar, or bank financial verification', required: false },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance & Regulatory Documentation',
    icon: Shield,
    color: '#f59e0b',
    documents: [
      { id: 'regulatory_licenses', name: 'Regulatory Licenses and Approvals', description: 'Financial services licenses, environmental permits, sector-specific approvals', required: false },
      { id: 'compliance_policies', name: 'Compliance Policies and Procedures', description: 'AML/CFT policy documentation, KYC procedures, risk assessment framework', required: true },
      { id: 'directors_list', name: 'List of Directors and Managers', description: 'Names and titles of all board members and senior management with contact details', required: true },
      { id: 'authorized_signatories', name: 'Authorized Signatories Documentation', description: 'Board resolution identifying authorized individuals for trading decisions, fund transfers', required: true },
    ],
  },
  {
    id: 'business',
    name: 'Business & Use of Funds Documentation',
    icon: FileCheck,
    color: '#ec4899',
    documents: [
      { id: 'business_description', name: 'Business Description and Purpose Statement', description: 'Detailed description of company business and carbon allowance trading purpose', required: true },
      { id: 'use_of_funds', name: 'Use of Funds Statement', description: 'Description of intended use of Nihao account funds, estimated volumes, frequency', required: true },
      { id: 'trading_plan', name: 'Anticipated Trading Activity Plan', description: '12-month projection of expected trading volumes, transaction amounts, risk management', required: true },
    ],
  },
  {
    id: 'verification',
    name: 'Additional Verification Documents',
    icon: FileText,
    color: '#06b6d4',
    documents: [
      { id: 'website_verification', name: 'Corporate Website and Business Verification', description: 'Corporate website review, business directory listings, industry association memberships', required: false },
      { id: 'sanctions_declaration', name: 'Sanctions and PEP Screening Declarations', description: 'Declaration that no directors/beneficial owners on sanctions lists or are PEPs', required: true },
      { id: 'negative_screening', name: 'Negative Screening Results', description: 'Results from OFAC, EU, UN sanctions database searches', required: true },
      { id: 'adverse_media', name: 'Adverse Media and Reputational Screening', description: 'Results from media screening looking for negative publicity, regulatory actions', required: true },
    ],
  },
];

// Flatten documents for state management
const flattenDocuments = (): DocumentType[] => {
  return kycDocumentCategories.flatMap(cat =>
    cat.documents.map(doc => ({
      ...doc,
      uploaded: false,
      status: 'pending' as const,
      category: cat.id,
    }))
  );
};

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
  const [documents, setDocuments] = useState<DocumentType[]>(flattenDocuments());
  const [activeCategory, setActiveCategory] = useState('corporate');

  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredCount = documents.filter(d => d.required).length;
  const uploadedRequiredCount = documents.filter(d => d.required && d.uploaded).length;
  const progress = Math.round((uploadedRequiredCount / requiredCount) * 100);

  useEffect(() => {
    onProgressChange(progress);
  }, [progress, onProgressChange]);

  const handleUpload = (id: string, _file: File) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, uploaded: true, status: 'uploaded' } : doc
      )
    );
  };

  const handleSubmit = () => {
    alert('KYC documents submitted for review! You will be notified once verification is complete.');
    onClose();
  };

  const canSubmit = uploadedRequiredCount >= requiredCount;
  const activeDocuments = documents.filter(d => d.category === activeCategory);
  const activeCategoryData = kycDocumentCategories.find(c => c.id === activeCategory);

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
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
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
                Complete Your KYC Documentation
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Upload the required 23 documents across 6 categories to complete your account verification
              </p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span style={{ color: colors.textSecondary }}>
                    {uploadedRequiredCount} of {requiredCount} required documents
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
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div
                className="w-64 flex-shrink-0 p-4 space-y-2 overflow-y-auto"
                style={{ borderRight: `1px solid ${colors.border}` }}
              >
                {kycDocumentCategories.map(cat => {
                  const Icon = cat.icon;
                  const catDocs = documents.filter(d => d.category === cat.id);
                  const catUploaded = catDocs.filter(d => d.uploaded).length;
                  const catRequired = catDocs.filter(d => d.required).length;
                  const isActive = activeCategory === cat.id;
                  const isComplete = catUploaded >= catRequired;

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
                            className="font-medium text-sm truncate"
                            style={{ color: isActive ? colors.textPrimary : colors.textSecondary }}
                          >
                            {cat.name.split(' ')[0]}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                              {catUploaded}/{cat.documents.length}
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
                {activeCategoryData && (
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
                          {activeDocuments.filter(d => d.uploaded).length} of {activeDocuments.length} documents uploaded
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {activeDocuments.map(doc => (
                        <DocumentUploadCard
                          key={doc.id}
                          doc={doc}
                          onUpload={handleUpload}
                          color={activeCategoryData.color}
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
                  Total: {uploadedCount}/{documents.length} documents uploaded
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
                style={{
                  background: canSubmit
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    : colors.bgCardHover,
                  opacity: canSubmit ? 1 : 0.5,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {canSubmit ? 'Submit for Verification' : `Upload ${requiredCount - uploadedRequiredCount} more required document(s)`}
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
  doc,
  onUpload,
  color,
}: {
  doc: DocumentType;
  onUpload: (id: string, file: File) => void;
  color: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(doc.id, file);
    }
  };

  return (
    <div
      className="p-4 rounded-xl border transition-all cursor-pointer hover:border-opacity-100"
      style={{
        backgroundColor: colors.bgCardHover,
        borderColor: doc.uploaded ? colors.success : color,
        borderWidth: '2px',
        borderStyle: doc.uploaded ? 'solid' : 'dashed',
      }}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={handleFileChange}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {doc.uploaded ? (
            <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
          ) : (
            <Upload className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color }} />
          )}
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {doc.name}
              {doc.required && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.danger}20`, color: colors.danger }}>
                  Required
                </span>
              )}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              {doc.description}
            </div>
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: doc.uploaded ? `${colors.success}20` : `${color}20`,
            color: doc.uploaded ? colors.success : color,
          }}
        >
          {doc.uploaded ? 'Uploaded ✓' : 'Click to Upload'}
        </div>
      </div>
    </div>
  );
}
