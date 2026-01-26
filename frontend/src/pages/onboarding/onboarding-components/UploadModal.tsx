import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import type { DocumentType } from './onboardingData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentType[];
  onUpload: (id: string, file: File) => void;
  onSubmit: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  documents,
  onUpload,
  onSubmit,
}: UploadModalProps) {
  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredCount = documents.filter(d => d.required).length;
  const progress = Math.round((uploadedCount / requiredCount) * 100);
  const canSubmit = uploadedCount >= requiredCount;

  const companyDocs = documents.filter(d => d.category === 'company');
  const representativeDocs = documents.filter(d => d.category === 'representative');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/90"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl p-8 bg-navy-800 border border-navy-700"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-navy-600 transition-colors"
            >
              <X className="w-6 h-6 text-navy-200" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Complete Your KYC Documentation
              </h2>
              <p className="text-navy-200">
                Upload the required documents to complete your account verification and unlock full platform access
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-navy-200">Progress</span>
                <span className="text-teal-300">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-navy-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Company Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400">
                <Building2 className="w-5 h-5" />
                Company Documents
              </h3>
              <div className="grid gap-4">
                {companyDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onUpload={onUpload} />
                ))}
              </div>
            </div>

            {/* Representative Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-400">
                <Users className="w-5 h-5" />
                Representative Documents
              </h3>
              <div className="grid gap-4">
                {representativeDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onUpload={onUpload} />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`w-full px-6 py-4 rounded-xl font-semibold text-white transition-all ${
                canSubmit
                  ? 'bg-gradient-to-br from-teal-500 to-blue-700 opacity-100 cursor-pointer'
                  : 'bg-navy-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {canSubmit ? 'Submit for Verification' : `Upload ${requiredCount - uploadedCount} more document(s)`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
