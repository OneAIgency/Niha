import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Truck,
  Package,
  Check,
  XCircle,
} from 'lucide-react';
import { Card, Button } from '../common';
import { settlementApi } from '../../services/api';
import type { SettlementBatch, SettlementStatus } from '../../types';
import { formatCurrency, formatQuantity, formatDate } from '../../utils';

interface SettlementDetailsProps {
  settlementId: string;
  onClose: () => void;
}

export function SettlementDetails({ settlementId, onClose }: SettlementDetailsProps) {
  const [settlement, setSettlement] = useState<SettlementBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      setError(null);
      const details = await settlementApi.getSettlementDetails(settlementId);
      setSettlement(details);
    } catch (err: unknown) {
      console.error('Failed to fetch settlement details:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  }, [settlementId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const getStatusIcon = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TRANSFER_INITIATED':
        return <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'IN_TRANSIT':
        return <Truck className="w-5 h-5 text-navy-600 dark:text-navy-400" />;
      case 'AT_CUSTODY':
        return <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-navy-600 dark:text-navy-400" />;
    }
  };

  const getStatusColor = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30';
      case 'FAILED':
        return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/30';
      case 'PENDING':
        return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30';
      case 'TRANSFER_INITIATED':
        return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30';
      case 'IN_TRANSIT':
        return 'text-navy-700 dark:text-navy-400 bg-navy-100 dark:bg-navy-500/20 border-navy-300 dark:border-navy-500/30';
      case 'AT_CUSTODY':
        return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30';
      default:
        return 'text-navy-700 dark:text-navy-400 bg-navy-100 dark:bg-navy-500/20 border-navy-300 dark:border-navy-500/30';
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

  const getProgressStages = () => {
    const stages = [
      { status: 'PENDING', label: 'Pending', icon: Clock },
      { status: 'TRANSFER_INITIATED', label: 'Transfer', icon: ArrowRight },
      { status: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
      { status: 'AT_CUSTODY', label: 'Custody', icon: Package },
      { status: 'SETTLED', label: 'Settled', icon: Check },
    ];

    const currentStageIndex = stages.findIndex(s => s.status === settlement?.status);

    return stages.map((stage, index) => ({
      ...stage,
      completed: index <= currentStageIndex,
      current: index === currentStageIndex,
    }));
  };

  const calculateDaysRemaining = () => {
    if (!settlement?.expectedSettlementDate || settlement.status === 'SETTLED') return null;

    const expected = new Date(settlement.expectedSettlementDate);
    const now = new Date();
    const diff = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return diff;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <div className="text-center py-8">
            <div className="text-navy-600 dark:text-navy-400">Loading settlement details...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400">{error || 'Settlement not found'}</div>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stages = getProgressStages();
  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-1">
                {settlement.settlementType === 'CEA_PURCHASE' ? 'CEA Purchase' : 'Swap CEA→EUA'}
              </h2>
              <p className="text-sm text-navy-500 dark:text-navy-400 font-mono">{settlement.batchReference}</p>
            </div>
            <button
              onClick={onClose}
              className="text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white transition-colors"
              aria-label="Close settlement details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge and Countdown */}
          <div className="flex items-center justify-between mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getStatusColor(settlement.status)}`}>
              {getStatusIcon(settlement.status)}
              <span className="font-medium">{getStatusLabel(settlement.status)}</span>
            </div>

            {daysRemaining !== null && daysRemaining >= 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-navy-500 dark:text-navy-400" />
                <span className="text-navy-600 dark:text-navy-400">
                  {daysRemaining === 0 ? 'Settles today' : daysRemaining === 1 ? '1 day remaining' : `${daysRemaining} days remaining`}
                </span>
              </div>
            )}
          </div>

          {/* Progress Stages */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.status} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          stage.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-navy-100 dark:bg-navy-700 text-navy-400 dark:text-navy-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium ${
                          stage.current
                            ? 'text-navy-900 dark:text-white'
                            : 'text-navy-500 dark:text-navy-400'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                    {index < stages.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 transition-all ${
                          stages[index + 1].completed ? 'bg-emerald-500' : 'bg-navy-200 dark:bg-navy-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Asset Type</div>
              <div className="text-sm font-medium text-navy-900 dark:text-white">{settlement.assetType}</div>
            </div>
            <div>
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Quantity</div>
              <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                {formatQuantity(settlement.quantity)}
              </div>
            </div>
            <div>
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Price</div>
              <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                {formatCurrency(settlement.price, 'EUR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Total Value</div>
              <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                {formatCurrency(settlement.totalValueEur, 'EUR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Expected Settlement</div>
              <div className="text-sm font-medium text-navy-900 dark:text-white">
                {formatDate(settlement.expectedSettlementDate)}
              </div>
            </div>
            {settlement.actualSettlementDate && (
              <div>
                <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Actual Settlement</div>
                <div className="text-sm font-medium text-navy-900 dark:text-white">
                  {formatDate(settlement.actualSettlementDate)}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {settlement.timeline && settlement.timeline.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Status History
              </h3>
              <div className="space-y-3 relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-3 bottom-3 w-px bg-navy-200 dark:bg-navy-700" />

                {settlement.timeline.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 relative">
                    <div className="relative z-10 mt-1 bg-white dark:bg-navy-800 p-1">
                      {getStatusIcon(entry.status)}
                    </div>
                    <div className="flex-1 bg-navy-50 dark:bg-navy-700/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        <span className="text-xs text-navy-500 dark:text-navy-400">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-navy-600 dark:text-navy-400">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {settlement.registryReference && (
            <div className="mb-4">
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Registry Reference</div>
              <div className="text-sm font-mono text-navy-900 dark:text-white">{settlement.registryReference}</div>
            </div>
          )}

          {settlement.notes && (
            <div className="mb-4">
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Notes</div>
              <div className="text-sm text-navy-900 dark:text-white">{settlement.notes}</div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
