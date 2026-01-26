import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button } from '../common';
import { getFailedActions } from '../../services/api';
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
  request_payload?: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  related_ticket_ids: string[];
  tags: string[];
}

export function FailedActionsTab() {
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
      const { data } = await getFailedActions({ limit, offset });
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to fetch failed actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <code className="text-xs font-mono text-red-900 dark:text-red-100 font-semibold">
          {value}
        </code>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      render: (value) => (
        <span className="text-xs text-red-900 dark:text-red-100">
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action_type',
      header: 'Action Type',
      width: '200px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
          <span className="text-xs font-medium text-red-700 dark:text-red-300">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity',
      width: '120px',
      render: (value) => (
        <span className="text-xs text-red-600 dark:text-red-400">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: () => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          FAILED
        </span>
      ),
    },
    {
      key: 'user_id',
      header: 'User',
      width: '100px',
      render: (value) =>
        value ? (
          <code className="text-xs font-mono text-red-600 dark:text-red-400">
            {value.substring(0, 8)}...
          </code>
        ) : (
          <span className="text-xs text-red-400 dark:text-red-600">—</span>
        ),
    },
    {
      key: 'market_maker_id',
      header: 'MM',
      width: '100px',
      render: (value) =>
        value ? (
          <code className="text-xs font-mono text-red-600 dark:text-red-400">
            {value.substring(0, 8)}...
          </code>
        ) : (
          <span className="text-xs text-red-400 dark:text-red-600">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-900 dark:text-white">
                Failed Actions
              </h3>
              <p className="text-xs text-navy-600 dark:text-navy-400">
                Actions that encountered errors
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
          Showing {tickets.length} of {total.toLocaleString()} failed actions
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {!loading && tickets.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <AlertCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                No Failed Actions
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                All actions completed successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table with red highlighting */}
      {tickets.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-red-200 dark:border-red-800 p-1">
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-red-200 dark:border-red-700">
            <DataTable
              columns={columns}
              data={tickets}
              loading={loading}
              onRowClick={handleRowClick}
              rowKey="id"
              emptyMessage="No failed actions found"
            />
          </div>
        </div>
      )}

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
