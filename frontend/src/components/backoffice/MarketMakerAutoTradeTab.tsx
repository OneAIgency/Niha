import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Check,
  Settings,
  Zap,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  Gauge,
  DollarSign,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Button, LoadingState } from '../common';
import {
  getAutoTradeRules,
  createAutoTradeRule,
  updateAutoTradeRule,
  deleteAutoTradeRule,
  type AutoTradeRule,
  type AutoTradeRuleCreate,
  type AutoTradeRuleUpdate,
} from '../../services/api';
import type { MarketMaker } from '../../types';

interface MarketMakerAutoTradeTabProps {
  marketMaker: MarketMaker;
}

// Presets for quick configuration
const PRESETS = {
  aggressive: {
    name: 'Aggressive',
    icon: Zap,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30 hover:border-red-500',
    description: 'High frequency, tight spread',
    config: {
      price_mode: 'spread_from_best' as const,
      spread_from_best: 0.1,
      quantity_mode: 'random_range' as const,
      min_quantity: 10000,
      max_quantity: 50000,
      interval_mode: 'random' as const,
      interval_seconds: 15,
      interval_min_seconds: 10,
      interval_max_seconds: 20,
    }
  },
  balanced: {
    name: 'Balanced',
    icon: Gauge,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500',
    description: 'Medium frequency, moderate spread',
    config: {
      price_mode: 'random_spread' as const,
      spread_min: 0.2,
      spread_max: 0.4,
      quantity_mode: 'random_range' as const,
      min_quantity: 5000,
      max_quantity: 20000,
      interval_mode: 'random' as const,
      interval_seconds: 30,
      interval_min_seconds: 20,
      interval_max_seconds: 45,
    }
  },
  conservative: {
    name: 'Conservative',
    icon: Target,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500',
    description: 'Low frequency, wide spread',
    config: {
      price_mode: 'random_spread' as const,
      spread_min: 0.3,
      spread_max: 0.6,
      quantity_mode: 'random_range' as const,
      min_quantity: 1000,
      max_quantity: 10000,
      interval_mode: 'fixed' as const,
      interval_seconds: 60,
      interval_minutes: 1,
    }
  }
};

export function MarketMakerAutoTradeTab({ marketMaker }: MarketMakerAutoTradeTabProps) {
  const [rules, setRules] = useState<AutoTradeRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isSeller = marketMaker.mmType === 'CEA_SELLER' || marketMaker.mmType === 'EUA_OFFER';

  // Load rules from API
  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAutoTradeRules(marketMaker.id);
      setRules(data);
    } catch (err) {
      console.error('Failed to load auto trade rules:', err);
      setError('Failed to load auto trade rules');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [marketMaker.id]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Auto-refresh every 5 seconds for live stats
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving) loadRules();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadRules, isSaving]);

  const selectedRule = rules.find(r => r.id === selectedRuleId);

  const handleAddRule = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const newRuleData: AutoTradeRuleCreate = {
        name: `${isSeller ? 'ASK' : 'BID'} Rule ${rules.length + 1}`,
        enabled: false,
        side: isSeller ? 'SELL' : 'BUY',
        order_type: 'LIMIT', // Always LIMIT for auto-trade
        ...PRESETS.balanced.config,
      };
      const result = await createAutoTradeRule(marketMaker.id, newRuleData);
      await loadRules();
      setSelectedRuleId(result.id);
    } catch (err) {
      console.error('Failed to create rule:', err);
      setError('Failed to create rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: AutoTradeRuleUpdate) => {
    setIsSaving(true);
    setError(null);
    try {
      await updateAutoTradeRule(marketMaker.id, ruleId, updates);
      // Convert null values to undefined to match AutoTradeRule type
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [key, value === null ? undefined : value])
      ) as Partial<AutoTradeRule>;
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...sanitizedUpdates } : r));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      console.error('Failed to update rule:', err);
      setError('Failed to update rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this rule?')) return;
    setIsSaving(true);
    try {
      await deleteAutoTradeRule(marketMaker.id, ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      if (selectedRuleId === ruleId) setSelectedRuleId(null);
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setError('Failed to delete rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      await handleUpdateRule(ruleId, { enabled: !rule.enabled });
    }
  };

  const handleApplyPreset = async (presetKey: keyof typeof PRESETS) => {
    if (!selectedRule) return;
    const preset = PRESETS[presetKey];
    await handleUpdateRule(selectedRule.id, {
      ...preset.config,
      name: `${isSeller ? 'ASK' : 'BID'} ${preset.name}`,
    });
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;

  // Helper to format interval display
  const formatInterval = (rule: AutoTradeRule) => {
    if (rule.intervalMode === 'random') {
      if (rule.intervalMinSeconds && rule.intervalMaxSeconds) {
        return `${rule.intervalMinSeconds}-${rule.intervalMaxSeconds}s`;
      }
      return `${rule.intervalMinMinutes || 1}-${rule.intervalMaxMinutes || 5}m`;
    }
    if (rule.intervalSeconds) return `${rule.intervalSeconds}s`;
    return `${rule.intervalMinutes || 1}m`;
  };

  // Helper to generate preview text
  const getPreviewText = (rule: AutoTradeRule) => {
    const side = rule.side === 'BUY' ? 'BUY' : 'SELL';
    const priceRef = rule.side === 'BUY' ? 'best ask' : 'best bid';

    // Helper to safely convert to number and format
    const toNum = (val: number | string | null | undefined) => Number(val) || 0;

    let priceText = '';
    if (rule.priceMode === 'spread_from_best') {
      priceText = `€${toNum(rule.spreadFromBest).toFixed(2)} from ${priceRef}`;
    } else if (rule.priceMode === 'random_spread') {
      priceText = `€${toNum(rule.spreadMin).toFixed(2)}-${toNum(rule.spreadMax).toFixed(2)} spread`;
    } else if (rule.priceMode === 'fixed') {
      priceText = `fixed €${toNum(rule.fixedPrice).toFixed(2)}`;
    } else {
      priceText = `${toNum(rule.percentageFromMarket)}% from market`;
    }

    let qtyText = '';
    if (rule.quantityMode === 'fixed') {
      qtyText = `${toNum(rule.fixedQuantity).toLocaleString()} units`;
    } else if (rule.quantityMode === 'random_range') {
      qtyText = `${toNum(rule.minQuantity).toLocaleString()}-${toNum(rule.maxQuantity).toLocaleString()} units`;
    } else {
      qtyText = `${toNum(rule.percentageOfBalance)}% of balance`;
    }

    return `${side} orders at ${priceText}, ${qtyText}, every ${formatInterval(rule)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState variant="spinner" size="lg" />
      </div>
    );
  }

  if (error && rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={loadRules}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 dark:text-white">Auto Trade Rules</h3>
            <p className="text-sm text-navy-500 dark:text-navy-400">
              {activeRulesCount} active rule{activeRulesCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddRule}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Rules List */}
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="p-6 rounded-xl border-2 border-dashed border-navy-300 dark:border-navy-600 text-center">
              <p className="text-navy-500 dark:text-navy-400 text-sm">
                No rules configured.<br />Click "Add Rule" to create one.
              </p>
            </div>
          ) : (
            rules.map(rule => (
              <motion.button
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  selectedRuleId === rule.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                    : rule.enabled
                      ? 'border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-400'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900 dark:text-white text-sm truncate max-w-[120px]">
                      {rule.name}
                    </span>
                    {rule.enabled && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRule(rule.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      rule.enabled
                        ? 'text-white bg-emerald-500 hover:bg-emerald-600'
                        : 'text-navy-400 bg-navy-100 dark:bg-navy-800 hover:bg-navy-200'
                    }`}
                  >
                    {rule.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                  {rule.side === 'BUY' ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className="font-medium">{rule.side}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatInterval(rule)}</span>
                </div>
                {rule.executionCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-navy-200 dark:border-navy-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-navy-500 dark:text-navy-400">
                        {rule.executionCount} orders
                      </span>
                      {rule.enabled && rule.nextExecutionAt && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Next: {Math.max(0, Math.round((new Date(rule.nextExecutionAt).getTime() - Date.now()) / 1000))}s
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>

        {/* Rule Editor */}
        <div className="col-span-2">
          {selectedRule ? (
            <div className="p-4 rounded-xl bg-white dark:bg-navy-800/50 border border-navy-200 dark:border-navy-700 space-y-5">
              {/* Rule Header */}
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={selectedRule.name}
                  onChange={(e) => handleUpdateRule(selectedRule.id, { name: e.target.value })}
                  className="text-lg font-bold text-navy-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteRule(selectedRule.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Status Banner */}
              {selectedRule.enabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        LIVE - Auto Trading Active
                      </span>
                    </div>
                    <div className="text-xs text-navy-600 dark:text-navy-300">
                      {selectedRule.executionCount} orders placed
                      {selectedRule.nextExecutionAt && (
                        <> • Next in ~{Math.max(0, Math.round((new Date(selectedRule.nextExecutionAt).getTime() - Date.now()) / 1000))}s</>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PRESETS) as [keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]][]).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handleApplyPreset(key)}
                        className={`p-3 rounded-lg border-2 transition-all ${preset.bgColor}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${preset.color}`} />
                          <span className={`font-semibold text-sm ${preset.color}`}>{preset.name}</span>
                        </div>
                        <p className="text-xs text-navy-500 dark:text-navy-400">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-navy-100 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-700">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy-600 dark:text-navy-300 uppercase tracking-wider mb-1">Preview</p>
                    <p className="text-sm text-navy-700 dark:text-navy-200">
                      {getPreviewText(selectedRule)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Settings - 3 Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Price Card */}
                <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-900/30 border border-navy-200 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-sm text-navy-900 dark:text-white">Price</span>
                  </div>
                  <select
                    value={selectedRule.priceMode}
                    onChange={(e) => handleUpdateRule(selectedRule.id, { price_mode: e.target.value as AutoTradeRule['priceMode'] })}
                    className="w-full px-2 py-1.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-navy-900 dark:text-white mb-2"
                  >
                    <option value="spread_from_best">Spread from best</option>
                    <option value="random_spread">Random spread</option>
                    <option value="fixed">Fixed price</option>
                    <option value="percentage_from_market">% from market</option>
                  </select>

                  {selectedRule.priceMode === 'spread_from_best' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={selectedRule.spreadFromBest || 0.1}
                        onChange={(e) => handleUpdateRule(selectedRule.id, { spread_from_best: parseFloat(e.target.value) || 0.1 })}
                        step="0.1"
                        min="0.1"
                        className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                      />
                      <span className="text-xs text-navy-500">EUR</span>
                    </div>
                  )}

                  {selectedRule.priceMode === 'random_spread' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={selectedRule.spreadMin || 0.1}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { spread_min: parseFloat(e.target.value) || 0.1 })}
                          step="0.1"
                          min="0.1"
                          className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="Min"
                        />
                        <span className="text-xs text-navy-400">-</span>
                        <input
                          type="number"
                          value={selectedRule.spreadMax || 0.5}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { spread_max: parseFloat(e.target.value) || 0.5 })}
                          step="0.1"
                          min="0.1"
                          className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="Max"
                        />
                      </div>
                      <p className="text-[10px] text-navy-400">EUR spread range</p>
                    </div>
                  )}

                  {selectedRule.priceMode === 'fixed' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={selectedRule.fixedPrice || ''}
                        onChange={(e) => handleUpdateRule(selectedRule.id, { fixed_price: parseFloat(e.target.value) || null })}
                        step="0.01"
                        className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                        placeholder="9.50"
                      />
                      <span className="text-xs text-navy-500">EUR</span>
                    </div>
                  )}
                </div>

                {/* Quantity Card */}
                <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-900/30 border border-navy-200 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm text-navy-900 dark:text-white">Quantity</span>
                  </div>
                  <select
                    value={selectedRule.quantityMode}
                    onChange={(e) => handleUpdateRule(selectedRule.id, { quantity_mode: e.target.value as AutoTradeRule['quantityMode'] })}
                    className="w-full px-2 py-1.5 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-navy-900 dark:text-white mb-2"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="random_range">Random range</option>
                    <option value="percentage_of_balance">% of balance</option>
                  </select>

                  {selectedRule.quantityMode === 'fixed' && (
                    <input
                      type="number"
                      value={selectedRule.fixedQuantity || ''}
                      onChange={(e) => handleUpdateRule(selectedRule.id, { fixed_quantity: parseInt(e.target.value) || null })}
                      className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                      placeholder="10000"
                    />
                  )}

                  {selectedRule.quantityMode === 'random_range' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={selectedRule.minQuantity || ''}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { min_quantity: parseInt(e.target.value) || null })}
                          className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="Min"
                        />
                        <span className="text-xs text-navy-400">-</span>
                        <input
                          type="number"
                          value={selectedRule.maxQuantity || ''}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { max_quantity: parseInt(e.target.value) || null })}
                          className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="Max"
                        />
                      </div>
                      <p className="text-[10px] text-navy-400">certificates per order</p>
                    </div>
                  )}

                  {selectedRule.quantityMode === 'percentage_of_balance' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={selectedRule.percentageOfBalance || ''}
                        onChange={(e) => handleUpdateRule(selectedRule.id, { percentage_of_balance: parseFloat(e.target.value) || null })}
                        step="1"
                        min="1"
                        max="100"
                        className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                        placeholder="5"
                      />
                      <span className="text-xs text-navy-500">%</span>
                    </div>
                  )}
                </div>

                {/* Speed Card */}
                <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-900/30 border border-navy-200 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm text-navy-900 dark:text-white">Speed</span>
                  </div>

                  {/* Quick speed buttons */}
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[10, 15, 30, 60].map(sec => (
                      <button
                        key={sec}
                        onClick={() => handleUpdateRule(selectedRule.id, {
                          interval_mode: 'fixed',
                          interval_seconds: sec,
                          interval_minutes: 1
                        })}
                        className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                          selectedRule.intervalMode === 'fixed' && selectedRule.intervalSeconds === sec
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 text-navy-600 dark:text-navy-300 hover:border-amber-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  {/* Random interval toggle */}
                  <button
                    onClick={() => handleUpdateRule(selectedRule.id, {
                      interval_mode: selectedRule.intervalMode === 'random' ? 'fixed' : 'random',
                      interval_min_seconds: 10,
                      interval_max_seconds: 30,
                    })}
                    className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                      selectedRule.intervalMode === 'random'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 text-navy-600 dark:text-navy-300'
                    }`}
                  >
                    {selectedRule.intervalMode === 'random' ? '✓ Random interval' : 'Use random interval'}
                  </button>

                  {selectedRule.intervalMode === 'random' && (
                    <div className="mt-2 flex items-center gap-1">
                      <input
                        type="number"
                        value={selectedRule.intervalMinSeconds || 10}
                        onChange={(e) => handleUpdateRule(selectedRule.id, { interval_min_seconds: parseInt(e.target.value) || 10 })}
                        className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                        min="5"
                      />
                      <span className="text-xs text-navy-400">-</span>
                      <input
                        type="number"
                        value={selectedRule.intervalMaxSeconds || 30}
                        onChange={(e) => handleUpdateRule(selectedRule.id, { interval_max_seconds: parseInt(e.target.value) || 30 })}
                        className="w-full px-2 py-1 rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                        min="5"
                      />
                      <span className="text-xs text-navy-500">s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced Settings
              </button>

              {/* Advanced Settings */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-navy-50 dark:bg-navy-900/30 border border-navy-200 dark:border-navy-700">
                      <div>
                        <label className="block text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">
                          Min Balance Required
                        </label>
                        <input
                          type="number"
                          value={selectedRule.minBalance || ''}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { min_balance: parseFloat(e.target.value) || null })}
                          className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">
                          Max Active Orders
                        </label>
                        <input
                          type="number"
                          value={selectedRule.maxActiveOrders || ''}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { max_active_orders: parseInt(e.target.value) || null })}
                          className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="Unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">
                          Max Price Deviation (%)
                        </label>
                        <input
                          type="number"
                          value={selectedRule.maxPriceDeviation || ''}
                          onChange={(e) => handleUpdateRule(selectedRule.id, { max_price_deviation: parseFloat(e.target.value) || null })}
                          className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm"
                          placeholder="No limit"
                          step="0.1"
                        />
                        <p className="text-[10px] text-navy-400 mt-1">Skip if price deviates too much from market</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats Section */}
              {selectedRule.executionCount > 0 && (
                <div className="pt-4 border-t border-navy-200 dark:border-navy-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-navy-500" />
                    <span className="text-sm font-semibold text-navy-700 dark:text-navy-300">Statistics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedRule.executionCount}
                      </div>
                      <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Orders Placed</div>
                    </div>
                    <div className="p-3 rounded-lg bg-navy-100 dark:bg-navy-800 text-center">
                      <div className="text-sm font-semibold text-navy-700 dark:text-navy-200">
                        {selectedRule.lastExecutedAt
                          ? new Date(selectedRule.lastExecutedAt).toLocaleTimeString()
                          : '-'}
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">Last Order</div>
                    </div>
                    <div className="p-3 rounded-lg bg-navy-100 dark:bg-navy-800 text-center">
                      <div className="text-sm font-semibold text-navy-700 dark:text-navy-200">
                        {selectedRule.nextExecutionAt && selectedRule.enabled
                          ? new Date(selectedRule.nextExecutionAt).toLocaleTimeString()
                          : '-'}
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">Next Order</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Toggle */}
              <div className="pt-4 border-t border-navy-200 dark:border-navy-700">
                <button
                  onClick={() => handleToggleRule(selectedRule.id)}
                  disabled={isSaving}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    selectedRule.enabled
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {selectedRule.enabled ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Stop Auto Trading
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Auto Trading
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center rounded-xl bg-navy-50 dark:bg-navy-800/30 border-2 border-dashed border-navy-300 dark:border-navy-600">
              <Settings className="w-12 h-12 text-navy-300 dark:text-navy-600 mb-4" />
              <p className="text-navy-500 dark:text-navy-400 mb-2">
                Select a rule to configure
              </p>
              <p className="text-sm text-navy-400 dark:text-navy-500">
                or create a new one with the button above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Success Indicator */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Saved!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
