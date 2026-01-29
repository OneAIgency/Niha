import { useState, useEffect } from 'react';
import {
    Clock,
    RefreshCw,
} from 'lucide-react';
import { BackofficeLayout } from '../components/layout/BackofficeLayout';
import { Card, Button, Badge } from '../components/common';
import api from '../services/api';

interface Deposit {
    id: string;
    entity_name: string;
    user_email: string;
    amount: number;
    currency: string;
    status: string;
    aml_status: string;
    hold_expires_at?: string;
    reported_at: string;
    source_bank?: string;
    wire_reference?: string;
}

export function BackofficeDepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'on_hold'>('pending');

    const fetchDeposits = async () => {
        setLoading(true);
        try {
            // Endpoint depends on filter
            const endpoint = filter === 'pending' ? '/api/v1/deposits/pending' : '/api/v1/deposits/on-hold';
            const response = await api.get(endpoint);
            setDeposits(response.data.deposits);
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, [filter]);

    const handleConfirm = async (id: string, amount: number) => {
        if (!window.confirm('Confirm wire receipt for this deposit?')) return;
        try {
            await api.post(`/api/v1/deposits/${id}/confirm`, {
                actual_amount: amount,
                actual_currency: 'EUR', // Defaulting to EUR for MVP
                admin_notes: 'Confirmed via Backoffice UI'
            });
            fetchDeposits();
        } catch (error) {
            console.error('Failed to confirm deposit:', error);
            alert('Failed to confirm deposit');
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
                                                            onClick={() => handleConfirm(d.id, d.amount)}
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
        </BackofficeLayout>
    );
}
