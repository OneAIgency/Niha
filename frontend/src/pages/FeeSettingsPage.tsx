import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Building2, Plus, Pencil, Trash2, Save, RefreshCw, Users, Search, X } from 'lucide-react';
import { feesApi, adminApi } from '../services/api';
import { BackofficeLayout } from '../components/layout';
import { AlertBanner, NumberInput, PageLoadingState } from '../components/common';
import { cn } from '../utils';
import { getApiErrorMessage } from '../utils/errors';
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
  const [activeTab, setActiveTab] = useState<'default' | 'introducer' | 'special'>('default');
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

  // Introducer fees state
  const [introducerDefaultRate, setIntroducerDefaultRate] = useState<string | null>(null);
  const [introducerOverrides, setIntroducerOverrides] = useState<
    Array<{ userId: string; email: string; firstName: string; lastName: string; commissionRate: string }>
  >([]);
  const [editingDefaultRate, setEditingDefaultRate] = useState(false);
  const [editDefaultRateValue, setEditDefaultRateValue] = useState('');
  const [editingOverrideUserId, setEditingOverrideUserId] = useState<string | null>(null);
  const [editOverrideRateValue, setEditOverrideRateValue] = useState('');

  // Special tab: client search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    entities: Array<{ id: string; name: string; type: 'entity' }>;
    introducers: Array<{ id: string; email: string; firstName: string; lastName: string; type: 'introducer'; commissionRate: string | null }>;
  } | null>(null);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    type: 'entity' | 'introducer';
    email?: string;
    commissionRate?: string | null;
  } | null>(null);
  const [editingClientCommission, setEditingClientCommission] = useState(false);
  const [editClientCommissionValue, setEditClientCommissionValue] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

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
    } catch (err: unknown) {
      console.error('Error fetching fee data:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchIntroducerData = useCallback(async () => {
    try {
      setError(null);
      const [defaultsRes, overridesRes] = await Promise.all([
        feesApi.getIntroducerDefaults(),
        feesApi.getIntroducerOverrides(),
      ]);
      setIntroducerDefaultRate(defaultsRes.commissionRate);
      setIntroducerOverrides(overridesRes);
    } catch (err: unknown) {
      console.error('Error fetching introducer data:', err);
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'introducer' || activeTab === 'special') {
      fetchIntroducerData();
    }
  }, [activeTab, fetchIntroducerData]);

  // Debounced search for Special tab
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await feesApi.searchClients(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching clients:', err);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset special tab state when switching tabs
  useEffect(() => {
    if (activeTab !== 'special') {
      setSearchQuery('');
      setSearchResults(null);
      setSelectedClient(null);
      setEditingClientCommission(false);
      setEditClientCommissionValue('');
    }
  }, [activeTab]);

  const handleSelectClient = (client: {
    id: string;
    name: string;
    type: 'entity' | 'introducer';
    email?: string;
    commissionRate?: string | null;
  }) => {
    setSelectedClient(client);
    setSearchQuery('');
    setSearchResults(null);
    setEditingClientCommission(false);
  };

  const handleClearSelectedClient = () => {
    setSelectedClient(null);
    setEditingClientCommission(false);
    setEditClientCommissionValue('');
  };

  const handleEditClientCommission = () => {
    if (selectedClient?.commissionRate) {
      setEditClientCommissionValue((parseFloat(selectedClient.commissionRate) * 100).toFixed(2));
    } else {
      setEditClientCommissionValue('');
    }
    setEditingClientCommission(true);
  };

  const handleSaveClientCommission = async () => {
    if (!selectedClient) return;
    try {
      const ratePercent = parseFloat(editClientCommissionValue);
      if (isNaN(ratePercent) || ratePercent < 0) {
        setError('Invalid commission rate. Must be a positive number.');
        return;
      }
      setIsSaving('client-commission');
      const rateDecimal = (ratePercent / 100).toFixed(6);
      await feesApi.setUserCommissionRate(selectedClient.id, rateDecimal);
      setEditingClientCommission(false);
      setSelectedClient({ ...selectedClient, commissionRate: rateDecimal });
      showSuccess('Commission rate updated successfully');
    } catch (err: unknown) {
      console.error('Error saving commission rate:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteClientCommission = async () => {
    if (!selectedClient) return;
    if (!confirm('Are you sure you want to revert this introducer to the default commission rate?')) {
      return;
    }
    try {
      setIsSaving('client-commission-delete');
      await feesApi.deleteUserCommissionRate(selectedClient.id);
      setSelectedClient({ ...selectedClient, commissionRate: null });
      showSuccess('Commission rate reverted to default');
    } catch (err: unknown) {
      console.error('Error deleting commission rate:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  const handleOpenOverrideModalForEntity = () => {
    if (selectedClient && selectedClient.type === 'entity') {
      setEditingOverride(null);
      setOverrideEntityId(selectedClient.id);
      setOverrideMarket('CEA_CASH');
      setOverrideBidRate('');
      setOverrideAskRate('');
      setShowOverrideModal(true);
    }
  };

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
    } catch (err: unknown) {
      console.error('Error saving market fee:', err);
      setError(getApiErrorMessage(err));
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
    } catch (err: unknown) {
      console.error('Error saving override:', err);
      setError(getApiErrorMessage(err));
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
    } catch (err: unknown) {
      console.error('Error deleting override:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  // Introducer fee handlers
  const handleEditDefaultRate = () => {
    if (introducerDefaultRate) {
      setEditDefaultRateValue((parseFloat(introducerDefaultRate) * 100).toFixed(2));
    }
    setEditingDefaultRate(true);
  };

  const handleSaveDefaultRate = async () => {
    try {
      const ratePercent = parseFloat(editDefaultRateValue);
      if (isNaN(ratePercent) || ratePercent < 0) {
        setError('Invalid commission rate. Must be a positive number.');
        return;
      }
      setIsSaving('introducer-default');
      const rateDecimal = (ratePercent / 100).toFixed(6);
      await feesApi.updateIntroducerDefaults(rateDecimal);
      setEditingDefaultRate(false);
      showSuccess('Default commission rate updated successfully');
      fetchIntroducerData();
    } catch (err: unknown) {
      console.error('Error saving default commission rate:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  const handleEditOverride = (userId: string, currentRate: string) => {
    setEditingOverrideUserId(userId);
    setEditOverrideRateValue((parseFloat(currentRate) * 100).toFixed(2));
  };

  const handleSaveOverrideRate = async (userId: string) => {
    try {
      const ratePercent = parseFloat(editOverrideRateValue);
      if (isNaN(ratePercent) || ratePercent < 0) {
        setError('Invalid commission rate. Must be a positive number.');
        return;
      }
      setIsSaving(`introducer-override-${userId}`);
      const rateDecimal = (ratePercent / 100).toFixed(6);
      await feesApi.setUserCommissionRate(userId, rateDecimal);
      setEditingOverrideUserId(null);
      showSuccess('Commission rate updated successfully');
      fetchIntroducerData();
    } catch (err: unknown) {
      console.error('Error saving commission rate override:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteIntroducerOverride = async (userId: string) => {
    if (!confirm('Are you sure you want to revert this user to the default commission rate?')) {
      return;
    }
    try {
      setIsSaving(`introducer-delete-${userId}`);
      await feesApi.deleteUserCommissionRate(userId);
      showSuccess('Commission rate reverted to default');
      fetchIntroducerData();
    } catch (err: unknown) {
      console.error('Error deleting commission rate override:', err);
      setError(getApiErrorMessage(err));
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
        <PageLoadingState text="Loading fee settings..." />
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout
      subSubHeaderLeft={
        <div className="flex items-center gap-1">
          {(['default', 'introducer', 'special'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-lg transition-colors',
                activeTab === tab
                  ? 'bg-emerald-600/20 text-emerald-400 font-medium'
                  : 'text-navy-400 hover:text-white hover:bg-navy-700'
              )}
            >
              {tab === 'default' ? 'Default Fees' : tab === 'introducer' ? 'Introducer Fees' : 'Special Fees'}
            </button>
          ))}
        </div>
      }
      subSubHeader={
        <button onClick={activeTab === 'introducer' ? fetchIntroducerData : fetchData} className="flex items-center gap-2 px-3 py-1.5 text-sm text-navy-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
    <div className="space-y-6">
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
      {activeTab === 'default' && (
      <div className="panel panel--flush">
        <div className="p-5 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-navy-400" />
            <h2 className="text-lg font-semibold text-white">
              Default Fees per Market
            </h2>
          </div>
          <p className="text-sm text-navy-400 mt-1">
            These rates apply to all clients unless overridden
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['CEA_CASH', 'SWAP'] as MarketTypeEnum[]).map((market) => {
              const fee = marketFees.find(f => f.market === market);
              const isEditing = editingMarket === market;

              return (
                <div
                  key={market}
                  className="p-4 bg-navy-700/50 rounded-lg border border-navy-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">
                      {MARKET_NAMES[market]}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => fee && handleEditMarketFee(fee)}
                        className="p-1.5 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-navy-400 mb-1">
                          Buyer Fee (%)
                        </label>
                        <NumberInput
                          value={editBidRate}
                          onChange={(v) => setEditBidRate(v)}
                          decimals={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-400 mb-1">
                          Seller Fee (%)
                        </label>
                        <NumberInput
                          value={editAskRate}
                          onChange={(v) => setEditAskRate(v)}
                          decimals={2}
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
                          className="px-3 py-2 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs text-navy-400">Buyer Fee</span>
                        <span className="text-lg font-semibold text-red-400">
                          {fee ? formatFeeRate(fee.bidFeeRate) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-navy-400">Seller Fee</span>
                        <span className="text-lg font-semibold text-emerald-400">
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
      )}

      {/* Introducer Fees */}
      {activeTab === 'introducer' && (
      <>
        {/* Default Commission Rate Card */}
        <div className="panel panel--flush">
          <div className="p-5 border-b border-navy-700">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-navy-400" />
              <h2 className="text-lg font-semibold text-white">
                Default Commission Rate
              </h2>
            </div>
            <p className="text-sm text-navy-400 mt-1">
              Commission rate applied to all introducers unless overridden
            </p>
          </div>

          <div className="p-5">
            <div className="p-4 bg-navy-700/50 rounded-lg border border-navy-600 max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Commission Rate</h3>
                {!editingDefaultRate && (
                  <button
                    onClick={handleEditDefaultRate}
                    className="p-1.5 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {editingDefaultRate ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-400 mb-1">
                      Rate (%)
                    </label>
                    <NumberInput
                      value={editDefaultRateValue}
                      onChange={(v) => setEditDefaultRateValue(v)}
                      decimals={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDefaultRate}
                      disabled={isSaving === 'introducer-default'}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isSaving === 'introducer-default' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDefaultRate(false)}
                      className="px-3 py-2 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="block text-xs text-navy-400">Rate</span>
                  <span className="text-lg font-semibold text-emerald-400">
                    {introducerDefaultRate
                      ? `${(parseFloat(introducerDefaultRate) * 100).toFixed(2)}%`
                      : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Commission Rates Table */}
        <div className="panel panel--flush">
          <div className="p-5 border-b border-navy-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-navy-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Custom Commission Rates
                </h2>
                <p className="text-sm text-navy-400">
                  Introducers with custom commission rates different from the default
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-navy-400 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {introducerOverrides.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-navy-400">
                      No custom commission rates configured
                    </td>
                  </tr>
                ) : (
                  introducerOverrides.map((intro) => {
                    const isEditingThis = editingOverrideUserId === intro.userId;
                    return (
                      <tr key={intro.userId} className="hover:bg-navy-700/30">
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {intro.firstName} {intro.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-400">
                          {intro.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {isEditingThis ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-28">
                                <NumberInput
                                  value={editOverrideRateValue}
                                  onChange={(v) => setEditOverrideRateValue(v)}
                                  decimals={2}
                                />
                              </div>
                              <span className="text-navy-400 text-xs">%</span>
                            </div>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              {(parseFloat(intro.commissionRate) * 100).toFixed(2)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditingThis ? (
                              <>
                                <button
                                  onClick={() => handleSaveOverrideRate(intro.userId)}
                                  disabled={isSaving === `introducer-override-${intro.userId}`}
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {isSaving === `introducer-override-${intro.userId}` ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingOverrideUserId(null)}
                                  className="px-2 py-1 text-xs text-navy-400 hover:bg-navy-700 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditOverride(intro.userId, intro.commissionRate)}
                                  className="p-1.5 text-navy-400 hover:bg-navy-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteIntroducerOverride(intro.userId)}
                                  disabled={isSaving === `introducer-delete-${intro.userId}`}
                                  className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                  title="Revert to default"
                                >
                                  {isSaving === `introducer-delete-${intro.userId}` ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

      {/* Special Fees - Client Search */}
      {activeTab === 'special' && (
      <>
        {/* Search Bar */}
        <div className="panel panel--flush">
          <div className="p-5 border-b border-navy-700">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-navy-400" />
              <h2 className="text-lg font-semibold text-white">
                Special Fees
              </h2>
            </div>
            <p className="text-sm text-navy-400 mt-1">
              Search for a client to view or configure custom fees
            </p>
          </div>

          <div className="p-5">
            <div className="relative" ref={searchDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by entity name or introducer email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-700/50 border border-navy-600 rounded-lg text-white placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              {/* Search Dropdown Results */}
              {searchResults && (searchResults.entities.length > 0 || searchResults.introducers.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {searchResults.entities.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-navy-400 uppercase tracking-wider bg-navy-700/50">
                        Entities
                      </div>
                      {searchResults.entities.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => handleSelectClient({
                            id: entity.id,
                            name: entity.name,
                            type: 'entity',
                          })}
                          className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-navy-700/50 flex items-center gap-2 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-navy-400 flex-shrink-0" />
                          {entity.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.introducers.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-navy-400 uppercase tracking-wider bg-navy-700/50">
                        Introducers
                      </div>
                      {searchResults.introducers.map((intro) => (
                        <button
                          key={intro.id}
                          onClick={() => handleSelectClient({
                            id: intro.id,
                            name: `${intro.firstName} ${intro.lastName}`,
                            type: 'introducer',
                            email: intro.email,
                            commissionRate: intro.commissionRate,
                          })}
                          className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-navy-700/50 flex items-center gap-2 transition-colors"
                        >
                          <Users className="w-4 h-4 text-navy-400 flex-shrink-0" />
                          <div>
                            <span>{intro.firstName} {intro.lastName}</span>
                            <span className="text-navy-400 ml-2 text-xs">{intro.email}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No results */}
              {searchResults && searchResults.entities.length === 0 && searchResults.introducers.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-600 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-navy-400">
                  No clients found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Client Panel */}
        {selectedClient && (
          <div className="panel panel--flush">
            <div className="p-5 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedClient.type === 'entity' ? (
                  <Building2 className="w-5 h-5 text-navy-400" />
                ) : (
                  <Users className="w-5 h-5 text-navy-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedClient.name}
                  </h2>
                  <p className="text-sm text-navy-400">
                    {selectedClient.type === 'entity' ? 'Entity' : 'Introducer'}
                    {selectedClient.email && ` \u2022 ${selectedClient.email}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSelectedClient}
                className="p-1.5 text-navy-400 hover:bg-navy-700 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entity: Trading Fee Overrides */}
            {selectedClient.type === 'entity' && (
              <div>
                <div className="p-5 border-b border-navy-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Trading Fee Overrides
                  </h3>
                  <button
                    onClick={handleOpenOverrideModalForEntity}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Override
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-navy-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">
                          Market
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-navy-400 uppercase tracking-wider">
                          Buyer Fee
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-navy-400 uppercase tracking-wider">
                          Seller Fee
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-navy-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700">
                      {entityOverrides.filter(o => o.entityId === selectedClient.id).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-navy-400">
                            No fee overrides configured for this entity. Using default market fees.
                          </td>
                        </tr>
                      ) : (
                        entityOverrides
                          .filter(o => o.entityId === selectedClient.id)
                          .map((override) => (
                          <tr key={`${override.entityId}-${override.market}`} className="hover:bg-navy-700/30">
                            <td className="px-4 py-3 text-sm text-white font-medium">
                              {MARKET_NAMES[override.market]}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={override.bidFeeRate !== null ? 'text-red-400 font-semibold' : 'text-navy-400'}>
                                {formatFeeRate(override.bidFeeRate)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={override.askFeeRate !== null ? 'text-emerald-400 font-semibold' : 'text-navy-400'}>
                                {formatFeeRate(override.askFeeRate)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenOverrideModal(override)}
                                  className="p-1.5 text-navy-400 hover:bg-navy-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOverride(override.entityId, override.market)}
                                  disabled={isSaving === `delete-${override.entityId}-${override.market}`}
                                  className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
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
            )}

            {/* Introducer: Commission Rate */}
            {selectedClient.type === 'introducer' && (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Commission Rate
                </h3>
                <div className="p-4 bg-navy-700/50 rounded-lg border border-navy-600 max-w-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">
                      {selectedClient.commissionRate ? 'Custom Rate' : 'Default Rate'}
                    </h4>
                    {!editingClientCommission && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleEditClientCommission}
                          className="p-1.5 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {selectedClient.commissionRate && (
                          <button
                            onClick={handleDeleteClientCommission}
                            disabled={isSaving === 'client-commission-delete'}
                            className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Revert to default"
                          >
                            {isSaving === 'client-commission-delete' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editingClientCommission ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-navy-400 mb-1">
                          Rate (%)
                        </label>
                        <NumberInput
                          value={editClientCommissionValue}
                          onChange={(v) => setEditClientCommissionValue(v)}
                          decimals={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveClientCommission}
                          disabled={isSaving === 'client-commission'}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {isSaving === 'client-commission' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingClientCommission(false)}
                          className="px-3 py-2 text-navy-400 hover:bg-navy-600 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-xs text-navy-400">
                        {selectedClient.commissionRate ? 'Custom rate' : 'Using default rate'}
                      </span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {selectedClient.commissionRate
                          ? `${(parseFloat(selectedClient.commissionRate) * 100).toFixed(2)}%`
                          : introducerDefaultRate
                            ? `${(parseFloat(introducerDefaultRate) * 100).toFixed(2)}% (default)`
                            : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No client selected */}
        {!selectedClient && (
          <div className="panel panel--flush">
            <div className="p-12 text-center">
              <Search className="w-10 h-10 text-navy-500 mx-auto mb-3" />
              <p className="text-navy-400 text-sm">
                Search for a client to view or configure custom fees
              </p>
            </div>
          </div>
        )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-navy-800 rounded-2xl border border-navy-700 max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingOverride ? 'Edit Fee Override' : 'Add Fee Override'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Client
                </label>
                <select
                  value={overrideEntityId}
                  onChange={(e) => setOverrideEntityId(e.target.value)}
                  disabled={!!editingOverride || (!!selectedClient && selectedClient.type === 'entity')}
                  className="w-full form-select disabled:opacity-50"
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
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Market
                </label>
                <select
                  value={overrideMarket}
                  onChange={(e) => setOverrideMarket(e.target.value as MarketTypeEnum)}
                  disabled={!!editingOverride}
                  className="w-full form-select disabled:opacity-50"
                >
                  <option value="CEA_CASH">CEA Cash</option>
                  <option value="SWAP">Swap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Buyer Fee (%) <span className="text-navy-500 font-normal">- leave empty to use default</span>
                </label>
                <NumberInput
                  value={overrideBidRate}
                  onChange={(v) => setOverrideBidRate(v)}
                  placeholder="e.g., 0.50"
                  decimals={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Seller Fee (%) <span className="text-navy-500 font-normal">- leave empty to use default</span>
                </label>
                <NumberInput
                  value={overrideAskRate}
                  onChange={(v) => setOverrideAskRate(v)}
                  placeholder="e.g., 0.50"
                  decimals={2}
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
                className="px-4 py-2 text-navy-400 hover:bg-navy-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
    </BackofficeLayout>
  );
}
