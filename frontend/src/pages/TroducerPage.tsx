import { useState } from 'react';
import { Copy, Check, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/useStore';

export function TroducerPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const code = user?.referralCode;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-xs uppercase tracking-wider text-navy-500">Your Referral Code</div>

        {code ? (
          <div
            onClick={handleCopy}
            className="bg-navy-800/50 border border-navy-700 rounded-xl p-8 cursor-pointer hover:border-emerald-500/30 transition-colors group"
          >
            <div className="text-4xl font-mono font-bold text-white tracking-[0.2em] select-all">
              {code}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-navy-500 group-hover:text-emerald-400 transition-colors">
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Click to copy</>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-navy-800/50 border border-navy-700 rounded-xl p-8">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-navy-300">Your referral code has been used.</p>
          </div>
        )}

        <p className="text-xs text-navy-500 leading-relaxed">
          Share this code to invite someone as an introducer. This code works once.
        </p>
      </div>
    </div>
  );
}
