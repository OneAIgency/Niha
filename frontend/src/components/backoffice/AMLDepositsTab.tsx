/**
 * AML Deposits Tab Component
 *
 * Complete deposit lifecycle management with AML hold support:
 * - Pending deposits awaiting confirmation
 * - On-hold deposits with countdown
 * - Clear/reject functionality
 * - Statistics dashboard
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Timer,
  DollarSign,
  X,
  RefreshCw,
  Ban,
  Eye,
} from 'lucide-react';
import { Button, Card, Badge, ClientStatusBadge } from '../common';
import { formatCurrency, formatRelativeTime } from '../../utils';
import { backofficeApi } from '../../services/api';
import type {
  Deposit,
  DepositStats,
  ConfirmDepositRequest,
  ClearDepositRequest,
  RejectDepositRequest,
  RejectionReason,
} from '../../types';

type TabType = 'pending' | 'on_hold' | 'stats';

const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: 'WIRE_NOT_RECEIVED', label: 'Wire Not Received' },
  { value: 'AMOUNT_MISMATCH', label: 'Amount Mismatch' },
  { value: 'SOURCE_VERIFICATION_FAILED', label: 'Source Verification Failed' },
  { value: 'AML_FLAG', label: 'AML Flag' },
  { value: 'SANCTIONS_HIT', label: 'Sanctions Hit' },
  { value: 'SUSPICIOUS_ACTIVITY', label: 'Suspicious Activity' },
  { value: 'OTHER', label: 'Other' },
];

export function AMLDepositsTab() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [onHoldDeposits, setOnHoldDeposits] = useState<Deposit[]>([]);
  const [stats, setStats] = useState<DepositStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<Deposit | null>(null);
  const [clearModal, setClearModal] = useState<Deposit | null>(null);
  const [rejectModal, setRejectModal] = useState<Deposit | null>(null);
  const [detailModal, setDetailModal] = useState<Deposit | null>(null);

  // Form states
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmCurrency, setConfirmCurrency] = useState('EUR');
  const [wireReference, setWireReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [forceClear, setForceClear] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectionReason>('WIRE_NOT_RECEIVED');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, onHoldRes, statsRes] = await Promise.all([
        backofficeApi.getPendingDepositsAML(),
        backofficeApi.getOnHoldDeposits({ include_expired: true }),
        backofficeApi.getDepositStats(),
      ]);
      setPendingDeposits(pendingRes.deposits);
      setOnHoldDeposits(onHoldRes.deposits);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to fetch AML data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!confirmModal) return;
    const amount = parseFloat(confirmAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setActionLoading(`confirm-${confirmModal.id}`);
      setError(null);
      const request: ConfirmDepositRequest = {
        actual_amount: amount,
        actual_currency: confirmCurrency as 'EUR' | 'USD' | 'CNY' | 'HKD',
        wire_reference: wireReference || undefined,
        admin_notes: adminNotes || undefined,
      };
      await backofficeApi.confirmDepositAML(confirmModal.id, request);
      setConfirmModal(null);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to confirm deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearDeposit = async () => {
    if (!clearModal) return;

    try {
      setActionLoading(`clear-${clearModal.id}`);
      setError(null);
      const request: ClearDepositRequest = {
        admin_notes: adminNotes || undefined,
        force_clear: forceClear,
      };
      await backofficeApi.clearDeposit(clearModal.id, request);
      setClearModal(null);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to clear deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectModal) return;

    try {
      setActionLoading(`reject-${rejectModal.id}`);
      setError(null);
      const request: RejectDepositRequest = {
        reason: rejectReason,
        admin_notes: adminNotes || undefined,
      };
      await backofficeApi.rejectDepositAML(rejectModal.id, request);
      setRejectModal(null);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to reject deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessExpiredHolds = async () => {
    try {
      setActionLoading('process-expired');
      await backofficeApi.processExpiredHolds();
      await fetchData();
    } catch (err) {
      console.error('Failed to process expired holds:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setConfirmAmount('');
    setConfirmCurrency('EUR');
    setWireReference('');
    setAdminNotes('');
    setForceClear(false);
    setRejectReason('WIRE_NOT_RECEIVED');
    setError(null);
  };

  const getHoldTimeRemaining = (expiresAt: string | undefined): string => {
    if (!expiresAt) return 'Unknown';
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  };

  const isHoldExpired = (expiresAt: string | undefined): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  const getHoldTypeBadge = (holdType: string | undefined) => {
    switch (holdType) {
      case 'FIRST_DEPOSIT':
        return <Badge variant="warning">First Deposit</Badge>;
      case 'LARGE_AMOUNT':
        return <Badge variant="danger">Large Amount</Badge>;
      case 'SUBSEQUENT':
        return <Badge variant="info">Subsequent</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-navy-500 dark:text-navy-400">Pending</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">{stats.pending_count}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-navy-500 dark:text-navy-400">On Hold</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">{stats.on_hold_count}</p>
                <p className="text-xs text-navy-400">{formatCurrency(stats.on_hold_total)} EUR</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-navy-500 dark:text-navy-400">Cleared</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">{stats.cleared_count}</p>
                <p className="text-xs text-navy-400">{formatCurrency(stats.cleared_total)} EUR</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-navy-500 dark:text-navy-400">Expired Holds</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">{stats.expired_holds_count}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-navy-200 dark:border-navy-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          Pending ({pendingDeposits.length})
        </button>
        <button
          onClick={() => setActiveTab('on_hold')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'on_hold'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
          }`}
        >
          On Hold ({onHoldDeposits.length})
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {stats && stats.expired_holds_count > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleProcessExpiredHolds}
              loading={actionLoading === 'process-expired'}
            >
              <Timer className="w-4 h-4" />
              Process Expired Holds ({stats.expired_holds_count})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-navy-400 mx-auto" />
          <p className="text-navy-500 mt-2">Loading deposits...</p>
        </Card>
      ) : activeTab === 'pending' ? (
        <Card>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Pending Deposits
          </h3>

          {pendingDeposits.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="text-navy-500">No pending deposits</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-navy-900 dark:text-white">
                          {deposit.entity_name || 'Unknown Entity'}
                        </h4>
                        <ClientStatusBadge role={deposit.user_role ?? deposit.userRole} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-navy-500">Reported:</span>
                          <span className="ml-2 font-medium text-navy-900 dark:text-white">
                            {deposit.reported_amount ? formatCurrency(deposit.reported_amount) : 'N/A'} {deposit.reported_currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-navy-500">User:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-300">{deposit.user_email}</span>
                        </div>
                        {deposit.source_bank && (
                          <div>
                            <span className="text-navy-500">Bank:</span>
                            <span className="ml-2 text-navy-700 dark:text-navy-300">{deposit.source_bank}</span>
                          </div>
                        )}
                        {deposit.source_iban && (
                          <div>
                            <span className="text-navy-500">IBAN:</span>
                            <span className="ml-2 font-mono text-xs text-navy-700 dark:text-navy-300">{deposit.source_iban}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-navy-400 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reported {formatRelativeTime(deposit.reported_at || deposit.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailModal(deposit)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectModal(deposit);
                          resetForm();
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setConfirmModal(deposit);
                          setConfirmAmount(deposit.reported_amount?.toString() || '');
                          setConfirmCurrency(deposit.reported_currency || 'EUR');
                          resetForm();
                        }}
                      >
                        <DollarSign className="w-4 h-4" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            On Hold Deposits
          </h3>

          {onHoldDeposits.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-navy-500">No deposits on hold</p>
            </div>
          ) : (
            <div className="space-y-4">
              {onHoldDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className={`p-4 rounded-xl ${
                    isHoldExpired(deposit.hold_expires_at)
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : 'bg-navy-50 dark:bg-navy-700/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-navy-900 dark:text-white">
                          {deposit.entity_name || 'Unknown Entity'}
                        </h4>
                        {getHoldTypeBadge(deposit.hold_type)}
                        {isHoldExpired(deposit.hold_expires_at) && (
                          <Badge variant="danger">EXPIRED</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-navy-500">Amount:</span>
                          <span className="ml-2 font-medium text-navy-900 dark:text-white">
                            {deposit.amount ? formatCurrency(deposit.amount) : 'N/A'} {deposit.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-navy-500">Hold:</span>
                          <span className={`ml-2 font-medium ${
                            isHoldExpired(deposit.hold_expires_at)
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-navy-900 dark:text-white'
                          }`}>
                            {deposit.hold_days_required} days - {getHoldTimeRemaining(deposit.hold_expires_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-navy-500">Wire Ref:</span>
                          <span className="ml-2 font-mono text-xs">{deposit.wire_reference || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-navy-500">Confirmed:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-300">
                            {formatRelativeTime(deposit.confirmed_at || deposit.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailModal(deposit)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectModal(deposit);
                          resetForm();
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Ban className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setClearModal(deposit);
                          setForceClear(!isHoldExpired(deposit.hold_expires_at));
                          resetForm();
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <Modal
          title="Confirm Deposit Receipt"
          onClose={() => {
            setConfirmModal(null);
            resetForm();
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
              <p className="text-sm text-navy-500">Entity</p>
              <p className="font-semibold text-navy-900 dark:text-white">{confirmModal.entity_name}</p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">Reported by Client</p>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {confirmModal.reported_amount ? formatCurrency(confirmModal.reported_amount) : 'N/A'} {confirmModal.reported_currency}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Actual Amount Received *
              </label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Currency
              </label>
              <select
                value={confirmCurrency}
                onChange={(e) => setConfirmCurrency(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="HKD">HKD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Wire Reference
              </label>
              <input
                type="text"
                value={wireReference}
                onChange={(e) => setWireReference(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
                placeholder="Bank wire reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white resize-none"
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Deposit will be placed on AML hold after confirmation
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmDeposit}
                loading={actionLoading === `confirm-${confirmModal.id}`}
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Start Hold
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Modal */}
      {clearModal && (
        <Modal
          title="Clear Deposit"
          onClose={() => {
            setClearModal(null);
            resetForm();
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
              <p className="text-sm text-navy-500">Entity</p>
              <p className="font-semibold text-navy-900 dark:text-white">{clearModal.entity_name}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {clearModal.amount ? formatCurrency(clearModal.amount) : 'N/A'} {clearModal.currency}
              </p>
            </div>

            {!isHoldExpired(clearModal.hold_expires_at) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Hold period has not expired yet
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Expires: {getHoldTimeRemaining(clearModal.hold_expires_at)}
                </p>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={forceClear}
                    onChange={(e) => setForceClear(e.target.checked)}
                    className="rounded border-amber-300"
                  />
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    Force clear before hold expires
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white resize-none"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm">
              <p className="text-emerald-700 dark:text-emerald-300">
                Clearing will credit funds to entity balance and upgrade users to FUNDED status.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setClearModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleClearDeposit}
                loading={actionLoading === `clear-${clearModal.id}`}
                disabled={!isHoldExpired(clearModal.hold_expires_at) && !forceClear}
              >
                <CheckCircle className="w-4 h-4" />
                Clear Deposit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal
          title="Reject Deposit"
          onClose={() => {
            setRejectModal(null);
            resetForm();
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
              <p className="text-sm text-navy-500">Entity</p>
              <p className="font-semibold text-navy-900 dark:text-white">{rejectModal.entity_name}</p>
              <p className="text-lg font-bold text-navy-600 dark:text-navy-400 mt-1">
                {(rejectModal.amount || rejectModal.reported_amount) ?
                  formatCurrency(rejectModal.amount || rejectModal.reported_amount!) : 'N/A'
                } {rejectModal.currency || rejectModal.reported_currency}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Rejection Reason *
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value as RejectionReason)}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white resize-none"
                placeholder="Provide details for the rejection..."
              />
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
              <p className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                This action cannot be undone
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20"
                onClick={handleRejectDeposit}
                loading={actionLoading === `reject-${rejectModal.id}`}
              >
                <XCircle className="w-4 h-4" />
                Reject Deposit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal
          title="Deposit Details"
          onClose={() => setDetailModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-navy-500">Entity</p>
                <p className="font-medium text-navy-900 dark:text-white">{detailModal.entity_name}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">User</p>
                <p className="font-medium text-navy-900 dark:text-white">{detailModal.user_email}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Status</p>
                <Badge variant={
                  detailModal.status === 'cleared' ? 'success' :
                  detailModal.status === 'rejected' ? 'danger' :
                  detailModal.status === 'on_hold' ? 'info' : 'warning'
                }>
                  {detailModal.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-navy-500">AML Status</p>
                <p className="font-medium text-navy-900 dark:text-white">{detailModal.aml_status}</p>
              </div>
            </div>

            <hr className="border-navy-200 dark:border-navy-700" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-navy-500">Reported Amount</p>
                <p className="font-medium text-navy-900 dark:text-white">
                  {detailModal.reported_amount ? formatCurrency(detailModal.reported_amount) : 'N/A'} {detailModal.reported_currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Confirmed Amount</p>
                <p className="font-medium text-navy-900 dark:text-white">
                  {detailModal.amount ? formatCurrency(detailModal.amount) : 'N/A'} {detailModal.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Source Bank</p>
                <p className="font-medium text-navy-900 dark:text-white">{detailModal.source_bank || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Source IBAN</p>
                <p className="font-mono text-sm text-navy-900 dark:text-white">{detailModal.source_iban || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Wire Reference</p>
                <p className="font-mono text-sm text-navy-900 dark:text-white">{detailModal.wire_reference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Hold Type</p>
                <p className="font-medium text-navy-900 dark:text-white">{detailModal.hold_type || 'N/A'}</p>
              </div>
            </div>

            {detailModal.admin_notes && (
              <>
                <hr className="border-navy-200 dark:border-navy-700" />
                <div>
                  <p className="text-sm text-navy-500">Admin Notes</p>
                  <p className="text-sm text-navy-700 dark:text-navy-300 whitespace-pre-wrap">{detailModal.admin_notes}</p>
                </div>
              </>
            )}

            {detailModal.rejection_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Rejection Reason: {detailModal.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Simple Modal component
function Modal({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700 sticky top-0 bg-white dark:bg-navy-800">
          <h3 className="font-semibold text-navy-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
