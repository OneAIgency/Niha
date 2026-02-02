import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Loader2,
  Activity,
  Target,
} from 'lucide-react';
import { Button } from '../common';
import { NumberInput } from '../common/NumberInput';
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

const DEFAULT_RULE: Omit<AutoTradeRuleCreate, 'side'> = {
  name: 'New Rule',
  enabled: false,
  order_type: 'LIMIT',
  price_mode: 'spread_from_best',
  spread_from_best: 0.5,
  quantity_mode: 'fixed',
  fixed_quantity: 100,
  interval_mode: 'fixed',
  interval_minutes: 5,
  max_active_orders: 10,
};

export function MarketMakerAutoTradeTab({ marketMaker }: MarketMakerAutoTradeTabProps) {
  const [rules, setRules] = useState<AutoTradeRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSeller = marketMaker.mm_type === 'CEA_SELLER' || marketMaker.mm_type === 'EUA_OFFER';
  const isBuyer = marketMaker.mm_type === 'CEA_BUYER';

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

  const selectedRule = rules.find(r => r.id === selectedRuleId);

  const handleAddRule = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const newRuleData: AutoTradeRuleCreate = {
        ...DEFAULT_RULE,
        name: `Rule ${rules.length + 1}`,
        side: isSeller ? 'SELL' : 'BUY',
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

  const handleDeleteRule = async (ruleId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await deleteAutoTradeRule(marketMaker.id, ruleId);
      await loadRules();
      if (selectedRuleId === ruleId) {
        setSelectedRuleId(null);
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setError('Failed to delete rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: AutoTradeRuleUpdate) => {
    setError(null);
    try {
      await updateAutoTradeRule(marketMaker.id, ruleId, updates);
      // Update local state optimistically
      setRules(rules.map(r => r.id === ruleId ? { ...r, ...updates } as AutoTradeRule : r));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      console.error('Failed to update rule:', err);
      setError('Failed to update rule');
      // Reload to get correct state
      await loadRules();
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      await handleUpdateRule(ruleId, { enabled: !rule.enabled });
    }
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-navy-500" />
        <span className="ml-2 text-navy-500">Loading auto trade rules...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Auto Trade Rules
            </h3>
            <p className="text-sm text-navy-500 dark:text-navy-400">
              Configure automatic order placement for this market maker
            </p>
          </div>
        </div>

        {/* Active Rules Count */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-navy-600 dark:text-navy-400">
            {activeRulesCount} active rule{activeRulesCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-navy-700 dark:text-navy-300">Rules</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRule}
              loading={isSaving}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Rule
            </Button>
          </div>

          <div className="space-y-2">
            {rules.length === 0 ? (
              <div className="p-4 text-center text-sm text-navy-500 dark:text-navy-400 bg-navy-50 dark:bg-navy-900/50 rounded-lg">
                No rules configured yet.
                <br />
                Click "Add Rule" to create one.
              </div>
            ) : (
              rules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedRuleId === rule.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-navy-200 dark:border-navy-700 hover:border-navy-300 dark:hover:border-navy-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-navy-900 dark:text-white text-sm">
                      {rule.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRule(rule.id);
                      }}
                      className={`p-1 rounded ${
                        rule.enabled
                          ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
                          : 'text-navy-400 bg-navy-100 dark:bg-navy-800'
                      }`}
                    >
                      {rule.enabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                    {rule.side === 'BUY' ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span>{rule.side}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>
                      {rule.interval_mode === 'random'
                        ? `${rule.interval_min_minutes || 1}-${rule.interval_max_minutes || 60}m`
                        : `Every ${rule.interval_minutes}m`
                      }
                    </span>
                    {(rule.execution_count || 0) > 0 && (
                      <>
                        <span>·</span>
                        <Target className="w-3 h-3" />
                        <span>{rule.execution_count} orders</span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Rule Editor */}
        <div className="col-span-2">
          {selectedRule ? (
            <div className="space-y-6 p-4 bg-navy-50 dark:bg-navy-900/50 rounded-xl">
              {/* Rule Header */}
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={selectedRule.name}
                  onChange={(e) => handleUpdateRule(selectedRule.id, { name: e.target.value })}
                  className="text-lg font-semibold bg-transparent border-none focus:outline-none text-navy-900 dark:text-white"
                />
                <button
                  onClick={() => handleDeleteRule(selectedRule.id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Side
                  </label>
                  <div className="flex rounded-lg overflow-hidden border-2 border-navy-200 dark:border-navy-600">
                    {(isBuyer ? ['BUY'] : isSeller ? ['SELL'] : ['BUY', 'SELL']).map(side => (
                      <button
                        key={side}
                        onClick={() => handleUpdateRule(selectedRule.id, { side: side as 'BUY' | 'SELL' })}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                          selectedRule.side === side
                            ? side === 'BUY'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Order Type
                  </label>
                  <div className="flex rounded-lg overflow-hidden border-2 border-navy-200 dark:border-navy-600">
                    {['LIMIT', 'MARKET'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleUpdateRule(selectedRule.id, { order_type: type as 'LIMIT' | 'MARKET' })}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                          selectedRule.order_type === type
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Settings (only for LIMIT orders) */}
              {selectedRule.order_type === 'LIMIT' && (
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Price Strategy
                  </label>
                  <select
                    value={selectedRule.price_mode}
                    onChange={(e) => handleUpdateRule(selectedRule.id, { price_mode: e.target.value as AutoTradeRule['price_mode'] })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="spread_from_best">Spread from Best Price</option>
                    <option value="random_spread">Random Spread (fills gaps)</option>
                    <option value="percentage_from_market">Percentage from Market</option>
                  </select>

                  <div className="mt-3">
                    {selectedRule.price_mode === 'fixed' && (
                      <NumberInput
                        label="Fixed Price (EUR)"
                        value={selectedRule.fixed_price?.toString() || ''}
                        onChange={(val) => handleUpdateRule(selectedRule.id, { fixed_price: parseFloat(val) || null })}
                        suffix="EUR"
                        decimals={2}
                      />
                    )}
                    {selectedRule.price_mode === 'spread_from_best' && (
                      <NumberInput
                        label={`Spread from Best ${selectedRule.side === 'BUY' ? 'Ask' : 'Bid'} (EUR)`}
                        value={selectedRule.spread_from_best?.toString() || ''}
                        onChange={(val) => handleUpdateRule(selectedRule.id, { spread_from_best: parseFloat(val) || null })}
                        suffix="EUR"
                        decimals={2}
                      />
                    )}
                    {selectedRule.price_mode === 'random_spread' && (
                      <div className="grid grid-cols-2 gap-3">
                        <NumberInput
                          label="Min Spread (EUR)"
                          value={selectedRule.spread_min?.toString() || '0.1'}
                          onChange={(val) => handleUpdateRule(selectedRule.id, { spread_min: parseFloat(val) || 0.1 })}
                          suffix="EUR"
                          decimals={1}
                        />
                        <NumberInput
                          label="Max Spread (EUR)"
                          value={selectedRule.spread_max?.toString() || '1.0'}
                          onChange={(val) => handleUpdateRule(selectedRule.id, { spread_max: parseFloat(val) || 1.0 })}
                          suffix="EUR"
                          decimals={1}
                        />
                      </div>
                    )}
                    {selectedRule.price_mode === 'percentage_from_market' && (
                      <NumberInput
                        label="Percentage from Market Price"
                        value={selectedRule.percentage_from_market?.toString() || ''}
                        onChange={(val) => handleUpdateRule(selectedRule.id, { percentage_from_market: parseFloat(val) || null })}
                        suffix="%"
                        decimals={2}
                      />
                    )}
                  </div>

                  {/* Max Price Deviation */}
                  <div className="mt-3">
                    <NumberInput
                      label="Max Price Deviation from Scraped Price"
                      value={selectedRule.max_price_deviation?.toString() || ''}
                      onChange={(val) => handleUpdateRule(selectedRule.id, { max_price_deviation: parseFloat(val) || null })}
                      suffix="%"
                      decimals={1}
                      placeholder="No limit"
                    />
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      Orders will not be placed if price deviates more than this % from the scraped market price
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity Settings */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Quantity Strategy
                </label>
                <select
                  value={selectedRule.quantity_mode}
                  onChange={(e) => handleUpdateRule(selectedRule.id, { quantity_mode: e.target.value as AutoTradeRule['quantity_mode'] })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
                >
                  <option value="fixed">Fixed Quantity</option>
                  <option value="percentage_of_balance">Percentage of Available Balance</option>
                  <option value="random_range">Random Range</option>
                </select>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {selectedRule.quantity_mode === 'fixed' && (
                    <NumberInput
                      label="Fixed Quantity"
                      value={selectedRule.fixed_quantity?.toString() || ''}
                      onChange={(val) => handleUpdateRule(selectedRule.id, { fixed_quantity: parseFloat(val) || null })}
                      decimals={0}
                    />
                  )}
                  {selectedRule.quantity_mode === 'percentage_of_balance' && (
                    <NumberInput
                      label="Percentage of Balance"
                      value={selectedRule.percentage_of_balance?.toString() || ''}
                      onChange={(val) => handleUpdateRule(selectedRule.id, { percentage_of_balance: parseFloat(val) || null })}
                      suffix="%"
                      decimals={1}
                    />
                  )}
                  {selectedRule.quantity_mode === 'random_range' && (
                    <>
                      <NumberInput
                        label="Min Quantity"
                        value={selectedRule.min_quantity?.toString() || ''}
                        onChange={(val) => handleUpdateRule(selectedRule.id, { min_quantity: parseFloat(val) || null })}
                        decimals={0}
                      />
                      <NumberInput
                        label="Max Quantity"
                        value={selectedRule.max_quantity?.toString() || ''}
                        onChange={(val) => handleUpdateRule(selectedRule.id, { max_quantity: parseFloat(val) || null })}
                        decimals={0}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Interval Mode
                </label>
                <div className="flex rounded-lg overflow-hidden border-2 border-navy-200 dark:border-navy-600 mb-3">
                  {(['fixed', 'random'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleUpdateRule(selectedRule.id, {
                        interval_mode: mode,
                        // Set sensible defaults when switching modes
                        ...(mode === 'random' ? { interval_min_minutes: 1, interval_max_minutes: 15 } : {})
                      })}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                        (selectedRule.interval_mode || 'fixed') === mode
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-400'
                      }`}
                    >
                      {mode === 'fixed' ? 'Fixed Interval' : 'Random Interval'}
                    </button>
                  ))}
                </div>

                {(selectedRule.interval_mode || 'fixed') === 'fixed' ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 5, 15, 30, 60].map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => handleUpdateRule(selectedRule.id, { interval_minutes: minutes })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedRule.interval_minutes === minutes
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-400 hover:border-emerald-300'
                        }`}
                      >
                        {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Min Interval (minutes)"
                      value={selectedRule.interval_min_minutes?.toString() || '1'}
                      onChange={(val) => handleUpdateRule(selectedRule.id, { interval_min_minutes: parseInt(val) || 1 })}
                      decimals={0}
                    />
                    <NumberInput
                      label="Max Interval (minutes)"
                      value={selectedRule.interval_max_minutes?.toString() || '60'}
                      onChange={(val) => handleUpdateRule(selectedRule.id, { interval_max_minutes: parseInt(val) || 60 })}
                      decimals={0}
                    />
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Conditions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Min Balance Required"
                    value={selectedRule.min_balance?.toString() || ''}
                    onChange={(val) => handleUpdateRule(selectedRule.id, { min_balance: parseFloat(val) || null })}
                    placeholder="No minimum"
                    decimals={0}
                  />
                  <NumberInput
                    label="Max Active Orders"
                    value={selectedRule.max_active_orders?.toString() || ''}
                    onChange={(val) => handleUpdateRule(selectedRule.id, { max_active_orders: parseInt(val) || null })}
                    placeholder="Unlimited"
                    decimals={0}
                  />
                </div>
              </div>

              {/* Execution Stats */}
              <div className="border-t border-navy-200 dark:border-navy-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-navy-500" />
                  <label className="text-sm font-medium text-navy-700 dark:text-navy-300">
                    Execution Stats
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-navy-800 rounded-lg p-3 border border-navy-200 dark:border-navy-700">
                    <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Orders Placed</div>
                    <div className="text-lg font-semibold text-navy-900 dark:text-white">
                      {selectedRule.execution_count || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-navy-800 rounded-lg p-3 border border-navy-200 dark:border-navy-700">
                    <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Last Executed</div>
                    <div className="text-sm font-medium text-navy-900 dark:text-white">
                      {selectedRule.last_executed_at
                        ? new Date(selectedRule.last_executed_at).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-navy-800 rounded-lg p-3 border border-navy-200 dark:border-navy-700">
                    <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Next Execution</div>
                    <div className="text-sm font-medium text-navy-900 dark:text-white">
                      {selectedRule.next_execution_at
                        ? new Date(selectedRule.next_execution_at).toLocaleString()
                        : selectedRule.enabled ? 'Soon' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Settings className="w-12 h-12 text-navy-300 dark:text-navy-600 mb-4" />
              <p className="text-navy-500 dark:text-navy-400">
                Select a rule to edit or create a new one
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Success Indicator */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-lg"
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Saved!</span>
        </motion.div>
      )}
    </div>
  );
}
