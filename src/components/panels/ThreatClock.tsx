'use client';

import { useState, useEffect } from 'react';

const TIME_ZONES = [
  { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
  { label: 'LON', zone: 'Europe/London', flag: '🇬🇧' },
  { label: 'TLV', zone: 'Asia/Jerusalem', flag: '🇮🇱' },
  { label: 'THR', zone: 'Asia/Tehran', flag: '🇮🇷' },
  { label: 'RYD', zone: 'Asia/Riyadh', flag: '🇸🇦' },
  { label: 'MSK', zone: 'Asia/Shanghai', flag: '🇨🇳' },
];

export default function ThreatClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center gap-4 px-4 py-1.5">
        <span className="text-[9px] text-[var(--text-secondary)]">Loading clocks...</span>
      </div>
    );
  }

  const utc = time.toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] text-[var(--text-secondary)] tracking-widest">ZULU</span>
        <span className="text-xs font-bold text-[var(--cyan)] glow-text font-mono">{utc}Z</span>
      </div>
      <div className="h-4 w-px bg-[var(--border-color)]" />
      {TIME_ZONES.map((tz, i) => {
        const localTime = time.toLocaleTimeString('en-US', {
          timeZone: tz.zone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const hour = parseInt(localTime.split(':')[0]);
        const isNight = hour < 6 || hour >= 20;

        return (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] text-[var(--text-secondary)]">{tz.label}</span>
            <span className={`text-[11px] font-mono font-bold ${isNight ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
              {localTime}
            </span>
          </div>
        );
      })}
    </div>
  );
}
