import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AdminOrderBookSection } from '../components/backoffice/AdminOrderBookSection';
import { PlaceMarketOrderSection } from '../components/backoffice/PlaceMarketOrderSection';
import type { CertificateType } from '../types';
import { cn } from '../utils';

export function MarketOrdersPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderPlaced = () => {
    // Trigger refresh by incrementing key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
              Market Orders Management
            </h1>
          </div>
          <p className="text-navy-600 dark:text-navy-300">
            Place orders on behalf of market makers with real-time order book view
          </p>
        </div>

        {/* Certificate Type Selector */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg overflow-hidden border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800">
            {(['CEA', 'EUA'] as CertificateType[]).map((type) => (
              <button
                key={type}
                onClick={() => setCertificateType(type)}
                className={cn(
                  'px-6 py-3 text-sm font-semibold transition-colors',
                  certificateType === type
                    ? type === 'CEA'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                    : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <motion.div
          key={certificateType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Left: Order Book */}
          <div className="h-[700px]">
            <AdminOrderBookSection key={`orderbook-${refreshKey}`} certificateType={certificateType} />
          </div>

          {/* Right: Order Form + Orders List */}
          <div className="space-y-6">
            <PlaceMarketOrderSection
              certificateType={certificateType}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
