# Market Maker Fixes and Backoffice Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix Market Maker transaction errors, enhance backoffice with comprehensive logging view, and implement professional order book UI in cash market with admin order placement capabilities.

**Architecture:** Multi-phase approach with immediate bug fixes followed by progressive enhancement of backoffice admin capabilities and cash market UI improvements.

**Tech Stack:** React/TypeScript (Frontend), FastAPI/Python (Backend), PostgreSQL, Redis, Framer Motion, TailwindCSS

---

## CRITICAL BUG FIX (Must Do First)

### Task 1: Fix TransactionForm Enum Case Mismatch

**Problem:** Backend expects uppercase `DEPOSIT`/`WITHDRAWAL`, frontend sends lowercase `deposit`/`withdrawal`

**Files:**
- Modify: `frontend/src/components/backoffice/TransactionForm.tsx:66-70`

**Step 1: Fix transaction_type to uppercase**

```typescript
await createTransaction(marketMakerId, {
  certificate_type: certificateType,
  transaction_type: transactionType.toUpperCase() as 'DEPOSIT' | 'WITHDRAWAL',
  amount: amountNum,
  notes: notes.trim() || undefined,
});
```

**Step 2: Test the fix**

Run: Navigate to http://localhost:5173/backoffice/market-makers → Click MM1 → Balances & Transactions tab → Add Transaction → Enter 100000 CEA Deposit
Expected: Transaction created successfully, balance updates to 100000

**Step 3: Commit**

```bash
git add frontend/src/components/backoffice/TransactionForm.tsx
git commit -m "fix: Convert transaction_type to uppercase for backend enum compatibility

Backend TransactionType enum expects DEPOSIT/WITHDRAWAL (uppercase) but
frontend was sending lowercase values causing 'Invalid transaction_type' errors.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 1: Backoffice Logging View

### Task 2: Create Comprehensive Ticket Logging UI

**Goal:** Admin can view all system tickets/logging with filtering and search

**Files:**
- Create: `frontend/src/pages/BackofficeLoggingPage.tsx`
- Create: `frontend/src/components/backoffice/TicketsList.tsx`
- Create: `frontend/src/components/backoffice/TicketDetailModal.tsx`
- Create: `frontend/src/components/backoffice/TicketFilters.tsx`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/layout/Sidebar.tsx` (add nav link)

**Step 1: Create TicketsList component**

```typescript
// frontend/src/components/backoffice/TicketsList.tsx
import { useState, useEffect } from 'react';
import { DataTable, Badge, type Column } from '../common';
import { getTicketLogs } from '../../services/api';
import { formatRelativeTime } from '../../utils';

interface Ticket {
  id: string;
  ticket_id: string;
  timestamp: string;
  action_type: string;
  entity_type: string;
  status: 'SUCCESS' | 'FAILED';
  user_email?: string;
  market_maker_name?: string;
}

interface TicketsListProps {
  filters: {
    startDate?: string;
    endDate?: string;
    actionType?: string;
    status?: string;
    search?: string;
  };
  onTicketClick: (ticketId: string) => void;
}

export function TicketsList({ filters, onTicketClick }: TicketsListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTickets();
  }, [filters, page]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await getTicketLogs({
        page,
        per_page: 50,
        ...filters,
      });
      setTickets(response.items);
      setTotalPages(Math.ceil(response.total / 50));
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'ticket_id',
      header: 'Ticket ID',
      width: '15%',
      render: (value) => (
        <button
          onClick={() => onTicketClick(value)}
          className="font-mono text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          {value}
        </button>
      ),
    },
    {
      key: 'timestamp',
      header: 'Time',
      width: '15%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300">
          {formatRelativeTime(value)}
        </span>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      width: '15%',
      render: (value) => (
        <Badge variant="info">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity',
      width: '12%',
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      align: 'center',
      render: (value) => (
        <Badge variant={value === 'SUCCESS' ? 'success' : 'danger'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'user_email',
      header: 'User',
      width: '18%',
      render: (value) => value || '-',
    },
    {
      key: 'market_maker_name',
      header: 'Market Maker',
      width: '15%',
      render: (value) => value || '-',
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        loadingRows={10}
        emptyMessage="No tickets found"
        rowKey="id"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-navy-600 dark:text-navy-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create TicketDetailModal component**

```typescript
// frontend/src/components/backoffice/TicketDetailModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { getTicketDetail } from '../../services/api';
import { Badge } from '../common';

interface TicketDetail {
  ticket_id: string;
  timestamp: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  status: 'SUCCESS' | 'FAILED';
  user_email?: string;
  market_maker_name?: string;
  request_payload?: Record<string, any>;
  response_data?: Record<string, any>;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  ip_address?: string;
  tags?: string[];
  related_ticket_ids?: string[];
}

interface TicketDetailModalProps {
  isOpen: boolean;
  ticketId: string;
  onClose: () => void;
}

export function TicketDetailModal({ isOpen, ticketId, onClose }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket();
    }
  }, [isOpen, ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketDetail(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
              <div>
                <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                  Ticket Details
                </h2>
                {ticket && (
                  <p className="text-sm text-navy-500 dark:text-navy-400 mt-1 font-mono">
                    {ticket.ticket_id}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loading && (
                <div className="text-center py-8 text-navy-500">Loading...</div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {ticket && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-navy-700 dark:text-navy-300">
                        Action Type
                      </label>
                      <Badge variant="info" className="mt-1">
                        {ticket.action_type}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-navy-700 dark:text-navy-300">
                        Status
                      </label>
                      <Badge
                        variant={ticket.status === 'SUCCESS' ? 'success' : 'danger'}
                        className="mt-1"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-navy-700 dark:text-navy-300">
                        Entity Type
                      </label>
                      <p className="text-navy-900 dark:text-white">{ticket.entity_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-navy-700 dark:text-navy-300">
                        Timestamp
                      </label>
                      <p className="text-navy-900 dark:text-white">
                        {new Date(ticket.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actor Info */}
                  {(ticket.user_email || ticket.market_maker_name) && (
                    <div>
                      <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                        Actor
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {ticket.user_email && (
                          <div>
                            <label className="text-xs text-navy-500">User</label>
                            <p className="text-navy-900 dark:text-white">{ticket.user_email}</p>
                          </div>
                        )}
                        {ticket.market_maker_name && (
                          <div>
                            <label className="text-xs text-navy-500">Market Maker</label>
                            <p className="text-navy-900 dark:text-white">{ticket.market_maker_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Payload */}
                  {ticket.request_payload && (
                    <div>
                      <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                        Request Payload
                      </h3>
                      <pre className="p-3 bg-navy-50 dark:bg-navy-900 rounded-lg overflow-x-auto text-xs font-mono">
                        {JSON.stringify(ticket.request_payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Before/After State */}
                  {(ticket.before_state || ticket.after_state) && (
                    <div className="grid grid-cols-2 gap-4">
                      {ticket.before_state && (
                        <div>
                          <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                            Before State
                          </h3>
                          <pre className="p-3 bg-navy-50 dark:bg-navy-900 rounded-lg overflow-x-auto text-xs font-mono">
                            {JSON.stringify(ticket.before_state, null, 2)}
                          </pre>
                        </div>
                      )}
                      {ticket.after_state && (
                        <div>
                          <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                            After State
                          </h3>
                          <pre className="p-3 bg-navy-50 dark:bg-navy-900 rounded-lg overflow-x-auto text-xs font-mono">
                            {JSON.stringify(ticket.after_state, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {ticket.tags && ticket.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ticket.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Tickets */}
                  {ticket.related_ticket_ids && ticket.related_ticket_ids.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                        Related Tickets
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ticket.related_ticket_ids.map((relatedId) => (
                          <span
                            key={relatedId}
                            className="font-mono text-sm text-purple-600 dark:text-purple-400"
                          >
                            {relatedId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

**Step 3: Create TicketFilters component**

```typescript
// frontend/src/components/backoffice/TicketFilters.tsx
import { useState } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { Button } from '../common';

interface TicketFiltersProps {
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    actionType?: string;
    status?: string;
    search?: string;
  }) => void;
}

export function TicketFilters({ onFilterChange }: TicketFiltersProps) {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('');
  const [status, setStatus] = useState('');

  const handleApply = () => {
    onFilterChange({
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actionType: actionType || undefined,
      status: status || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setActionType('');
    setStatus('');
    onFilterChange({});
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, action type..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Action Type */}
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
          Action Type
        </label>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Actions</option>
          <option value="MM_CREATED">MM Created</option>
          <option value="MM_UPDATED">MM Updated</option>
          <option value="MM_DELETED">MM Deleted</option>
          <option value="ASSET_DEPOSIT">Asset Deposit</option>
          <option value="ASSET_WITHDRAWAL">Asset Withdrawal</option>
          <option value="MM_ORDER_PLACED">MM Order Placed</option>
          <option value="MM_ORDER_CANCELLED">MM Order Cancelled</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={handleApply} icon={<Filter className="w-4 h-4" />}>
          Apply Filters
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: Create BackofficeLoggingPage**

```typescript
// frontend/src/pages/BackofficeLoggingPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, RefreshCw } from 'lucide-react';
import { Card, Button } from '../components/common';
import { TicketsList } from '../components/backoffice/TicketsList';
import { TicketDetailModal } from '../components/backoffice/TicketDetailModal';
import { TicketFilters } from '../components/backoffice/TicketFilters';

export function BackofficeLoggingPage() {
  const [filters, setFilters] = useState({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
                System Logging
              </h1>
              <p className="text-navy-600 dark:text-navy-300">
                View all system tickets and audit trails
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <div className="col-span-3">
            <TicketFilters onFilterChange={setFilters} />
          </div>

          {/* Tickets List */}
          <div className="col-span-9">
            <motion.div
              key={refreshKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <TicketsList
                  filters={filters}
                  onTicketClick={(ticketId) => setSelectedTicketId(ticketId)}
                />
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicketId && (
          <TicketDetailModal
            isOpen={!!selectedTicketId}
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 5: Add API functions**

Modify: `frontend/src/services/api.ts`

```typescript
// Add to api.ts after line 1160
export const getTicketLogs = async (params: {
  page?: number;
  per_page?: number;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  status?: string;
  search?: string;
}): Promise<{ items: any[]; total: number; page: number; per_page: number }> => {
  const { data } = await api.get('/admin/logging/tickets', { params });
  return data;
};

export const getTicketDetail = async (ticketId: string): Promise<any> => {
  const { data } = await api.get(`/admin/logging/tickets/${ticketId}`);
  return data;
};
```

**Step 6: Add route and navigation**

Modify: `frontend/src/App.tsx`

```typescript
// Add import
import { BackofficeLoggingPage } from './pages/BackofficeLoggingPage';

// Add route in <Routes>
<Route
  path="/backoffice/logging"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <BackofficeLoggingPage />
    </ProtectedRoute>
  }
/>
```

Modify: `frontend/src/components/layout/Sidebar.tsx`

```typescript
// Add to admin menu items (after Market Makers link)
{
  to: '/backoffice/logging',
  icon: <FileText className="w-5 h-5" />,
  label: 'System Logging',
},
```

**Step 7: Test logging page**

Run: Navigate to http://localhost:5173/backoffice/logging
Expected:
- See list of all tickets with filters
- Click on ticket ID opens detail modal
- Filters work correctly
- Pagination works

**Step 8: Commit**

```bash
git add frontend/src/pages/BackofficeLoggingPage.tsx frontend/src/components/backoffice/TicketsList.tsx frontend/src/components/backoffice/TicketDetailModal.tsx frontend/src/components/backoffice/TicketFilters.tsx frontend/src/services/api.ts frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: Add comprehensive system logging page to backoffice

Implements ticket logging UI with:
- Filterable ticket list with pagination
- Detailed ticket modal showing payloads, states, and actor info
- Advanced filters (date range, action type, status, search)
- Navigation link in backoffice sidebar

Admin can now view all system tickets and audit trails with full
before/after state tracking for debugging and compliance.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Professional Order Book UI in Cash Market

### Task 3: Create Full-Width Order Book Component

**Goal:** Replace existing order book with professional full-width layout showing price-priority, time-priority ordering

**Files:**
- Create: `frontend/src/components/cash-market/ProfessionalOrderBook.tsx`
- Modify: `frontend/src/pages/CashMarketPage.tsx`

**Step 1: Create ProfessionalOrderBook component**

```typescript
// frontend/src/components/cash-market/ProfessionalOrderBook.tsx
import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatNumber } from '../../utils';

interface OrderBookLevel {
  price: number;
  quantity: number;
  order_count: number;
  cumulative_quantity: number;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  best_bid: number | null;
  best_ask: number | null;
}

interface ProfessionalOrderBookProps {
  orderBook: OrderBookData;
  onPriceClick?: (price: number, side: 'BUY' | 'SELL') => void;
}

export function ProfessionalOrderBook({ orderBook, onPriceClick }: ProfessionalOrderBookProps) {
  const maxQuantity = useMemo(() => {
    const bidMax = Math.max(...orderBook.bids.map((b) => b.cumulative_quantity), 0);
    const askMax = Math.max(...orderBook.asks.map((a) => a.cumulative_quantity), 0);
    return Math.max(bidMax, askMax);
  }, [orderBook]);

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-navy-200 dark:border-navy-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Order Book</h2>
          {orderBook.best_bid && orderBook.best_ask && (
            <div className="text-sm">
              <span className="text-navy-600 dark:text-navy-400">Spread: </span>
              <span className="font-mono font-semibold text-navy-900 dark:text-white">
                €{orderBook.spread.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 border-b border-navy-200 dark:border-navy-700">
        {/* Bids Header */}
        <div className="px-6 py-3 border-r border-navy-200 dark:border-navy-700">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-navy-600 dark:text-navy-400">
            <div className="text-right">Total (CEA)</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Price (€)</div>
            <div className="text-center">#</div>
          </div>
        </div>

        {/* Asks Header */}
        <div className="px-6 py-3">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-navy-600 dark:text-navy-400">
            <div className="text-center">#</div>
            <div className="text-left">Price (€)</div>
            <div className="text-left">Quantity</div>
            <div className="text-left">Total (CEA)</div>
          </div>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="grid grid-cols-2">
        {/* Bids (Buy Orders) */}
        <div className="border-r border-navy-200 dark:border-navy-700">
          {orderBook.bids.slice(0, 15).map((level, idx) => {
            const depthPercentage = (level.cumulative_quantity / maxQuantity) * 100;
            return (
              <div
                key={`bid-${level.price}-${idx}`}
                className="relative px-6 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors group"
                onClick={() => onPriceClick?.(level.price, 'BUY')}
              >
                {/* Depth Visualization */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all"
                  style={{ width: `${depthPercentage}%` }}
                />

                {/* Values */}
                <div className="relative grid grid-cols-4 gap-2 text-sm">
                  <div className="text-right font-mono text-navy-600 dark:text-navy-400">
                    {formatNumber(level.cumulative_quantity)}
                  </div>
                  <div className="text-right font-mono text-navy-900 dark:text-white">
                    {formatNumber(level.quantity)}
                  </div>
                  <div className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="text-center text-xs text-navy-500 dark:text-navy-500">
                    {level.order_count}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Best Bid Highlight */}
          {orderBook.best_bid && (
            <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-y border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Best Bid
                </span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    €{orderBook.best_bid.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          {/* Best Ask Highlight */}
          {orderBook.best_ask && (
            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-y border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">
                    €{orderBook.best_ask.toFixed(2)}
                  </span>
                </div>
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Best Ask
                </span>
              </div>
            </div>
          )}

          {orderBook.asks.slice(0, 15).map((level, idx) => {
            const depthPercentage = (level.cumulative_quantity / maxQuantity) * 100;
            return (
              <div
                key={`ask-${level.price}-${idx}`}
                className="relative px-6 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors group"
                onClick={() => onPriceClick?.(level.price, 'SELL')}
              >
                {/* Depth Visualization */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-500/10 dark:bg-red-500/20 transition-all"
                  style={{ width: `${depthPercentage}%` }}
                />

                {/* Values */}
                <div className="relative grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center text-xs text-navy-500 dark:text-navy-500">
                    {level.order_count}
                  </div>
                  <div className="text-left font-mono font-semibold text-red-600 dark:text-red-400">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="text-left font-mono text-navy-900 dark:text-white">
                    {formatNumber(level.quantity)}
                  </div>
                  <div className="text-left font-mono text-navy-600 dark:text-navy-400">
                    {formatNumber(level.cumulative_quantity)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Replace order book in CashMarketPage**

Modify: `frontend/src/pages/CashMarketPage.tsx`

```typescript
// Change import
import { ProfessionalOrderBook } from '../components/cash-market/ProfessionalOrderBook';

// Replace existing OrderBook component with:
<ProfessionalOrderBook
  orderBook={orderBook}
  onPriceClick={(price, side) => {
    setOrderType(side);
    setPrice(price.toString());
  }}
/>
```

**Step 3: Test order book**

Run: Navigate to http://localhost:5173/cash-market
Expected:
- Full-width order book with bids on left, asks on right
- Depth visualization bars
- Best bid/ask highlighted
- Click on price fills order form
- Shows order count at each price level
- Cumulative totals displayed

**Step 4: Commit**

```bash
git add frontend/src/components/cash-market/ProfessionalOrderBook.tsx frontend/src/pages/CashMarketPage.tsx
git commit -m "feat: Implement professional full-width order book UI

Replaces existing order book with professional trading interface:
- Bids/asks in side-by-side layout
- Price-priority, time-priority display (FIFO order)
- Depth visualization with colored bars
- Best bid/ask highlighted with icons
- Cumulative quantity columns
- Order count at each price level
- Clickable prices to pre-fill order form

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: User Order Entry Enhancement

### Task 4: Create User Order Entry Modal for Cash Market

**Goal:** Full-width order entry modal above order book for user BUY orders only (Market or Limit)

**Files:**
- Create: `frontend/src/components/cash-market/UserOrderEntryModal.tsx`
- Modify: `frontend/src/pages/CashMarketPage.tsx`

**Step 1: Create UserOrderEntryModal component**

```typescript
// frontend/src/components/cash-market/UserOrderEntryModal.tsx
import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../common';
import { previewMarketOrder } from '../../services/api';
import { cn, formatNumber } from '../../utils';

interface UserOrderEntryModalProps {
  certificateType: 'CEA' | 'EUA';
  availableBalance: number; // EUR balance
  bestAskPrice: number | null;
  onOrderSubmit: (order: {
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    amountEur: number;
  }) => void;
}

export function UserOrderEntryModal({
  certificateType,
  availableBalance,
  bestAskPrice,
  onOrderSubmit,
}: UserOrderEntryModalProps) {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [amountEur, setAmountEur] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-set amount to full balance for market orders
  useEffect(() => {
    if (orderType === 'MARKET') {
      setAmountEur(availableBalance.toFixed(2));
    }
  }, [orderType, availableBalance]);

  // Auto-preview on amount or limit price change
  useEffect(() => {
    if (parseFloat(amountEur) > 0) {
      handlePreview();
    }
  }, [amountEur, limitPrice, orderType]);

  const handlePreview = async () => {
    setError(null);

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError('Please enter a limit price');
      return;
    }

    setPreviewLoading(true);
    try {
      const previewData = await previewMarketOrder({
        certificate_type: certificateType,
        side: 'BUY',
        amount_eur: parseFloat(amountEur),
        order_type: orderType,
        limit_price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
      });
      setPreview(previewData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to preview order');
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = () => {
    onOrderSubmit({
      orderType,
      limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
      amountEur: parseFloat(amountEur),
    });
  };

  const isValid =
    parseFloat(amountEur) > 0 &&
    parseFloat(amountEur) <= availableBalance &&
    (orderType === 'MARKET' || (orderType === 'LIMIT' && parseFloat(limitPrice) > 0)) &&
    preview &&
    preview.can_execute;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-navy-900 dark:to-navy-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            Buy {certificateType} Certificates
          </h3>
          <p className="text-sm text-navy-600 dark:text-navy-400">
            Available Balance: <span className="font-mono font-semibold">€{formatNumber(availableBalance)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Order Type Selection */}
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
            Order Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('MARKET')}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center font-medium',
                orderType === 'MARKET'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                  : 'border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-400 hover:border-navy-300'
              )}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('LIMIT')}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center font-medium',
                orderType === 'LIMIT'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                  : 'border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-400 hover:border-navy-300'
              )}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Limit Price (only for LIMIT orders) */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Limit Price (€) *
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={bestAskPrice ? `Best Ask: €${bestAskPrice.toFixed(2)}` : '0.00'}
              min="0"
              step="0.01"
              className="w-full px-3 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Amount EUR */}
        <div className={orderType === 'MARKET' ? 'col-span-2' : ''}>
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
            Amount (€) *
          </label>
          <div className="relative">
            <input
              type="number"
              value={amountEur}
              onChange={(e) => setAmountEur(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              max={availableBalance}
              className="w-full px-3 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => setAmountEur(availableBalance.toFixed(2))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewLoading && (
        <div className="mt-4 p-4 bg-navy-50 dark:bg-navy-900/50 rounded-lg">
          <p className="text-sm text-navy-600 dark:text-navy-400">Loading preview...</p>
        </div>
      )}

      {preview && !previewLoading && (
        <div className="mt-4 p-4 bg-white dark:bg-navy-900 rounded-lg border border-navy-200 dark:border-navy-700 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-600 dark:text-navy-400">Estimated Quantity:</span>
            <span className="font-mono font-semibold text-navy-900 dark:text-white">
              {formatNumber(preview.total_quantity)} {certificateType}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-600 dark:text-navy-400">Average Price:</span>
            <span className="font-mono font-semibold text-navy-900 dark:text-white">
              €{preview.weighted_avg_price?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-600 dark:text-navy-400">Platform Fee (0.5%):</span>
            <span className="font-mono text-navy-600 dark:text-navy-400">
              €{preview.platform_fee?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-navy-200 dark:border-navy-700">
            <span className="font-medium text-navy-700 dark:text-navy-300">Total Cost:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              €{preview.total_cost_net?.toFixed(2) || '0.00'}
            </span>
          </div>
          {!preview.can_execute && preview.validation_message && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {preview.validation_message}
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid}
          icon={<TrendingUp className="w-5 h-5" />}
          className="w-full py-3 text-lg font-semibold"
        >
          Buy {certificateType} Certificates
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Integrate into CashMarketPage**

Modify: `frontend/src/pages/CashMarketPage.tsx`

```typescript
// Add import
import { UserOrderEntryModal } from '../components/cash-market/UserOrderEntryModal';

// Add above ProfessionalOrderBook component
<UserOrderEntryModal
  certificateType="CEA"
  availableBalance={userBalance.eur_balance}
  bestAskPrice={orderBook.best_ask}
  onOrderSubmit={(order) => {
    // Handle order submission
    handleBuyOrder(order);
  }}
/>

<div className="mt-6">
  <ProfessionalOrderBook ... />
</div>
```

**Step 3: Test user order entry**

Run: Navigate to http://localhost:5173/cash-market
Expected:
- Full-width order entry modal at top
- Market/Limit toggle buttons
- Amount auto-fills to available balance for market orders
- MAX button sets amount to full balance
- Preview updates automatically
- Limit price field only shows for LIMIT orders
- Submit button disabled until valid
- Clear validation messages

**Step 4: Commit**

```bash
git add frontend/src/components/cash-market/UserOrderEntryModal.tsx frontend/src/pages/CashMarketPage.tsx
git commit -m "feat: Add professional user order entry modal for cash market

Implements full-width order entry above order book:
- Market or Limit order type selection
- Amount based on available EUR balance
- MAX button for full balance
- Real-time order preview with fees
- Estimated quantity and average price
- Validation messages
- BUY only (users can only purchase in cash market)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Admin Market Maker Order Placement in Backoffice

### Task 5: Create Admin Order Book with MM Order Placement

**Goal:** Backoffice replica of order book where admin can place BID/ASK orders on behalf of any Market Maker with balance validation

**Files:**
- Create: `frontend/src/components/backoffice/AdminOrderBookSection.tsx`
- Create: `frontend/src/components/backoffice/MMOrderPlacementModal.tsx`
- Create: `frontend/src/pages/BackofficeOrderBookPage.tsx`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/layout/Sidebar.tsx` (add nav link)
- Modify: `backend/app/api/v1/admin_market_orders.py` (add balance validation)

**Step 1: Create MMOrderPlacementModal**

```typescript
// frontend/src/components/backoffice/MMOrderPlacementModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../common';
import { getMarketMakers, getMarketMakerBalances, placeAdminMarketOrder } from '../../services/api';
import { cn, formatNumber } from '../../utils';

interface MMOrderPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  certificateType: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  prefillPrice?: number;
}

export function MMOrderPlacementModal({
  isOpen,
  onClose,
  onSuccess,
  certificateType,
  side,
  prefillPrice,
}: MMOrderPlacementModalProps) {
  const [marketMakers, setMarketMakers] = useState<any[]>([]);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [mmBalances, setMmBalances] = useState<{ cea_balance: number; eua_balance: number } | null>(null);
  const [price, setPrice] = useState(prefillPrice?.toString() || '');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMarketMakers();
      if (prefillPrice) {
        setPrice(prefillPrice.toString());
      }
    }
  }, [isOpen, prefillPrice]);

  useEffect(() => {
    if (selectedMM) {
      loadMMBalances(selectedMM);
    }
  }, [selectedMM]);

  const loadMarketMakers = async () => {
    try {
      const data = await getMarketMakers();
      setMarketMakers(data.filter((mm: any) => mm.is_active));
    } catch (err) {
      console.error('Failed to load market makers:', err);
    }
  };

  const loadMMBalances = async (mmId: string) => {
    try {
      const balances = await getMarketMakerBalances(mmId);
      setMmBalances(balances);
    } catch (err) {
      console.error('Failed to load MM balances:', err);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(quantity);

    if (!selectedMM) {
      setError('Please select a Market Maker');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Balance check for ASK orders (selling - need certificates)
    if (side === 'ASK' && mmBalances) {
      const availableBalance = certificateType === 'CEA' ? mmBalances.cea_balance : mmBalances.eua_balance;
      if (qtyNum > availableBalance) {
        setError(`Insufficient ${certificateType} balance. Available: ${formatNumber(availableBalance)}`);
        return;
      }
    }

    // Balance check for BID orders (buying - need EUR)
    // Note: EUR balance check will be done on backend

    setLoading(true);

    try {
      await placeAdminMarketOrder({
        market_maker_id: selectedMM,
        certificate_type: certificateType,
        side,
        price: priceNum,
        quantity: qtyNum,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const isBuyOrder = side === 'BID';
  const availableBalance = mmBalances
    ? (side === 'ASK'
        ? (certificateType === 'CEA' ? mmBalances.cea_balance : mmBalances.eua_balance)
        : 0) // For BID, EUR balance check is backend responsibility
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-700">
              <div>
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  Place {isBuyOrder ? 'Buy' : 'Sell'} Order
                </h3>
                <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                  {certificateType} - Market Maker Order
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Market Maker Selection */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Market Maker *
                </label>
                <select
                  value={selectedMM}
                  onChange={(e) => setSelectedMM(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Market Maker</option>
                  {marketMakers.map((mm) => (
                    <option key={mm.id} value={mm.id}>
                      {mm.name} ({mm.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance Display */}
              {mmBalances && (
                <div className="p-3 bg-navy-50 dark:bg-navy-900/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-navy-600 dark:text-navy-400">CEA Balance:</span>
                      <span className="font-mono font-semibold text-navy-900 dark:text-white ml-2">
                        {formatNumber(mmBalances.cea_balance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-navy-600 dark:text-navy-400">EUA Balance:</span>
                      <span className="font-mono font-semibold text-navy-900 dark:text-white ml-2">
                        {formatNumber(mmBalances.eua_balance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Side Indicator */}
              <div
                className={cn(
                  'p-3 rounded-lg flex items-center gap-2',
                  isBuyOrder
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                )}
              >
                {isBuyOrder ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={cn(
                    'font-medium',
                    isBuyOrder ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                  )}
                >
                  {isBuyOrder ? 'BID (Buy Order)' : 'ASK (Sell Order)'}
                </span>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Price (€) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Quantity ({certificateType}) *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  max={side === 'ASK' ? availableBalance : undefined}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {side === 'ASK' && mmBalances && (
                  <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                    Available: {formatNumber(availableBalance)} {certificateType}
                  </p>
                )}
              </div>

              {/* Total */}
              {parseFloat(price) > 0 && parseFloat(quantity) > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      Total:
                    </span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      €{(parseFloat(price) * parseFloat(quantity)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200 dark:border-navy-700">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!selectedMM || !price || !quantity || parseFloat(price) <= 0 || parseFloat(quantity) <= 0}
              >
                Place Order
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Create AdminOrderBookSection**

```typescript
// frontend/src/components/backoffice/AdminOrderBookSection.tsx
import { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '../common';
import { ProfessionalOrderBook } from '../cash-market/ProfessionalOrderBook';
import { MMOrderPlacementModal } from './MMOrderPlacementModal';
import { getOrderBook } from '../../services/api';

interface AdminOrderBookSectionProps {
  certificateType: 'CEA' | 'EUA';
}

export function AdminOrderBookSection({ certificateType }: AdminOrderBookSectionProps) {
  const [orderBook, setOrderBook] = useState<any>({
    bids: [],
    asks: [],
    spread: 0,
    best_bid: null,
    best_ask: null,
  });
  const [loading, setLoading] = useState(true);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [orderSide, setOrderSide] = useState<'BID' | 'ASK'>('BID');
  const [prefillPrice, setPrefillPrice] = useState<number | undefined>();

  useEffect(() => {
    loadOrderBook();
    const interval = setInterval(loadOrderBook, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [certificateType]);

  const loadOrderBook = async () => {
    try {
      const data = await getOrderBook(certificateType);
      setOrderBook(data);
    } catch (err) {
      console.error('Failed to load order book:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceClick = (price: number, clickSide: 'BUY' | 'SELL') => {
    // If user clicks on bid (buy), we place a sell (ask) order at that price
    // If user clicks on ask (sell), we place a buy (bid) order at that price
    const side = clickSide === 'BUY' ? 'ASK' : 'BID';
    setOrderSide(side);
    setPrefillPrice(price);
    setShowPlaceOrder(true);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">
          {certificateType} Order Book
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadOrderBook}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              setOrderSide('BID');
              setPrefillPrice(undefined);
              setShowPlaceOrder(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Place BID
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setOrderSide('ASK');
              setPrefillPrice(undefined);
              setShowPlaceOrder(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Place ASK
          </Button>
        </div>
      </div>

      {/* Order Book */}
      {loading ? (
        <div className="text-center py-12 text-navy-500">Loading order book...</div>
      ) : (
        <ProfessionalOrderBook orderBook={orderBook} onPriceClick={handlePriceClick} />
      )}

      {/* Place Order Modal */}
      <MMOrderPlacementModal
        isOpen={showPlaceOrder}
        onClose={() => setShowPlaceOrder(false)}
        onSuccess={() => {
          loadOrderBook();
          // Show success toast
        }}
        certificateType={certificateType}
        side={orderSide}
        prefillPrice={prefillPrice}
      />
    </div>
  );
}
```

**Step 3: Create BackofficeOrderBookPage**

```typescript
// frontend/src/pages/BackofficeOrderBookPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/common';
import { AdminOrderBookSection } from '../components/backoffice/AdminOrderBookSection';

export function BackofficeOrderBookPage() {
  const [certificateType, setCertificateType] = useState<'CEA' | 'EUA'>('CEA');

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
            Market Maker Order Management
          </h1>
          <p className="text-navy-600 dark:text-navy-300">
            Place and manage orders on behalf of Market Makers
          </p>
        </div>

        {/* Certificate Type Toggle */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setCertificateType('CEA')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              certificateType === 'CEA'
                ? 'bg-amber-500 text-white'
                : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400 hover:bg-navy-200 dark:hover:bg-navy-600'
            }`}
          >
            CEA
          </button>
          <button
            onClick={() => setCertificateType('EUA')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              certificateType === 'EUA'
                ? 'bg-blue-500 text-white'
                : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400 hover:bg-navy-200 dark:hover:bg-navy-600'
            }`}
          >
            EUA
          </button>
        </div>

        {/* Order Book Section */}
        <motion.div
          key={certificateType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <AdminOrderBookSection certificateType={certificateType} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
```

**Step 4: Add API function for admin order placement**

Modify: `frontend/src/services/api.ts`

```typescript
// Add after line 1160
export const placeAdminMarketOrder = async (data: {
  market_maker_id: string;
  certificate_type: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
}): Promise<any> => {
  const { data: response } = await api.post('/admin/market-orders', data);
  return response;
};
```

**Step 5: Add route and navigation**

Modify: `frontend/src/App.tsx`

```typescript
// Add import
import { BackofficeOrderBookPage } from './pages/BackofficeOrderBookPage';

// Add route
<Route
  path="/backoffice/order-book"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <BackofficeOrderBookPage />
    </ProtectedRoute>
  }
/>
```

Modify: `frontend/src/components/layout/Sidebar.tsx`

```typescript
// Add to admin menu items (after System Logging link)
{
  to: '/backoffice/order-book',
  icon: <TrendingUp className="w-5 h-5" />,
  label: 'Order Management',
},
```

**Step 6: Test admin order placement**

Run: Navigate to http://localhost:5173/backoffice/order-book
Expected:
- See order book replica
- CEA/EUA toggle buttons
- Place BID/ASK buttons
- Click price in order book opens placement modal
- Market Maker dropdown populated
- Balance displays after MM selection
- Balance validation for ASK orders
- Order submits successfully
- Creates ticket with MM_ORDER_PLACED action

**Step 7: Commit**

```bash
git add frontend/src/components/backoffice/AdminOrderBookSection.tsx frontend/src/components/backoffice/MMOrderPlacementModal.tsx frontend/src/pages/BackofficeOrderBookPage.tsx frontend/src/services/api.ts frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: Add admin order book management for Market Makers

Implements backoffice order placement functionality:
- Replica of cash market order book in backoffice
- Place BID/ASK orders on behalf of any Market Maker
- Market Maker selection with balance display
- Balance validation before order placement (ASK checks certificates)
- Price prefill when clicking order book levels
- CEA/EUA toggle
- Auto-refresh every 5 seconds
- Creates tickets for all order placements

Admin can now manage Market Maker orders with full balance verification.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Testing & Verification

### Task 6: Comprehensive System Testing

**Goal:** Verify all features work correctly end-to-end

**Step 1: Test TransactionForm fix**

Test: Backoffice → Market Makers → Click MM1 → Balances & Transactions → Add Transaction
- Certificate Type: CEA
- Transaction Type: Deposit
- Amount: 100000
- Notes: "Initial balance"
Expected: Transaction created successfully, balance shows 100000 CEA

**Step 2: Test Logging Page**

Test: Backoffice → System Logging
Expected:
- See all tickets with recent ASSET_DEPOSIT ticket
- Filter by action type works
- Click ticket ID opens detail modal
- Before/after states displayed correctly

**Step 3: Test Order Book UI**

Test: Cash Market page
Expected:
- Full-width professional order book
- Bids on left (green), asks on right (red)
- Depth visualization bars
- Best bid/ask highlighted
- Click price prefills order form

**Step 4: Test User Order Entry**

Test: Cash Market page
Expected:
- Order entry modal at top
- Market/Limit toggle
- Amount auto-fills for market orders
- Preview updates automatically
- Validation works correctly
- Order submits successfully

**Step 5: Test Admin Order Placement**

Test: Backoffice → Order Management
Expected:
- See order book replica
- Select Market Maker
- Balance displays correctly
- Place ASK order checks certificate balance
- Place BID order checks EUR balance (backend)
- Order appears in order book after placement
- Ticket created for MM_ORDER_PLACED

**Step 6: Commit test results**

Document any issues found and resolved during testing.

---

## Summary

This plan implements:

1. **Bug Fix**: TransactionForm enum case mismatch (CRITICAL)
2. **Backoffice Logging**: Comprehensive ticket viewing with filters and detail modal
3. **Professional Order Book**: Full-width FIFO display with depth visualization
4. **User Order Entry**: Market/Limit order modal with balance validation
5. **Admin Order Management**: Backoffice order placement for Market Makers with balance checking

All Market Maker operations are logged with ticket IDs. Admin has full visibility into system audit trail. Order book follows price-priority, time-priority (FIFO) ordering. Users can only BUY in cash market. Admin can place both BID and ASK orders on behalf of Market Makers with proper balance validation.
