import { useState } from 'react';
import { Newspaper } from 'lucide-react';

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  time: string;
  impact: 'bullish' | 'bearish' | 'neutral';
}

const MOCK_NEWS: NewsItem[] = [
  { id: 1, headline: 'EU ETS Phase IV tightens 2027 cap by 4.4% — supply squeeze expected', source: 'Carbon Pulse', time: '14:32', impact: 'bullish' },
  { id: 2, headline: 'CBAM transitional period reporting deadline extended to Q3 2026', source: 'EC Official', time: '13:15', impact: 'neutral' },
  { id: 3, headline: 'German industrial output falls 1.2% — lower emissions forecast', source: 'Reuters', time: '11:48', impact: 'bearish' },
  { id: 4, headline: 'China launches national ETS expansion to cover cement sector', source: 'Bloomberg', time: '10:20', impact: 'bullish' },
  { id: 5, headline: 'UK ETS price corridor mechanism under consultation until March', source: 'DESNZ', time: '09:05', impact: 'neutral' },
  { id: 6, headline: 'Record voluntary carbon credit retirements in January 2026', source: 'Verra', time: '08:30', impact: 'bullish' },
];

const IMPACT_STYLES = {
  bullish: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Bullish' },
  bearish: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Bearish' },
  neutral: { bg: 'bg-navy-600/40', text: 'text-navy-300', label: 'Neutral' },
};

export function NewsIntelligenceFeed() {
  const [news] = useState<NewsItem[]>(MOCK_NEWS);

  return (
    <div className="rounded-lg border border-navy-700/50 overflow-hidden flex flex-col flex-1 min-h-0 bg-navy-800/30 widget-accent-blue">
      <div className="px-3 py-1 border-b border-navy-700/50 flex items-center gap-1.5 shrink-0">
        <Newspaper className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider">News Intelligence</span>
        <div className="live-dot bg-blue-400 ml-auto" title="Live feed" />
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {news.map((item) => {
          const style = IMPACT_STYLES[item.impact];
          const borderColor = item.impact === 'bullish' ? 'border-l-emerald-500/40' : item.impact === 'bearish' ? 'border-l-red-500/40' : 'border-l-navy-600/40';
          return (
            <div key={item.id} className={`px-3 py-2 border-b border-navy-700/20 border-l-2 ${borderColor} hover:bg-navy-700/20 transition-colors flex-1 flex items-start`}>
              <div className="flex items-start gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/90 leading-snug">{item.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-navy-500">{item.source}</span>
                    <span className="text-[10px] text-navy-600">{item.time}</span>
                  </div>
                </div>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
