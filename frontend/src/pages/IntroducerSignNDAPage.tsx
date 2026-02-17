import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { contactApi, usersApi } from '../services/api';
import { useAuthStore } from '../stores/useStore';

export function IntroducerSignNDAPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setAuth, token } = useAuthStore();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await contactApi.uploadIntroducerNDA(file);
      // Refetch user to get updated ndaSigned status
      try {
        const updatedUser = await usersApi.getProfile();
        if (token) setAuth(updatedUser, token);
      } catch {
        // Non-critical — user state will refresh on next login
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-semibold text-white">NDA Uploaded</h2>
          <p className="text-sm text-navy-400">
            Your signed NDA has been submitted for review. You'll receive access to the
            Introducer Dashboard once approved.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-white">Upload Signed NDA</h2>
          <p className="text-sm text-navy-400">
            To access your Introducer Dashboard, please upload the NDA document we sent to your email, signed by you.
          </p>
        </div>

        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setError(''); }}
        />

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-navy-700 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500/30 transition-colors"
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <FileText className="w-5 h-5" />
              <span className="text-sm">{file.name}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-navy-600 mx-auto" />
              <div className="text-sm text-navy-500">Click to upload signed NDA (PDF)</div>
            </div>
          )}
        </div>

        {error && <div className="text-xs text-red-400 text-center">{error}</div>}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-medium transition-colors"
        >
          {uploading ? 'Uploading...' : 'Submit NDA'}
        </button>
      </div>
    </div>
  );
}
