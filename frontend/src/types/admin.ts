/**
 * Admin dashboard types
 */

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  pendingDeposits: number;
  totalVolume24h: number;
  activeOrders: number;
  marketMakersCount: number;
}
