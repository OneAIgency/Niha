import { useAuthStore, usePricesStore } from '../../stores/useStore';
import { USER_ROLES } from '../../utils/effectiveRole';
import type { UserRole } from '../../types';

const NO_SIMULATION_VALUE = '__none__';

/**
 * Floating control (bottom-right) for ADMIN only: simulates any platform role for testing
 * redirects and page content. Frontend-only; API and token remain the real admin.
 */
export function RoleSimulationFloater() {
  const { user, simulatedRole, setSimulatedRole } = useAuthStore();
  const { prices } = usePricesStore();

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const value = simulatedRole ?? NO_SIMULATION_VALUE;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSimulatedRole(v === NO_SIMULATION_VALUE ? null : (v as UserRole));
  };

  // Best ratio = CEA price / EUA price (same formula as backend swaps.py:106)
  const ceaPrice = prices?.cea?.price ?? 0;
  const euaPrice = prices?.eua?.price ?? 0;
  const bestRatio = euaPrice > 0 ? ceaPrice / euaPrice : 0;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-xl border px-3 py-2 shadow-lg bg-white border-navy-200 text-navy-800 dark:bg-navy-800 dark:border-navy-600 dark:text-navy-100"
      role="group"
      aria-label="Admin controls"
    >
      {/* Best Ratio card */}
      <div className="flex items-center gap-1.5 border-r border-navy-200 dark:border-navy-600 pr-3">
        <span className="text-xs font-medium text-navy-600 whitespace-nowrap dark:text-navy-300">
          Best ratio
        </span>
        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
          {bestRatio > 0 ? bestRatio.toFixed(4) : '...'}
        </span>
      </div>

      {/* Role simulation */}
      <label
        htmlFor="role-simulation-select"
        className="text-xs font-medium text-navy-600 whitespace-nowrap dark:text-navy-300"
      >
        Simulare rol (test)
      </label>
      <select
        id="role-simulation-select"
        value={value}
        onChange={handleChange}
        className="rounded-lg border px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-navy-50 border-navy-200 text-navy-900 dark:bg-navy-900 dark:border-navy-600 dark:text-navy-100"
        aria-label="Selectează rol de simulat"
      >
        <option value={NO_SIMULATION_VALUE}>Fără simulare</option>
        {USER_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  );
}
