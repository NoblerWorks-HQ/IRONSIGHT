import { NextResponse } from 'next/server';

import { getConflictFromRequest } from '@/lib/conflicts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  try {
    // Curated known naval positions from public OSINT / Navy reports.
    // No live AIS feed — warships routinely disable AIS in conflict zones.
    const now = new Date().toISOString();
    const ships: NavalVessel[] = server.ships.map(s => ({ ...s, lastReported: now }));
    const regions = server.shipRegions.map(name => ({ name }));

    return NextResponse.json({
      regions,
      totalTracked: ships.length,
      ships,
      source: 'OSINT / Public Naval Reports',
      updated: now,
      note: 'Positions approximate - based on last known public reports',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('Naval tracking error:', err);
    return NextResponse.json({ totalTracked: 0, ships: [], updated: new Date().toISOString() }, { status: 200 });
  }
}

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
