import { useState } from 'react';
import { motion } from 'framer-motion';
import { BackofficeLayout } from '../components/layout';
import { AdminOrderBookSection } from '../components/backoffice';
import type { CertificateType } from '../types';
import { cn } from '../utils';

export function BackofficeOrderBookPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');

  return (
    <BackofficeLayout
      subSubHeaderLeft={
        <div className="inline-flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800">
          {(['CEA', 'EUA'] as CertificateType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCertificateType(type)}
              className={cn(
                'px-6 py-2 text-sm font-semibold transition-colors',
                certificateType === type
                  ? 'bg-navy-600 text-white'
                  : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      }
    >
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          key={certificateType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-[600px] lg:h-[700px] xl:h-[800px]">
            <AdminOrderBookSection certificateType={certificateType} />
          </div>
        </motion.div>
      </div>
    </BackofficeLayout>
  );
}
