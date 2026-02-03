import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  RefreshCw,
  Zap,
  Power,
  AlertCircle,
  Activity,
  Save,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, NumberInput, Button, formatNumberWithSeparators } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import { adminApi, getAutoTradeMonitor } from '../services/api';
import type { AutoTradeMarketSettings, AutoTradeMarketSettingsUpdate } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REFRESH_INTERVAL_MS = 10000; // 10 seconds

interface MarketConfig {
  title: string;
  subtitle: string;
  color: 'emerald' | 'red' | 'blue';
  icon: typeof TrendingUp;
  bgGradient: string;
}

const MARKET_CONFIG: Record<string, MarketConfig> = {
  CEA_BID: {
    title: 'CEA Bid',
    subtitle: 'Buy Orders',
    color: 'emerald',
    icon: TrendingUp,
    bgGradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  CEA_ASK: {
    title: 'CEA Ask',
    subtitle: 'Sell Orders',
    color: 'red',
    icon: TrendingDown,
    bgGradient: 'from-red-500/10 to-red-500/5',
  },
  EUA_SWAP: {
    title: 'Swap',
    subtitle: 'CEA → EUA',
    color: 'blue',
    icon: ArrowLeftRight,
    bgGradient: 'from-blue-500/10 to-blue-500/5',
  },
};

const COLOR_CLASSES = {
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  red: {
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
  },
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined) return '€0';
  return `€${formatNumberWithSeparators(value, 'en-US', 0)}`;
}

function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string | { msg?: string }[]; message?: string } } }).response;
    const d = res?.data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    const m = res?.data?.message;
    if (typeof m === 'string') return m;
  }
  return (err as Error)?.message ?? 'Something went wrong.';
}

// ============================================================================
// TYPES
// ============================================================================

interface MonitorSummary {
  total_rules: number;
  enabled: number;
  disabled: number;
  healthy: number;
  overdue: number;
}

interface MonitorRule {
  id: string;
  name: string;
  market_maker_name: string;
  enabled: boolean;
  health: 'healthy' | 'delayed' | 'overdue' | 'inactive' | 'disabled';
  health_reason: string | null;
  last_executed_at: string | null;
  next_execution_at: string | null;
  time_until_next_seconds: number | null;
  execution_count: number;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatusIndicatorProps {
  enabled: boolean;
}

function StatusIndicator({ enabled }: StatusIndicatorProps) {
  if (!enabled) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-navy-500" />
        <span className="text-xs text-navy-400 font-medium">DISABLED</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-xs font-medium text-emerald-400">ENABLED</span>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-emerald-500' : 'bg-navy-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

interface LiquidityProgressBarProps {
  percentage: number;
  color: 'emerald' | 'red' | 'blue';
}

function LiquidityProgressBar({ percentage, color }: LiquidityProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 150);
  const widthPercent = (clampedPercentage / 150) * 100;

  const colorClasses = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}

// ============================================================================
// MONITOR COMPONENT
// ============================================================================

interface MonitorPanelProps {
  summary: MonitorSummary | null;
  rules: MonitorRule[];
  loading: boolean;
}

function MonitorPanel({ summary, rules, loading }: MonitorPanelProps) {
  if (loading && !summary) {
    return (
      <div className="bg-navy-900/50 rounded-xl border border-navy-700/30 p-4">
        <div className="flex items-center gap-2 text-navy-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading monitor...</span>
        </div>
      </div>
    );
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'delayed':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'inactive':
      case 'disabled':
        return <XCircle className="w-4 h-4 text-navy-500" />;
      default:
        return <Clock className="w-4 h-4 text-navy-400" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-emerald-400';
      case 'delayed':
        return 'text-amber-400';
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-navy-400';
    }
  };

  return (
    <div className="bg-navy-900/50 rounded-xl border border-navy-700/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-navy-700/30 bg-navy-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Script Monitor</h3>
          </div>
          {summary && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{summary.healthy}</span>
                <span className="text-navy-400">healthy</span>
              </div>
              {summary.overdue > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">{summary.overdue}</span>
                  <span className="text-navy-400">overdue</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-navy-400">{summary.enabled}/{summary.total_rules} enabled</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div className="divide-y divide-navy-700/30 max-h-64 overflow-y-auto">
        {rules.length === 0 ? (
          <div className="p-4 text-center text-navy-400 text-sm">
            No auto-trade rules configured
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="p-3 flex items-center justify-between hover:bg-navy-800/30">
              <div className="flex items-center gap-3">
                {getHealthIcon(rule.health)}
                <div>
                  <div className="text-sm text-white font-medium">{rule.name}</div>
                  <div className="text-xs text-navy-400">{rule.market_maker_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Last executed timestamp */}
                <div className="text-right min-w-[90px]">
                  <div className="text-xs text-navy-400">Last Run</div>
                  <div className="text-xs text-navy-300 font-mono">
                    {rule.last_executed_at
                      ? new Date(rule.last_executed_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '-'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${getHealthColor(rule.health)}`}>
                    {rule.health.toUpperCase()}
                  </div>
                  {rule.time_until_next_seconds !== null && rule.enabled && (
                    <div className="text-xs text-navy-500">
                      {rule.time_until_next_seconds > 0
                        ? `in ${rule.time_until_next_seconds}s`
                        : 'now'
                      }
                    </div>
                  )}
                </div>
                <div className="text-right min-w-[60px]">
                  <div className="text-xs text-navy-400">Executions</div>
                  <div className="text-sm text-white font-mono">{rule.execution_count}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MARKET CARD COMPONENT
// ============================================================================

interface MarketCardProps {
  settings: AutoTradeMarketSettings;
  onSave: (marketKey: string, updates: AutoTradeMarketSettingsUpdate) => Promise<void>;
  onToggle: (marketKey: string, enabled: boolean) => Promise<void>;
  isSaving: boolean;
}

function MarketCard({ settings, onSave, onToggle, isSaving }: MarketCardProps) {
  const config = MARKET_CONFIG[settings.marketKey];
  const colors = COLOR_CLASSES[config.color];
  const Icon = config.icon;

  // Check if this is a cash market (CEA_BID or CEA_ASK) - internal trades only apply there
  const isCashMarket = settings.marketKey === 'CEA_BID' || settings.marketKey === 'CEA_ASK';

  // Local state for editable fields
  const [targetLiquidity, setTargetLiquidity] = useState(
    settings.targetLiquidity?.toString() || '0'
  );
  const [intervalSeconds, setIntervalSeconds] = useState(
    settings.intervalSeconds?.toString() || '60'
  );
  const [maxThreshold, setMaxThreshold] = useState(
    settings.maxLiquidityThreshold?.toString() || ''
  );
  const [internalInterval, setInternalInterval] = useState(
    settings.internalTradeInterval?.toString() || ''
  );
  const [internalVolumeMin, setInternalVolumeMin] = useState(
    settings.internalTradeVolumeMin?.toString() || ''
  );
  const [internalVolumeMax, setInternalVolumeMax] = useState(
    settings.internalTradeVolumeMax?.toString() || ''
  );

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when settings change from server
  useEffect(() => {
    setTargetLiquidity(settings.targetLiquidity?.toString() || '0');
    setIntervalSeconds(settings.intervalSeconds?.toString() || '60');
    setMaxThreshold(settings.maxLiquidityThreshold?.toString() || '');
    setInternalInterval(settings.internalTradeInterval?.toString() || '');
    setInternalVolumeMin(settings.internalTradeVolumeMin?.toString() || '');
    setInternalVolumeMax(settings.internalTradeVolumeMax?.toString() || '');
    setHasChanges(false);
  }, [
    settings.targetLiquidity,
    settings.intervalSeconds,
    settings.maxLiquidityThreshold,
    settings.internalTradeInterval,
    settings.internalTradeVolumeMin,
    settings.internalTradeVolumeMax,
  ]);

  // Mark as changed when any field is edited
  const handleFieldChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleToggle = async (enabled: boolean) => {
    await onToggle(settings.marketKey, enabled);
  };

  const handleSave = async () => {
    const updates: AutoTradeMarketSettingsUpdate = {};

    const target = parseFloat(targetLiquidity);
    if (!isNaN(target) && target !== settings.targetLiquidity) {
      updates.targetLiquidity = target;
    }

    const interval = parseInt(intervalSeconds, 10);
    if (!isNaN(interval) && interval >= 5 && interval !== settings.intervalSeconds) {
      updates.intervalSeconds = interval;
    }

    const threshold = maxThreshold ? parseFloat(maxThreshold) : null;
    if (threshold !== settings.maxLiquidityThreshold) {
      updates.maxLiquidityThreshold = threshold;
    }

    if (isCashMarket) {
      const intInterval = internalInterval ? parseInt(internalInterval, 10) : null;
      if (intInterval !== settings.internalTradeInterval) {
        updates.internalTradeInterval = intInterval;
      }

      const volMin = internalVolumeMin ? parseFloat(internalVolumeMin) : null;
      if (volMin !== settings.internalTradeVolumeMin) {
        updates.internalTradeVolumeMin = volMin;
      }

      const volMax = internalVolumeMax ? parseFloat(internalVolumeMax) : null;
      if (volMax !== settings.internalTradeVolumeMax) {
        updates.internalTradeVolumeMax = volMax;
      }
    }

    if (Object.keys(updates).length > 0) {
      await onSave(settings.marketKey, updates);
      setHasChanges(false);
    }
  };

  const liquidityPercentage = settings.liquidityPercentage || 0;
  const isAboveTarget = liquidityPercentage > 105;
  const isBelowTarget = liquidityPercentage < 95;

  return (
    <Card className={`bg-gradient-to-br ${config.bgGradient} border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-navy-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{config.title}</h3>
              <p className="text-xs text-navy-400">{config.subtitle}</p>
            </div>
          </div>
          <StatusIndicator enabled={settings.enabled} />
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="p-4 border-b border-navy-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-navy-400" />
            <span className="text-sm text-navy-300">Auto-Trading</span>
          </div>
          <ToggleSwitch
            checked={settings.enabled}
            onChange={handleToggle}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Current Liquidity */}
      <div className="p-4 border-b border-navy-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-navy-400 uppercase tracking-wider">Current Liquidity</span>
          <span className={`text-lg font-bold ${isAboveTarget ? 'text-amber-400' : isBelowTarget ? 'text-red-400' : 'text-white'}`}>
            {formatEuro(settings.currentLiquidity)}
          </span>
        </div>
        <LiquidityProgressBar
          percentage={liquidityPercentage}
          color={config.color}
        />
        <div className="flex justify-between mt-1.5 text-xs text-navy-500">
          <span>0%</span>
          <span className="text-navy-400">Target: {formatEuro(settings.targetLiquidity)}</span>
          <span>150%</span>
        </div>
      </div>

      {/* Settings Inputs */}
      <div className="p-4 space-y-4">
        {/* Target Liquidity */}
        <div>
          <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
            Target Liquidity (EUR)
          </label>
          <NumberInput
            value={targetLiquidity}
            onChange={handleFieldChange(setTargetLiquidity)}
            disabled={isSaving}
            decimals={0}
            className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
          />
        </div>

        {/* Order Interval */}
        <div>
          <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
            Order Interval (seconds)
          </label>
          <NumberInput
            value={intervalSeconds}
            onChange={handleFieldChange(setIntervalSeconds)}
            disabled={isSaving}
            decimals={0}
            className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
          />
          <p className="text-xs text-navy-500 mt-1">Min: 5s, Max: 3600s</p>
        </div>

        {/* Max Threshold */}
        <div>
          <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
            Max Threshold (EUR)
          </label>
          <NumberInput
            value={maxThreshold}
            onChange={handleFieldChange(setMaxThreshold)}
            disabled={isSaving}
            decimals={0}
            placeholder="No limit"
            className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
          />
          <p className="text-xs text-navy-500 mt-1">
            If exceeded, execute internal trades to reduce
          </p>
        </div>
      </div>

      {/* Internal Trade Settings - only for CEA BID and CEA ASK */}
      {isCashMarket && (
        <div className="p-4 border-t border-navy-700/30 bg-navy-800/20">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 uppercase tracking-wider font-medium">
              Internal Trades (at target)
            </span>
          </div>
          <div className="space-y-3">
            {/* Internal Trade Interval */}
            <div>
              <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
                Interval (seconds)
              </label>
              <NumberInput
                value={internalInterval}
                onChange={handleFieldChange(setInternalInterval)}
                disabled={isSaving}
                decimals={0}
                placeholder="Disabled"
                className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
              />
            </div>

            {/* Volume Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
                  Min Volume (EUR)
                </label>
                <NumberInput
                  value={internalVolumeMin}
                  onChange={handleFieldChange(setInternalVolumeMin)}
                  disabled={isSaving}
                  decimals={0}
                  placeholder="0"
                  className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
                />
              </div>
              <div>
                <label className="text-xs text-navy-400 uppercase tracking-wider mb-1.5 block">
                  Max Volume (EUR)
                </label>
                <NumberInput
                  value={internalVolumeMax}
                  onChange={handleFieldChange(setInternalVolumeMax)}
                  disabled={isSaving}
                  decimals={0}
                  placeholder="0"
                  className="!bg-navy-800/50 !border-navy-600/50 !text-white text-right"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="p-4 border-t border-navy-700/30 bg-navy-900/30">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`w-full flex items-center justify-center gap-2 ${
            hasChanges
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-navy-700 text-navy-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
        </Button>
      </div>

      {/* Market Maker Info */}
      {settings.marketMakers.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-navy-800/30 border border-navy-700/20">
            <div className="flex items-center gap-2 text-xs text-navy-400">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {settings.marketMakers.map(mm => mm.name).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AutoTradePage() {
  const [markets, setMarkets] = useState<AutoTradeMarketSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Monitor state
  const [monitorSummary, setMonitorSummary] = useState<MonitorSummary | null>(null);
  const [monitorRules, setMonitorRules] = useState<MonitorRule[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(true);

  const loadMarkets = useCallback(async () => {
    try {
      const data = await adminApi.getMarketSettings();
      // Sort by market key order: CEA_BID, CEA_ASK, EUA_SWAP
      const order = ['CEA_BID', 'CEA_ASK', 'EUA_SWAP'];
      data.sort((a, b) => order.indexOf(a.marketKey) - order.indexOf(b.marketKey));
      setMarkets(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonitor = useCallback(async () => {
    try {
      const data = await getAutoTradeMonitor();
      setMonitorSummary(data.summary);
      setMonitorRules(data.rules || []);
    } catch (err) {
      console.error('Failed to load monitor:', err);
    } finally {
      setMonitorLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (marketKey: string, updates: AutoTradeMarketSettingsUpdate) => {
    setSaving(marketKey);
    try {
      const updated = await adminApi.updateMarketSettings(marketKey, updates);
      setMarkets(prev => prev.map(m => m.marketKey === marketKey ? updated : m));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }, []);

  const handleToggle = useCallback(async (marketKey: string, enabled: boolean) => {
    setSaving(marketKey);
    try {
      const updated = await adminApi.updateMarketSettings(marketKey, { enabled });
      setMarkets(prev => prev.map(m => m.marketKey === marketKey ? updated : m));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMarkets();
    loadMonitor();
  }, [loadMarkets, loadMonitor]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarkets();
      loadMonitor();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMarkets, loadMonitor]);

  // Count active markets
  const enabledCount = markets.filter(m => m.enabled).length;
  const disabledCount = markets.filter(m => !m.enabled).length;

  return (
    <BackofficeLayout>
      <div className="min-h-screen bg-navy-950">
        {/* Header */}
        <div className="border-b border-navy-800/50 bg-navy-900/30">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Liquidity Engine</h1>
                  <p className="text-sm text-navy-400">Automated market making control</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Status Summary */}
                <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-navy-800/50 border border-navy-700/30">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">{enabledCount}</div>
                    <div className="text-xs text-navy-400">Enabled</div>
                  </div>
                  <div className="w-px h-8 bg-navy-700/50" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-navy-400">{disabledCount}</div>
                    <div className="text-xs text-navy-400">Disabled</div>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => { loadMarkets(); loadMonitor(); }}
                  disabled={loading}
                  className="p-2.5 rounded-lg bg-navy-800/50 border border-navy-700/30 text-navy-400 hover:text-white hover:border-navy-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Last Update */}
            {lastRefresh && (
              <div className="mt-3 text-xs text-navy-500">
                Last updated: {lastRefresh.toLocaleTimeString()} (auto-refresh every {REFRESH_INTERVAL_MS / 1000}s)
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Monitor Panel */}
          <div className="mb-6">
            <MonitorPanel
              summary={monitorSummary}
              rules={monitorRules}
              loading={monitorLoading}
            />
          </div>

          {/* Loading State */}
          {loading && markets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : (
            /* Market Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {markets.map(market => (
                <MarketCard
                  key={market.marketKey}
                  settings={market}
                  onSave={handleSave}
                  onToggle={handleToggle}
                  isSaving={saving === market.marketKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
}

export default AutoTradePage;
