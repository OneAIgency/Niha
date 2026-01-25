import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, AlertCircle, X, Bot } from 'lucide-react';
import { Button, Card, Subheader } from '../components/common';
import { MarketMakersList } from '../components/backoffice/MarketMakersList';
import { CreateMarketMakerModal } from '../components/backoffice/CreateMarketMakerModal';
import { EditMarketMakerModal } from '../components/backoffice/EditMarketMakerModal';
import { getMarketMakers } from '../services/api';
import { cn } from '../utils';
import type { MarketMaker } from '../types';

export function MarketMakersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<MarketMaker | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950">
      <Subheader
        icon={<Bot className="w-5 h-5 text-purple-500" />}
        title="Market Makers Management"
        description="Create and manage AI-powered market makers"
        iconBg="bg-purple-500/20"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={loadMarketMakers}
          icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
        >
          Refresh
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Market Maker
        </Button>
      </Subheader>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Market Makers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <MarketMakersList
              marketMakers={marketMakers}
              loading={loading}
              onSelectMM={handleSelectMM}
            />
          </Card>
        </motion.div>

        {/* Create Market Maker Modal */}
        {showCreateModal && (
          <CreateMarketMakerModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
            currentMMCount={marketMakers.length}
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
      </div>
    </div>
  );
}
