import { Leaf, Wind } from 'lucide-react';
import { formatQuantity } from '../../utils';

interface SimpleBalances {
  cea_balance: number;
  eua_balance: number;
}

interface DetailedBalances {
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
  const ceaBalance = isDetailedBalances(balances) ? balances.CEA.total : balances.cea_balance;
  const euaBalance = isDetailedBalances(balances) ? balances.EUA.total : balances.eua_balance;

  const showDetailed = variant === 'detailed' && isDetailedBalances(balances);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* CEA Card */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
          <Leaf className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-medium">CEA Balance</span>
        </div>
        <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
          {loading ? '...' : formatQuantity(ceaBalance)}
        </div>
        {showDetailed && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400/80">
            Available: {formatQuantity(balances.CEA.available)} | Locked: {formatQuantity(balances.CEA.locked)}
          </div>
        )}
      </div>

      {/* EUA Card */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Wind className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-medium">EUA Balance</span>
        </div>
        <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
          {loading ? '...' : formatQuantity(euaBalance)}
        </div>
        {showDetailed && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400/80">
            Available: {formatQuantity(balances.EUA.available)} | Locked: {formatQuantity(balances.EUA.locked)}
          </div>
        )}
      </div>
    </div>
  );
}
