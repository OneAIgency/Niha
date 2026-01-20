import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card } from '../components/common';
import { AdminOrderBookSection } from '../components/backoffice';
import type { CertificateType } from '../types';

export function BackofficeOrderBookPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
              Order Management
            </h1>
          </div>
          <p className="text-navy-600 dark:text-navy-300">
            View order book and place BID/ASK orders on behalf of Market Makers
          </p>
        </div>

        {/* Certificate Type Toggle */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
              Certificate Type:
            </span>
            <div className="flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600">
              {(['CEA', 'EUA'] as CertificateType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setCertificateType(type)}
                  className={`px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                    certificateType === type
                      ? type === 'CEA'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
                  }`}
                >
                  {type}
                  <span className="ml-2 text-xs opacity-75">
                    {type === 'CEA' ? '(Chinese)' : '(European)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Order Book Section with Animation */}
        <motion.div
          key={certificateType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AdminOrderBookSection certificateType={certificateType} />
        </motion.div>
      </div>
    </div>
  );
}
