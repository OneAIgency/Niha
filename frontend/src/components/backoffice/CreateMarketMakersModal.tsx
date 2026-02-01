import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, TrendingUp, TrendingDown, ArrowLeftRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, NumberInput, Card } from '../common';
import { usePrices } from '../../hooks/usePrices';
import { createMarketMaker, type CreateMarketMakerRequest } from '../../services/api';
import { cn } from '../../utils';

interface CreateMarketMakersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MarketMakerConfig {
  name: string;
  email: string;
  eurValue: string;
  calculatedAmount: number;
  isCreating: boolean;
  isCreated: boolean;
  error: string | null;
  ticketId: string | null;
}

const initialConfig = (suffix: string): MarketMakerConfig => ({
  name: `Market Maker ${suffix}`,
  email: `mm-${suffix.toLowerCase().replace(' ', '-')}@niha.com`,
  eurValue: '',
  calculatedAmount: 0,
  isCreating: false,
  isCreated: false,
  error: null,
  ticketId: null,
});

export function CreateMarketMakersModal({ isOpen, onClose, onSuccess }: CreateMarketMakersModalProps) {
  const { prices, loading: pricesLoading } = usePrices();

  const [ceaBuyer, setCeaBuyer] = useState<MarketMakerConfig>(initialConfig('CEA Buyer'));
  const [ceaSeller, setCeaSeller] = useState<MarketMakerConfig>(initialConfig('CEA Seller'));
  const [swapper, setSwapper] = useState<MarketMakerConfig>(initialConfig('Swapper'));

  const [isCreatingAll, setIsCreatingAll] = useState(false);

  // Get prices from scraping - prices.cea and prices.eua are PriceData objects
  const ceaPrice = prices?.cea?.price ?? 0;
  const euaPrice = prices?.eua?.price ?? 0;

  // Calculate CEA quantity from EUR value
  const calculateCeaFromEur = (eurValue: number): number => {
    if (!ceaPrice || ceaPrice <= 0) return 0;
    return Math.floor(eurValue / ceaPrice);
  };

  // Calculate EUA quantity from EUR value
  const calculateEuaFromEur = (eurValue: number): number => {
    if (!euaPrice || euaPrice <= 0) return 0;
    return Math.floor(eurValue / euaPrice);
  };

  // Handle EUR input changes
  const handleCeaBuyerEurChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCeaBuyer(prev => ({
      ...prev,
      eurValue: value,
      calculatedAmount: numValue, // CEA Buyer uses EUR directly
    }));
  };

  const handleCeaSellerEurChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCeaSeller(prev => ({
      ...prev,
      eurValue: value,
      calculatedAmount: calculateCeaFromEur(numValue),
    }));
  };

  const handleSwapperEurChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSwapper(prev => ({
      ...prev,
      eurValue: value,
      calculatedAmount: calculateEuaFromEur(numValue),
    }));
  };

  // Create a single market maker
  const createSingleMM = async (
    config: MarketMakerConfig,
    setConfig: React.Dispatch<React.SetStateAction<MarketMakerConfig>>,
    mmType: 'CEA_BUYER' | 'CEA_SELLER' | 'EUA_OFFER'
  ): Promise<boolean> => {
    if (config.isCreated || !config.eurValue) return true;

    setConfig(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const request: CreateMarketMakerRequest = {
        name: config.name,
        email: config.email,
        description: `Auto-created ${mmType} market maker`,
        mm_type: mmType,
      };

      // Set appropriate balances based on MM type
      if (mmType === 'CEA_BUYER') {
        request.initial_eur_balance = parseFloat(config.eurValue);
      } else if (mmType === 'CEA_SELLER') {
        request.cea_balance = config.calculatedAmount;
      } else if (mmType === 'EUA_OFFER') {
        request.eua_balance = config.calculatedAmount;
      }

      const result = await createMarketMaker(request);

      setConfig(prev => ({
        ...prev,
        isCreating: false,
        isCreated: true,
        ticketId: result.ticket_id || null,
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create market maker';
      setConfig(prev => ({
        ...prev,
        isCreating: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // Create all market makers
  const handleCreateAll = async () => {
    setIsCreatingAll(true);

    // Create CEA Buyer
    const buyerSuccess = await createSingleMM(ceaBuyer, setCeaBuyer, 'CEA_BUYER');

    // Create CEA Seller
    const sellerSuccess = await createSingleMM(ceaSeller, setCeaSeller, 'CEA_SELLER');

    // Create Swapper (EUA_OFFER)
    const swapperSuccess = await createSingleMM(swapper, setSwapper, 'EUA_OFFER');

    setIsCreatingAll(false);

    // If all succeeded, call onSuccess
    if (buyerSuccess && sellerSuccess && swapperSuccess) {
      // Small delay to show success states
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const allHaveValues = ceaBuyer.eurValue && ceaSeller.eurValue && swapper.eurValue;
  const allCreated = ceaBuyer.isCreated && ceaSeller.isCreated && swapper.isCreated;
  const anyCreating = ceaBuyer.isCreating || ceaSeller.isCreating || swapper.isCreating;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Market Makers
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create 3 market makers with automatic deposits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Price Info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current Prices:</span>
            {pricesLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <>
                <span className="font-medium">
                  CEA: <span className="text-emerald-600 dark:text-emerald-400">€{ceaPrice.toFixed(2)}</span>
                </span>
                <span className="font-medium">
                  EUA: <span className="text-blue-600 dark:text-blue-400">€{euaPrice.toFixed(2)}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* CEA Buyer */}
          <Card className={cn(
            "p-4 transition-all",
            ceaBuyer.isCreated && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
          )}>
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                ceaBuyer.isCreated
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-emerald-100 dark:bg-emerald-900/30"
              )}>
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">CEA Buyer</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Buys CEA certificates with EUR
                    </p>
                  </div>
                  {ceaBuyer.isCreated && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Created</span>
                    </div>
                  )}
                  {ceaBuyer.isCreating && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={ceaBuyer.name}
                    onChange={(e) => setCeaBuyer(prev => ({ ...prev, name: e.target.value }))}
                    disabled={ceaBuyer.isCreated || ceaBuyer.isCreating}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={ceaBuyer.email}
                    onChange={(e) => setCeaBuyer(prev => ({ ...prev, email: e.target.value }))}
                    disabled={ceaBuyer.isCreated || ceaBuyer.isCreating}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <NumberInput
                      label="EUR Balance"
                      value={ceaBuyer.eurValue}
                      onChange={handleCeaBuyerEurChange}
                      placeholder="Enter EUR amount"
                      suffix="EUR"
                      decimals={2}
                      disabled={ceaBuyer.isCreated || ceaBuyer.isCreating}
                    />
                  </div>
                  <div className="pb-1 text-sm text-gray-500 dark:text-gray-400">
                    Available to buy CEA
                  </div>
                </div>

                {ceaBuyer.error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {ceaBuyer.error}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* CEA Seller */}
          <Card className={cn(
            "p-4 transition-all",
            ceaSeller.isCreated && "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
          )}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">CEA Seller</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sells CEA certificates for EUR
                    </p>
                  </div>
                  {ceaSeller.isCreated && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Created</span>
                    </div>
                  )}
                  {ceaSeller.isCreating && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={ceaSeller.name}
                    onChange={(e) => setCeaSeller(prev => ({ ...prev, name: e.target.value }))}
                    disabled={ceaSeller.isCreated || ceaSeller.isCreating}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={ceaSeller.email}
                    onChange={(e) => setCeaSeller(prev => ({ ...prev, email: e.target.value }))}
                    disabled={ceaSeller.isCreated || ceaSeller.isCreating}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <NumberInput
                      label="EUR Value of CEA"
                      value={ceaSeller.eurValue}
                      onChange={handleCeaSellerEurChange}
                      placeholder="Enter EUR value"
                      suffix="EUR"
                      decimals={2}
                      disabled={ceaSeller.isCreated || ceaSeller.isCreating}
                    />
                  </div>
                  <div className="pb-1 min-w-[120px]">
                    <div className="text-sm text-gray-500 dark:text-gray-400">CEA to deposit:</div>
                    <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {ceaSeller.calculatedAmount.toLocaleString()} CEA
                    </div>
                  </div>
                </div>

                {ceaSeller.error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {ceaSeller.error}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Swapper (EUA_OFFER) */}
          <Card className={cn(
            "p-4 transition-all",
            swapper.isCreated && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
          )}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ArrowLeftRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Swapper (EUA Offer)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Offers EUA in exchange for CEA
                    </p>
                  </div>
                  {swapper.isCreated && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Created</span>
                    </div>
                  )}
                  {swapper.isCreating && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={swapper.name}
                    onChange={(e) => setSwapper(prev => ({ ...prev, name: e.target.value }))}
                    disabled={swapper.isCreated || swapper.isCreating}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={swapper.email}
                    onChange={(e) => setSwapper(prev => ({ ...prev, email: e.target.value }))}
                    disabled={swapper.isCreated || swapper.isCreating}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <NumberInput
                      label="EUR Value of EUA"
                      value={swapper.eurValue}
                      onChange={handleSwapperEurChange}
                      placeholder="Enter EUR value"
                      suffix="EUR"
                      decimals={2}
                      disabled={swapper.isCreated || swapper.isCreating}
                    />
                  </div>
                  <div className="pb-1 min-w-[120px]">
                    <div className="text-sm text-gray-500 dark:text-gray-400">EUA to deposit:</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {swapper.calculatedAmount.toLocaleString()} EUA
                    </div>
                  </div>
                </div>

                {swapper.error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {swapper.error}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {allCreated ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                All market makers created successfully!
              </span>
            ) : (
              'All fields required. Deposits will be created automatically.'
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={anyCreating}
            >
              {allCreated ? 'Close' : 'Cancel'}
            </Button>
            {!allCreated && (
              <Button
                variant="primary"
                onClick={handleCreateAll}
                disabled={!allHaveValues || anyCreating || isCreatingAll}
                icon={isCreatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              >
                {isCreatingAll ? 'Creating...' : 'Create All Market Makers'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
