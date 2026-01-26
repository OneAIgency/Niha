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
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  FileText,
  Edit,
} from 'lucide-react';
import { Button, Card, Subheader, Tabs, type Tab } from '../components/common';
import { SettlementDetails } from '../components/dashboard/SettlementDetails';
import { settlementApi } from '../services/api';
import type { SettlementBatch, SettlementStatus } from '../types';
import { formatCurrency, formatQuantity, formatDate } from '../utils';

export function BackofficeSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusTabs: Tab[] = [
    { id: 'all', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'TRANSFER_INITIATED', label: 'Transfer Initiated' },
    { id: 'IN_TRANSIT', label: 'In Transit' },
    { id: 'AT_CUSTODY', label: 'At Custody' },
    { id: 'SETTLED', label: 'Settled' },
    { id: 'FAILED', label: 'Failed' },
  ];

  useEffect(() => {
    fetchAllSettlements();
  }, []);

  useEffect(() => {
    filterSettlements();
  }, [settlements, searchQuery, statusFilter]);

  const fetchAllSettlements = async () => {
    try {
      setError(null);
      // In a real app, this would be an admin-only endpoint that returns ALL settlements
      // For now, using the regular endpoint (would need backend update)
      const data = await settlementApi.getPendingSettlements();
      setSettlements(data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch settlements:', err);
      setError(err.response?.data?.detail || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const filterSettlements = () => {
    let filtered = [...settlements];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filter by search query (batch reference or entity)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.batch_reference.toLowerCase().includes(query) ||
          s.settlement_type.toLowerCase().includes(query)
      );
    }

    setFilteredSettlements(filtered);
  };

  const getStatusIcon = (status: SettlementStatus) => {
    switch (status) {
      case 'SETTLED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'TRANSFER_INITIATED':
        return <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'AT_CUSTODY':
        return <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Clock className="w-4 h-4 text-navy-600 dark:text-navy-400" />;
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
        return 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/30';
      case 'AT_CUSTODY':
        return 'text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/20 border-cyan-300 dark:border-cyan-500/30';
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

  const calculateDaysRemaining = (expectedDate: string) => {
    const expected = new Date(expectedDate);
    const now = new Date();
    const diff = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-navy-900">
      <Subheader
        icon={<FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        title="Settlement Management"
        description="Monitor and manage all settlement batches"
        iconBg="bg-emerald-500/20"
      >
        <Button
          onClick={fetchAllSettlements}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </Subheader>

      <div className="max-w-7xl mx-auto p-6">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </motion.div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 dark:text-navy-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reference..."
                className="w-full pl-10 pr-4 py-2 bg-navy-50 dark:bg-navy-700 border border-navy-200 dark:border-navy-600 rounded-xl text-navy-900 dark:text-white placeholder-navy-500 dark:placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Status Tabs */}
            <Tabs
              tabs={statusTabs}
              activeTab={statusFilter}
              onChange={setStatusFilter}
              variant="pills"
              size="sm"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-navy-900 dark:text-white">
                {filteredSettlements.length}
              </div>
              <div className="text-xs text-navy-500 dark:text-navy-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {filteredSettlements.filter((s) => s.status === 'PENDING').length}
              </div>
              <div className="text-xs text-navy-500 dark:text-navy-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {
                  filteredSettlements.filter((s) =>
                    ['TRANSFER_INITIATED', 'IN_TRANSIT', 'AT_CUSTODY'].includes(s.status)
                  ).length
                }
              </div>
              <div className="text-xs text-navy-500 dark:text-navy-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {filteredSettlements.filter((s) => s.status === 'SETTLED').length}
              </div>
              <div className="text-xs text-navy-500 dark:text-navy-400">Settled</div>
            </div>
          </div>
        </Card>

        {/* Settlements Table */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Settlements
            <span className="text-sm font-normal text-navy-500 dark:text-navy-400">
              ({filteredSettlements.length})
            </span>
          </h3>

          {loading ? (
            <div className="text-center py-12 text-navy-600 dark:text-navy-400">
              Loading settlements...
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-3" />
              <div className="text-navy-600 dark:text-navy-400 mb-2">
                No settlements found
              </div>
              <p className="text-sm text-navy-500 dark:text-navy-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Settlements will appear here when users make purchases'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-2 bg-navy-50 dark:bg-navy-700/50 rounded-lg text-xs font-medium text-navy-600 dark:text-navy-400">
                <div>Reference</div>
                <div>Type</div>
                <div>Status</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Value</div>
                <div>Expected</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredSettlements.map((settlement) => {
                const daysRemaining = calculateDaysRemaining(settlement.expected_settlement_date);

                return (
                  <motion.div
                    key={settlement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 bg-navy-50 dark:bg-navy-700/30 hover:bg-navy-100 dark:hover:bg-navy-700/50 rounded-xl transition-colors border border-transparent hover:border-navy-200 dark:hover:border-navy-600">
                      {/* Reference */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Reference
                        </div>
                        <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                          {settlement.batch_reference}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Type
                        </div>
                        <div className="text-sm text-navy-900 dark:text-white">
                          {settlement.settlement_type === 'CEA_PURCHASE' ? 'CEA Purchase' : 'Swap'}
                        </div>
                        <div className="text-xs text-navy-500 dark:text-navy-400">
                          {settlement.asset_type}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Status
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(
                            settlement.status
                          )}`}
                        >
                          {getStatusIcon(settlement.status)}
                          {getStatusLabel(settlement.status)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-1 md:text-right">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Quantity
                        </div>
                        <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                          {formatQuantity(settlement.quantity)}
                        </div>
                      </div>

                      {/* Value */}
                      <div className="md:col-span-1 md:text-right">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Value
                        </div>
                        <div className="text-sm font-mono font-medium text-navy-900 dark:text-white">
                          {formatCurrency(settlement.total_value_eur, 'EUR')}
                        </div>
                      </div>

                      {/* Expected Date */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-navy-500 dark:text-navy-400 mb-1 md:hidden">
                          Expected
                        </div>
                        <div className="text-sm text-navy-900 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-navy-400" />
                          {daysRemaining === 0
                            ? 'Today'
                            : daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : `${daysRemaining}d`}
                        </div>
                        <div className="text-xs text-navy-500 dark:text-navy-400">
                          {formatDate(settlement.expected_settlement_date)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 md:text-right flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setSelectedSettlement(settlement.id)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          View
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Settlement Details Modal */}
      {selectedSettlement && (
        <SettlementDetails
          settlementId={selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
        />
      )}
    </div>
  );
}
