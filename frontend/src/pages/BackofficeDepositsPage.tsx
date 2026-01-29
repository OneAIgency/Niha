import { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    RefreshCw,
    X,
    DollarSign,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { BackofficeLayout } from '../components/layout/BackofficeLayout';
import { Card, Button, Badge, ClientStatusBadge } from '../components/common';
import api from '../services/api';
import { cn } from '../utils';

interface Deposit {
    id: string;
    entity_name: string;
    user_email: string;
    /** Client status; API may return userRole (camelCase). */
    user_role?: string;
    userRole?: string;
    amount: number;
    currency: string;
    status: string;
    aml_status: string;
    hold_expires_at?: string;
    reported_at: string;
    source_bank?: string;
    wire_reference?: string;
    reported_amount?: number;
    reported_currency?: string;
}

type ConfirmModalState = {
    deposit: Deposit;
    amount: string;
    currency: string;
    notes: string;
    validationError: string | null;
} | null;

export function BackofficeDepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'on_hold'>('pending');
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    const fetchDeposits = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'pending' ? '/api/v1/deposits/pending' : '/api/v1/deposits/on-hold';
            const response = await api.get(endpoint);
            setDeposits(response.data.deposits);
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchDeposits();
    }, [fetchDeposits]);

    const openConfirmModal = (d: Deposit) => {
        const reported = d.reported_amount ?? d.amount ?? 0;
        setConfirmModal({
            deposit: d,
            amount: reported ? String(reported) : '',
            currency: d.reported_currency || d.currency || 'EUR',
            notes: '',
            validationError: null,
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal(null);
        setConfirmSubmitting(false);
    };

    const handleConfirmSubmit = async () => {
        if (!confirmModal) return;
        const amountNum = parseFloat(confirmModal.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setConfirmModal((prev) =>
                prev ? { ...prev, validationError: 'Please enter a valid amount greater than 0' } : null
            );
            return;
        }
        setConfirmModal((prev) => (prev ? { ...prev, validationError: null } : null));
        setConfirmSubmitting(true);
        try {
            await api.post(`/api/v1/deposits/${confirmModal.deposit.id}/confirm`, {
                actual_amount: amountNum,
                actual_currency: confirmModal.currency,
                admin_notes: confirmModal.notes.trim() || undefined,
            });
            closeConfirmModal();
            fetchDeposits();
        } catch (error) {
            console.error('Failed to confirm deposit:', error);
            setConfirmModal((prev) =>
                prev
                    ? {
                          ...prev,
                          validationError:
                              (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                              'Failed to confirm deposit',
                      }
                    : null
            );
        } finally {
            setConfirmSubmitting(false);
        }
    };

    const handleClear = async (id: string) => {
        if (!window.confirm('Clear funds to entity balance? This action is irreversible.')) return;
        try {
            await api.post(`/api/v1/deposits/${id}/clear`, {
                force_clear: true,
                admin_notes: 'Manual clearing via Backoffice UI'
            });
            fetchDeposits();
        } catch (error) {
            console.error('Failed to clear deposit:', error);
            alert('Failed to clear deposit');
        }
    };

    return (
        <BackofficeLayout
            subSubHeaderLeft={
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'pending' ? 'primary' : 'ghost'}
                        onClick={() => setFilter('pending')}
                        size="sm"
                    >
                        Pending Wires
                    </Button>
                    <Button
                        variant={filter === 'on_hold' ? 'primary' : 'ghost'}
                        onClick={() => setFilter('on_hold')}
                        size="sm"
                    >
                        AML Holds
                    </Button>
                </div>
            }
            subSubHeader={
                <Button variant="outline" size="sm" onClick={fetchDeposits} icon={<RefreshCw className="w-4 h-4" />}>
                    Refresh
                </Button>
            }
        >
            <div className="space-y-6">
                <Card title={filter === 'pending' ? 'Pending Wire Transfers' : 'Active AML Holds'}>
                    {loading ? (
                        <div className="p-8 text-center text-navy-400">Loading deposits...</div>
                    ) : deposits.length === 0 ? (
                        <div className="p-8 text-center text-navy-400">
                            No {filter === 'pending' ? 'pending deposits' : 'active holds'} found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-navy-400 border-b border-navy-700">
                                    <tr>
                                        <th className="pb-3 pl-4">Date</th>
                                        <th className="pb-3">Entity / User</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3">Bank Details</th>
                                        <th className="pb-3">Client</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 pr-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-800">
                                    {deposits.map((d) => (
                                        <tr key={d.id} className="hover:bg-navy-800/50">
                                            <td className="py-4 pl-4 text-navy-300">
                                                {new Date(d.reported_at).toLocaleDateString()}
                                                <div className="text-xs text-navy-500">
                                                    {new Date(d.reported_at).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="py-4 text-white font-medium">
                                                {d.entity_name}
                                                <div className="text-xs text-navy-400">{d.user_email}</div>
                                            </td>
                                            <td className="py-4 text-white">
                                                {d.amount?.toLocaleString('en-US', { style: 'currency', currency: d.currency || 'EUR' })}
                                                {d.amount !== d.amount && ( // Check if reported != actual (logic simplified)
                                                    <div className="text-xs text-yellow-500">
                                                        Claim: {d.amount}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 text-navy-300">
                                                {d.source_bank || 'N/A'}
                                                {d.wire_reference && (
                                                    <div className="text-xs text-blue-400 font-mono">Ref: {d.wire_reference}</div>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <ClientStatusBadge role={d.user_role ?? d.userRole} />
                                            </td>
                                            <td className="py-4">
                                                <Badge
                                                    variant={
                                                        d.status === 'pending' ? 'warning' :
                                                            d.status === 'on_hold' ? 'info' :
                                                                'success'
                                                    }
                                                >
                                                    {d.status.toUpperCase().replace('_', ' ')}
                                                </Badge>
                                                {d.hold_expires_at && (
                                                    <div className="mt-1 text-xs text-navy-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Expires: {new Date(d.hold_expires_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {d.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => openConfirmModal(d)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                    )}
                                                    {d.status === 'on_hold' && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleClear(d.id)}
                                                        >
                                                            Clear Funds
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Confirm Deposit Modal */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-navy-800 rounded-xl shadow-xl w-full max-w-md border border-navy-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-navy-700">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-navy-400" />
                                Confirm Deposit
                            </h3>
                            <button
                                onClick={closeConfirmModal}
                                className="text-navy-400 hover:text-navy-200 p-1 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="p-3 bg-navy-900/50 rounded-lg">
                                <p className="text-xs text-navy-400">Entity</p>
                                <p className="font-semibold text-white">{confirmModal.deposit.entity_name}</p>
                                <p className="text-xs text-navy-400 mt-1">{confirmModal.deposit.user_email}</p>
                            </div>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-400">Reported by user</p>
                                <p className="font-semibold text-amber-200">
                                    {(confirmModal.deposit.reported_amount ?? confirmModal.deposit.amount)?.toLocaleString(
                                        'en-US',
                                        {
                                            style: 'currency',
                                            currency:
                                                confirmModal.deposit.reported_currency ||
                                                confirmModal.deposit.currency ||
                                                'EUR',
                                        }
                                    )}
                                </p>
                            </div>
                            {confirmModal.validationError && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 flex-1">{confirmModal.validationError}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-navy-300 mb-1">
                                    Actual amount received *
                                </label>
                                <input
                                    type="number"
                                    value={confirmModal.amount}
                                    onChange={(e) =>
                                        setConfirmModal((prev) =>
                                            prev ? { ...prev, amount: e.target.value, validationError: null } : null
                                        )
                                    }
                                    placeholder="Enter actual amount"
                                    min="0"
                                    step="0.01"
                                    className={cn(
                                        'w-full px-4 py-2 rounded-lg border bg-navy-900 text-white font-mono focus:outline-none focus:ring-2',
                                        confirmModal.validationError
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-navy-600 focus:ring-navy-500'
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-300 mb-1">Currency *</label>
                                <select
                                    value={confirmModal.currency}
                                    onChange={(e) =>
                                        setConfirmModal((prev) => (prev ? { ...prev, currency: e.target.value } : null))
                                    }
                                    className="w-full px-4 py-2 rounded-lg border border-navy-600 bg-navy-900 text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="CNY">CNY</option>
                                    <option value="HKD">HKD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-300 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={confirmModal.notes}
                                    onChange={(e) =>
                                        setConfirmModal((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                                    }
                                    placeholder="Admin notes..."
                                    rows={2}
                                    className="w-full px-4 py-2 rounded-lg border border-navy-600 bg-navy-900 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" className="flex-1" onClick={closeConfirmModal} disabled={confirmSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleConfirmSubmit}
                                    loading={confirmSubmitting}
                                    disabled={!confirmModal.amount || parseFloat(confirmModal.amount) <= 0}
                                    icon={<CheckCircle className="w-4 h-4" />}
                                >
                                    Confirm Deposit
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
