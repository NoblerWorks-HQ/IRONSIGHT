'use client';

import { useDataFeed } from '@/lib/hooks';
import type { NuclearFacility } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  Active: 'var(--red)',
  Operational: 'var(--green)',
  Modified: 'var(--amber)',
  Monitored: 'var(--purple)',
};

export default function NuclearPanel() {
  const { data: facilities, loading } = useDataFeed<NuclearFacility[]>('/api/nuclear', 3600000);

  const iranFacilities = facilities?.filter(f => f.country === 'Iran');
  const israelFacilities = facilities?.filter(f => f.country === 'Israel');

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--purple)' }} />
        NUCLEAR FACILITIES
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          IAEA Data
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-10 rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="px-3 pt-2 pb-1">
              <span className="text-[9px] tracking-widest" style={{ color: 'var(--red)' }}>
                IRAN
              </span>
            </div>
            {iranFacilities?.map((f, i) => (
              <div key={i} className="data-row flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium">{f.name}</div>
                  <div className="text-[9px] text-[var(--text-secondary)]">{f.type}</div>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: STATUS_COLORS[f.status] || 'var(--text-secondary)',
                    backgroundColor: `${STATUS_COLORS[f.status] || 'var(--text-secondary)'}20`,
                  }}
                >
                  {f.status}
                </span>
              </div>
            ))}

            <div className="px-3 pt-3 pb-1">
              <span className="text-[9px] tracking-widest" style={{ color: 'var(--blue)' }}>
                ISRAEL
              </span>
            </div>
            {israelFacilities?.map((f, i) => (
              <div key={i} className="data-row flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium">{f.name}</div>
                  <div className="text-[9px] text-[var(--text-secondary)]">{f.type}</div>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: STATUS_COLORS[f.status] || 'var(--text-secondary)',
                    backgroundColor: `${STATUS_COLORS[f.status] || 'var(--text-secondary)'}20`,
                  }}
                >
                  {f.status}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
