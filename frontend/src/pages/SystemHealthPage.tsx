import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Activity, Cpu } from 'lucide-react';
import { systemHealthApi } from '../services/api';
import { BackofficeLayout } from '../components/layout';
import { AlertBanner, PageLoadingState } from '../components/common';
import { cn, formatCurrency } from '../utils';
import { getApiErrorMessage } from '../utils/errors';
import type { ProcessorStatus, SettlementMetrics, SettlementAlert } from '../types';

type TabKey = 'overview' | 'settlements' | 'alerts' | 'processors';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  settlements: 'Settlements',
  alerts: 'Alerts',
  processors: 'Processors',
};

// ---------------------------------------------------------------------------
// Helper: relative time for processor display (seconds-level precision)
// ---------------------------------------------------------------------------
function processorRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const now = Date.now();
  let dateStr = isoDate;
  if (!isoDate.endsWith('Z') && !isoDate.includes('+') && !isoDate.includes('-', 10)) {
    dateStr = isoDate + 'Z';
  }
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hr ago`;
}

// ---------------------------------------------------------------------------
// Helper: compute seconds since an ISO date
// ---------------------------------------------------------------------------
function secondsSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  let dateStr = isoDate;
  if (!isoDate.endsWith('Z') && !isoDate.includes('+') && !isoDate.includes('-', 10)) {
    dateStr = isoDate + 'Z';
  }
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
}

// ---------------------------------------------------------------------------
// Overview — status card colour logic
// ---------------------------------------------------------------------------
type StatusLevel = 'green' | 'amber' | 'red' | 'unknown';

function settlementStatusLevel(metrics: SettlementMetrics | null): StatusLevel {
  if (!metrics) return 'unknown';
  if (metrics.totalFailed > 0 || metrics.totalOverdue > 2) return 'red';
  if (metrics.totalOverdue > 0) return 'amber';
  return 'green';
}

function processorStatusLevel(processor: ProcessorStatus | undefined, thresholds: { amber: number; red: number }): StatusLevel {
  if (!processor) return 'unknown';
  if (processor.status === 'error') return 'red';
  const sec = secondsSince(processor.lastRunAt);
  if (sec === null) return 'unknown';
  if (sec > thresholds.red) return 'red';
  if (sec > thresholds.amber) return 'amber';
  return 'green';
}

const STATUS_STYLES: Record<StatusLevel, { bg: string; border: string; dot: string; label: string }> = {
  green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', label: 'Healthy' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500', label: 'Warning' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', label: 'Critical' },
  unknown: { bg: 'bg-navy-700/50', border: 'border-navy-600', dot: 'bg-navy-500', label: 'Unknown' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SystemHealthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [settlementMetrics, setSettlementMetrics] = useState<SettlementMetrics | null>(null);
  const [settlementAlerts, setSettlementAlerts] = useState<SettlementAlert[]>([]);
  const [processors, setProcessors] = useState<ProcessorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [metricsRes, alertsRes, processorsRes] = await Promise.all([
        systemHealthApi.getSettlementMetrics(),
        systemHealthApi.getSettlementAlerts(),
        systemHealthApi.getProcessors(),
      ]);

      setSettlementMetrics(metricsRes);
      setSettlementAlerts(alertsRes.alerts ?? []);
      setProcessors(processorsRes.processors ?? []);
    } catch (err: unknown) {
      console.error('Error fetching system health data:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket listener for realtime updates
  useEffect(() => {
    const handler = () => {
      fetchData(true);
    };
    window.addEventListener('nihao:system_health_update', handler);
    return () => window.removeEventListener('nihao:system_health_update', handler);
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Processor lookup helpers for Overview tab
  // ---------------------------------------------------------------------------
  const findProcessor = (nameFragment: string) =>
    processors.find((p) => p.name.toLowerCase().includes(nameFragment.toLowerCase()));

  const priceScraperProc = findProcessor('price') ?? findProcessor('scrap');
  const autoTradeProc = findProcessor('auto') ?? findProcessor('trade');
  const exchangeRateProc = findProcessor('exchange') ?? findProcessor('rate');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <BackofficeLayout>
        <PageLoadingState text="Loading system health..." />
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout
      subSubHeaderLeft={
        <div className="flex items-center gap-1">
          {(['overview', 'settlements', 'alerts', 'processors'] as const).map((tab) => (
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
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      }
      subSubHeader={
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-navy-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
        )}

        {/* ======== OVERVIEW TAB ======== */}
        {activeTab === 'overview' && (
          <>
            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewStatusCard
                title="Settlements"
                icon={<Activity className="w-5 h-5" />}
                level={settlementStatusLevel(settlementMetrics)}
                detail={
                  settlementMetrics
                    ? settlementMetrics.totalFailed > 0
                      ? `${settlementMetrics.totalFailed} failed`
                      : settlementMetrics.totalOverdue > 0
                        ? `${settlementMetrics.totalOverdue} overdue`
                        : 'All clear'
                    : 'No data'
                }
              />
              <OverviewStatusCard
                title="Price Scraper"
                icon={<Activity className="w-5 h-5" />}
                level={processorStatusLevel(priceScraperProc, { amber: 300, red: 900 })}
                detail={priceScraperProc ? processorRelativeTime(priceScraperProc.lastRunAt) : 'Not registered'}
              />
              <OverviewStatusCard
                title="Auto Trade"
                icon={<Cpu className="w-5 h-5" />}
                level={processorStatusLevel(autoTradeProc, { amber: 60, red: 300 })}
                detail={autoTradeProc ? processorRelativeTime(autoTradeProc.lastRunAt) : 'Not registered'}
              />
              <OverviewStatusCard
                title="Exchange Rates"
                icon={<Activity className="w-5 h-5" />}
                level={processorStatusLevel(exchangeRateProc, { amber: 300, red: 900 })}
                detail={exchangeRateProc ? processorRelativeTime(exchangeRateProc.lastRunAt) : 'Not registered'}
              />
            </div>

            {/* Alert summary */}
            <div className="panel panel--flush p-5">
              <div className="flex items-center gap-3">
                {settlementAlerts.length === 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-400 font-medium">No active alerts</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-amber-400 font-medium">
                      {settlementAlerts.length} active alert{settlementAlerts.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Key metrics */}
            {settlementMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Pending Settlements" value={String(settlementMetrics.totalPending)} />
                <MetricCard label="Settled Today" value={String(settlementMetrics.totalSettledToday)} />
                <MetricCard label="Failed" value={String(settlementMetrics.totalFailed)} valueColor={settlementMetrics.totalFailed > 0 ? 'text-red-400' : undefined} />
              </div>
            )}
          </>
        )}

        {/* ======== SETTLEMENTS TAB ======== */}
        {activeTab === 'settlements' && settlementMetrics && (
          <>
            {/* Row 1: Count cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Pending" value={settlementMetrics.totalPending} bgClass="bg-navy-700/50" borderClass="border-navy-600" />
              <StatCard label="In Progress" value={settlementMetrics.totalInProgress} bgClass="bg-blue-500/10" borderClass="border-blue-500/30" />
              <StatCard label="Settled Today" value={settlementMetrics.totalSettledToday} bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" />
              <StatCard label="Failed" value={settlementMetrics.totalFailed} bgClass="bg-red-500/10" borderClass="border-red-500/30" valueColor="text-red-400" />
              <StatCard label="Overdue" value={settlementMetrics.totalOverdue} bgClass="bg-amber-500/10" borderClass="border-amber-500/30" valueColor="text-amber-400" />
            </div>

            {/* Row 2: Detail cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailCard
                label="Avg Settlement Time"
                value={
                  settlementMetrics.avgSettlementTimeHours !== null
                    ? `${settlementMetrics.avgSettlementTimeHours.toFixed(1)} hrs`
                    : '--'
                }
              />
              <DetailCard
                label="Value Pending EUR"
                value={formatCurrency(settlementMetrics.totalValuePendingEur)}
              />
              <DetailCard
                label="Value Settled Today EUR"
                value={formatCurrency(settlementMetrics.totalValueSettledTodayEur)}
              />
              <DetailCard
                label="Oldest Pending"
                value={
                  settlementMetrics.oldestPendingDays !== null
                    ? `${settlementMetrics.oldestPendingDays} day${settlementMetrics.oldestPendingDays !== 1 ? 's' : ''}`
                    : '--'
                }
              />
            </div>
          </>
        )}

        {activeTab === 'settlements' && !settlementMetrics && (
          <div className="panel panel--flush p-12 text-center text-navy-400">
            No settlement data available.
          </div>
        )}

        {/* ======== ALERTS TAB ======== */}
        {activeTab === 'alerts' && (
          <>
            {settlementAlerts.length === 0 ? (
              <div className="panel panel--flush p-12 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-emerald-400 font-medium">No active alerts &mdash; all systems operational</p>
              </div>
            ) : (
              <div className="panel panel--flush overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-navy-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">Batch Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-400 uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-navy-400 uppercase tracking-wider">Value EUR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-700">
                    {settlementAlerts.map((alert, idx) => (
                      <tr key={`${alert.settlementId}-${idx}`} className="hover:bg-navy-700/30">
                        <td className="px-4 py-3 text-sm">
                          <SeverityBadge severity={alert.severity} />
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-mono">{alert.batchReference}</td>
                        <td className="px-4 py-3 text-sm text-navy-300">{alert.entityName}</td>
                        <td className="px-4 py-3 text-sm text-navy-300">{alert.message}</td>
                        <td className="px-4 py-3 text-sm text-white text-right">
                          {alert.totalValueEur !== null ? formatCurrency(alert.totalValueEur) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ======== PROCESSORS TAB ======== */}
        {activeTab === 'processors' && (
          <>
            {processors.length === 0 ? (
              <div className="panel panel--flush p-12 text-center text-navy-400">
                No processors registered.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processors.map((proc) => (
                  <ProcessorCard key={proc.name} processor={proc} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BackofficeLayout>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OverviewStatusCard({
  title,
  icon,
  level,
  detail,
}: {
  title: string;
  icon: React.ReactNode;
  level: StatusLevel;
  detail: string;
}) {
  const s = STATUS_STYLES[level];
  return (
    <div className={cn('rounded-xl border p-4', s.bg, s.border)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-navy-300">{title}</span>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('w-2.5 h-2.5 rounded-full', s.dot)} />
        <span className="text-sm font-semibold text-white">{s.label}</span>
      </div>
      <p className="text-xs text-navy-400 mt-1">{detail}</p>
    </div>
  );
}

function MetricCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="panel panel--flush p-4">
      <span className="text-xs text-navy-400 block mb-1">{label}</span>
      <span className={cn('text-xl font-bold text-white', valueColor)}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  bgClass,
  borderClass,
  valueColor,
}: {
  label: string;
  value: number;
  bgClass: string;
  borderClass: string;
  valueColor?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4', bgClass, borderClass)}>
      <span className="text-xs text-navy-400 block mb-1">{label}</span>
      <span className={cn('text-2xl font-bold text-white', valueColor)}>{value}</span>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel panel--flush p-4">
      <span className="text-xs text-navy-400 block mb-1">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'CRITICAL' | 'ERROR' | 'WARNING' }) {
  const styles = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    ERROR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    WARNING: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', styles[severity])}>
      {severity}
    </span>
  );
}

function ProcessorCard({ processor }: { processor: ProcessorStatus }) {
  const isError = processor.status === 'error';
  const isRunning = processor.status === 'running';

  return (
    <div className={cn(
      'rounded-xl border p-5',
      isError ? 'bg-red-500/5 border-red-500/30' : 'bg-navy-700/50 border-navy-600'
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{processor.name}</h3>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border',
            isError
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : isRunning
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isError ? 'bg-red-400' : isRunning ? 'bg-blue-400' : 'bg-emerald-400'
          )} />
          {isError ? 'Error' : isRunning ? 'Running' : 'Idle'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-navy-400 text-xs block">Last Run</span>
          <span className="text-white flex items-center gap-1">
            <Clock className="w-3 h-3 text-navy-400" />
            {processorRelativeTime(processor.lastRunAt)}
          </span>
        </div>
        <div>
          <span className="text-navy-400 text-xs block">Cycle Interval</span>
          <span className="text-white">{processor.cycleSeconds}s</span>
        </div>
        <div>
          <span className="text-navy-400 text-xs block">Run Count</span>
          <span className="text-white">{processor.runCount}</span>
        </div>
        <div>
          <span className="text-navy-400 text-xs block">Error Count</span>
          <span className={cn('font-medium', processor.errorCount > 0 ? 'text-red-400' : 'text-white')}>
            {processor.errorCount}
          </span>
        </div>
      </div>

      {/* Last error tooltip area */}
      {isError && processor.lastError && (
        <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
          <span className="text-xs text-red-400 font-medium block mb-0.5">Last Error</span>
          <p className="text-xs text-red-300 break-all">{processor.lastError}</p>
        </div>
      )}
    </div>
  );
}
