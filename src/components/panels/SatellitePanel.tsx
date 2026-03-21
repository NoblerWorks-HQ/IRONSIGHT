'use client';

import { useDataFeed } from '@/lib/hooks';

interface FireEvent {
  lat: number;
  lon: number;
  brightness: number;
  frp: number;
  confidence: string;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  datetime: string;
  daynight: string;
  possibleExplosion: boolean;
}

interface FIRMSData {
  total: number;
  highIntensity: number;
  possibleExplosions: number;
  events: FireEvent[];
  source: string;
  error?: string;
}

const INTENSITY_COLORS: Record<string, string> = {
  low: 'var(--text-secondary)',
  medium: 'var(--amber)',
  high: '#ff6600',
  extreme: 'var(--red)',
};

// Rough reverse geocoding for Middle East
function getRegion(lat: number, lon: number): string {
  if (lat > 36 && lon > 36 && lon < 45) return 'Turkey';
  if (lat > 29 && lat < 34 && lon > 34 && lon < 36) return 'Israel';
  if (lat > 24 && lat < 38 && lon > 44 && lon < 64) return 'Iran';
  if (lat > 29 && lat < 38 && lon > 38 && lon < 49) return 'Iraq';
  if (lat > 32 && lat < 38 && lon > 35 && lon < 43) return 'Syria';
  if (lat > 33 && lat < 35 && lon > 35 && lon < 37) return 'Lebanon';
  if (lat > 12 && lat < 19 && lon > 42 && lon < 55) return 'Yemen';
  if (lat > 16 && lat < 33 && lon > 34 && lon < 56) return 'Saudi Arabia';
  if (lat > 22 && lat < 27 && lon > 51 && lon < 57) return 'UAE';
  if (lat > 25 && lat < 31 && lon > 25 && lon < 35) return 'Egypt';
  if (lat > 30 && lat < 34 && lon > 35 && lon < 40) return 'Jordan';
  if (lat > 23 && lat < 27 && lon > 45 && lon < 51) return 'Qatar/Bahrain';
  if (lat > 21 && lat < 27 && lon > 55 && lon < 60) return 'Oman';
  return 'Middle East';
}

export default function SatellitePanel() {
  const { data, loading } = useDataFeed<FIRMSData>('/api/fires', 600000); // 10 min refresh

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: '#ff6600' }} />
        SAT THERMAL DETECT
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          NASA FIRMS
        </span>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--text-primary)]">{data?.total || 0}</div>
          <div className="text-[8px] text-[var(--text-secondary)]">HOTSPOTS</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: '#ff6600' }}>{data?.highIntensity || 0}</div>
          <div className="text-[8px] text-[var(--text-secondary)]">HIGH INT</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--red)]">{data?.possibleExplosions || 0}</div>
          <div className="text-[8px] text-[var(--text-secondary)]">FLAGGED</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-10 rounded" />
            ))}
          </div>
        ) : data?.events.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs">
            No thermal anomalies detected in region
          </div>
        ) : (
          data?.events.slice(0, 30).map((event, i) => {
            const region = getRegion(event.lat, event.lon);
            return (
              <div
                key={i}
                className={`data-row flex items-center gap-2 ${event.possibleExplosion ? 'bg-red-900/10' : ''}`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: INTENSITY_COLORS[event.intensity] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium">{region}</span>
                    {event.possibleExplosion && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-900/30 text-[var(--red)]">
                        FLAGGED
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)]">
                    FRP: {event.frp} MW | {event.brightness}K |{' '}
                    {event.lat.toFixed(2)}, {event.lon.toFixed(2)} |{' '}
                    {new Date(event.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span
                  className="text-[8px] font-bold shrink-0"
                  style={{ color: INTENSITY_COLORS[event.intensity] }}
                >
                  {event.intensity.toUpperCase()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
