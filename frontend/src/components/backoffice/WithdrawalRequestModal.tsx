/**
 * WithdrawalRequestModal - Client interface for requesting withdrawals
 *
 * Supports:
 * - EUR withdrawals (bank transfer)
 * - CEA/EUA withdrawals (registry transfer)
 */

import React, { useState } from 'react';
import { X, Loader2, CheckCircle, DollarSign, Landmark, Globe } from 'lucide-react';
import { AlertBanner } from '../common';
import { withdrawalApi } from '../../services/api';
import type { AssetType, WithdrawalRequest } from '../../types';

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalances: {
    eur: number;
    cea: number;
    eua: number;
  };
}

export const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableBalances,
}) => {
  const [assetType, setAssetType] = useState<AssetType>('EUR');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [internalReference, setInternalReference] = useState<string | null>(null);

  // EUR withdrawal fields
  const [destinationBank, setDestinationBank] = useState('');
  const [destinationIban, setDestinationIban] = useState('');
  const [destinationSwift, setDestinationSwift] = useState('');
  const [destinationAccountHolder, setDestinationAccountHolder] = useState('');

  // CEA/EUA withdrawal fields
  const [destinationRegistry, setDestinationRegistry] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');

  // Common fields
  const [clientNotes, setClientNotes] = useState('');

  if (!isOpen) return null;

  const getAvailableBalance = () => {
    switch (assetType) {
      case 'EUR':
        return availableBalances.eur;
      case 'CEA':
        return availableBalances.cea;
      case 'EUA':
        return availableBalances.eua;
      default:
        return 0;
    }
  };

  const formatAmount = (value: number, asset: AssetType) => {
    if (asset === 'EUR') {
      return `€${value.toLocaleString()}`;
    }
    return `${value.toLocaleString()} ${asset}`;
  };

  const validateForm = (): string | null => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return 'Please enter a valid amount';
    }
    if (numAmount > getAvailableBalance()) {
      return 'Insufficient balance';
    }

    if (assetType === 'EUR') {
      if (!destinationIban.trim()) {
        return 'IBAN is required for EUR withdrawals';
      }
    } else {
      if (!destinationRegistry.trim()) {
        return 'Registry is required for certificate transfers';
      }
      if (!destinationAccountId.trim()) {
        return 'Account ID is required for certificate transfers';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const request: WithdrawalRequest = {
        assetType: assetType,
        amount: parseFloat(amount),
        clientNotes: clientNotes || undefined,
      };

      if (assetType === 'EUR') {
        request.destinationBank = destinationBank || undefined;
        request.destinationIban = destinationIban;
        request.destinationSwift = destinationSwift || undefined;
        request.destinationAccountHolder = destinationAccountHolder || undefined;
      } else {
        request.destinationRegistry = destinationRegistry;
        request.destinationAccountId = destinationAccountId;
      }

      const result = await withdrawalApi.requestWithdrawal(request);

      if (result.success) {
        setSuccess(true);
        setInternalReference(result.internal_reference || null);
      } else {
        setError(result.error || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      setError('An error occurred while submitting the request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onSuccess();
    }
    // Reset form
    setAssetType('EUR');
    setAmount('');
    setDestinationBank('');
    setDestinationIban('');
    setDestinationSwift('');
    setDestinationAccountHolder('');
    setDestinationRegistry('');
    setDestinationAccountId('');
    setClientNotes('');
    setError(null);
    setSuccess(false);
    setInternalReference(null);
    onClose();
  };

  const setMaxAmount = () => {
    setAmount(getAvailableBalance().toString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 rounded-2xl border border-navy-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-white">Request Withdrawal</h2>
          <button onClick={handleClose} className="text-navy-400 hover:text-navy-300 rounded-xl p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Withdrawal Requested</h3>
            <p className="text-navy-400 mb-4">
              Your withdrawal request has been submitted and is pending approval.
            </p>
            {internalReference && (
              <div className="bg-navy-700/50 rounded-xl p-3 mb-4 border border-navy-600">
                <p className="text-sm text-navy-400">Reference Number</p>
                <p className="font-mono font-semibold text-white">{internalReference}</p>
              </div>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Error Alert */}
            {error && (
              <AlertBanner variant="error" message={error} />
            )}

            {/* Asset Type Selection */}
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-2">
                Asset Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EUR', 'CEA', 'EUA'] as AssetType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAssetType(type)}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      assetType === type
                        ? 'border-emerald-500 bg-emerald-500/20'
                        : 'border-navy-600 hover:border-navy-500 bg-navy-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {type === 'EUR' ? (
                        <DollarSign className="h-5 w-5 text-emerald-400" />
                      ) : type === 'CEA' ? (
                        <Landmark className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Globe className="h-5 w-5 text-blue-400" />
                      )}
                      <span className="font-medium text-white">{type}</span>
                    </div>
                    <p className="text-xs text-navy-400 mt-1">
                      Available: {formatAmount(
                        type === 'EUR' ? availableBalances.eur :
                        type === 'CEA' ? availableBalances.cea : availableBalances.eua,
                        type
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1">
                Amount
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {assetType === 'EUR' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">€</span>
                  )}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 ${assetType === 'EUR' ? 'pl-7' : ''} placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={getAvailableBalance()}
                  />
                  {assetType !== 'EUR' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                      {assetType}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="px-3 py-2 text-sm border border-navy-600 text-navy-300 rounded-xl hover:bg-navy-700 font-medium"
                >
                  Max
                </button>
              </div>
            </div>

            {/* EUR-specific fields */}
            {assetType === 'EUR' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy-300 mb-1">
                    IBAN *
                  </label>
                  <input
                    type="text"
                    value={destinationIban}
                    onChange={(e) => setDestinationIban(e.target.value.toUpperCase())}
                    className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 font-mono placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="XX00 0000 0000 0000 0000 00"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={destinationBank}
                      onChange={(e) => setDestinationBank(e.target.value)}
                      className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-300 mb-1">
                      SWIFT/BIC
                    </label>
                    <input
                      type="text"
                      value={destinationSwift}
                      onChange={(e) => setDestinationSwift(e.target.value.toUpperCase())}
                      className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 font-mono placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="XXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={destinationAccountHolder}
                    onChange={(e) => setDestinationAccountHolder(e.target.value)}
                    className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Full name as it appears on account"
                  />
                </div>
              </>
            )}

            {/* CEA/EUA-specific fields */}
            {assetType !== 'EUR' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy-300 mb-1">
                    Registry *
                  </label>
                  <input
                    type="text"
                    value={destinationRegistry}
                    onChange={(e) => setDestinationRegistry(e.target.value)}
                    className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={assetType === 'CEA' ? 'China ETS Registry' : 'EU Registry'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-300 mb-1">
                    Account ID *
                  </label>
                  <input
                    type="text"
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 font-mono placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Your registry account identifier"
                    required
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full border border-navy-600 rounded-xl bg-navy-900 text-white p-3 placeholder-navy-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                placeholder="Any additional information..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-navy-700">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Request Withdrawal
                    {amount && !isNaN(parseFloat(amount)) && (
                      <span className="text-navy-200">
                        ({formatAmount(parseFloat(amount), assetType)})
                      </span>
                    )}
                  </>
                )}
              </button>
              <p className="text-xs text-navy-400 text-center mt-2">
                Withdrawal requests are processed within 1-3 business days
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
