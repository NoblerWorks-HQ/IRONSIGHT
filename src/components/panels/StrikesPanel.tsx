'use client';

import { useDataFeed, timeAgo, useTick } from '@/lib/hooks';

interface StrikeEvent {
  id: string;
  date: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  source: string;
  url: string;
  country: string;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  MISSILE: { icon: '🚀', color: 'var(--red)' },
  INTERCEPTION: { icon: '🛡', color: 'var(--green)' },
  DRONE: { icon: '✈', color: 'var(--amber)' },
  AIRSTRIKE: { icon: '💥', color: 'var(--red)' },
  ROCKET: { icon: '🎯', color: '#ff6600' },
  STRIKE: { icon: '⚡', color: 'var(--amber)' },
  REPORT: { icon: '📡', color: 'var(--blue)' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'var(--text-secondary)',
  medium: 'var(--amber)',
  high: '#ff6600',
  critical: 'var(--red)',
};

export default function StrikesPanel() {
  const { data: strikes, loading } = useDataFeed<StrikeEvent[]>('/api/strikes', 120000);
  useTick(15000);

  // Count by category
  const counts: Record<string, number> = {};
  strikes?.forEach(s => {
    counts[s.category] = (counts[s.category] || 0) + 1;
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--red)', animation: 'pulse-dot 1s ease-in-out infinite' }} />
        MISSILE / STRIKE TRACKER
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {strikes?.length || 0} events
        </span>
      </div>

      {/* Category summary bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] overflow-x-auto">
        {Object.entries(counts).map(([cat, count]) => {
          const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.REPORT;
          return (
            <div key={cat} className="flex items-center gap-1 shrink-0">
              <span className="text-xs">{config.icon}</span>
              <span className="text-[9px] font-bold" style={{ color: config.color }}>
                {cat}
              </span>
              <span className="text-[9px] text-[var(--text-secondary)]">({count})</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded" />
            ))}
          </div>
        ) : strikes?.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs">
            No strike events detected
          </div>
        ) : (
          strikes?.map((strike, i) => {
            const config = CATEGORY_CONFIG[strike.category] || CATEGORY_CONFIG.REPORT;
            return (
              <a
                key={i}
                href={strike.url}
                target="_blank"
                rel="noopener noreferrer"
                className="data-row block hover:cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{config.icon}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: config.color,
                      backgroundColor: `${config.color}15`,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    {strike.category}
                  </span>
                  <span
                    className="text-[8px] font-bold px-1 py-0.5 rounded"
                    style={{
                      color: SEVERITY_COLORS[strike.severity],
                    }}
                  >
                    {strike.severity.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)] ml-auto">
                    {timeAgo(strike.date)}
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-[var(--text-primary)]">
                  {strike.title}
                </p>
                <span className="text-[8px] text-[var(--text-secondary)]">
                  {strike.source} • {strike.country}
                </span>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
