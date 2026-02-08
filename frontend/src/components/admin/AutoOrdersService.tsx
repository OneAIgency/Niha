import { useEffect } from 'react';
import { useAuthStore } from '../../stores/useStore';
import { bootAutoOrders } from '../../stores/useAutoOrdersStore';

/**
 * Invisible global component that boots the auto-orders background service.
 * Mount once in App.tsx — it renders nothing.
 * Only boots when the user is an ADMIN (auto-trade is admin-only).
 */
export function AutoOrdersService() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      bootAutoOrders();
    }
    // No cleanup — timers are module-level and intentionally persist
  }, [isAdmin]);

  return null;
}
