import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

// NASA FIRMS (Fire Information for Resource Management System)
// Detects thermal anomalies from satellites - includes fires AND large explosions
// Free, no API key needed for the open data CSV
export async function GET() {
  try {
    // Download global 24h fire data and filter to Middle East region
    const url = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv';

    const res = await fetchWithTimeout(url, { timeout: 30000 });
    if (!res.ok) throw new Error('FIRMS data download failed');

    const text = await res.text();
    const lines = text.split('\n');
    const header = lines[0].split(',');

    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    const brightIdx = header.indexOf('bright_ti4');
    const dateIdx = header.indexOf('acq_date');
    const timeIdx = header.indexOf('acq_time');
    const confIdx = header.indexOf('confidence');
    const frpIdx = header.indexOf('frp'); // Fire Radiative Power - higher = bigger
    const dayIdx = header.indexOf('daynight');

    // Filter to Middle East bounding box: lat 20-42, lon 25-65
    const events = lines.slice(1)
      .map(line => {
        const cols = line.split(',');
        if (cols.length < header.length) return null;

        const lat = parseFloat(cols[latIdx]);
        const lon = parseFloat(cols[lonIdx]);

        // Middle East filter
        if (lat < 20 || lat > 42 || lon < 25 || lon > 65) return null;

        const brightness = parseFloat(cols[brightIdx]);
        const frp = parseFloat(cols[frpIdx]);
        const confidence = cols[confIdx];
        const date = cols[dateIdx];
        const time = cols[timeIdx];

        // Classify intensity
        let intensity: 'low' | 'medium' | 'high' | 'extreme' = 'low';
        if (frp > 100 || brightness > 400) intensity = 'extreme';
        else if (frp > 50 || brightness > 350) intensity = 'high';
        else if (frp > 20 || brightness > 320) intensity = 'medium';

        return {
          lat,
          lon,
          brightness: Math.round(brightness * 10) / 10,
          frp: Math.round(frp * 10) / 10,
          confidence,
          intensity,
          datetime: `${date}T${time.substring(0, 2)}:${time.substring(2, 4)}:00Z`,
          daynight: cols[dayIdx],
          // Flag potential non-fire events (very high FRP at night in non-forest areas could be explosions)
          possibleExplosion: frp > 80 && brightness > 380,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.frp || 0) - (a!.frp || 0))
      .slice(0, 100);

    // Summary stats
    const total = events.length;
    const highIntensity = events.filter(e => e!.intensity === 'high' || e!.intensity === 'extreme').length;
    const possibleExplosions = events.filter(e => e!.possibleExplosion).length;

    return NextResponse.json({
      total,
      highIntensity,
      possibleExplosions,
      events,
      source: 'NASA FIRMS VIIRS',
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('FIRMS fetch error:', err);
    return NextResponse.json({
      total: 0,
      highIntensity: 0,
      possibleExplosions: 0,
      events: [],
      source: 'NASA FIRMS VIIRS',
      error: 'Failed to fetch satellite data',
    }, { status: 200 });
  }
}
