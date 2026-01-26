/**
 * Pending Deposits Tab Component
 * 
 * Displays and manages pending deposit requests with confirmation/rejection functionality.
 * Includes a modal for confirming deposits with actual received amounts.
 * 
 * @component
 * @example
 * ```tsx
 * <PendingDepositsTab
 *   pendingDeposits={deposits}
 *   loading={false}
 *   onConfirm={handleConfirm}
 *   onReject={handleReject}
 *   actionLoading={null}
 * />
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Clock, CheckCircle, XCircle, DollarSign, X, AlertCircle } from 'lucide-react';
import { Button, Card, Badge } from '../common';
import { formatCurrency, formatRelativeTime, cn } from '../../utils';
import type { PendingDeposit } from '../../types/backoffice';

interface PendingDepositsTabProps {
  pendingDeposits: PendingDeposit[];
  loading: boolean;
  onConfirm: (depositId: string, amount: number, currency: string, notes?: string) => Promise<void>;
  onReject: (depositId: string) => Promise<void>;
  actionLoading: string | null;
}

export function PendingDepositsTab({
  pendingDeposits,
  loading,
  onConfirm,
  onReject,
  actionLoading,
}: PendingDepositsTabProps) {
  const [confirmDepositModal, setConfirmDepositModal] = useState<PendingDeposit | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmCurrency, setConfirmCurrency] = useState('EUR');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOpenConfirmDeposit = (deposit: PendingDeposit) => {
    setConfirmDepositModal(deposit);
    // Pre-fill with reported values if available
    setConfirmAmount(deposit.reported_amount?.toString() || '');
    setConfirmCurrency(deposit.reported_currency || 'EUR');
    setConfirmNotes('');
    setValidationError(null);
  };

  const handleConfirmDeposit = async () => {
    if (!confirmDepositModal) return;

    const amount = parseFloat(confirmAmount);
    if (isNaN(amount) || amount <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

    setValidationError(null);
    try {
      await onConfirm(confirmDepositModal.id, amount, confirmCurrency, confirmNotes || undefined);
      setConfirmDepositModal(null);
      setConfirmAmount('');
      setConfirmNotes('');
    } catch (error) {
      // Error handling is done in parent component, but we can show a message here too
      setValidationError('Failed to confirm deposit. Please try again.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-navy-600 dark:text-navy-400" />
            Pending Deposits
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                  <div className="h-5 bg-navy-100 dark:bg-navy-600 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pendingDeposits.length > 0 ? (
            <div className="space-y-4">
              {pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-navy-900 dark:text-white">
                          {deposit.entity_name}
                        </h3>
                        <Badge variant="warning">PENDING</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-navy-500 dark:text-navy-400">User:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200">{deposit.user_email}</span>
                        </div>
                        <div>
                          <span className="text-navy-500 dark:text-navy-400">Reported Amount:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200 font-semibold">
                            {deposit.reported_amount ? formatCurrency(deposit.reported_amount) : 'N/A'} {deposit.reported_currency || ''}
                          </span>
                        </div>
                        {deposit.wire_reference && (
                          <div>
                            <span className="text-navy-500 dark:text-navy-400">Wire Ref:</span>
                            <span className="ml-2 text-navy-700 dark:text-navy-200 font-mono text-xs">{deposit.wire_reference}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-navy-500 dark:text-navy-400">Bank Ref:</span>
                          <span className="ml-2 text-navy-700 dark:text-navy-200 font-mono text-xs">{deposit.bank_reference}</span>
                        </div>
                      </div>
                      <p className="text-xs text-navy-400 dark:text-navy-500 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reported {deposit.reported_at ? formatRelativeTime(deposit.reported_at) : formatRelativeTime(deposit.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(deposit.id)}
                        loading={actionLoading === `reject-${deposit.id}`}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenConfirmDeposit(deposit)}
                        loading={actionLoading === `confirm-${deposit.id}`}
                      >
                        <DollarSign className="w-4 h-4" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-navy-400 mx-auto mb-4" />
              <p className="text-navy-500 dark:text-navy-400">No pending deposits</p>
              <p className="text-xs text-navy-400 mt-1">All deposits have been processed</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Deposit Confirmation Modal */}
      {confirmDepositModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700">
              <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-navy-600 dark:text-navy-400" />
                Confirm Deposit
              </h3>
              <button
                onClick={() => {
                  setConfirmDepositModal(null);
                  setConfirmAmount('');
                  setConfirmNotes('');
                }}
                className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Entity/User Info */}
              <div className="p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg">
                <p className="text-sm text-navy-500 dark:text-navy-400">Entity</p>
                <p className="font-semibold text-navy-900 dark:text-white">{confirmDepositModal.entity_name}</p>
                <p className="text-xs text-navy-400 mt-1">{confirmDepositModal.user_email}</p>
              </div>

              {/* Reported Amount (for reference) */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">Reported by User</p>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  {confirmDepositModal.reported_amount ? formatCurrency(confirmDepositModal.reported_amount) : 'N/A'} {confirmDepositModal.reported_currency || ''}
                </p>
                {confirmDepositModal.wire_reference && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-mono">
                    Wire Ref: {confirmDepositModal.wire_reference}
                  </p>
                )}
              </div>

              {/* Validation Error Display */}
              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400 flex-1">{validationError}</p>
                  <button
                    onClick={() => setValidationError(null)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Actual Amount Input */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Actual Amount Received *
                </label>
                <input
                  type="number"
                  value={confirmAmount}
                  onChange={(e) => {
                    setConfirmAmount(e.target.value);
                    setValidationError(null); // Clear error on change
                  }}
                  placeholder="Enter actual amount"
                  min="0"
                  step="0.01"
                  aria-invalid={validationError ? 'true' : 'false'}
                  aria-describedby={validationError ? 'amount-error' : undefined}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2",
                    validationError
                      ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                      : "border-navy-200 dark:border-navy-600 focus:ring-navy-500"
                  )}
                  required
                />
                {validationError && (
                  <p id="amount-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Currency Select */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Currency *
                </label>
                <select
                  value={confirmCurrency}
                  onChange={(e) => setConfirmCurrency(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="HKD">HKD</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                />
              </div>

              {/* Info about what happens */}
              <div className="p-3 bg-navy-50 dark:bg-navy-900/20 border border-navy-200 dark:border-navy-800 rounded-lg text-sm">
                <p className="text-navy-700 dark:text-navy-300">
                  Confirming this deposit will:
                </p>
                <ul className="text-navy-600 dark:text-navy-400 text-xs mt-1 list-disc list-inside">
                  <li>Update the entity balance</li>
                  <li>Upgrade the user to FUNDED status</li>
                  <li>Grant Cash Market access</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setConfirmDepositModal(null);
                    setConfirmAmount('');
                    setConfirmNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmDeposit}
                  loading={actionLoading === `confirm-${confirmDepositModal.id}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Deposit
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
