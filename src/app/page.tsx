'use client';

import dynamic from 'next/dynamic';
import MetricsBar from '@/components/panels/MetricsBar';
import ThreatClock from '@/components/panels/ThreatClock';
import NewsFeed from '@/components/panels/NewsFeed';
import OilPanel from '@/components/panels/OilPanel';
import MarketsPanel from '@/components/panels/MarketsPanel';
import ConflictFeed from '@/components/panels/ConflictFeed';
import TelegramPanel from '@/components/panels/TelegramPanel';
import FlightsPanel from '@/components/panels/FlightsPanel';
import StrikesPanel from '@/components/panels/StrikesPanel';
import AlertsPanel from '@/components/panels/AlertsPanel';
import SatellitePanel from '@/components/panels/SatellitePanel';
import NavalPanel from '@/components/panels/NavalPanel';
import RegionalAlertsPanel from '@/components/panels/RegionalAlertsPanel';
import CryptoPanel from '@/components/panels/CryptoPanel';
import PolymarketPanel from '@/components/panels/PolymarketPanel';
import { useState, useEffect } from 'react';

const ConflictMap = dynamic(() => import('@/components/map/ConflictMap'), {
  ssr: false,
  loading: () => <div className="panel h-full loading-shimmer" />,
});

export default function Dashboard() {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border border-[var(--cyan)] opacity-30" />
              <div className="absolute inset-1 rounded-full border border-[var(--cyan)] opacity-20" />
              <div className="absolute inset-2 rounded-full border border-[var(--cyan)] opacity-10" />
              <div
                className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-[var(--cyan)] origin-bottom radar-sweep"
                style={{ transform: 'translateX(-50%)', top: '0px' }}
              />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[var(--cyan)] rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[3px] text-[var(--cyan)]">IRONSIGHT</h1>
              <p className="text-[8px] text-[var(--text-secondary)] tracking-[2px]">
                OSINT COMMAND CENTER // UNCLASSIFIED
              </p>
            </div>
          </div>
          <MetricsBar />
          <div className="flex items-center gap-4 text-[9px] text-[var(--text-secondary)]">
            <span>SESSION {formatUptime(uptime)}</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
        <div className="border-t border-[var(--border-color)]">
          <ThreatClock />
        </div>
      </header>

      {/* Main grid - 3 rows */}
      <main className="flex-1 grid grid-cols-12 gap-1 p-1 overflow-hidden"
        style={{ gridTemplateRows: '2fr 1.5fr 1.5fr' }}
      >
        {/* === ROW 1: Map center, News left, Alerts + Markets right === */}
        <div className="col-span-3 min-h-0">
          <NewsFeed />
        </div>
        <div className="col-span-4 min-h-0">
          <ConflictMap className="h-full" />
        </div>
        <div className="col-span-2 min-h-0">
          <AlertsPanel />
        </div>
        <div className="col-span-3 min-h-0 flex flex-col gap-1">
          <div className="flex-1 min-h-0">
            <TelegramPanel />
          </div>
        </div>

        {/* === ROW 2: Markets, Strikes, Polymarket, Conflicts, Flights === */}
        <div className="col-span-3 min-h-0">
          <MarketsPanel />
        </div>
        <div className="col-span-3 min-h-0">
          <StrikesPanel />
        </div>
        <div className="col-span-2 min-h-0">
          <PolymarketPanel />
        </div>
        <div className="col-span-2 min-h-0">
          <ConflictFeed />
        </div>
        <div className="col-span-2 min-h-0">
          <FlightsPanel />
        </div>

        {/* === ROW 3: Regional Alerts, Naval, Crypto, Energy, Satellite === */}
        <div className="col-span-3 min-h-0">
          <RegionalAlertsPanel />
        </div>
        <div className="col-span-3 min-h-0">
          <NavalPanel />
        </div>
        <div className="col-span-2 min-h-0">
          <CryptoPanel />
        </div>
        <div className="col-span-2 min-h-0">
          <OilPanel />
        </div>
        <div className="col-span-2 min-h-0">
          <SatellitePanel />
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-1 flex items-center justify-between text-[9px] text-[var(--text-secondary)] shrink-0">
        <span>FEEDS: NEWS | GDELT | TELEGRAM | OPENSKY | OCHA | YAHOO FIN | PIKUD HAOREF | NASA FIRMS | ADSB.LOL</span>
        <div className="flex items-center gap-4">
          <span>ALERTS: 5s | NEWS: 2m | MARKETS: 5m</span>
          <span>ALL DATA: PUBLIC / OSINT</span>
          <span>CLASSIFICATION: UNCLASSIFIED // FOUO</span>
        </div>
      </footer>
    </div>
  );
}
