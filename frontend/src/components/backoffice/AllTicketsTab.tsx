import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button, AlertBanner } from '../common';
import { getTickets } from '../../services/api';
import { TicketDetailModal } from './TicketDetailModal';

interface TicketLog {
  [key: string]: unknown;
  id: string;
  ticketId: string;
  timestamp: string;
  userId?: string;
  marketMakerId?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  status: 'SUCCESS' | 'FAILED';
  requestPayload?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  relatedTicketIds: string[];
  tags: string[];
}

export function AllTicketsTab() {
  const [tickets, setTickets] = useState<TicketLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit, offset };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (actionTypeFilter) params.action_type = [actionTypeFilter];
      if (entityTypeFilter) params.entity_type = entityTypeFilter;

      const { data } = await getTickets(params);
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, actionTypeFilter, entityTypeFilter, offset]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, actionTypeFilter, entityTypeFilter, offset]);

  const handleRowClick = (ticket: TicketLog) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const columns: Column<TicketLog>[] = [
    {
      key: 'ticketId',
      header: 'Ticket ID',
      width: '140px',
      render: (value) => (
        <code className="text-xs font-mono text-navy-900 dark:text-white">
          {String(value)}
        </code>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      render: (value) => (
        <span className="text-xs">
          {new Date(String(value)).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actionType',
      header: 'Action Type',
      width: '180px',
      render: (value) => (
        <span className="text-xs font-medium text-navy-700 dark:text-navy-300">
          {String(value)}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      width: '120px',
      render: (value) => (
        <span className="text-xs text-navy-600 dark:text-navy-400">
          {String(value)}
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
          {String(value)}
        </span>
      ),
    },
    {
      key: 'userId',
      header: 'User',
      width: '100px',
      render: (value) =>
        value ? (
          <code className="text-xs font-mono text-navy-600 dark:text-navy-400">
            {String(value).substring(0, 8)}...
          </code>
        ) : (
          <span className="text-xs text-navy-400 dark:text-navy-600">—</span>
        ),
    },
    {
      key: 'marketMakerId',
      header: 'MM',
      width: '100px',
      render: (value) =>
        value ? (
          <code className="text-xs font-mono text-navy-600 dark:text-navy-400">
            {String(value).substring(0, 8)}...
          </code>
        ) : (
          <span className="text-xs text-navy-400 dark:text-navy-600">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-navy-800 rounded-lg p-4 border border-navy-200 dark:border-navy-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search ticket ID or tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOffset(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full form-select text-sm"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <input
              type="text"
              placeholder="Action type..."
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <input
              type="text"
              placeholder="Entity type..."
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-navy-600 dark:text-navy-400">
            Showing {tickets.length} of {total.toLocaleString()} tickets
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
      </div>

      {/* Error */}
      {error && (
        <AlertBanner variant="error" message={error} />
      )}

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700">
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          onRowClick={handleRowClick}
          rowKey="id"
          emptyMessage="No tickets found"
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
