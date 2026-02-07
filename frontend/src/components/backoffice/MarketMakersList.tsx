import { useState, useEffect } from 'react';
import { DataTable, Badge, Card, type Column } from '../common';
import { CheckCircle, XCircle, Leaf, Wind, Activity, Wallet, TrendingUp, Lock } from 'lucide-react';
import { formatCertificateQuantity, formatCurrency } from '../../utils';
import { usePrices } from '../../hooks/usePrices';
import { getMarketMakerBalances } from '../../services/api';
import type { MarketMaker } from '../../types';
import { MARKETS, MARKET_MAKER_TYPES } from '../../types';

interface MarketMakersListProps {
  marketMakers: MarketMaker[];
  loading: boolean;
  onSelectMM: (mm: MarketMaker) => void;
}

interface DetailedBalances {
  [marketMakerId: string]: {
    eur: { available: number; locked: number; total: number };
    cea: { available: number; locked: number; total: number };
    eua: { available: number; locked: number; total: number };
  };
}

export function MarketMakersList({ marketMakers, loading, onSelectMM }: MarketMakersListProps) {
  const { prices } = usePrices();
  const [detailedBalances, setDetailedBalances] = useState<DetailedBalances>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Fetch detailed balances for all market makers
  useEffect(() => {
    const fetchAllBalances = async () => {
      if (marketMakers.length === 0) return;

      setLoadingBalances(true);
      const balances: DetailedBalances = {};

      await Promise.all(
        marketMakers.map(async (mm) => {
          try {
            const data = await getMarketMakerBalances(mm.id);
            balances[mm.id] = {
              eur: { available: data.eurAvailable, locked: data.eurLocked, total: data.eurBalance },
              cea: { available: data.ceaAvailable, locked: data.ceaLocked, total: data.ceaBalance },
              eua: { available: data.euaAvailable, locked: data.euaLocked, total: data.euaBalance },
            };
          } catch (err) {
            // Fallback to total balances if fetch fails
            balances[mm.id] = {
              eur: { available: mm.eurBalance, locked: 0, total: mm.eurBalance },
              cea: { available: mm.ceaBalance, locked: 0, total: mm.ceaBalance },
              eua: { available: mm.euaBalance, locked: 0, total: mm.euaBalance },
            };
          }
        })
      );

      setDetailedBalances(balances);
      setLoadingBalances(false);
    };

    fetchAllBalances();
  }, [marketMakers]);

  const getBalance = (mmId: string, type: 'eur' | 'cea' | 'eua') => {
    return detailedBalances[mmId]?.[type] || { available: 0, locked: 0, total: 0 };
  };

  const columns: Column<MarketMaker>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (value, row) => (
        <div>
          <div className="font-medium text-navy-900 dark:text-white">{String(value)}</div>
          {row.description && (
            <div className="text-xs text-navy-500 dark:text-navy-400">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'market',
      header: 'Market',
      width: '15%',
      align: 'center',
      render: (_, row) => {
        // Compute market from mmType
        const market = MARKET_MAKER_TYPES[row.mmType].market;
        const marketInfo = MARKETS[market];
        const color = market === 'CEA_CASH' ? 'emerald' : 'blue';
        return (
          <Badge variant={color}>
            {marketInfo.name}
          </Badge>
        );
      },
    },
    {
      key: 'mmType',
      header: 'Role',
      width: '15%',
      align: 'center',
      render: (_, row) => {
        const info = MARKET_MAKER_TYPES[row.mmType];
        return (
          <Badge variant={info.color as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
            {info.name}
          </Badge>
        );
      },
    },
    {
      key: 'balance',
      header: 'Available Balance',
      width: '22%',
      align: 'right',
      render: (_, row) => {
        const eurBal = getBalance(row.id, 'eur');
        const ceaBal = getBalance(row.id, 'cea');
        const euaBal = getBalance(row.id, 'eua');

        if (row.mmType === 'CEA_BUYER') {
          return (
            <div className="text-right">
              {/* Available - Highlighted */}
              <div className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {loadingBalances ? '...' : formatCurrency(eurBal.available, 'EUR')}
              </div>
              {/* Initial & Locked - Secondary, stacked */}
              {!loadingBalances && eurBal.locked > 0 && (
                <div className="mt-1 text-xs text-navy-500 dark:text-navy-400 space-y-0.5">
                  <div>Initial: {formatCurrency(eurBal.total, 'EUR')}</div>
                  <div className="flex items-center justify-end gap-1">
                    <Lock className="w-3 h-3" />
                    {formatCurrency(eurBal.locked, 'EUR')}
                  </div>
                </div>
              )}
            </div>
          );
        } else if (row.mmType === 'CEA_SELLER') {
          const ceaAvailableValue = ceaBal.available * (prices?.cea?.price || 0);
          const ceaSold = ceaBal.total - ceaBal.available;
          const ceaSoldValue = ceaSold * (prices?.cea?.price || 0);
          return (
            <div className="text-right">
              {/* Available CEA - Highlighted */}
              <div className="flex items-center justify-end gap-2">
                <Leaf className="w-4 h-4 text-amber-500" />
                <span className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                  {loadingBalances ? '...' : formatCertificateQuantity(ceaBal.available)} CEA
                </span>
              </div>
              {/* EUR Value of Available CEA */}
              {!loadingBalances && (
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(ceaAvailableValue, 'EUR')}
                </div>
              )}
              {/* CEA Sold with value */}
              {!loadingBalances && ceaSold > 0 && (
                <div className="mt-1 text-xs text-navy-500 dark:text-navy-400 space-y-0.5">
                  <div>Sold: {formatCertificateQuantity(ceaSold)} CEA</div>
                  <div className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(ceaSoldValue, 'EUR')}
                  </div>
                </div>
              )}
            </div>
          );
        } else { // EUA_OFFER
          const euaAvailableValue = euaBal.available * (prices?.eua?.price || 0);
          return (
            <div className="text-right">
              {/* EUA Available - Highlighted */}
              <div className="flex items-center justify-end gap-2">
                <Wind className="w-4 h-4 text-blue-500" />
                <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                  {loadingBalances ? '...' : formatCertificateQuantity(euaBal.available)} EUA
                </span>
              </div>
              {/* EUR Value of Available EUA */}
              {!loadingBalances && (
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(euaAvailableValue, 'EUR')}
                </div>
              )}
            </div>
          );
        }
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '10%',
      align: 'center',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Inactive
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      width: '8%',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-navy-400" />
          <span className="font-semibold text-navy-900 dark:text-white">
            {(value as number) || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: '10%',
      render: (value) => (
        <span className="text-sm text-navy-600 dark:text-navy-300 line-clamp-2">
          {(value as string) || '-'}
        </span>
      ),
    },
  ];

  // Calculate totals using available balances
  const getTotalAvailable = (type: 'eur' | 'cea' | 'eua', filterFn?: (mm: MarketMaker) => boolean) => {
    return marketMakers
      .filter(filterFn || (() => true))
      .reduce((sum, mm) => sum + (detailedBalances[mm.id]?.[type]?.available || 0), 0);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6">
        Market Makers ({marketMakers.length})
      </h2>
      <DataTable
        columns={columns}
        data={marketMakers}
        loading={loading}
        loadingRows={5}
        emptyMessage="No market makers found. Create one to get started."
        onRowClick={(mm) => onSelectMM(mm)}
        rowKey="id"
      />

      {/* Market-Based Portfolio Summary */}
      {marketMakers.length > 0 && prices && !loadingBalances && (
        <div className="mt-4 space-y-3">
          {/* CEA Cash Market Summary */}
          {(() => {
            const ceaCashMMs = marketMakers.filter(mm => MARKET_MAKER_TYPES[mm.mmType].market === 'CEA_CASH');
            const cashBuyers = ceaCashMMs.filter(mm => mm.mmType === 'CEA_BUYER');
            const ceaSellers = ceaCashMMs.filter(mm => mm.mmType === 'CEA_SELLER');

            // Compute values using actual balances from detailedBalances state
            let totalEUR = 0;
            let totalCEA = 0;
            cashBuyers.forEach(mm => {
              const val = Number(detailedBalances[mm.id]?.eur?.available) || 0;
              totalEUR += val;
            });
            ceaSellers.forEach(mm => {
              const val = Number(detailedBalances[mm.id]?.cea?.available) || 0;
              totalCEA += val;
            });
            const ceaPrice = Number(prices?.cea?.price) || 0;
            const ceaValueEur = totalCEA * ceaPrice;
            // Ensure final sum is valid (prefixed for future use)
            const _ceaCashTotal = (Number(totalEUR) || 0) + (Number(ceaValueEur) || 0);
            void _ceaCashTotal; // Suppress unused variable warning

            return ceaCashMMs.length > 0 ? (
              <Card className="overflow-hidden">
                {/* Header with gradient accent */}
                <div className="px-5 py-4 border-b border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900 dark:text-white">{MARKETS.CEA_CASH.name}</span>
                          <Badge variant="emerald" className="text-xs">{ceaCashMMs.length} MMs</Badge>
                        </div>
                        <div className="text-xs text-navy-500 dark:text-navy-400">Available Liquidity</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">Available Total</div>
                      <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalEUR + ceaValueEur, 'EUR')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 divide-x divide-navy-200 dark:divide-navy-700">
                  {/* Cash Buyers */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-navy-600 dark:text-navy-300">Cash Available</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalEUR, 'EUR')}
                    </div>
                    <div className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      {cashBuyers.length} Cash Buyer{cashBuyers.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* CEA Inventory */}
                  <div className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <Leaf className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-navy-600 dark:text-navy-300">CEA Available</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatCertificateQuantity(totalCEA)} CEA
                    </div>
                    <div className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      {formatCurrency(ceaValueEur, 'EUR')} · {ceaSellers.length} Seller{ceaSellers.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null;
          })()}

          {/* Swap Market Summary */}
          {(() => {
            const swapMMs = marketMakers.filter(mm => mm.mmType === 'EUA_OFFER');
            const totalCEAAvailable = getTotalAvailable('cea', mm => mm.mmType === 'EUA_OFFER') || 0;
            const totalEUAAvailable = getTotalAvailable('eua', mm => mm.mmType === 'EUA_OFFER') || 0;
            const ceaPriceSwap = prices?.cea?.price || 0;
            const euaPriceSwap = prices?.eua?.price || 0;
            const ceaValue = totalCEAAvailable * ceaPriceSwap;
            const euaValue = totalEUAAvailable * euaPriceSwap;
            const safeCeaVal = typeof ceaValue === 'number' && Number.isFinite(ceaValue) ? ceaValue : 0;
            const safeEuaVal = typeof euaValue === 'number' && Number.isFinite(euaValue) ? euaValue : 0;
            const swapTotal = safeCeaVal + safeEuaVal;

            return swapMMs.length > 0 ? (
              <Card className="overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900 dark:text-white">{MARKETS.SWAP.name}</span>
                          <Badge variant="blue" className="text-xs">{swapMMs.length} MMs</Badge>
                        </div>
                        <div className="text-xs text-navy-500 dark:text-navy-400">Available Liquidity</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">Available Total</div>
                      <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                        {formatCurrency(swapTotal, 'EUR')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats: EUA only (swap liquidity) */}
                <div className="p-5">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <Wind className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-navy-600 dark:text-navy-300">EUA Available</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 text-right">
                    {formatCertificateQuantity(totalEUAAvailable)} EUA
                  </div>
                  <div className="text-xs text-navy-500 dark:text-navy-400 mt-1 text-right">
                    {formatCurrency(euaValue, 'EUR')}
                  </div>
                </div>
              </Card>
            ) : null;
          })()}

          {/* Overall Portfolio Total */}
          <Card>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
              <span className="text-sm font-semibold text-navy-700 dark:text-navy-300">
                Total Available Portfolio Value
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const total = marketMakers.reduce((sum, mm) => {
                      const eurBal = Number(detailedBalances[mm.id]?.eur?.available) || 0;
                      const ceaBal = Number(detailedBalances[mm.id]?.cea?.available) || 0;
                      const euaBal = Number(detailedBalances[mm.id]?.eua?.available) || 0;

                      let value = Number(sum) || 0;
                      // Add EUR for CEA_BUYER
                      if (mm.mmType === 'CEA_BUYER') {
                        value += eurBal;
                      }
                      // Add CEA/EUA value for all types
                      const ceaP = Number(prices?.cea?.price) || 0;
                      const euaP = Number(prices?.eua?.price) || 0;
                      value += ceaBal * ceaP;
                      value += euaBal * euaP;
                      return value;
                    }, 0);
                    return formatCurrency(total, 'EUR');
                  })()}
                </div>
                <div className="text-xs text-navy-500 dark:text-navy-400">
                  Across {marketMakers.length} Market Makers
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
