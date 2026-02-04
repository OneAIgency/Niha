import type { OrderBookLevel } from '../../types';

interface UnifiedOrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  totalBidVolume?: number;
  totalAskVolume?: number;
}

export function UnifiedOrderBook({
  bids,
  asks,
  bestBid,
  bestAsk,
  spread,
  totalBidVolume = 0,
  totalAskVolume = 0,
}: UnifiedOrderBookProps) {
  const formatNumber = (num: number, decimals = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return formatNumber(value, 0);
  };

  // Calculate max cumulative for depth visualization
  const maxBidCumulative = bids.length > 0
    ? Math.max(...bids.map(b => b.cumulativeQuantity))
    : 0;
  const maxAskCumulative = asks.length > 0
    ? Math.max(...asks.map(a => a.cumulativeQuantity))
    : 0;
  const maxCumulative = Math.max(maxBidCumulative, maxAskCumulative);

  return (
    <div className="content_wrapper_last">
      {/* Header */}
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Total Bids */}
            <div>
              <div className="text-xs text-navy-500">Total Bids</div>
              <div className="text-emerald-400 font-mono font-bold">
                €{formatValue(totalBidVolume)}
              </div>
            </div>

            {/* Spread */}
            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold">
                  €{bestBid?.toFixed(1) ?? '-'}
                </span>
                <span className="px-2 py-0.5 bg-navy-700 rounded text-xs text-navy-300">
                  SPREAD €{spread?.toFixed(1) ?? '-'} ({spread && bestBid ? ((spread / bestBid) * 100).toFixed(1) : '-'}%)
                </span>
                <span className="text-red-400 font-mono font-bold">
                  €{bestAsk?.toFixed(1) ?? '-'}
                </span>
              </div>
            </div>

            {/* Total Asks */}
            <div className="text-right">
              <div className="text-xs text-navy-500">Total Asks</div>
              <div className="text-red-400 font-mono font-bold">
                €{formatValue(totalAskVolume)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column Headers - Mirrored layout */}
      <div className="grid grid-cols-2 border-b border-navy-700">
        {/* Bid columns (right-aligned, reversed order) */}
        <div className="px-2 py-1.5">
          <div className="grid grid-cols-6 gap-1 text-xs text-navy-500">
            <div>Cnt</div>
            <div className="text-right">Val.Total</div>
            <div className="text-right">Value</div>
            <div className="text-right">Vol.Total</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Bid</div>
          </div>
        </div>

        {/* Ask columns (left-aligned) */}
        <div className="px-2 py-1.5">
          <div className="grid grid-cols-6 gap-1 text-xs text-navy-500">
            <div>Ask</div>
            <div className="text-left">Volume</div>
            <div className="text-left">Vol.Total</div>
            <div className="text-left">Value</div>
            <div className="text-left">Val.Total</div>
            <div className="text-right">Cnt</div>
          </div>
        </div>
      </div>

      {/* Order Book Rows */}
      <div className="grid grid-cols-2" style={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
        {/* Bids */}
        <div className="border-r border-navy-700">
          {bids.map((level, idx) => {
            const depthPct = maxCumulative > 0
              ? (level.cumulativeQuantity / maxCumulative) * 100
              : 0;
            const value = level.price * level.quantity;
            const cumulativeValue = level.price * level.cumulativeQuantity;

            return (
              <div
                key={`bid-${idx}`}
                className="grid grid-cols-6 gap-1 px-2 py-1 text-xs hover:bg-navy-700/50 relative cursor-pointer"
              >
                {/* Depth visualization */}
                <div
                  className="absolute inset-0 bg-emerald-500/10"
                  style={{ width: `${depthPct}%`, right: 0, left: 'auto' }}
                />
                <div className="relative text-navy-400">{level.orderCount}</div>
                <div className="relative text-right text-emerald-300/70 font-mono">
                  {formatValue(cumulativeValue)}
                </div>
                <div className="relative text-right text-emerald-400 font-mono">
                  {formatValue(value)}
                </div>
                <div className="relative text-right text-white/70 font-mono">
                  {formatNumber(level.cumulativeQuantity)}
                </div>
                <div className="relative text-right text-white font-mono">
                  {formatNumber(level.quantity)}
                </div>
                <div className="relative text-right text-emerald-400 font-mono font-semibold">
                  {level.price.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Asks */}
        <div>
          {asks.map((level, idx) => {
            const depthPct = maxCumulative > 0
              ? (level.cumulativeQuantity / maxCumulative) * 100
              : 0;
            const value = level.price * level.quantity;
            const cumulativeValue = level.price * level.cumulativeQuantity;

            return (
              <div
                key={`ask-${idx}`}
                className="grid grid-cols-6 gap-1 px-2 py-1 text-xs hover:bg-navy-700/50 relative cursor-pointer"
              >
                {/* Depth visualization */}
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{ width: `${depthPct}%` }}
                />
                <div className="relative text-red-400 font-mono font-semibold">
                  {level.price.toFixed(1)}
                </div>
                <div className="relative text-left text-white font-mono">
                  {formatNumber(level.quantity)}
                </div>
                <div className="relative text-left text-white/70 font-mono">
                  {formatNumber(level.cumulativeQuantity)}
                </div>
                <div className="relative text-left text-red-400 font-mono">
                  {formatValue(value)}
                </div>
                <div className="relative text-left text-red-300/70 font-mono">
                  {formatValue(cumulativeValue)}
                </div>
                <div className="relative text-right text-navy-400">{level.orderCount}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
