'use client';

import { useDataFeed, timeAgo } from '@/lib/hooks';

interface TelegramPost {
  channel: string;
  channelLabel: string;
  color: string;
  postId: number;
  text: string;
  date: string;
  url: string;
}

interface TelegramData {
  posts: TelegramPost[];
  channels: string[];
  updated: string;
}

export default function TelegramPanel() {
  const { data, loading } = useDataFeed<TelegramData>('/api/telegram', 60000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--cyan)' }} />
        TELEGRAM OSINT (UNVERIFIED)
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {data?.posts.length || 0} posts // {data?.channels.length || 0} channels
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-shimmer h-16 rounded" />
            ))}
          </div>
        ) : data?.posts.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs">
            No recent Telegram posts
          </div>
        ) : (
          data?.posts.map((post) => (
            <a
              key={`${post.channel}-${post.postId}`}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block data-row hover:!bg-[rgba(0,212,255,0.05)] cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color: post.color,
                    backgroundColor: `${post.color}15`,
                    border: `1px solid ${post.color}30`,
                  }}
                >
                  {post.channelLabel}
                </span>
                <span className="text-[8px] text-[var(--text-secondary)] ml-auto shrink-0">
                  {timeAgo(post.date)}
                </span>
              </div>
              <p className="text-[10px] leading-snug text-[var(--text-primary)] line-clamp-3">
                {post.text}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
