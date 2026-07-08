'use client';

import { useConflictFeed, timeAgo, useTick } from '@/lib/hooks';
import { useConflict } from '@/lib/conflicts/context';
import type { NewsItem } from '@/types';

export default function NewsFeed() {
  const { config } = useConflict();
  const SOURCE_COLORS = config.client.sourceColors;
  const { data: news, loading, lastUpdated } = useConflictFeed<NewsItem[]>('/api/news', 90000);
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
