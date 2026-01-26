import { useRef } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import type { DocumentType } from './onboardingData';

interface DocumentCardProps {
  doc: DocumentType;
  onUpload: (id: string, file: File) => void;
}

export function DocumentCard({ doc, onUpload }: DocumentCardProps) {
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
      className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-opacity-100 ${
        doc.uploaded ? 'bg-navy-700 border-emerald-500 border-solid' : 'bg-navy-700 border-dashed border-navy-600 dark:border-navy-500'
      }`}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {doc.uploaded ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <FileText className="w-5 h-5 text-navy-600 dark:text-navy-400" />
          )}
          <div>
            <div className="font-medium text-white">
              {doc.name}
              {doc.required && <span className="text-red-500"> *</span>}
            </div>
            <div className="text-sm text-navy-400">
              {doc.description}
            </div>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            doc.uploaded ? 'bg-emerald-500/20 text-emerald-500' : 'bg-navy-100 dark:bg-navy-500/20 text-navy-600 dark:text-navy-400'
          }`}
        >
          {doc.uploaded ? 'Uploaded' : 'Upload'}
        </div>
      </div>
    </div>
  );
}
