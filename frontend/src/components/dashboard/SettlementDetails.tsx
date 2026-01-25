import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { Card, Button } from '../common';
import { settlementApi } from '../../services/api';
import type { SettlementBatch, SettlementStatusHistory, SettlementStatus } from '../../types';
import { formatCurrency, formatQuantity, formatDate } from '../../utils';

interface SettlementDetailsProps {
  settlementId: string;
  onClose: () => void;
}

export function SettlementDetails({ settlementId, onClose }: SettlementDetailsProps) {
  const [settlement, setSettlement] = useState<SettlementBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [settlementId]);

  const fetchDetails = async () => {
    try {
      setError(null);
      const details = await settlementApi.getSettlementDetails(settlementId);
      setSettlement(details);
    } catch (err: any) {
      console.error('Failed to fetch settlement details:', err);
      setError(err.response?.data?.detail || 'Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-amber-400" />;
    }
  };

  const getStatusColor = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'FAILED':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'PENDING':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'TRANSFER_INITIATED':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'IN_TRANSIT':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'AT_CUSTODY':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <div className="text-center py-8">
            <div className="text-slate-400">Loading settlement details...</div>
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
            <div className="text-red-400">{error || 'Settlement not found'}</div>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
              <h2 className="text-xl font-bold text-white mb-1">
                {settlement.settlement_type === 'CEA_PURCHASE' ? 'CEA Purchase' : 'Swap CEA→EUA'}
              </h2>
              <p className="text-sm text-slate-400 font-mono">{settlement.batch_reference}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close settlement details"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(settlement.status)}`}>
              {getStatusIcon(settlement.status)}
              <span className="font-medium">{getStatusLabel(settlement.status)}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-slate-400 mb-1">Asset Type</div>
              <div className="text-sm font-medium text-white">{settlement.asset_type}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Quantity</div>
              <div className="text-sm font-mono font-medium text-white">
                {formatQuantity(settlement.quantity)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Price</div>
              <div className="text-sm font-mono font-medium text-white">
                {formatCurrency(settlement.price, 'EUR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Total Value</div>
              <div className="text-sm font-mono font-medium text-white">
                {formatCurrency(settlement.total_value_eur, 'EUR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Expected Settlement</div>
              <div className="text-sm font-medium text-white">
                {formatDate(settlement.expected_settlement_date)}
              </div>
            </div>
            {settlement.actual_settlement_date && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Actual Settlement</div>
                <div className="text-sm font-medium text-white">
                  {formatDate(settlement.actual_settlement_date)}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-300">Settlement Progress</span>
              <span className="text-white font-medium">{Math.round(settlement.progress_percent)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${settlement.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          {settlement.timeline && settlement.timeline.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Timeline
              </h3>
              <div className="space-y-3">
                {settlement.timeline.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(entry.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-slate-400">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {settlement.registry_reference && (
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1">Registry Reference</div>
              <div className="text-sm font-mono text-white">{settlement.registry_reference}</div>
            </div>
          )}

          {settlement.notes && (
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1">Notes</div>
              <div className="text-sm text-white">{settlement.notes}</div>
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
