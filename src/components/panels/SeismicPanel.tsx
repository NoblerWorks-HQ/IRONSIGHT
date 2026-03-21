'use client';

import { useDataFeed, timeAgo, useTick } from '@/lib/hooks';
import type { SeismicEvent } from '@/types';

function getMagColor(mag: number): string {
  if (mag >= 6) return 'var(--red)';
  if (mag >= 5) return '#ff6600';
  if (mag >= 4) return 'var(--amber)';
  if (mag >= 3) return 'var(--blue)';
  return 'var(--text-secondary)';
}

export default function SeismicPanel() {
  const { data: events, loading } = useDataFeed<SeismicEvent[]>('/api/quakes', 120000);
  useTick(15000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--amber)' }} />
        SEISMIC / EXPLOSION DETECT
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          USGS
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-10 rounded" />
            ))}
          </div>
        ) : events?.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs">
            No recent seismic activity in region
          </div>
        ) : (
          events?.map((event, i) => (
            <div key={i} className="data-row flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  backgroundColor: `${getMagColor(event.magnitude)}20`,
                  color: getMagColor(event.magnitude),
                  border: `1px solid ${getMagColor(event.magnitude)}40`,
                }}
              >
                {event.magnitude.toFixed(1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight text-[var(--text-primary)] truncate">
                  {event.location}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
                  <span>{event.depth.toFixed(1)}km deep</span>
                  <span>{event.type}</span>
                  <span>{timeAgo(event.time)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
