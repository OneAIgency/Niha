import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, TrendingUp, TrendingDown, ArrowLeftRight, Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { Button, NumberInput, Card } from '../common';
import { usePrices } from '../../hooks/usePrices';
import { getMarketMakers, createMarketMakerTransaction, depositEurToMarketMaker, createMarketMaker, type CreateMarketMakerRequest } from '../../services/api';
import { cn } from '../../utils';
import type { MarketMaker, MarketMakerType } from '../../types';

interface CreateMarketMakersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RefundConfig {
  mmId: string | null;
  mmName: string;
  mmType: MarketMakerType;
  eurValue: string;
  calculatedAmount: number;
  currentBalance: number;
  isProcessing: boolean;
  isDone: boolean;
  error: string | null;
}

const initialConfig = (mmType: MarketMakerType, mmName: string): RefundConfig => ({
  mmId: null,
  mmName,
  mmType,
  eurValue: '1000000000',
  calculatedAmount: 0,
  currentBalance: 0,
  isProcessing: false,
  isDone: false,
  error: null,
});

export function CreateMarketMakersModal({ isOpen, onClose, onSuccess }: CreateMarketMakersModalProps) {
  const { prices, loading: pricesLoading } = usePrices();
  const [loading, setLoading] = useState(true);
  const [_existingMMs, setExistingMMs] = useState<MarketMaker[]>([]);

  const [ceaBuyer, setCeaBuyer] = useState<RefundConfig>(initialConfig('CEA_BUYER', 'CEA Buyer'));
  const [ceaSeller, setCeaSeller] = useState<RefundConfig>(initialConfig('CEA_SELLER', 'CEA Seller'));
  const [swapper, setSwapper] = useState<RefundConfig>(initialConfig('EUA_OFFER', 'Swapper'));

  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Get prices from scraping
  const ceaPrice = prices?.cea?.price ?? 0;
  const euaPrice = prices?.eua?.price ?? 0;

  // Load existing market makers on open
  useEffect(() => {
    if (isOpen) {
      loadExistingMMs();
    }
  }, [isOpen]);

  // Recalculate amounts when prices change
  useEffect(() => {
    if (ceaPrice > 0 && euaPrice > 0) {
      const defaultValue = 1000000000;
      setCeaBuyer(prev => ({
        ...prev,
        calculatedAmount: defaultValue, // CEA Buyer uses EUR directly
      }));
      setCeaSeller(prev => ({
        ...prev,
        calculatedAmount: Math.floor(defaultValue / ceaPrice),
      }));
      setSwapper(prev => ({
        ...prev,
        calculatedAmount: Math.floor(defaultValue / euaPrice),
      }));
    }
  }, [ceaPrice, euaPrice]);

  const loadExistingMMs = async () => {
    setLoading(true);
    try {
      const mms = await getMarketMakers();
      setExistingMMs(mms);

      // Find existing MMs by type and update state
      const buyer = mms.find(mm => mm.mmType === 'CEA_BUYER');
      const seller = mms.find(mm => mm.mmType === 'CEA_SELLER');
      const swap = mms.find(mm => mm.mmType === 'EUA_OFFER');

      if (buyer) {
        setCeaBuyer(prev => ({
          ...prev,
          mmId: buyer.id,
          mmName: buyer.name,
          currentBalance: buyer.eurBalance || 0,
        }));
      }
      if (seller) {
        setCeaSeller(prev => ({
          ...prev,
          mmId: seller.id,
          mmName: seller.name,
          currentBalance: seller.ceaBalance || 0,
        }));
      }
      if (swap) {
        setSwapper(prev => ({
          ...prev,
          mmId: swap.id,
          mmName: swap.name,
          currentBalance: swap.euaBalance || 0,
        }));
      }
    } catch (err) {
      console.error('Failed to load market makers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate quantities from EUR value
  const calculateCeaFromEur = (eurValue: number): number => {
    if (!ceaPrice || ceaPrice <= 0) return 0;
    return Math.floor(eurValue / ceaPrice);
  };

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

  // Process a single MM (create if doesn't exist, or deposit if exists)
  const processSingleMM = async (
    config: RefundConfig,
    setConfig: React.Dispatch<React.SetStateAction<RefundConfig>>,
  ): Promise<boolean> => {
    if (config.isDone || !config.eurValue) return true;

    setConfig(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      if (config.mmId) {
        // MM exists - create deposit transaction
        if (config.mmType === 'CEA_BUYER') {
          // Deposit EUR (uses dedicated EUR endpoint)
          await depositEurToMarketMaker(
            config.mmId,
            parseFloat(config.eurValue),
            'Refund via admin panel'
          );
        } else if (config.mmType === 'CEA_SELLER') {
          // Deposit CEA
          await createMarketMakerTransaction(config.mmId, {
            certificate_type: 'CEA',
            transaction_type: 'DEPOSIT',
            amount: config.calculatedAmount,
            notes: 'Refund via admin panel',
          });
        } else if (config.mmType === 'EUA_OFFER') {
          // Deposit EUA
          await createMarketMakerTransaction(config.mmId, {
            certificate_type: 'EUA',
            transaction_type: 'DEPOSIT',
            amount: config.calculatedAmount,
            notes: 'Refund via admin panel',
          });
        }
      } else {
        // MM doesn't exist - create new one
        const request: CreateMarketMakerRequest = {
          name: `Market Maker ${config.mmName}`,
          email: `mm-${config.mmName.toLowerCase().replace(/\s+/g, '-')}@niha.com`,
          description: `Auto-created ${config.mmType} market maker`,
          mm_type: config.mmType,
        };

        if (config.mmType === 'CEA_BUYER') {
          request.initial_eur_balance = parseFloat(config.eurValue);
        } else if (config.mmType === 'CEA_SELLER') {
          request.cea_balance = config.calculatedAmount;
        } else if (config.mmType === 'EUA_OFFER') {
          request.eua_balance = config.calculatedAmount;
        }

        await createMarketMaker(request);
      }

      setConfig(prev => ({
        ...prev,
        isProcessing: false,
        isDone: true,
      }));

      return true;
    } catch (err) {
      let errorMessage = 'Operation failed';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      setConfig(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // Process all market makers
  const handleProcessAll = async () => {
    setIsProcessingAll(true);

    const buyerSuccess = await processSingleMM(ceaBuyer, setCeaBuyer);
    const sellerSuccess = await processSingleMM(ceaSeller, setCeaSeller);
    const swapperSuccess = await processSingleMM(swapper, setSwapper);

    setIsProcessingAll(false);

    if (buyerSuccess && sellerSuccess && swapperSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const allHaveValues = ceaBuyer.eurValue && ceaSeller.eurValue && swapper.eurValue;
  const allDone = ceaBuyer.isDone && ceaSeller.isDone && swapper.isDone;
  const anyProcessing = ceaBuyer.isProcessing || ceaSeller.isProcessing || swapper.isProcessing;

  // Check if we're in "create" or "refund" mode
  const hasExistingMMs = ceaBuyer.mmId || ceaSeller.mmId || swapper.mmId;
  const actionLabel = hasExistingMMs ? 'Refund' : 'Create';

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
              {hasExistingMMs ? (
                <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              ) : (
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {hasExistingMMs ? 'Refund Market Makers' : 'Create Market Makers'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasExistingMMs
                  ? 'Add funds to existing market makers'
                  : 'Create 3 market makers with initial deposits'}
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
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* CEA Buyer */}
            <Card className={cn(
              "p-4 transition-all",
              ceaBuyer.isDone && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
            )}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        CEA Buyer
                        {ceaBuyer.mmId && (
                          <span className="ml-2 text-xs font-normal text-gray-500">({ceaBuyer.mmName})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Buys CEA certificates with EUR
                        {ceaBuyer.mmId && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                            Current: €{ceaBuyer.currentBalance.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                    {ceaBuyer.isDone && (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{ceaBuyer.mmId ? 'Refunded' : 'Created'}</span>
                      </div>
                    )}
                    {ceaBuyer.isProcessing && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    )}
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <NumberInput
                        label="EUR to Deposit"
                        value={ceaBuyer.eurValue}
                        onChange={handleCeaBuyerEurChange}
                        placeholder="Enter EUR amount"
                        suffix="EUR"
                        decimals={2}
                        disabled={ceaBuyer.isDone || ceaBuyer.isProcessing}
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
              ceaSeller.isDone && "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
            )}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        CEA Seller
                        {ceaSeller.mmId && (
                          <span className="ml-2 text-xs font-normal text-gray-500">({ceaSeller.mmName})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sells CEA certificates for EUR
                        {ceaSeller.mmId && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            Current: {ceaSeller.currentBalance.toLocaleString()} CEA
                          </span>
                        )}
                      </p>
                    </div>
                    {ceaSeller.isDone && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{ceaSeller.mmId ? 'Refunded' : 'Created'}</span>
                      </div>
                    )}
                    {ceaSeller.isProcessing && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    )}
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
                        disabled={ceaSeller.isDone || ceaSeller.isProcessing}
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
              swapper.isDone && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
            )}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ArrowLeftRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Swapper (EUA Offer)
                        {swapper.mmId && (
                          <span className="ml-2 text-xs font-normal text-gray-500">({swapper.mmName})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Offers EUA in exchange for CEA
                        {swapper.mmId && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            Current: {swapper.currentBalance.toLocaleString()} EUA
                          </span>
                        )}
                      </p>
                    </div>
                    {swapper.isDone && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{swapper.mmId ? 'Refunded' : 'Created'}</span>
                      </div>
                    )}
                    {swapper.isProcessing && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    )}
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
                        disabled={swapper.isDone || swapper.isProcessing}
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
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {allDone ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                All market makers {hasExistingMMs ? 'refunded' : 'created'} successfully!
              </span>
            ) : (
              `Enter amounts to ${hasExistingMMs ? 'refund' : 'create'} market makers.`
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={anyProcessing}
            >
              {allDone ? 'Close' : 'Cancel'}
            </Button>
            {!allDone && (
              <Button
                variant="primary"
                onClick={handleProcessAll}
                disabled={!allHaveValues || anyProcessing || isProcessingAll || loading}
                icon={isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              >
                {isProcessingAll ? 'Processing...' : `${actionLabel} All Market Makers`}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
