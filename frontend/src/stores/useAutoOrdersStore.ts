import { create } from 'zustand';
import { adminApi } from '../services/api';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ORDER_INTERVAL_MIN_S = 20;
const ORDER_INTERVAL_MAX_S = 20;
const STORAGE_KEY = 'niha_auto_orders_enabled';

function randomInterval(): number {
  return (ORDER_INTERVAL_MIN_S + Math.random() * (ORDER_INTERVAL_MAX_S - ORDER_INTERVAL_MIN_S)) * 1000;
}

// ============================================================================
// MODULE-LEVEL TIMER STATE (survives React component lifecycle)
// ============================================================================

let orderTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function clearTimers() {
  if (orderTimer) { clearTimeout(orderTimer); orderTimer = null; }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

// ============================================================================
// STORE
// ============================================================================

interface AutoOrdersState {
  isRunning: boolean;
  nextOrderIn: number | null;
  orderCount: number;
}

export const useAutoOrdersStore = create<AutoOrdersState>(() => ({
  isRunning: getPersistedEnabled(),
  nextOrderIn: null,
  orderCount: 0,
}));

// ============================================================================
// PURE FUNCTIONS (not React hooks — callable from anywhere)
// ============================================================================

function getPersistedEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

async function placeOneOrder() {
  try {
    await adminApi.placeRandomOrder();
    useAutoOrdersStore.setState(s => ({ orderCount: s.orderCount + 1 }));
    logger.debug('[AutoOrders] Order placed successfully');
  } catch {
    // Silent — don't break the timer loop
    logger.debug('[AutoOrders] Order failed (silent)');
  }
}

function scheduleNext() {
  clearTimers();

  const delay = randomInterval();
  const seconds = Math.round(delay / 1000);
  useAutoOrdersStore.setState({ nextOrderIn: seconds });

  // Countdown ticker (1s)
  countdownTimer = setInterval(() => {
    useAutoOrdersStore.setState(s => ({
      nextOrderIn: s.nextOrderIn !== null && s.nextOrderIn > 0 ? s.nextOrderIn - 1 : s.nextOrderIn,
    }));
  }, 1000);

  // Main order timer
  orderTimer = setTimeout(async () => {
    await placeOneOrder();
    // Only continue if still running
    if (useAutoOrdersStore.getState().isRunning) {
      scheduleNext();
    }
  }, delay);
}

/** Start the auto-orders background loop. */
export function startAutoOrders() {
  clearTimers();
  localStorage.setItem(STORAGE_KEY, 'true');
  useAutoOrdersStore.setState({ isRunning: true, orderCount: 0 });
  scheduleNext();
  logger.debug('[AutoOrders] Started');
}

/** Stop the auto-orders background loop. */
export function stopAutoOrders() {
  clearTimers();
  localStorage.setItem(STORAGE_KEY, 'false');
  useAutoOrdersStore.setState({ isRunning: false, nextOrderIn: null });
  logger.debug('[AutoOrders] Stopped');
}

/**
 * Boot the service — call once at app startup.
 * If localStorage says enabled (or first visit → default true), auto-starts.
 */
export function bootAutoOrders() {
  if (getPersistedEnabled()) {
    useAutoOrdersStore.setState({ isRunning: true, orderCount: 0 });
    scheduleNext();
    logger.debug('[AutoOrders] Booted (auto-start)');
  }
}
