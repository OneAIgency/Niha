import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ShoppingCart,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card, Tabs, type Tab } from '../common';
import { settlementApi } from '../../services/api';
import type { SettlementBatch, SettlementStatus } from '../../types';
import { formatCurrency, formatCertificateQuantity, formatDate } from '../../utils';

/** Filter option: maps to backend statuses (PROCESSING = TRANSFER_INITIATED | IN_TRANSIT | AT_CUSTODY). */
type StatusFilter = 'all' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

const PROCESSING_STATUSES: SettlementStatus[] = ['TRANSFER_INITIATED', 'IN_TRANSIT', 'AT_CUSTODY'];

const statusFilterTabs: Tab[] = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'FAILED', label: 'Failed' },
];

function matchesStatusFilter(settlement: SettlementBatch, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'PENDING') return settlement.status === 'PENDING';
  if (filter === 'PROCESSING') return PROCESSING_STATUSES.includes(settlement.status);
  if (filter === 'COMPLETED') return settlement.status === 'SETTLED';
  if (filter === 'FAILED') return settlement.status === 'FAILED';
  return true;
}

interface SettlementTransactionsProps {
  onSettlementClick?: (settlement: SettlementBatch) => void;
}

export function SettlementTransactions({ onSettlementClick }: SettlementTransactionsProps) {
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetchSettlements();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSettlements, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettlements = async () => {
    try {
      setError(null);
      const response = await settlementApi.getPendingSettlements();
      setSettlements(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch settlements:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load pending transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusColor = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'FAILED':
        return 'text-red-400 bg-red-500/20';
      case 'PENDING':
        return 'text-amber-400 bg-amber-500/20';
      case 'TRANSFER_INITIATED':
        return 'text-blue-400 bg-blue-500/20';
      case 'IN_TRANSIT':
        return 'text-navy-400 bg-navy-500/20';
      case 'AT_CUSTODY':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-navy-600 dark:text-navy-400 bg-navy-500/20';
    }
  };

  const getStatusLabel = (status: SettlementStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'TRANSFER_INITIATED':
        return 'Transfer Initiated';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'AT_CUSTODY':
        return 'At Custody';
      case 'SETTLED':
        return 'Settled';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CEA_PURCHASE':
        return <ShoppingCart className="w-4 h-4" />;
      case 'SWAP_CEA_TO_EUA':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CEA_PURCHASE':
        return 'CEA Purchase';
      case 'SWAP_CEA_TO_EUA':
        return 'Swap CEA→EUA';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-navy-600 dark:text-navy-400">Loading pending transactions...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      </Card>
    );
  }

  const filteredSettlements = useMemo(
    () => settlements.filter((s) => matchesStatusFilter(s, statusFilter)),
    [settlements, statusFilter]
  );

  if (settlements.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-navy-600 dark:text-navy-400">No pending transactions</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-navy-400">Status:</span>
        <Tabs
          tabs={statusFilterTabs}
          activeTab={statusFilter}
          onChange={(id) => setStatusFilter(id as StatusFilter)}
          variant="pills"
          size="sm"
        />
      </div>
      {filteredSettlements.length === 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8 text-navy-400">
            No settlements match the selected filter
          </div>
        </Card>
      ) : (
        filteredSettlements.map((settlement) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            className="p-4 hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`View details for ${settlement.batchReference}`}
            onClick={() => onSettlementClick?.(settlement)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSettlementClick?.(settlement);
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Type and Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(settlement.settlementType)}
                  <span className="text-sm font-medium text-white">
                    {getTypeLabel(settlement.settlementType)}
                  </span>
                  <span className="text-xs text-navy-600 dark:text-navy-400 font-mono">
                    {settlement.batchReference}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-navy-300 dark:text-navy-300 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-navy-500 dark:text-navy-500">Asset:</span>
                    <span className="font-medium">{settlement.assetType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-navy-500 dark:text-navy-500">Quantity:</span>
                    <span className="font-mono font-medium">
                      {formatCertificateQuantity(settlement.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-navy-500 dark:text-navy-500">Value:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(settlement.totalValueEur, 'EUR')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-navy-600 dark:text-navy-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(settlement.progressPercent ?? 0)}%</span>
                  </div>
                  <div className="w-full bg-navy-200 dark:bg-navy-700 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${settlement.progressPercent ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Expected Date */}
                <div className="flex items-center gap-1 text-xs text-navy-600 dark:text-navy-400">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Expected: {formatDate(settlement.expectedSettlementDate)}
                  </span>
                </div>
              </div>

              {/* Right: Status */}
              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(settlement.status)}`}>
                  {getStatusIcon(settlement.status)}
                  {getStatusLabel(settlement.status)}
                </div>
                {onSettlementClick && (
                  <ChevronRight className="w-4 h-4 text-navy-500 dark:text-navy-500" />
                )}
              </div>
            </div>
          </Card>
        </motion.div>
        ))
      )}
    </div>
  );
}
