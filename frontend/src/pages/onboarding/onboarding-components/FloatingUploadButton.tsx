import { motion } from 'framer-motion';
import { Upload, CheckCircle } from 'lucide-react';

interface FloatingUploadButtonProps {
  progress: number;
  onClick: () => void;
}

export function FloatingUploadButton({ progress, onClick }: FloatingUploadButtonProps) {
  const isComplete = progress >= 100;

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${
        isComplete
          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
          : 'bg-gradient-to-br from-amber-500 to-red-500'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={!isComplete ? {
        boxShadow: [
          '0 0 20px rgba(245, 158, 11, 0.4)',
          '0 0 40px rgba(245, 158, 11, 0.6)',
          '0 0 20px rgba(245, 158, 11, 0.4)',
        ],
      } : {}}
      transition={!isComplete ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {}}
    >
      {isComplete ? (
        <CheckCircle className="w-6 h-6 text-white" />
      ) : (
        <Upload className="w-6 h-6 text-white" />
      )}
      <div className="text-white">
        <div className="text-sm font-semibold">
          {isComplete ? 'Documents Complete' : 'Complete KYC'}
        </div>
        <div className="text-xs opacity-90">
          {progress}% uploaded
        </div>
      </div>
      {!isComplete && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </motion.button>
  );
}
