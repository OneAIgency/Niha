import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import type { CertificateType, OrderSide } from '../../types';

interface TradePanelProps {
  certificateType: CertificateType;
  lastPrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  selectedPrice?: number;
  onPlaceOrder: (order: {
    side: OrderSide;
    price: number;
    quantity: number;
  }) => void;
  isLoading?: boolean;
}

export function TradePanel({
  certificateType,
  lastPrice,
  bestBid,
  bestAsk,
  selectedPrice,
  onPlaceOrder,
  isLoading,
}: TradePanelProps) {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [price, setPrice] = useState<string>(selectedPrice?.toString() || '');
  const [quantity, setQuantity] = useState<string>('');

  // Update price when selectedPrice changes
  if (selectedPrice && selectedPrice.toString() !== price) {
    setPrice(selectedPrice.toString());
  }

  const priceNum = parseFloat(price) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const total = priceNum * quantityNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (priceNum > 0 && quantityNum > 0) {
      onPlaceOrder({
        side,
        price: priceNum,
        quantity: quantityNum,
      });
    }
  };

  const setMarketPrice = () => {
    if (side === 'BUY' && bestAsk) {
      setPrice(bestAsk.toString());
    } else if (side === 'SELL' && bestBid) {
      setPrice(bestBid.toString());
    }
  };

  return (
    <Card className="h-full" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white">Place Order</h3>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex border-b border-navy-200 dark:border-navy-700">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            side === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            side === 'SELL'
              ? 'bg-red-500 text-white'
              : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          SELL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Price Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-navy-600 dark:text-navy-400">
              Price (EUR)
            </label>
            <button
              type="button"
              onClick={setMarketPrice}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {side === 'BUY' ? 'Best Ask' : 'Best Bid'}
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Quantity Input */}
        <div>
          <label className="text-sm text-navy-600 dark:text-navy-400 block mb-1">
            Quantity ({certificateType})
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-navy-100 dark:border-navy-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-navy-600 dark:text-navy-400">Total</span>
            <span className="text-lg font-bold font-mono text-navy-900 dark:text-white">
              €{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={priceNum <= 0 || quantityNum <= 0 || isLoading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            side === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {isLoading ? 'Placing Order...' : `${side} ${certificateType}`}
        </motion.button>

        {/* Market Info */}
        <div className="text-xs text-navy-500 dark:text-navy-400 space-y-1">
          {lastPrice && (
            <div className="flex justify-between">
              <span>Last Price</span>
              <span className="font-mono">€{lastPrice.toFixed(2)}</span>
            </div>
          )}
          {bestBid && (
            <div className="flex justify-between">
              <span>Best Bid</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">€{bestBid.toFixed(2)}</span>
            </div>
          )}
          {bestAsk && (
            <div className="flex justify-between">
              <span>Best Ask</span>
              <span className="font-mono text-red-600 dark:text-red-400">€{bestAsk.toFixed(2)}</span>
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}
