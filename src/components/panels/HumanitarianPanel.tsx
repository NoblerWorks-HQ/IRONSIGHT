'use client';

import { useDataFeed, timeAgo, useTick } from '@/lib/hooks';
import type { HumanitarianReport } from '@/types';

export default function HumanitarianPanel() {
  const { data: reports, loading } = useDataFeed<HumanitarianReport[]>('/api/humanitarian', 300000);
  useTick(15000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--amber)' }} />
        HUMANITARIAN // OCHA
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded" />
            ))}
          </div>
        ) : (
          reports?.map((report, i) => (
            <a
              key={i}
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="data-row block hover:cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/30 text-[var(--amber)]">
                  {report.type}
                </span>
                <span className="text-[9px] text-[var(--text-secondary)]">
                  {report.country}
                </span>
                <span className="text-[9px] text-[var(--text-secondary)] ml-auto">
                  {report.date ? timeAgo(report.date) : ''}
                </span>
              </div>
              <p className="text-[11px] leading-tight text-[var(--text-primary)]">
                {report.title}
              </p>
              <span className="text-[8px] text-[var(--text-secondary)]">
                {report.source}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
