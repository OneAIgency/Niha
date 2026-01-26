import { useMemo } from 'react';
import type { OrderBookLevel } from '../../types';

interface DepthChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function DepthChart({ bids, asks }: DepthChartProps) {
  const chartData = useMemo(() => {
    // Take top 20 levels for depth chart
    const bidLevels = bids.slice(0, 20);
    const askLevels = asks.slice(0, 20);

    if (bidLevels.length === 0 || askLevels.length === 0) {
      return null;
    }

    // Find price range
    const minBidPrice = Math.min(...bidLevels.map(b => b.price));
    const maxAskPrice = Math.max(...askLevels.map(a => a.price));

    const minPrice = minBidPrice;
    const maxPrice = maxAskPrice;
    const priceRange = maxPrice - minPrice;

    // Find max cumulative quantity for Y-axis scaling
    const maxBidQty = Math.max(...bidLevels.map(b => b.cumulative_quantity));
    const maxAskQty = Math.max(...askLevels.map(a => a.cumulative_quantity));
    const maxQty = Math.max(maxBidQty, maxAskQty);

    // Build bid path (left side, descending prices)
    const bidPoints = bidLevels
      .sort((a, b) => b.price - a.price) // Sort descending
      .map(level => ({
        x: ((level.price - minPrice) / priceRange) * 100,
        y: 100 - ((level.cumulative_quantity / maxQty) * 100),
      }));

    // Build ask path (right side, ascending prices)
    const askPoints = askLevels
      .sort((a, b) => a.price - b.price) // Sort ascending
      .map(level => ({
        x: ((level.price - minPrice) / priceRange) * 100,
        y: 100 - ((level.cumulative_quantity / maxQty) * 100),
      }));

    // Build SVG path for bids (filled area)
    const bidPath = bidPoints.length > 0
      ? `M ${bidPoints[0].x} 100 ` +
        bidPoints.map(p => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${bidPoints[bidPoints.length - 1].x} 100 Z`
      : '';

    // Build SVG path for asks (filled area)
    const askPath = askPoints.length > 0
      ? `M ${askPoints[0].x} 100 ` +
        askPoints.map(p => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${askPoints[askPoints.length - 1].x} 100 Z`
      : '';

    // Calculate center line position (between best bid and best ask)
    const bestBid = Math.max(...bidLevels.map(b => b.price));
    const bestAsk = Math.min(...askLevels.map(a => a.price));
    const centerPrice = (bestBid + bestAsk) / 2;
    const centerX = ((centerPrice - minPrice) / priceRange) * 100;

    // Generate X-axis labels (6 evenly spaced price points)
    const xLabels = [];
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i) / 5;
      const x = (i / 5) * 100;
      xLabels.push({ x, price });
    }

    // Generate Y-axis labels (4 evenly spaced quantity points)
    const yLabels = [];
    for (let i = 0; i <= 3; i++) {
      const qty = (maxQty * i) / 3;
      const y = 100 - (i / 3) * 100;
      yLabels.push({ y, qty });
    }

    return {
      bidPath,
      askPath,
      centerX,
      xLabels,
      yLabels,
      maxQty,
    };
  }, [bids, asks]);

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center text-navy-400 dark:text-navy-500">
        No depth data available
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000).toFixed(0)}K`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-navy-400 dark:text-navy-500 tabular-nums">
        {chartData.yLabels.reverse().map((label, idx) => (
          <div key={idx} className="text-right pr-2">
            {formatNumber(label.qty)}
          </div>
        ))}
      </div>

      {/* Chart SVG */}
      <div className="ml-16 mr-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-48"
          preserveAspectRatio="none"
        >
          {/* Bid area (green) */}
          <path
            d={chartData.bidPath}
            fill="var(--color-bid-bg)"
            stroke="var(--color-bid)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Ask area (red) */}
          <path
            d={chartData.askPath}
            fill="var(--color-ask-bg)"
            stroke="var(--color-ask)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Center dashed line */}
          <line
            x1={chartData.centerX}
            y1="0"
            x2={chartData.centerX}
            y2="100"
            stroke="currentColor"
            strokeWidth="0.3"
            strokeDasharray="2,2"
            vectorEffect="non-scaling-stroke"
            className="text-navy-400 dark:text-navy-500"
          />
        </svg>

        {/* X-axis labels */}
        <div className="relative h-6 mt-2">
          {chartData.xLabels.map((label, idx) => (
            <div
              key={idx}
              className="absolute text-xs text-navy-400 dark:text-navy-500 tabular-nums"
              style={{
                left: `${label.x}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {label.price.toFixed(3)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
