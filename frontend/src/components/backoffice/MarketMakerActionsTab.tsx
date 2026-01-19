import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Bot } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button } from '../common';
import { getMarketMakerActions } from '../../services/api';
import { TicketDetailModal } from './TicketDetailModal';

interface TicketLog {
  id: string;
  ticket_id: string;
  timestamp: string;
  user_id?: string;
  market_maker_id?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  status: 'SUCCESS' | 'FAILED';
  request_payload?: any;
  response_data?: any;
  ip_address?: string;
  user_agent?: string;
  before_state?: any;
  after_state?: any;
  related_ticket_ids: string[];
  tags: string[];
}

export function MarketMakerActionsTab() {
  const [tickets, setTickets] = useState<TicketLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getMarketMakerActions({ limit, offset });
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch market maker actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [offset]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 10000);
    return () => clearInterval(interval);
  }, [offset]);

  const handleRowClick = (ticket: TicketLog) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const columns: Column<TicketLog>[] = [
    {
      key: 'ticket_id',
      header: 'Ticket ID',
      width: '140px',
      render: (value) => (
        <code className="text-xs font-mono text-navy-900 dark:text-white">
          {value}
        </code>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      render: (value) => (
        <span className="text-xs">
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action_type',
      header: 'Action Type',
      width: '200px',
      render: (value) => (
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
          {value}
        </span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity',
      width: '120px',
      render: (value) => (
        <span className="text-xs text-navy-600 dark:text-navy-400">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (value) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            value === 'SUCCESS'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'market_maker_id',
      header: 'Market Maker ID',
      width: '150px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Bot className="w-3 h-3 text-purple-500" />
          <code className="text-xs font-mono text-purple-600 dark:text-purple-400">
            {value ? value.substring(0, 8) + '...' : '—'}
          </code>
        </div>
      ),
    },
    {
      key: 'user_id',
      header: 'Admin',
      width: '100px',
      render: (value) =>
        value ? (
          <code className="text-xs font-mono text-navy-600 dark:text-navy-400">
            {value.substring(0, 8)}...
          </code>
        ) : (
          <span className="text-xs text-navy-400 dark:text-navy-600">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-900 dark:text-white">
                Market Maker Actions
              </h3>
              <p className="text-xs text-navy-600 dark:text-navy-400">
                All actions involving market makers
              </p>
            </div>
          </div>
          <Button
            onClick={fetchTickets}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <div className="mt-3 text-sm text-navy-600 dark:text-navy-400">
          Showing {tickets.length} of {total.toLocaleString()} market maker actions
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700">
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          onRowClick={handleRowClick}
          rowKey="id"
          emptyMessage="No market maker actions found"
        />
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-navy-600 dark:text-navy-400">
            Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
          </span>
          <Button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}
