import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Filter, Shield, Link2, AlertTriangle, WifiOff } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable';
import { Button, AlertBanner } from '../common';
import { getTickets, backofficeRealtimeApi } from '../../services/api';
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
  userFullName?: string;
  mmName?: string;
  // Client-side grouping metadata (added during processing)
  _groupId?: string;
  _isGroupStart?: boolean;
  _isGroupEnd?: boolean;
  _isGroupMiddle?: boolean;
}

// ---------------------------------------------------------------------------
// Action label mapping
// ---------------------------------------------------------------------------
type ActionCategory = 'auth' | 'trading' | 'deposit' | 'withdrawal' | 'kyc' | 'mm' | 'auto_trade' | 'admin' | 'swap' | 'system';

interface ActionMeta {
  label: string;
  category: ActionCategory;
}

const ACTION_MAP: Record<string, ActionMeta> = {
  USER_LOGIN:                { label: 'Login',              category: 'auth' },
  USER_LOGIN_MAGIC_LINK:     { label: 'Magic Link Login',   category: 'auth' },
  ORDER_PLACED:              { label: 'Place Order',        category: 'trading' },
  ORDER_CANCELLED:           { label: 'Cancel Order',       category: 'trading' },
  ORDER_MODIFIED:            { label: 'Modify Order',       category: 'trading' },
  ASSET_TRADE_DEBIT:         { label: 'Trade Debit',        category: 'trading' },
  AUTO_TRADE_ORDER_PLACED:   { label: 'Auto Trade',         category: 'auto_trade' },
  ENTITY_ASSET_DEPOSIT:      { label: 'Asset Deposit',      category: 'deposit' },
  ENTITY_ASSET_WITHDRAWAL:   { label: 'Asset Withdrawal',   category: 'withdrawal' },
  DEPOSIT_ANNOUNCED:         { label: 'Announce Deposit',   category: 'deposit' },
  DEPOSIT_CONFIRMED:         { label: 'Confirm Deposit',    category: 'admin' },
  DEPOSIT_CLEARED:           { label: 'Clear Deposit',      category: 'admin' },
  KYC_DOCUMENT_UPLOADED:     { label: 'KYC Upload',         category: 'kyc' },
  KYC_SUBMITTED:             { label: 'KYC Submit',         category: 'kyc' },
  MM_CREATED:                { label: 'Create MM',          category: 'mm' },
  MM_UPDATED:                { label: 'Update MM',          category: 'mm' },
  MM_DELETED:                { label: 'Delete MM',          category: 'mm' },
  MM_RESET_ALL:              { label: 'Reset All MM',       category: 'mm' },
  MM_EUR_DEPOSIT:            { label: 'MM Deposit',         category: 'mm' },
  MM_EUR_WITHDRAWAL:         { label: 'MM Withdrawal',      category: 'mm' },
  SWAP_CREATED:              { label: 'Swap',               category: 'swap' },
  TRADE_EXECUTED:            { label: 'Trade',              category: 'trading' },
};

function getActionMeta(actionType: string, tags: string[]): ActionMeta {
  const mapped = ACTION_MAP[actionType];
  if (mapped) return mapped;
  const label = actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  let category: ActionCategory = 'system';
  if (tags.includes('admin')) category = 'admin';
  else if (tags.includes('order') || tags.includes('cash_market')) category = 'trading';
  else if (tags.includes('deposit') || tags.includes('funding')) category = 'deposit';
  else if (tags.includes('withdrawal')) category = 'withdrawal';
  else if (tags.includes('market_maker')) category = 'mm';
  else if (tags.includes('kyc')) category = 'kyc';
  else if (tags.includes('auto_trade')) category = 'auto_trade';
  else if (tags.includes('auth')) category = 'auth';
  return { label, category };
}

// ---------------------------------------------------------------------------
// Category styling
// ---------------------------------------------------------------------------
const CATEGORY_STYLES: Record<ActionCategory, { pill: string; row: string }> = {
  auth:       { pill: 'bg-navy-100 text-navy-700 dark:bg-navy-700 dark:text-navy-300', row: '' },
  trading:    { pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', row: '' },
  deposit:    { pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', row: '' },
  withdrawal: { pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', row: '' },
  kyc:        { pill: 'bg-navy-50 text-navy-600 dark:bg-navy-700/50 dark:text-navy-300', row: '' },
  mm:         { pill: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', row: '' },
  auto_trade: { pill: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', row: '' },
  admin:      { pill: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700', row: 'bg-violet-50/30 dark:bg-violet-900/10' },
  swap:       { pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', row: '' },
  system:     { pill: 'bg-navy-50 text-navy-500 dark:bg-navy-700/50 dark:text-navy-400', row: '' },
};

// ---------------------------------------------------------------------------
// Smart extraction helpers: Actor display, Amount, Result
// ---------------------------------------------------------------------------
/** Returns who the action is FOR (the beneficiary/target) + whether admin initiated it + trade side */
function getActorDisplay(ticket: TicketLog): { name: string; adminBadge: boolean; tradeSide?: 'BUY' | 'SELL' } {
  const isAdmin = ticket.userRole === 'ADMIN';
  const at = ticket.actionType;
  const req = ticket.requestPayload;
  const res = ticket.responseData;

  // Extract trade side for trading tickets
  let tradeSide: 'BUY' | 'SELL' | undefined;
  if (at === 'ORDER_PLACED' && req) {
    const side = String(req.side || '').toUpperCase();
    if (side === 'BUY' || side === 'SELL') tradeSide = side;
  } else if (at === 'AUTO_TRADE_ORDER_PLACED') {
    // Check tags first, then response/request
    if ((ticket.tags || []).includes('buy')) tradeSide = 'BUY';
    else if ((ticket.tags || []).includes('sell')) tradeSide = 'SELL';
    else if (req) {
      const side = String(req.side || '').toUpperCase();
      if (side === 'BUY' || side === 'SELL') tradeSide = side;
    }
  } else if (at === 'ASSET_TRADE_DEBIT') {
    // Debit = seller (certificates leaving their account)
    tradeSide = 'SELL';
  } else if (at === 'TRADE_EXECUTED') {
    // Trades don't have a single side — show as a trade
    tradeSide = undefined;
  } else if (at === 'ORDER_CANCELLED' || at === 'ORDER_MODIFIED') {
    // Check tags or response for side
    if ((ticket.tags || []).includes('buy')) tradeSide = 'BUY';
    else if ((ticket.tags || []).includes('sell')) tradeSide = 'SELL';
    else if (res) {
      const side = String(res.side || '').toUpperCase();
      if (side === 'BUY' || side === 'SELL') tradeSide = side;
    }
  }

  // MM target: action is FOR the market maker
  if (ticket.mmName) {
    return { name: ticket.mmName, adminBadge: isAdmin, tradeSide };
  }

  // Admin acting as themselves (login, entity deposit, etc.)
  if (isAdmin) {
    return { name: ticket.userCompany || 'Nihao Group', adminBadge: false, tradeSide };
  }

  // Regular user
  return {
    name: ticket.userCompany || ticket.userFullName || ticket.userEmail || 'Unknown',
    adminBadge: false,
    tradeSide,
  };
}

function extractAmount(ticket: TicketLog): { text: string; isLarge?: boolean } | null {
  const req = ticket.requestPayload;
  const res = ticket.responseData;
  const at = ticket.actionType;

  const fmtNum = (n: number | string, decimals = 2) => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    if (isNaN(num)) return '0';
    return Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Trading orders
  if (at === 'ORDER_PLACED' && req) {
    const qty = fmtNum(req.quantity as number, 0);
    const price = fmtNum(req.price as number);
    const cert = String(req.certificate_type || req.certificateType || 'CEA');
    const side = String(req.side || '').toUpperCase();
    return { text: `${side} ${qty} ${cert} @ \u20AC${price}` };
  }

  // Auto trade
  if (at === 'AUTO_TRADE_ORDER_PLACED' && res) {
    const qty = fmtNum(res.quantity as number, 0);
    const price = fmtNum(res.price as number);
    const cert = String(res.certificate_type || res.certificateType || 'CEA');
    const side = (ticket.tags.includes('buy') ? 'BUY' : ticket.tags.includes('sell') ? 'SELL' : '');
    return { text: `${side} ${qty} ${cert} @ \u20AC${price}` };
  }

  // Trade executed — show quantity, cert, price
  if (at === 'TRADE_EXECUTED' && res) {
    const qty = fmtNum(res.quantity as number, 0);
    const price = fmtNum(res.price as number);
    const cert = String(res.certificate_type || res.certificateType || 'CEA');
    return { text: `${qty} ${cert} @ \u20AC${price}` };
  }

  // Trade debit
  if (at === 'ASSET_TRADE_DEBIT' && req) {
    const amt = fmtNum(req.amount as number, 0);
    const cert = String(req.certificate_type || req.certificateType || '');
    return { text: `${amt} ${cert}` };
  }

  // Deposit announced
  if (at === 'DEPOSIT_ANNOUNCED' && req) {
    const amt = fmtNum(req.amount as number);
    const cur = String(req.currency || 'EUR');
    const isLarge = parseFloat(String(req.amount || 0)) >= 50000;
    return { text: `\u20AC${amt} ${cur}`, isLarge };
  }

  // Deposit confirmed
  if (at === 'DEPOSIT_CONFIRMED' && req) {
    const amt = fmtNum((req.actual_amount || req.actualAmount || 0) as number);
    return { text: `\u20AC${amt}` };
  }

  // Deposit cleared
  if (at === 'DEPOSIT_CLEARED' && res) {
    const amt = fmtNum(res.amount as number);
    return { text: `\u20AC${amt}` };
  }

  // MM EUR deposit/withdrawal
  if ((at === 'MM_EUR_DEPOSIT' || at === 'MM_EUR_WITHDRAWAL') && req) {
    const amt = fmtNum(req.amount as number);
    return { text: `\u20AC${amt}` };
  }

  // Asset deposit/withdrawal (data is in afterState, not requestPayload)
  if (at === 'ENTITY_ASSET_DEPOSIT' || at === 'ENTITY_ASSET_WITHDRAWAL') {
    const src = ticket.afterState || req;
    if (src) {
      const amt = fmtNum(src.amount as number, 0);
      const cert = String(src.asset_type || src.assetType || src.certificate_type || src.certificateType || '');
      return { text: `${amt} ${cert}` };
    }
  }

  // MM created with initial balance
  if (at === 'MM_CREATED' && req && req.initial_eur_balance) {
    const amt = fmtNum(req.initial_eur_balance as number);
    return { text: `\u20AC${amt}` };
  }

  // Order modified → show price change
  if (at === 'ORDER_MODIFIED' && res) {
    const oldP = fmtNum(res.old_price as number);
    const newP = fmtNum(res.new_price as number);
    return { text: `\u20AC${oldP} \u2192 \u20AC${newP}` };
  }

  // KYC upload → file info
  if (at === 'KYC_DOCUMENT_UPLOADED' && req && req.file_name) {
    return { text: String(req.file_name) };
  }

  return null;
}

function extractResult(ticket: TicketLog): { text: string; variant: 'success' | 'info' | 'warning' | 'muted' } | null {
  const res = ticket.responseData;
  const at = ticket.actionType;
  const isFailed = ticket.status === 'FAILED';

  if (isFailed) {
    return { text: 'Failed', variant: 'warning' };
  }

  // Order placed → show order status
  if (at === 'ORDER_PLACED' && res) {
    return { text: String(res.status || 'OPEN'), variant: 'success' };
  }

  // Order cancelled
  if (at === 'ORDER_CANCELLED') {
    return { text: 'Cancelled', variant: 'muted' };
  }

  // Order modified
  if (at === 'ORDER_MODIFIED') {
    return { text: 'Modified', variant: 'info' };
  }

  // Deposit confirmed → hold type
  if (at === 'DEPOSIT_CONFIRMED' && res) {
    const holdType = String(res.hold_type || res.holdType || 'ON_HOLD');
    return { text: holdType.replace(/_/g, ' '), variant: 'info' };
  }

  // Deposit cleared
  if (at === 'DEPOSIT_CLEARED' && res) {
    const upgraded = Number(res.upgraded_users || res.upgradedUsers || 0);
    return { text: upgraded > 0 ? `Cleared +${upgraded} upgraded` : 'Cleared', variant: 'success' };
  }

  // Auto trade
  if (at === 'AUTO_TRADE_ORDER_PLACED') {
    return { text: 'Placed', variant: 'success' };
  }

  // MM created
  if (at === 'MM_CREATED') return { text: 'Created', variant: 'success' };
  if (at === 'MM_DELETED') return { text: 'Deleted', variant: 'warning' };
  if (at === 'MM_UPDATED') return { text: 'Updated', variant: 'info' };
  if (at === 'MM_RESET_ALL') return { text: 'All Reset', variant: 'warning' };

  // Login
  if (at === 'USER_LOGIN' || at === 'USER_LOGIN_MAGIC_LINK') return { text: 'OK', variant: 'muted' };

  // KYC
  if (at === 'KYC_SUBMITTED') return { text: 'Submitted', variant: 'info' };
  if (at === 'KYC_DOCUMENT_UPLOADED') return { text: 'Uploaded', variant: 'muted' };

  // Trade executed
  if (at === 'TRADE_EXECUTED') return { text: 'Filled', variant: 'success' };

  // Trade debit
  if (at === 'ASSET_TRADE_DEBIT') return { text: 'Debited', variant: 'muted' };

  // Deposits/withdrawals
  if (at === 'DEPOSIT_ANNOUNCED') return { text: 'Announced', variant: 'info' };
  if (at === 'MM_EUR_DEPOSIT') return { text: 'Credited', variant: 'success' };
  if (at === 'MM_EUR_WITHDRAWAL') return { text: 'Withdrawn', variant: 'muted' };
  if (at === 'ENTITY_ASSET_DEPOSIT') return { text: 'Deposited', variant: 'success' };
  if (at === 'ENTITY_ASSET_WITHDRAWAL') return { text: 'Withdrawn', variant: 'muted' };

  return null;
}

const RESULT_STYLES = {
  success: 'text-emerald-700 dark:text-emerald-400',
  info:    'text-blue-700 dark:text-blue-400',
  warning: 'text-red-600 dark:text-red-400 font-semibold',
  muted:   'text-navy-500 dark:text-navy-500',
};

// ---------------------------------------------------------------------------
// Timestamp formatting
// ---------------------------------------------------------------------------
function formatTime(iso: string): { short: string; full: string; relative: string } {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const isToday = d.toDateString() === now.toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const short = isToday ? time : `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${time}`;
  const full = d.toLocaleString();

  let relative: string;
  if (diffMin < 1) relative = 'just now';
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffMin < 1440) relative = `${Math.floor(diffMin / 60)}h ago`;
  else relative = `${Math.floor(diffMin / 1440)}d ago`;

  return { short, full, relative };
}

// ---------------------------------------------------------------------------
// Visual grouping: detect related tickets
// ---------------------------------------------------------------------------
function annotateGroups(tickets: TicketLog[]): TicketLog[] {
  // Build a map of ticketId → index for quick lookup
  const idxMap = new Map<string, number>();
  tickets.forEach((t, i) => idxMap.set(t.ticketId, i));

  // Build groups: sets of tickets that reference each other
  const visited = new Set<number>();
  const groups: number[][] = [];

  for (let i = 0; i < tickets.length; i++) {
    if (visited.has(i)) continue;
    const related = (tickets[i].relatedTicketIds || [])
      .map((rid) => idxMap.get(rid))
      .filter((idx): idx is number => idx !== undefined && !visited.has(idx));

    if (related.length === 0) continue;

    // Group = this ticket + all related that are on this page
    const group = [i, ...related].sort((a, b) => a - b);
    // Only form a group if members are consecutive (or nearly so — within 3 rows)
    const isConsecutive = group[group.length - 1] - group[0] <= group.length + 1;
    if (!isConsecutive) continue;

    groups.push(group);
    group.forEach((idx) => visited.add(idx));
  }

  // Annotate tickets with group metadata
  const result = tickets.map((t) => ({ ...t }));
  for (const group of groups) {
    const groupId = result[group[0]].ticketId;
    for (let gi = 0; gi < group.length; gi++) {
      const idx = group[gi];
      result[idx]._groupId = groupId;
      result[idx]._isGroupStart = gi === 0;
      result[idx]._isGroupEnd = gi === group.length - 1;
      result[idx]._isGroupMiddle = gi > 0 && gi < group.length - 1;
    }
  }

  return result;
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

const CATEGORY_TO_TAGS: Record<string, string> = {
  auth: 'auth',
  trading: 'order,cash_market',
  deposit: 'deposit',
  withdrawal: 'withdrawal',
  kyc: 'kyc',
  mm: 'market_maker',
  auto_trade: 'auto_trade',
  admin: 'admin',
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
  const [wsConnected, setWsConnected] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pageRef = useRef(page);
  pageRef.current = page;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter && categoryFilter in CATEGORY_TO_TAGS) {
        params.tags = CATEGORY_TO_TAGS[categoryFilter];
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

  // Stable ref for fetchTickets so WS handler doesn't cause reconnections
  const fetchTicketsRef = useRef(fetchTickets);
  fetchTicketsRef.current = fetchTickets;

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // WebSocket connection for live streaming updates
  useEffect(() => {
    mountedRef.current = true;
    const RECONNECT_DELAY = 3000;

    const connect = () => {
      if (!mountedRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      wsRef.current = backofficeRealtimeApi.connectWebSocket(
        (message) => {
          if (!mountedRef.current) return;
          if (message.type === 'newTicket' || message.type === 'new_ticket') {
            // On page 1 with no filters, immediately re-fetch to show new ticket
            if (pageRef.current === 1) {
              fetchTicketsRef.current();
            } else {
              // Update total count indicator so user knows there are new tickets
              setTotal((prev) => prev + 1);
            }
          }
        },
        () => {
          if (mountedRef.current) {
            setWsConnected(true);
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          }
        },
        () => {
          if (mountedRef.current) {
            setWsConnected(false);
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
          }
        },
        () => {
          if (mountedRef.current) setWsConnected(false);
        },
      );
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.onmessage = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // Annotate tickets with group info
  const annotatedTickets = useMemo(() => annotateGroups(tickets), [tickets]);

  const handleRowClick = (ticket: TicketLog) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Column definitions — 7 columns
  // ---------------------------------------------------------------------------
  const columns: Column<TicketLog>[] = [
    // 1. TIME — status dot + timestamp + relative
    {
      key: 'timestamp',
      header: 'Time',
      width: '110px',
      render: (_value, row) => {
        const { short, full, relative } = formatTime(row.timestamp);
        const isFailed = row.status === 'FAILED';
        const isGrouped = !!row._groupId;
        return (
          <div className="flex items-center gap-2" title={full}>
            <div className="relative flex-shrink-0">
              {/* Group connector line */}
              {isGrouped && !row._isGroupStart && (
                <span className="absolute -top-3 left-[3px] w-px h-3 bg-blue-400/40 dark:bg-blue-500/30" />
              )}
              {isGrouped && !row._isGroupEnd && (
                <span className="absolute -bottom-3 left-[3px] w-px h-3 bg-blue-400/40 dark:bg-blue-500/30" />
              )}
              <span className={`block w-[7px] h-[7px] rounded-full ${isFailed ? 'bg-red-500 ring-2 ring-red-500/20' : 'bg-emerald-500'}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-navy-700 dark:text-navy-300 tabular-nums leading-tight">{short}</span>
              <span className="text-[10px] text-navy-400 dark:text-navy-600 leading-tight">{relative}</span>
            </div>
          </div>
        );
      },
    },
    // 2. ACTOR — FOR WHOM the action was initiated + BUY/SELL badge for trades
    {
      key: 'userEmail',
      header: 'Actor',
      width: '200px',
      render: (_value, row) => {
        // Special display for TRADE_EXECUTED — show both counterparties
        if (row.actionType === 'TRADE_EXECUTED') {
          const req = row.requestPayload;
          const aggressorSide = req?.aggressor_side || req?.aggressorSide || '';
          return (
            <div className="flex items-center gap-1 min-w-0">
              <span className="flex-shrink-0 px-1.5 py-px rounded text-[9px] font-bold leading-tight bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                TRADE
              </span>
              <span className="text-xs font-medium text-navy-700 dark:text-navy-300 truncate" title={`Aggressor: ${aggressorSide}`}>
                {row.mmName || row.userCompany || 'Market'}
              </span>
              {aggressorSide && (
                <span className="text-[9px] text-navy-400 dark:text-navy-500 flex-shrink-0" title={`${aggressorSide} was the aggressor (taker)`}>
                  ({aggressorSide === 'BUY' ? 'buyer took' : 'seller took'})
                </span>
              )}
            </div>
          );
        }

        const { name, adminBadge, tradeSide } = getActorDisplay(row);
        const isMM = !!row.mmName || row.userRole === 'MM';

        return (
          <div className={`flex items-center gap-1.5 min-w-0 ${adminBadge ? 'pl-1 py-0.5 rounded bg-violet-50/60 dark:bg-violet-900/15' : ''}`}>
            {tradeSide && (
              <span className={`flex-shrink-0 px-1.5 py-px rounded text-[9px] font-bold leading-tight ${
                tradeSide === 'BUY'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {tradeSide}
              </span>
            )}
            {adminBadge && (
              <span title="Admin initiated" className="flex items-center justify-center w-4 h-4 rounded flex-shrink-0 bg-violet-100 dark:bg-violet-900/40">
                <Shield className="w-2.5 h-2.5 text-violet-500 dark:text-violet-400" />
              </span>
            )}
            {isMM && !tradeSide && (
              <span className="flex-shrink-0 px-1 py-px rounded text-[9px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 leading-tight">
                MM
              </span>
            )}
            <span className={`text-xs font-medium truncate ${isMM ? 'text-orange-700 dark:text-orange-400' : 'text-navy-900 dark:text-white'}`}>
              {name}
            </span>
          </div>
        );
      },
    },
    // 3. ACTION — colored pill
    {
      key: 'actionType',
      header: 'Action',
      width: '140px',
      render: (_value, row) => {
        const meta = getActionMeta(row.actionType, row.tags || []);
        const isAdminAction = (row.tags || []).includes('admin');
        const style = CATEGORY_STYLES[isAdminAction ? 'admin' : meta.category];
        const isGroupChild = row._groupId && !row._isGroupStart;

        return (
          <div className="flex items-center gap-1.5">
            {isGroupChild && (
              <span title="Related action"><Link2 className="w-3 h-3 flex-shrink-0 text-blue-400/50 dark:text-blue-500/40" /></span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${style.pill}`}>
              {meta.label}
            </span>
          </div>
        );
      },
    },
    // 4. DETAILS — monetary / quantity values
    {
      key: 'requestPayload',
      header: 'Details',
      width: '200px',
      render: (_value, row) => {
        const amount = extractAmount(row);
        if (!amount) return <span className="text-[11px] text-navy-400 dark:text-navy-600">&mdash;</span>;
        return (
          <span className={`text-[11px] font-mono tabular-nums ${amount.isLarge ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-navy-700 dark:text-navy-300'}`}>
            {amount.text}
          </span>
        );
      },
    },
    // 5. RESULT — outcome
    {
      key: 'status',
      header: 'Result',
      width: '110px',
      align: 'center',
      render: (_value, row) => {
        const result = extractResult(row);
        if (!result) return <span className="text-[11px] text-navy-400 dark:text-navy-600">&mdash;</span>;
        return (
          <span className={`text-[11px] font-medium ${RESULT_STYLES[result.variant]}`}>
            {result.variant === 'warning' && <AlertTriangle className="inline w-3 h-3 mr-0.5 -mt-px" />}
            {result.text}
          </span>
        );
      },
    },
    // 6. TICKET REF
    {
      key: 'ticketId',
      header: 'Ref',
      width: '80px',
      align: 'right',
      render: (value) => (
        <span className="text-[10px] font-mono text-navy-400 dark:text-navy-600" title={String(value)}>
          {String(value).replace('TKT-2026-', '#')}
        </span>
      ),
    },
  ];

  // Row styling
  const getRowClassName = (row: TicketLog) => {
    const classes: string[] = [];
    const isFailed = row.status === 'FAILED';
    const isAdminAction = (row.tags || []).includes('admin');
    const meta = getActionMeta(row.actionType, row.tags || []);

    // Failed rows get red tint
    if (isFailed) {
      classes.push('bg-red-50/40 dark:bg-red-900/10 border-l-2 border-l-red-500');
    }
    // Admin rows get violet tint
    else if (isAdminAction) {
      classes.push(CATEGORY_STYLES.admin.row);
    }
    // Category-specific row styling
    else if (CATEGORY_STYLES[meta.category]?.row) {
      classes.push(CATEGORY_STYLES[meta.category].row);
    }

    // Grouped rows get subtle left border
    if (row._groupId && !isFailed) {
      classes.push('border-l-2 border-l-blue-400/30 dark:border-l-blue-500/20');
    }

    return classes.join(' ');
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

          {/* Live indicator + Refresh + count */}
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400" title="Live streaming via WebSocket">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-navy-400 dark:text-navy-500" title="WebSocket disconnected — reconnecting...">
                <WifiOff className="w-3 h-3" />
              </span>
            )}
            <Button onClick={fetchTickets} variant="secondary" size="sm" className="flex items-center gap-1.5 !py-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">{total.toLocaleString()}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <AlertBanner variant="error" message={error} />}

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700 overflow-hidden">
        <DataTable
          columns={columns}
          data={annotatedTickets}
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
            Page {page} of {totalPages} &middot; {total.toLocaleString()} total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-navy-200 dark:border-navy-700 disabled:opacity-30 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-navy-600 dark:text-navy-400" />
            </button>
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
