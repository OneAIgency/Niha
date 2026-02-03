import { useMemo } from 'react';
import { Card } from '../common/Card';
import type { MarketDepthPoint } from '../../types';

interface MarketDepthChartProps {
  bids: MarketDepthPoint[];
  asks: MarketDepthPoint[];
  midPrice?: number;
}

export function MarketDepthChart({ bids, asks, midPrice }: MarketDepthChartProps) {
  const { bidPath, askPath, maxY, minPrice, maxPrice, viewBox } = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) {
      return { bidPath: '', askPath: '', maxY: 100, minPrice: 0, maxPrice: 100, viewBox: '0 0 400 200' };
    }

    // Sort bids descending by price, asks ascending by price
    const sortedBids = [...bids].sort((a, b) => b.price - a.price);
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

    // Get price range
    const allPrices = [...sortedBids.map(b => b.price), ...sortedAsks.map(a => a.price)];
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const priceRange = maxP - minP || 1;

    // Get max cumulative quantity
    const maxCumulative = Math.max(
      sortedBids.length > 0 ? sortedBids[0].cumulativeQuantity : 0,
      sortedAsks.length > 0 ? sortedAsks[sortedAsks.length - 1].cumulativeQuantity : 0
    );

    const width = 400;
    const height = 200;
    const padding = 10;

    // Scale functions
    const scaleX = (price: number) => padding + ((price - minP) / priceRange) * (width - 2 * padding);
    const scaleY = (qty: number) => height - padding - (qty / maxCumulative) * (height - 2 * padding);

    // Create bid path (area chart from right to left)
    let bidPathStr = '';
    if (sortedBids.length > 0) {
      bidPathStr = `M ${scaleX(sortedBids[sortedBids.length - 1].price)} ${height - padding}`;
      for (let i = sortedBids.length - 1; i >= 0; i--) {
        const bid = sortedBids[i];
        bidPathStr += ` L ${scaleX(bid.price)} ${scaleY(bid.cumulativeQuantity)}`;
        // Step to next price level
        if (i > 0) {
          bidPathStr += ` L ${scaleX(sortedBids[i - 1].price)} ${scaleY(bid.cumulativeQuantity)}`;
        }
      }
      bidPathStr += ` L ${scaleX(sortedBids[0].price)} ${height - padding} Z`;
    }

    // Create ask path (area chart from left to right)
    let askPathStr = '';
    if (sortedAsks.length > 0) {
      askPathStr = `M ${scaleX(sortedAsks[0].price)} ${height - padding}`;
      for (let i = 0; i < sortedAsks.length; i++) {
        const ask = sortedAsks[i];
        askPathStr += ` L ${scaleX(ask.price)} ${scaleY(ask.cumulativeQuantity)}`;
        // Step to next price level
        if (i < sortedAsks.length - 1) {
          askPathStr += ` L ${scaleX(sortedAsks[i + 1].price)} ${scaleY(ask.cumulativeQuantity)}`;
        }
      }
      askPathStr += ` L ${scaleX(sortedAsks[sortedAsks.length - 1].price)} ${height - padding} Z`;
    }

    return {
      bidPath: bidPathStr,
      askPath: askPathStr,
      maxY: maxCumulative,
      minPrice: minP,
      maxPrice: maxP,
      viewBox: `0 0 ${width} ${height}`,
    };
  }, [bids, asks]);

  const formatQuantity = (qty: number) => {
    if (qty >= 1000000) return `${(qty / 1000000).toFixed(1)}M`;
    if (qty >= 1000) return `${(qty / 1000).toFixed(1)}K`;
    return qty.toFixed(0);
  };

  return (
    <Card className="h-full" padding="none">
      <div className="px-4 py-3 border-b border-navy-200 dark:border-navy-700">
        <h3 className="font-semibold text-navy-900 dark:text-white">Market Depth</h3>
      </div>

      <div className="p-4">
        <svg viewBox={viewBox} className="w-full h-48">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-navy-200 dark:text-navy-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

          {/* Bid area (green) */}
          <path
            d={bidPath}
            fill="var(--color-bid-bg)"
            stroke="var(--color-bid)"
            strokeWidth="2"
          />

          {/* Ask area (red) */}
          <path
            d={askPath}
            fill="var(--color-ask-bg)"
            stroke="var(--color-ask)"
            strokeWidth="2"
          />

          {/* Mid price line */}
          {midPrice && (
            <line
              x1={10 + ((midPrice - minPrice) / (maxPrice - minPrice || 1)) * 380}
              y1="10"
              x2={10 + ((midPrice - minPrice) / (maxPrice - minPrice || 1)) * 380}
              y2="190"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4"
              className="text-navy-400 dark:text-navy-500"
            />
          )}
        </svg>

        {/* Legend */}
        <div className="flex justify-between mt-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
              <span className="text-navy-600 dark:text-navy-400">Bids</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
              <span className="text-navy-600 dark:text-navy-400">Asks</span>
            </div>
          </div>
          <div className="text-navy-500 dark:text-navy-400">
            Max: {formatQuantity(maxY)}
          </div>
        </div>

        {/* Price range */}
        <div className="flex justify-between mt-2 text-xs text-navy-400 dark:text-navy-500 font-mono">
          <span>${minPrice.toFixed(2)}</span>
          {midPrice && <span className="font-semibold">${midPrice.toFixed(2)}</span>}
          <span>${maxPrice.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
