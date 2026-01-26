import { memo } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, MapPin, ArrowRightLeft } from 'lucide-react';
import { Button, Card, Badge } from '../common';
import { formatRelativeTime, formatCurrency, formatQuantity } from '../../utils';

interface UserSession {
  id: string;
  ip_address: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

interface UserTrade {
  id: string;
  trade_type: string;
  certificate_type: string;
  quantity: number;
  total_value: number;
  status: string;
  is_buyer: boolean;
  created_at: string;
}

interface SelectedUserDetails {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    entity_name?: string;
  };
  sessions: UserSession[];
  trades: UserTrade[];
}

interface UserDetailsTabProps {
  selectedUser: SelectedUserDetails | null;
  loading: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchUser: () => void;
}

export const UserDetailsTab: FC<UserDetailsTabProps> = memo(({
  selectedUser,
  loading,
  searchQuery,
  onSearchQueryChange,
  onSearchUser,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search User */}
      <Card>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search user by email..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchUser()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>
          <Button variant="primary" onClick={onSearchUser} loading={loading}>
            Search
          </Button>
        </div>
      </Card>

      {/* User Details */}
      {selectedUser && (
        <>
          {/* User Info */}
          <Card>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              User Details
            </h2>
            <div className="flex items-center gap-4 p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center text-white font-bold text-xl">
                {(selectedUser.user.first_name?.[0] || selectedUser.user.email[0]).toUpperCase()}
                {(selectedUser.user.last_name?.[0] || selectedUser.user.email[1]).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-navy-900 dark:text-white text-lg">
                  {selectedUser.user.first_name} {selectedUser.user.last_name}
                </p>
                <p className="text-navy-500 dark:text-navy-400">{selectedUser.user.email}</p>
                {selectedUser.user.entity_name && (
                  <p className="text-sm text-navy-400">{selectedUser.user.entity_name}</p>
                )}
              </div>
              <Badge variant="success" className="ml-auto">
                {selectedUser.user.role.toUpperCase()}
              </Badge>
            </div>
          </Card>

          {/* Sessions */}
          <Card>
            <h3 className="font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Session History (IP Addresses)
            </h3>
            {selectedUser.sessions.length > 0 ? (
              <div className="space-y-2">
                {selectedUser.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-100 dark:bg-navy-600 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-navy-500" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-navy-900 dark:text-white">{session.ip_address}</p>
                        {session.is_active && (
                          <span className="text-xs text-navy-600 dark:text-navy-400">Active</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-navy-400">
                      {formatRelativeTime(session.started_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-navy-500 dark:text-navy-400 py-4">No sessions found</p>
            )}
          </Card>

          {/* Trading History */}
          <Card>
            <h3 className="font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-500" />
              Trading History
            </h3>
            {selectedUser.trades.length > 0 ? (
              <div className="space-y-2">
                {selectedUser.trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.trade_type === 'buy' ? 'success' : trade.trade_type === 'swap' ? 'info' : 'warning'}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium text-navy-900 dark:text-white">
                          {formatQuantity(trade.quantity)} {trade.certificate_type}
                        </p>
                        <p className="text-xs text-navy-500 dark:text-navy-400">
                          {formatRelativeTime(trade.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-navy-600 dark:text-navy-400">
                      {formatCurrency(trade.total_value, 'USD')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-navy-500 dark:text-navy-400 py-4">No trades found</p>
            )}
          </Card>
        </>
      )}

      {!selectedUser && !loading && (
        <Card>
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
            <p className="text-navy-500 dark:text-navy-400">Search for a user to view their details</p>
          </div>
        </Card>
      )}
    </motion.div>
  );
});

UserDetailsTab.displayName = 'UserDetailsTab';
