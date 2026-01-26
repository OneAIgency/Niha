import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Card, Badge, Subheader } from '../components/common';
import { adminApi } from '../services/api';
import type { ScrapingSource, ScrapeLibrary } from '../types';

/**
 * Extract a user-facing message from an API error (e.g. axios).
 * Prefers response.data.detail (FastAPI), then message, then Error.message.
 */
function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { detail?: string | { msg?: string }[]; message?: string } } }).response;
    const d = res?.data?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    const m = res?.data?.message;
    if (typeof m === 'string') return m;
  }
  return (err as Error)?.message ?? 'Something went wrong.';
}

export function SettingsPage() {
  const [sources, setSources] = useState<ScrapingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [refreshingSource, setRefreshingSource] = useState<string | null>(null);
  const [deletingSource, setDeletingSource] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ sourceId: string; price?: number; success: boolean } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    certificate_type: 'EUA' as 'EUA' | 'CEA',
    scrape_library: 'HTTPX' as ScrapeLibrary,
    scrape_interval_minutes: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sourcesData = await adminApi.getScrapingSources();
      setSources(sourcesData);
    } catch (e) {
      console.error('Failed to load settings data:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleTestSource = async (sourceId: string) => {
    setTestingSource(sourceId);
    setTestResult(null);
    setError(null);
    try {
      const result = await adminApi.testScrapingSource(sourceId);
      setTestResult({ sourceId, price: result.price, success: result.success });
      if (result.success) setError(null);
      else setError(result.message || 'Test failed.');
    } catch (e) {
      console.error('Test source failed:', e);
      setError(getApiErrorMessage(e));
      setTestResult({ sourceId, success: false });
    } finally {
      setTestingSource(null);
    }
  };

  const handleRefreshSource = async (sourceId: string) => {
    setRefreshingSource(sourceId);
    setError(null);
    try {
      await adminApi.refreshScrapingSource(sourceId);
      const sourcesData = await adminApi.getScrapingSources();
      setSources(sourcesData);
    } catch (e) {
      console.error('Failed to refresh source:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setRefreshingSource(null);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this scraping source?')) return;

    setDeletingSource(sourceId);
    setError(null);
    try {
      await adminApi.deleteScrapingSource(sourceId);
      setSources(sources.filter(s => s.id !== sourceId));
    } catch (e) {
      console.error('Failed to delete source:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setDeletingSource(null);
    }
  };

  const handleIntervalChange = async (sourceId: string, interval: number) => {
    setError(null);
    try {
      await adminApi.updateScrapingSource(sourceId, { scrape_interval_minutes: interval });
      setSources(sources.map(s =>
        s.id === sourceId
          ? { ...s, scrape_interval_minutes: interval }
          : s
      ));
    } catch (e) {
      console.error('Failed to update interval:', e);
      setError(getApiErrorMessage(e));
    }
  };

  const handleLibraryChange = async (sourceId: string, library: ScrapeLibrary) => {
    setError(null);
    try {
      await adminApi.updateScrapingSource(sourceId, { scrape_library: library });
      setSources(sources.map(s =>
        s.id === sourceId
          ? { ...s, scrape_library: library }
          : s
      ));
    } catch (e) {
      console.error('Failed to update library:', e);
      setError(getApiErrorMessage(e));
    }
  };

  const handleAddSource = async () => {
    setError(null);
    try {
      const created = await adminApi.createScrapingSource(newSource);
      setSources([...sources, created]);
      setShowAddModal(false);
      setNewSource({ name: '', url: '', certificate_type: 'EUA', scrape_library: 'HTTPX', scrape_interval_minutes: 5 });
    } catch (e) {
      console.error('Failed to create source:', e);
      setError(getApiErrorMessage(e));
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-navy-400" />;
    }
  };

  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Subheader
        icon={<Database className="w-5 h-5 text-blue-500" />}
        title="Platform Settings"
        description="Configure scraping sources, view market data, and monitor user activity"
        iconBg="bg-blue-500/20"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-red-800 dark:text-red-200"
            role="alert"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-red-200/50 dark:hover:bg-red-800/50 focus:ring-2 focus:ring-red-500"
              aria-label="Dismiss error"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="space-y-8">
          {/* Scraping Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              data-testid="price-scraping-sources-card"
              data-component="PriceScrapingSources"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Price Scraping Sources
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
                  Add Source
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-100 dark:border-navy-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Library
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Interval
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Last Scrape
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Last Price
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                    {sources.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-navy-500 dark:text-navy-400">
                          No scraping sources configured. Click "Add Source" to create one.
                        </td>
                      </tr>
                    ) : (
                      sources.map((source) => (
                        <tr key={source.id} className="hover:bg-navy-50 dark:hover:bg-navy-800/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-navy-900 dark:text-white">{source.name}</p>
                              <p className="text-xs text-navy-500 dark:text-navy-400 truncate max-w-xs">
                                {source.url}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={source.certificate_type === 'EUA' ? 'info' : 'warning'}>
                              {source.certificate_type}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={source.scrape_library || 'HTTPX'}
                              onChange={(e) => handleLibraryChange(source.id, e.target.value as ScrapeLibrary)}
                              className="px-2 py-1 text-sm rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                            >
                              <option value="HTTPX">HTTPX</option>
                              <option value="BEAUTIFULSOUP">BeautifulSoup</option>
                              <option value="SELENIUM">Selenium</option>
                              <option value="PLAYWRIGHT">Playwright</option>
                            </select>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={source.scrape_interval_minutes}
                              onChange={(e) => handleIntervalChange(source.id, parseInt(e.target.value))}
                              className="px-2 py-1 text-sm rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                            >
                              <option value={5}>5 min</option>
                              <option value={10}>10 min</option>
                              <option value={15}>15 min</option>
                              <option value={30}>30 min</option>
                              <option value={60}>1 hour</option>
                            </select>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-navy-600 dark:text-navy-300">
                              {formatTimeAgo(source.last_scrape_at)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {source.last_price ? (
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {source.certificate_type === 'EUA' ? '€' : '¥'}{source.last_price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-sm text-navy-400">-</span>
                            )}
                            {testResult?.sourceId === source.id && testResult.price && (
                              <span className="ml-2 text-xs text-blue-500">
                                (Test: {source.certificate_type === 'EUA' ? '€' : '¥'}{testResult.price.toFixed(2)})
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(source.last_scrape_status)}
                              <span className="text-sm capitalize text-navy-600 dark:text-navy-300">
                                {source.last_scrape_status || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestSource(source.id)}
                                loading={testingSource === source.id}
                                icon={testingSource === source.id ? undefined : <Play className="w-3 h-3" />}
                              >
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshSource(source.id)}
                                loading={refreshingSource === source.id}
                                icon={refreshingSource === source.id ? undefined : <RefreshCw className="w-3 h-3" />}
                              >
                                Refresh
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSource(source.id)}
                                loading={deletingSource === source.id}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                icon={<Trash2 className="w-3 h-3" />}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Add Scraping Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  placeholder="e.g., ICE Exchange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">URL</label>
                <input
                  type="url"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  placeholder="https://example.com/prices"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Certificate Type</label>
                <select
                  value={newSource.certificate_type}
                  onChange={(e) => setNewSource({ ...newSource, certificate_type: e.target.value as 'EUA' | 'CEA' })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                >
                  <option value="EUA">EUA</option>
                  <option value="CEA">CEA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Scraping Library</label>
                <select
                  value={newSource.scrape_library}
                  onChange={(e) => setNewSource({ ...newSource, scrape_library: e.target.value as ScrapeLibrary })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                >
                  <option value="HTTPX">HTTPX (Fast, async HTTP)</option>
                  <option value="BEAUTIFULSOUP">BeautifulSoup (HTML parsing)</option>
                  <option value="SELENIUM">Selenium (Browser automation)</option>
                  <option value="PLAYWRIGHT">Playwright (Modern browser automation)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Scrape Interval</label>
                <select
                  value={newSource.scrape_interval_minutes}
                  onChange={(e) => setNewSource({ ...newSource, scrape_interval_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddSource} className="flex-1">
                Add Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
