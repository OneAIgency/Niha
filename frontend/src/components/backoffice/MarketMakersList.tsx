import { DataTable, Badge, type Column } from '../common';
import { CheckCircle, XCircle, Leaf, Wind, Activity } from 'lucide-react';
import { formatQuantity } from '../../utils';

interface MarketMaker {
  id: string;
  name: string;
  email: string;
  description?: string;
  is_active: boolean;
  cea_balance: number;
  eua_balance: number;
  total_orders: number;
  created_at: string;
  ticket_id?: string;
}

interface MarketMakersListProps {
  marketMakers: MarketMaker[];
  loading: boolean;
  onSelectMM: (mm: MarketMaker) => void;
}

export function MarketMakersList({ marketMakers, loading, onSelectMM }: MarketMakersListProps) {
  const columns: Column<MarketMaker>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (value, row) => (
        <div>
          <div className="font-medium text-navy-900 dark:text-white">{value}</div>
          <div className="text-xs text-navy-500 dark:text-navy-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '12%',
      align: 'center',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Inactive
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'cea_balance',
      header: 'CEA Balance',
      width: '15%',
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-2">
          <Leaf className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-navy-900 dark:text-white">
            {formatQuantity(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'eua_balance',
      header: 'EUA Balance',
      width: '15%',
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-2">
          <Wind className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-navy-900 dark:text-white">
            {formatQuantity(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'total_orders',
      header: 'Total Orders',
      width: '13%',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-navy-400" />
          <span className="font-semibold text-navy-900 dark:text-white">
            {value || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: '25%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300 line-clamp-2">
          {value || '-'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6">
        Market Makers ({marketMakers.length})
      </h2>
      <DataTable
        columns={columns}
        data={marketMakers}
        loading={loading}
        loadingRows={5}
        emptyMessage="No market makers found. Create one to get started."
        onRowClick={(mm) => onSelectMM(mm)}
        rowKey="id"
      />
    </div>
  );
}
