'use client';

import { useDataFeed } from '@/lib/hooks';

interface NavalVessel {
  name: string;
  hull: string;
  type: string;
  class: string;
  navy: string;
  lat: number;
  lon: number;
  status: string;
  region: string;
  lastReported: string;
  group?: string;
}

interface NavalData {
  totalTracked: number;
  ships: NavalVessel[];
  updated: string;
  note: string;
}

const NAVY_COLORS: Record<string, string> = {
  'US Navy': 'var(--blue)',
  'Royal Navy': '#4488cc',
  'French Navy': '#6666cc',
  'Israeli Navy': 'var(--cyan)',
  'Iran Navy': 'var(--red)',
  'IRGC Navy': 'var(--red)',
  'Saudi Navy': 'var(--green)',
  'German Navy': '#888',
};

const TYPE_ICONS: Record<string, string> = {
  'Aircraft Carrier': '⛴',
  'Destroyer': '🛥',
  'Cruiser': '🛥',
  'Frigate': '🛥',
  'Corvette': '🚤',
  'Submarine': '🔻',
  'Guided Missile Submarine': '🔻',
  'Amphibious Assault Ship': '⛴',
  'Forward Base Ship': '⛴',
  'Fast Attack Craft': '🚤',
};

export default function NavalPanel() {
  const { data, loading } = useDataFeed<NavalData>('/api/ships', 300000);

  // Group by navy
  const byNavy: Record<string, NavalVessel[]> = {};
  data?.ships.forEach(ship => {
    if (!byNavy[ship.navy]) byNavy[ship.navy] = [];
    byNavy[ship.navy].push(ship);
  });

  // Sort navies: US first, then allies, then adversaries
  const navyOrder = ['US Navy', 'Royal Navy', 'French Navy', 'Israeli Navy', 'Saudi Navy', 'Iran Navy', 'IRGC Navy'];
  const sortedNavies = Object.keys(byNavy).sort((a, b) => {
    const aIdx = navyOrder.indexOf(a);
    const bIdx = navyOrder.indexOf(b);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--blue)' }} />
        NAVAL TRACKER
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {data?.totalTracked || 0} vessels // OSINT
        </span>
      </div>

      {/* Region summary */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
        {['Persian Gulf', 'Red Sea', 'Eastern Med', 'Strait of Hormuz'].map(region => {
          const count = data?.ships.filter(s => s.region === region).length || 0;
          return count > 0 ? (
            <div key={region} className="text-[8px] text-[var(--text-secondary)]">
              <span className="text-[var(--cyan)]">{count}</span> {region}
            </div>
          ) : null;
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-10 rounded" />
            ))}
          </div>
        ) : (
          sortedNavies.map(navy => (
            <div key={navy}>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[9px] tracking-widest font-bold" style={{ color: NAVY_COLORS[navy] || 'var(--text-secondary)' }}>
                  {navy.toUpperCase()} ({byNavy[navy].length})
                </span>
              </div>
              {byNavy[navy].map((ship, i) => (
                <div
                  key={i}
                  className="data-row cursor-pointer hover:!bg-[rgba(0,212,255,0.1)]"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('map-focus', {
                      detail: { id: ship.name, lat: ship.lat, lon: ship.lon, type: 'ship' },
                    }));
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{TYPE_ICONS[ship.type] || '🛥'}</span>
                      <span className="text-[10px] font-medium">{ship.name}</span>
                      <span className="text-[8px] text-[var(--text-secondary)] font-mono">{ship.hull}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded"
                        style={{
                          color: ship.status === 'Active' ? 'var(--green)' : 'var(--cyan)',
                          backgroundColor: ship.status === 'Active' ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.1)',
                        }}
                      >
                        {ship.status}
                      </span>
                      <span className="text-[8px] text-[var(--text-secondary)]">📍</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[var(--text-secondary)]">
                    <span>{ship.class} • {ship.type}</span>
                    <span>{ship.region}{ship.group ? ` • ${ship.group}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
