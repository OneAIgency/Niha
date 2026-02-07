import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { MarketMakerDetailsTab } from './MarketMakerDetailsTab';
import { MarketMakerTransactionsTab } from './MarketMakerTransactionsTab';
import { MarketMakerAutoTradeTab } from './MarketMakerAutoTradeTab';
import type { MarketMaker } from '../../types';

interface EditMarketMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  marketMaker: MarketMaker;
}

export function EditMarketMakerModal({ isOpen, onClose, onSuccess, marketMaker }: EditMarketMakerModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'transactions' | 'autotrade'>('details');

  useEffect(() => {
    if (isOpen) {
      // Reset tab to details when modal opens
      setActiveTab('details');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
            <div>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                Edit Market Maker
              </h2>
              {marketMaker.description && (
                <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                  {marketMaker.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-navy-200 dark:border-navy-700">
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'details'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'transactions'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                )}
              >
                Balances & Transactions
              </button>
              <button
                onClick={() => setActiveTab('autotrade')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'autotrade'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                )}
              >
                Auto Trade
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {activeTab === 'details' && (
              <MarketMakerDetailsTab marketMaker={marketMaker} onUpdateSuccess={onSuccess} />
            )}
            {activeTab === 'transactions' && (
              <MarketMakerTransactionsTab
                marketMakerId={marketMaker.id}
                mmType={marketMaker.mmType}
                showCea={marketMaker.mmType === 'CEA_SELLER'}
                showEua={marketMaker.mmType === 'EUA_OFFER'}
                showCeaOption={marketMaker.mmType !== 'EUA_OFFER'}
                showEuaOption={marketMaker.mmType === 'EUA_OFFER'}
              />
            )}
            {activeTab === 'autotrade' && (
              <MarketMakerAutoTradeTab marketMaker={marketMaker} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
