import { NextResponse } from 'next/server';

import { fetchWithTimeout } from '@/lib/fetcher';
import { translateHebrew, translateCities } from '@/lib/hebrew';

export const dynamic = 'force-dynamic';

// Israeli Home Front Command (Pikud HaOref) alerts via Tzeva Adom API
// Returns real-time rocket/missile/drone alerts sent to Israeli civilians
// Empty array = no active alerts (which is good)
export async function GET() {
  const alerts: AlertEvent[] = [];

  // Source 1: Tzeva Adom API - mirrors Pikud HaOref real-time alerts
  try {
    const res = await fetchWithTimeout('https://api.tzevaadom.co.il/notifications', {
      timeout: 8000,
      headers: {
        'User-Agent': 'IronSight/1.0',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((alert: TzevaAdomAlert, i: number) => {
          const rawThreat = alert.threat || alert.title || 'Alert';
          const rawCities = Array.isArray(alert.cities) ? alert.cities : [alert.data || 'Unknown'];

          alerts.push({
            id: `tzeva-${i}-${Date.now()}`,
            time: alert.date || new Date().toISOString(),
            type: categorizeAlert(rawThreat),
            threat: translateHebrew(rawThreat),
            threatOriginal: rawThreat,
            locations: translateCities(rawCities),
            locationsOriginal: rawCities,
            source: 'Pikud HaOref',
            active: true,
          });
        });
      }
    }
  } catch (err) {
    console.error('Tzeva Adom fetch error:', err);
  }

  // If no active alerts, get recent history from the notifications endpoint
  // The API returns [] when there are no active alerts
  const status = alerts.length > 0 ? 'ACTIVE' : 'CLEAR';

  return NextResponse.json({
    status,
    activeCount: alerts.length,
    alerts,
    lastChecked: new Date().toISOString(),
    source: 'Pikud HaOref / Tzeva Adom',
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3' }, // Check every 5 seconds
  });
}

interface TzevaAdomAlert {
  date?: string;
  title?: string;
  data?: string;
  threat?: string;
  cities?: string[];
}

interface AlertEvent {
  id: string;
  time: string;
  type: string;
  threat: string;
  threatOriginal: string;
  locations: string[];
  locationsOriginal: string[];
  source: string;
  active: boolean;
}

function categorizeAlert(threat: string): string {
  const t = threat.toLowerCase();
  if (t.includes('missile') || t.includes('טיל') || t.includes('ballistic')) return 'MISSILE';
  if (t.includes('rocket') || t.includes('רקט')) return 'ROCKET';
  if (t.includes('drone') || t.includes('uav') || t.includes('כטב') || t.includes('hostile aircraft')) return 'DRONE';
  if (t.includes('mortar')) return 'MORTAR';
  if (t.includes('infiltration') || t.includes('חדיר')) return 'INFILTRATION';
  if (t.includes('earthquake') || t.includes('רעידת')) return 'EARTHQUAKE';
  if (t.includes('tsunami')) return 'TSUNAMI';
  if (t.includes('chemical') || t.includes('hazmat')) return 'HAZMAT';
  return 'ALERT';
}
