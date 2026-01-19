import { useState } from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button } from '../common';
import { getTickets } from '../../services/api';
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

export function SearchTicketsTab() {
  const [tickets, setTickets] = useState<TicketLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search filters
  const [ticketId, setTicketId] = useState('');
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [userId, setUserId] = useState('');
  const [marketMakerId, setMarketMakerId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tags, setTags] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params: any = { limit: 100 };
      if (ticketId) params.search = ticketId;
      if (actionType) params.action_type = [actionType];
      if (entityType) params.entity_type = entityType;
      if (entityId) params.entity_id = entityId;
      if (userId) params.user_id = userId;
      if (marketMakerId) params.market_maker_id = marketMakerId;
      if (status) params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (tags) params.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const { data } = await getTickets(params);
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTicketId('');
    setActionType('');
    setEntityType('');
    setEntityId('');
    setUserId('');
    setMarketMakerId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setTags('');
    setTickets([]);
    setTotal(0);
    setHasSearched(false);
    setError(null);
  };

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
      width: '180px',
      render: (value) => (
        <span className="text-xs font-medium text-navy-700 dark:text-navy-300">
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
  ];

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Advanced Search
            </h3>
            <p className="text-sm text-navy-600 dark:text-navy-400">
              Search tickets using multiple criteria
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ticket ID */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Ticket ID
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="TKT-2026-001234"
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Action Type
            </label>
            <input
              type="text"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              placeholder="MM_CREATED, ORDER_PLACED, etc."
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Entity Type
            </label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="Order, MarketMaker, User, etc."
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Entity ID */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Entity ID (UUID)
            </label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="UUID"
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              User ID (UUID)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID"
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Market Maker ID */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Market Maker ID (UUID)
            </label>
            <input
              type="text"
              value={marketMakerId}
              onChange={(e) => setMarketMakerId(e.target.value)}
              placeholder="UUID"
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="market_maker, order, placement"
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Date From
            </label>
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Date To
            </label>
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-navy-200 dark:border-navy-700">
          <Button onClick={handleClear} variant="secondary">
            Clear
          </Button>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <>
          <div className="text-sm text-navy-600 dark:text-navy-400">
            Found {total.toLocaleString()} results
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700">
            <DataTable
              columns={columns}
              data={tickets}
              loading={loading}
              onRowClick={handleRowClick}
              rowKey="id"
              emptyMessage="No tickets found matching your search criteria"
            />
          </div>
        </>
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
