import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../stores/useStore';
import { adminApi } from '../../services/api';
import { formatNumberWithSeparators } from '../common';

// ============================================================================
// Types & helpers
// ============================================================================

interface TradeActivity {
  side: 'SELL' | 'BUY';
  totalQuantity: number;
  vwap: number;
  totalEur: number;
  fillCount: number;
  timestamp: string;
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

function formatEur(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `€${formatNumberWithSeparators(Math.round(value), 'en-US', 0)}`;
  return `€${value.toFixed(2)}`;
}

// ============================================================================
// Component
// ============================================================================

export function MmActivityFloater() {
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<TradeActivity[]>([]);
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

  const renderItem = (item: TradeActivity, idx: number) => {
    const isSold = item.side === 'SELL';

    return (
      <div
        key={`${item.timestamp}-${idx}`}
        className={`flex items-center gap-2 text-[11px] rounded px-1.5 py-1 ${
          isSold ? 'bg-red-500/8' : 'bg-emerald-500/8'
        } ${idx > 0 ? 'mt-1' : ''}`}
      >
        <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
          isSold ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {item.side}
        </span>
        <span className="text-white font-medium">
          {formatNumberWithSeparators(item.totalQuantity, 'en-US', 0)}
        </span>
        <span className="text-navy-400">@€{item.vwap.toFixed(2)}</span>
        <span className={`text-[10px] font-medium ${isSold ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
          {formatEur(item.totalEur)}
        </span>
        {item.fillCount > 1 && (
          <span className="text-navy-600 text-[9px]">({item.fillCount})</span>
        )}
        <span className="ml-auto text-navy-500 text-[10px]">{timeAgo(item.timestamp)}</span>
      </div>
    );
  };

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
          {activity.length > 0 && (
            <span className="text-navy-500 font-normal normal-case text-[10px]">({activity.length})</span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-navy-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-navy-400" />
        )}
      </button>

      {/* Content */}
      {!latest ? (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <Activity className="w-3.5 h-3.5" />
            <span>No recent trades</span>
          </div>
        </div>
      ) : (
        <>
          {/* Latest always visible */}
          <div className="px-3 pb-2 pt-2 shrink-0">
            {renderItem(latest, 0)}
          </div>

          {/* Expanded: scrollable history */}
          {expanded && activity.length > 1 && (
            <div className="px-3 pb-2 overflow-y-auto min-h-0">
              {activity.slice(1).map((item, i) => renderItem(item, i + 1))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
