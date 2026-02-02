import { Leaf, Wind, Euro, Lock } from 'lucide-react';
import { formatQuantity, formatCurrency } from '../../utils';

interface SimpleBalances {
  eur_balance?: number;
  cea_balance: number;
  eua_balance: number;
}

interface DetailedBalances {
  EUR?: {
    available: number;
    locked: number;
    total: number;
  };
  CEA: {
    available: number;
    locked: number;
    total: number;
  };
  EUA: {
    available: number;
    locked: number;
    total: number;
  };
}

interface BalanceCardsProps {
  balances: SimpleBalances | DetailedBalances;
  loading?: boolean;
  variant?: 'simple' | 'detailed';
}

function isDetailedBalances(balances: SimpleBalances | DetailedBalances): balances is DetailedBalances {
  return 'CEA' in balances && typeof balances.CEA === 'object';
}

export function BalanceCards({ balances, loading = false, variant = 'simple' }: BalanceCardsProps) {
  const eurBalance = isDetailedBalances(balances) ? balances.EUR?.total : balances.eur_balance;
  const ceaBalance = isDetailedBalances(balances) ? balances.CEA.total : balances.cea_balance;
  const euaBalance = isDetailedBalances(balances) ? balances.EUA.total : balances.eua_balance;

  const showDetailed = variant === 'detailed' && isDetailedBalances(balances);
  const hasEurBalance = eurBalance !== undefined && eurBalance > 0;

  return (
    <div className={`grid ${hasEurBalance ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
      {/* EUR Card - Only show if EUR balance exists */}
      {hasEurBalance && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          {showDetailed && balances.EUR ? (
            <>
              {/* Available - Most prominent */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Euro className="w-5 h-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Available</span>
                </div>
                <div className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {loading ? '...' : formatCurrency(balances.EUR.available, 'EUR')}
                </div>
              </div>

              {/* Initial and Locked - Secondary info */}
              <div className="pt-3 border-t border-emerald-200 dark:border-emerald-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">Initial Balance</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(balances.EUR.total, 'EUR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3 h-3" />
                    Locked in Orders
                  </span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(balances.EUR.locked, 'EUR')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Euro className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-medium">EUR Balance</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {loading ? '...' : formatCurrency(eurBalance, 'EUR')}
              </div>
            </>
          )}
        </div>
      )}

      {/* CEA Card */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        {showDetailed ? (
          <>
            {/* Available - Most prominent */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <Leaf className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">CEA Available</span>
              </div>
              <div className="text-3xl font-bold font-mono text-amber-700 dark:text-amber-300">
                {loading ? '...' : formatQuantity(balances.CEA.available)}
              </div>
            </div>

            {/* Initial and Locked - Secondary info */}
            <div className="pt-3 border-t border-amber-200 dark:border-amber-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-600 dark:text-amber-400">Initial Balance</span>
                <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                  {formatQuantity(balances.CEA.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Lock className="w-3 h-3" />
                  Locked in Orders
                </span>
                <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                  {formatQuantity(balances.CEA.locked)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Leaf className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">CEA Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {loading ? '...' : formatQuantity(ceaBalance)}
            </div>
          </>
        )}
      </div>

      {/* EUA Card */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        {showDetailed ? (
          <>
            {/* Available - Most prominent */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Wind className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">EUA Available</span>
              </div>
              <div className="text-3xl font-bold font-mono text-blue-700 dark:text-blue-300">
                {loading ? '...' : formatQuantity(balances.EUA.available)}
              </div>
            </div>

            {/* Initial and Locked - Secondary info */}
            <div className="pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 dark:text-blue-400">Initial Balance</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {formatQuantity(balances.EUA.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Lock className="w-3 h-3" />
                  Locked in Orders
                </span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {formatQuantity(balances.EUA.locked)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Wind className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">EUA Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
              {loading ? '...' : formatQuantity(euaBalance)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
