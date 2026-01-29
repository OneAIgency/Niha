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
} from 'lucide-react';
import { Button, Card, Badge, Subheader } from '../components/common';
import { usersApi } from '../services/api';
import { formatRelativeTime, formatCurrency } from '../utils';

interface Deposit {
  id: string;
  entity_id: string;
  entity_name?: string;
  user_email?: string;
  reported_amount?: number | null;
  reported_currency?: string | null;
  amount?: number | null;
  currency?: string | null;
  wire_reference?: string | null;
  bank_reference?: string | null;
  status: string;
  reported_at?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: string;
  notes?: string | null;
  created_at: string;
}

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

  // Form state
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [wireReference, setWireReference] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    switch (status) {
      case 'pending':
        return <Badge variant="warning">PENDING</Badge>;
      case 'confirmed':
        return <Badge variant="success">CONFIRMED</Badge>;
      case 'rejected':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
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
    <div className="min-h-screen bg-navy-950">
      <Subheader
        icon={<Banknote className="w-5 h-5 text-teal-400" />}
        title="Fund Your Account"
        description="Wire transfer funds to start trading on the Carbon Market"
        iconBg="bg-teal-500/20"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

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

        {/* Deposit History */}
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
                    className="p-4 bg-navy-800/50 rounded-xl border border-navy-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {deposit.status === 'confirmed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : deposit.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-amber-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {deposit.status === 'confirmed' && deposit.amount
                              ? `${formatCurrency(deposit.amount)} ${deposit.currency}`
                              : deposit.reported_amount
                                ? `${formatCurrency(deposit.reported_amount)} ${deposit.reported_currency} (reported)`
                                : 'Amount pending'}
                          </p>
                          <p className="text-sm text-navy-400">
                            Ref: {deposit.bank_reference}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-navy-400">
                      <span>
                        Reported: {deposit.reported_at ? formatRelativeTime(deposit.reported_at) : 'N/A'}
                      </span>
                      {deposit.confirmed_at && (
                        <span>Confirmed: {formatRelativeTime(deposit.confirmed_at)}</span>
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
      </div>
    </div>
  );
}
