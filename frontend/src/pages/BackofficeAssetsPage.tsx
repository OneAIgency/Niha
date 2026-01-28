import { useState, useEffect } from 'react';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import { BackofficeLayout } from '../components/layout/BackofficeLayout';
import { Card, Button } from '../components/common';
import api from '../services/api';

interface EntityBalance {
    entity_id: string;
    entity_name: string;
    balances: {
        EUR?: number;
        CEA?: number;
        EUA?: number;
    };
}

export function BackofficeAssetsPage() {
    const [entities, setEntities] = useState<EntityBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
    const [assetType, setAssetType] = useState<'EUR' | 'CEA' | 'EUA'>('CEA');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [action, setAction] = useState<'credit' | 'debit'>('credit');

    const fetchEntities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/assets/entities');
            setEntities(response.data);
        } catch (error) {
            console.error('Failed to fetch entities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntities();
    }, []);

    const handleSubmit = async () => {
        if (!selectedEntity || !amount) {
            alert('Please select entity and enter amount');
            return;
        }

        try {
            const endpoint = action === 'credit' ? '/api/v1/assets/credit' : '/api/v1/assets/debit';
            await api.post(endpoint, {
                entity_id: selectedEntity,
                asset_type: assetType,
                amount: parseFloat(amount),
                notes: notes || undefined
            });

            alert(`Successfully ${action}ed ${amount} ${assetType}`);
            setAmount('');
            setNotes('');
            fetchEntities();
        } catch (error: any) {
            console.error(`Failed to ${action} assets:`, error);
            alert(error.response?.data?.detail || `Failed to ${action} assets`);
        }
    };

    const formatBalance = (value: number | undefined) => {
        if (value === undefined || value === 0) return '-';
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <BackofficeLayout
            subSubHeader={
                <Button variant="outline" size="sm" onClick={fetchEntities} icon={<RefreshCw className="w-4 h-4" />}>
                    Refresh
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Credit/Debit Panel */}
                <Card title="Asset Management">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Action
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={action === 'credit' ? 'primary' : 'ghost'}
                                        onClick={() => setAction('credit')}
                                        size="sm"
                                        icon={<Plus className="w-4 h-4" />}
                                    >
                                        Credit
                                    </Button>
                                    <Button
                                        variant={action === 'debit' ? 'primary' : 'ghost'}
                                        onClick={() => setAction('debit')}
                                        size="sm"
                                        icon={<Minus className="w-4 h-4" />}
                                    >
                                        Debit
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Entity
                                </label>
                                <select
                                    value={selectedEntity || ''}
                                    onChange={(e) => setSelectedEntity(e.target.value)}
                                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Entity</option>
                                    {entities.map((entity) => (
                                        <option key={entity.entity_id} value={entity.entity_id}>
                                            {entity.entity_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Asset Type
                                </label>
                                <div className="flex gap-2">
                                    {(['EUR', 'CEA', 'EUA'] as const).map((type) => (
                                        <Button
                                            key={type}
                                            variant={assetType === type ? 'primary' : 'ghost'}
                                            onClick={() => setAssetType(type)}
                                            size="sm"
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Reason for adjustment..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                className="w-full"
                            >
                                {action === 'credit' ? 'Credit' : 'Debit'} {amount || '0'} {assetType}
                            </Button>
                        </div>

                        <div className="bg-navy-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Preview</h3>
                            {selectedEntity ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Entity:</span>
                                        <span className="text-white font-medium">
                                            {entities.find(e => e.entity_id === selectedEntity)?.entity_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Current {assetType}:</span>
                                        <span className="text-white font-mono">
                                            {formatBalance(entities.find(e => e.entity_id === selectedEntity)?.balances[assetType])}
                                        </span>
                                    </div>
                                    {amount && (
                                        <div className="flex justify-between text-sm border-t border-navy-700 pt-3">
                                            <span className="text-gray-400">New {assetType}:</span>
                                            <span className={`font-mono font-bold ${action === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {formatBalance(
                                                    (entities.find(e => e.entity_id === selectedEntity)?.balances[assetType] || 0) +
                                                    (action === 'credit' ? 1 : -1) * parseFloat(amount || '0')
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Select an entity to see the preview</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Entity Balances Table */}
                <Card title="Entity Balances">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading balances...</div>
                    ) : entities.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No entities found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-400 border-b border-navy-700">
                                    <tr>
                                        <th className="pb-3 pl-4">Entity</th>
                                        <th className="pb-3 text-right">EUR</th>
                                        <th className="pb-3 text-right">CEA</th>
                                        <th className="pb-3 text-right pr-4">EUA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-800">
                                    {entities.map((entity) => (
                                        <tr
                                            key={entity.entity_id}
                                            className={`hover:bg-navy-800/50 cursor-pointer ${selectedEntity === entity.entity_id ? 'bg-navy-800' : ''
                                                }`}
                                            onClick={() => setSelectedEntity(entity.entity_id)}
                                        >
                                            <td className="py-4 pl-4 text-white font-medium">
                                                {entity.entity_name}
                                            </td>
                                            <td className="py-4 text-right text-gray-300 font-mono">
                                                {formatBalance(entity.balances.EUR)}
                                            </td>
                                            <td className="py-4 text-right text-gray-300 font-mono">
                                                {formatBalance(entity.balances.CEA)}
                                            </td>
                                            <td className="py-4 text-right text-gray-300 font-mono pr-4">
                                                {formatBalance(entity.balances.EUA)}
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
