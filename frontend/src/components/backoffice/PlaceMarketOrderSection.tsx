import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button, NumberInput, AlertBanner } from '../common';
import { getMarketMakers, getMarketMakerBalances, placeMarketMakerOrder } from '../../services/api';
import type { CertificateType } from '../../types';
import { MarketMakerOrdersList } from './MarketMakerOrdersList';

interface PlaceMarketOrderSectionProps {
  certificateType: CertificateType;
  onOrderPlaced: () => void;
  hideOrdersList?: boolean;
  compact?: boolean;
}

interface MarketMaker {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  ceaBalance: number;
  euaBalance: number;
  mmType?: string;
}

export function PlaceMarketOrderSection({
  certificateType,
  onOrderPlaced,
  hideOrdersList = false,
  compact = false,
}: PlaceMarketOrderSectionProps) {
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [selectedMM, setSelectedMM] = useState<string>('');
  const [mmBalance, setMmBalance] = useState<{ ceaBalance: number; euaBalance: number } | null>(
    null
  );
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMMs, setLoadingMMs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load market makers (only CEA cash sellers with available CEA balance)
  useEffect(() => {
    const loadMMs = async () => {
      setLoadingMMs(true);
      try {
        const data = await getMarketMakers({ is_active: true });
        // Filter only CEA cash sellers with CEA balance > 0
        const ceaCashSellers = data.filter((mm: MarketMaker) => 
          mm.mmType === 'CEA_SELLER' && mm.ceaBalance > 0
        );
        setMarketMakers(ceaCashSellers);
      } catch (err) {
        console.error('Failed to load market makers:', err);
        setError('Failed to load market makers');
      } finally {
        setLoadingMMs(false);
      }
    };
    loadMMs();
  }, []);

  // Load selected MM balance
  useEffect(() => {
    if (selectedMM) {
      const loadBalance = async () => {
        try {
          const data = await getMarketMakerBalances(selectedMM);
          setMmBalance(data);
        } catch (err) {
          console.error('Failed to load balance:', err);
        }
      };
      loadBalance();
    } else {
      setMmBalance(null);
    }
  }, [selectedMM]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate inputs
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (!selectedMM) {
      setError('Please select a market maker');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // Check balance
    if (mmBalance) {
      const balance = certificateType === 'CEA' ? mmBalance.ceaBalance : mmBalance.euaBalance;
      if (quantityNum > balance) {
        setError(`Insufficient balance. Available: ${balance.toLocaleString()} ${certificateType}`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await placeMarketMakerOrder({
        market_maker_id: selectedMM,
        certificate_type: certificateType,
        side: 'ASK', // Selling certificates (market maker providing liquidity)
        price: priceNum,
        quantity: quantityNum,
      });

      // Show success with ticketId
      const ticketId = response.data?.ticketId || 'N/A';
      setSuccess(`Order placed successfully! Ticket ID: ${ticketId}`);

      // Reset form
      setPrice('');
      setQuantity('');

      // Reload balance
      const updatedBalance = await getMarketMakerBalances(selectedMM);
      setMmBalance(updatedBalance);

      // Notify parent
      onOrderPlaced();

      // Clear success after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Failed to place order:', err);
      setError(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const selectedMMData = marketMakers.find(mm => mm.id === selectedMM);
  const availableBalance = mmBalance
    ? certificateType === 'CEA'
      ? mmBalance.ceaBalance
      : mmBalance.euaBalance
    : 0;

  return (
    <div className={compact ? '' : 'space-y-6'}>
      <Card padding={compact ? 'none' : 'md'} className={compact ? 'border-0 shadow-none bg-transparent' : ''}>
        {!compact && (
          <h3 className={`${compact ? 'text-base mb-3' : 'text-lg mb-4'} font-semibold text-navy-900 dark:text-white`}>
            Place Sell Order
          </h3>
        )}

        <form onSubmit={handleSubmit} className={compact ? 'p-6 space-y-5' : 'space-y-4'}>
          {/* Market Maker Selection */}
          <div>
            <label className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 ${compact ? 'mb-2' : 'mb-2'}`}>
              Market Maker *
            </label>
            {loadingMMs ? (
              <div className="flex items-center gap-2 text-navy-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading market makers...
              </div>
            ) : (
              <select
                value={selectedMM}
                onChange={(e) => setSelectedMM(e.target.value)}
                className={`w-full ${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 ${compact ? 'bg-white dark:bg-navy-900' : 'bg-white dark:bg-navy-800'} text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              >
                <option value="">Select a market maker</option>
                {marketMakers.map((mm) => (
                  <option key={mm.id} value={mm.id}>
                    {mm.name} - {Number(mm.ceaBalance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CEA available
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Available Balance */}
          {selectedMMData && mmBalance && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${compact ? 'p-2.5' : 'p-4'} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Available {certificateType} Balance
                </span>
                <span className={`${compact ? 'text-base' : 'text-lg'} font-bold font-mono text-emerald-900 dark:text-emerald-100`}>
                  {availableBalance.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Certificate Type (Read-only) */}
          <div>
            <label className={`block text-sm ${compact ? 'font-semibold' : 'font-medium'} text-navy-700 dark:text-navy-300 ${compact ? 'mb-2' : 'mb-2'}`}>
              Certificate Type
            </label>
            <div className={`${compact ? 'px-4 py-2.5' : 'px-4 py-2.5'} rounded-lg border border-navy-200 dark:border-navy-600 bg-navy-50 dark:bg-navy-700/50 text-navy-900 dark:text-white font-semibold`}>
              {certificateType}
            </div>
          </div>

          {/* Price */}
          <div>
            <NumberInput
              label="Price (EUR) *"
              value={price}
              onChange={setPrice}
              placeholder="0.0"
              suffix="EUR"
              decimals={2}
            />
          </div>

          {/* Quantity */}
          <div>
            <NumberInput
              label={`Quantity (${certificateType}) *`}
              value={quantity}
              onChange={setQuantity}
              placeholder="0"
              suffix={certificateType}
              decimals={0}
            />
          </div>

          {/* Error Message */}
          {error && (
            <AlertBanner variant="error" message={error} />
          )}

          {/* Success Message */}
          {success && (
            <AlertBanner variant="success" message={success} />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={!selectedMM || loading}
            icon={<ArrowUpRight className="w-4 h-4" />}
          >
            Place Sell Order
          </Button>
        </form>
      </Card>

      {/* Orders List */}
      {!hideOrdersList && <MarketMakerOrdersList certificateType={certificateType} />}
    </div>
  );
}
