'use client';

import { useState } from 'react';
import { useDataFeed, timeAgo, useTick } from '@/lib/hooks';

interface CountryEvent {
  title: string;
  source: string;
  time: string;
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hoursAgo: number;
}

interface CountryAlert {
  name: string;
  flag: string;
  events: CountryEvent[];
  level: string;
}

interface RegionalData {
  alerts: CountryAlert[];
  updated: string;
}

// Unique color per country
const COUNTRY_COLORS: Record<string, string> = {
  'Lebanon': '#e06030',
  'Iran': '#cc3355',
  'Iraq': '#cc8833',
  'Syria': '#aa7744',
  'Yemen': '#55aa55',
  'Kuwait': '#44bbaa',
  'Bahrain': '#dd6699',
  'UAE': '#8866cc',
  'Saudi Arabia': '#33aa77',
  'Qatar': '#7744aa',
  'Jordan': '#4488cc',
};

const LEVEL_CONFIG: Record<string, { color: string; label: string }> = {
  CLEAR: { color: 'var(--green)', label: 'CLEAR' },
  MONITORING: { color: 'var(--blue)', label: 'MONITOR' },
  ALERT: { color: 'var(--amber)', label: 'ALERT' },
  CRITICAL: { color: 'var(--red)', label: 'CRITICAL' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--red)',
  high: '#ff6600',
  medium: 'var(--amber)',
  low: 'var(--blue)',
};

export default function RegionalAlertsPanel() {
  const { data, loading } = useDataFeed<RegionalData>('/api/regional-alerts', 60000);
  useTick(15000);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (country: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(country)) {
        next.delete(country);
      } else {
        next.add(country);
      }
      return next;
    });
  };

  // Sort by most recent event first
  const sorted = data?.alerts ? [...data.alerts].sort((a, b) => {
    const aTime = a.events[0]?.hoursAgo ?? 999;
    const bTime = b.events[0]?.hoursAgo ?? 999;
    return aTime - bTime;
  }) : [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span
          className="status-dot"
          style={{
            background: sorted.some(a => a.level === 'CRITICAL') ? 'var(--red)' :
                        sorted.some(a => a.level === 'ALERT') ? 'var(--amber)' :
                        'var(--blue)',
            animation: sorted.some(a => a.level === 'CRITICAL') ? 'pulse-dot 0.5s ease-in-out infinite' : undefined,
          }}
        />
        REGIONAL THREAT MONITOR
        <span className="ml-auto text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          {sorted.filter(a => a.level !== 'CLEAR').length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded" />
            ))}
          </div>
        ) : (
          sorted.map((country, i) => {
            const levelConfig = LEVEL_CONFIG[country.level] || LEVEL_CONFIG.CLEAR;
            const countryColor = COUNTRY_COLORS[country.name] || '#888';
            const hasEvents = country.events.length > 0;
            const isCollapsed = collapsed.has(country.name);

            return (
              <div
                key={i}
                className="border-b border-[var(--border-color)]"
              >
                {/* Country header - clickable to collapse */}
                <div
                  className="px-3 py-1 flex items-center justify-between cursor-pointer select-none hover:bg-[rgba(255,255,255,0.02)]"
                  onClick={() => toggleCollapse(country.name)}
                  style={{ borderLeft: `3px solid ${countryColor}` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[var(--text-secondary)]">
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                    <span className="text-xs">{country.flag}</span>
                    <span className="text-[11px] font-bold" style={{ color: countryColor }}>
                      {country.name}
                    </span>
                    {hasEvents && (
                      <span className="text-[9px] text-[var(--text-secondary)]">
                        {country.events[0].hoursAgo < 1
                          ? `${Math.max(1, Math.round(country.events[0].hoursAgo * 60))}m ago`
                          : `${Math.round(country.events[0].hoursAgo)}h ago`
                        }
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: levelConfig.color,
                      border: `1px solid ${levelConfig.color}30`,
                      backgroundColor: `${levelConfig.color}10`,
                    }}
                  >
                    {levelConfig.label}
                  </span>
                </div>

                {/* Events - collapsible */}
                {!isCollapsed && country.events.slice(0, 3).map((event, j) => (
                  <a
                    key={j}
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-0.5 hover:bg-[rgba(0,212,255,0.05)] cursor-pointer"
                    style={{ paddingLeft: '18px' }}
                  >
                    <div className="flex items-start gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                        style={{ background: SEVERITY_COLORS[event.severity] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] leading-tight text-[var(--text-primary)] line-clamp-1">
                          {event.title}
                        </p>
                        <span className="text-[9px] text-[var(--text-secondary)]">
                          {event.source} • {timeAgo(event.time)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
