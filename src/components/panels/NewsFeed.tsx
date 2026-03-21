'use client';

import { useDataFeed, timeAgo, useTick } from '@/lib/hooks';
import type { NewsItem } from '@/types';

const SOURCE_COLORS: Record<string, string> = {
  BBC: '#bb1919',
  NYT: '#333',
  'Al Jazeera': '#d4a843',
  Reuters: '#ff6600',
  'Times of Israel': '#0066cc',
  'JPost': '#003366',
  'Google News': '#4285f4',
  'Breaking Def': '#cc0000',
  'Long War Jrnl': '#556b2f',
  'DoD': '#003366',
  'PressTV': '#00a650',
  'The National': '#1a6b3c',
  'CNN': '#cc0000',
  'Fox News': '#003366',
  'WSJ': '#0274b6',
  'Mil Times': '#8b0000',
  'War on Rocks': '#2e4057',
  'CENTCOM': '#4b5320',
  'Haaretz': '#2a7fff',
  'Drop Site': '#e63946',
};

export default function NewsFeed() {
  const { data: news, loading, lastUpdated } = useDataFeed<NewsItem[]>('/api/news', 90000);
  useTick(15000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" />
        LIVE INTEL FEED
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {news?.length || 0} items · {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded" />
            ))}
          </div>
        ) : (
          news?.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="data-row flex items-start gap-2 hover:cursor-pointer block"
            >
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                style={{
                  backgroundColor: SOURCE_COLORS[item.source] || '#555',
                  color: '#fff',
                }}
              >
                {item.source}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight text-[var(--text-primary)] truncate">
                  {item.title}
                </p>
                <span className="text-[9px] text-[var(--text-secondary)]">
                  {timeAgo(item.pubDate)}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
