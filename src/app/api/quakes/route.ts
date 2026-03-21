import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';
import type { SeismicEvent } from '@/types';

export const dynamic = 'force-dynamic';

// USGS Earthquake API - completely free, no key needed
// Large explosions can register as seismic events
export async function GET() {
  try {
    // Get significant earthquakes and events in the Middle East region
    const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=20&maxlatitude=45&minlongitude=25&maxlongitude=70&minmagnitude=2.5&orderby=time&limit=50';

    const res = await fetchWithTimeout(url, { timeout: 10000 });
    if (!res.ok) throw new Error('USGS API failed');

    const data = await res.json();

    const events: SeismicEvent[] = data.features.map((f: { id: string; properties: { mag: number; place: string; time: number; type: string }; geometry: { coordinates: number[] } }) => ({
      id: f.id,
      magnitude: f.properties.mag,
      location: f.properties.place,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      time: new Date(f.properties.time).toISOString(),
      type: f.properties.type,
    }));

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
