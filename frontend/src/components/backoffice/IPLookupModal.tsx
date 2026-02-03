import { memo } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, RefreshCw } from 'lucide-react';

interface IPLookupResult {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

interface IPLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipLookupData: IPLookupResult | null;
  ipLookupLoading: boolean;
}

export const IPLookupModal: FC<IPLookupModalProps> = memo(({
  isOpen,
  onClose,
  ipLookupData,
  ipLookupLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700">
          <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            IP Address Lookup
          </h3>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {ipLookupLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="ml-2 text-navy-600 dark:text-navy-300">Looking up IP...</span>
            </div>
          ) : ipLookupData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">IP Address</span>
                  <span className="font-mono text-navy-900 dark:text-white">{ipLookupData.ip}</span>
                </div>
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">Country</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.country} ({ipLookupData.country_code})</span>
                </div>
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">Region</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.region}</span>
                </div>
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">City</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.city} {ipLookupData.zip}</span>
                </div>
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">Timezone</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.timezone}</span>
                </div>
                <div>
                  <span className="text-navy-500 dark:text-navy-400 block">Coordinates</span>
                  <span className="font-mono text-xs text-navy-900 dark:text-white">{ipLookupData.lat}, {ipLookupData.lon}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-navy-500 dark:text-navy-400 block">ISP</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.isp}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-navy-500 dark:text-navy-400 block">Organization</span>
                  <span className="text-navy-900 dark:text-white">{ipLookupData.org}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-navy-500 dark:text-navy-400 block">AS</span>
                  <span className="font-mono text-xs text-navy-900 dark:text-white">{ipLookupData.as}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-navy-500 dark:text-navy-400">
              Failed to load IP information
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

IPLookupModal.displayName = 'IPLookupModal';
