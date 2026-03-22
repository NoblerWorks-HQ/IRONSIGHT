'use client';

import { useDataFeed } from '@/lib/hooks';

interface MilFlight {
  icao24: string;
  callsign: string;
  origin: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  speed: number;
  type: string;
  aircraftType: string;
  registration: string;
  description: string;
  squawk: string;
  isMilitary: boolean;
  isInteresting: boolean;
}

interface FlightDataResponse {
  total: number;
  military: number;
  flights: MilFlight[];
  source: string;
  updated: string;
}

const TYPE_COLORS: Record<string, string> = {
  'RQ-4 Global Hawk (ISR)': 'var(--red)',
  'ISR Drone (UAV)': 'var(--red)',
  'High-Alt ISR/Drone': 'var(--red)',
  'Fast Mover': 'var(--red)',
  'SIGINT/ELINT': 'var(--red)',
  'AWACS': 'var(--purple)',
  'JSTARS': 'var(--purple)',
  'TACAMO (Nuclear C2)': 'var(--red)',
  'Hawkeye (AEW)': 'var(--purple)',
  'Maritime Patrol': 'var(--purple)',
  'ISR': 'var(--red)',
  'Bomber': 'var(--red)',
  'Fighter': 'var(--red)',
  'Transport (C-17/C-5)': 'var(--blue)',
  'Aerial Tanker (KC-135/KC-46)': 'var(--cyan)',
  'Navy P-8/MPA': 'var(--purple)',
  'Special Operations': 'var(--red)',
  'CSAR/Rescue': 'var(--amber)',
  'VIP/Government': 'var(--amber)',
  'RAF Transport': 'var(--blue)',
  'Medical Evacuation': 'var(--green)',
  'Tactical Transport': 'var(--blue)',
  'Rotary/Low-Level': 'var(--amber)',
  'Military': 'var(--text-secondary)',
};

function focusOnMapTarget(id: string, lat: number, lon: number, type: 'aircraft' | 'ship') {
  window.dispatchEvent(new CustomEvent('map-focus', {
    detail: { id, lat, lon, type },
  }));
}

export default function FlightsPanel() {
  const { data, loading } = useDataFeed<FlightDataResponse>('/api/flights', 180000);

  // Group by type
  const byType: Record<string, number> = {};
  data?.flights.forEach(f => {
    byType[f.type] = (byType[f.type] || 0) + 1;
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--cyan)' }} />
        MIL AIRSPACE
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {data?.military || 0} mil / {data?.total || 0} total // adsb.lol
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-8 rounded" />
            ))}
          </div>
        ) : data?.flights.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs">
            No military aircraft detected on ADS-B<br />
            <span className="text-[8px]">(many mil flights disable transponders)</span>
          </div>
        ) : (
          <>
            {Object.keys(byType).length > 0 && (
              <div className="px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] flex flex-wrap gap-x-3 gap-y-0.5">
                {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <span key={type} className="text-[8px]" style={{ color: TYPE_COLORS[type] || 'var(--text-secondary)' }}>
                    {type}: {count}
                  </span>
                ))}
              </div>
            )}

            {data?.flights.map((f, i) => (
              <div
                key={i}
                className="data-row cursor-pointer hover:!bg-[rgba(0,170,255,0.1)]"
                onClick={() => focusOnMapTarget(f.icao24, f.lat, f.lon, 'aircraft')}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold" style={{ color: TYPE_COLORS[f.type] || 'var(--cyan)' }}>
                      {f.callsign || f.icao24}
                    </span>
                    {f.aircraftType && (
                      <span className="text-[8px] text-[var(--text-secondary)] font-mono">{f.aircraftType}</span>
                    )}
                    <span className="text-[9px] text-[var(--text-secondary)]">{f.origin}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {f.squawk === '7700' && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-900/30 text-[var(--red)]">EMERG</span>
                    )}
                    {f.squawk === '7600' && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-900/30 text-[var(--amber)]">NORDO</span>
                    )}
                    {f.isInteresting && !f.isMilitary && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-900/30 text-[var(--purple)]">NOTABLE</span>
                    )}
                    <span className="text-[8px] text-[var(--text-secondary)]">📍</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: TYPE_COLORS[f.type] || 'var(--text-secondary)' }}>
                    {f.type}
                    {f.registration ? ` (${f.registration})` : ''}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono">
                    {f.altitude.toLocaleString()}ft {f.speed}kts {f.heading}°
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
