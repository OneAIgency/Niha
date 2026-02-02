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
  Mail,
  Save,
  DollarSign,
} from 'lucide-react';
import { Button, Card, Badge, Subheader } from '../components/common';
import { adminApi } from '../services/api';
import type { ScrapingSource, ScrapeLibrary, ExchangeRateSource, MailSettings, MailSettingsUpdate } from '../types';

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

  // Exchange Rate Sources state
  const [exchangeRateSources, setExchangeRateSources] = useState<ExchangeRateSource[]>([]);
  const [testingExchangeSource, setTestingExchangeSource] = useState<string | null>(null);
  const [refreshingExchangeSource, setRefreshingExchangeSource] = useState<string | null>(null);
  const [deletingExchangeSource, setDeletingExchangeSource] = useState<string | null>(null);
  const [exchangeTestResult, setExchangeTestResult] = useState<{ sourceId: string; rate?: number; success: boolean } | null>(null);
  const [showAddExchangeModal, setShowAddExchangeModal] = useState(false);
  const [newExchangeSource, setNewExchangeSource] = useState({
    name: '',
    from_currency: 'EUR',
    to_currency: 'CNY',
    url: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
    scrape_library: 'HTTPX' as ScrapeLibrary,
    scrape_interval_minutes: 60,
    is_primary: true,
  });

  // Mail & Auth settings
  const [_mailSettings, setMailSettings] = useState<MailSettings | null>(null);
  const [mailSaving, setMailSaving] = useState(false);
  const [mailSavedSuccess, setMailSavedSuccess] = useState(false);
  const [mailForm, setMailForm] = useState<MailSettingsUpdate & { from_email: string }>({
    provider: 'resend',
    use_env_credentials: true,
    from_email: '',
    invitation_link_base_url: '',
    invitation_token_expiry_days: 7,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sourcesData, mailData, exchangeData] = await Promise.all([
        adminApi.getScrapingSources(),
        adminApi.getMailSettings(),
        adminApi.getExchangeRateSources(),
      ]);
      setSources(sourcesData);
      setMailSettings(mailData);
      setExchangeRateSources(exchangeData);
      setMailForm({
        provider: mailData.provider,
        use_env_credentials: mailData.use_env_credentials,
        from_email: mailData.from_email ?? '',
        resend_api_key: mailData.resend_api_key ?? undefined,
        smtp_host: mailData.smtp_host ?? undefined,
        smtp_port: mailData.smtp_port ?? undefined,
        smtp_use_tls: mailData.smtp_use_tls,
        smtp_username: mailData.smtp_username ?? undefined,
        smtp_password: mailData.smtp_password ?? undefined,
        invitation_subject: mailData.invitation_subject ?? undefined,
        invitation_body_html: mailData.invitation_body_html ?? undefined,
        invitation_link_base_url: mailData.invitation_link_base_url ?? '',
        invitation_token_expiry_days: mailData.invitation_token_expiry_days ?? 7,
        verification_method: mailData.verification_method ?? undefined,
        auth_method: mailData.auth_method ?? undefined,
      });
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

  // Exchange Rate Source handlers
  const handleTestExchangeSource = async (sourceId: string) => {
    setTestingExchangeSource(sourceId);
    setExchangeTestResult(null);
    setError(null);
    try {
      const result = await adminApi.testExchangeRateSource(sourceId);
      setExchangeTestResult({ sourceId, rate: result.rate, success: result.success });
      if (!result.success) setError(result.message || 'Test failed.');
    } catch (e) {
      console.error('Failed to test exchange source:', e);
      setError(getApiErrorMessage(e));
      setExchangeTestResult({ sourceId, success: false });
    } finally {
      setTestingExchangeSource(null);
    }
  };

  const handleRefreshExchangeSource = async (sourceId: string) => {
    setRefreshingExchangeSource(sourceId);
    setError(null);
    try {
      await adminApi.refreshExchangeRateSource(sourceId);
      const exchangeData = await adminApi.getExchangeRateSources();
      setExchangeRateSources(exchangeData);
    } catch (e) {
      console.error('Failed to refresh exchange source:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setRefreshingExchangeSource(null);
    }
  };

  const handleDeleteExchangeSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this exchange rate source?')) return;

    setDeletingExchangeSource(sourceId);
    setError(null);
    try {
      await adminApi.deleteExchangeRateSource(sourceId);
      setExchangeRateSources(exchangeRateSources.filter(s => s.id !== sourceId));
    } catch (e) {
      console.error('Failed to delete exchange source:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setDeletingExchangeSource(null);
    }
  };

  const handleAddExchangeSource = async () => {
    setError(null);
    try {
      const created = await adminApi.createExchangeRateSource(newExchangeSource);
      setExchangeRateSources([...exchangeRateSources, created]);
      setShowAddExchangeModal(false);
      setNewExchangeSource({
        name: '',
        from_currency: 'EUR',
        to_currency: 'CNY',
        url: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
        scrape_library: 'HTTPX',
        scrape_interval_minutes: 60,
        is_primary: true,
      });
    } catch (e) {
      console.error('Failed to create exchange source:', e);
      setError(getApiErrorMessage(e));
    }
  };

  const handleSaveMailSettings = async () => {
    setError(null);
    setMailSaving(true);
    try {
      const payload: MailSettingsUpdate = {
        provider: mailForm.provider,
        use_env_credentials: mailForm.use_env_credentials,
        from_email: mailForm.from_email || undefined,
        resend_api_key: mailForm.resend_api_key && mailForm.resend_api_key !== '********' ? mailForm.resend_api_key : undefined,
        smtp_host: mailForm.smtp_host ?? undefined,
        smtp_port: mailForm.smtp_port ?? undefined,
        smtp_use_tls: mailForm.smtp_use_tls,
        smtp_username: mailForm.smtp_username ?? undefined,
        smtp_password: mailForm.smtp_password && mailForm.smtp_password !== '********' ? mailForm.smtp_password : undefined,
        invitation_subject: mailForm.invitation_subject ?? undefined,
        invitation_body_html: mailForm.invitation_body_html ?? undefined,
        invitation_link_base_url: mailForm.invitation_link_base_url || undefined,
        invitation_token_expiry_days: mailForm.invitation_token_expiry_days ?? undefined,
        verification_method: mailForm.verification_method ?? undefined,
        auth_method: mailForm.auth_method ?? undefined,
      };
      await adminApi.updateMailSettings(payload);
      const mailData = await adminApi.getMailSettings();
      setMailSettings(mailData);
      setMailForm({
        provider: mailData.provider,
        use_env_credentials: mailData.use_env_credentials,
        from_email: mailData.from_email ?? '',
        resend_api_key: mailData.resend_api_key ?? undefined,
        smtp_host: mailData.smtp_host ?? undefined,
        smtp_port: mailData.smtp_port ?? undefined,
        smtp_use_tls: mailData.smtp_use_tls,
        smtp_username: mailData.smtp_username ?? undefined,
        smtp_password: mailData.smtp_password ?? undefined,
        invitation_subject: mailData.invitation_subject ?? undefined,
        invitation_body_html: mailData.invitation_body_html ?? undefined,
        invitation_link_base_url: mailData.invitation_link_base_url ?? '',
        invitation_token_expiry_days: mailData.invitation_token_expiry_days ?? 7,
        verification_method: mailData.verification_method ?? undefined,
        auth_method: mailData.auth_method ?? undefined,
      });
      setMailSavedSuccess(true);
      setTimeout(() => setMailSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save mail settings:', e);
      setError(getApiErrorMessage(e));
    } finally {
      setMailSaving(false);
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
    // Normalize: append 'Z' if missing to treat naive timestamps as UTC
    const normalized = timestamp.endsWith('Z') || timestamp.includes('+')
      ? timestamp
      : timestamp + 'Z';
    const diff = Date.now() - new Date(normalized).getTime();
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

              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-navy-100 dark:border-navy-700">
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[25%]">
                        Source
                      </th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[8%]">
                        Library
                      </th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[8%]">
                        Interval
                      </th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">
                        Last Scrape
                      </th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[18%]">
                        Last Price
                      </th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">
                        Status
                      </th>
                      <th className="text-right py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[21%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                    {sources.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-navy-500 dark:text-navy-400">
                          No scraping sources configured. Click &quot;Add Source&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      sources.map((source) => (
                        <tr key={source.id} className="hover:bg-navy-50 dark:hover:bg-navy-800/50">
                          <td className="py-2 px-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-navy-900 dark:text-white flex items-center gap-1.5">
                                <Badge variant={source.certificate_type === 'EUA' ? 'info' : 'warning'} className="text-[10px] px-1.5 py-0.5">
                                  {source.certificate_type}
                                </Badge>
                              </p>
                              <p className="text-[10px] text-navy-500 dark:text-navy-400 truncate">
                                {source.url}
                              </p>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={source.scrape_library || 'HTTPX'}
                              onChange={(e) => handleLibraryChange(source.id, e.target.value as ScrapeLibrary)}
                              className="px-1 py-0.5 text-xs rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white w-full"
                            >
                              <option value="HTTPX">HTTPX</option>
                              <option value="BEAUTIFULSOUP">BS4</option>
                              <option value="SELENIUM">Selenium</option>
                              <option value="PLAYWRIGHT">Playwright</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={source.scrape_interval_minutes}
                              onChange={(e) => handleIntervalChange(source.id, parseInt(e.target.value))}
                              className="px-1 py-0.5 text-xs rounded border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white w-full"
                            >
                              <option value={5}>5m</option>
                              <option value={10}>10m</option>
                              <option value={15}>15m</option>
                              <option value={30}>30m</option>
                              <option value={60}>1h</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-xs text-navy-600 dark:text-navy-300">
                              {formatTimeAgo(source.last_scrape_at)}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            {source.last_price ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  {source.certificate_type === 'EUA' ? '€' : '¥'}{source.last_price.toFixed(2)}
                                </span>
                                {source.certificate_type === 'CEA' && source.lastPriceEur && (
                                  <span className="text-[10px] text-navy-500 dark:text-navy-400">
                                    ≈ €{source.lastPriceEur.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-navy-400">-</span>
                            )}
                            {testResult?.sourceId === source.id && testResult.price && (
                              <div className="text-[10px] text-blue-500 mt-0.5">
                                Test: {source.certificate_type === 'EUA' ? '€' : '¥'}{testResult.price.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(source.last_scrape_status)}
                              <span className="text-[10px] capitalize text-navy-600 dark:text-navy-300">
                                {source.last_scrape_status || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestSource(source.id)}
                                loading={testingSource === source.id}
                                icon={testingSource === source.id ? undefined : <Play className="w-3 h-3" />}
                                className="text-xs px-2 py-1"
                              >
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshSource(source.id)}
                                loading={refreshingSource === source.id}
                                icon={refreshingSource === source.id ? undefined : <RefreshCw className="w-3 h-3" />}
                                className="text-xs px-2 py-1"
                              >
                                Refresh
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSource(source.id)}
                                loading={deletingSource === source.id}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
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

          {/* Exchange Rate Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.025 }}
          >
            <Card data-testid="exchange-rate-sources-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Exchange Rate Sources
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowAddExchangeModal(true)} icon={<Plus className="w-4 h-4" />}>
                  Add Source
                </Button>
              </div>

              <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
                Configure exchange rate sources for currency conversion. CEA prices are converted from CNY to EUR using scraped rates.
              </p>

              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-navy-100 dark:border-navy-700">
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[25%]">Source</th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">Pair</th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[8%]">Interval</th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">Last Scrape</th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">Rate</th>
                      <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[10%]">Status</th>
                      <th className="text-right py-2 px-2 text-[10px] font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider w-[27%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                    {exchangeRateSources.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-navy-500 dark:text-navy-400">
                          No exchange rate sources configured. Click &quot;Add Source&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      exchangeRateSources.map((source) => (
                        <tr key={source.id} className="hover:bg-navy-50 dark:hover:bg-navy-800/50">
                          <td className="py-2 px-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-navy-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{source.name}</span>
                                {source.isPrimary && (
                                  <Badge variant="success" className="text-[10px] px-1.5 py-0.5">Primary</Badge>
                                )}
                              </p>
                              <p className="text-[10px] text-navy-500 dark:text-navy-400 truncate">{source.url}</p>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant="info" className="text-[10px] px-1.5 py-0.5">{source.fromCurrency}/{source.toCurrency}</Badge>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-xs text-navy-600 dark:text-navy-300">{source.scrapeIntervalMinutes}m</span>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-xs text-navy-600 dark:text-navy-300">{formatTimeAgo(source.lastScrapedAt)}</span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex flex-col">
                              {source.lastRate ? (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  {source.lastRate.toFixed(4)}
                                </span>
                              ) : (
                                <span className="text-xs text-navy-400">-</span>
                              )}
                              {exchangeTestResult?.sourceId === source.id && exchangeTestResult.rate && (
                                <span className="text-[10px] text-blue-500">Test: {exchangeTestResult.rate.toFixed(4)}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(source.lastScrapeStatus)}
                              <span className="text-[10px] capitalize text-navy-600 dark:text-navy-300">
                                {source.lastScrapeStatus || 'pending'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestExchangeSource(source.id)}
                                loading={testingExchangeSource === source.id}
                                icon={testingExchangeSource === source.id ? undefined : <Play className="w-3 h-3" />}
                                className="text-xs px-2 py-1"
                              >
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshExchangeSource(source.id)}
                                loading={refreshingExchangeSource === source.id}
                                icon={refreshingExchangeSource === source.id ? undefined : <RefreshCw className="w-3 h-3" />}
                                className="text-xs px-2 py-1"
                              >
                                Refresh
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExchangeSource(source.id)}
                                loading={deletingExchangeSource === source.id}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
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

          {/* Mail & Auth: admin-only config for invitation emails (provider, from, subject/body, link base URL, token expiry). GET/PUT /admin/settings/mail. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card
              data-testid="mail-auth-settings-card"
              className="bg-navy-800/50 border-navy-700"
              aria-describedby="mail-auth-description"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" />
                  Mail & Authentication
                </h2>
                <div className="flex items-center gap-3">
                  {mailSavedSuccess && (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400" role="status">
                      Saved
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveMailSettings}
                    loading={mailSaving}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <p id="mail-auth-description" className="text-sm text-navy-500 dark:text-navy-400 mb-6">
                Configure mail server and invitation emails. When set, invitation emails use these settings; otherwise env (RESEND_API_KEY, FROM_EMAIL) is used.
              </p>
              {mailForm.provider === 'smtp' && (!mailForm.smtp_host || String(mailForm.smtp_host).trim() === '') && (
                <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" role="alert">
                  SMTP host is not set. Invitation emails will not send until you configure host and port.
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Provider</label>
                  <select
                    value={mailForm.provider ?? 'resend'}
                    onChange={(e) => setMailForm({ ...mailForm, provider: e.target.value as 'resend' | 'smtp' })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  >
                    <option value="resend">Resend</option>
                    <option value="smtp">SMTP</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-7">
                  <input
                    type="checkbox"
                    id="use_env_credentials"
                    checked={mailForm.use_env_credentials ?? true}
                    onChange={(e) => setMailForm({ ...mailForm, use_env_credentials: e.target.checked })}
                    className="rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="use_env_credentials" className="text-sm text-navy-600 dark:text-navy-300">
                    Use credentials from environment
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">From email</label>
                  <input
                    type="email"
                    value={mailForm.from_email ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, from_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="noreply@example.com"
                  />
                </div>
                {mailForm.provider === 'resend' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Resend API key</label>
                    <input
                      type="password"
                      value={mailForm.resend_api_key === '********' ? '' : (mailForm.resend_api_key ?? '')}
                      onChange={(e) => setMailForm({ ...mailForm, resend_api_key: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                      placeholder="Leave blank to use RESEND_API_KEY from env"
                      autoComplete="off"
                    />
                  </div>
                )}
                {mailForm.provider === 'smtp' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">SMTP host</label>
                      <input
                        type="text"
                        value={mailForm.smtp_host ?? ''}
                        onChange={(e) => setMailForm({ ...mailForm, smtp_host: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">SMTP port</label>
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={mailForm.smtp_port ?? ''}
                        onChange={(e) => setMailForm({ ...mailForm, smtp_port: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                        className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                        placeholder="587"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-7">
                      <input
                        type="checkbox"
                        id="smtp_use_tls"
                        checked={mailForm.smtp_use_tls ?? true}
                        onChange={(e) => setMailForm({ ...mailForm, smtp_use_tls: e.target.checked })}
                        className="rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="smtp_use_tls" className="text-sm text-navy-600 dark:text-navy-300">Use TLS</label>
                    </div>
                    <div />
                    <div>
                      <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">SMTP username</label>
                      <input
                        type="text"
                        value={mailForm.smtp_username ?? ''}
                        onChange={(e) => setMailForm({ ...mailForm, smtp_username: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">SMTP password</label>
                      <input
                        type="password"
                        value={mailForm.smtp_password === '********' ? '' : (mailForm.smtp_password ?? '')}
                        onChange={(e) => setMailForm({ ...mailForm, smtp_password: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                        placeholder="Leave blank to keep current"
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Invitation link base URL</label>
                  <input
                    type="url"
                    value={mailForm.invitation_link_base_url ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, invitation_link_base_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="https://app.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Invitation token expiry (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={mailForm.invitation_token_expiry_days ?? 7}
                    onChange={(e) => setMailForm({ ...mailForm, invitation_token_expiry_days: parseInt(e.target.value, 10) || 7 })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Invitation subject</label>
                  <input
                    type="text"
                    value={mailForm.invitation_subject ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, invitation_subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="Welcome to Nihao Carbon Trading Platform"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Invitation body (HTML, optional)</label>
                  <textarea
                    rows={4}
                    value={mailForm.invitation_body_html ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, invitation_body_html: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="Use {{first_name}} and {{setup_url}} as placeholders. Leave blank for default template."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Verification method</label>
                  <select
                    value={mailForm.verification_method ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, verification_method: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  >
                    <option value="">—</option>
                    <option value="magic_link">Magic link</option>
                    <option value="password_only">Password only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Auth method</label>
                  <select
                    value={mailForm.auth_method ?? ''}
                    onChange={(e) => setMailForm({ ...mailForm, auth_method: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  >
                    <option value="">—</option>
                    <option value="password">Password</option>
                    <option value="magic_link">Magic link</option>
                  </select>
                </div>
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

      {/* Add Exchange Rate Source Modal */}
      {showAddExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Add Exchange Rate Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newExchangeSource.name}
                  onChange={(e) => setNewExchangeSource({ ...newExchangeSource, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  placeholder="e.g., ECB Daily Rates"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">From Currency</label>
                  <input
                    type="text"
                    value={newExchangeSource.from_currency}
                    onChange={(e) => setNewExchangeSource({ ...newExchangeSource, from_currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="EUR"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">To Currency</label>
                  <input
                    type="text"
                    value={newExchangeSource.to_currency}
                    onChange={(e) => setNewExchangeSource({ ...newExchangeSource, to_currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                    placeholder="CNY"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">URL</label>
                <input
                  type="url"
                  value={newExchangeSource.url}
                  onChange={(e) => setNewExchangeSource({ ...newExchangeSource, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                  placeholder="https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Scrape Interval</label>
                <select
                  value={newExchangeSource.scrape_interval_minutes}
                  onChange={(e) => setNewExchangeSource({ ...newExchangeSource, scrape_interval_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={newExchangeSource.is_primary}
                  onChange={(e) => setNewExchangeSource({ ...newExchangeSource, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_primary" className="text-sm text-navy-700 dark:text-navy-300">
                  Set as primary source for this currency pair
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddExchangeModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddExchangeSource} className="flex-1">
                Add Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
