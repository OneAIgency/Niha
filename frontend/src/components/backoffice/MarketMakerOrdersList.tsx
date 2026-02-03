import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Filter,
  X,
  Leaf,
  Wind,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button, Badge, ConfirmationModal, AlertBanner } from '../common';
import { DataTable, type Column } from '../common/DataTable';
import { getMarketMakerOrders, cancelMarketMakerOrder, getMarketMakers } from '../../services/api';
import type { MarketMakerOrder, CertificateType } from '../../types';
import { formatRelativeTime, cn } from '../../utils';

interface MarketMakerOrdersListProps {
  certificateType?: CertificateType;
}

interface MarketMaker {
  id: string;
  name: string;
}

export function MarketMakerOrdersList({ certificateType }: MarketMakerOrdersListProps) {
  const [orders, setOrders] = useState<MarketMakerOrder[]>([]);
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCertType, setSelectedCertType] = useState<string>(certificateType || '');
  const [showFilters, setShowFilters] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<MarketMakerOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadMarketMakers();
  }, []);

  useEffect(() => {
    loadOrders();

    // Auto-refresh every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMM, selectedStatus, selectedCertType]);

  const loadMarketMakers = async () => {
    try {
      const data = await getMarketMakers();
      setMarketMakers(data);
    } catch (err) {
      console.error('Failed to load market makers:', err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (selectedMM) params.market_maker_id = selectedMM;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCertType) params.certificate_type = selectedCertType;

      const { data } = await getMarketMakerOrders(params);

      // MarketMakerOrder already includes marketMakerName from the API
      setOrders(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to load orders:', err);
      setError(error.response?.data?.detail || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    setCancelling(true);
    try {
      await cancelMarketMakerOrder(cancelOrder.id);
      loadOrders();
      setCancelOrder(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to cancel order:', err);
      setError(error.response?.data?.detail || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Open</Badge>;
      case 'PARTIALLY_FILLED':
        return <Badge variant="info">Partial</Badge>;
      case 'FILLED':
        return <Badge variant="success">Filled</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns: Column<MarketMakerOrder>[] = [
    {
      key: 'marketMakerName',
      header: 'Market Maker',
      render: (value) => (
        <span className="font-medium text-navy-900 dark:text-white">{String(value || 'Unknown')}</span>
      ),
    },
    {
      key: 'certificateType',
      header: 'Certificate',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value === 'CEA' ? (
            <Leaf className="w-4 h-4 text-amber-500" />
          ) : (
            <Wind className="w-4 h-4 text-blue-500" />
          )}
          <span className="font-semibold">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (value) => (
        <div className="flex items-center gap-2">
          <ArrowUpRight className={cn(
            'w-4 h-4',
            value === 'SELL' ? 'text-red-600' : 'text-emerald-600'
          )} />
          <span className={cn(
            'font-semibold',
            value === 'SELL' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          )}>
            {String(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (value) => (
        <span className="font-mono font-semibold text-navy-900 dark:text-white">
          €{typeof value === 'number' ? value.toFixed(2) : Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-navy-700 dark:text-navy-300">
          {typeof value === 'number' ? value.toLocaleString() : Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'filledQuantity',
      header: 'Filled',
      align: 'right',
      render: (value, row) => {
        const filledQty = typeof value === 'number' ? value : Number(value);
        const totalQty = typeof row.quantity === 'number' ? row.quantity : Number(row.quantity);
        const percentage = totalQty > 0 ? ((filledQty / totalQty) * 100).toFixed(0) : '0';
        return (
          <span className="font-mono text-navy-700 dark:text-navy-300">
            {filledQty.toLocaleString()}
            <span className="text-xs text-navy-400 ml-1">
              ({percentage}%)
            </span>
          </span>
        );
      },
    },
    {
      key: 'remainingQuantity',
      header: 'Remaining',
      align: 'right',
      render: (value) => (
        <span className="font-mono text-navy-700 dark:text-navy-300">
          {typeof value === 'number' ? value.toLocaleString() : Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-navy-500 dark:text-navy-400 text-sm">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(typeof value === 'string' ? value : String(value))}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (_value, row) => {
        const canCancel = row.status === 'OPEN' || row.status === 'PARTIALLY_FILLED';
        return canCancel ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancelOrder(row)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <span className="text-navy-300 dark:text-navy-600">-</span>
        );
      },
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white">Market Maker Orders</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadOrders}
            icon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 bg-navy-50 dark:bg-navy-700/50 rounded-lg space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Maker Filter */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Market Maker
              </label>
              <select
                value={selectedMM}
                onChange={(e) => setSelectedMM(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Market Makers</option>
                {marketMakers.map((mm) => (
                  <option key={mm.id} value={mm.id}>
                    {mm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PARTIALLY_FILLED">Partially Filled</option>
                <option value="FILLED">Filled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Market Filter */}
            {!certificateType && (
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Market
                </label>
                <select
                  value={selectedCertType}
                  onChange={(e) => setSelectedCertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Markets</option>
                  <option value="CEA">CEA Cash</option>
                  <option value="EUA">Swap</option>
                </select>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {(selectedMM || selectedStatus || selectedCertType) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMM('');
                  setSelectedStatus('');
                  setSelectedCertType(certificateType || '');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <AlertBanner variant="error" message={error} className="mb-4" />
      )}

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        loadingRows={5}
        emptyMessage="No market maker orders found"
        rowKey="id"
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelOrder}
        onClose={() => setCancelOrder(null)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this market maker order? This action cannot be undone."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        variant="danger"
        details={
          cancelOrder
            ? [
                { label: 'Market Maker', value: cancelOrder.marketMakerName || 'Unknown' },
                { label: 'Type', value: `${cancelOrder.side} ${cancelOrder.certificateType}` },
                { label: 'Price', value: `€${cancelOrder.price.toFixed(2)}` },
                { label: 'Quantity', value: cancelOrder.quantity.toLocaleString() },
                { label: 'Filled', value: cancelOrder.filledQuantity.toLocaleString() },
              ]
            : []
        }
        loading={cancelling}
      />
    </Card>
  );
}
