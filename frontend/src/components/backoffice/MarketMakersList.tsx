import { DataTable, Badge, Card, type Column } from '../common';
import { CheckCircle, XCircle, Leaf, Wind, Activity } from 'lucide-react';
import { formatQuantity, formatCurrency } from '../../utils';
import { usePrices } from '../../hooks/usePrices';
import type { MarketMaker } from '../../types';
import { MARKETS, MARKET_MAKER_TYPES } from '../../types';

interface MarketMakersListProps {
  marketMakers: MarketMaker[];
  loading: boolean;
  onSelectMM: (mm: MarketMaker) => void;
}

export function MarketMakersList({ marketMakers, loading, onSelectMM }: MarketMakersListProps) {
  const { prices } = usePrices();

  const columns: Column<MarketMaker>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (value, row) => (
        <div>
          <div className="font-medium text-navy-900 dark:text-white">{value}</div>
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
        // Compute market from mm_type
        const market = MARKET_MAKER_TYPES[row.mm_type].market;
        const marketInfo = MARKETS[market];
        const color = market === 'CEA_CASH' ? 'purple' : 'blue';
        return (
          <Badge variant={color}>
            {marketInfo.name}
          </Badge>
        );
      },
    },
    {
      key: 'mm_type',
      header: 'Role',
      width: '15%',
      align: 'center',
      render: (_, row) => {
        const info = MARKET_MAKER_TYPES[row.mm_type];
        return (
          <Badge variant={info.color as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
            {info.name}
          </Badge>
        );
      },
    },
    {
      key: 'balance',
      header: 'Balance',
      width: '18%',
      align: 'right',
      render: (_, row) => {
        if (row.mm_type === 'CASH_BUYER') {
          return (
            <div className="flex items-center justify-end font-mono font-bold text-emerald-600">
              {formatCurrency(row.eur_balance, 'EUR')}
            </div>
          );
        } else if (row.mm_type === 'CEA_CASH_SELLER') {
          return (
            <div className="flex items-center justify-end gap-2">
              <Leaf className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-navy-900 dark:text-white">
                {formatQuantity(row.cea_balance)} CEA
              </span>
            </div>
          );
        } else { // SWAP_MAKER
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-end gap-2">
                <Leaf className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono">{formatQuantity(row.cea_balance)} CEA</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Wind className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-mono">{formatQuantity(row.eua_balance)} EUA</span>
              </div>
            </div>
          );
        }
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '12%',
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
      key: 'total_orders',
      header: 'Total Orders',
      width: '10%',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-navy-400" />
          <span className="font-semibold text-navy-900 dark:text-white">
            {value || 0}
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
          {value || '-'}
        </span>
      ),
    },
  ];

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
      {marketMakers.length > 0 && prices && (
        <div className="mt-4 space-y-3">
          {/* CEA-CASH Market Summary */}
          {(() => {
            const ceaCashMMs = marketMakers.filter(mm => MARKET_MAKER_TYPES[mm.mm_type].market === 'CEA_CASH');
            const cashBuyers = ceaCashMMs.filter(mm => mm.mm_type === 'CASH_BUYER');
            const ceaSellers = ceaCashMMs.filter(mm => mm.mm_type === 'CEA_CASH_SELLER');

            const totalEUR = cashBuyers.reduce((sum, mm) => sum + mm.eur_balance, 0);
            const totalCEA = ceaSellers.reduce((sum, mm) => sum + mm.cea_balance, 0);
            const ceaValue = totalCEA * prices.cea.price;
            const ceaCashTotal = totalEUR + ceaValue;

            return ceaCashMMs.length > 0 ? (
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{MARKETS.CEA_CASH.name}</Badge>
                      <span className="text-sm text-navy-600 dark:text-navy-400">
                        ({ceaCashMMs.length} Market Makers)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-navy-500 dark:text-navy-400">Market Total</div>
                      <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                        {formatCurrency(ceaCashTotal, 'EUR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex-1 text-center">
                      <div className="text-xs text-navy-500 dark:text-navy-400">Cash Buyers</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalEUR, 'EUR')}
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">
                        ({cashBuyers.length} MMs)
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-navy-500 dark:text-navy-400">CEA Inventory</div>
                      <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {formatQuantity(totalCEA)} CEA
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">
                        {formatCurrency(ceaValue, 'EUR')} • ({ceaSellers.length} MMs)
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null;
          })()}

          {/* SWAP Market Summary */}
          {(() => {
            const swapMMs = marketMakers.filter(mm => mm.mm_type === 'SWAP_MAKER');
            const totalCEA = swapMMs.reduce((sum, mm) => sum + mm.cea_balance, 0);
            const totalEUA = swapMMs.reduce((sum, mm) => sum + mm.eua_balance, 0);
            const ceaValue = totalCEA * prices.cea.price;
            const euaValue = totalEUA * prices.eua.price;
            const swapTotal = ceaValue + euaValue;

            return swapMMs.length > 0 ? (
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">{MARKETS.SWAP.name}</Badge>
                      <span className="text-sm text-navy-600 dark:text-navy-400">
                        ({swapMMs.length} Market Makers)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-navy-500 dark:text-navy-400">Market Total</div>
                      <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                        {formatCurrency(swapTotal, 'EUR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Leaf className="w-4 h-4 text-amber-500" />
                        <div className="text-xs text-navy-500 dark:text-navy-400">CEA Inventory</div>
                      </div>
                      <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {formatQuantity(totalCEA)} CEA
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">
                        {formatCurrency(ceaValue, 'EUR')}
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <div className="text-xs text-navy-500 dark:text-navy-400">EUA Inventory</div>
                      </div>
                      <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                        {formatQuantity(totalEUA)} EUA
                      </div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">
                        {formatCurrency(euaValue, 'EUR')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null;
          })()}

          {/* Overall Portfolio Total */}
          <Card>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
              <span className="text-sm font-semibold text-navy-700 dark:text-navy-300">
                Total Portfolio Value
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    marketMakers.reduce((sum, mm) => {
                      let value = sum;
                      // Add EUR for CASH_BUYER
                      if (mm.mm_type === 'CASH_BUYER') {
                        value += mm.eur_balance;
                      }
                      // Add CEA/EUA value for all types
                      value += (mm.cea_balance * prices.cea.price) + (mm.eua_balance * prices.eua.price);
                      return value;
                    }, 0),
                    'EUR'
                  )}
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
