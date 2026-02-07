import { useAuthStore } from '../../stores/useStore';
import { USER_ROLES } from '../../utils/effectiveRole';
import type { UserRole } from '../../types';

const NO_SIMULATION_VALUE = '__none__';

/**
 * Floating control (bottom-right) for ADMIN only: simulates any platform role for testing
 * redirects and page content. Frontend-only; API and token remain the real admin.
 */
export function RoleSimulationFloater() {
  const { user, simulatedRole, setSimulatedRole } = useAuthStore();

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const value = simulatedRole ?? NO_SIMULATION_VALUE;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSimulatedRole(v === NO_SIMULATION_VALUE ? null : (v as UserRole));
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg bg-white border-navy-200 text-navy-800 dark:bg-navy-800 dark:border-navy-600 dark:text-navy-100"
      role="group"
      aria-label="Simulare rol (test)"
    >
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
