import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Loader2,
  ArrowRight,
  Banknote,
  Info,
  Home,
  TrendingUp,
  Factory,
  Globe,
  FileText,
  Target,
} from 'lucide-react';
import { Button, Card, Badge, Subheader, SubSubHeader } from '../components/common';
import { usersApi } from '../services/api';
import { formatRelativeTime, formatCurrency } from '../utils';
import { useAuthStore } from '../stores/useStore';
import { Deposit } from '../types';
import {
  EmbeddedOnboardingIndex,
  EmbeddedMarketOverview,
  EmbeddedAboutNihao,
  EmbeddedCeaHolders,
  EmbeddedEuaHolders,
  EmbeddedEuEntities,
  EmbeddedStrategicAdvantage,
} from './funding/EmbeddedOnboardingContent';

// Navigation sections
type SectionKey = 'funding' | 'overview' | 'market' | 'about' | 'cea' | 'eua' | 'eu-entities' | 'strategy';

const sections: { key: SectionKey; label: string; icon: typeof Banknote }[] = [
  { key: 'funding', label: 'Funding', icon: Banknote },
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'market', label: 'Market', icon: TrendingUp },
  { key: 'about', label: 'About', icon: Building2 },
  { key: 'cea', label: 'CEA', icon: Factory },
  { key: 'eua', label: 'EUA', icon: Globe },
  { key: 'eu-entities', label: 'EU Entities', icon: FileText },
  { key: 'strategy', label: 'Strategy', icon: Target },
];

interface FundingInstructions {
  bank_name: string;
  account_name: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  swift_bic?: string;
  routing_number?: string;
  currency?: string;
  reference_format?: string;
  reference_instructions?: string;
  supported_currencies?: string[];
  processing_time?: string;
  notes?: string;
}

interface EntityBalance {
  entity_id: string;
  entity_name: string;
  balance_amount: number;
  balance_currency?: string | null;
  total_deposited: number;
  deposit_count: number;
}

const CURRENCIES = ['EUR', 'USD', 'CNY', 'HKD'];

export function FundingPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [instructions, setInstructions] = useState<FundingInstructions | null>(null);
  const [balance, setBalance] = useState<EntityBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Active section state
  const [activeSection, setActiveSection] = useState<SectionKey>('funding');

  // Get current user to check if admin
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // Form state
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [wireReference, setWireReference] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if there's a pending deposit - form should be disabled for non-admin users
  // Status can be 'pending' or 'PENDING' depending on API
  const pendingDeposit = deposits.find((d) => d.status.toLowerCase() === 'pending');
  // Only disable for non-admin users
  const hasPendingDeposit = !isAdmin && !!pendingDeposit;

  // Format amount with thousand separators for display
  const formatAmountInput = (value: string) => {
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^\d.]/g, '');

    // Handle multiple decimal points - keep only the first one
    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

    // Add thousand separators to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedInteger + decimalPart;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatAmountInput(inputValue);
    setDisplayAmount(formatted);
    // Store raw numeric value without commas
    setAmount(formatted.replace(/,/g, ''));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depositsData, instructionsData, balanceData] = await Promise.all([
        usersApi.getMyDeposits(),
        usersApi.getFundingInstructions(),
        usersApi.getMyEntityBalance(),
      ]);
      setDeposits(depositsData);
      setInstructions(instructionsData);
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to fetch funding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const result = await usersApi.reportDeposit(amountNum, currency, wireReference || undefined);
      setSuccessMessage(result.message);
      setAmount('');
      setDisplayAmount('');
      setWireReference('');
      // Refresh deposits
      const depositsData = await usersApi.getMyDeposits();
      setDeposits(depositsData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to report deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return <Badge variant="warning">PENDING</Badge>;
      case 'confirmed':
      case 'on_hold':
      case 'cleared':
        return <Badge variant="success">{status.toUpperCase()}</Badge>;
      case 'rejected':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
    }
  };

  // Handler for navigation from within embedded onboarding content
  const handleOnboardingNavigate = (section: SectionKey) => {
    setActiveSection(section);
    // Scroll to top of content area
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render onboarding content based on active section
  const renderOnboardingContent = () => {
    switch (activeSection) {
      case 'overview':
        return <EmbeddedOnboardingIndex onNavigate={handleOnboardingNavigate} />;
      case 'market':
        return <EmbeddedMarketOverview onNavigate={handleOnboardingNavigate} />;
      case 'about':
        return <EmbeddedAboutNihao onNavigate={handleOnboardingNavigate} />;
      case 'cea':
        return <EmbeddedCeaHolders onNavigate={handleOnboardingNavigate} />;
      case 'eua':
        return <EmbeddedEuaHolders onNavigate={handleOnboardingNavigate} />;
      case 'eu-entities':
        return <EmbeddedEuEntities onNavigate={handleOnboardingNavigate} />;
      case 'strategy':
        return <EmbeddedStrategicAdvantage onNavigate={handleOnboardingNavigate} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Sticky header area following theme pattern */}
      <div className="page-section-header-sticky">
        <Subheader
          icon={<Banknote className="w-5 h-5 text-teal-400" />}
          title="Fund Your Account"
          description="Wire transfer funds to start trading on the Carbon Market"
          iconBg="bg-teal-500/20"
        />

        <SubSubHeader
          left={
            <nav className="flex items-center gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`group subsubheader-nav-btn ${
                      isActive ? 'subsubheader-nav-btn-active' : 'subsubheader-nav-btn-inactive'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ${
                        isActive
                          ? 'max-w-[14rem] opacity-100'
                          : 'max-w-0 opacity-0 group-hover:max-w-[14rem] group-hover:opacity-100'
                      }`}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          }
        />
      </div>

      {/* Content area */}
      <div>
        {/* Show Funding content */}
        {activeSection === 'funding' && (
          <div className="page-container py-8 space-y-6">
            {/* Current Balance (if any) */}
            {balance && balance.balance_amount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-400">Current Balance</p>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(balance.balance_amount)} {balance.balance_currency}
                      </p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Deposit Status - prominent display when there's a pending deposit */}
            {hasPendingDeposit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-blue-900/40 to-navy-800 border-blue-500/40">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-400 animate-pulse" />
                    </div>
                    Deposit Status
                  </h2>

                  <div className="space-y-4">
                    {deposits.filter(d => d.status.toLowerCase() === 'pending').map((deposit) => (
                      <div
                        key={deposit.id}
                        className="p-6 rounded-xl bg-navy-900/50 border border-blue-500/30"
                      >
                        {/* Amount - Large and prominent */}
                        <div className="text-center mb-6">
                          <p className="text-sm text-blue-400 uppercase tracking-wider mb-2">Transfer Amount</p>
                          <p className="text-4xl font-bold text-white">
                            {(deposit.reportedAmount ?? deposit.reported_amount)
                              ? `${formatCurrency(deposit.reportedAmount ?? deposit.reported_amount ?? 0)}`
                              : 'Amount pending'}
                          </p>
                          <p className="text-xl text-blue-400 font-medium">
                            {deposit.reportedCurrency ?? deposit.reported_currency ?? 'EUR'}
                          </p>
                        </div>

                        {/* Status Badge - Centered */}
                        <div className="flex justify-center mb-6">
                          <div className="px-6 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full">
                            <span className="text-blue-400 font-semibold uppercase tracking-wider">
                              Processing Your Transfer
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-navy-800/50 rounded-lg">
                            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Reference</p>
                            <p className="text-white font-mono text-lg">{deposit.bankReference ?? deposit.bank_reference ?? 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-navy-800/50 rounded-lg">
                            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Reported</p>
                            <p className="text-white text-lg">{(deposit.reportedAt ?? deposit.reported_at) ? formatRelativeTime(deposit.reportedAt ?? deposit.reported_at ?? '') : 'N/A'}</p>
                          </div>
                          {(deposit.ticketId ?? deposit.ticket_id) && (
                            <div className="p-4 bg-navy-800/50 rounded-lg col-span-2">
                              <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Ticket ID</p>
                              <p className="text-teal-400 font-mono text-lg">{deposit.ticketId ?? deposit.ticket_id}</p>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl flex items-center gap-3">
                          <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
                          <div>
                            <p className="text-blue-200">
                              Your transfer is being processed by our team.
                            </p>
                            <p className="text-blue-200/80 text-sm mt-1">
                              You will be notified as soon as your funds clear our account.
                            </p>
                            <p className="text-blue-200/60 text-sm mt-1">
                              Depending on banking routes, this will usually take 1 to 3 working days.
                            </p>
                          </div>
                        </div>

                        {deposit.notes && (
                          <div className="mt-4 p-3 bg-navy-900/50 rounded-lg">
                            <p className="text-sm text-navy-300">
                              <span className="text-navy-400">Note:</span> {deposit.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Wire Transfer forms - hidden when there's a pending deposit */}
            {!hasPendingDeposit && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bank Instructions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    Wire Transfer Details
                  </h2>

                  {instructions && (
                    <div className="space-y-4">
                      <div className="p-3 bg-navy-800/50 rounded-lg">
                        <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Bank Name</p>
                        <p className="text-white font-medium">{instructions.bank_name}</p>
                      </div>

                      <div className="p-3 bg-navy-800/50 rounded-lg">
                        <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Account Name</p>
                        <p className="text-white font-medium">{instructions.account_name}</p>
                      </div>

                      {instructions.iban && (
                        <div className="p-3 bg-navy-800/50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">IBAN</p>
                            <p className="text-white font-mono">{instructions.iban}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(instructions.iban!, 'iban')}
                          >
                            {copied === 'iban' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}

                      {(instructions.swift_bic || instructions.swift_code) && (
                        <div className="p-3 bg-navy-800/50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">SWIFT/BIC</p>
                            <p className="text-white font-mono">{instructions.swift_bic || instructions.swift_code}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard((instructions.swift_bic || instructions.swift_code)!, 'swift')}
                          >
                            {copied === 'swift' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}

                      <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                        <div className="flex gap-2">
                          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-amber-200 text-sm font-medium">Important</p>
                            <p className="text-amber-200/80 text-sm">{instructions.reference_instructions}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-navy-400">
                        <Clock className="w-4 h-4" />
                        <span>Processing: {instructions.processing_time}</span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Report Deposit Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    Report Wire Transfer
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="text"
                        value={displayAmount}
                        onChange={handleAmountChange}
                        placeholder="Enter amount (e.g., 999,000)"
                        inputMode="decimal"
                        className="w-full px-4 py-3 bg-navy-800 border border-navy-700 rounded-lg text-white placeholder-navy-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 bg-navy-800 border border-navy-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-1">
                        Wire Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={wireReference}
                        onChange={(e) => setWireReference(e.target.value)}
                        placeholder="Bank wire reference number"
                        maxLength={100}
                        className="w-full px-4 py-3 bg-navy-800 border border-navy-700 rounded-lg text-white placeholder-navy-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      loading={submitting}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Report Transfer
                    </Button>
                  </form>
                </Card>
              </motion.div>
            </div>
            )}

            {/* Deposit History - shown at bottom when there's NO pending deposit */}
            {!hasPendingDeposit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Deposit History
                  </h2>

                  {deposits.length === 0 ? (
                    <div className="text-center py-8">
                      <Banknote className="w-12 h-12 text-navy-600 mx-auto mb-3" />
                      <p className="text-navy-400">No deposits yet</p>
                      <p className="text-navy-500 text-sm">Report your first wire transfer above</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deposits.map((deposit) => (
                        <div
                          key={deposit.id}
                          className={`p-4 rounded-xl border ${
                            deposit.status.toLowerCase() === 'pending'
                              ? 'bg-amber-900/20 border-amber-500/30'
                              : 'bg-navy-800/50 border-navy-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {['confirmed', 'on_hold', 'cleared'].includes(deposit.status.toLowerCase()) ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : deposit.status.toLowerCase() === 'pending' ? (
                                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                              <div>
                                <p className="text-white font-medium">
                                  {['confirmed', 'on_hold', 'cleared'].includes(deposit.status.toLowerCase()) && deposit.amount
                                    ? `${formatCurrency(deposit.amount)} ${deposit.currency}`
                                    : (deposit.reportedAmount ?? deposit.reported_amount)
                                      ? `${formatCurrency(deposit.reportedAmount ?? deposit.reported_amount ?? 0)} ${deposit.reportedCurrency ?? deposit.reported_currency}`
                                      : 'Amount pending'}
                                </p>
                                {(deposit.ticketId ?? deposit.ticket_id) && (
                                  <p className="text-sm text-teal-400 font-mono">
                                    Ticket: {deposit.ticketId ?? deposit.ticket_id}
                                  </p>
                                )}
                                <p className="text-sm text-navy-400">
                                  Ref: {deposit.bankReference ?? deposit.bank_reference ?? 'N/A'}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(deposit.status)}
                          </div>

                          {/* Pending deposit message */}
                          {deposit.status.toLowerCase() === 'pending' && (
                            <div className="mt-3 p-3 bg-amber-900/30 border border-amber-500/20 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                              <p className="text-amber-200 text-sm">
                                Backoffice is waiting for confirmation of your transfer.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-navy-400 mt-2">
                            <span>
                              Reported: {(deposit.reportedAt ?? deposit.reported_at) ? formatRelativeTime(deposit.reportedAt ?? deposit.reported_at ?? '') : 'N/A'}
                            </span>
                            {(deposit.confirmedAt ?? deposit.confirmed_at) && (
                              <span>Confirmed: {formatRelativeTime(deposit.confirmedAt ?? deposit.confirmed_at ?? '')}</span>
                            )}
                          </div>
                          {deposit.notes && (
                            <p className="mt-2 text-sm text-navy-300 bg-navy-900/50 p-2 rounded">
                              Note: {deposit.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Show Onboarding content when not on Funding tab */}
        {activeSection !== 'funding' && renderOnboardingContent()}
      </div>
    </div>
  );
}
