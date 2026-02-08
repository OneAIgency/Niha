import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface TradeDetails {
  certificateType: string;
  side: string;
  amountEur: number;
  estimatedQuantity: number;
  avgPrice: number;
  levelsUsed: number;
  bestPrice: number | null;
  worstPrice: number | null;
  platformFeeRate: number | null;
  platformFeeAmount: number | null;
  totalCostGross: number | null;
  totalCostNet: number | null;
  remainingBalance: number | null;
  partialFill: boolean;
}

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trade: TradeDetails | null;
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

const fmt = (num: number | null | undefined, decimals = 2) => {
  if (num === null || num === undefined) return '—';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

export function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  trade,
}: TradeConfirmationModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsExecuting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!trade) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(
        apiErr?.response?.data?.detail ||
          (err as Error)?.message ||
          'Order execution failed. Please try again.'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const hasFee = trade.platformFeeAmount != null && trade.platformFeeAmount > 0;
  const hasSlippage =
    trade.bestPrice != null &&
    trade.worstPrice != null &&
    trade.bestPrice !== trade.worstPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={false}>
      {/* Header */}
      <Modal.Header onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-900/30 border border-emerald-800/30">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Confirm Market Order
            </h2>
            <p className="text-xs text-navy-400 mt-0.5">
              Review details before executing
            </p>
          </div>
        </div>
      </Modal.Header>

      {/* Body */}
      <Modal.Body className="space-y-4">
        {/* Trade Summary Card */}
        <div className="rounded-lg bg-navy-900/60 border border-navy-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-navy-400 uppercase tracking-wider">
              Order Summary
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
              <TrendingUp className="w-3 h-3" />
              BUY
            </span>
          </div>

          {/* Main figures */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-navy-500 mb-0.5">You spend</div>
              <div className="font-mono font-bold text-lg text-white tabular-nums">
                €{fmt(trade.amountEur)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-navy-500 mb-0.5">You receive</div>
              <div className="font-mono font-bold text-lg text-emerald-400 tabular-nums">
                ~{fmt(trade.estimatedQuantity, 0)} {trade.certificateType}
              </div>
            </div>
          </div>

          <div className="h-px bg-navy-700 my-3" />

          {/* Detail rows */}
          <div className="space-y-2">
            <DetailRow
              label="Avg. Price"
              value={`€${fmt(trade.avgPrice)} / ${trade.certificateType}`}
              highlight
            />
            {hasSlippage && (
              <DetailRow
                label="Price Range"
                value={`€${fmt(trade.bestPrice)} – €${fmt(trade.worstPrice)}`}
              />
            )}
            <DetailRow
              label="Price Levels"
              value={`${trade.levelsUsed} level${trade.levelsUsed !== 1 ? 's' : ''}`}
            />

            {hasFee && (
              <>
                <div className="h-px bg-navy-700/50 my-1" />
                <DetailRow
                  label="Subtotal"
                  value={`€${fmt(trade.totalCostGross)}`}
                />
                <DetailRow
                  label={`Platform Fee (${trade.platformFeeRate != null ? (trade.platformFeeRate * 100).toFixed(2) : '—'}%)`}
                  value={`€${fmt(trade.platformFeeAmount)}`}
                  muted
                />
                <DetailRow
                  label="Total Cost"
                  value={`€${fmt(trade.totalCostNet)}`}
                  highlight
                  bold
                />
              </>
            )}

            {trade.remainingBalance != null && (
              <DetailRow
                label="Balance After"
                value={`€${fmt(trade.remainingBalance)}`}
              />
            )}
          </div>
        </div>

        {/* Partial fill warning */}
        {trade.partialFill && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-900/15 border border-amber-800/30"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Partial Fill</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Insufficient liquidity for full amount. Order will be partially filled.
              </p>
            </div>
          </motion.div>
        )}

        {/* Execution error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-red-900/15 border border-red-800/30"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-300">Execution Failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Settlement notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-900/10 border border-blue-800/20">
          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-300">T+3 Settlement</p>
            <p className="text-xs text-blue-400/70 mt-0.5">
              {trade.certificateType} certificates will be delivered within 3 business days.
            </p>
          </div>
        </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isExecuting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isExecuting}
          className="min-w-[140px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-0"
        >
          {isExecuting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Confirm Order
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─────────────────────────────────────────────────
// Sub-component
// ─────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  highlight,
  bold,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className={muted ? 'text-navy-500' : 'text-navy-400'}>{label}</span>
      <span
        className={`font-mono tabular-nums ${
          bold
            ? 'font-bold text-white'
            : highlight
              ? 'font-semibold text-amber-400'
              : muted
                ? 'text-navy-500'
                : 'text-navy-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
