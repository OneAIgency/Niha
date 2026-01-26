import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';

interface BlurOverlayProps {
  show: boolean;
  title?: string;
  message?: string;
  showContactButton?: boolean;
}

export function BlurOverlay({
  show,
  title = 'Account Not Funded',
  message = 'Fund your account to access this feature. Contact our support team to complete your account setup.',
  showContactButton = true,
}: BlurOverlayProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 backdrop-blur-md bg-white/60 dark:bg-navy-900/60 flex items-center justify-center z-10 rounded-lg"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-navy-200 dark:border-navy-700 p-8 max-w-md mx-4 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-navy-100 to-navy-200 dark:from-navy-700 dark:to-navy-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-navy-600 dark:text-navy-300" />
        </div>

        <h3 className="text-2xl font-bold text-navy-900 dark:text-white mb-3">
          {title}
        </h3>

        <p className="text-navy-600 dark:text-navy-400 mb-6 leading-relaxed">
          {message}
        </p>

        {showContactButton && (
          <a
            href="mailto:support@nihaogroup.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        )}
      </motion.div>
    </motion.div>
  );
}
