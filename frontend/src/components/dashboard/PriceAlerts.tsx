import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { Card } from '../common';
import { priceAlertsApi, type PriceAlertItem } from '../../services/api';
import { showToast } from '../common';

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [certType, setCertType] = useState<'EUA' | 'CEA'>('EUA');
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await priceAlertsApi.list();
      setAlerts(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Listen for price alert notifications to auto-refresh
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.category === 'price_alert') {
        showToast('success', detail.message, 'Price Alert');
        fetchAlerts();
      }
    };
    window.addEventListener('nihao:notification', handler);
    return () => window.removeEventListener('nihao:notification', handler);
  }, [fetchAlerts]);

  const handleCreate = async () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) return;

    setCreating(true);
    try {
      await priceAlertsApi.create({
        certificate_type: certType,
        direction,
        target_price: price,
      });
      setTargetPrice('');
      setShowForm(false);
      showToast('success', `Alert set: ${certType} ${direction.toLowerCase()} €${price.toFixed(2)}`);
      await fetchAlerts();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      showToast('error', error.response?.data?.detail || 'Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await priceAlertsApi.remove(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete alert');
    }
  };

  const activeAlerts = alerts.filter(a => a.isActive);
  const triggeredAlerts = alerts.filter(a => !a.isActive && a.triggeredAt);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          Price Alerts
          {activeAlerts.length > 0 && (
            <span className="text-xs font-normal text-navy-400">({activeAlerts.length})</span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-3 p-3 rounded-lg bg-navy-700/50 border border-navy-600 space-y-2">
          <div className="flex gap-2">
            <select
              value={certType}
              onChange={e => setCertType(e.target.value as 'EUA' | 'CEA')}
              className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="EUA">EUA</option>
              <option value="CEA">CEA</option>
            </select>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value as 'ABOVE' | 'BELOW')}
              className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="ABOVE">Above</option>
              <option value="BELOW">Below</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-navy-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white placeholder:text-navy-500"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !targetPrice}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? '...' : 'Set'}
            </button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {loading ? (
        <div className="text-xs text-navy-400 text-center py-4">Loading...</div>
      ) : activeAlerts.length === 0 && triggeredAlerts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-navy-400">No alerts set</p>
          <p className="text-[10px] text-navy-500 mt-1">Get notified when prices hit your target</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-navy-700/30 border border-navy-700 group"
            >
              {alert.direction === 'ABOVE' ? (
                <ArrowUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-white">{alert.certificateType}</span>
                <span className="text-xs text-navy-400 ml-1">
                  {alert.direction === 'ABOVE' ? '≥' : '≤'} €{alert.targetPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}

          {/* Triggered (recent) */}
          {triggeredAlerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-navy-800/30 border border-navy-800 opacity-60 group"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-navy-300">{alert.certificateType}</span>
                <span className="text-xs text-navy-500 ml-1">
                  {alert.direction === 'ABOVE' ? '≥' : '≤'} €{alert.targetPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-navy-500 ml-1">triggered</span>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3 h-3 text-navy-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
