import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetcher';
import { translateFreeText } from '@/lib/hebrew';
import { getConflictFromRequest } from '@/lib/conflicts';

export const dynamic = 'force-dynamic';

// Real-time drone / missile track tracker.
// Provider: Neptun (neptun.in.ua) — free public JSON, no API key.
// Each track carries a threat_type (shahed, recon, missile...), live position,
// heading, a movement trail, and a confidence score. Ukrainian text is
// translated to English (cached).

interface Drone {
  id: string;
  type: string;      // raw threat_type
  label: string;     // display label, e.g. "Shahed Drone"
  color: string;
  lat: number;
  lng: number;
  heading: number;   // degrees
  count: number;
  place: string;     // translated destination/place
  text: string;      // translated description
  time: string;
  confidence: number; // 0-100
  trail: [number, number][];
}

// Classify a track into a display label + color. Neptun's threat_type is coarse
// (only "shahed" / "raketa"), so we also inspect the original Ukrainian text
// (e.g. "Керована авіабомба" = guided aerial bomb / KAB).
function threatMeta(type: string, text: string): { label: string; color: string } {
  const s = `${type || ''} ${text || ''}`.toLowerCase();
  if (/shahed|бпла|дрон|\buav\b|герань|geran/.test(s)) return { label: 'Shahed Drone', color: '#ff3366' };
  if (/розвід|развед|rozved|recon/.test(s)) return { label: 'Recon UAV', color: '#ff9900' };
  if (/баліст|балист|balist|iskander|іскандер|кинжал|кинджал|kinzhal/.test(s)) return { label: 'Ballistic Missile', color: '#ff33cc' };
  if (/авіабомб|авиабомб|керована авіа|guided.*bomb|\bkab\b|\bкаб\b/.test(s)) return { label: 'Guided Bomb (KAB)', color: '#ffaa00' };
  if (/крилат|крылат|cruise|калібр|калибр|kalibr|раке|raket|missile|ракет|kh-?\d|х-?\d/.test(s)) return { label: 'Cruise Missile', color: '#ff0044' };
  if (/зліт|взлет|пуск|launch|takeoff|міг|\bmig\b|ту-?95|tu-?95/.test(s)) return { label: 'Launch / Takeoff', color: '#ffcc00' };
  return { label: 'Air Threat', color: '#ff6600' };
}

// Translation cache — Ukrainian place/text strings repeat across polls.
const trCache: Record<string, string> = {};
async function tr(text: string): Promise<string> {
  if (!text) return '';
  if (trCache[text]) return trCache[text];
  // Only hit the translator for Cyrillic text
  if (!/[Ѐ-ӿ]/.test(text)) return text;
  try {
    const out = await translateFreeText(text);
    // Only cache genuine translations — never cache a failure (returns input),
    // so a cold-start timeout retries on the next poll instead of sticking.
    if (out && out !== text) {
      trCache[text] = out;
      return out;
    }
    return text;
  } catch {
    return text;
  }
}

interface NeptunMarker {
  id?: string;
  track_id?: string;
  lat?: number;
  lng?: number;
  threat_type?: string;
  place?: string;
  region?: string;
  text?: string;
  date?: string;
  count?: number;
  course_bearing?: number;
  confidence_0_100?: number;
  positions?: { lat: number; lng: number }[];
}

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);

  // No drone source for this theater — return empty (panel/layer stays quiet)
  if (server.droneProvider !== 'neptun') {
    return NextResponse.json({ drones: [], count: 0, ballisticThreat: false, source: null, updated: new Date().toISOString() });
  }

  try {
    const res = await fetchWithTimeout('https://neptun.in.ua/api/data', {
      timeout: 10000,
      headers: { 'User-Agent': 'IronSight/1.0', 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Neptun HTTP ${res.status}`);
    const data = await res.json();
    const markers: NeptunMarker[] = Array.isArray(data?.markers) ? data.markers
      : Array.isArray(data?.tracks) ? data.tracks : [];

    const drones: Drone[] = await Promise.all(
      markers
        .filter(m => typeof m.lat === 'number' && typeof m.lng === 'number')
        .map(async (m): Promise<Drone> => {
          const meta = threatMeta(m.threat_type || '', m.text || '');
          const [place, text] = await Promise.all([tr(m.place || ''), tr(m.text || '')]);
          const trail: [number, number][] = Array.isArray(m.positions)
            ? m.positions.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
                .slice(-20).map(p => [p.lat, p.lng] as [number, number])
            : [];
          return {
            id: m.id || m.track_id || `${m.lat},${m.lng}`,
            type: m.threat_type || '',
            label: meta.label,
            color: meta.color,
            lat: m.lat as number,
            lng: m.lng as number,
            heading: typeof m.course_bearing === 'number' ? m.course_bearing : 0,
            count: typeof m.count === 'number' ? m.count : 1,
            place,
            text,
            time: m.date || new Date().toISOString(),
            confidence: typeof m.confidence_0_100 === 'number' ? m.confidence_0_100 : 0,
            trail,
          };
        })
    );

    return NextResponse.json({
      drones,
      count: drones.length,
      ballisticThreat: !!data?.ballistic_threat,
      source: 'Neptun',
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
    });
  } catch (err) {
    console.error('Neptun drone fetch error:', err);
    return NextResponse.json({ drones: [], count: 0, ballisticThreat: false, source: 'Neptun', error: 'fetch failed', updated: new Date().toISOString() }, { status: 200 });
  }
}
