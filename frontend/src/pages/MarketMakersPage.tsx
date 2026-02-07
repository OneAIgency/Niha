import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, RotateCcw, Loader2, ShieldAlert } from 'lucide-react';
import { Button, Input, AlertBanner } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import { MarketMakersList } from '../components/backoffice/MarketMakersList';
import { CreateMarketMakersModal } from '../components/backoffice/CreateMarketMakersModal';
import { EditMarketMakerModal } from '../components/backoffice/EditMarketMakerModal';
import { getMarketMakers, resetAllMarketMakers } from '../services/api';
import { cn } from '../utils';
import type { MarketMaker } from '../types';

export function MarketMakersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<MarketMaker | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadMarketMakers();
  }, []);

  const loadMarketMakers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketMakers();
      setMarketMakers(data);
    } catch (err) {
      console.error('Failed to load market makers:', err);
      setError('Failed to load market makers. Please try again.');
      setMarketMakers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMM = (mm: MarketMaker) => {
    setSelectedMM(mm);
    setShowEditModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadMarketMakers();
  };

  const handleUpdateSuccess = () => {
    setShowEditModal(false);
    setSelectedMM(null);
    loadMarketMakers();
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedMM(null);
  };

  const handleResetMMs = async () => {
    if (!resetPassword) {
      setResetError('Password is required');
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      await resetAllMarketMakers(resetPassword);
      setShowResetModal(false);
      setResetPassword('');
      loadMarketMakers();
    } catch (err) {
      // Handle both Error objects and API standardized error responses
      let errorMessage = 'Reset failed';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      if (errorMessage.includes('403') || errorMessage.includes('Invalid')) {
        setResetError('Invalid password');
      } else {
        setResetError(errorMessage);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetPassword('');
    setResetError(null);
  };

  return (
    <BackofficeLayout
      subSubHeader={
        <>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<Users className="w-4 h-4" />}
          >
            Refund Market Makers
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowResetModal(true)}
            icon={<RotateCcw className="w-4 h-4" />}
            disabled={marketMakers.length === 0}
          >
            Reset MMs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMarketMakers}
            icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
          >
            Refresh
          </Button>
        </>
      }
    >
      {/* Error Display */}
      {error && (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Market Makers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MarketMakersList
          marketMakers={marketMakers}
          loading={loading}
          onSelectMM={handleSelectMM}
        />
      </motion.div>

      {/* Create Market Makers Modal */}
      {showCreateModal && (
        <CreateMarketMakersModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Market Maker Modal */}
      {selectedMM && showEditModal && (
        <EditMarketMakerModal
          isOpen={showEditModal}
          onClose={handleCloseEdit}
          onSuccess={handleUpdateSuccess}
          marketMaker={selectedMM}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseResetModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Reset All Market Makers
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will reset <strong>{marketMakers.length} market makers</strong>:
                </p>
                <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                  <li>Zero all balances (EUR, CEA, EUA)</li>
                  <li>Delete all MM orders (from order book)</li>
                  <li>Delete all cash market trades</li>
                  <li>Delete all asset transactions</li>
                  <li>Delete all audit tickets</li>
                </ul>
                <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                  Market Maker accounts will be kept. Use <strong>Refund Market Makers</strong> to add new balances.
                </p>
              </div>

              <div>
                <Input
                  label="Enter password to confirm"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.value);
                    setResetError(null);
                  }}
                  placeholder="Enter reset password"
                  error={resetError || undefined}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <Button
                variant="ghost"
                onClick={handleCloseResetModal}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleResetMMs}
                disabled={!resetPassword || isResetting}
                icon={isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              >
                {isResetting ? 'Resetting...' : 'Reset All MMs'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </BackofficeLayout>
  );
}
