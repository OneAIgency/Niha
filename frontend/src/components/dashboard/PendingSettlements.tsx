import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Truck,
  Package,
  Calendar,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Card } from '../common';
import { SettlementDetails } from './SettlementDetails';
import { settlementApi } from '../../services/api';
import type { SettlementBatch } from '../../types';
import { formatCurrency, formatCertificateQuantity } from '../../utils';

export function PendingSettlements() {
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSettlements, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettlements = async () => {
    try {
      setError(null);
      const data = await settlementApi.getPendingSettlements();
      setSettlements(data.data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch settlements:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'TRANSFER_INITIATED':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4 text-navy-400" />;
      case 'AT_CUSTODY':
        return <Package className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-navy-400" />;
    }
  };

  const getStatusColor = (status: string) => {
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
        return 'text-navy-400 bg-navy-500/20 border-navy-500/30';
      case 'AT_CUSTODY':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-navy-400 bg-navy-500/20 border-navy-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
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

  const downloadCsv = () => {
    const headers = ['Reference', 'Type', 'Status', 'Asset', 'Quantity', 'Price (EUR)', 'Total Value (EUR)', 'Expected Settlement', 'Progress %'];
    const rows = settlements.map(s => [
      s.batchReference,
      s.settlementType === 'CEA_PURCHASE' ? 'CEA Purchase' : 'Swap CEA→EUA',
      getStatusLabel(s.status),
      s.assetType,
      s.quantity,
      s.price,
      s.totalValueEur,
      s.expectedSettlementDate ? new Date(s.expectedSettlementDate).toISOString().split('T')[0] : '',
      s.progressPercent ?? 0,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateDaysRemaining = (expectedDate: string) => {
    const expected = new Date(expectedDate);
    const now = new Date();
    const diff = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Pending Settlements
        </h3>
        <div className="text-center py-8 text-navy-400">
          Loading settlements...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Pending Settlements
        </h3>
        <div className="text-center py-8 text-red-400">
          {error}
        </div>
      </Card>
    );
  }

  if (settlements.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Pending Settlements
        </h3>
        <div className="text-center py-8">
          <div className="text-navy-400 mb-2">
            No pending settlements
          </div>
          <p className="text-sm text-navy-500">
            Settlements will appear here when you purchase CEA certificates
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Pending Settlements
            <span className="text-sm font-normal text-navy-400">
              ({settlements.length})
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              className="flex items-center gap-1 text-sm text-navy-400 hover:text-white transition-colors"
              title="Download as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={fetchSettlements}
              className="text-sm text-navy-400 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {settlements.map((settlement) => {
            const daysRemaining = calculateDaysRemaining(settlement.expectedSettlementDate);
            const progress = settlement.progressPercent || 0;

            return (
              <motion.div
                key={settlement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
              >
                <button
                  onClick={() => setSelectedSettlement(settlement.id)}
                  className="w-full text-left bg-navy-700/50 hover:bg-navy-700 rounded-xl p-4 transition-all border border-transparent hover:border-navy-600"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {settlement.settlementType === 'CEA_PURCHASE' ? 'CEA Purchase' : 'Swap CEA→EUA'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium ${getStatusColor(settlement.status)}`}>
                          {getStatusIcon(settlement.status)}
                          {getStatusLabel(settlement.status)}
                        </span>
                      </div>
                      <p className="text-xs text-navy-400 font-mono">
                        {settlement.batchReference}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-navy-300 transition-colors" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-navy-400 mb-0.5">Quantity</div>
                      <div className="text-sm font-mono font-medium text-white">
                        {formatCertificateQuantity(settlement.quantity)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-navy-400 mb-0.5">Value</div>
                      <div className="text-sm font-mono font-medium text-white">
                        {formatCurrency(settlement.totalValueEur, 'EUR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-navy-400 mb-0.5">Expected</div>
                      <div className="text-sm font-medium text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-navy-400" />
                        {daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-navy-400">Progress</span>
                      <span className="text-white font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-navy-600 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-navy-700">
          <p className="text-xs text-navy-400 text-center">
            Auto-refreshes every 30 seconds
          </p>
        </div>
      </Card>

      {/* Settlement Details Modal */}
      {selectedSettlement && (
        <SettlementDetails
          settlementId={selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
        />
      )}
    </>
  );
}
