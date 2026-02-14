import { useAuthStore } from '../stores/useStore';

/**
 * Introducer dashboard: simplified, discrete content for INTRODUCER role.
 * No cash market, swap, funding, settlements, or balances.
 */
export function IntroducerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-light text-navy-900 dark:text-navy-50 tracking-wide mb-2">
        Introducer Dashboard
      </h1>
      <p className="text-navy-600 dark:text-navy-400 text-sm mb-8">
        Welcome, {user?.firstName ?? user?.email ?? 'User'}.
      </p>
      <div className="rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-6">
        <p className="text-navy-700 dark:text-navy-300 text-sm leading-relaxed">
          This area provides access to introducer-specific resources and reference information.
          For questions or support, please contact your Nihao Group representative.
        </p>
      </div>
    </div>
  );
}
