'use client';

import { useConflictFeed, timeAgo } from '@/lib/hooks';
import type { TelegramData } from '@/lib/types/api';

export default function TelegramPanel() {
  const { data, loading, lastUpdated } = useConflictFeed<TelegramData>('/api/telegram', 60000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--cyan)' }} />
        TELEGRAM OSINT (UNVERIFIED)
        <span className="ml-auto text-[9px] text-(--text-secondary) font-normal normal-case tracking-normal">
          {data?.posts.length || 0} posts // {data?.channels.length || 0} channels{lastUpdated ? ` // ${new Date(lastUpdated).toLocaleTimeString()}` : ''}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-shimmer h-16 rounded-sm" />
            ))}
          </div>
        ) : data?.posts.length === 0 ? (
          <div className="p-4 text-center text-(--text-secondary) text-xs">
            No recent Telegram posts
          </div>
        ) : (
          data?.posts.map((post) => (
            <a
              key={`${post.channel}-${post.postId}`}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block data-row hover:bg-[rgba(0,212,255,0.05)]! cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
                  style={{
                    color: post.color,
                    backgroundColor: `${post.color}15`,
                    border: `1px solid ${post.color}30`,
                  }}
                >
                  {post.channelLabel}
                </span>
                <span className="text-[9px] text-(--text-secondary) ml-auto shrink-0">
                  {timeAgo(post.date)}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-(--text-primary) line-clamp-3">
                {post.text}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
