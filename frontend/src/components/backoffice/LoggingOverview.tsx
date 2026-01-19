import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { getLoggingStats } from '../../services/api';

interface LoggingStats {
  total_actions: number;
  success_count: number;
  failed_count: number;
  by_action_type: Record<string, number>;
  by_user: Array<{ user_id: string; email: string; count: number }>;
  actions_over_time: Array<{ date: string; count: number }>;
}

export function LoggingOverview() {
  const [stats, setStats] = useState<LoggingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getLoggingStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch logging statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-navy-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.total_actions > 0
    ? ((stats.success_count / stats.total_actions) * 100).toFixed(1)
    : '0';

  // Top action types (sorted by count)
  const topActions = Object.entries(stats.by_action_type)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Actions */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
              Total Actions
            </span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-navy-900 dark:text-white">
            {stats.total_actions.toLocaleString()}
          </div>
        </div>

        {/* Success Count */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
              Successful
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.success_count.toLocaleString()}
          </div>
        </div>

        {/* Failed Count */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
              Failed
            </span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.failed_count.toLocaleString()}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
              Success Rate
            </span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-navy-900 dark:text-white">
            {successRate}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Action Types */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
            Top Action Types
          </h3>
          <div className="space-y-3">
            {topActions.length === 0 ? (
              <p className="text-sm text-navy-500 dark:text-navy-400">No actions recorded</p>
            ) : (
              topActions.map(([actionType, count]) => {
                const percentage = ((count / stats.total_actions) * 100).toFixed(1);
                return (
                  <div key={actionType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-navy-700 dark:text-navy-300">
                        {actionType}
                      </span>
                      <span className="text-navy-500 dark:text-navy-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-navy-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 border border-navy-200 dark:border-navy-700">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
            Most Active Users
          </h3>
          <div className="space-y-3">
            {stats.by_user.length === 0 ? (
              <p className="text-sm text-navy-500 dark:text-navy-400">No user activity recorded</p>
            ) : (
              stats.by_user.map((user) => {
                const percentage = ((user.count / stats.total_actions) * 100).toFixed(1);
                return (
                  <div key={user.user_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-navy-700 dark:text-navy-300 truncate">
                        {user.email}
                      </span>
                      <span className="text-navy-500 dark:text-navy-400">
                        {user.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-navy-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
