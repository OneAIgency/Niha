import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button, AlertBanner } from '../common';
import { getTickets } from '../../services/api';
import { TicketDetailModal } from './TicketDetailModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  // Enriched fields from backend
  userEmail?: string;
  userRole?: string;
  userCompany?: string;
  mmName?: string;
}

// ---------------------------------------------------------------------------
// Action label mapping – human-readable names
// ---------------------------------------------------------------------------
type ActionCategory = 'auth' | 'trading' | 'deposit' | 'withdrawal' | 'kyc' | 'mm' | 'auto_trade' | 'admin' | 'swap' | 'system';

interface ActionMeta {
  label: string;
  category: ActionCategory;
  icon: string; // emoji as compact icon
}

const ACTION_MAP: Record<string, ActionMeta> = {
  USER_LOGIN:                { label: 'Login',              category: 'auth',       icon: '🔑' },
  USER_LOGIN_MAGIC_LINK:     { label: 'Login (Magic Link)', category: 'auth',       icon: '🔗' },
  ORDER_PLACED:              { label: 'Place Order',        category: 'trading',    icon: '📊' },
  ORDER_CANCELLED:           { label: 'Cancel Order',       category: 'trading',    icon: '✕' },
  ORDER_MODIFIED:            { label: 'Modify Order',       category: 'trading',    icon: '✏️' },
  ASSET_TRADE_DEBIT:         { label: 'Trade Debit',        category: 'trading',    icon: '💱' },
  AUTO_TRADE_ORDER_PLACED:   { label: 'Auto Trade',         category: 'auto_trade', icon: '🤖' },
  ENTITY_ASSET_DEPOSIT:      { label: 'Asset Deposit',      category: 'deposit',    icon: '📥' },
  ENTITY_ASSET_WITHDRAWAL:   { label: 'Asset Withdrawal',   category: 'withdrawal', icon: '📤' },
  DEPOSIT_ANNOUNCED:         { label: 'Deposit Alert',      category: 'deposit',    icon: '🔔' },
  DEPOSIT_CONFIRMED:         { label: 'Confirm Deposit',    category: 'admin',      icon: '✓' },
  DEPOSIT_CLEARED:           { label: 'Clear Deposit',      category: 'admin',      icon: '✓✓' },
  KYC_DOCUMENT_UPLOADED:     { label: 'KYC Upload',         category: 'kyc',        icon: '📄' },
  KYC_SUBMITTED:             { label: 'KYC Submitted',      category: 'kyc',        icon: '📋' },
  MM_CREATED:                { label: 'Create MM',          category: 'mm',         icon: '🏦' },
  MM_UPDATED:                { label: 'Update MM',          category: 'mm',         icon: '🏦' },
  MM_DELETED:                { label: 'Delete MM',          category: 'mm',         icon: '🏦' },
  MM_RESET_ALL:              { label: 'Reset All MM',       category: 'mm',         icon: '🏦' },
  MM_EUR_DEPOSIT:            { label: 'MM EUR Deposit',     category: 'mm',         icon: '💰' },
  MM_EUR_WITHDRAWAL:         { label: 'MM EUR Withdrawal',  category: 'mm',         icon: '💸' },
  SWAP_CREATED:              { label: 'Swap',               category: 'swap',       icon: '🔄' },
};

function getActionMeta(actionType: string, tags: string[]): ActionMeta {
  const mapped = ACTION_MAP[actionType];
  if (mapped) return mapped;
  // Fallback: humanize the action type
  const label = actionType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  // Guess category from tags
  let category: ActionCategory = 'system';
  if (tags.includes('admin')) category = 'admin';
  else if (tags.includes('order') || tags.includes('cash_market')) category = 'trading';
  else if (tags.includes('deposit') || tags.includes('funding')) category = 'deposit';
  else if (tags.includes('withdrawal')) category = 'withdrawal';
  else if (tags.includes('market_maker')) category = 'mm';
  else if (tags.includes('kyc')) category = 'kyc';
  else if (tags.includes('auto_trade')) category = 'auto_trade';
  else if (tags.includes('auth')) category = 'auth';
  return { label, category, icon: '•' };
}

// ---------------------------------------------------------------------------
// Category styling
// ---------------------------------------------------------------------------
const CATEGORY_STYLES: Record<ActionCategory, { pill: string; row: string }> = {
  auth:       { pill: 'bg-navy-100 text-navy-700 dark:bg-navy-700 dark:text-navy-300',                           row: '' },
  trading:    { pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',              row: '' },
  deposit:    { pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',                          row: '' },
  withdrawal: { pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',                      row: '' },
  kyc:        { pill: 'bg-navy-50 text-navy-600 dark:bg-navy-700/50 dark:text-navy-300',                           row: '' },
  mm:         { pill: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',                   row: '' },
  auto_trade: { pill: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',                          row: '' },
  admin:      { pill: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700', row: 'bg-violet-50/30 dark:bg-violet-900/10' },
  swap:       { pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',                   row: '' },
  system:     { pill: 'bg-navy-50 text-navy-500 dark:bg-navy-700/50 dark:text-navy-400',                           row: '' },
};

// ---------------------------------------------------------------------------
// Smart detail extraction from payloads
// ---------------------------------------------------------------------------
function extractDetail(ticket: TicketLog): string | null {
  const req = ticket.requestPayload;
  const res = ticket.responseData;
  const at = ticket.actionType;

  // Trading: show side, amount, price, certificate
  if (at === 'ORDER_PLACED' && req) {
    const side = String(req.side || '').toUpperCase();
    const qty = Number(req.quantity || 0).toLocaleString();
    const price = `€${Number(req.price || 0).toFixed(2)}`;
    const cert = String(req.certificate_type || req.certificateType || 'CEA');
    return `${side} ${qty} ${cert} @ ${price}`;
  }

  // Auto trade: show details from response
  if (at === 'AUTO_TRADE_ORDER_PLACED') {
    const side = (ticket.tags.includes('buy') ? 'BUY' : ticket.tags.includes('sell') ? 'SELL' : '');
    if (res) {
      const qty = Number(res.quantity || 0).toLocaleString();
      const price = `€${Number(res.price || 0).toFixed(2)}`;
      const cert = String(res.certificate_type || res.certificateType || 'CEA');
      return `${side} ${qty} ${cert} @ ${price}`;
    }
    if (req) {
      return `${side} · ${String(req.rule_name || req.ruleName || '')}`.trim();
    }
  }

  // Trade debit: show amount and certificate
  if (at === 'ASSET_TRADE_DEBIT' && req) {
    const amt = Math.abs(Number(req.amount || 0)).toLocaleString();
    const cert = String(req.certificate_type || req.certificateType || '');
    return `${amt} ${cert}`;
  }

  // Deposit announced: show amount + currency
  if (at === 'DEPOSIT_ANNOUNCED' && req) {
    const amt = Number(req.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const cur = String(req.currency || 'EUR');
    return `€${amt} ${cur}`;
  }

  // Deposit cleared: show amount
  if (at === 'DEPOSIT_CLEARED' && res) {
    const amt = Number(res.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `€${amt} cleared`;
  }

  // MM EUR deposit/withdrawal
  if ((at === 'MM_EUR_DEPOSIT' || at === 'MM_EUR_WITHDRAWAL') && req) {
    const amt = Number(req.amount || 0).toLocaleString();
    return `€${amt}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Timestamp formatting
// ---------------------------------------------------------------------------
function formatTime(iso: string): { short: string; full: string } {
  // Backend stores naive UTC (no 'Z' suffix) — append it so JS interprets as UTC
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const short = isToday ? time : `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${time}`;
  const full = d.toLocaleString();
  return { short, full };
}

// ---------------------------------------------------------------------------
// Category filter options
// ---------------------------------------------------------------------------
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'auth', label: 'Authentication' },
  { value: 'trading', label: 'Trading' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'kyc', label: 'KYC' },
  { value: 'mm', label: 'Market Makers' },
  { value: 'auto_trade', label: 'Auto Trade' },
  { value: 'admin', label: 'Admin Actions' },
];

// Map category filter to backend action_type values
const CATEGORY_TO_ACTIONS: Record<string, string[]> = {
  auth:       ['USER_LOGIN', 'USER_LOGIN_MAGIC_LINK'],
  trading:    ['ORDER_PLACED', 'ORDER_CANCELLED', 'ORDER_MODIFIED', 'ASSET_TRADE_DEBIT'],
  deposit:    ['ENTITY_ASSET_DEPOSIT', 'DEPOSIT_ANNOUNCED'],
  withdrawal: ['ENTITY_ASSET_WITHDRAWAL'],
  kyc:        ['KYC_DOCUMENT_UPLOADED', 'KYC_SUBMITTED'],
  mm:         ['MM_CREATED', 'MM_UPDATED', 'MM_DELETED', 'MM_RESET_ALL', 'MM_EUR_DEPOSIT', 'MM_EUR_WITHDRAWAL'],
  auto_trade: ['AUTO_TRADE_ORDER_PLACED'],
  admin:      ['DEPOSIT_CONFIRMED', 'DEPOSIT_CLEARED'],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AllTicketsTab() {
  const [tickets, setTickets] = useState<TicketLog[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      // Category filter → map to tag-based filtering
      if (categoryFilter && categoryFilter in CATEGORY_TO_ACTIONS) {
        params.tags = categoryFilter === 'admin' ? 'admin'
          : categoryFilter === 'auth' ? 'auth'
          : categoryFilter === 'trading' ? 'order,cash_market'
          : categoryFilter === 'deposit' ? 'deposit'
          : categoryFilter === 'withdrawal' ? 'withdrawal'
          : categoryFilter === 'kyc' ? 'kyc'
          : categoryFilter === 'mm' ? 'market_maker'
          : categoryFilter === 'auto_trade' ? 'auto_trade'
          : '';
      }

      const { data } = await getTickets(params);
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || data.total_pages || 0);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, categoryFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleRowClick = (ticket: TicketLog) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const columns: Column<TicketLog>[] = [
    // 1. STATUS DOT + TIMESTAMP
    {
      key: 'timestamp',
      header: 'Time',
      width: '100px',
      render: (_value, row) => {
        const { short, full } = formatTime(row.timestamp);
        const isSuccess = row.status === 'SUCCESS';
        return (
          <div className="flex items-center gap-2" title={full}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs text-navy-700 dark:text-navy-300 tabular-nums">{short}</span>
          </div>
        );
      },
    },
    // 2. ACTOR (user name + company + role badge)
    {
      key: 'userEmail',
      header: 'Actor',
      width: '200px',
      render: (_value, row) => {
        const email = row.userEmail;
        const company = row.userCompany;
        const role = row.userRole;
        const mmName = row.mmName;
        const isAdmin = role === 'ADMIN';
        const isMM = !!mmName || role === 'MM';

        if (!email && !mmName) {
          return <span className="text-xs text-navy-400 dark:text-navy-600">System</span>;
        }

        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Role badge */}
              {isAdmin && (
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
                  ADM
                </span>
              )}
              {isMM && !isAdmin && (
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                  MM
                </span>
              )}
              <span className={`text-xs truncate ${isAdmin ? 'text-violet-700 dark:text-violet-400 font-medium' : isMM ? 'text-orange-700 dark:text-orange-400 font-medium' : 'text-navy-900 dark:text-white'}`}>
                {email || 'Unknown'}
              </span>
            </div>
            {(company || mmName) && (
              <span className="text-[10px] text-navy-500 dark:text-navy-500 truncate">
                {mmName ? `⚡ ${mmName}` : company}
              </span>
            )}
          </div>
        );
      },
    },
    // 3. ACTION (human-readable pill with category color)
    {
      key: 'actionType',
      header: 'Action',
      width: '160px',
      render: (_value, row) => {
        const meta = getActionMeta(row.actionType, row.tags || []);
        const isAdminAction = (row.tags || []).includes('admin');
        const style = CATEGORY_STYLES[isAdminAction ? 'admin' : meta.category];

        // For trading, add BUY/SELL context
        let label = meta.label;
        if (row.actionType === 'ORDER_PLACED' && row.requestPayload) {
          const side = String(row.requestPayload.side || '').toUpperCase();
          const cert = String(row.requestPayload.certificate_type || row.requestPayload.certificateType || 'CEA');
          label = `${side} ${cert}`;
        }

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style.pill}`}>
            {label}
          </span>
        );
      },
    },
    // 4. DETAILS (context extracted from payload)
    {
      key: 'requestPayload',
      header: 'Details',
      render: (_value, row) => {
        const detail = extractDetail(row);
        if (!detail) {
          return <span className="text-xs text-navy-400 dark:text-navy-600">—</span>;
        }
        return (
          <span className="text-xs text-navy-700 dark:text-navy-300 font-mono tabular-nums">
            {detail}
          </span>
        );
      },
    },
    // 5. TICKET REF (small, for traceability)
    {
      key: 'ticketId',
      header: 'Ref',
      width: '90px',
      align: 'right',
      render: (value) => (
        <span className="text-[10px] font-mono text-navy-400 dark:text-navy-600" title={String(value)}>
          {String(value).replace('TKT-2026-', '#')}
        </span>
      ),
    },
  ];

  // Row styling: admin actions get subtle violet background
  const getRowClassName = (row: TicketLog) => {
    const isAdminAction = (row.tags || []).includes('admin');
    const meta = getActionMeta(row.actionType, row.tags || []);
    if (isAdminAction) return CATEGORY_STYLES.admin.row;
    return CATEGORY_STYLES[meta.category]?.row || '';
  };

  return (
    <div className="space-y-3">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-navy-800 rounded-lg p-3 border border-navy-200 dark:border-navy-700">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search ticket ID, action, entity..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-1.5 border border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-navy-400" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="form-select text-xs py-1.5 pr-8 border-navy-200 dark:border-navy-700 rounded-lg"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="form-select text-xs py-1.5 pr-8 border-navy-200 dark:border-navy-700 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Refresh */}
          <Button onClick={fetchTickets} variant="secondary" size="sm" className="flex items-center gap-1.5 !py-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs">{total.toLocaleString()}</span>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && <AlertBanner variant="error" message={error} />}

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700 overflow-hidden">
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          onRowClick={handleRowClick}
          rowKey="id"
          emptyMessage="No tickets found"
          variant="compact"
          getRowClassName={getRowClassName}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-navy-500 dark:text-navy-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-navy-200 dark:border-navy-700 disabled:opacity-30 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-navy-600 dark:text-navy-400" />
            </button>
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'text-navy-600 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-navy-200 dark:border-navy-700 disabled:opacity-30 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-navy-600 dark:text-navy-400" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTicket(null); }}
      />
    </div>
  );
}
