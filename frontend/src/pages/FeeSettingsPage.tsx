import { useState, useEffect, useCallback } from 'react';
import { Settings, Percent, Building2, Plus, Pencil, Trash2, Save, RefreshCw } from 'lucide-react';
import { feesApi, adminApi } from '../services/api';
import { BackofficeLayout } from '../components/layout';
import { AlertBanner } from '../components/common';
import type {
  TradingFeeConfig,
  EntityFeeOverride,
  MarketTypeEnum,
  Entity
} from '../types';

type MarketDisplayName = { [key in MarketTypeEnum]: string };

const MARKET_NAMES: MarketDisplayName = {
  CEA_CASH: 'CEA Cash',
  SWAP: 'Swap',
};

export function FeeSettingsPage() {
  const [marketFees, setMarketFees] = useState<TradingFeeConfig[]>([]);
  const [entityOverrides, setEntityOverrides] = useState<EntityFeeOverride[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editing states for market fees
  const [editingMarket, setEditingMarket] = useState<MarketTypeEnum | null>(null);
  const [editBidRate, setEditBidRate] = useState('');
  const [editAskRate, setEditAskRate] = useState('');

  // Modal for entity override
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingOverride, setEditingOverride] = useState<EntityFeeOverride | null>(null);
  const [overrideEntityId, setOverrideEntityId] = useState('');
  const [overrideMarket, setOverrideMarket] = useState<MarketTypeEnum>('CEA_CASH');
  const [overrideBidRate, setOverrideBidRate] = useState('');
  const [overrideAskRate, setOverrideAskRate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [feesRes, entitiesRes] = await Promise.all([
        feesApi.getAllFees(),
        adminApi.getEntities(),
      ]);

      setMarketFees(feesRes.marketFees || []);
      setEntityOverrides(feesRes.entityOverrides || []);
      setEntities(entitiesRes || []);
    } catch (err) {
      console.error('Error fetching fee data:', err);
      setError('Failed to load fee settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditMarketFee = (fee: TradingFeeConfig) => {
    setEditingMarket(fee.market);
    setEditBidRate((fee.bidFeeRate * 100).toFixed(2));
    setEditAskRate((fee.askFeeRate * 100).toFixed(2));
  };

  const handleSaveMarketFee = async (market: MarketTypeEnum) => {
    try {
      setIsSaving(market);
      const bidRate = parseFloat(editBidRate) / 100;
      const askRate = parseFloat(editAskRate) / 100;

      if (isNaN(bidRate) || isNaN(askRate) || bidRate < 0 || askRate < 0) {
        setError('Invalid fee rates. Must be positive numbers.');
        return;
      }

      await feesApi.updateMarketFees(market, {
        bidFeeRate: bidRate,
        askFeeRate: askRate,
      });

      setEditingMarket(null);
      showSuccess(`${MARKET_NAMES[market]} fees updated successfully`);
      fetchData();
    } catch (err) {
      console.error('Error saving market fee:', err);
      setError('Failed to save market fees');
    } finally {
      setIsSaving(null);
    }
  };

  const handleOpenOverrideModal = (override?: EntityFeeOverride) => {
    if (override) {
      setEditingOverride(override);
      setOverrideEntityId(override.entityId);
      setOverrideMarket(override.market);
      setOverrideBidRate(override.bidFeeRate !== null ? (override.bidFeeRate * 100).toFixed(2) : '');
      setOverrideAskRate(override.askFeeRate !== null ? (override.askFeeRate * 100).toFixed(2) : '');
    } else {
      setEditingOverride(null);
      setOverrideEntityId('');
      setOverrideMarket('CEA_CASH');
      setOverrideBidRate('');
      setOverrideAskRate('');
    }
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async () => {
    try {
      if (!overrideEntityId) {
        setError('Please select a client');
        return;
      }

      const bidRate = overrideBidRate ? parseFloat(overrideBidRate) / 100 : null;
      const askRate = overrideAskRate ? parseFloat(overrideAskRate) / 100 : null;

      if ((bidRate !== null && (isNaN(bidRate) || bidRate < 0)) ||
          (askRate !== null && (isNaN(askRate) || askRate < 0))) {
        setError('Invalid fee rates. Must be positive numbers or empty.');
        return;
      }

      setIsSaving('override');

      await feesApi.upsertEntityOverride(overrideEntityId, {
        market: overrideMarket,
        bidFeeRate: bidRate,
        askFeeRate: askRate,
      });

      setShowOverrideModal(false);
      showSuccess('Entity fee override saved successfully');
      fetchData();
    } catch (err) {
      console.error('Error saving override:', err);
      setError('Failed to save entity override');
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteOverride = async (entityId: string, market: MarketTypeEnum) => {
    if (!confirm('Are you sure you want to delete this fee override? The client will use default market fees.')) {
      return;
    }

    try {
      setIsSaving(`delete-${entityId}-${market}`);
      await feesApi.deleteEntityOverride(entityId, market);
      showSuccess('Fee override deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting override:', err);
      setError('Failed to delete fee override');
    } finally {
      setIsSaving(null);
    }
  };

  const formatFeeRate = (rate: number | null): string => {
    if (rate === null) return '-';
    return `${(rate * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <BackofficeLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Percent className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              Fee Settings
            </h1>
            <p className="text-sm text-navy-600 dark:text-navy-400">
              Configure trading fees per market and per client
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
      {successMessage && (
        <AlertBanner variant="success" message={successMessage} />
      )}

      {/* Default Market Fees */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-navy-200 dark:border-navy-700">
        <div className="p-4 border-b border-navy-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-navy-600 dark:text-navy-400" />
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
              Default Fees per Market
            </h2>
          </div>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            These rates apply to all clients unless overridden
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['CEA_CASH', 'SWAP'] as MarketTypeEnum[]).map((market) => {
              const fee = marketFees.find(f => f.market === market);
              const isEditing = editingMarket === market;

              return (
                <div
                  key={market}
                  className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg border border-navy-200 dark:border-navy-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-navy-900 dark:text-white">
                      {MARKET_NAMES[market]}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => fee && handleEditMarketFee(fee)}
                        className="p-1.5 text-navy-600 dark:text-navy-400 hover:bg-navy-200 dark:hover:bg-navy-600 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-navy-600 dark:text-navy-400 mb-1">
                          Buyer Fee (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editBidRate}
                          onChange={(e) => setEditBidRate(e.target.value)}
                          className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-600 dark:text-navy-400 mb-1">
                          Seller Fee (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editAskRate}
                          onChange={(e) => setEditAskRate(e.target.value)}
                          className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMarketFee(market)}
                          disabled={isSaving === market}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {isSaving === market ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMarket(null)}
                          className="px-3 py-2 text-navy-600 dark:text-navy-400 hover:bg-navy-200 dark:hover:bg-navy-600 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs text-navy-500 dark:text-navy-400">Buyer Fee</span>
                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {fee ? formatFeeRate(fee.bidFeeRate) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-navy-500 dark:text-navy-400">Seller Fee</span>
                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {fee ? formatFeeRate(fee.askFeeRate) : '-'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entity Fee Overrides */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-navy-200 dark:border-navy-700">
        <div className="p-4 border-b border-navy-200 dark:border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy-600 dark:text-navy-400" />
            <div>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                Client Fee Overrides
              </h2>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Custom fee rates for specific clients
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenOverrideModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Override
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 dark:bg-navy-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Buyer Fee
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Seller Fee
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-200 dark:divide-navy-700">
              {entityOverrides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                    No client fee overrides configured
                  </td>
                </tr>
              ) : (
                entityOverrides.map((override) => (
                  <tr key={`${override.entityId}-${override.market}`} className="hover:bg-navy-50 dark:hover:bg-navy-700/30">
                    <td className="px-4 py-3 text-sm text-navy-900 dark:text-white font-medium">
                      {override.entityName}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-600 dark:text-navy-400">
                      {MARKET_NAMES[override.market]}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={override.bidFeeRate !== null ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-navy-400'}>
                        {formatFeeRate(override.bidFeeRate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={override.askFeeRate !== null ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-navy-400'}>
                        {formatFeeRate(override.askFeeRate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenOverrideModal(override)}
                          className="p-1.5 text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOverride(override.entityId, override.market)}
                          disabled={isSaving === `delete-${override.entityId}-${override.market}`}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isSaving === `delete-${override.entityId}-${override.market}` ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
              {editingOverride ? 'Edit Fee Override' : 'Add Fee Override'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Client
                </label>
                <select
                  value={overrideEntityId}
                  onChange={(e) => setOverrideEntityId(e.target.value)}
                  disabled={!!editingOverride}
                  className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-navy-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select a client...</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Market
                </label>
                <select
                  value={overrideMarket}
                  onChange={(e) => setOverrideMarket(e.target.value as MarketTypeEnum)}
                  disabled={!!editingOverride}
                  className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-navy-900 dark:text-white disabled:opacity-50"
                >
                  <option value="CEA_CASH">CEA Cash</option>
                  <option value="SWAP">Swap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Buyer Fee (%) <span className="text-navy-500 font-normal">- leave empty to use default</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overrideBidRate}
                  onChange={(e) => setOverrideBidRate(e.target.value)}
                  placeholder="e.g., 0.50"
                  className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Seller Fee (%) <span className="text-navy-500 font-normal">- leave empty to use default</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overrideAskRate}
                  onChange={(e) => setOverrideAskRate(e.target.value)}
                  placeholder="e.g., 0.50"
                  className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveOverride}
                disabled={isSaving === 'override'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isSaving === 'override' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Override
              </button>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </BackofficeLayout>
  );
}
