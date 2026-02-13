import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../stores/useStore';
import { adminApi } from '../../services/api';
import { formatNumberWithSeparators } from '../common';

// ============================================================================
// Types & helpers
// ============================================================================

interface MmActivityItem {
  type: 'order' | 'trade';
  id: string;
  side?: string;
  price: string;
  quantity: string;
  filledQuantity?: string;
  status?: string;
  timestamp: string;
  aggressorSide?: string;    // BUY or SELL — who initiated the trade
  buyOrderId?: string;
  sellOrderId?: string;
}

const POLL_MS = 10_000;

function timeAgo(isoStr: string): string {
  const utcStr = isoStr.endsWith('Z') ? isoStr : `${isoStr}Z`;
  const diff = Date.now() - new Date(utcStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// ============================================================================
// Component
// ============================================================================

export function MmActivityFloater() {
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<MmActivityItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getMmActivity(30);
      setActivity(data);
    } catch {
      // silent — non-critical
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [user, load]);

  if (!user || user.role !== 'ADMIN') return null;

  const latest = activity[0];

  // Pre-compute group boundaries for order grouping
  const groupInfo = computeGroups(activity);

  const renderItem = (item: MmActivityItem, idx: number, isFirst = false) => {
    const isTrade = item.type === 'trade';
    const isBuy = item.side === 'BUY';
    const group = groupInfo.get(idx);

    // Trade background: green for buyer-initiated, red for seller-initiated
    let tradeBg = '';
    if (isTrade && item.aggressorSide === 'BUY') {
      tradeBg = 'bg-emerald-500/8';
    } else if (isTrade && item.aggressorSide === 'SELL') {
      tradeBg = 'bg-red-500/8';
    }

    // Group border styling
    let groupClass = '';
    if (group === 'start') groupClass = 'border-l-2 border-l-navy-500/40 pl-2 rounded-t pt-1';
    else if (group === 'mid') groupClass = 'border-l-2 border-l-navy-500/40 pl-2';
    else if (group === 'end') groupClass = 'border-l-2 border-l-navy-500/40 pl-2 rounded-b pb-1';

    return (
      <div
        key={item.id}
        className={`flex items-center gap-2 text-[11px] ${tradeBg} ${groupClass}
          ${isFirst ? '' : 'border-t border-navy-700/40 pt-1.5 mt-1.5'}`}
      >
        {isTrade ? (
          <span className={`px-1.5 py-0.5 rounded font-medium ${
            item.aggressorSide === 'BUY'
              ? 'bg-emerald-500/20 text-emerald-400'
              : item.aggressorSide === 'SELL'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
          }`}>TRADE</span>
        ) : (
          <span className={`px-1.5 py-0.5 rounded font-medium ${
            isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {item.side}
          </span>
        )}
        <span className="text-white font-medium">{`€${Number(item.price).toFixed(1)}`}</span>
        <span className="text-navy-400">{`×${formatNumberWithSeparators(Number(item.quantity), 'en-US', 0)}`}</span>
        {item.status && item.status !== 'OPEN' && (
          <span className={`text-[10px] ${item.status === 'FILLED' ? 'text-amber-400' : 'text-navy-500'}`}>
            {item.status}
          </span>
        )}
        <span className="ml-auto text-navy-500 text-[10px]">{timeAgo(item.timestamp)}</span>
      </div>
    );
  };

  if (!latest) {
    return (
      <div className="fixed bottom-20 right-4 z-40 w-80 rounded-xl border bg-navy-800 border-navy-600 shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-navy-400">
          <Activity className="w-3.5 h-3.5" />
          <span>No activity yet</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-40 w-80 rounded-xl border bg-navy-800 border-navy-600 shadow-lg overflow-hidden flex flex-col"
      style={{ maxHeight: 'calc(100vh - 10.0625rem - 5rem - 1rem)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-navy-900/60 border-b border-navy-700 hover:bg-navy-700/50 transition-colors shrink-0"
      >
        <div className="flex items-center gap-2 text-xs text-white font-semibold tracking-wide uppercase">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Activity
          <span className="text-navy-500 font-normal normal-case text-[10px]">({activity.length})</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-navy-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-navy-400" />
        )}
      </button>

      {/* Latest item always visible */}
      <div className="px-3 pb-2 pt-2 shrink-0">
        {renderItem(latest, 0, true)}
      </div>

      {/* Expanded: full scrollable history */}
      {expanded && activity.length > 1 && (
        <div className="px-3 pb-2 overflow-y-auto min-h-0">
          {activity.slice(1).map((item, i) => renderItem(item, i + 1))}
        </div>
      )}
    </div>
  );
}

/** Compute group membership for each item: 'start', 'mid', 'end', or undefined */
function computeGroups(items: MmActivityItem[]): Map<number, 'start' | 'mid' | 'end'> {
  const result = new Map<number, 'start' | 'mid' | 'end'>();

  let i = 0;
  while (i < items.length) {
    if (items[i].type !== 'trade' || (!items[i].buyOrderId && !items[i].sellOrderId)) {
      i++;
      continue;
    }

    const buyId = items[i].buyOrderId;
    const sellId = items[i].sellOrderId;
    let j = i + 1;

    while (j < items.length && items[j].type === 'trade' &&
      ((buyId && items[j].buyOrderId === buyId) || (sellId && items[j].sellOrderId === sellId))) {
      j++;
    }

    if (j > i + 1) {
      result.set(i, 'start');
      for (let k = i + 1; k < j - 1; k++) result.set(k, 'mid');
      result.set(j - 1, 'end');
    }

    i = j;
  }

  return result;
}
