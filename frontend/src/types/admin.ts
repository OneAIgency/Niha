/**
 * Admin dashboard types
 */

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  pending_kyc: number;
  pending_deposits: number;
  total_volume_24h: number;
  active_orders: number;
  market_makers_count: number;
}
